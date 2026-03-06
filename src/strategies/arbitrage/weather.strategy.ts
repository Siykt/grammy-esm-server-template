/**
 * 天气预报套利策略
 *
 * 核心逻辑：
 * 1. 从 Weather Underground 获取温度预报
 * 2. 基于历史偏差计算每个温度区间的"真实"概率
 * 3. 与 Polymarket 价格对比，找出正 EV（期望值）的区间
 * 4. 买入被低估的区间
 *
 * 策略特点：
 * - Polymarket 天气市场以 WU KLGA 站点数据结算
 * - 市场分为 9 个区间，每个区间 2°F（如 40-41°F），尾部开放
 * - 预报通常提前 1-10 天，提前天数越少预报越准
 */

import type { GammaEvent, PMClientService } from '../../services/pm/client.service.js'
import type { TemperatureBucket } from '../../services/wu/wu.types.js'
import type { StrategyConfig, TradeResult } from '../base/strategy.interface.js'
import { Side as ClobSide } from '@polymarket/clob-client'
import logger from '../../common/logger.js'
import { Opportunity, OpportunityStatus, OpportunityType } from '../../domain/entities/opportunity.entity.js'
import { Side } from '../../domain/value-objects/side.vo.js'
import { WUAccuracyAnalyzer } from '../../services/wu/wu-accuracy.service.js'
import { WU_STATIONS, WUClientService } from '../../services/wu/wu-client.service.js'
import { BaseStrategy } from '../base/strategy.abstract.js'

/** 天气策略配置 */
export interface WeatherStrategyConfig extends StrategyConfig {
  /** 最小 edge 阈值（如 0.05 = 5%） */
  minEdge: number
  /** 最大单次下注金额（美元） */
  maxBetSize: number
  /** 最低 YES 价格过滤（跳过价格低于此值的市场，避免低流动性虚假 EV） */
  minYesPrice: number
  /** 最大 YES 价格过滤（跳过价格高于此值的市场，性价比不高） */
  maxYesPrice: number
  /** 目标日期的 Polymarket event slug 前缀 */
  eventSlugPrefix: string
  /** WU 站点代码 */
  stationCode: string
}

/** 市场价格信息 */
interface MarketOutcomeInfo {
  /** 子市场 condition ID */
  conditionId: string
  /** YES token ID */
  yesTokenId: string
  /** 市场问题（包含温度区间描述） */
  question: string
  /** Gamma API YES 价格（参考价） */
  gammaPrice: number
  /** 最佳 ask 价格 */
  bestAsk: number
  /** 最佳 bid 价格 */
  bestBid: number
  /** 温度区间 */
  bucket: TemperatureBucket
}

/** 天气交易机会 */
interface WeatherOpportunityData {
  /** 目标日期 */
  targetDate: string
  /** WU 预报高温 */
  forecastHigh: number
  /** 模型计算概率 */
  modelProbability: number
  /** 市场 bestAsk 价格 */
  marketPrice: number
  /** Edge = 模型概率 - 市场价格 */
  edge: number
  /** 期望值 = (模型概率 / 市场价格) - 1 */
  expectedValue: number
  /** 温度区间 */
  bucket: TemperatureBucket
  /** 市场信息 */
  market: MarketOutcomeInfo
}

const DEFAULT_CONFIG: WeatherStrategyConfig = {
  enabled: true,
  minEdge: 0.05,
  maxBetSize: 50,
  minYesPrice: 0.03, // 跳过 3¢ 以下的市场（低流动性/虚假高 EV）
  maxYesPrice: 0.95, // 跳过 95¢ 以上的市场（性价比低）
  eventSlugPrefix: 'highest-temperature-in-nyc-on-',
  stationCode: 'KLGA',
}

export class WeatherArbitrageStrategy extends BaseStrategy {
  private wuClient: WUClientService
  private analyzer: WUAccuracyAnalyzer
  private config: WeatherStrategyConfig

  constructor(
    private pmClient?: PMClientService,
    config?: Partial<WeatherStrategyConfig>,
  ) {
    super('weather-arbitrage', 'weather')

    this.config = { ...DEFAULT_CONFIG, ...config }
    this.params = { ...this.config }

    this.wuClient = new WUClientService(WU_STATIONS.KLGA)
    this.analyzer = new WUAccuracyAnalyzer(this.wuClient)
  }

  // ============ 生命周期 ============

  protected override async onStart(): Promise<void> {
    logger.info('[天气策略] 初始化 - 采集历史偏差数据')
    await this.analyzer.collectDeviations()
    await this.analyzer.printSummary()
  }

  // ============ 扫描机会 ============

  async scan(): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = []

    try {
      // 1. 获取 WU 预报
      const forecasts = await this.wuClient.getDailyForecasts()
      if (forecasts.length === 0) {
        logger.warn('[天气策略] 无法获取预报数据')
        return []
      }

      // 2. 查找活跃的天气市场
      const weatherEvents = await this.findWeatherEvents()
      if (weatherEvents.length === 0) {
        logger.debug('[天气策略] 未找到活跃的天气市场')
        return []
      }

      // 3. 逐个市场分析
      for (const event of weatherEvents) {
        const targetDate = this.extractDateFromSlug(event.slug)
        if (!targetDate)
          continue

        // 找到对应日期的预报
        const forecast = forecasts.find(f => f.date === targetDate)
        if (!forecast) {
          logger.debug(`[天气策略] 日期 ${targetDate} 无预报数据`)
          continue
        }

        // 解析市场子区间
        const markets = await this.parseEventMarkets(event)
        if (markets.length === 0)
          continue

        // 计算概率分布
        const buckets = markets.map(m => m.bucket)
        const probabilities = this.analyzer.calculateBucketProbabilities(forecast.highF, buckets)

        // 寻找正 EV 机会
        for (let i = 0; i < markets.length; i++) {
          const market = markets[i] as MarketOutcomeInfo
          const prob = probabilities[i] as TemperatureBucket

          // 跳过低价市场（无流动性，虚假高 EV）
          if (market.bestAsk < this.config.minYesPrice) {
            logger.debug(
              `[天气策略] 跳过低价市场: ${market.bucket.label}`
              + ` bestAsk=${(market.bestAsk * 100).toFixed(1)}¢ < ${(this.config.minYesPrice * 100).toFixed(0)}¢`,
            )
            continue
          }

          // 跳过高价市场（性价比低）
          if (market.bestAsk > this.config.maxYesPrice) {
            continue
          }

          // Edge 计算：模型概率 vs bestAsk（而非 Gamma 参考价）
          const edge = prob.probability - market.bestAsk
          const ev = market.bestAsk > 0
            ? (prob.probability / market.bestAsk) - 1
            : 0

          if (edge >= this.config.minEdge) {
            const oppData: WeatherOpportunityData = {
              targetDate,
              forecastHigh: forecast.highF,
              modelProbability: prob.probability,
              marketPrice: market.bestAsk,
              edge,
              expectedValue: ev,
              bucket: prob,
              market,
            }

            // 计算下注金额（类凯利：edge 越大下注越多）
            const betSize = Math.min(
              this.config.maxBetSize,
              this.config.maxBetSize * edge * 5,
            )

            // 将价格四舍五入到 tick size（0.01）
            const roundedPrice = Math.round(market.bestAsk * 100) / 100
            const size = Math.floor((betSize / roundedPrice) * 100) / 100

            if (size <= 0)
              continue

            const opportunity = new Opportunity(
              `weather_${targetDate}_${market.bucket.label}`,
              OpportunityType.EVENT_ARBITRAGE,
              [{
                marketId: market.conditionId,
                tokenId: market.yesTokenId,
                side: Side.BUY,
                price: roundedPrice,
                size,
              }],
              betSize * ev, // 期望利润
              ev * 100, // 期望利润百分比
              prob.probability, // 置信度 = 模型概率
              OpportunityStatus.PENDING,
              new Date(Date.now() + 5 * 60 * 1000), // 5 分钟过期
              new Date(),
              oppData as unknown as Record<string, unknown>,
            )

            opportunities.push(opportunity)

            logger.info(
              `[天气策略] 发现机会: ${targetDate} ${market.bucket.label}`
              + ` | 预报=${forecast.highF}°F`
              + ` | 模型=${(prob.probability * 100).toFixed(1)}%`
              + ` | bestAsk=${(market.bestAsk * 100).toFixed(1)}¢`
              + ` | Edge=${(edge * 100).toFixed(1)}%`
              + ` | EV=${(ev * 100).toFixed(1)}%`
              + ` | 下注=$${betSize.toFixed(2)}`,
            )
          }
        }
      }
    }
    catch (error) {
      logger.error('[天气策略] 扫描失败', error)
    }

    return opportunities
  }

  // ============ 执行交易 ============

  async execute(opportunity: Opportunity): Promise<TradeResult> {
    if (!this.pmClient) {
      logger.warn('[天气策略] 未配置 PM 客户端，跳过执行')
      return { success: false, trades: [], error: '未配置 PM 客户端' }
    }

    if (opportunity.isExpired) {
      return { success: false, trades: [], error: '机会已过期' }
    }

    const leg = opportunity.legs[0]
    if (!leg) {
      return { success: false, trades: [], error: '无交易腿' }
    }

    const metadata = opportunity.metadata as unknown as WeatherOpportunityData

    try {
      opportunity.markExecuting()

      // 1. 查询可用余额
      const { balance: balanceStr } = await this.pmClient.getCollateralBalance()
      const availableBalance = Number.parseFloat(balanceStr)

      if (!Number.isFinite(availableBalance) || availableBalance < 1) {
        opportunity.markFailed()
        return { success: false, trades: [], error: `余额不足: $${balanceStr}` }
      }

      // 2. 检查该 token 已有的挂单，避免重复
      const existingOrders = await this.pmClient.getOpenOrdersByToken(leg.tokenId)
      const existingExposure = existingOrders.reduce((sum, order) => {
        const orderPrice = Number.parseFloat(order.price)
        const orderRemaining = Number.parseFloat(order.original_size) - Number.parseFloat(order.size_matched)
        return sum + (orderPrice * orderRemaining)
      }, 0)

      if (existingOrders.length > 0) {
        logger.info(
          `[天气策略] 该 token 已有 ${existingOrders.length} 个挂单，已占用 $${existingExposure.toFixed(2)}`,
        )
      }

      // 3. 计算可用预算
      const maxBudget = Math.min(availableBalance, this.config.maxBetSize)
      const availableBudget = maxBudget - existingExposure

      if (availableBudget < 1) {
        opportunity.markFailed()
        return {
          success: false,
          trades: [],
          error: `预算不足: 可用 $${availableBudget.toFixed(2)} (余额 $${availableBalance.toFixed(2)}, 已挂单 $${existingExposure.toFixed(2)})`,
        }
      }

      // 4. VWAP 验证：获取订单簿并计算深度加权价格
      const orderBook = await this.pmClient.getOrderBook(leg.tokenId)
      const preliminarySize = Math.min(leg.size, Math.floor((availableBudget / leg.price) * 100) / 100)

      const vwap = this.calculateVwap(orderBook.asks, preliminarySize)

      if (vwap === null) {
        opportunity.markFailed()
        logger.info(
          `[天气策略] 订单簿流动性不足: ${metadata.bucket.label}, 目标数量=${preliminarySize}`,
        )
        return {
          success: false,
          trades: [],
          error: `订单簿流动性不足，无法满足目标数量 ${preliminarySize} 的 80%`,
        }
      }

      // 5. 用 VWAP 重新验证 edge
      const adjustedEdge = metadata.modelProbability - vwap

      logger.debug(
        `[天气策略] VWAP=${vwap.toFixed(4)} (scan价格=${leg.price.toFixed(4)})`
        + ` | 调整后Edge=${(adjustedEdge * 100).toFixed(2)}%`
        + ` (原始=${(metadata.edge * 100).toFixed(2)}%)`,
      )

      if (adjustedEdge < this.config.minEdge) {
        opportunity.markFailed()
        logger.info(
          `[天气策略] VWAP 调整后 edge 不足: ${(adjustedEdge * 100).toFixed(2)}% < ${(this.config.minEdge * 100).toFixed(2)}%`,
        )
        return {
          success: false,
          trades: [],
          error: `VWAP 调整后 edge ${(adjustedEdge * 100).toFixed(2)}% 低于阈值`,
        }
      }

      // 6. 用 VWAP 价格下单（四舍五入到 tick size 0.01）
      const vwapPrice = Math.round(vwap * 100) / 100

      if (vwapPrice < 0.01 || vwapPrice > 0.99) {
        opportunity.markFailed()
        return { success: false, trades: [], error: `VWAP 价格超出范围: ${vwapPrice}` }
      }

      // 基于 VWAP 价格重新计算最终数量
      const maxSizeByVwap = Math.floor((availableBudget / vwapPrice) * 100) / 100
      const finalSize = Math.min(leg.size, maxSizeByVwap)

      if (!Number.isFinite(finalSize) || finalSize <= 0) {
        opportunity.markFailed()
        return { success: false, trades: [], error: `VWAP 价格下数量无效: ${finalSize}` }
      }

      logger.info(
        `[天气策略] 执行: 买入 ${metadata.bucket.label}`
        + ` @ $${vwapPrice.toFixed(2)} (VWAP) x ${finalSize} 股`
        + ` | 原始价=$${leg.price.toFixed(2)}`
        + ` | edge=${(adjustedEdge * 100).toFixed(1)}%`
        + ` | 预算=$${availableBudget.toFixed(2)}`,
      )

      const result = await this.pmClient.createLimitOrder({
        tokenId: leg.tokenId,
        side: ClobSide.BUY,
        price: vwapPrice,
        size: finalSize,
      })

      if (result.success) {
        opportunity.markExecuted()
        this._stats.opportunitiesExecuted++

        const trade = this.createTrade({
          orderId: result.orderId ?? '',
          marketId: leg.marketId,
          tokenId: leg.tokenId,
          side: 'BUY',
          price: vwapPrice,
          size: finalSize,
          outcome: metadata.bucket.label,
        })

        return {
          success: true,
          trades: [trade],
          totalProfit: opportunity.expectedProfit,
        }
      }
      else {
        opportunity.markFailed()
        return {
          success: false,
          trades: [],
          error: result.errorMsg ?? '下单失败',
        }
      }
    }
    catch (error) {
      opportunity.markFailed()
      logger.error('[天气策略] 执行失败', error)
      return {
        success: false,
        trades: [],
        error: error instanceof Error ? error.message : '未知错误',
      }
    }
  }

  // ============ 辅助方法 ============

  /**
   * 计算成交量加权平均价格 (VWAP)
   * 遍历 ask 层级，累计 cost 和 filled 数量
   * @param asks 按价格升序排列的卖单
   * @param targetSize 目标买入数量
   * @returns VWAP 价格，流动性不足时返回 null
   */
  private calculateVwap(asks: Array<{ price: string, size: string }>, targetSize: number): number | null {
    if (asks.length === 0)
      return null

    let totalCost = 0
    let totalFilled = 0

    for (const ask of asks) {
      const askPrice = Number.parseFloat(ask.price)
      const askSize = Number.parseFloat(ask.size)
      if (!Number.isFinite(askPrice) || !Number.isFinite(askSize))
        continue

      const fillQty = Math.min(askSize, targetSize - totalFilled)
      totalCost += askPrice * fillQty
      totalFilled += fillQty

      if (totalFilled >= targetSize)
        break
    }

    // 如果可填充量 < 目标的 80%，视为流动性不足
    if (totalFilled < targetSize * 0.8) {
      return null
    }

    return totalCost / totalFilled
  }

  /**
   * 查找活跃的天气市场事件
   * 使用 pagination 端点 + tag_slug=weather 过滤
   */
  private async findWeatherEvents(): Promise<GammaEvent[]> {
    if (!this.pmClient) {
      logger.warn('[天气策略] 未配置 PM 客户端')
      return []
    }

    const events = await this.pmClient.getEventsPaginated({
      tag_slug: 'weather',
      closed: false,
    })

    const filteredEvents = events.filter(e =>
      e.slug.startsWith(this.config.eventSlugPrefix),
    )

    logger.debug(`[天气策略] 天气事件: ${events.length} 个, NYC温度: ${filteredEvents.length} 个`)
    return filteredEvents
  }

  /**
   * 解析事件中的子市场为带温度区间的市场信息
   */
  private async parseEventMarkets(event: GammaEvent): Promise<MarketOutcomeInfo[]> {
    const result: MarketOutcomeInfo[] = []

    for (const market of event.markets) {
      try {
        const bucket = this.parseBucketFromQuestion(market.question)
        const yesTokenId = JSON.parse(market.clobTokenIds)[0]
        if (!yesTokenId)
          continue

        // Gamma API 参考价
        const prices = market.outcomePrices ? JSON.parse(market.outcomePrices) as string[] : []
        const gammaPrice = prices[0] ? Number.parseFloat(prices[0]) : 0

        // 获取 orderbook 实时价格
        let bestAsk = gammaPrice
        let bestBid = 0
        if (this.pmClient) {
          try {
            const spread = await this.pmClient.getSpread(yesTokenId)
            if (spread.ask)
              bestAsk = spread.ask
            if (spread.bid)
              bestBid = spread.bid
          }
          catch {
            // 使用 Gamma 价格作为后备
          }
        }

        result.push({
          conditionId: market.conditionId,
          yesTokenId,
          question: market.question,
          gammaPrice,
          bestAsk,
          bestBid,
          bucket,
        })
      }
      catch (error) {
        logger.debug(`[天气策略] 跳过市场 ${market.question}: ${error}`)
      }
    }

    return result
  }

  /**
   * 从市场问题中解析温度区间
   */
  private parseBucketFromQuestion(question: string): TemperatureBucket {
    return WUAccuracyAnalyzer.parseBucketFromLabel(question)
  }

  /**
   * 从 event slug 提取目标日期
   * 例如 "highest-temperature-in-nyc-on-february-27-2026" → "2026-02-27"
   */
  private extractDateFromSlug(slug: string): string | null {
    const match = slug.match(/on-(\w+)-(\d+)-(\d{4})$/)
    if (!match)
      return null

    const months: Record<string, string> = {
      january: '01',
      february: '02',
      march: '03',
      april: '04',
      may: '05',
      june: '06',
      july: '07',
      august: '08',
      september: '09',
      october: '10',
      november: '11',
      december: '12',
    }

    const month = months[match[1]?.toLowerCase() ?? '']
    if (!month)
      return null

    const day = match[2]?.padStart(2, '0') ?? ''
    return `${match[3]}-${month}-${day}`
  }

  // ============ 公开的分析方法（可用于 dry-run） ============

  /**
   * 获取所有天气交易机会（不执行，仅分析）
   */
  async getValueOpportunities(): Promise<WeatherOpportunityData[]> {
    const opportunities = await this.scan()
    return opportunities.map(o => o.metadata as unknown as WeatherOpportunityData)
  }

  /** 获取 WU 客户端（用于调试） */
  getWUClient(): WUClientService {
    return this.wuClient
  }

  /** 获取准确率分析器（用于调试） */
  getAnalyzer(): WUAccuracyAnalyzer {
    return this.analyzer
  }

  /** 手动刷新偏差数据 */
  async refreshDeviations(): Promise<void> {
    await this.analyzer.collectDeviations()
  }
}

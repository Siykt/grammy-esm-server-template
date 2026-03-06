/**
 * 天气预报套利策略
 *
 * 核心逻辑：
 * 1. 从 Weather Underground 获取温度预报
 * 2. 基于历史偏差计算每个温度区间的"真实"概率
 * 3. 与 Polymarket 价格对比，找出正 EV（期望值）的区间
 * 4. 买入被低估的 YES 或 NO
 *
 * 策略特点：
 * - Polymarket 天气市场以 WU KLGA 站点数据结算
 * - 市场分为 9 个区间，每个区间 2°F（如 40-41°F），尾部开放
 * - 同时扫描 YES 和 NO 两侧机会
 */

import type { GammaEvent, PMClientService } from '../../services/pm/client.service.js'
import type { TemperatureBucket } from '../../services/wu/wu.types.js'
import type { StrategyConfig, TradeResult } from '../base/strategy.interface.js'
import { Side as ClobSide } from '@polymarket/clob-client'
import logger from '../../common/logger.js'
import { prisma } from '../../common/prisma.js'
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
  /** 最低价格过滤（跳过 bestAsk 低于此值的市场，避免低流动性虚假 EV） */
  minPrice: number
  /** 最高价格过滤（跳过 bestAsk 高于此值的市场） */
  maxPrice: number
  /** 目标日期的 Polymarket event slug 前缀 */
  eventSlugPrefix: string
  /** WU 站点代码 */
  stationCode: string
  /** 凯利比例（0.25 = 1/4 Kelly，降低模型不确定性下的风险） */
  kellyFraction: number
  /** 最小单笔下注金额（美元），避免过小订单 */
  minBetSize: number
  /** 最小偏差样本量，低于此值不扫描（避免虚假 edge） */
  minSampleSize: number
  /** 每日最大投入金额（美元），超过则熔断不再下单 */
  maxDailyLoss: number
}

/** 市场价格信息（包含 YES 和 NO 两侧） */
interface MarketOutcomeInfo {
  /** 子市场 condition ID */
  conditionId: string
  /** YES token ID */
  yesTokenId: string
  /** NO token ID */
  noTokenId: string
  /** 市场问题（包含温度区间描述） */
  question: string
  /** Gamma API YES 参考价 */
  gammaYesPrice: number
  /** YES 最佳 ask 价格 */
  yesBestAsk: number
  /** YES 最佳 bid 价格 */
  yesBestBid: number
  /** NO 最佳 ask 价格 */
  noBestAsk: number
  /** NO 最佳 bid 价格 */
  noBestBid: number
  /** 温度区间 */
  bucket: TemperatureBucket
}

/** 天气交易机会 */
interface WeatherOpportunityData {
  /** 目标日期 */
  targetDate: string
  /** WU 预报高温 */
  forecastHigh: number
  /** 交易方向 YES / NO */
  outcome: 'YES' | 'NO'
  /** 模型计算概率（YES: bucket 概率, NO: 1 - bucket 概率） */
  fairProbability: number
  /** 市场 bestAsk 价格（对应方向的买入价） */
  marketPrice: number
  /** Edge = fairProbability - marketPrice */
  edge: number
  /** 期望值 = (fairProbability / marketPrice) - 1 */
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
  minPrice: 0.03, // 跳过 3¢ 以下的市场（低流动性/虚假高 EV）
  maxPrice: 0.95, // 跳过 95¢ 以上的市场
  eventSlugPrefix: 'highest-temperature-in-nyc-on-',
  stationCode: 'KLGA',
  kellyFraction: 0.25, // 1/4 Kelly
  minBetSize: 2,
  minSampleSize: 15,
  maxDailyLoss: 50,
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
    logger.info('[天气策略] 初始化 - 回填历史观测并采集偏差数据')
    await this.wuClient.backfillHistory(90)
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

      // 数据新鲜度检查：超过 2 小时未成功抓取则跳过本次扫描
      if (this.wuClient.isForecastStale()) {
        logger.warn(
          '[天气策略] 预报数据已过期（超过 2 小时未成功抓取），跳过本次扫描。'
          + ` 连续失败次数: ${this.wuClient.getConsecutiveFailures()}`,
        )
        return []
      }

      // 2. 最小样本量守门
      const deviationCount = this.analyzer.getDeviations().length
      if (deviationCount < this.config.minSampleSize) {
        logger.warn(
          `[天气策略] 偏差样本量不足: ${deviationCount} < ${this.config.minSampleSize}，跳过本次扫描`,
        )
        return []
      }

      // 3. 查找活跃的天气市场
      const weatherEvents = await this.findWeatherEvents()
      if (weatherEvents.length === 0) {
        logger.debug('[天气策略] 未找到活跃的天气市场')
        return []
      }

      // 4. 逐个事件分析
      const todayStr = new Date().toISOString().slice(0, 10)
      for (const event of weatherEvents) {
        const targetDate = this.extractDateFromSlug(event.slug)
        if (!targetDate)
          continue

        const forecast = forecasts.find(f => f.date === targetDate)
        if (!forecast) {
          logger.debug(`[天气策略] 日期 ${targetDate} 无预报数据`)
          continue
        }

        // 解析市场子区间（包含 YES 和 NO 价格）
        const markets = await this.parseEventMarkets(event)
        if (markets.length === 0)
          continue

        // 计算目标日期的 lead days（距今天数），用于分层概率
        const leadDays = Math.max(0, Math.round((new Date(targetDate).getTime() - new Date(todayStr).getTime()) / (24 * 60 * 60 * 1000)))
        const buckets = markets.map(m => m.bucket)
        const probabilities = this.analyzer.calculateBucketProbabilitiesForLeadDays(forecast.highF, buckets, leadDays)

        // 扫描每个 bucket 的 YES 和 NO 两侧
        for (let i = 0; i < markets.length; i++) {
          const market = markets[i] as MarketOutcomeInfo
          const prob = probabilities[i] as TemperatureBucket

          const yesFairProb = prob.probability
          const noFairProb = 1 - prob.probability

          // ---- YES 侧：模型认为该区间概率 > 市场 YES 价格 ----
          const yesOpp = this.evaluateSide(
            'YES',
            yesFairProb,
            market.yesBestAsk,
            market,
            targetDate,
            forecast.highF,
            prob,
          )
          if (yesOpp)
            opportunities.push(yesOpp)

          // ---- NO 侧：模型认为该区间不会发生的概率 > 市场 NO 价格 ----
          const noOpp = this.evaluateSide(
            'NO',
            noFairProb,
            market.noBestAsk,
            market,
            targetDate,
            forecast.highF,
            prob,
          )
          if (noOpp)
            opportunities.push(noOpp)
        }
      }
    }
    catch (error) {
      logger.error('[天气策略] 扫描失败', error)
    }

    return opportunities
  }

  /**
   * 评估单侧（YES 或 NO）是否有机会
   */
  private evaluateSide(
    outcome: 'YES' | 'NO',
    fairProbability: number,
    bestAsk: number,
    market: MarketOutcomeInfo,
    targetDate: string,
    forecastHigh: number,
    prob: TemperatureBucket,
  ): Opportunity | null {
    // 价格过滤
    if (bestAsk < this.config.minPrice || bestAsk > this.config.maxPrice) {
      return null
    }

    const edge = fairProbability - bestAsk
    if (edge < this.config.minEdge) {
      return null
    }

    const ev = (fairProbability / bestAsk) - 1
    const tokenId = outcome === 'YES' ? market.yesTokenId : market.noTokenId
    const label = outcome === 'YES' ? market.bucket.label : `NO ${market.bucket.label}`

    // 凯利下注：f* = edge / (1 - bestAsk)，再乘以 kellyFraction 降杠杆
    const denominator = Math.max(0.01, 1 - bestAsk)
    const kellyBet = this.config.maxBetSize * (edge / denominator) * this.config.kellyFraction
    const betSize = Math.max(
      this.config.minBetSize,
      Math.min(this.config.maxBetSize, kellyBet),
    )
    const roundedPrice = Math.round(bestAsk * 100) / 100
    const size = Math.floor((betSize / roundedPrice) * 100) / 100
    if (size <= 0)
      return null

    const oppData: WeatherOpportunityData = {
      targetDate,
      forecastHigh,
      outcome,
      fairProbability,
      marketPrice: bestAsk,
      edge,
      expectedValue: ev,
      bucket: prob,
      market,
    }

    logger.info(
      `[天气策略] 发现机会: ${targetDate} ${label}`
      + ` | 预报=${forecastHigh}°F`
      + ` | 公平概率=${(fairProbability * 100).toFixed(1)}%`
      + ` | bestAsk=${(bestAsk * 100).toFixed(1)}¢`
      + ` | Edge=${(edge * 100).toFixed(1)}%`
      + ` | EV=${(ev * 100).toFixed(1)}%`
      + ` | 下注=$${betSize.toFixed(2)}`,
    )

    return new Opportunity(
      `weather_${outcome}_${targetDate}_${market.bucket.label}`,
      OpportunityType.EVENT_ARBITRAGE,
      [{
        marketId: market.conditionId,
        tokenId,
        side: Side.BUY,
        price: roundedPrice,
        size,
      }],
      betSize * ev,
      ev * 100,
      fairProbability,
      OpportunityStatus.PENDING,
      new Date(Date.now() + 5 * 60 * 1000),
      new Date(),
      oppData as unknown as Record<string, unknown>,
    )
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
    const label = metadata.outcome === 'YES' ? metadata.bucket.label : `NO ${metadata.bucket.label}`

    // 每日投入熔断：查询当天本策略已成交金额
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const todayTrades = await prisma.trade.findMany({
      where: {
        strategyName: this.name,
        executedAt: { gte: startOfToday },
      },
      select: { price: true, size: true },
    })
    const dailySpent = todayTrades.reduce((sum, t) => sum + t.price * t.size, 0)
    if (dailySpent >= this.config.maxDailyLoss) {
      logger.warn(`[天气策略] 每日投入已达上限: $${dailySpent.toFixed(2)} >= $${this.config.maxDailyLoss}`)
      return {
        success: false,
        trades: [],
        error: `每日投入已达上限 $${dailySpent.toFixed(2)}`,
      }
    }

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
          `[天气策略] 订单簿流动性不足: ${label}, 目标数量=${preliminarySize}`,
        )
        return {
          success: false,
          trades: [],
          error: `订单簿流动性不足，无法满足目标数量 ${preliminarySize} 的 80%`,
        }
      }

      // 5. 用 VWAP 重新验证 edge
      const adjustedEdge = metadata.fairProbability - vwap

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

      // 6. 用 VWAP 价格下单
      const vwapPrice = Math.round(vwap * 100) / 100

      if (vwapPrice < 0.01 || vwapPrice > 0.99) {
        opportunity.markFailed()
        return { success: false, trades: [], error: `VWAP 价格超出范围: ${vwapPrice}` }
      }

      const maxSizeByVwap = Math.floor((availableBudget / vwapPrice) * 100) / 100
      const finalSize = Math.min(leg.size, maxSizeByVwap)

      if (!Number.isFinite(finalSize) || finalSize <= 0) {
        opportunity.markFailed()
        return { success: false, trades: [], error: `VWAP 价格下数量无效: ${finalSize}` }
      }

      logger.info(
        `[天气策略] 执行: 买入 ${metadata.outcome} ${label}`
        + ` @ $${vwapPrice.toFixed(2)} (VWAP) x ${finalSize} 股`
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
          outcome: `${metadata.outcome} ${metadata.bucket.label}`,
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

    if (totalFilled < targetSize * 0.8) {
      return null
    }

    return totalCost / totalFilled
  }

  /**
   * 查找活跃的天气市场事件
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
   * 解析事件中的子市场（包含 YES 和 NO 两侧价格）
   */
  private async parseEventMarkets(event: GammaEvent): Promise<MarketOutcomeInfo[]> {
    const result: MarketOutcomeInfo[] = []

    for (const market of event.markets) {
      try {
        const bucket = this.parseBucketFromQuestion(market.question)
        const tokenIds = JSON.parse(market.clobTokenIds) as string[]
        const yesTokenId = tokenIds[0]
        const noTokenId = tokenIds[1]
        if (!yesTokenId || !noTokenId)
          continue

        // Gamma API YES 参考价
        const prices = market.outcomePrices ? JSON.parse(market.outcomePrices) as string[] : []
        const gammaYesPrice = prices[0] ? Number.parseFloat(prices[0]) : 0

        // 获取 YES 和 NO 的 orderbook 实时价格
        let yesBestAsk = gammaYesPrice
        let yesBestBid = 0
        let noBestAsk = 1 - gammaYesPrice // 默认用 1 - YES 价估算
        let noBestBid = 0

        if (this.pmClient) {
          // 并发获取 YES 和 NO 的 spread
          const [yesSpread, noSpread] = await Promise.allSettled([
            this.pmClient.getSpread(yesTokenId),
            this.pmClient.getSpread(noTokenId),
          ])

          if (yesSpread.status === 'fulfilled') {
            if (yesSpread.value.ask)
              yesBestAsk = yesSpread.value.ask
            if (yesSpread.value.bid)
              yesBestBid = yesSpread.value.bid
          }
          if (noSpread.status === 'fulfilled') {
            if (noSpread.value.ask)
              noBestAsk = noSpread.value.ask
            if (noSpread.value.bid)
              noBestBid = noSpread.value.bid
          }
        }

        result.push({
          conditionId: market.conditionId,
          yesTokenId,
          noTokenId,
          question: market.question,
          gammaYesPrice,
          yesBestAsk,
          yesBestBid,
          noBestAsk,
          noBestBid,
          bucket,
        })
      }
      catch (error) {
        logger.debug(`[天气策略] 跳过市场 ${market.question}: ${error}`)
      }
    }

    return result
  }

  private parseBucketFromQuestion(question: string): TemperatureBucket {
    return WUAccuracyAnalyzer.parseBucketFromLabel(question)
  }

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

  async getValueOpportunities(): Promise<WeatherOpportunityData[]> {
    const opportunities = await this.scan()
    return opportunities.map(o => o.metadata as unknown as WeatherOpportunityData)
  }

  getWUClient(): WUClientService {
    return this.wuClient
  }

  getAnalyzer(): WUAccuracyAnalyzer {
    return this.analyzer
  }

  async refreshDeviations(): Promise<void> {
    await this.analyzer.collectDeviations()
  }
}

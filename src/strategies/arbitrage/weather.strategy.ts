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
  /** 最小 EV 阈值（如 0.05 = 5%） */
  minEdge: number
  /** 最大单次下注金额 */
  maxBetSize: number
  /** 置信度阈值（0-1） */
  confidenceThreshold: number
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
  /** 当前 YES 价格 */
  yesPrice: number
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
  /** 市场价格 */
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
  confidenceThreshold: 0.6,
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
    this.analyzer.printSummary()
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

          const edge = prob.probability - market.yesPrice
          const ev = market.yesPrice > 0
            ? (prob.probability / market.yesPrice) - 1
            : 0

          if (edge >= this.config.minEdge && prob.probability >= this.config.confidenceThreshold) {
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

            // 计算下注金额（简单的 edge 比例）
            const betSize = Math.min(
              this.config.maxBetSize,
              this.config.maxBetSize * edge * 5, // edge越大下注越多
            )

            const opportunity = new Opportunity(
              `weather_${targetDate}_${market.bucket.label}`,
              OpportunityType.EVENT_ARBITRAGE,
              [{
                marketId: market.conditionId,
                tokenId: market.yesTokenId,
                side: Side.BUY,
                price: market.bestAsk,
                size: betSize / market.bestAsk, // 转换为股数
              }],
              betSize * ev, // 期望利润
              ev * 100, // 期望利润百分比
              prob.probability, // 置信度
              OpportunityStatus.PENDING,
              new Date(Date.now() + 5 * 60 * 1000), // 5分钟过期
              new Date(),
              oppData as unknown as Record<string, unknown>,
            )

            opportunities.push(opportunity)

            logger.info(
              `[天气策略] 发现机会: ${targetDate} ${market.bucket.label}`
              + ` | 预报=${forecast.highF}°F`
              + ` | 模型概率=${(prob.probability * 100).toFixed(1)}%`
              + ` | 市场价=${(market.yesPrice * 100).toFixed(1)}¢`
              + ` | Edge=${(edge * 100).toFixed(1)}%`
              + ` | EV=${(ev * 100).toFixed(1)}%`,
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

    const leg = opportunity.legs[0]
    if (!leg) {
      return { success: false, trades: [], error: '无交易腿' }
    }

    const metadata = opportunity.metadata as unknown as WeatherOpportunityData

    try {
      opportunity.markExecuting()

      logger.info(
        `[天气策略] 执行: 买入 ${metadata.bucket.label}`
        + ` @ ${leg.price} x ${leg.size.toFixed(1)} 股`,
      )

      const result = await this.pmClient.createLimitOrder({
        tokenId: leg.tokenId,
        side: ClobSide.BUY,
        price: leg.price,
        size: leg.size,
      })

      if (result.success) {
        opportunity.markExecuted()
        const trade = this.createTrade({
          orderId: result.orderId ?? '',
          marketId: leg.marketId,
          tokenId: leg.tokenId,
          side: 'BUY',
          price: leg.price,
          size: leg.size,
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
   * 查找活跃的天气市场事件
   */
  private async findWeatherEvents(): Promise<GammaEvent[]> {
    if (!this.pmClient) {
      logger.warn('[天气策略] 未配置 PM 客户端')
      return []
    }

    const events = await this.pmClient.getEvents({
      tag: 'Weather',
      active: true,
      closed: false,
    } as Record<string, unknown>)

    return events.filter(e =>
      e.slug.startsWith(this.config.eventSlugPrefix),
    )
  }

  /**
   * 解析事件中的子市场为带温度区间的市场信息
   */
  private async parseEventMarkets(event: GammaEvent): Promise<MarketOutcomeInfo[]> {
    const result: MarketOutcomeInfo[] = []

    for (const market of event.markets) {
      try {
        const bucket = this.parseBucketFromQuestion(market.question)
        const yesTokenId = market.clobTokenIds?.[0]
        if (!yesTokenId)
          continue

        // 解析价格
        const prices = market.outcomePrices ? JSON.parse(market.outcomePrices) as string[] : []
        const yesPrice = prices[0] ? Number.parseFloat(prices[0]) : 0

        // 获取 orderbook 价格（如果有 PM 客户端）
        let bestAsk = yesPrice
        let bestBid = 0
        if (this.pmClient) {
          try {
            const spread = await this.pmClient.getSpread(yesTokenId)
            bestAsk = spread.ask
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
          yesPrice,
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
   * 问题格式示例：
   * - "39°F or below"
   * - "40°F to 41°F"
   * - "54°F or above"
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

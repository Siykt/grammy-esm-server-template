import type { OpportunityLeg } from '../../domain/entities/opportunity.entity.js'
import type { NotificationService } from '../../notifications/notification.service.js'
import type { IRiskManager } from '../../risk/risk-manager.interface.js'
import type { FairProbability, OddsEvent } from '../../services/odds/odds-api.client.js'
import type { GammaSportsSeries, PMClientService } from '../../services/pm/client.service.js'
import type { StrategyConfig, TradeResult } from '../base/strategy.interface.js'
import { Side as ClobSide } from '@polymarket/clob-client'
import logger from '../../common/logger.js'
import { prisma } from '../../common/prisma.js'
import { redis, RedisKeys } from '../../common/redis.js'
import { Market } from '../../domain/entities/market.entity.js'
import { Opportunity, OpportunityStatus, OpportunityType } from '../../domain/entities/opportunity.entity.js'
import { Trade } from '../../domain/entities/trade.entity.js'
import { Price } from '../../domain/value-objects/price.vo.js'
import { Quantity } from '../../domain/value-objects/quantity.vo.js'
import { Side } from '../../domain/value-objects/side.vo.js'
import {
  createNotification,
  NotificationPriority,
  NotificationType,
} from '../../notifications/notification.interface.js'
import { OddsApiClient } from '../../services/odds/odds-api.client.js'
import { BaseStrategy } from '../base/strategy.abstract.js'

/**
 * PM 体育联赛 slug 到 Odds API sport_key 的映射
 * 用于将 PM 的体育联赛匹配到 The Odds API 的体育项目
 * PM slugs 来自 https://gamma-api.polymarket.com/sports
 */
const PM_TO_ODDS_SPORT_MAP: Record<string, string> = {
  // 篮球
  nba: 'basketball_nba',
  ncaab: 'basketball_ncaab',
  wnba: 'basketball_wnba',
  cbb: 'basketball_ncaab', // College Basketball
  // 美式足球
  nfl: 'americanfootball_nfl',
  cfb: 'americanfootball_ncaaf', // College Football
  // 棒球
  mlb: 'baseball_mlb',
  // 冰球
  nhl: 'icehockey_nhl',
  // 足球 (PM 使用缩写)
  epl: 'soccer_epl', // 英超
  lal: 'soccer_spain_la_liga', // 西甲
  bun: 'soccer_germany_bundesliga', // 德甲
  sea: 'soccer_italy_serie_a', // 意甲
  fl1: 'soccer_france_ligue_one', // 法甲
  ucl: 'soccer_uefa_champs_league', // 欧冠
  uel: 'soccer_uefa_europa_league', // 欧联
  mls: 'soccer_usa_mls', // 美国足球大联盟
  ere: 'soccer_netherlands_eredivisie', // 荷甲
  // MMA
  mma: 'mma_mixed_martial_arts',
  // 网球
  atp: 'tennis_atp_us_open', // ATP 巡回赛
  wta: 'tennis_wta_us_open', // WTA 巡回赛
  // 板球
  ipl: 'cricket_ipl',
  t20: 'cricket_icc_world_t20',
  odi: 'cricket_odi',
}

/** 联赛扫描优先级（数值越大越先扫描，优先消耗 API 配额在活跃联赛） */
const ODDS_SPORT_PRIORITY: Record<string, number> = {
  basketball_nba: 10,
  americanfootball_nfl: 10,
  basketball_ncaab: 8,
  americanfootball_ncaaf: 8,
  baseball_mlb: 7,
  icehockey_nhl: 7,
  soccer_epl: 6,
  soccer_uefa_champs_league: 6,
  soccer_spain_la_liga: 5,
  soccer_germany_bundesliga: 5,
  soccer_italy_serie_a: 5,
  mma_mixed_martial_arts: 5,
}

/** 队名别名：规范名 -> 别名列表，用于匹配 PM 与 Odds API 的不同写法 */
const TEAM_ALIASES: Record<string, string[]> = {
  'los angeles lakers': ['la lakers', 'lakers'],
  'los angeles clippers': ['la clippers', 'clippers'],
  'new york knicks': ['ny knicks', 'knicks'],
  'new york rangers': ['ny rangers', 'rangers'],
  'golden state warriors': ['golden state', 'warriors', 'gs warriors'],
  'san antonio spurs': ['san antonio', 'spurs'],
  'oklahoma city thunder': ['okc thunder', 'okc', 'thunder'],
  'tampa bay buccaneers': ['tampa bay', 'bucs', 'buccaneers'],
  'green bay packers': ['green bay', 'packers'],
  'new orleans saints': ['new orleans', 'saints'],
  'las vegas raiders': ['las vegas', 'raiders', 'oakland raiders'],
  'kansas city chiefs': ['kansas city', 'chiefs'],
  'manchester united': ['man utd', 'manchester utd', 'man united'],
  'manchester city': ['man city', 'manchester city'],
  'tottenham hotspur': ['tottenham', 'spurs'],
  'newcastle united': ['newcastle', 'newcastle utd'],
  'west ham united': ['west ham', 'west ham utd'],
  'nottingham forest': ['nottingham', 'forest'],
  'brighton &amp; hove albion': ['brighton', 'brighton and hove albion'],
  'wolverhampton wanderers': ['wolves', 'wolverhampton'],
}

/** PM 市场附带事件开始时间，用于时间窗口匹配 */
interface MarketWithEventTime {
  market: Market
  eventStartTime: string
}

/** 活跃订单追踪信息，用于生命周期管理与过期取消 */
interface ActiveOrderInfo {
  orderId: string
  tokenId: string
  marketId: string
  placedAt: number
  opportunityId: string
  expectedEdge: number
  price: number
  size: number
}

/**
 * Pinnacle 套利策略配置
 */
export interface PinnacleArbitrageConfig extends StrategyConfig {
  /** 支持单个或多个 API key */
  oddsApiKeys: string | string[]
  /** @deprecated 使用 oddsApiKeys 替代 */
  oddsApiKey?: string
  /** 最小边缘阈值（例如 0.02 = 2%） */
  minEdge: number
  /** 排除的体育项目（黑名单模式） - 不指定则扫描所有体育项目 */
  excludedSports?: string[]
  /** @deprecated 使用 excludedSports 替代，旧的白名单配置 */
  sports?: string[]
  /** 市场映射：PM 条件 ID -> 赔率事件映射 */
  marketMappings?: MarketMapping[]
  /** 置信度阈值（0-1） */
  confidenceThreshold: number
  /** 最大仓位金额（美元） */
  maxPositionSize: number
}

/**
 * 市场映射 - 链接 PM 市场到 Odds API 事件
 */
export interface MarketMapping {
  pmConditionId: string
  pmOutcome: 'Yes' | 'No'
  oddsEventId: string
  oddsOutcome: string
  sportKey: string
}

/**
 * Pinnacle 价值机会
 */
export interface PinnacleValueOpportunity {
  pmMarket: Market
  pmOutcome: 'Yes' | 'No'
  /** 当前 PM 价格 */
  pmPrice: number
  /** Pinnacle 公平概率 */
  pinnacleFairProb: number
  /** 边缘 = pinnacle公平概率 - PM价格（买入），或 PM价格 - pinnacle公平概率（卖出） */
  edge: number
  /** 每美元期望值 */
  expectedValue: number
  oddsEvent: OddsEvent
  confidence: number
}

/**
 * Pinnacle 跨市场套利策略
 *
 * 使用 Pinnacle（被认为是"尖子"博彩公司）的公平概率作为参考，
 * 在 Polymarket 上识别价值投注机会。
 *
 * 策略逻辑：
 * 1. 获取配置体育项目的 Pinnacle 赔率
 * 2. 使用乘法归一化计算公平概率
 * 3. 与 Polymarket 价格比较
 * 4. 如果 PM 价格 < Pinnacle 公平概率 - 边缘阈值 → 买入机会
 * 5. 如果 PM 价格 > Pinnacle 公平概率 + 边缘阈值 → 卖出机会
 */
export class PinnacleArbitrageStrategy extends BaseStrategy {
  private readonly pmClient: PMClientService
  private readonly notificationService?: NotificationService
  private readonly riskManager?: IRiskManager
  private oddsClient: OddsApiClient
  private config: PinnacleArbitrageConfig
  private cachedOdds: Map<string, { data: OddsEvent[], timestamp: number }> = new Map()
  /** PM 体育联赛缓存 */
  private cachedPmSports: GammaSportsSeries[] | null = null
  private pmSportsCacheTime = 0
  /** PM 体育联赛缓存有效期（毫秒）- 1小时 */
  private readonly PM_SPORTS_CACHE_TTL_MS = 3600000
  /** 赔率缓存有效期（毫秒）- 1分钟 */
  private readonly CACHE_TTL_MS = 60000
  /** 无赛事体育项目的缓存有效期（毫秒）- 30分钟 */
  private readonly EMPTY_CACHE_TTL_MS = 1800000
  /** Redis 扫描匹配缓存有效期（秒）- 30分钟 */
  private readonly SCAN_MATCH_CACHE_TTL_SEC = 1800
  /** 比赛时间窗口（毫秒）- 用于 Odds 事件与 PM 事件匹配，±2 小时 */
  private readonly EVENT_TIME_WINDOW_MS = 2 * 60 * 60 * 1000
  /** 订单 TTL（毫秒）- 超过此时长未成交则取消，10 分钟 */
  private readonly ORDER_TTL_MS = 10 * 60 * 1000
  /** 活跃订单追踪（orderId -> ActiveOrderInfo） */
  private readonly activeOrders: Map<string, ActiveOrderInfo> = new Map()
  /** 从 DB 聚合的成交笔数与总成本（用于 getStats 真实统计） */
  private _dbStats: { executed: number, totalCost: number } = { executed: 0, totalCost: 0 }

  constructor(
    name: string,
    pmClient: PMClientService,
    config: PinnacleArbitrageConfig,
    notificationService?: NotificationService,
    riskManager?: IRiskManager,
  ) {
    super(name, 'pinnacle_arbitrage')
    this.pmClient = pmClient
    this.notificationService = notificationService
    this.riskManager = riskManager
    this.config = config
    // 兼容旧的 oddsApiKey 配置
    const apiKeys = config.oddsApiKeys || config.oddsApiKey || ''
    this.oddsClient = new OddsApiClient(apiKeys)
    this.updateConfig(config)
  }

  protected override async onStart(): Promise<void> {
    await this.refreshDbStats()
  }

  /**
   * 从 Prisma Trade 表刷新本策略的成交统计
   */
  private async refreshDbStats(): Promise<void> {
    try {
      const trades = await prisma.trade.findMany({
        where: { strategyName: this.name },
      })
      this._dbStats = {
        executed: trades.length,
        totalCost: trades.reduce((sum, t) => sum + t.price * t.size, 0),
      }
    }
    catch (err) {
      logger.warn('[PinnacleArbitrage] 刷新 DB 统计失败', err)
    }
  }

  /**
   * 获取 PM 体育联赛列表（带缓存）
   */
  private async getCachedPmSports(): Promise<GammaSportsSeries[]> {
    const now = Date.now()
    if (this.cachedPmSports && now - this.pmSportsCacheTime < this.PM_SPORTS_CACHE_TTL_MS) {
      return this.cachedPmSports
    }

    try {
      this.cachedPmSports = await this.pmClient.getSports()
      this.pmSportsCacheTime = now
      logger.info(`[PinnacleArbitrage] 获取到 ${this.cachedPmSports.length} 个 PM 体育联赛`)
      return this.cachedPmSports
    }
    catch (error) {
      logger.error('[PinnacleArbitrage] 获取 PM 体育联赛失败', error)
      return this.cachedPmSports || []
    }
  }

  /**
   * 审查活跃订单：已成交写入 Trade，超时未成交则取消
   */
  private async reviewActiveOrders(): Promise<void> {
    const orderIds = Array.from(this.activeOrders.keys())
    for (const orderId of orderIds) {
      const info = this.activeOrders.get(orderId)
      if (!info)
        continue

      try {
        const order = await this.pmClient.getOrder(orderId)
        const status = (order.status ?? '').toLowerCase()
        const originalSize = Number.parseFloat(order.original_size ?? '0')
        const sizeMatched = Number.parseFloat(order.size_matched ?? '0')

        if (status === 'matched' || (originalSize > 0 && sizeMatched >= originalSize)) {
          const filled = sizeMatched || originalSize
          await prisma.trade.create({
            data: {
              orderId: order.id,
              marketId: info.marketId,
              tokenId: info.tokenId,
              side: 'BUY',
              price: info.price,
              size: filled,
              fee: 0,
              status: 'matched',
              outcome: 'Yes',
              strategyName: this.name,
              executedAt: new Date(info.placedAt),
            },
          })
          this._dbStats.executed += 1
          this._dbStats.totalCost += info.price * filled
          this.activeOrders.delete(orderId)
          logger.info(`[PinnacleArbitrage] 订单已完全成交并记录: ${orderId}`)
          continue
        }

        if (status === 'cancelled' || status === 'expired') {
          this.activeOrders.delete(orderId)
          continue
        }

        const age = Date.now() - info.placedAt
        if (age > this.ORDER_TTL_MS) {
          try {
            await this.pmClient.cancelOrder(orderId)
          }
          catch (err) {
            logger.warn(`[PinnacleArbitrage] 取消订单失败: ${orderId}`, err)
          }
          if (sizeMatched > 0) {
            await prisma.trade.create({
              data: {
                orderId: order.id,
                marketId: info.marketId,
                tokenId: info.tokenId,
                side: 'BUY',
                price: info.price,
                size: sizeMatched,
                fee: 0,
                status: 'partially_filled',
                outcome: 'Yes',
                strategyName: this.name,
                executedAt: new Date(info.placedAt),
              },
            })
            this._dbStats.executed += 1
            this._dbStats.totalCost += info.price * sizeMatched
          }
          this.activeOrders.delete(orderId)
          logger.info(`[PinnacleArbitrage] 订单超时已取消: ${orderId}${sizeMatched > 0 ? `，已记录部分成交 ${sizeMatched}` : ''}`)
          if (this.notificationService) {
            await this.notificationService.notify(
              createNotification({
                type: NotificationType.ORDER_CANCELLED,
                priority: NotificationPriority.NORMAL,
                title: 'Order Cancelled',
                message: `Order ${orderId.slice(0, 16)}... cancelled (timeout)`,
                data: { orderId, reason: '超时未成交', strategyName: this.name },
              }),
            )
          }
        }
      }
      catch (err) {
        logger.warn(`[PinnacleArbitrage] 审查订单失败: ${orderId}`, err)
      }
    }
  }

  /**
   * 将 PM 联赛 slug 转换为 Odds API sport_key
   */
  private mapPmToOddsSport(pmSlug: string): string | null {
    // 直接映射
    if (PM_TO_ODDS_SPORT_MAP[pmSlug]) {
      return PM_TO_ODDS_SPORT_MAP[pmSlug]
    }

    // 尝试模糊匹配
    const slugLower = pmSlug.toLowerCase()
    for (const [key, value] of Object.entries(PM_TO_ODDS_SPORT_MAP)) {
      if (slugLower.includes(key) || key.includes(slugLower)) {
        return value
      }
    }

    return null
  }

  /**
   * 扫描价值机会
   * 使用 PM sports API 获取体育联赛，然后匹配 Odds API
   */
  override async scan(): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = []

    try {
      await this.reviewActiveOrders()

      // 获取 PM 体育联赛列表
      const pmSports = await this.getCachedPmSports()
      if (pmSports.length === 0) {
        logger.debug('[PinnacleArbitrage] 无 PM 体育联赛')
        return opportunities
      }

      // 过滤黑名单并找到有 Odds API 映射的联赛
      const excludedSet = new Set(this.config.excludedSports || [])
      const sportsToScan: Array<{ pmSeries: GammaSportsSeries, oddsSportKey: string }> = []

      for (const series of pmSports) {
        const oddsSportKey = this.mapPmToOddsSport(series.sport)
        if (oddsSportKey && !excludedSet.has(oddsSportKey)) {
          sportsToScan.push({ pmSeries: series, oddsSportKey })
        }
      }

      if (sportsToScan.length === 0) {
        logger.debug('[PinnacleArbitrage] 无可映射到 Odds API 的 PM 联赛')
        return opportunities
      }

      // 按联赛优先级排序，优先扫描活跃联赛以节省 API 配额
      sportsToScan.sort((a, b) => (ODDS_SPORT_PRIORITY[b.oddsSportKey] ?? 0) - (ODDS_SPORT_PRIORITY[a.oddsSportKey] ?? 0))

      logger.debug(
        `[PinnacleArbitrage] 找到 ${sportsToScan.length} 个可扫描联赛: ${sportsToScan.map(s => s.pmSeries.sport).join(', ')}`,
      )

      // 扫描每个联赛
      for (const { pmSeries, oddsSportKey } of sportsToScan) {
        const sportOpps = await this.scanPmSeries(pmSeries, oddsSportKey)
        opportunities.push(...sportOpps)
      }

      // 更新统计
      this._stats.opportunitiesFound += opportunities.length
      this._stats.lastRunAt = new Date()

      if (opportunities.length > 0) {
        logger.info(`[PinnacleArbitrage] 发现 ${opportunities.length} 个机会`)
      }

      return opportunities
    }
    catch (error) {
      logger.error('[PinnacleArbitrage] 扫描失败', error)
      return []
    }
  }

  /**
   * 收集所有联赛的「市场-赔率」匹配元组（核心扫描逻辑，供 scan 与 getValueOpportunities 复用）
   */
  private async collectMatchedTuples(): Promise<Array<{ market: Market, fairProbs: FairProbability[], event: OddsEvent, cachedAt: number }>> {
    const pmSports = await this.getCachedPmSports()
    if (pmSports.length === 0)
      return []

    const excludedSet = new Set(this.config.excludedSports || [])
    const sportsToScan: Array<{ pmSeries: GammaSportsSeries, oddsSportKey: string }> = []
    for (const series of pmSports) {
      const oddsSportKey = this.mapPmToOddsSport(series.sport)
      if (oddsSportKey && !excludedSet.has(oddsSportKey))
        sportsToScan.push({ pmSeries: series, oddsSportKey })
    }
    if (sportsToScan.length === 0)
      return []

    sportsToScan.sort((a, b) => (ODDS_SPORT_PRIORITY[b.oddsSportKey] ?? 0) - (ODDS_SPORT_PRIORITY[a.oddsSportKey] ?? 0))

    const allTuples: Array<{ market: Market, fairProbs: FairProbability[], event: OddsEvent, cachedAt: number }> = []
    for (const { pmSeries, oddsSportKey } of sportsToScan) {
      const tuples = await this.collectMatchedTuplesForSport(pmSeries, oddsSportKey)
      allTuples.push(...tuples)
    }
    return allTuples
  }

  /**
   * 收集单个联赛的「市场-赔率」匹配元组
   */
  private async collectMatchedTuplesForSport(
    pmSeries: GammaSportsSeries,
    oddsSportKey: string,
  ): Promise<Array<{ market: Market, fairProbs: FairProbability[], event: OddsEvent, cachedAt: number }>> {
    const tuples: Array<{ market: Market, fairProbs: FairProbability[], event: OddsEvent, cachedAt: number }> = []
    try {
      const pmEvents = await this.pmClient.getSportsEvents(pmSeries.series, true)
      if (pmEvents.length === 0)
        return tuples

      const pmMarketsWithTime: MarketWithEventTime[] = []
      for (const event of pmEvents) {
        if (event.markets) {
          const eventStart = event.startTime ?? ''
          for (const market of event.markets) {
            pmMarketsWithTime.push({ market: Market.fromGamma(market), eventStartTime: eventStart })
          }
        }
      }
      const pmMarkets = pmMarketsWithTime.map(m => m.market)
      if (pmMarkets.length === 0)
        return tuples

      const { data: oddsEvents, timestamp: oddsCachedAt } = await this.getCachedPinnacleOdds(oddsSportKey)
      if (oddsEvents.length === 0)
        return tuples

      logger.debug(
        `[PinnacleArbitrage] [${pmSeries.sport}] PM市场: ${pmMarkets.length}, 赔率事件: ${oddsEvents.length}`,
      )

      const matchCacheKey = RedisKeys.pinnacleScanMatch(oddsSportKey)
      let cachedMatches = new Map<string, string>()
      try {
        const cached = await redis.hgetall(matchCacheKey)
        if (cached && Object.keys(cached).length > 0)
          cachedMatches = new Map(Object.entries(cached))
      }
      catch (err) {
        logger.warn('[PinnacleArbitrage] 读取匹配缓存失败，将重新匹配', err)
      }

      for (const oddsEvent of oddsEvents) {
        const fairProbs = this.oddsClient.getPinnacleFairProbabilities(oddsEvent)
        if (!fairProbs)
          continue

        let matchedMarket: Market | null = null
        const cachedConditionId = cachedMatches.get(oddsEvent.id)
        if (cachedConditionId !== undefined) {
          if (cachedConditionId)
            matchedMarket = pmMarkets.find(m => m.conditionId === cachedConditionId) || null
        }
        else {
          matchedMarket = this.findMatchingPmMarket(oddsEvent, pmMarketsWithTime, oddsSportKey)
          try {
            await redis.hset(matchCacheKey, oddsEvent.id, matchedMarket?.conditionId ?? '')
            await redis.expire(matchCacheKey, this.SCAN_MATCH_CACHE_TTL_SEC)
          }
          catch (err) {
            logger.warn('[PinnacleArbitrage] 写入匹配缓存失败', err)
          }
        }

        if (matchedMarket)
          tuples.push({ market: matchedMarket, fairProbs, event: oddsEvent, cachedAt: oddsCachedAt })
      }
    }
    catch (error) {
      logger.error(`[PinnacleArbitrage] 扫描联赛 ${pmSeries.sport} 失败`, error)
    }
    return tuples
  }

  /**
   * 扫描特定 PM 联赛的机会（转为 Opportunity[]，供 scan 使用）
   */
  private async scanPmSeries(
    pmSeries: GammaSportsSeries,
    oddsSportKey: string,
  ): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = []
    const tuples = await this.collectMatchedTuplesForSport(pmSeries, oddsSportKey)
    for (const { market, fairProbs, event, cachedAt } of tuples) {
      const valueOpp = this.findValueOpportunity(market, fairProbs, event, cachedAt)
      if (valueOpp && valueOpp.edge >= this.config.minEdge && valueOpp.pmPrice > 0) {
        const opportunity = this.createOpportunity(valueOpp)
        if (opportunity) {
          opportunities.push(opportunity)
          if (this.notificationService && valueOpp.edge >= 0.05) {
            await this.notificationService.notifyOpportunity({
              opportunity,
              strategyName: this.name,
              expectedProfit: opportunity.expectedProfit,
              confidence: opportunity.confidence,
            })
          }
        }
      }
    }
    return opportunities
  }

  /**
   * 获取带缓存的 Pinnacle 赔率及缓存时间戳（用于边缘衰减）
   * 对无赛事的体育项目使用更长的缓存时间
   */
  private async getCachedPinnacleOdds(sportKey: string): Promise<{ data: OddsEvent[], timestamp: number }> {
    const cached = this.cachedOdds.get(sportKey)
    const now = Date.now()

    if (cached) {
      const ttl = cached.data.length === 0 ? this.EMPTY_CACHE_TTL_MS : this.CACHE_TTL_MS
      if (now - cached.timestamp < ttl) {
        return { data: cached.data, timestamp: cached.timestamp }
      }
    }

    try {
      const oddsEvents = await this.oddsClient.getPinnacleOdds(sportKey)
      this.cachedOdds.set(sportKey, { data: oddsEvents, timestamp: now })
      return { data: oddsEvents, timestamp: now }
    }
    catch {
      logger.debug(`[PinnacleArbitrage] 获取 ${sportKey} 赔率失败，缓存为空`)
      this.cachedOdds.set(sportKey, { data: [], timestamp: now })
      return { data: [], timestamp: now }
    }
  }

  /**
   * 为赔率事件寻找匹配的 PM 市场（时间窗口 + 队名多维匹配）
   */
  private findMatchingPmMarket(
    event: OddsEvent,
    pmMarketsWithTime: MarketWithEventTime[],
    sportKey?: string,
  ): Market | null {
    const allMarkets = pmMarketsWithTime.map(m => m.market)

    // 首先检查手动映射
    if (this.config.marketMappings) {
      const mapping = this.config.marketMappings.find(m => m.oddsEventId === event.id)
      if (mapping) {
        const market = allMarkets.find(m => m.conditionId === mapping.pmConditionId)
        if (market) {
          logger.debug(
            `[PinnacleArbitrage] [手动映射] ${event.home_team} vs ${event.away_team} -> ${market.question.slice(0, 50)}`,
          )
        }
        return market || null
      }
    }

    // 时间窗口过滤：只考虑 PM 事件开始时间与 Odds 事件 commence_time 相差 ±2 小时内的市场
    const oddsStartMs = new Date(event.commence_time).getTime()
    const timeFiltered = pmMarketsWithTime.filter(({ eventStartTime }) => {
      if (!eventStartTime)
        return true
      const pmStartMs = new Date(eventStartTime).getTime()
      return Math.abs(pmStartMs - oddsStartMs) <= this.EVENT_TIME_WINDOW_MS
    })

    // 通过队伍名称进行模糊匹配（含别名）
    const eventTeams = [event.home_team.toLowerCase(), event.away_team.toLowerCase()]
    const potentialMatches: Array<{ market: Market, score: number, matchedTeam: string }> = []

    for (const { market } of timeFiltered) {
      const marketQuestion = market.question.toLowerCase()

      for (const team of eventTeams) {
        if (marketQuestion.includes(team)) {
          potentialMatches.push({ market, score: 2, matchedTeam: team })
          break
        }
        if (this.fuzzyMatchWithAliases(marketQuestion, team)) {
          potentialMatches.push({ market, score: 1, matchedTeam: team })
          break
        }
      }
    }

    if (potentialMatches.length > 0) {
      logger.debug(
        `[PinnacleArbitrage] [${sportKey ?? 'unknown'}] 事件: ${event.home_team} vs ${event.away_team}`,
      )
      for (const match of potentialMatches) {
        logger.debug(
          `  -> 可能匹配 (分数=${match.score}): ${match.market.question.slice(0, 80)}`,
        )
      }
    }
    else {
      logger.debug(
        `[PinnacleArbitrage] [${sportKey ?? 'unknown'}] 未匹配: ${event.home_team} vs ${event.away_team}`,
      )
    }

    if (potentialMatches.length > 0) {
      potentialMatches.sort((a, b) => b.score - a.score)
      return potentialMatches[0]?.market ?? null
    }

    return null
  }

  /**
   * 队伍名称模糊匹配（支持别名，单词长度 >= 2）
   */
  private fuzzyMatchWithAliases(text: string, teamName: string): boolean {
    const variants = this.getTeamNameVariants(teamName)
    for (const variant of variants) {
      if (text.includes(variant))
        return true
    }
    const parts = teamName.split(' ').filter(p => p.length >= 2)
    return parts.some(part => text.includes(part))
  }

  /**
   * 获取队名及其别名，用于匹配
   */
  private getTeamNameVariants(teamName: string): string[] {
    const lower = teamName.toLowerCase()
    const fromAlias = Object.entries(TEAM_ALIASES).find(
      ([canon, aliases]) => canon === lower || aliases.includes(lower),
    )
    if (fromAlias) {
      const [canon, aliases] = fromAlias
      return [canon, ...aliases]
    }
    return [lower]
  }

  /**
   * 比较 PM 价格与 Pinnacle 公平概率，寻找价值机会
   * @param pmMarket PM 市场
   * @param fairProbs Pinnacle 公平概率
   * @param event Odds API 事件
   * @param cachedAt 赔率缓存时间戳（可选），用于边缘衰减补偿
   */
  private findValueOpportunity(
    pmMarket: Market,
    fairProbs: FairProbability[],
    event: OddsEvent,
    cachedAt?: number,
  ): PinnacleValueOpportunity | null {
    const yesPrice = pmMarket.yesPrice.amount
    const noPrice = pmMarket.noPrice.amount
    const is3Way = fairProbs.length === 3

    // 超额赔率硬截止
    if (fairProbs[0] && fairProbs[0].overround > 6) {
      logger.debug(`[PinnacleArbitrage] 跳过高超额赔率: ${event.home_team} vs ${event.away_team}, ${fairProbs[0].overround.toFixed(2)}%`)
      return null
    }

    // 严格匹配主队概率，不回退
    const homeProb = fairProbs.find(p =>
      p.outcome.toLowerCase().includes(event.home_team.toLowerCase()),
    )
    if (!homeProb) {
      logger.warn(`[PinnacleArbitrage] 无法匹配主队: ${event.home_team}, 赔率结果: ${fairProbs.map(p => p.outcome).join(', ')}`)
      return null
    }

    // 2-way 市场需要严格匹配客队
    const awayProb = fairProbs.find(p =>
      p.outcome.toLowerCase().includes(event.away_team.toLowerCase()),
    )
    if (!is3Way && !awayProb) {
      logger.warn(`[PinnacleArbitrage] 无法匹配客队(2-way): ${event.away_team}, 赔率结果: ${fairProbs.map(p => p.outcome).join(', ')}`)
      return null
    }

    // NO 的公平概率：3-way 用 draw + away 求和（避免 1-homeProb 的归一化误差），2-way 用 awayProb
    let noFairProb: number
    let noOverround: number
    if (is3Way) {
      const drawProb = fairProbs.find(p => p.outcome.toLowerCase() === 'draw')
      const awayFair = awayProb?.fairProbability ?? 0
      const drawFair = drawProb?.fairProbability ?? 0
      noFairProb = awayFair + drawFair
      noOverround = homeProb.overround
    }
    else {
      noFairProb = (awayProb as FairProbability).fairProbability
      noOverround = (awayProb as FairProbability).overround
    }

    logger.debug(
      `[PinnacleArbitrage] [${event.home_team} vs ${event.away_team}] ${is3Way ? '(3-way)' : '(2-way)'} `
      + `YES=${yesPrice}/${homeProb.fairProbability.toFixed(4)} NO=${noPrice}/${noFairProb.toFixed(4)} `
      + `超额=${homeProb.overround.toFixed(2)}%`,
    )

    // 基于数据年龄的边缘衰减（最多 50%）
    const agePenalty = cachedAt != null
      ? Math.min((Date.now() - cachedAt) / 300000, 0.5)
      : 0
    const ageFactor = 1 - agePenalty

    // 检查 YES 机会（PM 相对于 Pinnacle 定价过低）
    const rawYesEdge = homeProb.fairProbability - yesPrice
    const yesEdge = rawYesEdge * ageFactor
    if (yesEdge >= this.config.minEdge) {
      return {
        pmMarket,
        pmOutcome: 'Yes',
        pmPrice: yesPrice,
        pinnacleFairProb: homeProb.fairProbability,
        edge: yesEdge,
        expectedValue: (homeProb.fairProbability / yesPrice) - 1,
        oddsEvent: event,
        confidence: this.calculateConfidence(yesEdge, homeProb.overround),
      }
    }

    // 检查 NO 机会（PM 相对于 Pinnacle 定价过低）
    const rawNoEdge = noFairProb - noPrice
    const noEdge = rawNoEdge * ageFactor
    if (noEdge >= this.config.minEdge) {
      return {
        pmMarket,
        pmOutcome: 'No',
        pmPrice: noPrice,
        pinnacleFairProb: noFairProb,
        edge: noEdge,
        expectedValue: (noFairProb / noPrice) - 1,
        oddsEvent: event,
        confidence: this.calculateConfidence(noEdge, noOverround),
      }
    }

    return null
  }

  /**
   * 基于边缘和 Pinnacle 的超额赔率计算置信度
   * 超额赔率越低 = 对 Pinnacle 定价越有信心
   */
  private calculateConfidence(edge: number, overround: number): number {
    // 基于边缘幅度的基础置信度（0-0.7）
    // edge 系数 12 使 minEdge=0.03 时 edgeConfidence=0.36，有合理基数
    const edgeConfidence = Math.min(edge * 12, 0.7)

    // Pinnacle 质量因子（超额赔率越低 = 置信度越高）
    // Pinnacle 二路市场 2-4%，三路市场（足球）4-6%，>6% 已在 findValueOpportunity 中硬截止
    const qualityFactor = Math.max(0, (6 - overround) / 6) * 0.3

    return Math.min(edgeConfidence + qualityFactor, 1)
  }

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
   * 从价值机会创建 Opportunity
   * 返回 null 表示参数无效，应跳过
   */
  private createOpportunity(valueOpp: PinnacleValueOpportunity): Opportunity | null {
    // 校验价格范围（PM 限价单要求 0.001 - 0.999）
    if (!Number.isFinite(valueOpp.pmPrice) || valueOpp.pmPrice < 0.01 || valueOpp.pmPrice > 0.99) {
      logger.debug(`[PinnacleArbitrage] 跳过无效价格的机会: price=${valueOpp.pmPrice}`)
      return null
    }

    const tokenId = valueOpp.pmOutcome === 'Yes'
      ? valueOpp.pmMarket.yesOutcome?.tokenId
      : valueOpp.pmMarket.noOutcome?.tokenId

    if (!tokenId) {
      logger.debug(`[PinnacleArbitrage] 跳过无 tokenId 的机会: ${valueOpp.pmMarket.question.slice(0, 50)}`)
      return null
    }

    // Kelly 仓位：f = (p*b - q)/b，p=公平概率，q=1-p，b=(1/价格)-1；半 Kelly 降方差
    const p = valueOpp.pinnacleFairProb
    const q = 1 - p
    const b = (1 / valueOpp.pmPrice) - 1
    const kellyFraction = b > 0 ? (p * b - q) / b : 0
    const halfKelly = Math.max(kellyFraction * 0.5, 0)
    const positionSize = Math.min(
      this.config.maxPositionSize * halfKelly,
      this.config.maxPositionSize,
    )

    // 计算份数（向下取整到 2 位小数，匹配 PM 精度要求）
    const rawSize = positionSize / valueOpp.pmPrice
    const size = Math.floor(rawSize * 100) / 100

    if (!Number.isFinite(size) || size <= 0) {
      logger.debug(`[PinnacleArbitrage] 跳过无效数量的机会: size=${rawSize}, price=${valueOpp.pmPrice}`)
      return null
    }

    // 将价格四舍五入到 2 位小数（匹配常见 tick size 0.01）
    const roundedPrice = Math.round(valueOpp.pmPrice * 100) / 100

    const leg: OpportunityLeg = {
      marketId: valueOpp.pmMarket.conditionId,
      tokenId,
      side: Side.BUY,
      price: roundedPrice,
      size,
    }

    // 计算预期利润
    const expectedProfit = positionSize * valueOpp.expectedValue
    const expectedProfitPercent = valueOpp.expectedValue * 100

    return new Opportunity(
      `opp_pinnacle_${Date.now()}`,
      OpportunityType.DEVIATION, // 使用 DEVIATION 作为最接近的匹配
      [leg],
      expectedProfit,
      expectedProfitPercent,
      valueOpp.confidence,
      OpportunityStatus.PENDING,
      new Date(Date.now() + 5 * 60 * 1000), // 5 分钟过期
      new Date(),
      {
        type: 'pinnacle_value',
        pinnacleFairProb: valueOpp.pinnacleFairProb,
        pmPrice: valueOpp.pmPrice,
        edge: valueOpp.edge,
        expectedValue: valueOpp.expectedValue,
        oddsEventId: valueOpp.oddsEvent.id,
        homeTeam: valueOpp.oddsEvent.home_team,
        awayTeam: valueOpp.oddsEvent.away_team,
        sport: valueOpp.oddsEvent.sport_key,
      },
    )
  }

  /**
   * 执行机会
   */
  async execute(opportunity: Opportunity): Promise<TradeResult> {
    // 检查机会是否仍然有效
    if (opportunity.isExpired) {
      return {
        success: false,
        trades: [],
        error: '机会已过期',
      }
    }

    // 检查置信度阈值
    if (opportunity.confidence < this.config.confidenceThreshold) {
      logger.debug(
        `[PinnacleArbitrage] 跳过低置信度机会: ${opportunity.confidence.toFixed(3)} < ${this.config.confidenceThreshold}`,
      )
      return {
        success: false,
        trades: [],
        error: `置信度 ${opportunity.confidence.toFixed(2)} 低于阈值 ${this.config.confidenceThreshold}`,
      }
    }

    const leg = opportunity.legs[0]
    if (!leg) {
      return {
        success: false,
        trades: [],
        error: '机会中未找到交易腿',
      }
    }

    // 二次校验价格合法性
    if (!Number.isFinite(leg.price) || leg.price < 0.01 || leg.price > 0.99) {
      return {
        success: false,
        trades: [],
        error: `无效价格: ${leg.price}`,
      }
    }

    try {
      // 查询可用余额
      const { balance: balanceStr } = await this.pmClient.getCollateralBalance()
      const availableBalance = Number.parseFloat(balanceStr)

      if (!Number.isFinite(availableBalance) || availableBalance < 1) {
        return {
          success: false,
          trades: [],
          error: `余额不足: $${balanceStr}`,
        }
      }

      // 查询该 token 已有的挂单，避免重复下单
      const existingOrders = await this.pmClient.getOpenOrdersByToken(leg.tokenId)
      const existingExposure = existingOrders.reduce((sum, order) => {
        const orderPrice = Number.parseFloat(order.price)
        const orderRemaining = Number.parseFloat(order.original_size) - Number.parseFloat(order.size_matched)
        return sum + (orderPrice * orderRemaining)
      }, 0)

      if (existingOrders.length > 0) {
        logger.info(
          `[PinnacleArbitrage] 该 token 已有 ${existingOrders.length} 个挂单，已占用 $${existingExposure.toFixed(2)}`,
        )
      }

      // 计算可用预算 = min(余额, 最大仓位) - 已有挂单占用
      const maxBudget = Math.min(availableBalance, this.config.maxPositionSize)
      const availableBudget = maxBudget - existingExposure

      if (availableBudget < 1) {
        return {
          success: false,
          trades: [],
          error: `预算不足: 可用 $${availableBudget.toFixed(2)} (余额 $${availableBalance.toFixed(2)}, 已挂单 $${existingExposure.toFixed(2)})`,
        }
      }

      // 基于可用预算初步计算数量
      const maxSizeByBudget = Math.floor((availableBudget / leg.price) * 100) / 100
      const preliminarySize = Math.min(leg.size, maxSizeByBudget)

      if (!Number.isFinite(preliminarySize) || preliminarySize <= 0) {
        return {
          success: false,
          trades: [],
          error: `计算后数量无效: ${preliminarySize}`,
        }
      }

      // VWAP 验证：获取订单簿并计算深度加权价格
      const orderBook = await this.pmClient.getOrderBook(leg.tokenId)
      const vwap = this.calculateVwap(orderBook.asks, preliminarySize)

      if (vwap === null) {
        logger.info(
          `[PinnacleArbitrage] 订单簿流动性不足，跳过: tokenId=${leg.tokenId}, 目标数量=${preliminarySize}`,
        )
        return {
          success: false,
          trades: [],
          error: `订单簿流动性不足，无法满足目标数量 ${preliminarySize} 的 80%`,
        }
      }

      // 使用 VWAP 重新验证边缘
      const pinnacleFairProb = opportunity.metadata?.pinnacleFairProb as number
      const adjustedEdge = pinnacleFairProb - vwap

      logger.debug(
        `[PinnacleArbitrage] VWAP=${vwap.toFixed(4)} (原始价格=${leg.price.toFixed(4)}), `
        + `调整后边缘=${(adjustedEdge * 100).toFixed(2)}% (原始=${((opportunity.metadata?.edge as number) * 100).toFixed(2)}%)`,
      )

      if (adjustedEdge < this.config.minEdge) {
        logger.info(
          `[PinnacleArbitrage] VWAP 调整后边缘不足: ${(adjustedEdge * 100).toFixed(2)}% < ${(this.config.minEdge * 100).toFixed(2)}%`,
        )
        return {
          success: false,
          trades: [],
          error: `VWAP 调整后边缘 ${(adjustedEdge * 100).toFixed(2)}% 低于阈值 ${(this.config.minEdge * 100).toFixed(2)}%`,
        }
      }

      // 用 VWAP 四舍五入到 tick_size (0.01) 作为限价单价格
      const vwapPrice = Math.round(vwap * 100) / 100

      // 二次校验 VWAP 价格合法性
      if (vwapPrice < 0.01 || vwapPrice > 0.99) {
        return {
          success: false,
          trades: [],
          error: `VWAP 价格超出范围: ${vwapPrice}`,
        }
      }

      // 基于 VWAP 价格重新计算最终数量
      const maxSizeByVwap = Math.floor((availableBudget / vwapPrice) * 100) / 100
      const finalSize = Math.min(leg.size, maxSizeByVwap)

      if (!Number.isFinite(finalSize) || finalSize <= 0) {
        return {
          success: false,
          trades: [],
          error: `VWAP 价格下数量无效: ${finalSize}`,
        }
      }

      if (this.riskManager) {
        const riskCheck = this.riskManager.checkAllLimits(finalSize, vwapPrice)
        if (!riskCheck.passed) {
          logger.info(`[PinnacleArbitrage] 风控拒绝: ${riskCheck.reason}`)
          return {
            success: false,
            trades: [],
            error: riskCheck.reason ?? '风控检查未通过',
          }
        }
      }

      logger.info(
        `[PinnacleArbitrage] 执行: 买入 ${finalSize} @ $${vwapPrice.toFixed(4)} (VWAP) `
        + `(原始价格: $${leg.price.toFixed(4)}, 边缘: ${(adjustedEdge * 100).toFixed(2)}%, `
        + `预算: $${availableBudget.toFixed(2)})`,
      )

      // 下单（使用 VWAP 价格）
      const orderResult = await this.pmClient.createLimitOrder({
        tokenId: leg.tokenId,
        price: vwapPrice,
        size: finalSize,
        side: ClobSide.BUY,
      })

      if (orderResult.success && orderResult.orderId) {
        this.activeOrders.set(orderResult.orderId, {
          orderId: orderResult.orderId,
          tokenId: leg.tokenId,
          marketId: leg.marketId,
          placedAt: Date.now(),
          opportunityId: opportunity.id,
          expectedEdge: adjustedEdge,
          price: vwapPrice,
          size: finalSize,
        })
        this._stats.opportunitiesExecuted++
        this._stats.totalPnL += opportunity.expectedProfit * opportunity.confidence

        if (this.notificationService) {
          const tradeEntity = new Trade(
            orderResult.orderId,
            orderResult.orderId,
            leg.marketId,
            leg.tokenId,
            Side.BUY,
            Price.fromNumber(vwapPrice),
            Quantity.fromNumber(finalSize),
            0,
            'Yes',
            'open',
            'MAKER',
            '',
            new Date(),
          )
          await this.notificationService.notifyTrade({
            trade: tradeEntity,
            strategyName: this.name,
          })
        }

        return {
          success: true,
          trades: [],
          totalProfit: opportunity.expectedProfit,
        }
      }
      else {
        return {
          success: false,
          trades: [],
          error: `订单下单失败: ${orderResult.errorMsg || '未知错误'}`,
        }
      }
    }
    catch (error) {
      logger.error('[PinnacleArbitrage] 执行失败', error)
      return {
        success: false,
        trades: [],
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * 获取策略特定统计（成交笔数从 Prisma Trade 聚合，totalPnL 待结算后更新）
   */
  override getStats() {
    const baseStats = super.getStats()
    const executed = this._dbStats.executed
    return {
      ...baseStats,
      opportunitiesExecuted: executed,
      totalPnL: 0, // 实际盈亏需市场结算后更新
      avgProfit: executed > 0 ? 0 : baseStats.avgProfit,
      rateLimits: this.oddsClient.getRateLimitInfo(),
      cachedSports: Array.from(this.cachedOdds.keys()),
      dbTotalCost: this._dbStats.totalCost,
    }
  }

  /**
   * 添加市场映射
   */
  addMarketMapping(mapping: MarketMapping): void {
    if (!this.config.marketMappings) {
      this.config.marketMappings = []
    }
    this.config.marketMappings.push(mapping)
    logger.info(`[PinnacleArbitrage] 添加市场映射: PM ${mapping.pmConditionId} -> Odds ${mapping.oddsEventId}`)
  }

  /**
   * 移除市场映射
   */
  removeMarketMapping(pmConditionId: string): void {
    if (this.config.marketMappings) {
      this.config.marketMappings = this.config.marketMappings.filter(
        m => m.pmConditionId !== pmConditionId,
      )
    }
  }

  /**
   * 获取所有价值机会（不执行）
   * 复用 collectMatchedTuples 核心扫描逻辑
   */
  async getValueOpportunities(): Promise<PinnacleValueOpportunity[]> {
    try {
      const tuples = await this.collectMatchedTuples()
      const opportunities: PinnacleValueOpportunity[] = []
      for (const { market, fairProbs, event, cachedAt } of tuples) {
        const valueOpp = this.findValueOpportunity(market, fairProbs, event, cachedAt)
        if (valueOpp)
          opportunities.push(valueOpp)
      }
      return opportunities.sort((a, b) => b.edge - a.edge)
    }
    catch (error) {
      logger.error('[PinnacleArbitrage] 获取价值机会失败', error)
      return []
    }
  }
}

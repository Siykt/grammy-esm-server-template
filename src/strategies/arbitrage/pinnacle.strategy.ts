import type { OpportunityLeg } from '../../domain/entities/opportunity.entity.js'
import type { FairProbability, OddsEvent } from '../../services/odds/odds-api.client.js'
import type { GammaSportsSeries, PMClientService } from '../../services/pm/client.service.js'
import type { StrategyConfig, TradeResult } from '../base/strategy.interface.js'
import { Side as ClobSide } from '@polymarket/clob-client'
import logger from '../../common/logger.js'
import { redis, RedisKeys } from '../../common/redis.js'
import { Market } from '../../domain/entities/market.entity.js'
import { Opportunity, OpportunityStatus, OpportunityType } from '../../domain/entities/opportunity.entity.js'
import { Side } from '../../domain/value-objects/side.vo.js'
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
  private oddsClient: OddsApiClient
  private config: PinnacleArbitrageConfig
  private cachedOdds: Map<string, { data: OddsEvent[], timestamp: number }> = new Map()
  /** PM 体育联赛缓存 */
  private cachedPmSports: GammaSportsSeries[] | null = null
  private pmSportsCacheTime = 0
  /** PM 体育联赛缓存有效期（毫秒）- 1小时 */
  private readonly PM_SPORTS_CACHE_TTL_MS = 3600000
  /** 赔率缓存有效期（毫秒）- 5分钟 */
  private readonly CACHE_TTL_MS = 300000
  /** 无赛事体育项目的缓存有效期（毫秒）- 30分钟 */
  private readonly EMPTY_CACHE_TTL_MS = 1800000
  /** Redis 扫描匹配缓存有效期（秒）- 30分钟 */
  private readonly SCAN_MATCH_CACHE_TTL_SEC = 1800

  constructor(
    name: string,
    pmClient: PMClientService,
    config: PinnacleArbitrageConfig,
  ) {
    super(name, 'pinnacle_arbitrage')
    this.pmClient = pmClient
    this.config = config
    // 兼容旧的 oddsApiKey 配置
    const apiKeys = config.oddsApiKeys || config.oddsApiKey || ''
    this.oddsClient = new OddsApiClient(apiKeys)
    this.updateConfig(config)
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
   * 扫描特定 PM 联赛的机会
   */
  private async scanPmSeries(
    pmSeries: GammaSportsSeries,
    oddsSportKey: string,
  ): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = []

    try {
      // 获取 PM 联赛的事件（只获取比赛事件，排除期货）
      const pmEvents = await this.pmClient.getSportsEvents(pmSeries.series, true)

      if (pmEvents.length === 0) {
        logger.debug(`[PinnacleArbitrage] [${pmSeries.sport}] 无活跃赛事`)
        return opportunities
      }

      // 从事件中提取市场
      const pmMarkets: Market[] = []
      for (const event of pmEvents) {
        if (event.markets) {
          for (const market of event.markets) {
            pmMarkets.push(Market.fromGamma(market))
          }
        }
      }

      if (pmMarkets.length === 0) {
        return opportunities
      }

      // 获取 Odds API 赔率
      const oddsEvents = await this.getCachedPinnacleOdds(oddsSportKey)

      logger.debug(
        `[PinnacleArbitrage] [${pmSeries.sport}] PM市场: ${pmMarkets.length}, 赔率事件: ${oddsEvents.length}`,
      )

      if (oddsEvents.length === 0) {
        return opportunities
      }

      // 获取 Redis 缓存的匹配结果（30 分钟有效）
      const matchCacheKey = RedisKeys.pinnacleScanMatch(oddsSportKey)
      let cachedMatches = new Map<string, string>()
      try {
        const cached = await redis.hgetall(matchCacheKey)
        if (cached && Object.keys(cached).length > 0) {
          cachedMatches = new Map(Object.entries(cached))
        }
      }
      catch (err) {
        logger.warn('[PinnacleArbitrage] 读取匹配缓存失败，将重新匹配', err)
      }

      // 匹配并查找机会
      let matchedCount = 0
      let cacheHits = 0
      let cacheMisses = 0
      for (const oddsEvent of oddsEvents) {
        const fairProbs = this.oddsClient.getPinnacleFairProbabilities(oddsEvent)
        if (!fairProbs)
          continue

        // 优先使用 Redis 缓存的匹配结果
        let matchedMarket: Market | null = null
        const cachedConditionId = cachedMatches.get(oddsEvent.id)

        if (cachedConditionId !== undefined) {
          cacheHits++
          if (cachedConditionId) {
            matchedMarket = pmMarkets.find(m => m.conditionId === cachedConditionId) || null
          }
        }
        else {
          cacheMisses++
          matchedMarket = this.findMatchingPmMarket(oddsEvent, pmMarkets, oddsSportKey)
          try {
            await redis.hset(matchCacheKey, oddsEvent.id, matchedMarket?.conditionId ?? '')
            await redis.expire(matchCacheKey, this.SCAN_MATCH_CACHE_TTL_SEC)
          }
          catch (err) {
            logger.warn('[PinnacleArbitrage] 写入匹配缓存失败', err)
          }
        }

        if (!matchedMarket)
          continue

        matchedCount++

        const valueOpp = this.findValueOpportunity(matchedMarket, fairProbs, oddsEvent)
        if (valueOpp && valueOpp.edge >= this.config.minEdge) {
          const opportunity = this.createOpportunity(valueOpp)
          opportunities.push(opportunity)
        }
      }

      logger.debug(
        `[PinnacleArbitrage] [${pmSeries.sport}] 匹配到 ${matchedCount}/${oddsEvents.length} 个市场 (缓存命中 ${cacheHits}, 未命中 ${cacheMisses})`,
      )
    }
    catch (error) {
      logger.error(`[PinnacleArbitrage] 扫描联赛 ${pmSeries.sport} 失败`, error)
    }

    return opportunities
  }

  /**
   * 获取带缓存的 Pinnacle 赔率
   * 对无赛事的体育项目使用更长的缓存时间
   */
  private async getCachedPinnacleOdds(sportKey: string): Promise<OddsEvent[]> {
    const cached = this.cachedOdds.get(sportKey)
    const now = Date.now()

    if (cached) {
      // 对于无赛事的体育项目使用更长的缓存时间
      const ttl = cached.data.length === 0 ? this.EMPTY_CACHE_TTL_MS : this.CACHE_TTL_MS
      if (now - cached.timestamp < ttl) {
        return cached.data
      }
    }

    const oddsEvents = await this.oddsClient.getPinnacleOdds(sportKey)
    this.cachedOdds.set(sportKey, { data: oddsEvents, timestamp: now })

    return oddsEvents
  }

  /**
   * 为赔率事件寻找匹配的 PM 市场
   */
  private findMatchingPmMarket(event: OddsEvent, pmMarkets: Market[], sportKey?: string): Market | null {
    // 首先检查手动映射
    if (this.config.marketMappings) {
      const mapping = this.config.marketMappings.find(m => m.oddsEventId === event.id)
      if (mapping) {
        const market = pmMarkets.find(m => m.conditionId === mapping.pmConditionId)
        if (market) {
          logger.debug(
            `[PinnacleArbitrage] [手动映射] ${event.home_team} vs ${event.away_team} -> ${market.question.slice(0, 50)}`,
          )
        }
        return market || null
      }
    }

    // 通过队伍名称和时间进行模糊匹配
    const eventTeams = [event.home_team.toLowerCase(), event.away_team.toLowerCase()]
    const potentialMatches: Array<{ market: Market, score: number, matchedTeam: string }> = []

    for (const market of pmMarkets) {
      const marketQuestion = market.question.toLowerCase()

      // 检查市场是否提及任何队伍名称
      for (const team of eventTeams) {
        if (marketQuestion.includes(team)) {
          potentialMatches.push({ market, score: 2, matchedTeam: team })
          break
        }
        else if (this.fuzzyMatch(marketQuestion, team)) {
          potentialMatches.push({ market, score: 1, matchedTeam: team })
          break
        }
      }
    }

    // 打印可能的匹配
    if (potentialMatches.length > 0) {
      logger.debug(
        `[PinnacleArbitrage] [${sportKey || 'unknown'}] 事件: ${event.home_team} vs ${event.away_team}`,
      )
      for (const match of potentialMatches) {
        logger.debug(
          `  -> 可能匹配 (分数=${match.score}): ${match.market.question.slice(0, 80)}`,
        )
      }
    }
    else {
      // 打印未匹配的事件
      logger.debug(
        `[PinnacleArbitrage] [${sportKey || 'unknown'}] 未匹配: ${event.home_team} vs ${event.away_team}`,
      )
    }

    // 返回分数最高的匹配
    if (potentialMatches.length > 0) {
      potentialMatches.sort((a, b) => b.score - a.score)
      return potentialMatches[0]?.market || null
    }

    return null
  }

  /**
   * 队伍名称的简单模糊匹配
   */
  private fuzzyMatch(text: string, query: string): boolean {
    // 处理常见缩写和变体
    const queryParts = query.split(' ').filter(p => p.length > 3)
    return queryParts.some(part => text.includes(part))
  }

  /**
   * 比较 PM 价格与 Pinnacle 公平概率，寻找价值机会
   */
  private findValueOpportunity(
    pmMarket: Market,
    fairProbs: FairProbability[],
    event: OddsEvent,
  ): PinnacleValueOpportunity | null {
    // 从结果中获取 PM 价格
    const yesPrice = pmMarket.yesPrice.amount
    const noPrice = pmMarket.noPrice.amount

    // 尝试匹配结果
    // 常见映射：主队 = Yes，客队 = No（对于胜负市场）
    const homeProb = fairProbs.find(p =>
      p.outcome.toLowerCase().includes(event.home_team.toLowerCase()),
    )
    const awayProb = fairProbs.find(p =>
      p.outcome.toLowerCase().includes(event.away_team.toLowerCase()),
    )

    // 如果无法映射结果，尝试使用通用位置
    const prob1 = homeProb || fairProbs[0]
    const prob2 = awayProb || fairProbs[1]

    if (!prob1 || !prob2)
      return null

    // 检查 YES 机会（PM 相对于 Pinnacle 定价过低）
    const yesEdge = prob1.fairProbability - yesPrice
    if (yesEdge >= this.config.minEdge) {
      return {
        pmMarket,
        pmOutcome: 'Yes',
        pmPrice: yesPrice,
        pinnacleFairProb: prob1.fairProbability,
        edge: yesEdge,
        expectedValue: (prob1.fairProbability / yesPrice) - 1,
        oddsEvent: event,
        confidence: this.calculateConfidence(yesEdge, prob1.overround),
      }
    }

    // 检查 NO 机会（PM 相对于 Pinnacle 定价过低）
    const noEdge = prob2.fairProbability - noPrice
    if (noEdge >= this.config.minEdge) {
      return {
        pmMarket,
        pmOutcome: 'No',
        pmPrice: noPrice,
        pinnacleFairProb: prob2.fairProbability,
        edge: noEdge,
        expectedValue: (prob2.fairProbability / noPrice) - 1,
        oddsEvent: event,
        confidence: this.calculateConfidence(noEdge, prob2.overround),
      }
    }

    return null
  }

  /**
   * 基于边缘和 Pinnacle 的超额赔率计算置信度
   * 超额赔率越低 = 对 Pinnacle 定价越有信心
   */
  private calculateConfidence(edge: number, overround: number): number {
    // 基于边缘幅度的基础置信度（0-0.5）
    const edgeConfidence = Math.min(edge * 5, 0.5)

    // Pinnacle 质量因子（超额赔率越低 = 置信度越高）
    // Pinnacle 通常有 2-4% 的超额赔率
    const qualityFactor = Math.max(0, (5 - overround) / 5) * 0.5

    return Math.min(edgeConfidence + qualityFactor, 1)
  }

  /**
   * 从价值机会创建 Opportunity
   */
  private createOpportunity(valueOpp: PinnacleValueOpportunity): Opportunity {
    const tokenId = valueOpp.pmOutcome === 'Yes'
      ? valueOpp.pmMarket.yesOutcome?.tokenId
      : valueOpp.pmMarket.noOutcome?.tokenId

    // 使用边缘和类凯利方法计算仓位大小
    const fullPosition = this.config.maxPositionSize * valueOpp.edge * 10
    const positionSize = Math.min(fullPosition, this.config.maxPositionSize)

    const leg: OpportunityLeg = {
      marketId: valueOpp.pmMarket.conditionId,
      tokenId: tokenId || '',
      side: Side.BUY,
      price: valueOpp.pmPrice,
      size: Math.floor(positionSize / valueOpp.pmPrice),
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

    try {
      logger.info(
        `[PinnacleArbitrage] 执行: 买入 ${leg.size} @ $${leg.price.toFixed(4)} `
        + `(边缘: ${((opportunity.metadata?.edge as number) * 100).toFixed(2)}%)`,
      )

      // 下单
      const orderResult = await this.pmClient.createLimitOrder({
        tokenId: leg.tokenId,
        price: leg.price,
        size: leg.size,
        side: ClobSide.BUY,
      })

      if (orderResult.success) {
        this._stats.opportunitiesExecuted++
        this._stats.totalPnL += opportunity.expectedProfit * opportunity.confidence

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
          error: '订单下单失败',
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
   * 获取策略特定统计
   */
  override getStats() {
    const baseStats = super.getStats()
    return {
      ...baseStats,
      rateLimits: this.oddsClient.getRateLimitInfo(),
      cachedSports: Array.from(this.cachedOdds.keys()),
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
   * 使用 PM sports API 获取体育联赛，然后匹配 Odds API
   */
  async getValueOpportunities(): Promise<PinnacleValueOpportunity[]> {
    const opportunities: PinnacleValueOpportunity[] = []

    try {
      // 获取 PM 体育联赛列表
      const pmSports = await this.getCachedPmSports()
      if (pmSports.length === 0) {
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
        return opportunities
      }

      // 扫描每个联赛
      for (const { pmSeries, oddsSportKey } of sportsToScan) {
        // 获取 PM 联赛的事件（只获取比赛事件，排除期货）
        const pmEvents = await this.pmClient.getSportsEvents(pmSeries.series, true)
        if (pmEvents.length === 0) {
          continue
        }

        // 从事件中提取市场
        const pmMarkets: Market[] = []
        for (const event of pmEvents) {
          if (event.markets) {
            for (const market of event.markets) {
              pmMarkets.push(Market.fromGamma(market))
            }
          }
        }

        if (pmMarkets.length === 0) {
          continue
        }

        // 获取 Odds API 赔率
        const oddsEvents = await this.getCachedPinnacleOdds(oddsSportKey)
        if (oddsEvents.length === 0) {
          continue
        }

        // 使用与 scanPmSeries 相同的 Redis 匹配缓存
        const matchCacheKey = RedisKeys.pinnacleScanMatch(oddsSportKey)
        let cachedMatches = new Map<string, string>()
        try {
          const cached = await redis.hgetall(matchCacheKey)
          if (cached && Object.keys(cached).length > 0) {
            cachedMatches = new Map(Object.entries(cached))
          }
        }
        catch {
          // 静默忽略，将重新匹配
        }

        // 匹配并查找机会
        for (const event of oddsEvents) {
          const fairProbs = this.oddsClient.getPinnacleFairProbabilities(event)
          if (!fairProbs)
            continue

          let matchedMarket: Market | null = null
          const cachedConditionId = cachedMatches.get(event.id)
          if (cachedConditionId !== undefined) {
            if (cachedConditionId) {
              matchedMarket = pmMarkets.find(m => m.conditionId === cachedConditionId) || null
            }
          }
          else {
            matchedMarket = this.findMatchingPmMarket(event, pmMarkets, oddsSportKey)
            try {
              await redis.hset(matchCacheKey, event.id, matchedMarket?.conditionId ?? '')
              await redis.expire(matchCacheKey, this.SCAN_MATCH_CACHE_TTL_SEC)
            }
            catch {
              // 静默忽略
            }
          }

          if (!matchedMarket)
            continue

          const valueOpp = this.findValueOpportunity(matchedMarket, fairProbs, event)
          if (valueOpp) {
            opportunities.push(valueOpp)
          }
        }
      }

      // 按边缘降序排序
      return opportunities.sort((a, b) => b.edge - a.edge)
    }
    catch (error) {
      logger.error('[PinnacleArbitrage] 获取价值机会失败', error)
      return []
    }
  }
}

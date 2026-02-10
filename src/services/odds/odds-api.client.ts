import type { AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios'
import axios from 'axios'
import logger from '../../common/logger.js'

/**
 * Odds API 博彩公司
 */
export interface OddsBookmaker {
  key: string
  title: string
  last_update: string
  markets: OddsMarket[]
}

/**
 * Odds API 市场
 */
export interface OddsMarket {
  /** 市场类型：'h2h'（胜负盘）, 'spreads'（让分盘）, 'totals'（大小盘） */
  key: string
  last_update: string
  outcomes: OddsOutcome[]
}

/**
 * Odds API 结果
 */
export interface OddsOutcome {
  name: string
  /** 小数赔率 */
  price: number
  /** 让分/大小盘点数 */
  point?: number
}

/**
 * Odds API 事件
 */
export interface OddsEvent {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: OddsBookmaker[]
}

/**
 * 体育项目定义
 */
export interface Sport {
  key: string
  group: string
  title: string
  description: string
  active: boolean
  has_outrights: boolean
}

/**
 * 公平概率计算结果
 */
export interface FairProbability {
  /** 结果名称 */
  outcome: string
  /** 隐含概率（1/赔率） */
  impliedProbability: number
  /** 公平概率（归一化后） */
  fairProbability: number
  /** 小数赔率 */
  decimalOdds: number
  /** 超额赔率（博彩公司利润） */
  overround: number
}

/**
 * API key 状态
 */
interface ApiKeyState {
  key: string
  remaining: number
  used: number
}

/**
 * The Odds API 客户端
 * 从多个博彩公司获取赔率数据，特别是 Pinnacle
 * 支持多 API key 轮换策略
 */
export class OddsApiClient {
  private readonly baseUrl = 'https://api.the-odds-api.com/v4'
  private readonly apiKeys: ApiKeyState[]

  constructor(apiKeys: string | string[]) {
    const keys = Array.isArray(apiKeys) ? apiKeys : [apiKeys]
    const validKeys = keys.filter(k => k && k.trim())

    if (validKeys.length === 0) {
      throw new Error('至少需要一个有效的 Odds API key')
    }

    this.apiKeys = validKeys.map(key => ({
      key: key.trim(),
      remaining: 500,
      used: 0,
    }))

    logger.info(`[OddsApiClient] 已初始化 ${this.apiKeys.length} 个 API key`)
  }

  /**
   * 获取当前最佳可用的 API key
   * 策略：选择剩余配额最多的 key
   */
  private getBestApiKey(): ApiKeyState {
    // 按剩余配额降序排序，选择最多的
    const sorted = [...this.apiKeys].sort((a, b) => b.remaining - a.remaining)
    // apiKeys 至少有一个元素（构造函数保证），所以 sorted[0] 一定存在
    const best = sorted[0] as ApiKeyState

    // 如果最佳 key 的配额已用完，记录警告
    if (best.remaining <= 0) {
      logger.warn('[OddsApiClient] 所有 API key 配额已用完，使用第一个 key 继续请求')
    }

    return best
  }

  /**
   * 获取可用的体育项目
   */
  async getSports(): Promise<Sport[]> {
    const keyState = this.getBestApiKey()
    try {
      const response = await axios.get<Sport[]>(`${this.baseUrl}/sports`, {
        params: { apiKey: keyState.key },
      })

      this.updateRateLimits(keyState, response.headers)
      return response.data
    }
    catch (error) {
      logger.error('[OddsApiClient] 获取体育项目失败', error)
      throw error
    }
  }

  /**
   * 获取特定体育项目的赔率
   * @param sportKey 体育项目键值（例如 'americanfootball_nfl', 'basketball_nba'）
   * @param options 选项
   * @param options.bookmakers 博彩公司
   * @param options.markets 市场
   * @param options.regions 地区
   * @param options.oddsFormat 赔率格式
   */
  async getOdds(
    sportKey: string,
    options?: {
      bookmakers?: string[]
      markets?: string[]
      regions?: string[]
      oddsFormat?: 'decimal' | 'american'
    },
  ): Promise<OddsEvent[]> {
    const keyState = this.getBestApiKey()
    try {
      const params: Record<string, string> = {
        apiKey: keyState.key,
        regions: options?.regions?.join(',') || 'us,uk,eu',
        markets: options?.markets?.join(',') || 'h2h',
        oddsFormat: options?.oddsFormat || 'decimal',
      }

      if (options?.bookmakers?.length) {
        params.bookmakers = options.bookmakers.join(',')
      }

      const response = await axios.get<OddsEvent[]>(
        `${this.baseUrl}/sports/${sportKey}/odds`,
        { params },
      )

      this.updateRateLimits(keyState, response.headers)
      return response.data
    }
    catch (error) {
      logger.error(`[OddsApiClient] 获取 ${sportKey} 赔率失败`, error)
      throw error
    }
  }

  /**
   * 专门获取 Pinnacle 赔率
   */
  async getPinnacleOdds(sportKey: string, markets: string[] = ['h2h']): Promise<OddsEvent[]> {
    const events = await this.getOdds(sportKey, {
      bookmakers: ['pinnacle'],
      markets,
      regions: ['us', 'eu'],
    })

    // 只包含有 Pinnacle 赔率的事件
    return events.filter(event =>
      event.bookmakers.some(bm => bm.key === 'pinnacle'),
    )
  }

  /**
   * 使用乘法归一化从小数赔率计算公平概率
   *
   * 公式：
   * 1. 隐含概率: IP_i = 1 / O_i
   * 2. 总超额赔率: S = Σ IP_i
   * 3. 公平概率: FP_i = IP_i / S
   */
  calculateFairProbabilities(outcomes: OddsOutcome[]): FairProbability[] {
    // 步骤 1：计算隐含概率
    const impliedProbs = outcomes.map(outcome => ({
      outcome: outcome.name,
      impliedProbability: 1 / outcome.price,
      decimalOdds: outcome.price,
    }))

    // 步骤 2：计算总超额赔率（隐含概率之和）
    const totalImplied = impliedProbs.reduce((sum, p) => sum + p.impliedProbability, 0)
    const overround = (totalImplied - 1) * 100 // 转换为百分比

    // 步骤 3：归一化得到公平概率
    return impliedProbs.map(prob => ({
      outcome: prob.outcome,
      impliedProbability: prob.impliedProbability,
      fairProbability: prob.impliedProbability / totalImplied,
      decimalOdds: prob.decimalOdds,
      overround,
    }))
  }

  /**
   * 提取事件的 Pinnacle 公平概率
   */
  getPinnacleFairProbabilities(event: OddsEvent): FairProbability[] | null {
    const pinnacle = event.bookmakers.find(bm => bm.key === 'pinnacle')
    if (!pinnacle)
      return null

    const h2hMarket = pinnacle.markets.find(m => m.key === 'h2h')
    if (!h2hMarket)
      return null

    return this.calculateFairProbabilities(h2hMarket.outcomes)
  }

  /**
   * 获取所有 API key 的速率限制信息
   */
  getRateLimitInfo() {
    return {
      keys: this.apiKeys.map((k, index) => ({
        index,
        remaining: k.remaining,
        used: k.used,
      })),
      totalRemaining: this.apiKeys.reduce((sum, k) => sum + k.remaining, 0),
      totalUsed: this.apiKeys.reduce((sum, k) => sum + k.used, 0),
    }
  }

  /**
   * 从响应头更新特定 key 的速率限制
   */
  private updateRateLimits(
    keyState: ApiKeyState,
    headers: AxiosResponseHeaders | Partial<RawAxiosResponseHeaders>,
  ) {
    const remaining = headers['x-requests-remaining']
    const used = headers['x-requests-used']

    if (remaining !== undefined) {
      keyState.remaining = Number.parseInt(String(remaining), 10)
    }
    if (used !== undefined) {
      keyState.used = Number.parseInt(String(used), 10)
    }

    const keyIndex = this.apiKeys.indexOf(keyState)
    logger.debug(
      `[OddsApiClient] Key #${keyIndex + 1} 速率限制 - 剩余: ${keyState.remaining}, 已用: ${keyState.used}`,
    )
  }
}

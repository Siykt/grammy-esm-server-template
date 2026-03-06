/**
 * Weather Underground 数据采集服务
 *
 * 通过抓取 wunderground.com 页面的 SSR 数据（<script id="app-root-state">）
 * 获取天气预报和历史观测数据，并持久化到 SQLite。
 *
 * 关键 API 端点（嵌入在页面 JSON 中）：
 * - /v3/wx/forecast/daily/10day - 10天逐日预报
 * - /v3/wx/forecast/hourly/15day - 15天逐小时预报
 * - /v3/wx/conditions/historical/dailysummary/30day - 30天历史摘要
 * - /v3/wx/conditions/historical/hourly/1day - 当日逐小时历史
 */

import type {
  DayForecast,
  DayHistory,
  WUDailyForecast,
  WUHistoricalDailySummary,
  WUHistoricalHourly,
  WUHourlyForecast,
  WURootState,
  WURootStateEntry,
} from './wu.types.js'
import axios from 'axios'
import logger from '../../common/logger.js'
import { prisma } from '../../common/prisma.js'

/** 站点配置 */
export interface WUStationConfig {
  /** 站点 ICAO 代码，如 KLGA */
  icaoCode: string
  /** URL 路径，如 us/ny/new-york-city */
  urlPath: string
  /** 坐标 */
  geocode: { lat: number, lon: number }
}

/** 预定义站点 */
export const WU_STATIONS = {
  KLGA: {
    icaoCode: 'KLGA',
    urlPath: 'us/ny/new-york-city',
    geocode: { lat: 40.761, lon: -73.864 },
  },
} as const satisfies Record<string, WUStationConfig>

/** 页面缓存条目 */
interface CacheEntry<T> {
  data: T
  fetchedAt: Date
  expiresAt: Date
}

/** 已知的 API 路径与数字 key 的映射关系 */
const API_PATHS = {
  forecast10day: '/v3/wx/forecast/daily/10day',
  forecast5day: '/v3/wx/forecast/daily/5day',
  forecast3day: '/v3/wx/forecast/daily/3day',
  hourly15day: '/v3/wx/forecast/hourly/15day',
  historicalDaily30day: '/v3/wx/conditions/historical/dailysummary/30day',
  historicalDaily1day: '/v3/wx/conditions/historical/dailysummary/1day',
  historicalHourly1day: '/v3/wx/conditions/historical/hourly/1day',
  currentObs: '/v3/wx/observations/current',
}

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/** 数据新鲜度阈值：超过此时长未成功抓取预报则视为过期（毫秒） */
const FORECAST_STALE_MS = 2 * 60 * 60 * 1000

export class WUClientService {
  private forecastCache: CacheEntry<WURootState> | null = null
  private historyCache = new Map<string, CacheEntry<WURootState>>()

  /** 预报缓存时长（毫秒） */
  private forecastCacheTTL: number
  /** 历史数据缓存时长（毫秒） */
  private historyCacheTTL: number
  /** 连续抓取失败次数（用于健康检查） */
  private consecutiveFailures = 0
  /** 最近一次成功抓取预报页的时间 */
  private lastSuccessFetchedAt: Date | null = null

  constructor(
    private station: WUStationConfig = WU_STATIONS.KLGA,
    options?: {
      forecastCacheTTL?: number
      historyCacheTTL?: number
    },
  ) {
    // 预报数据15分钟缓存，历史数据1小时缓存
    this.forecastCacheTTL = options?.forecastCacheTTL ?? 15 * 60 * 1000
    this.historyCacheTTL = options?.historyCacheTTL ?? 60 * 60 * 1000
  }

  // ============ 公开方法 ============

  /**
   * 获取 10 天逐日预报，解析为简化结构，并写入 DB
   */
  async getDailyForecasts(): Promise<DayForecast[]> {
    const state = await this.fetchForecastPage()
    const raw = this.findDataByApiPath(state, API_PATHS.forecast10day) as WUDailyForecast | null

    if (!raw) {
      logger.warn('[WU] 未找到10天预报数据')
      return []
    }

    const forecasts = this.parseDailyForecasts(raw)
    await this.saveForecastsToDB(forecasts)
    return forecasts
  }

  /**
   * 获取指定日期的预报高温
   */
  async getForecastHigh(date: string): Promise<number | null> {
    const forecasts = await this.getDailyForecasts()
    const match = forecasts.find(f => f.date === date)
    return match?.highF ?? null
  }

  /**
   * 获取 30 天历史每日摘要，并写入 DB
   */
  async getHistoricalDaily(): Promise<DayHistory[]> {
    const state = await this.fetchForecastPage()
    const raw = this.findDataByApiPath(state, API_PATHS.historicalDaily30day) as WUHistoricalDailySummary | null

    if (!raw) {
      logger.warn('[WU] 未找到30天历史数据')
      return []
    }

    const history = this.parseHistoricalDaily(raw)
    await this.saveObservationsToDB(history)
    return history
  }

  /**
   * 获取指定日期的历史实际高温
   */
  async getActualHigh(date: string): Promise<number | null> {
    const history = await this.getHistoricalDaily()
    const match = history.find(h => h.date === date)
    return match?.highF ?? null
  }

  /**
   * 获取逐小时预报（15天）
   */
  async getHourlyForecasts(): Promise<WUHourlyForecast | null> {
    const state = await this.fetchForecastPage()
    return this.findDataByApiPath(state, API_PATHS.hourly15day) as WUHourlyForecast | null
  }

  /**
   * 获取当日逐小时历史观测
   */
  async getHistoricalHourly(): Promise<WUHistoricalHourly | null> {
    const state = await this.fetchForecastPage()
    return this.findDataByApiPath(state, API_PATHS.historicalHourly1day) as WUHistoricalHourly | null
  }

  /**
   * 获取原始 SSR 数据（用于调试）
   */
  async getRawState(): Promise<WURootState> {
    return this.fetchForecastPage()
  }

  /**
   * 回填更早的历史观测数据（逐日抓取历史页面并写入 DB）
   * 用于扩大偏差样本量，每次请求间隔 2 秒避免反爬
   * @param days 回填过去多少天（不含今天）
   */
  async backfillHistory(days: number): Promise<{ fetched: number, saved: number }> {
    let saved = 0
    const now = new Date()
    const oneDayMs = 24 * 60 * 60 * 1000

    for (let i = 1; i <= days; i++) {
      const d = new Date(now.getTime() - i * oneDayMs)
      const dateStr = d.toISOString().slice(0, 10) // YYYY-MM-DD
      const dateUrl = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` // YYYY-M-D 供 URL

      try {
        const state = await this.fetchHistoryPage(dateUrl)
        const raw = this.findDataByApiPath(state, API_PATHS.historicalDaily1day) as WUHistoricalDailySummary | null
          ?? this.findHistoricalDailyInState(state)

        if (raw) {
          const history = this.parseHistoricalDaily(raw)
          await this.saveObservationsToDB(history)
          saved += history.filter(h => h.highF != null).length
        }
      }
      catch (err) {
        logger.debug(`[WU] 回填 ${dateStr} 失败: ${err}`)
      }

      if (i < days) {
        await new Promise(r => setTimeout(r, 2000))
      }
    }

    logger.info(`[WU] 回填完成: 过去 ${days} 天，写入 ${saved} 条观测`)
    return { fetched: days, saved }
  }

  /**
   * 在任意 SSR 状态中查找包含历史日摘要结构的响应体
   */
  private findHistoricalDailyInState(state: WURootState): WUHistoricalDailySummary | null {
    for (const value of Object.values(state)) {
      if (!value || typeof value !== 'object')
        continue
      const entry = value as WURootStateEntry
      const b = entry?.b as unknown
      if (b && typeof b === 'object' && Array.isArray((b as WUHistoricalDailySummary).validTimeLocal) && Array.isArray((b as WUHistoricalDailySummary).temperatureMax))
        return b as WUHistoricalDailySummary
    }
    return null
  }

  /** 最近一次成功抓取预报数据的时间（用于策略侧新鲜度检查） */
  getLastSuccessFetchedAt(): Date | null {
    return this.lastSuccessFetchedAt
  }

  /** 连续抓取失败次数 */
  getConsecutiveFailures(): number {
    return this.consecutiveFailures
  }

  /** 预报数据是否已过期（超过 2 小时未成功抓取） */
  isForecastStale(): boolean {
    if (!this.lastSuccessFetchedAt)
      return true
    return Date.now() - this.lastSuccessFetchedAt.getTime() > FORECAST_STALE_MS
  }

  /** 清除内存缓存 */
  clearCache(): void {
    this.forecastCache = null
    this.historyCache.clear()
  }

  // ============ DB 持久化 ============

  /**
   * 将预报数据写入 WeatherForecast 表
   * 每次抓取都记录一条快照（用于回溯不同提前天数的预报准确率）
   */
  private async saveForecastsToDB(forecasts: DayForecast[]): Promise<void> {
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)

    try {
      await prisma.$transaction(
        forecasts.map(f => prisma.weatherForecast.create({
          data: {
            station: this.station.icaoCode,
            date: f.date,
            highF: f.highF,
            lowF: f.lowF,
            leadDays: this.calcLeadDays(todayStr, f.date),
            narrative: f.narrative,
            precipChanceDay: f.precipChanceDay,
            precipChanceNight: f.precipChanceNight,
            qpf: f.qpf,
            fetchedAt: now,
          },
        })),
      )
      logger.debug(`[WU] 写入 ${forecasts.length} 条预报到 DB`)
    }
    catch (error) {
      // unique 约束冲突说明同一秒已写入过，忽略
      logger.debug(`[WU] 预报写入 DB 跳过（可能已存在）: ${error}`)
    }
  }

  /**
   * 将历史观测写入 WeatherObservation 表
   * 同一站点+日期只保留一条（upsert）
   */
  private async saveObservationsToDB(history: DayHistory[]): Promise<void> {
    try {
      for (const h of history) {
        // 跳过 highF 缺失的记录（当天数据可能尚未完整）
        if (h.highF == null)
          continue

        await prisma.weatherObservation.upsert({
          where: {
            station_date: { station: this.station.icaoCode, date: h.date },
          },
          create: {
            station: this.station.icaoCode,
            date: h.date,
            highF: h.highF,
            lowF: h.lowF,
            precip: h.precip,
            weather: h.weather,
          },
          update: {
            highF: h.highF,
            lowF: h.lowF,
            precip: h.precip,
            weather: h.weather,
          },
        })
      }
      const saved = history.filter(h => h.highF != null).length
      logger.debug(`[WU] upsert ${saved} 条观测到 DB（跳过 ${history.length - saved} 条缺失数据）`)
    }
    catch (error) {
      logger.error(`[WU] 观测写入 DB 失败: ${error}`)
    }
  }

  /** 计算目标日期距今天的天数 */
  private calcLeadDays(todayStr: string, targetDateStr: string): number {
    const today = new Date(todayStr)
    const target = new Date(targetDateStr)
    return Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  }

  // ============ DB 查询（供外部使用） ============

  /**
   * 从 DB 查询指定日期的所有预报快照（不同提前天数）
   */
  async getForecastSnapshots(date: string, station?: string): Promise<{
    leadDays: number
    highF: number
    lowF: number
    fetchedAt: Date
  }[]> {
    return prisma.weatherForecast.findMany({
      where: { station: station ?? this.station.icaoCode, date },
      select: { leadDays: true, highF: true, lowF: true, fetchedAt: true },
      orderBy: { fetchedAt: 'asc' },
    })
  }

  /**
   * 从 DB 查询指定日期的实际观测
   */
  async getObservation(date: string, station?: string) {
    return prisma.weatherObservation.findUnique({
      where: {
        station_date: { station: station ?? this.station.icaoCode, date },
      },
    })
  }

  /**
   * 从 DB 查询最近 N 天的观测记录
   */
  async getRecentObservations(days: number = 30, station?: string) {
    return prisma.weatherObservation.findMany({
      where: { station: station ?? this.station.icaoCode },
      orderBy: { date: 'desc' },
      take: days,
    })
  }

  // ============ SSR 页面抓取 ============

  /**
   * 抓取 forecast 页面并提取 app-root-state JSON
   */
  private async fetchForecastPage(): Promise<WURootState> {
    // 检查缓存
    if (this.forecastCache && this.forecastCache.expiresAt > new Date()) {
      this.lastSuccessFetchedAt = this.forecastCache.fetchedAt
      return this.forecastCache.data
    }

    const url = `https://www.wunderground.com/forecast/${this.station.urlPath}/${this.station.icaoCode}`
    try {
      const state = await this.fetchAndParseSSR(url)
      this.consecutiveFailures = 0
      this.lastSuccessFetchedAt = new Date()
      this.forecastCache = {
        data: state,
        fetchedAt: new Date(),
        expiresAt: new Date(Date.now() + this.forecastCacheTTL),
      }
      return state
    }
    catch (err) {
      this.consecutiveFailures++
      if (this.consecutiveFailures >= 3) {
        logger.error(`[WU] 连续抓取失败已达 ${this.consecutiveFailures} 次`, err)
      }
      throw err
    }
  }

  /**
   * 抓取 history 页面并提取 app-root-state JSON
   * @param date 格式 YYYY-M-D
   */
  async fetchHistoryPage(date: string): Promise<WURootState> {
    const cacheKey = `history_${date}`
    const cached = this.historyCache.get(cacheKey)
    if (cached && cached.expiresAt > new Date()) {
      return cached.data
    }

    const url = `https://www.wunderground.com/history/daily/${this.station.urlPath}/${this.station.icaoCode}/date/${date}`
    const state = await this.fetchAndParseSSR(url)

    this.historyCache.set(cacheKey, {
      data: state,
      fetchedAt: new Date(),
      expiresAt: new Date(Date.now() + this.historyCacheTTL),
    })

    return state
  }

  /**
   * 核心：抓取页面并提取 <script id="app-root-state"> 中的 JSON
   * 失败时由调用方（如 fetchForecastPage）记录连续失败次数
   */
  private async fetchAndParseSSR(url: string): Promise<WURootState> {
    logger.debug(`[WU] 抓取页面: ${url}`)

    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 30000,
    })

    const html = response.data as string
    const match = html.match(/<script id="app-root-state" type="application\/json">([^<]+)<\/script>/)

    if (!match?.[1]) {
      throw new Error(`[WU] 未找到 app-root-state 数据: ${url}`)
    }

    try {
      return JSON.parse(match[1]) as WURootState
    }
    catch (error) {
      throw new Error(`[WU] JSON 解析失败: ${url} - ${error}`)
    }
  }

  // ============ 数据查找 ============

  /**
   * 在 SSR 状态中按 API 路径查找数据
   * 数字 key 对应不同的 API 端点，通过 'u' 字段（URL）匹配
   */
  private findDataByApiPath(state: WURootState, apiPath: string): unknown {
    for (const [key, value] of Object.entries(state)) {
      if (!key.match(/^\d+$/))
        continue

      const entry = value as WURootStateEntry
      if (entry?.u?.includes(apiPath) && entry.s === 200) {
        return entry.b
      }
    }
    return null
  }

  // ============ 数据解析 ============

  private parseDailyForecasts(raw: WUDailyForecast): DayForecast[] {
    const forecasts: DayForecast[] = []
    const daypart = raw.daypart?.[0]

    for (let i = 0; i < raw.validTimeLocal.length; i++) {
      const date = raw.validTimeLocal[i]?.slice(0, 10)
      if (!date)
        continue

      const highF = raw.temperatureMax[i]
      if (highF == null)
        continue

      forecasts.push({
        date,
        highF,
        lowF: raw.temperatureMin[i] ?? 0,
        dayOfWeek: raw.dayOfWeek[i] ?? '',
        narrative: raw.narrative[i] ?? '',
        // daypart 数组每2个元素对应1天（日/夜）
        precipChanceDay: daypart?.precipChance?.[i * 2] ?? null,
        precipChanceNight: daypart?.precipChance?.[i * 2 + 1] ?? null,
        qpf: raw.qpf[i] ?? 0,
      })
    }

    return forecasts
  }

  private parseHistoricalDaily(raw: WUHistoricalDailySummary): DayHistory[] {
    const history: DayHistory[] = []

    for (let i = 0; i < raw.validTimeLocal.length; i++) {
      const date = raw.validTimeLocal[i]?.slice(0, 10)
      if (!date)
        continue

      history.push({
        date,
        highF: raw.temperatureMax[i] ?? null,
        lowF: raw.temperatureMin[i] ?? null,
        dayOfWeek: raw.dayOfWeek[i] ?? '',
        precip: raw.precip24Hour[i] ?? 0,
        weather: raw.wxPhraseLongDay[i] ?? '',
      })
    }

    return history
  }
}

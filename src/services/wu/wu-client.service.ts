/**
 * Weather Underground 数据采集服务
 *
 * 通过抓取 wunderground.com 页面的 SSR 数据（<script id="app-root-state">）
 * 获取天气预报和历史观测数据。
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
  historicalHourly1day: '/v3/wx/conditions/historical/hourly/1day',
  currentObs: '/v3/wx/observations/current',
}

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export class WUClientService {
  private forecastCache: CacheEntry<WURootState> | null = null
  private historyCache = new Map<string, CacheEntry<WURootState>>()

  /** 预报缓存时长（毫秒） */
  private forecastCacheTTL: number
  /** 历史数据缓存时长（毫秒） */
  private historyCacheTTL: number

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
   * 获取 10 天逐日预报，解析为简化结构
   */
  async getDailyForecasts(): Promise<DayForecast[]> {
    const state = await this.fetchForecastPage()
    const raw = this.findDataByApiPath(state, API_PATHS.forecast10day) as WUDailyForecast | null

    if (!raw) {
      logger.warn('[WU] 未找到10天预报数据')
      return []
    }

    return this.parseDailyForecasts(raw)
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
   * 获取 30 天历史每日摘要
   */
  async getHistoricalDaily(): Promise<DayHistory[]> {
    const state = await this.fetchForecastPage()
    const raw = this.findDataByApiPath(state, API_PATHS.historicalDaily30day) as WUHistoricalDailySummary | null

    if (!raw) {
      logger.warn('[WU] 未找到30天历史数据')
      return []
    }

    return this.parseHistoricalDaily(raw)
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

  /** 清除缓存 */
  clearCache(): void {
    this.forecastCache = null
    this.historyCache.clear()
  }

  // ============ SSR 页面抓取 ============

  /**
   * 抓取 forecast 页面并提取 app-root-state JSON
   */
  private async fetchForecastPage(): Promise<WURootState> {
    // 检查缓存
    if (this.forecastCache && this.forecastCache.expiresAt > new Date()) {
      return this.forecastCache.data
    }

    const url = `https://www.wunderground.com/forecast/${this.station.urlPath}/${this.station.icaoCode}`
    const state = await this.fetchAndParseSSR(url)

    this.forecastCache = {
      data: state,
      fetchedAt: new Date(),
      expiresAt: new Date(Date.now() + this.forecastCacheTTL),
    }

    return state
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
        highF: raw.temperatureMax[i] ?? 0,
        lowF: raw.temperatureMin[i] ?? 0,
        dayOfWeek: raw.dayOfWeek[i] ?? '',
        precip: raw.precip24Hour[i] ?? 0,
        weather: raw.wxPhraseLongDay[i] ?? '',
      })
    }

    return history
  }
}

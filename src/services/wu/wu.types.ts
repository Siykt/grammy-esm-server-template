/**
 * Weather Underground 数据类型定义
 * 基于 api.weather.com 的 SSR 数据结构
 */

// ============ 预报数据 ============

/** 10天逐日预报 */
export interface WUDailyForecast {
  /** 日期（本地时间） */
  validTimeLocal: string[]
  /** UTC 时间戳 */
  validTimeUtc: number[]
  /** 星期几 */
  dayOfWeek: string[]
  /** 最高温度 (°F) */
  temperatureMax: (number | null)[]
  /** 最低温度 (°F) */
  temperatureMin: (number | null)[]
  /** 叙述性描述 */
  narrative: string[]
  /** 降水量 (英寸) */
  qpf: number[]
  /** 降雨量 */
  qpfRain: number[]
  /** 降雪量 */
  qpfSnow: number[]
  /** 日间/夜间分段预报 */
  daypart: WUDaypart[]
}

/** 日间/夜间分段预报数据 */
export interface WUDaypart {
  dayOrNight: string[]
  daypartName: string[]
  temperature: (number | null)[]
  precipChance: (number | null)[]
  precipType: (string | null)[]
  narrative: (string | null)[]
  wxPhraseLong: (string | null)[]
  windSpeed: (number | null)[]
  windDirectionCardinal: (string | null)[]
  cloudCover: (number | null)[]
  relativeHumidity: (number | null)[]
}

/** 逐小时预报 */
export interface WUHourlyForecast {
  validTimeLocal: string[]
  validTimeUtc: number[]
  temperature: number[]
  temperatureFeelsLike: number[]
  relativeHumidity: number[]
  precipChance: number[]
  precipType: string[]
  windSpeed: number[]
  windDirectionCardinal: string[]
  wxPhraseLong: string[]
  iconCode: number[]
}

// ============ 历史数据 ============

/** 30天历史每日摘要 */
export interface WUHistoricalDailySummary {
  /** 日期（本地时间），按倒序排列 */
  validTimeLocal: string[]
  validTimeUtc: number[]
  dayOfWeek: string[]
  /** 实际最高温度 (°F) */
  temperatureMax: number[]
  /** 实际最低温度 (°F) */
  temperatureMin: number[]
  /** 降水量 */
  precip24Hour: number[]
  rain24Hour: number[]
  snow24Hour: number[]
  wxPhraseLongDay: string[]
  wxPhraseLongNight: string[]
}

/** 逐小时历史观测 */
export interface WUHistoricalHourly {
  validTimeLocal: string[]
  validTimeUtc: number[]
  temperature: number[]
  temperatureFeelsLike: number[]
  temperatureMax24Hour: number[]
  temperatureMin24Hour: number[]
  temperatureMaxSince7Am: number[]
  relativeHumidity: number[]
  precip24Hour: number[]
  windSpeed: number[]
  windDirectionCardinal: string[]
  wxPhraseLong: string[]
  visibility: number[]
  pressureAltimeter: number[]
}

// ============ 解析后的简化结构 ============

/** 单日预报 */
export interface DayForecast {
  /** 日期 YYYY-MM-DD */
  date: string
  /** 预报最高温 (°F) */
  highF: number
  /** 预报最低温 (°F) */
  lowF: number
  /** 星期几 */
  dayOfWeek: string
  /** 叙述描述 */
  narrative: string
  /** 降水概率 (白天) */
  precipChanceDay: number | null
  /** 降水概率 (夜间) */
  precipChanceNight: number | null
  /** 降水量 (英寸) */
  qpf: number
}

/** 单日历史记录 */
export interface DayHistory {
  /** 日期 YYYY-MM-DD */
  date: string
  /** 实际最高温 (°F) */
  highF: number
  /** 实际最低温 (°F) */
  lowF: number
  /** 星期几 */
  dayOfWeek: string
  /** 降水量 */
  precip: number
  /** 天气描述 */
  weather: string
}

/** 预报与实际的偏差记录 */
export interface ForecastDeviation {
  /** 日期 YYYY-MM-DD */
  date: string
  /** 预报高温 */
  forecastHigh: number
  /** 实际高温 */
  actualHigh: number
  /** 偏差 = 预报 - 实际 */
  deviationHigh: number
  /** 预报低温 */
  forecastLow: number
  /** 实际低温 */
  actualLow: number
  /** 偏差 = 预报 - 实际 */
  deviationLow: number
  /** 预报提前天数（0=当天，1=1天前...） */
  leadDays: number
}

/** 温度区间概率分布 */
export interface TemperatureBucket {
  /** 区间标签，如 "40-41" 或 "<=39" 或 ">=54" */
  label: string
  /** 下界 (°F)，null表示开放下界 */
  lowerBound: number | null
  /** 上界 (°F)，null表示开放上界 */
  upperBound: number | null
  /** 落入该区间的概率 (0-1) */
  probability: number
}

/** 预报准确率统计 */
export interface ForecastAccuracy {
  /** 样本数量 */
  sampleSize: number
  /** 平均偏差 (°F)，正值=预报偏高 */
  meanDeviation: number
  /** 偏差标准差 */
  stdDeviation: number
  /** 中位数偏差 */
  medianDeviation: number
  /** 落入 ±2°F 的频率 */
  within2F: number
  /** 落入 ±5°F 的频率 */
  within5F: number
  /** 偏差分布（按1°F分桶） */
  deviationDistribution: Map<number, number>
}

// ============ SSR 数据结构 ============

/** app-root-state 中每个数据块的结构 */
export interface WURootStateEntry {
  /** HTTP 状态码 */
  s: number
  /** 状态文本 */
  st: string
  /** API URL */
  u: string
  /** 响应体 */
  b: unknown
  /** 请求头 */
  h?: unknown
}

/** app-root-state 的完整结构 */
export interface WURootState {
  [key: string]: WURootStateEntry | unknown
  'process.env'?: Record<string, string>
  'wu-next-state-key'?: Record<string, unknown>
}

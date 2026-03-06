/**
 * Weather Underground 预报准确率分析服务
 *
 * 通过对比 WU 预报数据与实际观测数据，计算预报准确率。
 * 数据来源：SQLite 中的 WeatherForecast + WeatherObservation 表
 *
 * 渐进式设计：
 *   V1: 简单区间频率法 - 统计预报偏差落入各区间的频率
 *   V2（预留）: 正态分布拟合 - 用偏差的均值和标准差建模
 *   V3（预留）: 非参数核密度估计 - 更精确的概率分布
 */

import type { WUClientService } from './wu-client.service.js'
import type {
  ForecastAccuracy,
  ForecastDeviation,
  TemperatureBucket,
} from './wu.types.js'
import logger from '../../common/logger.js'
import { prisma } from '../../common/prisma.js'

export class WUAccuracyAnalyzer {
  /** 内存中的偏差记录（从 DB 加载 + 新采集） */
  private deviations: ForecastDeviation[] = []
  /** 手动添加的偏差记录，loadFromDB 后会合并回 deviations */
  private manualDeviations: ForecastDeviation[] = []

  constructor(
    private wuClient: WUClientService,
    private station: string = 'KLGA',
  ) {}

  // ============ 数据采集 ============

  /**
   * 从 DB 加载所有可计算偏差的记录
   * 找 WeatherForecast 和 WeatherObservation 中日期重叠的数据
   */
  async loadFromDB(): Promise<ForecastDeviation[]> {
    // 获取所有观测
    const observations = await prisma.weatherObservation.findMany({
      where: { station: this.station },
      orderBy: { date: 'desc' },
    })

    if (observations.length === 0) {
      logger.info('[WU准确率] DB 中无观测数据')
      return []
    }

    const obsDates = observations.map(o => o.date)

    // 对每个有观测的日期，找对应的预报记录
    // 优先用 leadDays=1（提前1天的预报，最接近交易场景）
    const forecasts = await prisma.weatherForecast.findMany({
      where: {
        station: this.station,
        date: { in: obsDates },
      },
      orderBy: [{ date: 'asc' }, { leadDays: 'asc' }, { fetchedAt: 'asc' }],
    })

    // 按 (date, leadDays) 分组，每组取最新一条
    const forecastMap = new Map<string, { highF: number, lowF: number, leadDays: number }>()
    for (const f of forecasts) {
      const key = `${f.date}_${f.leadDays}`
      // 保留每个 (date, leadDays) 组合的最新一条
      forecastMap.set(key, { highF: f.highF, lowF: f.lowF, leadDays: f.leadDays })
    }

    // 构建偏差记录（保留每个 date + leadDays 组合，供 lead days 分层使用）
    const obsMap = new Map(observations.map(o => [o.date, o]))
    const deviations: ForecastDeviation[] = []

    for (const [key, forecast] of forecastMap) {
      const date = key.split('_')[0] ?? ''
      const obs = obsMap.get(date)
      if (!obs)
        continue

      // 跳过观测数据不完整的记录
      if (obs.highF == null)
        continue

      deviations.push({
        date,
        forecastHigh: forecast.highF,
        actualHigh: obs.highF,
        deviationHigh: forecast.highF - obs.highF,
        forecastLow: forecast.lowF,
        actualLow: obs.lowF ?? null,
        deviationLow: obs.lowF != null ? forecast.lowF - obs.lowF : null,
        leadDays: forecast.leadDays,
      })
    }

    this.deviations = deviations
    this.mergeManualDeviations()
    logger.info(`[WU准确率] 从 DB 加载 ${deviations.length} 条偏差记录`)
    return this.deviations
  }

  /** 将 manualDeviations 合并到 deviations（按日期去重，保留已有） */
  private mergeManualDeviations(): void {
    const existingDates = new Set(this.deviations.map(d => d.date))
    for (const d of this.manualDeviations) {
      if (!existingDates.has(d.date)) {
        this.deviations.push(d)
        existingDates.add(d.date)
      }
    }
  }

  /**
   * 采集当前可用的偏差数据（抓取页面 + 写入 DB + 加载）
   */
  async collectDeviations(): Promise<ForecastDeviation[]> {
    // 1. 先抓取最新数据（自动写入 DB）
    await Promise.all([
      this.wuClient.getDailyForecasts(),
      this.wuClient.getHistoricalDaily(),
    ])

    // 2. 从 DB 加载所有偏差
    return this.loadFromDB()
  }

  /**
   * 手动添加偏差记录（补充数据）
   * 同时写入 manualDeviations，loadFromDB 后会合并回 deviations
   */
  addDeviations(deviations: ForecastDeviation[]): void {
    const existingDates = new Set(this.deviations.map(d => d.date))
    const manualDates = new Set(this.manualDeviations.map(d => d.date))
    for (const d of deviations) {
      if (!existingDates.has(d.date)) {
        this.deviations.push(d)
        existingDates.add(d.date)
      }
      if (!manualDates.has(d.date)) {
        this.manualDeviations.push(d)
        manualDates.add(d.date)
      }
    }
  }

  /** 获取所有偏差记录 */
  getDeviations(): ForecastDeviation[] {
    return [...this.deviations]
  }

  // ============ DB 查询 ============

  /**
   * 按 leadDays 分组获取准确率
   * 用于分析不同提前天数的预报质量
   */
  async getAccuracyByLeadDays(): Promise<Map<number, ForecastAccuracy>> {
    const forecasts = await prisma.weatherForecast.findMany({
      where: { station: this.station },
    })

    const observations = await prisma.weatherObservation.findMany({
      where: { station: this.station },
    })

    const obsMap = new Map(observations.map(o => [o.date, o]))
    const byLeadDays = new Map<number, number[]>()

    for (const f of forecasts) {
      const obs = obsMap.get(f.date)
      if (!obs || obs.highF == null)
        continue

      const deviation = f.highF - obs.highF
      const existing = byLeadDays.get(f.leadDays) ?? []
      existing.push(deviation)
      byLeadDays.set(f.leadDays, existing)
    }

    const result = new Map<number, ForecastAccuracy>()
    for (const [leadDays, deviations] of byLeadDays) {
      result.set(leadDays, this.calculateAccuracy(deviations))
    }

    return result
  }

  /**
   * 获取 DB 中的数据统计
   */
  async getDBStats(): Promise<{ forecasts: number, observations: number, deviations: number }> {
    const [forecasts, observations] = await Promise.all([
      prisma.weatherForecast.count({ where: { station: this.station } }),
      prisma.weatherObservation.count({ where: { station: this.station } }),
    ])
    return { forecasts, observations, deviations: this.deviations.length }
  }

  // ============ 准确率统计 ============

  /**
   * 计算高温预报准确率
   */
  getHighTempAccuracy(): ForecastAccuracy {
    return this.calculateAccuracy(this.deviations.map(d => d.deviationHigh))
  }

  /**
   * 计算低温预报准确率
   * 过滤掉 actualLow/deviationLow 为 null 的记录（观测缺失）
   */
  getLowTempAccuracy(): ForecastAccuracy {
    const lowDeviations = this.deviations
      .filter((d): d is ForecastDeviation & { deviationLow: number } => d.deviationLow !== null)
      .map(d => d.deviationLow)
    return this.calculateAccuracy(lowDeviations)
  }

  private calculateAccuracy(deviations: number[]): ForecastAccuracy {
    if (deviations.length === 0) {
      return {
        sampleSize: 0,
        meanDeviation: 0,
        stdDeviation: 0,
        medianDeviation: 0,
        within2F: 0,
        within5F: 0,
        deviationDistribution: new Map(),
      }
    }

    const n = deviations.length
    const mean = deviations.reduce((s, d) => s + d, 0) / n
    // 样本方差（Bessel 校正），n === 1 时方差为 0
    const variance = n > 1
      ? deviations.reduce((s, d) => s + (d - mean) ** 2, 0) / (n - 1)
      : 0
    const std = Math.sqrt(variance)

    const sorted = [...deviations].sort((a, b) => a - b)
    const median = n % 2 === 0
      ? ((sorted[n / 2 - 1] ?? 0) + (sorted[n / 2] ?? 0)) / 2
      : sorted[Math.floor(n / 2)] ?? 0

    const within2 = deviations.filter(d => Math.abs(d) <= 2).length / n
    const within5 = deviations.filter(d => Math.abs(d) <= 5).length / n

    // 按1°F分桶的分布
    const dist = new Map<number, number>()
    for (const d of deviations) {
      const bucket = Math.round(d)
      dist.set(bucket, (dist.get(bucket) ?? 0) + 1)
    }
    // 转为频率
    for (const [k, v] of dist) {
      dist.set(k, v / n)
    }

    return {
      sampleSize: n,
      meanDeviation: mean,
      stdDeviation: std,
      medianDeviation: median,
      within2F: within2,
      within5F: within5,
      deviationDistribution: dist,
    }
  }

  // ============ 概率分布计算 ============

  /** Lead days 分档：近期 0-2 天、中期 3-5 天、远期 6+ 天 */
  private static readonly LEAD_DAYS_MIN_SAMPLES = 5
  private static readonly STD_FLOOR_RECENT = 2.0
  private static readonly STD_FLOOR_MID = 3.5
  private static readonly STD_FLOOR_LONG = 5.0
  /** Wilson 区间置信水平 95% 对应 z */
  private static readonly WILSON_Z = 1.96

  /**
   * Wilson 分数区间下界（小样本二项比例保守估计）
   * 用于对频率法概率做置信度折扣，避免虚假 edge
   */
  private static wilsonLowerBound(p: number, n: number, z: number = WUAccuracyAnalyzer.WILSON_Z): number {
    if (n <= 0)
      return 0
    if (p <= 0)
      return 0
    if (p >= 1)
      return 1
    const z2n = (z * z) / n
    const denom = 1 + z2n
    const radicand = (p * (1 - p)) / n + (z * z) / (4 * n * n)
    const sqrt = Math.sqrt(radicand)
    const lower = (p + z2n / 2 - z * sqrt) / denom
    return Math.max(0, Math.min(1, lower))
  }

  /**
   * 对频率法得到的各区间概率应用 Wilson 下界并重新归一化
   */
  private applyWilsonLowerBounds(buckets: TemperatureBucket[], n: number): TemperatureBucket[] {
    if (n < 3) {
      return buckets.map(b => ({ ...b }))
    }
    const lowered = buckets.map(b => ({
      ...b,
      probability: WUAccuracyAnalyzer.wilsonLowerBound(b.probability, n),
    }))
    const total = lowered.reduce((s, b) => s + b.probability, 0)
    if (total <= 0)
      return lowered
    return lowered.map(b => ({ ...b, probability: b.probability / total }))
  }

  /**
   * 根据 leadDays 获取所属档位（用于分层概率）
   */
  private getLeadDaysBand(leadDays: number): 'recent' | 'mid' | 'long' {
    if (leadDays <= 2)
      return 'recent'
    if (leadDays <= 5)
      return 'mid'
    return 'long'
  }

  /**
   * 筛选出与给定 leadDays 同档的偏差记录
   */
  private getDeviationsForLeadDaysBand(leadDays: number): ForecastDeviation[] {
    const band = this.getLeadDaysBand(leadDays)
    return this.deviations.filter(d => this.getLeadDaysBand(d.leadDays) === band)
  }

  /**
   * 按 lead days 分层的温度区间概率
   *
   * 根据目标日期的预报提前天数（lead days）筛选同档历史偏差，
   * 近期 (0-2天) / 中期 (3-5天) / 远期 (6+天) 使用不同 std 下限，
   * 避免远期预报被高估。
   *
   * @param forecastHigh WU 预报高温 (°F)
   * @param buckets Polymarket 温度区间
   * @param leadDays 目标日期距今天数
   * @returns 每个区间的概率
   */
  calculateBucketProbabilitiesForLeadDays(
    forecastHigh: number,
    buckets: TemperatureBucket[],
    leadDays: number,
  ): TemperatureBucket[] {
    const bandDeviations = this.getDeviationsForLeadDaysBand(leadDays)
    const band = this.getLeadDaysBand(leadDays)
    const stdFloor = band === 'recent'
      ? WUAccuracyAnalyzer.STD_FLOOR_RECENT
      : band === 'mid'
        ? WUAccuracyAnalyzer.STD_FLOOR_MID
        : WUAccuracyAnalyzer.STD_FLOOR_LONG

    let result: TemperatureBucket[]
    if (bandDeviations.length >= WUAccuracyAnalyzer.LEAD_DAYS_MIN_SAMPLES) {
      result = this.frequencyBasedProbabilityWithDeviations(forecastHigh, buckets, bandDeviations)
      result = this.applyWilsonLowerBounds(result, bandDeviations.length)
    }
    else {
      logger.warn(
        `[WU准确率] lead days 档位 ${band} 样本量不足 (${bandDeviations.length})，使用正态近似 stdFloor=${stdFloor}°F`,
      )
      const accuracy = bandDeviations.length > 0
        ? this.calculateAccuracy(bandDeviations.map(d => d.deviationHigh))
        : this.getHighTempAccuracy()
      result = this.normalApproximationWithStdFloor(forecastHigh, buckets, accuracy, stdFloor)
    }

    const totalProb = result.reduce((s, b) => s + b.probability, 0)
    if (Math.abs(totalProb - 1.0) > 0.01) {
      logger.warn(`[WU准确率] 概率总和偏离 1.0: ${totalProb.toFixed(4)}，执行归一化`)
    }
    if (totalProb > 0) {
      for (const b of result) {
        b.probability = b.probability / totalProb
      }
    }
    return result
  }

  /**
   * V1: 基于偏差频率的温度区间概率
   *
   * 给定一个预报值和温度区间定义，计算每个区间的概率。
   * 方法：用历史偏差的频率分布，将预报值"偏移"到各可能的实际值，
   *       然后统计落入每个区间的频率。
   *
   * @param forecastHigh WU 预报高温 (°F)
   * @param buckets Polymarket 温度区间
   * @returns 每个区间的概率
   */
  calculateBucketProbabilities(
    forecastHigh: number,
    buckets: TemperatureBucket[],
  ): TemperatureBucket[] {
    const accuracy = this.getHighTempAccuracy()

    let result: TemperatureBucket[]
    if (accuracy.sampleSize < 10) {
      logger.warn(`[WU准确率] 样本量不足 (${accuracy.sampleSize})，使用正态近似`)
      result = this.normalApproximation(forecastHigh, buckets, accuracy)
    }
    else {
      result = this.frequencyBasedProbability(forecastHigh, buckets)
      result = this.applyWilsonLowerBounds(result, this.deviations.length)
    }

    const totalProb = result.reduce((s, b) => s + b.probability, 0)
    if (Math.abs(totalProb - 1.0) > 0.01) {
      logger.warn(`[WU准确率] 概率总和偏离 1.0: ${totalProb.toFixed(4)}，执行归一化`)
    }
    if (totalProb > 0) {
      for (const b of result) {
        b.probability = b.probability / totalProb
      }
    }
    return result
  }

  /**
   * V1 核心：频率法概率计算
   *
   * 对于每个历史偏差 d，实际温度 = 预报 - d
   * 统计实际温度落入每个区间的频率
   */
  private frequencyBasedProbability(
    forecastHigh: number,
    buckets: TemperatureBucket[],
  ): TemperatureBucket[] {
    return this.frequencyBasedProbabilityWithDeviations(forecastHigh, buckets, this.deviations)
  }

  /**
   * 使用指定偏差子集做频率法概率计算（供 lead days 分层使用）
   */
  private frequencyBasedProbabilityWithDeviations(
    forecastHigh: number,
    buckets: TemperatureBucket[],
    deviationSubset: ForecastDeviation[],
  ): TemperatureBucket[] {
    const highDeviations = deviationSubset.map(d => d.deviationHigh)
    const n = highDeviations.length
    if (n === 0) {
      return buckets.map(b => ({ ...b, probability: 0 }))
    }

    return buckets.map((bucket) => {
      let count = 0
      for (const deviation of highDeviations) {
        const actualTemp = forecastHigh - deviation
        if (this.isInBucket(actualTemp, bucket)) {
          count++
        }
      }
      return { ...bucket, probability: count / n }
    })
  }

  /**
   * 正态近似法（样本量不足时的后备方案）
   * 用偏差的均值和标准差假设正态分布
   */
  private normalApproximation(
    forecastHigh: number,
    buckets: TemperatureBucket[],
    accuracy: ForecastAccuracy,
  ): TemperatureBucket[] {
    return this.normalApproximationWithStdFloor(forecastHigh, buckets, accuracy, 3.0)
  }

  /**
   * 正态近似法，支持按 lead days 档位设置 std 下限
   */
  private normalApproximationWithStdFloor(
    forecastHigh: number,
    buckets: TemperatureBucket[],
    accuracy: ForecastAccuracy,
    stdFloor: number,
  ): TemperatureBucket[] {
    const minReliableSamples = 10
    const meanDev = accuracy.sampleSize >= minReliableSamples
      ? accuracy.meanDeviation
      : 0
    const mean = forecastHigh - meanDev
    const std = accuracy.sampleSize >= minReliableSamples
      ? Math.max(accuracy.stdDeviation, stdFloor)
      : stdFloor

    return buckets.map((bucket) => {
      const prob = this.normalCDF(bucket, mean, std)
      return { ...bucket, probability: prob }
    })
  }

  /**
   * 正态分布 CDF 区间概率
   */
  private normalCDF(bucket: TemperatureBucket, mean: number, std: number): number {
    if (std === 0) {
      // 无偏差情况：点概率
      const temp = mean
      return this.isInBucket(temp, bucket) ? 1.0 : 0.0
    }

    const lower = bucket.lowerBound ?? -Infinity
    const upper = bucket.upperBound ?? Infinity

    // P(lower <= X <= upper) = Φ((upper - mean) / std) - Φ((lower - mean) / std)
    // 注意：区间是 <=X 和 >=X，所以用 upper + 0.5 / lower - 0.5 做半度修正
    const upperZ = upper === Infinity ? Infinity : (upper + 0.5 - mean) / std
    const lowerZ = lower === -Infinity ? -Infinity : (lower - 0.5 - mean) / std

    return this.phi(upperZ) - this.phi(lowerZ)
  }

  /** 标准正态分布 CDF 近似（Abramowitz & Stegun） */
  private phi(x: number): number {
    if (x === Infinity)
      return 1
    if (x === -Infinity)
      return 0

    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    const sign = x < 0 ? -1 : 1
    const absX = Math.abs(x)
    const t = 1.0 / (1.0 + p * absX)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX / 2)

    return 0.5 * (1.0 + sign * y)
  }

  /**
   * 判断温度是否落入区间
   * Polymarket 区间使用整数华氏度，如 "40-41" 表示 40°F 或 41°F
   */
  private isInBucket(temp: number, bucket: TemperatureBucket): boolean {
    // 取整到整数（WU 数据精度为整数华氏度）
    const roundedTemp = Math.round(temp)

    if (bucket.lowerBound !== null && roundedTemp < bucket.lowerBound)
      return false
    if (bucket.upperBound !== null && roundedTemp > bucket.upperBound)
      return false
    return true
  }

  // ============ 工具方法 ============

  /**
   * 从 Polymarket 市场标题解析温度区间
   * 例如 "40°F to 41°F" → { lowerBound: 40, upperBound: 41 }
   * 例如 "39°F or below" → { lowerBound: null, upperBound: 39 }
   * 例如 "54°F or above" → { lowerBound: 54, upperBound: null }
   */
  static parseBucketFromLabel(label: string): TemperatureBucket {
    // "X°F or below" / "X°F or lower" / "<=XF"
    const belowMatch = label.match(/(\d+)°?F?\s*(or below|or lower|or less)/i) ?? label.match(/<=\s*(\d+)/)
    if (belowMatch) {
      const bound = Number.parseInt(belowMatch[1] ?? '0')
      return { label, lowerBound: null, upperBound: bound, probability: 0 }
    }

    // "X°F or above" / "X°F or higher" / ">=XF"
    const aboveMatch = label.match(/(\d+)°?F?\s*(or above|or higher|or more|\+)/i) ?? label.match(/>=\s*(\d+)/)
    if (aboveMatch) {
      const bound = Number.parseInt(aboveMatch[1] ?? '0')
      return { label, lowerBound: bound, upperBound: null, probability: 0 }
    }

    // "X°F to Y°F" / "X-YF" / "XF to YF"
    const rangeMatch = label.match(/(\d+)°?F?\s*(?:to|-)\s*(\d+)°?F?/i)
    if (rangeMatch) {
      return {
        label,
        lowerBound: Number.parseInt(rangeMatch[1] ?? '0'),
        upperBound: Number.parseInt(rangeMatch[2] ?? '0'),
        probability: 0,
      }
    }

    throw new Error(`[WU准确率] 无法解析温度区间: ${label}`)
  }

  /**
   * 从 Polymarket 事件的 market question 解析出所有区间
   * @param questions 市场问题数组，如 ["39°F or below", "40°F to 41°F", ...]
   */
  static parseBucketsFromQuestions(questions: string[]): TemperatureBucket[] {
    return questions.map(q => this.parseBucketFromLabel(q))
  }

  /**
   * 摘要打印（调试用）
   */
  async printSummary(): Promise<void> {
    const acc = this.getHighTempAccuracy()
    const stats = await this.getDBStats()
    console.log('\n=== WU 高温预报准确率 ===')
    console.log(`DB 统计: ${stats.forecasts} 条预报, ${stats.observations} 条观测, ${stats.deviations} 条偏差`)
    console.log(`样本量: ${acc.sampleSize}`)
    console.log(`平均偏差: ${acc.meanDeviation.toFixed(1)}°F（正=偏高）`)
    console.log(`标准差: ${acc.stdDeviation.toFixed(1)}°F`)
    console.log(`中位数偏差: ${acc.medianDeviation.toFixed(1)}°F`)
    console.log(`±2°F 准确率: ${(acc.within2F * 100).toFixed(0)}%`)
    console.log(`±5°F 准确率: ${(acc.within5F * 100).toFixed(0)}%`)

    if (acc.deviationDistribution.size > 0) {
      console.log('\n偏差分布 (°F → 频率):')
      const sorted = [...acc.deviationDistribution.entries()].sort((a, b) => a[0] - b[0])
      for (const [dev, freq] of sorted) {
        const bar = '█'.repeat(Math.round(freq * 50))
        console.log(`  ${dev >= 0 ? '+' : ''}${dev}: ${(freq * 100).toFixed(0)}% ${bar}`)
      }
    }
  }
}

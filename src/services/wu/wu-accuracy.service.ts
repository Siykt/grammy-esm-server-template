/**
 * Weather Underground 预报准确率分析服务
 *
 * 通过对比 WU 预报数据与实际观测数据，计算预报准确率。
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

export class WUAccuracyAnalyzer {
  /** 累积偏差记录（可持久化） */
  private deviations: ForecastDeviation[] = []

  constructor(
    private wuClient: WUClientService,
  ) {}

  // ============ 数据采集 ============

  /**
   * 采集当前可用的偏差数据
   * 对比 10 天预报中已过去的日期与 30 天历史的交集
   */
  async collectDeviations(): Promise<ForecastDeviation[]> {
    const [forecasts, history] = await Promise.all([
      this.wuClient.getDailyForecasts(),
      this.wuClient.getHistoricalDaily(),
    ])

    const historyMap = new Map(history.map(h => [h.date, h]))
    const newDeviations: ForecastDeviation[] = []

    for (const forecast of forecasts) {
      const actual = historyMap.get(forecast.date)
      if (!actual)
        continue

      // 只记录有实际数据的日期
      const deviation: ForecastDeviation = {
        date: forecast.date,
        forecastHigh: forecast.highF,
        actualHigh: actual.highF,
        deviationHigh: forecast.highF - actual.highF,
        forecastLow: forecast.lowF,
        actualLow: actual.lowF,
        deviationLow: forecast.lowF - actual.lowF,
        leadDays: 0, // 从 SSR 无法精确知道预报是几天前的
      }

      newDeviations.push(deviation)
    }

    // 合并到累积记录（去重）
    const existingDates = new Set(this.deviations.map(d => d.date))
    for (const d of newDeviations) {
      if (!existingDates.has(d.date)) {
        this.deviations.push(d)
        existingDates.add(d.date)
      }
    }

    logger.info(`[WU准确率] 采集到 ${newDeviations.length} 条新偏差记录，累计 ${this.deviations.length} 条`)
    return newDeviations
  }

  /**
   * 手动添加偏差记录（从外部数据源或持久化存储加载）
   */
  addDeviations(deviations: ForecastDeviation[]): void {
    const existingDates = new Set(this.deviations.map(d => d.date))
    for (const d of deviations) {
      if (!existingDates.has(d.date)) {
        this.deviations.push(d)
        existingDates.add(d.date)
      }
    }
  }

  /** 获取所有偏差记录 */
  getDeviations(): ForecastDeviation[] {
    return [...this.deviations]
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
   */
  getLowTempAccuracy(): ForecastAccuracy {
    return this.calculateAccuracy(this.deviations.map(d => d.deviationLow))
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
    const variance = deviations.reduce((s, d) => s + (d - mean) ** 2, 0) / n
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

    if (accuracy.sampleSize < 5) {
      logger.warn(`[WU准确率] 样本量不足 (${accuracy.sampleSize})，使用正态近似`)
      return this.normalApproximation(forecastHigh, buckets, accuracy)
    }

    // 用历史偏差频率直接计算
    return this.frequencyBasedProbability(forecastHigh, buckets)
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
    const highDeviations = this.deviations.map(d => d.deviationHigh)
    const n = highDeviations.length

    return buckets.map((bucket) => {
      let count = 0
      for (const deviation of highDeviations) {
        // 实际温度 = 预报值 - 偏差（因为偏差 = 预报 - 实际）
        const actualTemp = forecastHigh - deviation
        if (this.isInBucket(actualTemp, bucket)) {
          count++
        }
      }

      return {
        ...bucket,
        probability: count / n,
      }
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
    // 预报高温经偏差修正后的"真实"均值
    const mean = forecastHigh - accuracy.meanDeviation
    // 使用较保守的标准差（样本量小时用更大值）
    const std = accuracy.sampleSize > 0 ? accuracy.stdDeviation : 3.0 // 默认3°F标准差

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
    // "X°F or below" / "<=XF"
    const belowMatch = label.match(/(\d+)°?F?\s*(or below|or less)/i) ?? label.match(/<=\s*(\d+)/)
    if (belowMatch) {
      const bound = Number.parseInt(belowMatch[1] ?? '0')
      return { label, lowerBound: null, upperBound: bound, probability: 0 }
    }

    // "X°F or above" / ">=XF"
    const aboveMatch = label.match(/(\d+)°?F?\s*(or above|or more|\+)/i) ?? label.match(/>=\s*(\d+)/)
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
  printSummary(): void {
    const acc = this.getHighTempAccuracy()
    console.log('\n=== WU 高温预报准确率 ===')
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

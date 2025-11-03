import type { KlineCandle } from '../types.js'

interface ADXOptions {
  period?: number // Wilder 常用 14
  adxThreshold?: number // 震荡阈值，常用 < 20 判定震荡
  lookback?: number // 近 N 根做判定
}

export interface ADXResultSummary {
  isRanging: boolean
  currentAdx: number
  threshold: number
  lastNAvgAdx: number
}

export function computeADX(candles: KlineCandle[], period = 14): number[] {
  if (candles.length < period + 1)
    return []

  const highs = candles.map(c => c.high)
  const lows = candles.map(c => c.low)
  const closes = candles.map(c => c.close)

  const tr: number[] = []
  const plusDM: number[] = []
  const minusDM: number[] = []

  for (let i = 1; i < candles.length; i++) {
    const high = highs[i] ?? 0
    const low = lows[i] ?? 0
    const prevClose = closes[i - 1] ?? 0
    const prevHigh = highs[i - 1] ?? 0
    const prevLow = lows[i - 1] ?? 0

    const upMove = high - prevHigh
    const downMove = prevLow - low
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0)
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0)

    const trVal = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose),
    )
    tr.push(trVal)
  }

  // Wilder 平滑
  const smooth = (arr: number[], p: number): number[] => {
    const out: number[] = []
    // 初始值：前 p 个的和
    let sum = 0
    for (let i = 0; i < p; i++) sum += arr[i] ?? 0
    out[p - 1] = sum
    for (let i = p; i < arr.length; i++) {
      sum = (out[i - 1] ?? 0) - (out[i - 1] ?? 0) / p + (arr[i] ?? 0)
      out[i] = sum
    }
    return out
  }

  const trSmooth = smooth(tr, period)
  const plusSmooth = smooth(plusDM, period)
  const minusSmooth = smooth(minusDM, period)

  const plusDI: number[] = []
  const minusDI: number[] = []
  const dx: number[] = []
  for (let i = period - 1; i < trSmooth.length; i++) {
    const pdi = 100 * ((plusSmooth[i] ?? 0) / (trSmooth[i] ?? 0))
    const mdi = 100 * ((minusSmooth[i] ?? 0) / (trSmooth[i] ?? 0))
    plusDI.push(pdi)
    minusDI.push(mdi)
    const denom = pdi + mdi
    const dxVal = denom === 0 ? 0 : (100 * Math.abs(pdi - mdi) / denom)
    dx.push(dxVal)
  }

  // ADX 是 DX 的 Wilder 平滑
  if (dx.length < period)
    return []
  const adx: number[] = []
  let sum = 0
  for (let i = 0; i < period; i++) sum += dx[i] ?? 0
  adx[period - 1] = sum / period
  for (let i = period; i < dx.length; i++) {
    adx[i] = ((adx[i - 1] ?? 0) * (period - 1)) + (dx[i] ?? 0) / period
  }
  return adx
}

export function detectHighFrequencyRanging(candles: KlineCandle[], opts: ADXOptions = {}): ADXResultSummary {
  const period = opts.period ?? 14
  const threshold = opts.adxThreshold ?? 20
  const lookback = opts.lookback ?? 5
  const adx = computeADX(candles, period)
  if (adx.length === 0)
    return { isRanging: false, currentAdx: Number.NaN, threshold, lastNAvgAdx: Number.NaN }
  const last = adx[adx.length - 1]
  const recent = adx.slice(Math.max(0, adx.length - lookback))
  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length
  const isRanging = (last ?? 0) < threshold && (avgRecent ?? 0) < threshold
  return { isRanging, currentAdx: last ?? 0, threshold, lastNAvgAdx: avgRecent ?? 0 }
}

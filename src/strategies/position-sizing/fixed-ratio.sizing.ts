import type { PositionSizeParams } from './sizing.interface.js'
import { BasePositionSizing } from './sizing.interface.js'

/**
 * Fixed Ratio Position Sizing
 *
 * Simple position sizing that uses a fixed percentage of capital
 * for each trade. Good as a fallback or for conservative strategies.
 */
export class FixedRatioPositionSizing extends BasePositionSizing {
  constructor(
    private readonly fraction: number = 0.1, // 10% of capital by default
    private readonly maxPositionSize: number = 1000, // Maximum position size
    private readonly minPositionSize: number = 1, // Minimum position size
  ) {
    super()
  }

  /**
   * Calculate position size using fixed ratio
   */
  calculate(params: PositionSizeParams): number {
    const {
      capital,
      price,
      maxFraction = this.fraction,
      minSize = this.minPositionSize,
    } = params

    // Validate inputs
    if (capital <= 0)
      return 0
    if (price <= 0 || price >= 1)
      return 0

    // Use the smaller of configured fraction and maxFraction
    const effectiveFraction = Math.min(this.fraction, maxFraction)

    // Calculate position value
    const positionValue = capital * effectiveFraction

    // Calculate position size in shares
    let positionSize = positionValue / price

    // Apply max/min constraints
    positionSize = Math.min(positionSize, this.maxPositionSize)

    if (positionSize < minSize) {
      return 0
    }

    return this.round(positionSize)
  }

  /**
   * Get the current fraction setting
   */
  getFraction(): number {
    return this.fraction
  }
}

/**
 * Fixed Amount Position Sizing
 *
 * Uses a fixed dollar amount for each trade regardless of capital.
 */
export class FixedAmountPositionSizing extends BasePositionSizing {
  constructor(
    private readonly amount: number = 10, // $10 per trade by default
    private readonly minPositionSize: number = 1,
  ) {
    super()
  }

  /**
   * Calculate position size using fixed amount
   */
  calculate(params: PositionSizeParams): number {
    const { capital, price, minSize = this.minPositionSize } = params

    // Validate inputs
    if (capital <= 0)
      return 0
    if (price <= 0 || price >= 1)
      return 0

    // Don't trade more than we have
    const effectiveAmount = Math.min(this.amount, capital)

    // Calculate position size
    const positionSize = effectiveAmount / price

    if (positionSize < minSize) {
      return 0
    }

    return this.round(positionSize)
  }

  /**
   * Get the current amount setting
   */
  getAmount(): number {
    return this.amount
  }
}

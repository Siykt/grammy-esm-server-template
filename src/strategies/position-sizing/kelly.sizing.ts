import type { PositionSizeParams } from './sizing.interface.js'
import { BasePositionSizing } from './sizing.interface.js'

/**
 * Kelly Criterion Position Sizing
 *
 * The Kelly Criterion calculates the optimal fraction of capital to bet
 * to maximize long-term growth while minimizing risk of ruin.
 *
 * Formula: f* = (bp - q) / b
 * Where:
 *   f* = optimal fraction to bet
 *   b  = odds received (net profit if win, per $1 wagered)
 *   p  = probability of winning
 *   q  = probability of losing (1 - p)
 *
 * For prediction markets:
 *   - If we buy at price P, and win, we receive $1 (profit = 1-P)
 *   - Odds b = (1-P)/P = 1/P - 1
 */
export class KellyPositionSizing extends BasePositionSizing {
  constructor(
    private readonly kellyFraction: number = 0.5, // Half-Kelly by default
    private readonly maxBetFraction: number = 0.25, // Max 25% of capital
    private readonly minBetFraction: number = 0.01, // Min 1% of capital
  ) {
    super()
  }

  /**
   * Calculate optimal position size using Kelly Criterion
   */
  calculate(params: PositionSizeParams): number {
    const {
      capital,
      winProbability,
      odds,
      price,
      maxFraction = this.maxBetFraction,
      minSize = 1,
    } = params

    // Validate inputs
    if (capital <= 0)
      return 0
    if (winProbability <= 0 || winProbability >= 1)
      return 0
    if (odds <= 0)
      return 0
    if (price <= 0 || price >= 1)
      return 0

    // Calculate Kelly fraction
    // For prediction markets: odds = (1 - price) / price
    const effectiveOdds = odds > 0 ? odds : (1 - price) / price
    const q = 1 - winProbability

    // Kelly formula: f* = (bp - q) / b
    const fullKelly = (effectiveOdds * winProbability - q) / effectiveOdds

    // If Kelly is negative, don't bet
    if (fullKelly <= 0) {
      return 0
    }

    // Apply fractional Kelly for safety
    const fractionalKelly = fullKelly * this.kellyFraction

    // Clamp to maximum allowed fraction
    const clampedFraction = this.clamp(fractionalKelly, this.minBetFraction, maxFraction)

    // Calculate actual position size
    const positionValue = capital * clampedFraction
    const positionSize = positionValue / price

    // Ensure minimum size
    if (positionSize < minSize) {
      return 0
    }

    return this.round(positionSize)
  }

  /**
   * Calculate Kelly fraction for given parameters (for analysis)
   */
  getKellyFraction(winProbability: number, odds: number): number {
    if (winProbability <= 0 || winProbability >= 1)
      return 0
    if (odds <= 0)
      return 0

    const q = 1 - winProbability
    const kelly = (odds * winProbability - q) / odds

    return Math.max(0, kelly)
  }

  /**
   * Calculate edge (expected value per dollar bet)
   */
  getEdge(winProbability: number, odds: number): number {
    if (odds <= 0)
      return -1

    // Expected value: p * odds - (1-p)
    const q = 1 - winProbability
    return winProbability * odds - q
  }

  /**
   * Check if bet has positive expected value
   */
  hasPositiveEdge(winProbability: number, odds: number): boolean {
    return this.getEdge(winProbability, odds) > 0
  }
}

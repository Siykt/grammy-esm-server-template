import type { IPositionSizing, PositionSizeParams } from '../base/strategy.interface.js'

/**
 * Position Sizing Interface (re-export for convenience)
 */
export type { IPositionSizing, PositionSizeParams }

/**
 * Base position sizing class with common utilities
 */
export abstract class BasePositionSizing implements IPositionSizing {
  abstract calculate(params: PositionSizeParams): number

  /**
   * Clamp value between min and max
   */
  protected clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }

  /**
   * Round to reasonable precision
   */
  protected round(value: number, decimals: number = 4): number {
    const multiplier = 10 ** decimals
    return Math.round(value * multiplier) / multiplier
  }
}

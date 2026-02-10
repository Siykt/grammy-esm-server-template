import type { Position } from '../domain/entities/position.entity.js'
import type { ITakeProfitHandler, TakeProfitConfig } from './risk-manager.interface.js'
import logger from '../common/logger.js'

/**
 * Take-Profit Handler
 *
 * Implements various take-profit strategies:
 * - Fixed: Trigger at a specific price
 * - Percentage: Trigger at a percentage profit from entry
 * - Partial: Close a portion of the position at target
 */
export class TakeProfitHandler implements ITakeProfitHandler {
  /**
   * Evaluate if take-profit should be triggered
   */
  evaluate(position: Position, config: TakeProfitConfig): boolean {
    if (!config.activated) {
      return false
    }

    const triggerPrice = config.triggerPrice ?? this.calculateTriggerPrice(position, config)
    const currentPrice = position.currentPrice.amount

    // For long positions, take-profit triggers when price rises above trigger
    // For short positions, take-profit triggers when price falls below trigger
    if (position.side.isBuy) {
      const triggered = currentPrice >= triggerPrice
      if (triggered) {
        logger.info(
          `[TakeProfit] LONG position triggered: current=${currentPrice.toFixed(4)} >= trigger=${triggerPrice.toFixed(4)}`,
        )
      }
      return triggered
    }
    else {
      const triggered = currentPrice <= triggerPrice
      if (triggered) {
        logger.info(
          `[TakeProfit] SHORT position triggered: current=${currentPrice.toFixed(4)} <= trigger=${triggerPrice.toFixed(4)}`,
        )
      }
      return triggered
    }
  }

  /**
   * Calculate the trigger price based on configuration
   */
  calculateTriggerPrice(position: Position, config: TakeProfitConfig): number {
    const entryPrice = position.avgEntryPrice.amount

    switch (config.type) {
      case 'fixed':
        return config.value

      case 'percentage':
      case 'partial': {
        // config.value is the percentage profit to trigger (e.g., 10 for 10%)
        const profitMultiplier = config.value / 100
        if (position.side.isBuy) {
          // Long: trigger price is above entry
          return entryPrice * (1 + profitMultiplier)
        }
        else {
          // Short: trigger price is below entry
          return entryPrice * (1 - profitMultiplier)
        }
      }

      default:
        return 0
    }
  }

  /**
   * Calculate the size to close for partial take-profit
   */
  calculatePartialSize(position: Position, config: TakeProfitConfig): number {
    if (config.type !== 'partial' || !config.partialPercent) {
      // Full close
      return position.size.amount
    }

    // Close a percentage of the position
    const partialSize = position.size.amount * (config.partialPercent / 100)
    return Math.floor(partialSize) // Round down to whole shares
  }

  /**
   * Create a fixed take-profit config
   */
  static createFixed(triggerPrice: number): TakeProfitConfig {
    return {
      type: 'fixed',
      value: triggerPrice,
      activated: true,
      triggerPrice,
    }
  }

  /**
   * Create a percentage-based take-profit config
   */
  static createPercentage(profitPercent: number): TakeProfitConfig {
    return {
      type: 'percentage',
      value: profitPercent,
      activated: true,
    }
  }

  /**
   * Create a partial take-profit config
   * @param profitPercent Target profit percentage to trigger
   * @param closePercent Percentage of position to close when triggered
   */
  static createPartial(profitPercent: number, closePercent: number): TakeProfitConfig {
    return {
      type: 'partial',
      value: profitPercent,
      partialPercent: closePercent,
      activated: true,
    }
  }
}

import type { Position } from '../domain/entities/position.entity.js'
import type { IStopLossHandler, StopLossConfig } from './risk-manager.interface.js'
import logger from '../common/logger.js'

/**
 * Stop-Loss Handler
 *
 * Implements various stop-loss strategies:
 * - Fixed: Trigger at a specific price
 * - Percentage: Trigger at a percentage loss from entry
 * - Trailing: Dynamic stop that follows price movement
 */
export class StopLossHandler implements IStopLossHandler {
  /**
   * Evaluate if stop-loss should be triggered
   */
  evaluate(position: Position, config: StopLossConfig): boolean {
    if (!config.activated) {
      return false
    }

    const triggerPrice = config.triggerPrice ?? this.calculateTriggerPrice(position, config)
    const currentPrice = position.currentPrice.amount

    // For long positions, stop-loss triggers when price falls below trigger
    // For short positions, stop-loss triggers when price rises above trigger
    if (position.side.isBuy) {
      const triggered = currentPrice <= triggerPrice
      if (triggered) {
        logger.info(
          `[StopLoss] LONG position triggered: current=${currentPrice.toFixed(4)} <= trigger=${triggerPrice.toFixed(4)}`,
        )
      }
      return triggered
    }
    else {
      const triggered = currentPrice >= triggerPrice
      if (triggered) {
        logger.info(
          `[StopLoss] SHORT position triggered: current=${currentPrice.toFixed(4)} >= trigger=${triggerPrice.toFixed(4)}`,
        )
      }
      return triggered
    }
  }

  /**
   * Calculate the trigger price based on configuration
   */
  calculateTriggerPrice(position: Position, config: StopLossConfig): number {
    const entryPrice = position.avgEntryPrice.amount

    switch (config.type) {
      case 'fixed':
        return config.value

      case 'percentage': {
        // config.value is the percentage loss to trigger (e.g., 5 for 5%)
        const lossMultiplier = config.value / 100
        if (position.side.isBuy) {
          // Long: trigger price is below entry
          return entryPrice * (1 - lossMultiplier)
        }
        else {
          // Short: trigger price is above entry
          return entryPrice * (1 + lossMultiplier)
        }
      }

      case 'trailing': {
        // For trailing stop, use the current trigger price if set
        // Otherwise calculate from current price
        if (config.triggerPrice !== undefined) {
          return config.triggerPrice
        }
        const trailingOffset = config.trailingOffset ?? config.value
        const currentPrice = position.currentPrice.amount
        if (position.side.isBuy) {
          return currentPrice * (1 - trailingOffset / 100)
        }
        else {
          return currentPrice * (1 + trailingOffset / 100)
        }
      }

      default:
        return 0
    }
  }

  /**
   * Update trailing stop based on price movement
   * Returns updated config if trailing stop should be adjusted
   */
  updateTrailingStop(position: Position, config: StopLossConfig): StopLossConfig {
    if (config.type !== 'trailing' || !config.activated) {
      return config
    }

    const currentPrice = position.currentPrice.amount
    const trailingOffset = config.trailingOffset ?? config.value
    const currentTrigger = config.triggerPrice ?? 0

    // Calculate new potential trigger price
    let newTrigger: number

    if (position.side.isBuy) {
      // Long position: trail upward movement
      // New trigger = currentPrice * (1 - offset%)
      newTrigger = currentPrice * (1 - trailingOffset / 100)

      // Only update if new trigger is higher (price moved up)
      if (newTrigger > currentTrigger) {
        logger.debug(
          `[StopLoss] Trailing stop updated: ${currentTrigger.toFixed(4)} -> ${newTrigger.toFixed(4)}`,
        )
        return {
          ...config,
          triggerPrice: newTrigger,
        }
      }
    }
    else {
      // Short position: trail downward movement
      // New trigger = currentPrice * (1 + offset%)
      newTrigger = currentPrice * (1 + trailingOffset / 100)

      // Only update if new trigger is lower (price moved down)
      if (currentTrigger === 0 || newTrigger < currentTrigger) {
        logger.debug(
          `[StopLoss] Trailing stop updated: ${currentTrigger.toFixed(4)} -> ${newTrigger.toFixed(4)}`,
        )
        return {
          ...config,
          triggerPrice: newTrigger,
        }
      }
    }

    return config
  }

  /**
   * Create a fixed stop-loss config
   */
  static createFixed(triggerPrice: number): StopLossConfig {
    return {
      type: 'fixed',
      value: triggerPrice,
      activated: true,
      triggerPrice,
    }
  }

  /**
   * Create a percentage-based stop-loss config
   */
  static createPercentage(lossPercent: number): StopLossConfig {
    return {
      type: 'percentage',
      value: lossPercent,
      activated: true,
    }
  }

  /**
   * Create a trailing stop-loss config
   */
  static createTrailing(trailingPercent: number): StopLossConfig {
    return {
      type: 'trailing',
      value: trailingPercent,
      trailingOffset: trailingPercent,
      activated: true,
    }
  }
}

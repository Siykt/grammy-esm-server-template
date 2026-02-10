import type { Position } from '../domain/entities/position.entity.js'
import { Side } from '../domain/value-objects/side.vo.js'
import { BaseCollection } from './collection.interface.js'

/**
 * Position Collection
 * Specialized collection for managing Position entities
 */
export class PositionCollection extends BaseCollection<Position> {
  /**
   * Filter positions by market ID
   */
  filterByMarket(marketId: string): Position[] {
    return this.filter(p => p.marketId === marketId)
  }

  /**
   * Filter positions by side
   */
  filterBySide(side: Side): Position[] {
    return this.filter(p => p.side.equals(side))
  }

  /**
   * Filter positions by minimum PnL
   */
  filterByPnL(minPnL: number): Position[] {
    return this.filter(p => p.unrealizedPnL >= minPnL)
  }

  /**
   * Filter profitable positions
   */
  filterProfitable(): Position[] {
    return this.filter(p => p.isProfitable)
  }

  /**
   * Filter losing positions
   */
  filterLosing(): Position[] {
    return this.filter(p => p.isAtLoss)
  }

  /**
   * Get all open positions (with size > 0)
   */
  getOpenPositions(): Position[] {
    return this.filter(p => p.isOpen)
  }

  /**
   * Get long positions
   */
  getLongPositions(): Position[] {
    return this.filterBySide(Side.BUY)
  }

  /**
   * Get short positions
   */
  getShortPositions(): Position[] {
    return this.filterBySide(Side.SELL)
  }

  /**
   * Calculate total unrealized PnL
   */
  getTotalUnrealizedPnL(): number {
    return this.reduce((sum, p) => sum + p.unrealizedPnL, 0)
  }

  /**
   * Calculate total realized PnL
   */
  getTotalRealizedPnL(): number {
    return this.reduce((sum, p) => sum + p.realizedPnL, 0)
  }

  /**
   * Calculate total PnL (realized + unrealized)
   */
  getTotalPnL(): number {
    return this.getTotalRealizedPnL() + this.getTotalUnrealizedPnL()
  }

  /**
   * Calculate total exposure (sum of current values)
   */
  getTotalExposure(): number {
    return this.reduce((sum, p) => sum + p.currentValue, 0)
  }

  /**
   * Calculate total entry value
   */
  getTotalEntryValue(): number {
    return this.reduce((sum, p) => sum + p.entryValue, 0)
  }

  /**
   * Group positions by market
   */
  groupByMarket(): Map<string, Position[]> {
    return this.groupBy(p => p.marketId)
  }

  /**
   * Sort positions by unrealized PnL
   */
  sortByPnL(desc: boolean = true): Position[] {
    return this.sortBy(p => p.unrealizedPnL, desc)
  }

  /**
   * Sort positions by size
   */
  sortBySize(desc: boolean = true): Position[] {
    return this.sortBy(p => p.size.amount, desc)
  }

  /**
   * Sort positions by value
   */
  sortByValue(desc: boolean = true): Position[] {
    return this.sortBy(p => p.currentValue, desc)
  }

  /**
   * Get positions sorted by risk level (worst PnL% first)
   */
  getPositionsByRisk(): Position[] {
    return this.sortBy(p => p.unrealizedPnLPercent, false) // Ascending (worst first)
  }

  /**
   * Get largest positions by value
   */
  getLargestPositions(limit: number = 5): Position[] {
    return this.sortByValue(true).slice(0, limit)
  }

  /**
   * Get best performing positions
   */
  getBestPerformers(limit: number = 5): Position[] {
    return this.sortByPnL(true).slice(0, limit)
  }

  /**
   * Get worst performing positions
   */
  getWorstPerformers(limit: number = 5): Position[] {
    return this.sortByPnL(false).slice(0, limit)
  }

  /**
   * Calculate win rate (profitable / total)
   */
  getWinRate(): number {
    const open = this.getOpenPositions()
    if (open.length === 0)
      return 0
    return this.filterProfitable().length / open.length
  }

  /**
   * Get position summary statistics
   */
  getSummary() {
    const positions = this.getOpenPositions()
    const profitable = this.filterProfitable()
    const losing = this.filterLosing()

    return {
      totalPositions: positions.length,
      profitableCount: profitable.length,
      losingCount: losing.length,
      winRate: positions.length > 0 ? profitable.length / positions.length : 0,
      totalUnrealizedPnL: this.getTotalUnrealizedPnL(),
      totalRealizedPnL: this.getTotalRealizedPnL(),
      totalPnL: this.getTotalPnL(),
      totalExposure: this.getTotalExposure(),
      longExposure: this.getLongPositions().reduce((s, p) => s + p.currentValue, 0),
      shortExposure: this.getShortPositions().reduce((s, p) => s + p.currentValue, 0),
    }
  }
}

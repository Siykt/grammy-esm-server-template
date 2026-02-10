import type { Side } from '../value-objects/side.vo.js'
import { Price } from '../value-objects/price.vo.js'
import { Quantity } from '../value-objects/quantity.vo.js'

/**
 * Position Entity
 * Represents a position in a market
 */
export class Position {
  constructor(
    public readonly id: string,
    public readonly marketId: string,
    public readonly tokenId: string,
    public readonly side: Side,
    public readonly size: Quantity,
    public readonly avgEntryPrice: Price,
    public currentPrice: Price,
    public readonly realizedPnL: number,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  /**
   * Create a new position
   */
  static create(params: {
    marketId: string
    tokenId: string
    side: Side
    size: number
    entryPrice: number
    currentPrice?: number
  }): Position {
    const now = new Date()
    return new Position(
      `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      params.marketId,
      params.tokenId,
      params.side,
      Quantity.fromNumber(params.size),
      Price.fromNumber(params.entryPrice),
      Price.fromNumber(params.currentPrice ?? params.entryPrice),
      0,
      now,
      now,
    )
  }

  /**
   * Calculate unrealized PnL
   */
  get unrealizedPnL(): number {
    const entryValue = this.size.costAt(this.avgEntryPrice.amount)
    const currentValue = this.size.costAt(this.currentPrice.amount)

    if (this.side.isBuy) {
      // Long position: profit when price goes up
      return currentValue - entryValue
    }
    else {
      // Short position: profit when price goes down
      return entryValue - currentValue
    }
  }

  /**
   * Calculate unrealized PnL percentage
   */
  get unrealizedPnLPercent(): number {
    const entryValue = this.size.costAt(this.avgEntryPrice.amount)
    if (entryValue === 0)
      return 0
    return (this.unrealizedPnL / entryValue) * 100
  }

  /**
   * Calculate total PnL (realized + unrealized)
   */
  get totalPnL(): number {
    return this.realizedPnL + this.unrealizedPnL
  }

  /**
   * Get position value at current price
   */
  get currentValue(): number {
    return this.size.costAt(this.currentPrice.amount)
  }

  /**
   * Get position value at entry price
   */
  get entryValue(): number {
    return this.size.costAt(this.avgEntryPrice.amount)
  }

  /**
   * Check if position is profitable
   */
  get isProfitable(): boolean {
    return this.unrealizedPnL > 0
  }

  /**
   * Check if position is at a loss
   */
  get isAtLoss(): boolean {
    return this.unrealizedPnL < 0
  }

  /**
   * Check if position is open (has size)
   */
  get isOpen(): boolean {
    return !this.size.isZero
  }

  /**
   * Calculate break-even price
   */
  get breakEvenPrice(): number {
    return this.avgEntryPrice.amount
  }

  /**
   * Calculate target price for given profit percentage
   */
  targetPriceForProfit(profitPercent: number): number {
    const multiplier = 1 + profitPercent / 100
    if (this.side.isBuy) {
      return this.avgEntryPrice.amount * multiplier
    }
    else {
      return this.avgEntryPrice.amount / multiplier
    }
  }

  /**
   * Update current price
   */
  updatePrice(newPrice: number): void {
    this.currentPrice = Price.fromNumber(newPrice)
    this.updatedAt = new Date()
  }

  /**
   * Add to position (increase size)
   */
  addToPosition(size: number, price: number): Position {
    const newTotalSize = this.size.amount + size
    const newAvgPrice = (this.size.costAt(this.avgEntryPrice.amount) + size * price) / newTotalSize

    return new Position(
      this.id,
      this.marketId,
      this.tokenId,
      this.side,
      Quantity.fromNumber(newTotalSize),
      Price.fromNumber(newAvgPrice),
      this.currentPrice,
      this.realizedPnL,
      this.createdAt,
      new Date(),
    )
  }

  /**
   * Reduce position (decrease size)
   */
  reducePosition(size: number, exitPrice: number): { position: Position, realizedPnL: number } {
    const reduceSize = Math.min(size, this.size.amount)
    const newSize = this.size.amount - reduceSize

    // Calculate realized PnL for the closed portion
    const closedValue = reduceSize * exitPrice
    const closedCost = reduceSize * this.avgEntryPrice.amount
    const pnl = this.side.isBuy
      ? closedValue - closedCost
      : closedCost - closedValue

    const newPosition = new Position(
      this.id,
      this.marketId,
      this.tokenId,
      this.side,
      Quantity.fromNumber(newSize),
      this.avgEntryPrice,
      Price.fromNumber(exitPrice),
      this.realizedPnL + pnl,
      this.createdAt,
      new Date(),
    )

    return { position: newPosition, realizedPnL: pnl }
  }

  toJSON() {
    return {
      id: this.id,
      marketId: this.marketId,
      tokenId: this.tokenId,
      side: this.side.toString(),
      size: this.size.amount,
      avgEntryPrice: this.avgEntryPrice.amount,
      currentPrice: this.currentPrice.amount,
      unrealizedPnL: this.unrealizedPnL,
      unrealizedPnLPercent: this.unrealizedPnLPercent,
      realizedPnL: this.realizedPnL,
      totalPnL: this.totalPnL,
      currentValue: this.currentValue,
      entryValue: this.entryValue,
      isProfitable: this.isProfitable,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    }
  }
}

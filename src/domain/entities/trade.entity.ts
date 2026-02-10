import type { Trade as ClobTrade } from '@polymarket/clob-client'
import { Price } from '../value-objects/price.vo.js'
import { Quantity } from '../value-objects/quantity.vo.js'
import { Side } from '../value-objects/side.vo.js'

/**
 * Trade Entity
 * Represents an executed trade
 */
export class Trade {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly marketId: string,
    public readonly tokenId: string,
    public readonly side: Side,
    public readonly price: Price,
    public readonly size: Quantity,
    public readonly fee: number,
    public readonly outcome: string,
    public readonly status: string,
    public readonly traderSide: 'MAKER' | 'TAKER',
    public readonly transactionHash: string,
    public readonly matchTime: Date,
    public pnl?: number, // Realized PnL for this trade (set when position is closed)
  ) {}

  /**
   * Create Trade from CLOB API response
   */
  static fromClob(data: ClobTrade): Trade {
    return new Trade(
      data.id,
      data.taker_order_id,
      data.market,
      data.asset_id,
      Side.fromString(data.side),
      Price.fromString(data.price),
      Quantity.fromString(data.size),
      Number.parseFloat(data.fee_rate_bps) / 10000, // Convert bps to decimal
      data.outcome,
      data.status,
      data.trader_side,
      data.transaction_hash,
      new Date(data.match_time),
    )
  }

  /**
   * Calculate trade value (size * price)
   */
  get value(): number {
    return this.size.costAt(this.price.amount)
  }

  /**
   * Calculate fee amount
   */
  get feeAmount(): number {
    return this.value * this.fee
  }

  /**
   * Calculate net value after fees
   */
  get netValue(): number {
    if (this.side.isBuy) {
      return this.value + this.feeAmount
    }
    else {
      return this.value - this.feeAmount
    }
  }

  /**
   * Check if this was a buy trade
   */
  get isBuy(): boolean {
    return this.side.isBuy
  }

  /**
   * Check if this was a sell trade
   */
  get isSell(): boolean {
    return this.side.isSell
  }

  /**
   * Check if trade was as maker
   */
  get isMaker(): boolean {
    return this.traderSide === 'MAKER'
  }

  /**
   * Check if trade was as taker
   */
  get isTaker(): boolean {
    return this.traderSide === 'TAKER'
  }

  toJSON() {
    return {
      id: this.id,
      orderId: this.orderId,
      marketId: this.marketId,
      tokenId: this.tokenId,
      side: this.side.toString(),
      price: this.price.amount,
      size: this.size.amount,
      value: this.value,
      fee: this.fee,
      feeAmount: this.feeAmount,
      netValue: this.netValue,
      outcome: this.outcome,
      status: this.status,
      traderSide: this.traderSide,
      transactionHash: this.transactionHash,
      matchTime: this.matchTime.toISOString(),
    }
  }
}

import type { OpenOrder as ClobOpenOrder } from '@polymarket/clob-client'
import { Price } from '../value-objects/price.vo.js'
import { Quantity } from '../value-objects/quantity.vo.js'
import { Side } from '../value-objects/side.vo.js'

/**
 * Order Status Enum
 */
export enum OrderStatus {
  PENDING = 'pending',
  OPEN = 'open',
  MATCHED = 'matched',
  PARTIALLY_FILLED = 'partially_filled',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

/**
 * Order Type Enum
 */
export enum OrderType {
  GTC = 'GTC', // Good Til Cancelled
  GTD = 'GTD', // Good Til Date
  FOK = 'FOK', // Fill Or Kill
  FAK = 'FAK', // Fill And Kill
}

/**
 * Order Entity
 * Represents a trading order on Polymarket
 */
export class Order {
  constructor(
    public readonly id: string,
    public readonly marketId: string,
    public readonly tokenId: string,
    public readonly side: Side,
    public readonly price: Price,
    public readonly originalSize: Quantity,
    public readonly filledSize: Quantity,
    public readonly status: OrderStatus,
    public readonly orderType: OrderType,
    public readonly outcome: string,
    public readonly expiration: Date | null,
    public readonly createdAt: Date,
    public readonly makerAddress: string,
  ) {}

  /**
   * Create Order from CLOB API response
   */
  static fromClob(data: ClobOpenOrder): Order {
    return new Order(
      data.id,
      data.market,
      data.asset_id,
      Side.fromString(data.side),
      Price.fromString(data.price),
      Quantity.fromString(data.original_size),
      Quantity.fromString(data.size_matched),
      Order.parseStatus(data.status),
      Order.parseOrderType(data.order_type),
      data.outcome,
      data.expiration ? new Date(Number.parseInt(data.expiration) * 1000) : null,
      new Date(data.created_at * 1000),
      data.maker_address,
    )
  }

  private static parseStatus(status: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      live: OrderStatus.OPEN,
      open: OrderStatus.OPEN,
      matched: OrderStatus.MATCHED,
      delayed: OrderStatus.PENDING,
      cancelled: OrderStatus.CANCELLED,
      expired: OrderStatus.EXPIRED,
    }
    return statusMap[status.toLowerCase()] ?? OrderStatus.PENDING
  }

  private static parseOrderType(orderType: string): OrderType {
    const typeMap: Record<string, OrderType> = {
      GTC: OrderType.GTC,
      GTD: OrderType.GTD,
      FOK: OrderType.FOK,
      FAK: OrderType.FAK,
    }
    return typeMap[orderType.toUpperCase()] ?? OrderType.GTC
  }

  /**
   * Get remaining size to fill
   */
  get remainingSize(): Quantity {
    return this.originalSize.subtract(this.filledSize)
  }

  /**
   * Check if order is fully filled
   */
  get isFullyFilled(): boolean {
    return this.remainingSize.isZero
  }

  /**
   * Check if order is partially filled
   */
  get isPartiallyFilled(): boolean {
    return !this.filledSize.isZero && !this.isFullyFilled
  }

  /**
   * Check if order is open/active
   */
  get isOpen(): boolean {
    return this.status === OrderStatus.OPEN || this.status === OrderStatus.PENDING
  }

  /**
   * Check if order is completed (matched, cancelled, expired, or failed)
   */
  get isCompleted(): boolean {
    return [
      OrderStatus.MATCHED,
      OrderStatus.CANCELLED,
      OrderStatus.EXPIRED,
      OrderStatus.FAILED,
    ].includes(this.status)
  }

  /**
   * Calculate filled percentage
   */
  get fillPercentage(): number {
    if (this.originalSize.isZero)
      return 0
    return (this.filledSize.amount / this.originalSize.amount) * 100
  }

  /**
   * Calculate total cost/value
   */
  get totalValue(): number {
    return this.originalSize.costAt(this.price.amount)
  }

  /**
   * Calculate filled value
   */
  get filledValue(): number {
    return this.filledSize.costAt(this.price.amount)
  }

  toJSON() {
    return {
      id: this.id,
      marketId: this.marketId,
      tokenId: this.tokenId,
      side: this.side.toString(),
      price: this.price.amount,
      originalSize: this.originalSize.amount,
      filledSize: this.filledSize.amount,
      remainingSize: this.remainingSize.amount,
      status: this.status,
      orderType: this.orderType,
      outcome: this.outcome,
      expiration: this.expiration?.toISOString() ?? null,
      createdAt: this.createdAt.toISOString(),
      fillPercentage: this.fillPercentage,
    }
  }
}

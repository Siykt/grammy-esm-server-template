import type { Order } from '../domain/entities/order.entity.js'
import { OrderStatus } from '../domain/entities/order.entity.js'
import { Side } from '../domain/value-objects/side.vo.js'
import { BaseCollection } from './collection.interface.js'

/**
 * Order Collection
 * Specialized collection for managing Order entities
 */
export class OrderCollection extends BaseCollection<Order> {
  /**
   * Filter orders by market ID
   */
  filterByMarket(marketId: string): Order[] {
    return this.filter(o => o.marketId === marketId)
  }

  /**
   * Filter orders by token ID
   */
  filterByToken(tokenId: string): Order[] {
    return this.filter(o => o.tokenId === tokenId)
  }

  /**
   * Filter orders by side (BUY/SELL)
   */
  filterBySide(side: Side): Order[] {
    return this.filter(o => o.side.equals(side))
  }

  /**
   * Filter orders by status
   */
  filterByStatus(status: OrderStatus): Order[] {
    return this.filter(o => o.status === status)
  }

  /**
   * Get all open orders
   */
  getOpenOrders(): Order[] {
    return this.filter(o => o.isOpen)
  }

  /**
   * Get all pending orders
   */
  getPendingOrders(): Order[] {
    return this.filterByStatus(OrderStatus.PENDING)
  }

  /**
   * Get all filled/matched orders
   */
  getFilledOrders(): Order[] {
    return this.filterByStatus(OrderStatus.MATCHED)
  }

  /**
   * Get all partially filled orders
   */
  getPartiallyFilledOrders(): Order[] {
    return this.filter(o => o.isPartiallyFilled)
  }

  /**
   * Get all cancelled orders
   */
  getCancelledOrders(): Order[] {
    return this.filterByStatus(OrderStatus.CANCELLED)
  }

  /**
   * Calculate total exposure (sum of open order values)
   */
  calculateTotalExposure(): number {
    return this.getOpenOrders()
      .reduce((sum, o) => sum + o.totalValue, 0)
  }

  /**
   * Calculate exposure for a specific market
   */
  calculateMarketExposure(marketId: string): number {
    return this.filterByMarket(marketId)
      .filter(o => o.isOpen)
      .reduce((sum, o) => sum + o.totalValue, 0)
  }

  /**
   * Get buy orders
   */
  getBuyOrders(): Order[] {
    return this.filterBySide(Side.BUY)
  }

  /**
   * Get sell orders
   */
  getSellOrders(): Order[] {
    return this.filterBySide(Side.SELL)
  }

  /**
   * Group orders by market
   */
  groupByMarket(): Map<string, Order[]> {
    return this.groupBy(o => o.marketId)
  }

  /**
   * Group orders by status
   */
  groupByStatus(): Map<OrderStatus, Order[]> {
    return this.groupBy(o => o.status)
  }

  /**
   * Sort by creation time
   */
  sortByCreatedAt(desc: boolean = true): Order[] {
    return this.sortBy(o => o.createdAt.getTime(), desc)
  }

  /**
   * Sort by price
   */
  sortByPrice(desc: boolean = false): Order[] {
    return this.sortBy(o => o.price.amount, desc)
  }

  /**
   * Get total filled value
   */
  getTotalFilledValue(): number {
    return this.reduce((sum, o) => sum + o.filledValue, 0)
  }

  /**
   * Get orders expiring soon
   */
  getExpiringSoon(withinMs: number): Order[] {
    const cutoff = Date.now() + withinMs
    return this.filter(o =>
      o.expiration !== null
      && o.expiration.getTime() <= cutoff
      && o.isOpen,
    )
  }

  /**
   * Get order count by status
   */
  getStatusCounts(): Record<OrderStatus, number> {
    const counts = {} as Record<OrderStatus, number>
    Object.values(OrderStatus).forEach((status) => {
      counts[status] = this.filterByStatus(status).length
    })
    return counts
  }
}

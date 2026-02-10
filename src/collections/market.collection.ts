import type { Market } from '../domain/entities/market.entity.js'
import { BaseCollection } from './collection.interface.js'

/**
 * Market Collection
 * Specialized collection for managing Market entities
 */
export class MarketCollection extends BaseCollection<Market> {
  /**
   * Filter markets by tag
   */
  filterByTag(_tag: string): Market[] {
    // Note: Tags would need to be added to Market entity
    return this.filter(() => true) // Placeholder
  }

  /**
   * Filter by status (active/closed)
   */
  filterByStatus(status: 'active' | 'closed'): Market[] {
    return this.filter(m =>
      status === 'active' ? m.active && !m.closed : m.closed,
    )
  }

  /**
   * Filter by minimum volume
   */
  filterByVolume(minVolume: number): Market[] {
    return this.filter(m => m.volume >= minVolume)
  }

  /**
   * Filter by minimum liquidity
   */
  filterByLiquidity(minLiquidity: number): Market[] {
    return this.filter(m => m.liquidity >= minLiquidity)
  }

  /**
   * Find market by slug
   */
  findBySlug(slug: string): Market | undefined {
    return this.find(m => m.slug === slug)
  }

  /**
   * Find market by token ID
   */
  findByTokenId(tokenId: string): Market | undefined {
    return this.find(m => m.outcomes.some(o => o.tokenId === tokenId))
  }

  /**
   * Find market by condition ID
   */
  findByConditionId(conditionId: string): Market | undefined {
    return this.find(m => m.conditionId === conditionId)
  }

  /**
   * Get all active markets
   */
  getActiveMarkets(): Market[] {
    return this.filter(m => m.isTradeable)
  }

  /**
   * Get markets with arbitrage opportunities
   */
  getArbitrageMarkets(): Market[] {
    return this.filter(m => m.hasArbitrageOpportunity && m.isTradeable)
  }

  /**
   * Sort by volume (descending by default)
   */
  sortByVolume(desc: boolean = true): Market[] {
    return this.sortBy(m => m.volume, desc)
  }

  /**
   * Sort by liquidity
   */
  sortByLiquidity(desc: boolean = true): Market[] {
    return this.sortBy(m => m.liquidity, desc)
  }

  /**
   * Sort by end date (ascending by default - soonest first)
   */
  sortByEndDate(asc: boolean = true): Market[] {
    return this.sortBy(m => m.endDate.getTime(), !asc)
  }

  /**
   * Sort by arbitrage profit potential
   */
  sortByArbitrageProfit(desc: boolean = true): Market[] {
    return this.sortBy(m => m.arbitrageProfit, desc)
  }

  /**
   * Get markets ending within a time range
   */
  getEndingSoon(withinMs: number): Market[] {
    const cutoff = Date.now() + withinMs
    return this.filter(m => m.endDate.getTime() <= cutoff && m.isTradeable)
  }

  /**
   * Get total volume across all markets
   */
  getTotalVolume(): number {
    return this.reduce((sum, m) => sum + m.volume, 0)
  }

  /**
   * Get total liquidity across all markets
   */
  getTotalLiquidity(): number {
    return this.reduce((sum, m) => sum + m.liquidity, 0)
  }

  /**
   * Group markets by some criteria
   */
  groupByActive(): { active: Market[], closed: Market[] } {
    const groups = this.groupBy(m => m.active ? 'active' : 'closed')
    return {
      active: groups.get('active') ?? [],
      closed: groups.get('closed') ?? [],
    }
  }
}

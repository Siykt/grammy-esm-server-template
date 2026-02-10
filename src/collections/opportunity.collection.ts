import type { Opportunity } from '../domain/entities/opportunity.entity.js'
import { OpportunityStatus, OpportunityType } from '../domain/entities/opportunity.entity.js'
import { BaseCollection } from './collection.interface.js'

/**
 * Opportunity Collection
 * Specialized collection for managing trading opportunities
 */
export class OpportunityCollection extends BaseCollection<Opportunity> {
  /**
   * Filter opportunities by type
   */
  filterByType(type: OpportunityType): Opportunity[] {
    return this.filter(o => o.type === type)
  }

  /**
   * Filter opportunities by status
   */
  filterByStatus(status: OpportunityStatus): Opportunity[] {
    return this.filter(o => o.status === status)
  }

  /**
   * Filter by minimum expected profit
   */
  filterByProfit(minProfit: number): Opportunity[] {
    return this.filter(o => o.expectedProfit >= minProfit)
  }

  /**
   * Filter by minimum profit percentage
   */
  filterByProfitPercent(minPercent: number): Opportunity[] {
    return this.filter(o => o.expectedProfitPercent >= minPercent)
  }

  /**
   * Filter by minimum confidence
   */
  filterByConfidence(minConfidence: number): Opportunity[] {
    return this.filter(o => o.confidence >= minConfidence)
  }

  /**
   * Get all pending opportunities
   */
  getPending(): Opportunity[] {
    return this.filterByStatus(OpportunityStatus.PENDING)
  }

  /**
   * Get all executing opportunities
   */
  getExecuting(): Opportunity[] {
    return this.filterByStatus(OpportunityStatus.EXECUTING)
  }

  /**
   * Get all executed opportunities
   */
  getExecuted(): Opportunity[] {
    return this.filterByStatus(OpportunityStatus.EXECUTED)
  }

  /**
   * Get all valid (non-expired, pending) opportunities
   */
  getExecutable(): Opportunity[] {
    return this.filter(o => o.isValid)
  }

  /**
   * Get cross-market arbitrage opportunities
   */
  getCrossMarketOpportunities(): Opportunity[] {
    return this.filterByType(OpportunityType.CROSS_MARKET)
  }

  /**
   * Get event arbitrage opportunities
   */
  getEventArbitrageOpportunities(): Opportunity[] {
    return this.filterByType(OpportunityType.EVENT_ARBITRAGE)
  }

  /**
   * Get deviation opportunities
   */
  getDeviationOpportunities(): Opportunity[] {
    return this.filterByType(OpportunityType.DEVIATION)
  }

  /**
   * Remove all expired opportunities
   */
  removeExpired(): number {
    const expired = this.filter(o => o.isExpired)
    expired.forEach((o) => {
      o.markExpired()
      this.remove(o.id)
    })
    return expired.length
  }

  /**
   * Get the best opportunity (highest expected profit)
   */
  getBestOpportunity(): Opportunity | undefined {
    const executable = this.getExecutable()
    if (executable.length === 0)
      return undefined

    return executable.reduce((best, current) =>
      current.expectedProfit > best.expectedProfit ? current : best,
    )
  }

  /**
   * Get best opportunities by profit
   */
  getBestOpportunities(limit: number = 5): Opportunity[] {
    return this.sortByProfit(true).slice(0, limit)
  }

  /**
   * Sort by expected profit
   */
  sortByProfit(desc: boolean = true): Opportunity[] {
    return this.sortBy(o => o.expectedProfit, desc)
  }

  /**
   * Sort by profit percentage
   */
  sortByProfitPercent(desc: boolean = true): Opportunity[] {
    return this.sortBy(o => o.expectedProfitPercent, desc)
  }

  /**
   * Sort by confidence
   */
  sortByConfidence(desc: boolean = true): Opportunity[] {
    return this.sortBy(o => o.confidence, desc)
  }

  /**
   * Sort by expiration time (soonest first)
   */
  sortByExpiration(asc: boolean = true): Opportunity[] {
    return this.sortBy(o => o.expiresAt.getTime(), !asc)
  }

  /**
   * Group opportunities by type
   */
  groupByType(): Map<OpportunityType, Opportunity[]> {
    return this.groupBy(o => o.type)
  }

  /**
   * Group opportunities by status
   */
  groupByStatus(): Map<OpportunityStatus, Opportunity[]> {
    return this.groupBy(o => o.status)
  }

  /**
   * Get opportunities for a specific market
   */
  getByMarket(marketId: string): Opportunity[] {
    return this.filter(o => o.marketIds.includes(marketId))
  }

  /**
   * Calculate total potential profit from all executable opportunities
   */
  getTotalPotentialProfit(): number {
    return this.getExecutable()
      .reduce((sum, o) => sum + o.expectedProfit, 0)
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const executable = this.getExecutable()
    const byType = this.groupByType()
    const byStatus = this.groupByStatus()

    return {
      total: this.size(),
      executable: executable.length,
      pending: (byStatus.get(OpportunityStatus.PENDING) ?? []).length,
      executing: (byStatus.get(OpportunityStatus.EXECUTING) ?? []).length,
      executed: (byStatus.get(OpportunityStatus.EXECUTED) ?? []).length,
      expired: (byStatus.get(OpportunityStatus.EXPIRED) ?? []).length,
      crossMarket: (byType.get(OpportunityType.CROSS_MARKET) ?? []).length,
      eventArbitrage: (byType.get(OpportunityType.EVENT_ARBITRAGE) ?? []).length,
      deviation: (byType.get(OpportunityType.DEVIATION) ?? []).length,
      totalPotentialProfit: this.getTotalPotentialProfit(),
      avgConfidence: executable.length > 0
        ? executable.reduce((s, o) => s + o.confidence, 0) / executable.length
        : 0,
    }
  }
}

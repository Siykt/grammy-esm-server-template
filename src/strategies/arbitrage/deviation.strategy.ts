import type { OpportunityLeg } from '../../domain/entities/opportunity.entity.js'
import type { PMClientService } from '../../services/pm/client.service.js'
import type { TradeResult } from '../base/strategy.interface.js'
import logger from '../../common/logger.js'
import { Opportunity, OpportunityType } from '../../domain/entities/opportunity.entity.js'
import { Side } from '../../domain/value-objects/side.vo.js'
import { BaseStrategy } from '../base/strategy.abstract.js'
import { KellyPositionSizing } from '../position-sizing/kelly.sizing.js'

/**
 * Price statistics for a token
 */
interface PriceStats {
  tokenId: string
  marketId: string
  mean: number
  stdDev: number
  currentPrice: number
  zScore: number
  sampleSize: number
  lastUpdated: Date
}

/**
 * Price Deviation Strategy (Mean Reversion)
 *
 * Exploits price deviations from historical mean using statistical analysis.
 *
 * Logic:
 * 1. Calculate rolling mean and standard deviation for each market
 * 2. Compute z-score: z = (currentPrice - mean) / stdDev
 * 3. Entry signals:
 *    - Long when z < -threshold (price is unusually low)
 *    - Short when z > +threshold (price is unusually high)
 * 4. Exit when price returns toward mean
 */
export class DeviationStrategy extends BaseStrategy {
  static readonly STRATEGY_NAME = 'price-deviation'
  static readonly STRATEGY_TYPE = 'mean-reversion'

  private pmClient: PMClientService | null = null
  private priceHistory: Map<string, number[]> = new Map()
  private priceStats: Map<string, PriceStats> = new Map()
  private watchedTokens: Set<string> = new Set()

  // Configuration
  private entryZScore = 2.0 // Z-score threshold for entry
  private exitZScore = 0.5 // Z-score threshold for exit
  private lookbackPeriod = 100 // Number of price points to consider
  private minSampleSize = 20 // Minimum samples before trading

  constructor(pmClient?: PMClientService) {
    super(DeviationStrategy.STRATEGY_NAME, DeviationStrategy.STRATEGY_TYPE)

    this.pmClient = pmClient ?? null

    // Use Kelly position sizing with conservative parameters
    this.setPositionSizing(new KellyPositionSizing(0.3, 0.1, 0.01))

    // Default parameters
    this.params = {
      entryZScore: this.entryZScore,
      exitZScore: this.exitZScore,
      lookbackPeriod: this.lookbackPeriod,
      minSampleSize: this.minSampleSize,
      maxPositions: 5,
      availableCapital: 100,
    }
  }

  /**
   * Inject the PM client service
   */
  setPMClient(client: PMClientService): void {
    this.pmClient = client
  }

  /**
   * Add a token to watch list
   */
  watchToken(tokenId: string, _marketId: string): void {
    this.watchedTokens.add(tokenId)
    if (!this.priceHistory.has(tokenId)) {
      this.priceHistory.set(tokenId, [])
    }
  }

  /**
   * Remove a token from watch list
   */
  unwatchToken(tokenId: string): void {
    this.watchedTokens.delete(tokenId)
    this.priceHistory.delete(tokenId)
    this.priceStats.delete(tokenId)
  }

  /**
   * Update price for a token
   */
  updatePrice(tokenId: string, marketId: string, price: number): void {
    let history = this.priceHistory.get(tokenId)
    if (!history) {
      history = []
      this.priceHistory.set(tokenId, history)
    }

    history.push(price)

    // Trim to lookback period
    const lookback = this.params.lookbackPeriod as number
    if (history.length > lookback) {
      history.splice(0, history.length - lookback)
    }

    // Recalculate statistics
    this.calculateStats(tokenId, marketId, price)
  }

  /**
   * Calculate statistics for a token
   */
  private calculateStats(tokenId: string, marketId: string, currentPrice: number): void {
    const history = this.priceHistory.get(tokenId)
    if (!history || history.length < (this.params.minSampleSize as number)) {
      return
    }

    // Calculate mean
    const mean = history.reduce((a, b) => a + b, 0) / history.length

    // Calculate standard deviation
    const squaredDiffs = history.map(x => (x - mean) ** 2)
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / history.length
    const stdDev = Math.sqrt(variance)

    // Calculate z-score
    const zScore = stdDev > 0 ? (currentPrice - mean) / stdDev : 0

    const stats: PriceStats = {
      tokenId,
      marketId,
      mean,
      stdDev,
      currentPrice,
      zScore,
      sampleSize: history.length,
      lastUpdated: new Date(),
    }

    this.priceStats.set(tokenId, stats)
  }

  /**
   * Scan for deviation opportunities
   */
  async scan(): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = []
    const entryThreshold = this.params.entryZScore as number

    for (const [tokenId, stats] of this.priceStats) {
      // Check if z-score exceeds threshold
      if (Math.abs(stats.zScore) < entryThreshold) {
        continue
      }

      // Determine direction based on z-score
      // Negative z-score (price below mean) = buy
      // Positive z-score (price above mean) = sell
      const side = stats.zScore < 0 ? Side.BUY : Side.SELL

      // Calculate expected profit
      // We expect price to return to mean
      // const expectedMove = Math.abs(stats.currentPrice - stats.mean)
      const capital = this.params.availableCapital as number
      const size = capital / stats.currentPrice

      // Create opportunity
      const opportunity = Opportunity.createDeviation({
        marketId: stats.marketId,
        tokenId,
        currentPrice: stats.currentPrice,
        meanPrice: stats.mean,
        stdDev: stats.stdDev,
        zScore: stats.zScore,
        size: Math.floor(size),
        expiresInMs: 60000, // Expires in 1 minute
      })

      opportunities.push(opportunity)
      logger.info(
        `[${this.name}] Found deviation: token=${tokenId.slice(0, 8)}... `
        + `z=${stats.zScore.toFixed(2)}, price=${stats.currentPrice.toFixed(4)}, `
        + `mean=${stats.mean.toFixed(4)}, side=${side.toString()}`,
      )
    }

    return opportunities.slice(0, this.params.maxPositions as number)
  }

  /**
   * Execute a deviation opportunity
   */
  async execute(opportunity: Opportunity): Promise<TradeResult> {
    if (!this.pmClient) {
      return {
        success: false,
        trades: [],
        error: 'PM client not configured',
      }
    }

    if (opportunity.type !== OpportunityType.DEVIATION) {
      return {
        success: false,
        trades: [],
        error: 'Invalid opportunity type for this strategy',
      }
    }

    if (opportunity.legs.length !== 1) {
      return {
        success: false,
        trades: [],
        error: 'Deviation strategy requires exactly 1 leg',
      }
    }

    opportunity.markExecuting()

    try {
      const leg = opportunity.legs[0] as OpportunityLeg

      logger.info(`[${this.name}] Placing ${leg.side.toString()} order: ${leg.size} @ ${leg.price}`)

      const result = await this.pmClient.createLimitOrder({
        tokenId: leg.tokenId,
        price: leg.price,
        size: leg.size,
        // eslint-disable-next-line ts/no-explicit-any
        side: leg.side.toString() as any,
        postOnly: false,
      })

      if (!result.success) {
        opportunity.markFailed()
        return {
          success: false,
          trades: [],
          error: `Failed to place order: ${result.errorMsg}`,
        }
      }

      opportunity.markExecuted()

      const trade = this.createTrade({
        orderId: result.orderId ?? '',
        marketId: leg.marketId,
        tokenId: leg.tokenId,
        side: leg.side.toString(),
        price: leg.price,
        size: leg.size,
      })

      logger.info(`[${this.name}] Deviation trade executed! Expected profit: $${opportunity.expectedProfit.toFixed(2)}`)

      return {
        success: true,
        trades: [trade],
        totalProfit: opportunity.expectedProfit,
      }
    }
    catch (error) {
      opportunity.markFailed()
      logger.error(`[${this.name}] Execution failed`, error)
      return {
        success: false,
        trades: [],
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Get statistics for all watched tokens
   */
  getAllStats(): PriceStats[] {
    return Array.from(this.priceStats.values())
  }

  // /**
  //  * Get statistics for a specific token
  //  */
  // override getStats(tokenId?: string): PriceStats {
  //   return this.priceStats.get(tokenId ?? '')
  // }

  /**
   * Check if a token should be exited (price returned to mean)
   */
  shouldExit(tokenId: string): boolean {
    const stats = this.priceStats.get(tokenId)
    if (!stats)
      return false

    const exitThreshold = this.params.exitZScore as number
    return Math.abs(stats.zScore) < exitThreshold
  }

  /**
   * Override: validate opportunity with fresh prices
   */
  protected override async validateOpportunity(opportunity: Opportunity): Promise<boolean> {
    if (!opportunity.isValid)
      return false
    if (!this.pmClient)
      return false

    const leg = opportunity.legs[0] as OpportunityLeg
    const stats = this.priceStats.get(leg.tokenId)

    if (!stats)
      return false

    // Check if z-score still exceeds threshold
    const entryThreshold = this.params.entryZScore as number
    return Math.abs(stats.zScore) >= entryThreshold
  }
}

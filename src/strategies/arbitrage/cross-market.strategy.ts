import type { OpportunityLeg } from '../../domain/entities/opportunity.entity.js'
import type { PMClientService } from '../../services/pm/client.service.js'
import type { TradeResult } from '../base/strategy.interface.js'
import { Side } from '@polymarket/clob-client'
import { MarketCollection } from '../../collections/market.collection.js'
import logger from '../../common/logger.js'
import { Market } from '../../domain/entities/market.entity.js'
import { Opportunity, OpportunityType } from '../../domain/entities/opportunity.entity.js'
import { BaseStrategy } from '../base/strategy.abstract.js'
import { KellyPositionSizing } from '../position-sizing/kelly.sizing.js'

/**
 * Cross-Market Arbitrage Strategy
 *
 * Exploits pricing inefficiencies where YES + NO prices don't equal 1.0
 *
 * Logic:
 * 1. Scan all binary markets (2 outcomes)
 * 2. Find markets where priceYes + priceNo < 1.0 (guaranteed profit)
 * 3. Buy both YES and NO tokens
 * 4. Regardless of outcome, one token pays out $1
 * 5. Profit = $1 - (priceYes + priceNo) per share
 */
export class CrossMarketArbitrageStrategy extends BaseStrategy {
  static readonly STRATEGY_NAME = 'cross-market-arbitrage'
  static readonly STRATEGY_TYPE = 'arbitrage'

  private marketCollection: MarketCollection
  private pmClient: PMClientService | null = null

  // Configuration
  private minSpread = 0.005 // 0.5% minimum spread
  private minProfit = 0.01 // $0.01 minimum profit per trade
  private maxTradesPerRun = 5 // Limit concurrent trades

  constructor(pmClient?: PMClientService) {
    super(CrossMarketArbitrageStrategy.STRATEGY_NAME, CrossMarketArbitrageStrategy.STRATEGY_TYPE)

    this.marketCollection = new MarketCollection()
    this.pmClient = pmClient ?? null

    // Use Kelly position sizing with conservative parameters
    this.setPositionSizing(new KellyPositionSizing(0.25, 0.15, 0.01))

    // Default parameters
    this.params = {
      minSpread: this.minSpread,
      minProfit: this.minProfit,
      maxTradesPerRun: this.maxTradesPerRun,
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
   * Update market collection with fresh data
   */
  async refreshMarkets(): Promise<void> {
    if (!this.pmClient) {
      logger.warn(`[${this.name}] PM client not set, cannot refresh markets`)
      return
    }

    try {
      const gammaMarkets = await this.pmClient.getMarkets({ active: true, closed: false })

      this.marketCollection.clear()

      for (const gm of gammaMarkets) {
        try {
          // eslint-disable-next-line ts/no-explicit-any
          const market = Market.fromGamma(gm as any)
          if (market.outcomes.length === 2 && market.isTradeable) {
            this.marketCollection.add(market)
          }
        }
        catch (error) {
          console.log('🚀 - CrossMarketArbitrageStrategy - refreshMarkets - error:', error)
          logger.debug(`[${this.name}] Failed to parse market: ${gm.id}`)
        }
      }

      logger.info(`[${this.name}] Refreshed ${this.marketCollection.size()} binary markets`)
    }
    catch (error) {
      logger.error(`[${this.name}] Failed to refresh markets`, error)
    }
  }

  /**
   * Scan for cross-market arbitrage opportunities
   */
  async scan(): Promise<Opportunity[]> {
    // Refresh market data
    await this.refreshMarkets()

    const opportunities: Opportunity[] = []
    const arbMarkets = this.marketCollection.getArbitrageMarkets()

    logger.debug(`[${this.name}] Scanning ${arbMarkets.length} markets with potential arbitrage`)

    for (const market of arbMarkets) {
      if (!market.yesOutcome || !market.noOutcome)
        continue

      const yesPrice = market.yesPrice.amount
      const noPrice = market.noPrice.amount
      const sum = yesPrice + noPrice

      // Only interested if sum < 1 (guaranteed profit)
      if (sum >= 1)
        continue

      const spread = 1 - sum

      // Check minimum spread
      if (spread < (this.params.minSpread as number))
        continue

      // Calculate position size based on available capital
      const capital = this.params.availableCapital as number
      const size = capital / sum // How many shares we can buy

      // Calculate expected profit
      const profit = size * spread

      // Check minimum profit
      if (profit < (this.params.minProfit as number))
        continue

      // Create opportunity
      const opportunity = Opportunity.createCrossMarket({
        marketId: market.id,
        yesTokenId: market.yesOutcome.tokenId,
        noTokenId: market.noOutcome.tokenId,
        yesPrice,
        noPrice,
        size: Math.floor(size), // Round down to whole shares
        expiresInMs: 30000, // Expires in 30 seconds
      })

      opportunities.push(opportunity)
      logger.info(`[${this.name}] Found opportunity: ${market.question.slice(0, 50)}... spread=${(spread * 100).toFixed(2)}%, profit=$${profit.toFixed(2)}`)
    }

    return opportunities.slice(0, this.params.maxTradesPerRun as number)
  }

  /**
   * Execute a cross-market arbitrage opportunity
   */
  async execute(opportunity: Opportunity): Promise<TradeResult> {
    if (!this.pmClient) {
      return {
        success: false,
        trades: [],
        error: 'PM client not configured',
      }
    }

    if (opportunity.type !== OpportunityType.CROSS_MARKET) {
      return {
        success: false,
        trades: [],
        error: 'Invalid opportunity type for this strategy',
      }
    }

    if (opportunity.legs.length !== 2) {
      return {
        success: false,
        trades: [],
        error: 'Cross-market arbitrage requires exactly 2 legs',
      }
    }

    opportunity.markExecuting()

    try {
      const [yesLeg, noLeg] = opportunity.legs as [OpportunityLeg, OpportunityLeg]
      const results = []

      // Place buy order for YES
      logger.info(`[${this.name}] Placing YES order: ${yesLeg.size} @ ${yesLeg.price}`)
      const yesResult = await this.pmClient.createLimitOrder({
        tokenId: yesLeg.tokenId,
        price: yesLeg.price,
        size: yesLeg.size,
        side: Side.BUY,
        postOnly: false,
      })

      if (!yesResult.success) {
        opportunity.markFailed()
        return {
          success: false,
          trades: [],
          error: `Failed to place YES order: ${yesResult.errorMsg}`,
        }
      }
      results.push({ leg: 'YES', ...yesResult })

      // Place buy order for NO
      logger.info(`[${this.name}] Placing NO order: ${noLeg.size} @ ${noLeg.price}`)
      const noResult = await this.pmClient.createLimitOrder({
        tokenId: noLeg.tokenId,
        price: noLeg.price,
        size: noLeg.size,
        side: Side.BUY,
        postOnly: false,
      })

      if (!noResult.success) {
        // Try to cancel the YES order if NO fails
        if (yesResult.orderId) {
          await this.pmClient.cancelOrder(yesResult.orderId)
        }
        opportunity.markFailed()
        return {
          success: false,
          trades: [],
          error: `Failed to place NO order: ${noResult.errorMsg}`,
        }
      }
      results.push({ leg: 'NO', ...noResult })

      opportunity.markExecuted()

      // Create trade records
      const trades = [
        this.createTrade({
          orderId: yesResult.orderId ?? '',
          marketId: yesLeg.marketId,
          tokenId: yesLeg.tokenId,
          side: 'BUY',
          price: yesLeg.price,
          size: yesLeg.size,
          outcome: 'Yes',
        }),
        this.createTrade({
          orderId: noResult.orderId ?? '',
          marketId: noLeg.marketId,
          tokenId: noLeg.tokenId,
          side: 'BUY',
          price: noLeg.price,
          size: noLeg.size,
          outcome: 'No',
        }),
      ]

      logger.info(`[${this.name}] Arbitrage executed successfully! Expected profit: $${opportunity.expectedProfit.toFixed(2)}`)

      return {
        success: true,
        trades,
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
   * Override: validate opportunity with fresh prices
   */
  protected override async validateOpportunity(opportunity: Opportunity): Promise<boolean> {
    if (!opportunity.isValid)
      return false
    if (!this.pmClient)
      return false

    // Re-check prices to ensure arbitrage still exists
    const yesLeg = opportunity.legs[0] as OpportunityLeg
    const noLeg = opportunity.legs[1] as OpportunityLeg

    try {
      const [yesBook, noBook] = await Promise.all([
        this.pmClient.getOrderBook(yesLeg.tokenId),
        this.pmClient.getOrderBook(noLeg.tokenId),
      ])

      // Check if there's liquidity at our target prices
      const yesAsk = yesBook.asks[0]
      const noAsk = noBook.asks[0]

      if (!yesAsk || !noAsk)
        return false

      const currentYesPrice = Number.parseFloat(yesAsk.price)
      const currentNoPrice = Number.parseFloat(noAsk.price)
      const currentSum = currentYesPrice + currentNoPrice

      // Check if arbitrage still profitable
      const spread = 1 - currentSum
      return spread >= (this.params.minSpread as number)
    }
    catch (error) {
      logger.error(`[${this.name}] Failed to validate opportunity`, error)
      return false
    }
  }
}

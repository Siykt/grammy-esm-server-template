import type { GammaMarket } from '../../services/pm/client.service.js'
import { Price } from '../value-objects/price.vo.js'

/**
 * Market Entity
 * Represents a prediction market on Polymarket
 */
export interface MarketOutcome {
  tokenId: string
  name: string
  price: Price
}

export class Market {
  constructor(
    public readonly id: string,
    public readonly conditionId: string,
    public readonly question: string,
    public readonly slug: string,
    public readonly outcomes: MarketOutcome[],
    public readonly volume: number,
    public readonly liquidity: number,
    public readonly endDate: Date,
    public readonly active: boolean,
    public readonly closed: boolean,
  ) {}

  /**
   * Create Market from Gamma API response
   */
  static fromGamma(data: GammaMarket & { slug?: string, active?: boolean, closed?: boolean }): Market {
    const outcomeNames = JSON.parse(data.outcomes) as string[]
    const outcomePrices = JSON.parse(data.outcomePrices) as string[]
    const tokenIds = data.clobTokenIds

    const outcomes: MarketOutcome[] = outcomeNames.map((name, index) => ({
      tokenId: tokenIds[index] ?? '',
      name,
      price: Price.fromString(outcomePrices[index] ?? '0'),
    }))

    return new Market(
      data.id,
      data.conditionId,
      data.question,
      data.slug ?? '',
      outcomes,
      Number.parseFloat(data.volume),
      Number.parseFloat(data.liquidity),
      new Date(data.endDate),
      data.active ?? true,
      data.closed ?? false,
    )
  }

  /**
   * Get YES outcome (first outcome)
   */
  get yesOutcome(): MarketOutcome | undefined {
    return this.outcomes[0]
  }

  /**
   * Get NO outcome (second outcome)
   */
  get noOutcome(): MarketOutcome | undefined {
    return this.outcomes[1]
  }

  /**
   * Get YES price
   */
  get yesPrice(): Price {
    return this.yesOutcome?.price ?? Price.zero()
  }

  /**
   * Get NO price
   */
  get noPrice(): Price {
    return this.noOutcome?.price ?? Price.zero()
  }

  /**
   * Check if there's a cross-market arbitrage opportunity
   * (YES + NO prices should equal 1.0)
   */
  get hasArbitrageOpportunity(): boolean {
    if (this.outcomes.length !== 2)
      return false
    const sum = this.yesPrice.amount + this.noPrice.amount
    return Math.abs(sum - 1.0) > 0.005 // 0.5% threshold
  }

  /**
   * Calculate arbitrage profit potential
   */
  get arbitrageProfit(): number {
    if (this.outcomes.length !== 2)
      return 0
    const sum = this.yesPrice.amount + this.noPrice.amount
    // If sum < 1, buy both for guaranteed profit
    // If sum > 1, sell both for guaranteed profit
    return Math.abs(1 - sum)
  }

  /**
   * Get the underpriced side
   */
  get underpricedSide(): 'YES' | 'NO' | null {
    if (!this.hasArbitrageOpportunity)
      return null
    const sum = this.yesPrice.amount + this.noPrice.amount
    if (sum < 1) {
      // Both are underpriced, return the one with better odds
      return this.yesPrice.amount < this.noPrice.amount ? 'YES' : 'NO'
    }
    return null
  }

  /**
   * Check if market is tradeable
   */
  get isTradeable(): boolean {
    return this.active && !this.closed && this.endDate > new Date()
  }

  /**
   * Get token ID by outcome name
   */
  getTokenId(outcomeName: string): string | undefined {
    const outcome = this.outcomes.find(o =>
      o.name.toLowerCase() === outcomeName.toLowerCase(),
    )
    return outcome?.tokenId
  }

  /**
   * Get outcome by token ID
   */
  getOutcome(tokenId: string): MarketOutcome | undefined {
    return this.outcomes.find(o => o.tokenId === tokenId)
  }

  toJSON() {
    return {
      id: this.id,
      conditionId: this.conditionId,
      question: this.question,
      slug: this.slug,
      outcomes: this.outcomes.map(o => ({
        tokenId: o.tokenId,
        name: o.name,
        price: o.price.amount,
      })),
      volume: this.volume,
      liquidity: this.liquidity,
      endDate: this.endDate.toISOString(),
      active: this.active,
      closed: this.closed,
      hasArbitrageOpportunity: this.hasArbitrageOpportunity,
      arbitrageProfit: this.arbitrageProfit,
    }
  }
}

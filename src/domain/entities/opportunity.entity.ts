import { nanoid } from 'nanoid'
import { Side } from '../value-objects/side.vo.js'

/**
 * Opportunity Type
 */
export enum OpportunityType {
  CROSS_MARKET = 'cross-market', // Yes+No price mismatch
  EVENT_ARBITRAGE = 'event-arbitrage', // Related events inconsistency
  DEVIATION = 'deviation', // Price deviation from mean
}

/**
 * Opportunity Status
 */
export enum OpportunityStatus {
  PENDING = 'pending',
  EXECUTING = 'executing',
  EXECUTED = 'executed',
  EXPIRED = 'expired',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

/**
 * Opportunity Leg
 * Represents one side of an arbitrage trade
 */
export interface OpportunityLeg {
  marketId: string
  tokenId: string
  side: Side
  price: number
  size: number
}

/**
 * Opportunity Entity
 * Represents a trading opportunity
 */
export class Opportunity {
  constructor(
    public readonly id: string,
    public readonly type: OpportunityType,
    public readonly legs: OpportunityLeg[],
    public readonly expectedProfit: number,
    public readonly expectedProfitPercent: number,
    public readonly confidence: number,
    public status: OpportunityStatus,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    public readonly metadata: Record<string, unknown> = {},
  ) {}

  /**
   * Create a cross-market arbitrage opportunity
   */
  static createCrossMarket(params: {
    marketId: string
    yesTokenId: string
    noTokenId: string
    yesPrice: number
    noPrice: number
    size: number
    expiresInMs?: number
  }): Opportunity {
    const totalCost = params.size * (params.yesPrice + params.noPrice)
    const guaranteedReturn = params.size // Payout is always 1 per share
    const profit = guaranteedReturn - totalCost
    const profitPercent = (profit / totalCost) * 100

    const legs: OpportunityLeg[] = [
      {
        marketId: params.marketId,
        tokenId: params.yesTokenId,
        side: Side.BUY,
        price: params.yesPrice,
        size: params.size,
      },
      {
        marketId: params.marketId,
        tokenId: params.noTokenId,
        side: Side.BUY,
        price: params.noPrice,
        size: params.size,
      },
    ]

    return new Opportunity(
      `opp_${nanoid(10)}`,
      OpportunityType.CROSS_MARKET,
      legs,
      profit,
      profitPercent,
      Math.min(1, Math.abs(profitPercent) / 10), // Higher profit = higher confidence
      OpportunityStatus.PENDING,
      new Date(Date.now() + (params.expiresInMs ?? 30000)),
      new Date(),
      {
        yesPrice: params.yesPrice,
        noPrice: params.noPrice,
        sumPrice: params.yesPrice + params.noPrice,
        spread: 1 - (params.yesPrice + params.noPrice),
      },
    )
  }

  /**
   * Create a deviation (mean reversion) opportunity
   */
  static createDeviation(params: {
    marketId: string
    tokenId: string
    currentPrice: number
    meanPrice: number
    stdDev: number
    zScore: number
    size: number
    expiresInMs?: number
  }): Opportunity {
    const side = params.zScore < 0 ? Side.BUY : Side.SELL
    const expectedMove = Math.abs(params.currentPrice - params.meanPrice)
    const profit = params.size * expectedMove
    const cost = params.size * params.currentPrice
    const profitPercent = (profit / cost) * 100

    // Confidence based on z-score magnitude
    const confidence = Math.min(1, Math.abs(params.zScore) / 3)

    const legs: OpportunityLeg[] = [{
      marketId: params.marketId,
      tokenId: params.tokenId,
      side,
      price: params.currentPrice,
      size: params.size,
    }]

    return new Opportunity(
      `opp_${nanoid(10)}`,
      OpportunityType.DEVIATION,
      legs,
      profit,
      profitPercent,
      confidence,
      OpportunityStatus.PENDING,
      new Date(Date.now() + (params.expiresInMs ?? 60000)),
      new Date(),
      {
        meanPrice: params.meanPrice,
        stdDev: params.stdDev,
        zScore: params.zScore,
        expectedReversion: params.meanPrice,
      },
    )
  }

  /**
   * Get all market IDs involved
   */
  get marketIds(): string[] {
    return [...new Set(this.legs.map(l => l.marketId))]
  }

  /**
   * Get all token IDs involved
   */
  get tokenIds(): string[] {
    return this.legs.map(l => l.tokenId)
  }

  /**
   * Calculate total cost of executing this opportunity
   */
  get totalCost(): number {
    return this.legs
      .filter(l => l.side.isBuy)
      .reduce((sum, l) => sum + l.price * l.size, 0)
  }

  /**
   * Check if opportunity is still valid
   */
  get isValid(): boolean {
    return this.status === OpportunityStatus.PENDING && this.expiresAt > new Date()
  }

  /**
   * Check if opportunity has expired
   */
  get isExpired(): boolean {
    return this.expiresAt <= new Date()
  }

  /**
   * Check if opportunity is worth executing
   */
  isProfitable(minProfit: number = 0, minProfitPercent: number = 0): boolean {
    return this.expectedProfit >= minProfit && this.expectedProfitPercent >= minProfitPercent
  }

  /**
   * Mark as executing
   */
  markExecuting(): void {
    this.status = OpportunityStatus.EXECUTING
  }

  /**
   * Mark as executed
   */
  markExecuted(): void {
    this.status = OpportunityStatus.EXECUTED
  }

  /**
   * Mark as failed
   */
  markFailed(): void {
    this.status = OpportunityStatus.FAILED
  }

  /**
   * Mark as expired
   */
  markExpired(): void {
    this.status = OpportunityStatus.EXPIRED
  }

  /**
   * Mark as skipped
   */
  markSkipped(): void {
    this.status = OpportunityStatus.SKIPPED
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      legs: this.legs.map(l => ({
        marketId: l.marketId,
        tokenId: l.tokenId,
        side: l.side.toString(),
        price: l.price,
        size: l.size,
      })),
      expectedProfit: this.expectedProfit,
      expectedProfitPercent: this.expectedProfitPercent,
      confidence: this.confidence,
      status: this.status,
      totalCost: this.totalCost,
      expiresAt: this.expiresAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
      isValid: this.isValid,
      metadata: this.metadata,
    }
  }
}

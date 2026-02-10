import type { Opportunity } from '../../domain/entities/opportunity.entity.js'
import type { Trade } from '../../domain/entities/trade.entity.js'
import type { IPositionSizing, IStrategy, PositionSizeParams, StrategyConfig, StrategyEvent, StrategyEventListener, StrategyStats, TradeResult } from './strategy.interface.js'
import { EventEmitter } from 'node:events'
import logger from '../../common/logger.js'
import { StrategyEventType } from './strategy.interface.js'

/**
 * Abstract base strategy implementing the Template Method pattern
 * Provides common functionality while allowing subclasses to customize specific behaviors
 */
export abstract class BaseStrategy extends EventEmitter implements IStrategy {
  protected _enabled: boolean = true
  protected _running: boolean = false
  protected _stats: StrategyStats = {
    opportunitiesFound: 0,
    opportunitiesExecuted: 0,
    totalPnL: 0,
    winRate: 0,
    avgProfit: 0,
    lastRunAt: null,
    runCount: 0,
  }

  protected positionSizing: IPositionSizing | null = null
  protected params: Record<string, unknown> = {}

  constructor(
    public readonly name: string,
    public readonly type: string,
  ) {
    super()
  }

  // ============ IStrategyLifecycle ============

  async start(): Promise<void> {
    if (this._running) {
      logger.warn(`[${this.name}] Strategy already running`)
      return
    }

    this._running = true
    this.emitEvent(StrategyEventType.STARTED)
    logger.info(`[${this.name}] Strategy started`)

    await this.onStart()
  }

  async stop(): Promise<void> {
    if (!this._running) {
      logger.warn(`[${this.name}] Strategy not running`)
      return
    }

    await this.onStop()
    this._running = false
    this.emitEvent(StrategyEventType.STOPPED)
    logger.info(`[${this.name}] Strategy stopped`)
  }

  isRunning(): boolean {
    return this._running
  }

  // ============ IStrategy ============

  get enabled(): boolean {
    return this._enabled
  }

  getConfig(): StrategyConfig {
    return {
      enabled: this._enabled,
      params: { ...this.params },
    }
  }

  updateConfig(config: Partial<StrategyConfig>): void {
    if (config.enabled !== undefined) {
      this._enabled = config.enabled
    }
    if (config.params) {
      this.params = { ...this.params, ...config.params }
    }
    logger.info(`[${this.name}] Config updated`, config)
  }

  getStats(): StrategyStats {
    return { ...this._stats }
  }

  // ============ Template Method Pattern ============

  /**
   * Main execution method - Template Method
   * Defines the skeleton of the strategy execution algorithm
   */
  async run(): Promise<void> {
    if (!this._enabled) {
      logger.debug(`[${this.name}] Strategy disabled, skipping run`)
      return
    }

    if (!this._running) {
      logger.debug(`[${this.name}] Strategy not started, skipping run`)
      return
    }

    try {
      this._stats.runCount++
      this._stats.lastRunAt = new Date()

      // Step 1: Scan for opportunities
      const opportunities = await this.scan()

      if (opportunities.length === 0) {
        logger.debug(`[${this.name}] No opportunities found`)
        return
      }

      this._stats.opportunitiesFound += opportunities.length
      logger.info(`[${this.name}] Found ${opportunities.length} opportunities`)

      // Step 2: Validate and prioritize opportunities
      const validOpportunities = await this.filterOpportunities(opportunities)

      // Step 3: Execute each valid opportunity
      for (const opportunity of validOpportunities) {
        if (!this._running)
          break

        try {
          // Validate opportunity is still valid
          if (!await this.validateOpportunity(opportunity)) {
            logger.debug(`[${this.name}] Opportunity ${opportunity.id} no longer valid`)
            continue
          }

          // Calculate position size
          const size = await this.calculatePositionSize(opportunity)
          if (size <= 0) {
            logger.debug(`[${this.name}] Position size too small for opportunity ${opportunity.id}`)
            continue
          }

          // Execute the trade
          this.emitEvent(StrategyEventType.OPPORTUNITY_FOUND, opportunity)
          const result = await this.execute(opportunity)

          if (result.success) {
            this._stats.opportunitiesExecuted++
            this._stats.totalPnL += result.totalProfit ?? 0
            this.emitEvent(StrategyEventType.TRADE_EXECUTED, result)
            this.updateWinRate((result.totalProfit ?? 0) > 0)
          }
        }
        catch (error) {
          logger.error(`[${this.name}] Error executing opportunity ${opportunity.id}`, error)
          this.emitEvent(StrategyEventType.ERROR, { opportunity, error })
        }
      }
    }
    catch (error) {
      logger.error(`[${this.name}] Error during strategy run`, error)
      this.emitEvent(StrategyEventType.ERROR, { error })
    }
  }

  // ============ Abstract Methods (to be implemented by subclasses) ============

  /**
   * Scan for trading opportunities
   * Must be implemented by each strategy
   */
  abstract scan(): Promise<Opportunity[]>

  /**
   * Execute a trading opportunity
   * Must be implemented by each strategy
   */
  abstract execute(opportunity: Opportunity): Promise<TradeResult>

  // ============ Hook Methods (can be overridden by subclasses) ============

  /**
   * Called when strategy starts
   */
  protected async onStart(): Promise<void> {
    // Default: no-op, can be overridden
  }

  /**
   * Called when strategy stops
   */
  protected async onStop(): Promise<void> {
    // Default: no-op, can be overridden
  }

  /**
   * Validate if an opportunity is still valid
   * Default: check if not expired
   */
  protected async validateOpportunity(opportunity: Opportunity): Promise<boolean> {
    return opportunity.isValid
  }

  /**
   * Filter and prioritize opportunities
   * Default: filter valid and sort by profit
   */
  protected async filterOpportunities(opportunities: Opportunity[]): Promise<Opportunity[]> {
    return opportunities
      .filter(o => o.isValid && o.expectedProfit > 0)
      .sort((a, b) => b.expectedProfit - a.expectedProfit)
  }

  /**
   * Calculate position size for an opportunity
   * Can use injected position sizing strategy
   */
  protected async calculatePositionSize(opportunity: Opportunity): Promise<number> {
    if (this.positionSizing) {
      const params: PositionSizeParams = {
        capital: this.getAvailableCapital(),
        winProbability: opportunity.confidence,
        odds: 1 / opportunity.expectedProfitPercent * 100,
        price: opportunity.totalCost,
        maxFraction: this.params.maxPositionFraction as number ?? 0.25,
        minSize: this.params.minPositionSize as number ?? 1,
      }
      return this.positionSizing.calculate(params)
    }

    // Default: use a fixed fraction of capital
    const fraction = this.params.defaultPositionFraction as number ?? 0.1
    return this.getAvailableCapital() * fraction
  }

  // ============ Utility Methods ============

  /**
   * Get available capital for trading
   * Should be overridden to get actual balance
   */
  protected getAvailableCapital(): number {
    return this.params.availableCapital as number ?? 100
  }

  /**
   * Set position sizing strategy
   */
  setPositionSizing(sizing: IPositionSizing): void {
    this.positionSizing = sizing
  }

  /**
   * Add event listener
   */
  onEvent(listener: StrategyEventListener): () => void {
    this.on('strategy_event', listener)
    return () => this.off('strategy_event', listener)
  }

  /**
   * Emit strategy event
   */
  protected emitEvent(type: StrategyEventType, data?: unknown): void {
    const event: StrategyEvent = {
      type,
      strategyName: this.name,
      data,
      timestamp: new Date(),
    }
    this.emit('strategy_event', event)
  }

  /**
   * Update win rate statistics
   */
  protected updateWinRate(isWin: boolean): void {
    const totalTrades = this._stats.opportunitiesExecuted
    const wins = isWin
      ? Math.round(this._stats.winRate * (totalTrades - 1)) + 1
      : Math.round(this._stats.winRate * (totalTrades - 1))
    this._stats.winRate = totalTrades > 0 ? wins / totalTrades : 0
    this._stats.avgProfit = totalTrades > 0 ? this._stats.totalPnL / totalTrades : 0
  }

  /**
   * Create trade record from execution
   */
  protected createTrade(params: {
    orderId: string
    marketId: string
    tokenId: string
    side: string
    price: number
    size: number
    fee?: number
    outcome?: string
    transactionHash?: string
  }): Trade {
    // This would typically use the Trade entity factory
    // For now, return a minimal Trade-like object
    return {
      id: `trade_${Date.now()}`,
      orderId: params.orderId,
      marketId: params.marketId,
      tokenId: params.tokenId,
      side: params.side,
      price: params.price,
      size: params.size,
      fee: params.fee ?? 0,
      outcome: params.outcome ?? '',
      status: 'executed',
      traderSide: 'TAKER',
      transactionHash: params.transactionHash ?? '',
      matchTime: new Date(),
      value: params.size * params.price,
      feeAmount: 0,
      netValue: params.size * params.price,
      isBuy: params.side === 'BUY',
      isSell: params.side === 'SELL',
      isMaker: false,
      isTaker: true,
      toJSON: () => ({}),
    } as unknown as Trade
  }
}

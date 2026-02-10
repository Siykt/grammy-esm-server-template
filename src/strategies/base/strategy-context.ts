import type { IStrategy, StrategyEventListener } from './strategy.interface.js'
import { EventEmitter } from 'node:events'
import logger from '../../common/logger.js'

/**
 * Strategy Context / Manager
 * Manages multiple strategies and coordinates their execution
 */
export class StrategyContext extends EventEmitter {
  private strategies: Map<string, IStrategy> = new Map()
  private running: boolean = false
  private scanInterval: NodeJS.Timeout | null = null

  constructor(
    private readonly scanIntervalMs: number = 10000, // 10 seconds default
  ) {
    super()
  }

  /**
   * Register a strategy
   */
  register(strategy: IStrategy): void {
    if (this.strategies.has(strategy.name)) {
      logger.warn(`[StrategyContext] Strategy ${strategy.name} already registered`)
      return
    }

    this.strategies.set(strategy.name, strategy)
    logger.info(`[StrategyContext] Registered strategy: ${strategy.name}`)
  }

  /**
   * Unregister a strategy
   */
  unregister(name: string): boolean {
    const strategy = this.strategies.get(name)
    if (strategy) {
      if (strategy.isRunning()) {
        strategy.stop()
      }
      this.strategies.delete(name)
      logger.info(`[StrategyContext] Unregistered strategy: ${name}`)
      return true
    }
    return false
  }

  /**
   * Get a strategy by name
   */
  get(name: string): IStrategy | undefined {
    return this.strategies.get(name)
  }

  /**
   * Get all registered strategies
   */
  getAll(): IStrategy[] {
    return Array.from(this.strategies.values())
  }

  /**
   * Get all strategies (alias for getAll)
   */
  getAllStrategies(): IStrategy[] {
    return this.getAll()
  }

  /**
   * Get enabled strategies
   */
  getEnabled(): IStrategy[] {
    return this.getAll().filter(s => s.enabled)
  }

  /**
   * Start all enabled strategies
   */
  async startAll(): Promise<void> {
    if (this.running) {
      logger.warn('[StrategyContext] Already running')
      return
    }

    this.running = true

    // Start each enabled strategy
    const enabledStrategies = this.getEnabled()
    await Promise.all(enabledStrategies.map(s => s.start()))

    // Start the scan interval
    this.startScanInterval()

    logger.info(`[StrategyContext] Started ${enabledStrategies.length} strategies`)
    this.emit('started')
  }

  /**
   * Stop all strategies
   */
  async stopAll(): Promise<void> {
    if (!this.running) {
      logger.warn('[StrategyContext] Not running')
      return
    }

    // Stop scan interval
    this.stopScanInterval()

    // Stop each strategy
    await Promise.all(this.getAll().map(s => s.stop()))

    this.running = false
    logger.info('[StrategyContext] All strategies stopped')
    this.emit('stopped')
  }

  /**
   * Start a specific strategy
   */
  async start(name: string): Promise<boolean> {
    const strategy = this.strategies.get(name)
    if (!strategy) {
      logger.warn(`[StrategyContext] Strategy ${name} not found`)
      return false
    }

    await strategy.start()
    return true
  }

  /**
   * Stop a specific strategy
   */
  async stop(name: string): Promise<boolean> {
    const strategy = this.strategies.get(name)
    if (!strategy) {
      logger.warn(`[StrategyContext] Strategy ${name} not found`)
      return false
    }

    await strategy.stop()
    return true
  }

  /**
   * Enable a strategy
   */
  enable(name: string): boolean {
    const strategy = this.strategies.get(name)
    if (!strategy)
      return false

    strategy.updateConfig({ enabled: true })
    return true
  }

  /**
   * Disable a strategy
   */
  disable(name: string): boolean {
    const strategy = this.strategies.get(name)
    if (!strategy)
      return false

    strategy.updateConfig({ enabled: false })
    return true
  }

  /**
   * Run all enabled strategies once
   */
  async runOnce(): Promise<void> {
    const enabledStrategies = this.getEnabled().filter(s => s.isRunning())

    logger.debug(`[StrategyContext] Running ${enabledStrategies.length} strategies`)

    await Promise.all(
      enabledStrategies.map(async (strategy) => {
        try {
          await strategy.run()
        }
        catch (error) {
          logger.error(`[StrategyContext] Error running strategy ${strategy.name}`, error)
        }
      }),
    )
  }

  /**
   * Run all enabled strategies and return results
   */
  async runAll(): Promise<Array<{ strategy: string, opportunities?: number, executed?: number, error?: string }>> {
    const enabledStrategies = this.getEnabled().filter(s => s.isRunning())
    const results: Array<{ strategy: string, opportunities?: number, executed?: number, error?: string }> = []

    logger.debug(`[StrategyContext] Running ${enabledStrategies.length} strategies`)

    await Promise.all(
      enabledStrategies.map(async (strategy) => {
        try {
          const opportunities = await strategy.scan()
          let executed = 0

          for (const opportunity of opportunities) {
            const result = await strategy.execute(opportunity)
            if (result.success) {
              executed++
            }
          }

          results.push({
            strategy: strategy.name,
            opportunities: opportunities.length,
            executed,
          })
        }
        catch (error) {
          logger.error(`[StrategyContext] Error running strategy ${strategy.name}`, error)
          results.push({
            strategy: strategy.name,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }),
    )

    return results
  }

  /**
   * Get combined statistics from all strategies
   */
  getStats() {
    const strategies = this.getAll()
    const stats = strategies.map(s => ({
      name: s.name,
      type: s.type,
      enabled: s.enabled,
      running: s.isRunning(),
      ...s.getStats(),
    }))

    const totals = {
      strategiesCount: strategies.length,
      enabledCount: strategies.filter(s => s.enabled).length,
      runningCount: strategies.filter(s => s.isRunning()).length,
      totalOpportunitiesFound: stats.reduce((sum, s) => sum + s.opportunitiesFound, 0),
      totalOpportunitiesExecuted: stats.reduce((sum, s) => sum + s.opportunitiesExecuted, 0),
      totalPnL: stats.reduce((sum, s) => sum + s.totalPnL, 0),
      avgWinRate: stats.length > 0
        ? stats.reduce((sum, s) => sum + s.winRate, 0) / stats.length
        : 0,
    }

    return { strategies: stats, totals }
  }

  /**
   * Add event listener for strategy events
   */
  onStrategyEvent(listener: StrategyEventListener): () => void {
    // Subscribe to events from all strategies
    const unsubscribers: Array<() => void> = []

    for (const strategy of this.strategies.values()) {
      if ('onEvent' in strategy && typeof strategy.onEvent === 'function') {
        // eslint-disable-next-line ts/no-explicit-any
        unsubscribers.push((strategy as any).onEvent(listener))
      }
    }

    return () => unsubscribers.forEach(unsub => unsub())
  }

  /**
   * Check if context is running
   */
  isRunning(): boolean {
    return this.running
  }

  // ============ Private Methods ============

  private startScanInterval(): void {
    this.stopScanInterval()
    this.scanInterval = setInterval(() => {
      this.runOnce().catch((error) => {
        logger.error('[StrategyContext] Error in scan interval', error)
      })
    }, this.scanIntervalMs)
    logger.info(`[StrategyContext] Scan interval started: ${this.scanIntervalMs}ms`)
  }

  private stopScanInterval(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval)
      this.scanInterval = null
      logger.info('[StrategyContext] Scan interval stopped')
    }
  }

  /**
   * Update scan interval
   */
  setScanInterval(ms: number): void {
    const wasRunning = this.running
    if (wasRunning) {
      this.stopScanInterval()
    }
    // eslint-disable-next-line ts/no-explicit-any
    (this as any).scanIntervalMs = ms
    if (wasRunning) {
      this.startScanInterval()
    }
  }
}

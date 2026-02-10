import type { Opportunity } from '../../domain/entities/opportunity.entity.js'
import type { Trade } from '../../domain/entities/trade.entity.js'

/**
 * Trade execution result
 */
export interface TradeResult {
  success: boolean
  trades: Trade[]
  totalProfit?: number
  error?: string
}

/**
 * Strategy configuration
 */
export interface StrategyConfig {
  enabled: boolean
  maxConcurrentTrades?: number
  maxDailyTrades?: number
  params?: Record<string, unknown>
}

/**
 * Strategy lifecycle interface
 */
export interface IStrategyLifecycle {
  /** Start the strategy */
  start: () => Promise<void>

  /** Stop the strategy */
  stop: () => Promise<void>

  /** Check if strategy is running */
  isRunning: () => boolean
}

/**
 * Opportunity scanner interface (Interface Segregation)
 */
export interface IOpportunityScanner {
  /** Scan for trading opportunities */
  scan: () => Promise<Opportunity[]>
}

/**
 * Trade executor interface (Interface Segregation)
 */
export interface ITradeExecutor {
  /** Execute a trading opportunity */
  execute: (opportunity: Opportunity) => Promise<TradeResult>
}

/**
 * Position sizing interface
 */
export interface IPositionSizing {
  /** Calculate optimal position size */
  calculate: (params: PositionSizeParams) => number
}

/**
 * Parameters for position sizing calculation
 */
export interface PositionSizeParams {
  /** Available capital */
  capital: number
  /** Win probability (0-1) */
  winProbability: number
  /** Odds (payout ratio) */
  odds: number
  /** Current price */
  price: number
  /** Maximum allowed fraction of capital */
  maxFraction?: number
  /** Minimum position size */
  minSize?: number
}

/**
 * Full strategy interface combining all capabilities
 */
export interface IStrategy extends IStrategyLifecycle, IOpportunityScanner, ITradeExecutor {
  /** Strategy unique name */
  readonly name: string

  /** Whether strategy is enabled */
  readonly enabled: boolean

  /** Strategy type/category */
  readonly type: string

  /** Get strategy configuration */
  getConfig: () => StrategyConfig

  /** Update strategy configuration */
  updateConfig: (config: Partial<StrategyConfig>) => void

  /** Run one iteration of the strategy */
  run: () => Promise<void>

  /** Get strategy statistics */
  getStats: () => StrategyStats
}

/**
 * Strategy execution statistics
 */
export interface StrategyStats {
  /** Total opportunities found */
  opportunitiesFound: number
  /** Total opportunities executed */
  opportunitiesExecuted: number
  /** Total profit/loss */
  totalPnL: number
  /** Win rate (0-1) */
  winRate: number
  /** Average profit per trade */
  avgProfit: number
  /** Last execution time */
  lastRunAt: Date | null
  /** Execution count */
  runCount: number
}

/**
 * Strategy event types
 */
export enum StrategyEventType {
  STARTED = 'strategy:started',
  STOPPED = 'strategy:stopped',
  OPPORTUNITY_FOUND = 'strategy:opportunity_found',
  TRADE_EXECUTED = 'strategy:trade_executed',
  ERROR = 'strategy:error',
}

/**
 * Strategy event
 */
export interface StrategyEvent {
  type: StrategyEventType
  strategyName: string
  data?: unknown
  timestamp: Date
}

/**
 * Strategy event listener
 */
export type StrategyEventListener = (event: StrategyEvent) => void

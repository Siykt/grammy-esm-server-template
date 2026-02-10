import type { Position } from '../domain/entities/position.entity.js'
import type { RiskAlertEvent } from '../domain/events/risk-alert.event.js'

/**
 * Risk Metrics
 * Calculated metrics for portfolio risk assessment
 */
export interface RiskMetrics {
  totalExposure: number
  maxPositionSize: number
  currentDrawdown: number
  maxDrawdown: number
  drawdownPercent: number
  positionCount: number
  unrealizedPnL: number
  realizedPnL: number
  totalPnL: number
  riskScore: number // 0-100, higher is riskier
  timestamp: Date
}

/**
 * Risk Limits Configuration
 */
export interface RiskLimits {
  maxPositionSize: number // Maximum size for a single position
  maxTotalExposure: number // Maximum total portfolio exposure
  maxDrawdownPercent: number // Maximum drawdown percentage before alert
  maxPositions: number // Maximum number of concurrent positions
  maxPerMarketExposure: number // Maximum exposure per market
  dailyLossLimit: number // Maximum daily loss
}

/**
 * Stop-Loss Configuration
 */
export interface StopLossConfig {
  type: 'fixed' | 'trailing' | 'percentage'
  value: number // Price or percentage depending on type
  trailingOffset?: number // For trailing stop
  activated: boolean
  triggerPrice?: number
}

/**
 * Take-Profit Configuration
 */
export interface TakeProfitConfig {
  type: 'fixed' | 'percentage' | 'partial'
  value: number // Price or percentage
  partialPercent?: number // Percentage to close for partial take-profit
  activated: boolean
  triggerPrice?: number
}

/**
 * Position Risk Settings
 */
export interface PositionRiskSettings {
  positionId: string
  stopLoss?: StopLossConfig
  takeProfit?: TakeProfitConfig
  createdAt: Date
  updatedAt: Date
}

/**
 * Risk Check Result
 */
export interface RiskCheckResult {
  passed: boolean
  reason?: string
  metrics?: Record<string, unknown>
}

/**
 * Risk Manager Interface
 * Main interface for risk management operations
 */
export interface IRiskManager {
  // Limit checks
  checkPositionLimit: (size: number, price: number) => RiskCheckResult
  checkExposureLimit: (additionalExposure: number) => RiskCheckResult
  checkDrawdown: () => RiskCheckResult
  checkDailyLoss: () => RiskCheckResult
  checkAllLimits: (size: number, price: number) => RiskCheckResult

  // Risk evaluation
  evaluateRisk: (positions: Position[]) => RiskMetrics
  evaluatePosition: (position: Position) => RiskCheckResult

  // Stop-loss/Take-profit management
  setStopLoss: (positionId: string, config: StopLossConfig) => void
  setTakeProfit: (positionId: string, config: TakeProfitConfig) => void
  getPositionRiskSettings: (positionId: string) => PositionRiskSettings | undefined
  removePositionRiskSettings: (positionId: string) => void

  // Position monitoring
  checkStopLoss: (position: Position) => boolean
  checkTakeProfit: (position: Position) => boolean
  evaluateAllPositions: (positions: Position[]) => RiskAlertEvent[]

  // Limit configuration
  setLimits: (limits: Partial<RiskLimits>) => void
  getLimits: () => RiskLimits

  // Event handling
  onRiskAlert: (callback: (event: RiskAlertEvent) => void) => () => void
}

/**
 * Stop-Loss Handler Interface
 */
export interface IStopLossHandler {
  evaluate: (position: Position, config: StopLossConfig) => boolean
  calculateTriggerPrice: (position: Position, config: StopLossConfig) => number
  updateTrailingStop: (position: Position, config: StopLossConfig) => StopLossConfig
}

/**
 * Take-Profit Handler Interface
 */
export interface ITakeProfitHandler {
  evaluate: (position: Position, config: TakeProfitConfig) => boolean
  calculateTriggerPrice: (position: Position, config: TakeProfitConfig) => number
  calculatePartialSize: (position: Position, config: TakeProfitConfig) => number
}

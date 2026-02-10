import type { Position } from '../domain/entities/position.entity.js'
import type {
  IRiskManager,
  PositionRiskSettings,
  RiskCheckResult,
  RiskLimits,
  RiskMetrics,
  StopLossConfig,
  TakeProfitConfig,
} from './risk-manager.interface.js'
import { EventEmitter } from 'node:events'
import logger from '../common/logger.js'
import { RiskAlertEvent, RiskAlertLevel, RiskAlertType } from '../domain/events/risk-alert.event.js'
import { StopLossHandler } from './stop-loss.handler.js'
import { TakeProfitHandler } from './take-profit.handler.js'

/**
 * Default risk limits
 */
const DEFAULT_RISK_LIMITS: RiskLimits = {
  maxPositionSize: 1000, // Maximum $1000 per position
  maxTotalExposure: 10000, // Maximum $10,000 total exposure
  maxDrawdownPercent: 10, // Maximum 10% drawdown
  maxPositions: 10, // Maximum 10 concurrent positions
  maxPerMarketExposure: 2000, // Maximum $2000 per market
  dailyLossLimit: 500, // Maximum $500 daily loss
}

/**
 * Risk Manager Service
 *
 * Central service for all risk management operations:
 * - Position limits and exposure monitoring
 * - Drawdown tracking
 * - Stop-loss and take-profit management
 * - Risk metrics calculation
 */
export class RiskManagerService extends EventEmitter implements IRiskManager {
  private limits: RiskLimits
  private positionRiskSettings: Map<string, PositionRiskSettings> = new Map()
  private stopLossHandler: StopLossHandler
  private takeProfitHandler: TakeProfitHandler

  // Tracking state
  private peakPortfolioValue = 0
  private currentDrawdown = 0
  private maxDrawdown = 0
  private dailyPnL = 0
  private lastDailyReset: Date = new Date()

  constructor(limits?: Partial<RiskLimits>) {
    super()
    this.limits = { ...DEFAULT_RISK_LIMITS, ...limits }
    this.stopLossHandler = new StopLossHandler()
    this.takeProfitHandler = new TakeProfitHandler()
  }

  // ==================== Limit Checks ====================

  /**
   * Check if a new position size is within limits
   */
  checkPositionLimit(size: number, price: number): RiskCheckResult {
    const positionValue = size * price

    if (positionValue > this.limits.maxPositionSize) {
      return {
        passed: false,
        reason: `Position value $${positionValue.toFixed(2)} exceeds limit $${this.limits.maxPositionSize}`,
        metrics: { positionValue },
      }
    }

    return { passed: true }
  }

  /**
   * Check if additional exposure is within total exposure limit
   */
  checkExposureLimit(additionalExposure: number): RiskCheckResult {
    // This would need current exposure from positions
    // For now, just check against the limit
    if (additionalExposure > this.limits.maxTotalExposure) {
      return {
        passed: false,
        reason: `Additional exposure $${additionalExposure.toFixed(2)} exceeds total limit $${this.limits.maxTotalExposure}`,
        metrics: { additionalExposure },
      }
    }

    return { passed: true }
  }

  /**
   * Check if current drawdown is within limits
   */
  checkDrawdown(): RiskCheckResult {
    const drawdownPercent = this.peakPortfolioValue > 0
      ? (this.currentDrawdown / this.peakPortfolioValue) * 100
      : 0

    if (drawdownPercent > this.limits.maxDrawdownPercent) {
      return {
        passed: false,
        reason: `Drawdown ${drawdownPercent.toFixed(2)}% exceeds limit ${this.limits.maxDrawdownPercent}%`,
        metrics: { drawdownPercent, currentDrawdown: this.currentDrawdown },
      }
    }

    return { passed: true, metrics: { drawdownPercent } }
  }

  /**
   * Check if daily loss limit has been reached
   */
  checkDailyLoss(): RiskCheckResult {
    this.checkDailyReset()

    if (this.dailyPnL < -this.limits.dailyLossLimit) {
      return {
        passed: false,
        reason: `Daily loss $${Math.abs(this.dailyPnL).toFixed(2)} exceeds limit $${this.limits.dailyLossLimit}`,
        metrics: { dailyPnL: this.dailyPnL },
      }
    }

    return { passed: true, metrics: { dailyPnL: this.dailyPnL } }
  }

  /**
   * Run all limit checks
   */
  checkAllLimits(size: number, price: number): RiskCheckResult {
    const checks = [
      this.checkPositionLimit(size, price),
      this.checkDrawdown(),
      this.checkDailyLoss(),
    ]

    for (const check of checks) {
      if (!check.passed) {
        return check
      }
    }

    return { passed: true }
  }

  // ==================== Risk Evaluation ====================

  /**
   * Evaluate risk metrics for a portfolio of positions
   */
  evaluateRisk(positions: Position[]): RiskMetrics {
    let totalExposure = 0
    let maxPositionSize = 0
    let unrealizedPnL = 0
    let realizedPnL = 0

    for (const position of positions) {
      const positionValue = position.currentValue
      totalExposure += positionValue
      maxPositionSize = Math.max(maxPositionSize, positionValue)
      unrealizedPnL += position.unrealizedPnL
      realizedPnL += position.realizedPnL
    }

    const totalPnL = unrealizedPnL + realizedPnL
    const portfolioValue = totalExposure + unrealizedPnL

    // Update peak and drawdown tracking
    if (portfolioValue > this.peakPortfolioValue) {
      this.peakPortfolioValue = portfolioValue
    }
    this.currentDrawdown = this.peakPortfolioValue - portfolioValue
    this.maxDrawdown = Math.max(this.maxDrawdown, this.currentDrawdown)

    const drawdownPercent = this.peakPortfolioValue > 0
      ? (this.currentDrawdown / this.peakPortfolioValue) * 100
      : 0

    // Calculate risk score (0-100)
    const riskScore = this.calculateRiskScore({
      totalExposure,
      maxPositionSize,
      drawdownPercent,
      positionCount: positions.length,
      dailyPnL: this.dailyPnL,
    })

    return {
      totalExposure,
      maxPositionSize,
      currentDrawdown: this.currentDrawdown,
      maxDrawdown: this.maxDrawdown,
      drawdownPercent,
      positionCount: positions.length,
      unrealizedPnL,
      realizedPnL,
      totalPnL,
      riskScore,
      timestamp: new Date(),
    }
  }

  /**
   * Evaluate a single position for risk
   */
  evaluatePosition(position: Position): RiskCheckResult {
    const positionValue = position.currentValue

    // Check position size
    if (positionValue > this.limits.maxPositionSize) {
      return {
        passed: false,
        reason: `Position exceeds size limit`,
        metrics: { positionValue },
      }
    }

    // Check if position is at significant loss
    const lossPercent = position.unrealizedPnLPercent
    if (lossPercent < -this.limits.maxDrawdownPercent) {
      return {
        passed: false,
        reason: `Position loss ${Math.abs(lossPercent).toFixed(2)}% exceeds drawdown limit`,
        metrics: { lossPercent },
      }
    }

    return { passed: true }
  }

  // ==================== Stop-Loss / Take-Profit ====================

  /**
   * Set stop-loss for a position
   */
  setStopLoss(positionId: string, config: StopLossConfig): void {
    let settings = this.positionRiskSettings.get(positionId)
    const now = new Date()

    if (settings) {
      settings.stopLoss = config
      settings.updatedAt = now
    }
    else {
      settings = {
        positionId,
        stopLoss: config,
        createdAt: now,
        updatedAt: now,
      }
    }

    this.positionRiskSettings.set(positionId, settings)
    logger.info(`[RiskManager] Stop-loss set for position ${positionId}: ${config.type} @ ${config.value}`)
  }

  /**
   * Set take-profit for a position
   */
  setTakeProfit(positionId: string, config: TakeProfitConfig): void {
    let settings = this.positionRiskSettings.get(positionId)
    const now = new Date()

    if (settings) {
      settings.takeProfit = config
      settings.updatedAt = now
    }
    else {
      settings = {
        positionId,
        takeProfit: config,
        createdAt: now,
        updatedAt: now,
      }
    }

    this.positionRiskSettings.set(positionId, settings)
    logger.info(`[RiskManager] Take-profit set for position ${positionId}: ${config.type} @ ${config.value}`)
  }

  /**
   * Get risk settings for a position
   */
  getPositionRiskSettings(positionId: string): PositionRiskSettings | undefined {
    return this.positionRiskSettings.get(positionId)
  }

  /**
   * Remove risk settings for a position
   */
  removePositionRiskSettings(positionId: string): void {
    this.positionRiskSettings.delete(positionId)
  }

  /**
   * Check if stop-loss should be triggered for a position
   */
  checkStopLoss(position: Position): boolean {
    const settings = this.positionRiskSettings.get(position.id)
    if (!settings?.stopLoss) {
      return false
    }

    // Update trailing stop if applicable
    if (settings.stopLoss.type === 'trailing') {
      const updatedConfig = this.stopLossHandler.updateTrailingStop(position, settings.stopLoss)
      if (updatedConfig !== settings.stopLoss) {
        settings.stopLoss = updatedConfig
        settings.updatedAt = new Date()
      }
    }

    return this.stopLossHandler.evaluate(position, settings.stopLoss)
  }

  /**
   * Check if take-profit should be triggered for a position
   */
  checkTakeProfit(position: Position): boolean {
    const settings = this.positionRiskSettings.get(position.id)
    if (!settings?.takeProfit) {
      return false
    }

    return this.takeProfitHandler.evaluate(position, settings.takeProfit)
  }

  /**
   * Evaluate all positions and generate risk alerts
   */
  evaluateAllPositions(positions: Position[]): RiskAlertEvent[] {
    const alerts: RiskAlertEvent[] = []

    // Calculate overall metrics
    const metrics = this.evaluateRisk(positions)

    // Check drawdown limit
    if (metrics.drawdownPercent > this.limits.maxDrawdownPercent) {
      const alert = new RiskAlertEvent(
        RiskAlertType.DRAWDOWN_WARNING,
        RiskAlertLevel.CRITICAL,
        `Portfolio drawdown ${metrics.drawdownPercent.toFixed(2)}% exceeds limit ${this.limits.maxDrawdownPercent}%`,
        undefined,
        { drawdownPercent: metrics.drawdownPercent, maxDrawdown: this.limits.maxDrawdownPercent },
      )
      alerts.push(alert)
      this.emitAlert(alert)
    }
    else if (metrics.drawdownPercent > this.limits.maxDrawdownPercent * 0.8) {
      const alert = new RiskAlertEvent(
        RiskAlertType.DRAWDOWN_WARNING,
        RiskAlertLevel.WARNING,
        `Portfolio drawdown ${metrics.drawdownPercent.toFixed(2)}% approaching limit ${this.limits.maxDrawdownPercent}%`,
        undefined,
        { drawdownPercent: metrics.drawdownPercent },
      )
      alerts.push(alert)
      this.emitAlert(alert)
    }

    // Check position count
    if (metrics.positionCount >= this.limits.maxPositions) {
      const alert = new RiskAlertEvent(
        RiskAlertType.POSITION_LIMIT_WARNING,
        RiskAlertLevel.WARNING,
        `Position count ${metrics.positionCount} at limit ${this.limits.maxPositions}`,
        undefined,
        { positionCount: metrics.positionCount },
      )
      alerts.push(alert)
      this.emitAlert(alert)
    }

    // Check total exposure
    if (metrics.totalExposure > this.limits.maxTotalExposure * 0.9) {
      const alert = new RiskAlertEvent(
        RiskAlertType.EXPOSURE_LIMIT_WARNING,
        RiskAlertLevel.WARNING,
        `Total exposure $${metrics.totalExposure.toFixed(2)} approaching limit $${this.limits.maxTotalExposure}`,
        undefined,
        { totalExposure: metrics.totalExposure },
      )
      alerts.push(alert)
      this.emitAlert(alert)
    }

    // Check individual positions
    for (const position of positions) {
      // Check stop-loss
      if (this.checkStopLoss(position)) {
        const alert = new RiskAlertEvent(
          RiskAlertType.STOP_LOSS_TRIGGERED,
          RiskAlertLevel.CRITICAL,
          `Stop-loss triggered for position ${position.id.slice(0, 8)}... at price ${position.currentPrice.amount.toFixed(4)}`,
          position,
          { currentPrice: position.currentPrice.amount, unrealizedPnL: position.unrealizedPnL },
        )
        alerts.push(alert)
        this.emitAlert(alert)
      }

      // Check take-profit
      if (this.checkTakeProfit(position)) {
        const alert = new RiskAlertEvent(
          RiskAlertType.TAKE_PROFIT_TRIGGERED,
          RiskAlertLevel.INFO,
          `Take-profit triggered for position ${position.id.slice(0, 8)}... at price ${position.currentPrice.amount.toFixed(4)}`,
          position,
          { currentPrice: position.currentPrice.amount, unrealizedPnL: position.unrealizedPnL },
        )
        alerts.push(alert)
        this.emitAlert(alert)
      }
    }

    return alerts
  }

  // ==================== Limit Configuration ====================

  /**
   * Update risk limits
   */
  setLimits(limits: Partial<RiskLimits>): void {
    this.limits = { ...this.limits, ...limits }
    logger.info('[RiskManager] Risk limits updated', this.limits)
  }

  /**
   * Get current risk limits
   */
  getLimits(): RiskLimits {
    return { ...this.limits }
  }

  // ==================== Event Handling ====================

  /**
   * Subscribe to risk alerts
   */
  onRiskAlert(callback: (event: RiskAlertEvent) => void): () => void {
    this.on('riskAlert', callback)
    return () => this.off('riskAlert', callback)
  }

  // ==================== Internal Methods ====================

  private emitAlert(alert: RiskAlertEvent): void {
    this.emit('riskAlert', alert)
    logger.warn(`[RiskManager] ${alert.level.toUpperCase()}: ${alert.message}`)
  }

  private calculateRiskScore(params: {
    totalExposure: number
    maxPositionSize: number
    drawdownPercent: number
    positionCount: number
    dailyPnL: number
  }): number {
    let score = 0

    // Exposure utilization (0-30 points)
    const exposureUtil = params.totalExposure / this.limits.maxTotalExposure
    score += Math.min(30, exposureUtil * 30)

    // Position concentration (0-20 points)
    const concentrationRatio = params.maxPositionSize / params.totalExposure
    score += Math.min(20, concentrationRatio * 20)

    // Drawdown severity (0-30 points)
    const drawdownSeverity = params.drawdownPercent / this.limits.maxDrawdownPercent
    score += Math.min(30, drawdownSeverity * 30)

    // Position count utilization (0-10 points)
    const positionUtil = params.positionCount / this.limits.maxPositions
    score += Math.min(10, positionUtil * 10)

    // Daily loss severity (0-10 points)
    if (params.dailyPnL < 0) {
      const dailyLossSeverity = Math.abs(params.dailyPnL) / this.limits.dailyLossLimit
      score += Math.min(10, dailyLossSeverity * 10)
    }

    return Math.round(Math.min(100, score))
  }

  private checkDailyReset(): void {
    const now = new Date()
    const lastReset = this.lastDailyReset

    // Reset daily PnL at midnight
    if (
      now.getDate() !== lastReset.getDate()
      || now.getMonth() !== lastReset.getMonth()
      || now.getFullYear() !== lastReset.getFullYear()
    ) {
      this.dailyPnL = 0
      this.lastDailyReset = now
      logger.info('[RiskManager] Daily PnL reset')
    }
  }

  /**
   * Update daily PnL tracking
   */
  updateDailyPnL(pnl: number): void {
    this.checkDailyReset()
    this.dailyPnL += pnl
  }

  /**
   * Get stop-loss handler for direct access
   */
  getStopLossHandler(): StopLossHandler {
    return this.stopLossHandler
  }

  /**
   * Get take-profit handler for direct access
   */
  getTakeProfitHandler(): TakeProfitHandler {
    return this.takeProfitHandler
  }
}

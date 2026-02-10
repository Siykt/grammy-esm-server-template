import type { Position } from '../entities/position.entity.js'
import { DomainEvent } from './base.event.js'

/**
 * Risk Alert Level
 */
export enum RiskAlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

/**
 * Risk Alert Type
 */
export enum RiskAlertType {
  STOP_LOSS_TRIGGERED = 'stop_loss_triggered',
  TAKE_PROFIT_TRIGGERED = 'take_profit_triggered',
  DRAWDOWN_WARNING = 'drawdown_warning',
  POSITION_LIMIT_WARNING = 'position_limit_warning',
  EXPOSURE_LIMIT_WARNING = 'exposure_limit_warning',
  PRICE_VOLATILITY = 'price_volatility',
  LIQUIDATION_RISK = 'liquidation_risk',
}

/**
 * Risk Alert Event
 * Emitted when a risk condition is detected
 */
export class RiskAlertEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'risk.alert'

  constructor(
    public readonly alertType: RiskAlertType,
    public readonly level: RiskAlertLevel,
    public readonly message: string,
    public readonly position?: Position,
    public readonly metrics?: Record<string, number>,
  ) {
    super(RiskAlertEvent.EVENT_TYPE)
  }

  get isCritical(): boolean {
    return this.level === RiskAlertLevel.CRITICAL
  }

  get isWarning(): boolean {
    return this.level === RiskAlertLevel.WARNING
  }

  toJSON() {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      occurredAt: this.occurredAt.toISOString(),
      alertType: this.alertType,
      level: this.level,
      message: this.message,
      position: this.position?.toJSON(),
      metrics: this.metrics,
    }
  }
}

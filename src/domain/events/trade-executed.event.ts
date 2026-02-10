import type { Position } from '../entities/position.entity.js'
import type { Trade } from '../entities/trade.entity.js'
import { DomainEvent } from './base.event.js'

/**
 * Trade Executed Event
 * Emitted when a trade is successfully executed
 */
export class TradeExecutedEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'trade.executed'

  constructor(
    public readonly trade: Trade,
    public readonly strategyName?: string,
    public readonly position?: Position,
  ) {
    super(TradeExecutedEvent.EVENT_TYPE)
  }

  toJSON() {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      occurredAt: this.occurredAt.toISOString(),
      trade: this.trade.toJSON(),
      strategyName: this.strategyName,
    }
  }
}

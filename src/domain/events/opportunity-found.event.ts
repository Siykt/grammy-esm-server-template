import type { Opportunity } from '../entities/opportunity.entity.js'
import { DomainEvent } from './base.event.js'

/**
 * Opportunity Found Event
 * Emitted when a trading opportunity is discovered
 */
export class OpportunityFoundEvent extends DomainEvent {
  static readonly EVENT_TYPE = 'opportunity.found'

  constructor(
    public readonly opportunity: Opportunity,
    public readonly strategyName: string,
  ) {
    super(OpportunityFoundEvent.EVENT_TYPE)
  }

  toJSON() {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      occurredAt: this.occurredAt.toISOString(),
      opportunity: this.opportunity.toJSON(),
      strategyName: this.strategyName,
    }
  }
}

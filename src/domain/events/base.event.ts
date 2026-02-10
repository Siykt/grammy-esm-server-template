import { nanoid } from 'nanoid'

/**
 * Base Domain Event
 */
export abstract class DomainEvent {
  public readonly eventId: string
  public readonly occurredAt: Date

  constructor(public readonly eventType: string) {
    this.eventId = `evt_${nanoid(10)}`
    this.occurredAt = new Date()
  }

  abstract toJSON(): Record<string, unknown>
}

/**
 * Event Bus Interface
 */
export interface IEventBus {
  publish: (event: DomainEvent) => void
  subscribe: <T extends DomainEvent>(eventType: string, handler: (event: T) => void) => () => void
}

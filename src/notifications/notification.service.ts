import type { DomainEvent } from '../domain/events/base.event.js'
import type { TGBotService } from '../services/tg/tg-bot.service.js'
import type {
  INotification,
  INotificationHandler,
  INotificationService,
  OpportunityNotificationData,
  ReportNotificationData,
  RiskNotificationData,
  TradeNotificationData,
} from './notification.interface.js'
import logger from '../common/logger.js'
import { OpportunityFoundEvent } from '../domain/events/opportunity-found.event.js'
import { RiskAlertEvent } from '../domain/events/risk-alert.event.js'
import { TradeExecutedEvent } from '../domain/events/trade-executed.event.js'
import { OpportunityNotificationHandler } from './handlers/opportunity.handler.js'
import { ReportNotificationHandler } from './handlers/report.handler.js'
import { RiskNotificationHandler } from './handlers/risk.handler.js'
import { TradeNotificationHandler } from './handlers/trade.handler.js'
import {
  createNotification,
  NotificationPriority,
  NotificationType,
} from './notification.interface.js'

/**
 * Priority order for filtering
 */
const PRIORITY_ORDER: Record<NotificationPriority, number> = {
  [NotificationPriority.LOW]: 0,
  [NotificationPriority.NORMAL]: 1,
  [NotificationPriority.HIGH]: 2,
  [NotificationPriority.URGENT]: 3,
}

/**
 * Notification Service
 * Central service for managing and dispatching notifications
 */
export class NotificationService implements INotificationService {
  private handlers: Map<NotificationType, INotificationHandler[]> = new Map()
  private enabled = true
  private minPriority: NotificationPriority = NotificationPriority.LOW
  private chatId?: string

  constructor(private readonly tgBot?: TGBotService) {
    if (tgBot) {
      this.registerDefaultHandlers(tgBot)
    }
  }

  /**
   * Register default notification handlers
   */
  private registerDefaultHandlers(tgBot: TGBotService): void {
    this.registerHandler(new TradeNotificationHandler(tgBot))
    this.registerHandler(new OpportunityNotificationHandler(tgBot))
    this.registerHandler(new RiskNotificationHandler(tgBot))
    this.registerHandler(new ReportNotificationHandler(tgBot))
  }

  /**
   * Set the chat ID for all handlers
   */
  setChatId(chatId: string): void {
    this.chatId = chatId

    // Update all handlers
    for (const handlers of this.handlers.values()) {
      for (const handler of handlers) {
        if ('setChatId' in handler && typeof handler.setChatId === 'function') {
          // eslint-disable-next-line ts/no-explicit-any
          (handler as any).setChatId(chatId)
        }
      }
    }
  }

  // ==================== Core Notification Methods ====================

  /**
   * Send a notification
   */
  async notify(notification: INotification): Promise<void> {
    if (!this.enabled) {
      logger.debug('[NotificationService] Notifications disabled, skipping')
      return
    }

    if (!this.meetsPriorityThreshold(notification.priority)) {
      logger.debug(`[NotificationService] Priority ${notification.priority} below threshold ${this.minPriority}`)
      return
    }

    const handlers = this.handlers.get(notification.type) || []

    if (handlers.length === 0) {
      logger.warn(`[NotificationService] No handlers for notification type: ${notification.type}`)
      return
    }

    const results = await Promise.allSettled(
      handlers.map(handler => handler.handle(notification)),
    )

    const failures = results.filter(r => r.status === 'rejected')
    if (failures.length > 0) {
      logger.error(`[NotificationService] ${failures.length} handlers failed for ${notification.type}`)
    }
  }

  /**
   * Send notification from a domain event
   */
  async notifyEvent(event: DomainEvent): Promise<void> {
    if (event instanceof TradeExecutedEvent) {
      await this.notifyTrade({
        trade: event.trade,
        position: event.position,
        pnl: event.position?.unrealizedPnL,
        strategyName: event.strategyName,
      })
    }
    else if (event instanceof OpportunityFoundEvent) {
      await this.notifyOpportunity({
        opportunity: event.opportunity,
        strategyName: event.strategyName,
        expectedProfit: event.opportunity.expectedProfit,
        confidence: event.opportunity.confidence,
      })
    }
    else if (event instanceof RiskAlertEvent) {
      await this.notifyRisk({
        alertType: event.alertType,
        level: event.level,
        // eslint-disable-next-line ts/no-explicit-any
        metrics: event.metrics as any,
        position: event.position,
      })
    }
    else {
      logger.warn(`[NotificationService] Unknown event type: ${event.eventType}`)
    }
  }

  /**
   * Broadcast a message to all users
   */
  async broadcast(message: string, _priority: NotificationPriority = NotificationPriority.NORMAL): Promise<void> {
    if (!this.chatId || !this.tgBot) {
      logger.warn('[NotificationService] Cannot broadcast: no chat ID or TG bot configured')
      return
    }

    try {
      await this.tgBot.api.sendMessage(this.chatId, message, { parse_mode: 'Markdown' })
      logger.debug('[NotificationService] Broadcast sent')
    }
    catch (error) {
      logger.error('[NotificationService] Failed to broadcast message', error)
    }
  }

  // ==================== Typed Notification Methods ====================

  /**
   * Send a trade notification
   */
  async notifyTrade(data: TradeNotificationData): Promise<void> {
    const priceValue = typeof data.trade.price === 'number' ? data.trade.price : data.trade.price.amount
    const sizeValue = typeof data.trade.size === 'number' ? data.trade.size : data.trade.size.amount
    const sideStr = typeof data.trade.side === 'string' ? data.trade.side : data.trade.side.toString()

    const notification = createNotification({
      type: NotificationType.TRADE_EXECUTED,
      priority: NotificationPriority.HIGH,
      title: 'Trade Executed',
      message: `${sideStr} ${sizeValue} @ $${priceValue.toFixed(4)}`,
      // eslint-disable-next-line ts/no-explicit-any
      data: data as any,
    })

    await this.notify(notification)
  }

  /**
   * Send an opportunity notification
   */
  async notifyOpportunity(data: OpportunityNotificationData): Promise<void> {
    const notification = createNotification({
      type: NotificationType.OPPORTUNITY_FOUND,
      priority: data.expectedProfit > 1 ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
      title: 'Opportunity Found',
      message: `${data.strategyName}: Expected profit $${data.expectedProfit.toFixed(2)}`,
      // eslint-disable-next-line ts/no-explicit-any
      data: data as any,
    })

    await this.notify(notification)
  }

  /**
   * Send a risk notification
   */
  async notifyRisk(data: RiskNotificationData): Promise<void> {
    const notification = createNotification({
      type: NotificationType.RISK_ALERT,
      priority: data.level === 'critical' ? NotificationPriority.URGENT : NotificationPriority.HIGH,
      title: `Risk Alert: ${data.alertType}`,
      message: `Level: ${data.level}`,
      // eslint-disable-next-line ts/no-explicit-any
      data: data as any,
    })

    await this.notify(notification)
  }

  /**
   * Send a report notification
   */
  async notifyReport(data: ReportNotificationData): Promise<void> {
    const typeMap: Record<string, NotificationType> = {
      hourly: NotificationType.HOURLY_REPORT,
      daily: NotificationType.DAILY_REPORT,
      weekly: NotificationType.WEEKLY_REPORT,
    }

    const notification = createNotification({
      type: typeMap[data.period] || NotificationType.DAILY_REPORT,
      priority: NotificationPriority.LOW,
      title: `${data.period.charAt(0).toUpperCase() + data.period.slice(1)} Report`,
      message: `PnL: $${data.totalPnL.toFixed(2)}, Trades: ${data.trades}`,
      // eslint-disable-next-line ts/no-explicit-any
      data: data as any,
    })

    await this.notify(notification)
  }

  // ==================== Handler Management ====================

  /**
   * Register a notification handler
   */
  registerHandler(handler: INotificationHandler): void {
    for (const type of handler.handledTypes) {
      const existing = this.handlers.get(type) || []
      existing.push(handler)
      this.handlers.set(type, existing)

      // Set chat ID if available
      if (this.chatId && 'setChatId' in handler && typeof handler.setChatId === 'function') {
        // eslint-disable-next-line ts/no-explicit-any
        (handler as any).setChatId(this.chatId)
      }
    }

    logger.info(`[NotificationService] Registered handler for types: ${handler.handledTypes.join(', ')}`)
  }

  /**
   * Unregister handlers for a notification type
   */
  unregisterHandler(handlerType: NotificationType): void {
    this.handlers.delete(handlerType)
    logger.info(`[NotificationService] Unregistered handlers for type: ${handlerType}`)
  }

  // ==================== Configuration ====================

  /**
   * Enable or disable notifications
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    logger.info(`[NotificationService] Notifications ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Set minimum priority for notifications
   */
  setMinPriority(priority: NotificationPriority): void {
    this.minPriority = priority
    logger.info(`[NotificationService] Minimum priority set to: ${priority}`)
  }

  // ==================== Private Methods ====================

  private meetsPriorityThreshold(priority: NotificationPriority): boolean {
    return PRIORITY_ORDER[priority] >= PRIORITY_ORDER[this.minPriority]
  }
}

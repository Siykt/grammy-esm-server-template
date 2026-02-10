import type { Opportunity } from '../domain/entities/opportunity.entity.js'
import type { Position } from '../domain/entities/position.entity.js'
import type { Trade } from '../domain/entities/trade.entity.js'
import type { DomainEvent } from '../domain/events/base.event.js'
import type { RiskMetrics } from '../risk/risk-manager.interface.js'

/**
 * Notification Priority
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Notification Type
 */
export enum NotificationType {
  TRADE_EXECUTED = 'trade_executed',
  TRADE_FAILED = 'trade_failed',
  ORDER_PLACED = 'order_placed',
  ORDER_FILLED = 'order_filled',
  ORDER_CANCELLED = 'order_cancelled',
  OPPORTUNITY_FOUND = 'opportunity_found',
  OPPORTUNITY_EXPIRED = 'opportunity_expired',
  RISK_ALERT = 'risk_alert',
  STOP_LOSS = 'stop_loss',
  TAKE_PROFIT = 'take_profit',
  HOURLY_REPORT = 'hourly_report',
  DAILY_REPORT = 'daily_report',
  WEEKLY_REPORT = 'weekly_report',
  SYSTEM_STATUS = 'system_status',
  ERROR = 'error',
}

/**
 * Base Notification
 */
export interface INotification {
  id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  data?: Record<string, unknown>
  timestamp: Date
}

/**
 * Trade Notification Data
 */
export interface TradeNotificationData {
  trade: Trade
  position?: Position
  pnl?: number
  strategyName?: string
}

/**
 * Opportunity Notification Data
 */
export interface OpportunityNotificationData {
  opportunity: Opportunity
  strategyName: string
  expectedProfit: number
  confidence: number
}

/**
 * Risk Notification Data
 */
export interface RiskNotificationData {
  alertType: string
  level: string
  metrics?: RiskMetrics
  position?: Position
}

/**
 * Report Notification Data
 */
export interface ReportNotificationData {
  period: 'hourly' | 'daily' | 'weekly'
  startTime: Date
  endTime: Date
  trades: number
  winRate: number
  totalPnL: number
  realizedPnL: number
  unrealizedPnL: number
  openPositions: number
  metrics?: RiskMetrics
}

/**
 * Notification Handler Interface
 * Each handler processes a specific type of notification
 */
export interface INotificationHandler {
  readonly handledTypes: NotificationType[]
  canHandle: (type: NotificationType) => boolean
  handle: (notification: INotification) => Promise<void>
}

/**
 * Notification Service Interface
 * Main service for managing and dispatching notifications
 */
export interface INotificationService {
  // Core notification methods
  notify: (notification: INotification) => Promise<void>
  notifyEvent: (event: DomainEvent) => Promise<void>
  broadcast: (message: string, priority?: NotificationPriority) => Promise<void>

  // Typed notification methods
  notifyTrade: (data: TradeNotificationData) => Promise<void>
  notifyOpportunity: (data: OpportunityNotificationData) => Promise<void>
  notifyRisk: (data: RiskNotificationData) => Promise<void>
  notifyReport: (data: ReportNotificationData) => Promise<void>

  // Handler management
  registerHandler: (handler: INotificationHandler) => void
  unregisterHandler: (handlerType: NotificationType) => void

  // Configuration
  setEnabled: (enabled: boolean) => void
  isEnabled: () => boolean
  setMinPriority: (priority: NotificationPriority) => void
}

/**
 * Message Formatter Interface
 */
export interface IMessageFormatter {
  formatTrade: (data: TradeNotificationData) => string
  formatOpportunity: (data: OpportunityNotificationData) => string
  formatRisk: (data: RiskNotificationData) => string
  formatReport: (data: ReportNotificationData) => string
  formatError: (error: Error | string) => string
}

/**
 * Create a notification ID
 */
export function createNotificationId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create a notification object
 */
export function createNotification(params: {
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  data?: Record<string, unknown>
}): INotification {
  return {
    id: createNotificationId(),
    type: params.type,
    priority: params.priority,
    title: params.title,
    message: params.message,
    data: params.data,
    timestamp: new Date(),
  }
}

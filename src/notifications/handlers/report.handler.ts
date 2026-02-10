import type { TGBotService } from '../../services/tg/tg-bot.service.js'
import type {
  IMessageFormatter,
  INotification,
  INotificationHandler,
  ReportNotificationData,
} from '../notification.interface.js'
import logger from '../../common/logger.js'
import { TelegramMessageFormatter } from '../formatters/message.formatter.js'
import { NotificationType } from '../notification.interface.js'

/**
 * Report Notification Handler
 * Handles periodic report notifications
 */
export class ReportNotificationHandler implements INotificationHandler {
  readonly handledTypes = [
    NotificationType.HOURLY_REPORT,
    NotificationType.DAILY_REPORT,
    NotificationType.WEEKLY_REPORT,
    NotificationType.SYSTEM_STATUS,
  ]

  private formatter: IMessageFormatter
  private chatId?: string
  private enabledReports: Set<NotificationType> = new Set([
    NotificationType.DAILY_REPORT,
    NotificationType.WEEKLY_REPORT,
  ])

  constructor(
    private readonly tgBot: TGBotService,
    formatter?: IMessageFormatter,
  ) {
    this.formatter = formatter ?? new TelegramMessageFormatter()
  }

  /**
   * Set the chat ID for notifications
   */
  setChatId(chatId: string): void {
    this.chatId = chatId
  }

  /**
   * Enable a specific report type
   */
  enableReport(type: NotificationType): void {
    this.enabledReports.add(type)
  }

  /**
   * Disable a specific report type
   */
  disableReport(type: NotificationType): void {
    this.enabledReports.delete(type)
  }

  canHandle(type: NotificationType): boolean {
    return this.handledTypes.includes(type)
  }

  async handle(notification: INotification): Promise<void> {
    if (!this.chatId) {
      logger.warn('[ReportHandler] No chat ID configured, skipping notification')
      return
    }

    // Check if this report type is enabled
    if (!this.enabledReports.has(notification.type) && notification.type !== NotificationType.SYSTEM_STATUS) {
      logger.debug(`[ReportHandler] Report type ${notification.type} is disabled`)
      return
    }

    try {
      let message: string

      switch (notification.type) {
        case NotificationType.HOURLY_REPORT:
        case NotificationType.DAILY_REPORT:
        case NotificationType.WEEKLY_REPORT:
          message = this.formatter.formatReport(notification.data as unknown as ReportNotificationData)
          break
        case NotificationType.SYSTEM_STATUS:
          message = this.formatSystemStatus(notification)
          break
        default:
          message = notification.message
      }

      await this.tgBot.api.sendMessage(this.chatId, message, { parse_mode: 'Markdown' })
      logger.debug(`[ReportHandler] Sent notification: ${notification.type}`)
    }
    catch (error) {
      logger.error('[ReportHandler] Failed to send notification', error)
    }
  }

  private formatSystemStatus(notification: INotification): string {
    const data = notification.data as {
      status: 'online' | 'offline' | 'degraded'
      uptime?: number
      memoryUsage?: number
      activeStrategies?: string[]
      lastScan?: Date
    }

    const statusEmoji = data.status === 'online' ? '✅' : data.status === 'degraded' ? '⚠️' : '❌'

    let message = `${statusEmoji} *System Status: ${data.status.toUpperCase()}*\n\n`

    if (data.uptime !== undefined) {
      message += `⏱️ *Uptime:* ${this.formatUptime(data.uptime)}\n`
    }

    if (data.memoryUsage !== undefined) {
      message += `💾 *Memory:* ${data.memoryUsage.toFixed(1)} MB\n`
    }

    if (data.activeStrategies && data.activeStrategies.length > 0) {
      message += `\n🤖 *Active Strategies:*\n`
      for (const strategy of data.activeStrategies) {
        message += `  • ${strategy}\n`
      }
    }

    if (data.lastScan) {
      message += `\n🔍 *Last Scan:* ${data.lastScan.toISOString().replace('T', ' ').slice(0, 19)} UTC\n`
    }

    return message
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    const parts: string[] = []
    if (days > 0)
      parts.push(`${days}d`)
    if (hours > 0)
      parts.push(`${hours}h`)
    if (minutes > 0)
      parts.push(`${minutes}m`)

    return parts.join(' ') || '< 1m'
  }
}

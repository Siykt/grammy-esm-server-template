import type { TGBotService } from '../../services/tg/tg-bot.service.js'
import type {
  IMessageFormatter,
  INotification,
  INotificationHandler,
  RiskNotificationData,
} from '../notification.interface.js'
import logger from '../../common/logger.js'
import { RiskAlertLevel } from '../../domain/events/risk-alert.event.js'
import { TelegramMessageFormatter } from '../formatters/message.formatter.js'
import { NotificationType } from '../notification.interface.js'

/**
 * Risk Notification Handler
 * Handles risk-related notifications
 */
export class RiskNotificationHandler implements INotificationHandler {
  readonly handledTypes = [
    NotificationType.RISK_ALERT,
    NotificationType.STOP_LOSS,
    NotificationType.TAKE_PROFIT,
  ]

  private formatter: IMessageFormatter
  private chatId?: string
  private minAlertLevel: RiskAlertLevel = RiskAlertLevel.WARNING // Only notify for WARNING and above

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
   * Set minimum alert level for notifications
   */
  setMinAlertLevel(level: RiskAlertLevel): void {
    this.minAlertLevel = level
  }

  canHandle(type: NotificationType): boolean {
    return this.handledTypes.includes(type)
  }

  async handle(notification: INotification): Promise<void> {
    if (!this.chatId) {
      logger.warn('[RiskHandler] No chat ID configured, skipping notification')
      return
    }

    try {
      const data = notification.data as unknown as RiskNotificationData

      // Filter by alert level
      if (notification.type === NotificationType.RISK_ALERT) {
        if (!this.shouldNotify(data.level)) {
          logger.debug(`[RiskHandler] Skipping ${data.level} alert (min level: ${this.minAlertLevel})`)
          return
        }
      }

      let message: string

      switch (notification.type) {
        case NotificationType.RISK_ALERT:
          message = this.formatter.formatRisk(data)
          break
        case NotificationType.STOP_LOSS:
          message = this.formatStopLoss(notification)
          break
        case NotificationType.TAKE_PROFIT:
          message = this.formatTakeProfit(notification)
          break
        default:
          message = notification.message
      }

      await this.tgBot.api.sendMessage(this.chatId, message, { parse_mode: 'Markdown' })
      logger.debug(`[RiskHandler] Sent notification: ${notification.type}`)
    }
    catch (error) {
      logger.error('[RiskHandler] Failed to send notification', error)
    }
  }

  private shouldNotify(level: string): boolean {
    const levelPriority: Record<string, number> = {
      [RiskAlertLevel.INFO]: 0,
      [RiskAlertLevel.WARNING]: 1,
      [RiskAlertLevel.CRITICAL]: 2,
    }

    const alertPriority = levelPriority[level.toLowerCase()] ?? 0
    const minPriority = levelPriority[this.minAlertLevel] ?? 1

    return alertPriority >= minPriority
  }

  private formatStopLoss(notification: INotification): string {
    const data = notification.data as unknown as RiskNotificationData

    let message = `🛑 *Stop-Loss Triggered*\n\n`

    if (data.position) {
      message += `📊 *Market:* \`${data.position.marketId.slice(0, 16)}...\`\n`
      message += `💱 *Side:* ${data.position.side.toString()}\n`
      message += `📦 *Size:* ${data.position.size.amount}\n`
      message += `💰 *Entry:* $${data.position.avgEntryPrice.amount.toFixed(4)}\n`
      message += `💰 *Exit:* $${data.position.currentPrice.amount.toFixed(4)}\n`
      message += `📉 *Loss:* $${Math.abs(data.position.unrealizedPnL).toFixed(2)} (${data.position.unrealizedPnLPercent.toFixed(2)}%)\n`
    }

    message += `\n⚠️ Position closed to limit losses`
    return message
  }

  private formatTakeProfit(notification: INotification): string {
    const data = notification.data as unknown as RiskNotificationData

    let message = `🎯 *Take-Profit Triggered*\n\n`

    if (data.position) {
      message += `📊 *Market:* \`${data.position.marketId.slice(0, 16)}...\`\n`
      message += `💱 *Side:* ${data.position.side.toString()}\n`
      message += `📦 *Size:* ${data.position.size.amount}\n`
      message += `💰 *Entry:* $${data.position.avgEntryPrice.amount.toFixed(4)}\n`
      message += `💰 *Exit:* $${data.position.currentPrice.amount.toFixed(4)}\n`
      message += `📈 *Profit:* +$${data.position.unrealizedPnL.toFixed(2)} (+${data.position.unrealizedPnLPercent.toFixed(2)}%)\n`
    }

    message += `\n✅ Profit target reached!`
    return message
  }
}

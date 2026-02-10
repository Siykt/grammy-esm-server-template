import type { TGBotService } from '../../services/tg/tg-bot.service.js'
import type {
  IMessageFormatter,
  INotification,
  INotificationHandler,
  OpportunityNotificationData,
} from '../notification.interface.js'
import logger from '../../common/logger.js'
import { TelegramMessageFormatter } from '../formatters/message.formatter.js'
import { NotificationType } from '../notification.interface.js'

/**
 * Opportunity Notification Handler
 * Handles opportunity detection notifications
 */
export class OpportunityNotificationHandler implements INotificationHandler {
  readonly handledTypes = [
    NotificationType.OPPORTUNITY_FOUND,
    NotificationType.OPPORTUNITY_EXPIRED,
  ]

  private formatter: IMessageFormatter
  private chatId?: string
  private minProfitThreshold = 0.10 // Only notify for opportunities with > $0.10 expected profit

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
   * Set minimum profit threshold for notifications
   */
  setMinProfitThreshold(threshold: number): void {
    this.minProfitThreshold = threshold
  }

  canHandle(type: NotificationType): boolean {
    return this.handledTypes.includes(type)
  }

  async handle(notification: INotification): Promise<void> {
    if (!this.chatId) {
      logger.warn('[OpportunityHandler] No chat ID configured, skipping notification')
      return
    }

    try {
      const data = notification.data as unknown as OpportunityNotificationData

      // Filter low-profit opportunities
      if (notification.type === NotificationType.OPPORTUNITY_FOUND) {
        if (data.expectedProfit < this.minProfitThreshold) {
          logger.debug(`[OpportunityHandler] Skipping low-profit opportunity: $${data.expectedProfit.toFixed(2)}`)
          return
        }
      }

      let message: string

      switch (notification.type) {
        case NotificationType.OPPORTUNITY_FOUND:
          message = this.formatter.formatOpportunity(data)
          break
        case NotificationType.OPPORTUNITY_EXPIRED:
          message = this.formatOpportunityExpired(notification)
          break
        default:
          message = notification.message
      }

      await this.tgBot.api.sendMessage(this.chatId, message, { parse_mode: 'Markdown' })
      logger.debug(`[OpportunityHandler] Sent notification: ${notification.type}`)
    }
    catch (error) {
      logger.error('[OpportunityHandler] Failed to send notification', error)
    }
  }

  private formatOpportunityExpired(notification: INotification): string {
    const data = notification.data as unknown as OpportunityNotificationData
    let message = `⏰ *Opportunity Expired*\n\n`
    message += `📊 *Type:* ${this.formatOpportunityType(data.opportunity.type)}\n`
    message += `💰 *Expected Profit:* $${data.expectedProfit.toFixed(2)}\n`
    message += `🤖 *Strategy:* ${data.strategyName}\n`
    message += `\n❌ Opportunity expired before execution`
    return message
  }

  private formatOpportunityType(type: string): string {
    const typeMap: Record<string, string> = {
      cross_market: 'Cross-Market Arbitrage',
      event_arbitrage: 'Event Arbitrage',
      deviation: 'Price Deviation',
    }
    return typeMap[type] || type
  }
}

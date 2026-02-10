import type { TGBotService } from '../../services/tg/tg-bot.service.js'
import type {
  IMessageFormatter,
  INotification,
  INotificationHandler,
  TradeNotificationData,
} from '../notification.interface.js'
import logger from '../../common/logger.js'
import { TelegramMessageFormatter } from '../formatters/message.formatter.js'
import { NotificationType } from '../notification.interface.js'

/**
 * Trade Notification Handler
 * Handles trade execution notifications
 */
export class TradeNotificationHandler implements INotificationHandler {
  readonly handledTypes = [
    NotificationType.TRADE_EXECUTED,
    NotificationType.TRADE_FAILED,
    NotificationType.ORDER_PLACED,
    NotificationType.ORDER_FILLED,
    NotificationType.ORDER_CANCELLED,
  ]

  private formatter: IMessageFormatter
  private chatId?: string

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

  canHandle(type: NotificationType): boolean {
    return this.handledTypes.includes(type)
  }

  async handle(notification: INotification): Promise<void> {
    if (!this.chatId) {
      logger.warn('[TradeHandler] No chat ID configured, skipping notification')
      return
    }

    try {
      const data = notification.data as unknown as TradeNotificationData
      let message: string

      switch (notification.type) {
        case NotificationType.TRADE_EXECUTED:
          message = this.formatter.formatTrade(data)
          break
        case NotificationType.TRADE_FAILED:
          message = this.formatTradeFailed(notification)
          break
        case NotificationType.ORDER_PLACED:
          message = this.formatOrderPlaced(notification)
          break
        case NotificationType.ORDER_FILLED:
          message = this.formatOrderFilled(notification)
          break
        case NotificationType.ORDER_CANCELLED:
          message = this.formatOrderCancelled(notification)
          break
        default:
          message = notification.message
      }

      await this.tgBot.api.sendMessage(this.chatId, message, { parse_mode: 'Markdown' })
      logger.debug(`[TradeHandler] Sent notification: ${notification.type}`)
    }
    catch (error) {
      logger.error('[TradeHandler] Failed to send notification', error)
    }
  }

  private formatTradeFailed(notification: INotification): string {
    const data = notification.data as unknown as TradeNotificationData & { error?: string }
    let message = `🔴 *Trade Failed*\n\n`
    message += `❌ *Error:* ${data.error || 'Unknown error'}\n`
    if (data.trade) {
      message += `📊 *Market:* \`${data.trade.marketId.slice(0, 16)}...\`\n`
      message += `💱 *Side:* ${data.trade.side}\n`
      const priceValue = typeof data.trade.price === 'number' ? data.trade.price : data.trade.price.amount
      message += `💰 *Price:* $${priceValue.toFixed(4)}\n`
      message += `📦 *Size:* ${data.trade.size}\n`
    }
    if (data.strategyName) {
      message += `🤖 *Strategy:* ${data.strategyName}\n`
    }
    return message
  }

  private formatOrderPlaced(notification: INotification): string {
    // eslint-disable-next-line ts/no-explicit-any
    const data = notification.data as any
    const emoji = data.side === 'BUY' ? '🟢' : '🔴'
    let message = `${emoji} *Order Placed*\n\n`
    message += `📊 *Order ID:* \`${data.orderId?.slice(0, 16) || 'N/A'}...\`\n`
    message += `💱 *Side:* ${data.side || 'N/A'}\n`
    message += `💰 *Price:* $${data.price?.toFixed(4) || 'N/A'}\n`
    message += `📦 *Size:* ${data.size || 'N/A'}\n`
    return message
  }

  private formatOrderFilled(notification: INotification): string {
    // eslint-disable-next-line ts/no-explicit-any
    const data = notification.data as any
    let message = `✅ *Order Filled*\n\n`
    message += `📊 *Order ID:* \`${data.orderId?.slice(0, 16) || 'N/A'}...\`\n`
    message += `💰 *Fill Price:* $${data.fillPrice?.toFixed(4) || data.price?.toFixed(4) || 'N/A'}\n`
    message += `📦 *Filled Size:* ${data.filledSize || data.size || 'N/A'}\n`
    return message
  }

  private formatOrderCancelled(notification: INotification): string {
    // eslint-disable-next-line ts/no-explicit-any
    const data = notification.data as any
    let message = `⚪ *Order Cancelled*\n\n`
    message += `📊 *Order ID:* \`${data.orderId?.slice(0, 16) || 'N/A'}...\`\n`
    if (data.reason) {
      message += `📝 *Reason:* ${data.reason}\n`
    }
    return message
  }
}

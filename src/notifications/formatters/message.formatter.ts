import type {
  IMessageFormatter,
  OpportunityNotificationData,
  ReportNotificationData,
  RiskNotificationData,
  TradeNotificationData,
} from '../notification.interface.js'
import { RiskAlertLevel } from '../../domain/events/risk-alert.event.js'

/**
 * Telegram Message Formatter
 * Formats notifications for Telegram with markdown support
 */
export class TelegramMessageFormatter implements IMessageFormatter {
  /**
   * Format trade notification
   */
  formatTrade(data: TradeNotificationData): string {
    const { trade, position, pnl, strategyName } = data
    const sideStr = typeof trade.side === 'string' ? trade.side : trade.side.toString()
    const priceValue = typeof trade.price === 'number' ? trade.price : trade.price.amount
    const sizeValue = typeof trade.size === 'number' ? trade.size : trade.size.amount
    const emoji = sideStr === 'BUY' ? '🟢' : '🔴'
    const pnlEmoji = pnl !== undefined ? (pnl >= 0 ? '📈' : '📉') : ''

    let message = `${emoji} *Trade Executed*\n\n`
    message += `📊 *Market:* \`${trade.marketId.slice(0, 16)}...\`\n`
    message += `💱 *Side:* ${sideStr}\n`
    message += `💰 *Price:* $${priceValue.toFixed(4)}\n`
    message += `📦 *Size:* ${sizeValue}\n`

    if (strategyName) {
      message += `🤖 *Strategy:* ${strategyName}\n`
    }

    if (pnl !== undefined) {
      message += `${pnlEmoji} *PnL:* ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}\n`
    }

    if (position) {
      message += `\n📋 *Position Update:*\n`
      message += `  • Size: ${position.size.amount}\n`
      message += `  • Avg Entry: $${position.avgEntryPrice.amount.toFixed(4)}\n`
      message += `  • Unrealized PnL: ${position.unrealizedPnL >= 0 ? '+' : ''}$${position.unrealizedPnL.toFixed(2)}\n`
    }

    message += `\n⏰ ${this.formatTimestamp(new Date())}`

    return message
  }

  /**
   * Format opportunity notification
   */
  formatOpportunity(data: OpportunityNotificationData): string {
    const { opportunity, strategyName, expectedProfit, confidence } = data

    let message = `🎯 *Opportunity Found*\n\n`
    message += `📊 *Type:* ${this.formatOpportunityType(opportunity.type)}\n`
    message += `🤖 *Strategy:* ${strategyName}\n`
    message += `💰 *Expected Profit:* $${expectedProfit.toFixed(2)}\n`
    message += `🎲 *Confidence:* ${(confidence * 100).toFixed(1)}%\n`

    if (opportunity.legs.length > 0) {
      message += `\n📦 *Legs:*\n`
      for (const leg of opportunity.legs) {
        const emoji = leg.side.isBuy ? '🟢' : '🔴'
        message += `  ${emoji} ${leg.side.toString()} ${leg.size} @ $${leg.price.toFixed(4)}\n`
      }
    }

    message += `\n⏳ *Expires:* ${this.formatDuration(opportunity.expiresAt.getTime() - Date.now())}`
    message += `\n⏰ ${this.formatTimestamp(new Date())}`

    return message
  }

  /**
   * Format risk notification
   */
  formatRisk(data: RiskNotificationData): string {
    const { alertType, level, metrics, position } = data
    const emoji = this.getRiskEmoji(level)

    let message = `${emoji} *Risk Alert: ${this.formatAlertType(alertType)}*\n\n`
    message += `⚠️ *Level:* ${level.toUpperCase()}\n`

    if (metrics) {
      message += `\n📊 *Metrics:*\n`
      message += `  • Total Exposure: $${metrics.totalExposure.toFixed(2)}\n`
      message += `  • Drawdown: ${metrics.drawdownPercent.toFixed(2)}%\n`
      message += `  • Risk Score: ${metrics.riskScore}/100\n`
      message += `  • Open Positions: ${metrics.positionCount}\n`
      message += `  • Total PnL: ${metrics.totalPnL >= 0 ? '+' : ''}$${metrics.totalPnL.toFixed(2)}\n`
    }

    if (position) {
      message += `\n📋 *Position:*\n`
      message += `  • Market: \`${position.marketId.slice(0, 16)}...\`\n`
      message += `  • Side: ${position.side.toString()}\n`
      message += `  • Size: ${position.size.amount}\n`
      message += `  • Entry: $${position.avgEntryPrice.amount.toFixed(4)}\n`
      message += `  • Current: $${position.currentPrice.amount.toFixed(4)}\n`
      message += `  • PnL: ${position.unrealizedPnL >= 0 ? '+' : ''}$${position.unrealizedPnL.toFixed(2)} (${position.unrealizedPnLPercent.toFixed(2)}%)\n`
    }

    message += `\n⏰ ${this.formatTimestamp(new Date())}`

    return message
  }

  /**
   * Format report notification
   */
  formatReport(data: ReportNotificationData): string {
    const { period, startTime, endTime, trades, winRate, totalPnL, realizedPnL, unrealizedPnL, openPositions, metrics } = data

    const periodEmoji = period === 'weekly' ? '📅' : period === 'daily' ? '📆' : '⏱️'
    const pnlEmoji = totalPnL >= 0 ? '📈' : '📉'

    let message = `${periodEmoji} *${this.capitalize(period)} Report*\n\n`
    message += `📅 *Period:* ${this.formatDate(startTime)} - ${this.formatDate(endTime)}\n\n`

    message += `📊 *Trading Summary:*\n`
    message += `  • Trades: ${trades}\n`
    message += `  • Win Rate: ${(winRate * 100).toFixed(1)}%\n`
    message += `  • Open Positions: ${openPositions}\n\n`

    message += `${pnlEmoji} *PnL Summary:*\n`
    message += `  • Total: ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}\n`
    message += `  • Realized: ${realizedPnL >= 0 ? '+' : ''}$${realizedPnL.toFixed(2)}\n`
    message += `  • Unrealized: ${unrealizedPnL >= 0 ? '+' : ''}$${unrealizedPnL.toFixed(2)}\n`

    if (metrics) {
      message += `\n📈 *Risk Metrics:*\n`
      message += `  • Total Exposure: $${metrics.totalExposure.toFixed(2)}\n`
      message += `  • Max Drawdown: ${metrics.maxDrawdown.toFixed(2)}%\n`
      message += `  • Risk Score: ${metrics.riskScore}/100\n`
    }

    message += `\n⏰ Generated: ${this.formatTimestamp(new Date())}`

    return message
  }

  /**
   * Format error notification
   */
  formatError(error: Error | string): string {
    const errorMessage = error instanceof Error ? error.message : error
    const stack = error instanceof Error ? error.stack : undefined

    let message = `🚨 *Error*\n\n`
    message += `❌ ${this.escapeMarkdown(errorMessage)}\n`

    if (stack) {
      const shortStack = stack.split('\n').slice(0, 3).join('\n')
      message += `\n\`\`\`\n${shortStack}\n\`\`\`\n`
    }

    message += `\n⏰ ${this.formatTimestamp(new Date())}`

    return message
  }

  // ==================== Helper Methods ====================

  private formatTimestamp(date: Date): string {
    return `${date.toISOString().replace('T', ' ').slice(0, 19)} UTC`
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10)
  }

  private formatDuration(ms: number): string {
    if (ms < 0)
      return 'Expired'
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60)
      return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60)
      return `${minutes}m ${seconds % 60}s`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  private formatOpportunityType(type: string): string {
    const typeMap: Record<string, string> = {
      cross_market: 'Cross-Market Arbitrage',
      event_arbitrage: 'Event Arbitrage',
      deviation: 'Price Deviation',
    }
    return typeMap[type] || type
  }

  private formatAlertType(type: string): string {
    return type.split('_').map(word => this.capitalize(word)).join(' ')
  }

  private getRiskEmoji(level: string): string {
    switch (level.toLowerCase()) {
      case RiskAlertLevel.CRITICAL:
        return '🚨'
      case RiskAlertLevel.WARNING:
        return '⚠️'
      case RiskAlertLevel.INFO:
      default:
        return 'ℹ️'
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1')
  }
}

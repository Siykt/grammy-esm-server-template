import type { RiskManagerService } from '../../../risk/risk-manager.service.js'
import type { StrategyContext } from '../../../strategies/base/strategy-context.js'
import type { PMClientService } from '../../pm/client.service.js'
import type { TGBotContext, TGBotService, TGCommand } from '../tg-bot.service.js'
import process from 'node:process'
import logger from '../../../common/logger.js'

/**
 * Trading Commands for Telegram Bot
 * Provides commands to interact with the trading system
 */
export class TradingCommands {
  constructor(
    private readonly tgBot: TGBotService,
    private readonly pmClient?: PMClientService,
    private readonly riskManager?: RiskManagerService,
    private readonly strategyContext?: StrategyContext,
  ) {}

  /**
   * Register all trading commands
   */
  register(): void {
    this.definePositionsCommand()
    this.defineOrdersCommand()
    this.defineCancelCommand()
    this.defineCancelAllCommand()
    this.defineBalanceCommand()
    this.definePnLCommand()
    this.defineStrategiesCommand()
    this.defineRiskCommand()
    this.defineStatusCommand()

    logger.info('[TradingCommands] Trading commands registered')
  }

  /**
   * /positions - View current positions
   */
  private definePositionsCommand(): void {
    this.tgBot.defineCommand({
      command: 'positions',
      description: 'View current positions',
      privite: true,
      callback: async (ctx: TGBotContext) => {
        try {
          if (!this.pmClient) {
            await ctx.reply('❌ PM client not configured')
            return
          }

          const trades = await this.pmClient.getTrades()

          if (!trades || trades.length === 0) {
            await ctx.reply('📭 No positions found')
            return
          }

          // Group trades by market to calculate positions
          const positionMap = new Map<string, { size: number, avgPrice: number, side: string, marketId: string }>()

          for (const trade of trades) {
            const key = trade.market
            const existing = positionMap.get(key)

            if (existing) {
              // Update position
              const size = trade.side === 'BUY'
                ? existing.size + Number(trade.size)
                : existing.size - Number(trade.size)
              existing.size = size
              if (size !== 0) {
                existing.avgPrice = (existing.avgPrice + Number(trade.price)) / 2
              }
            }
            else {
              positionMap.set(key, {
                marketId: trade.market,
                size: trade.side === 'BUY' ? Number(trade.size) : -Number(trade.size),
                avgPrice: Number(trade.price),
                side: trade.side,
              })
            }
          }

          // Filter out closed positions
          const openPositions = Array.from(positionMap.values()).filter(p => p.size !== 0)

          if (openPositions.length === 0) {
            await ctx.reply('📭 No open positions')
            return
          }

          let message = '📊 *Open Positions*\n\n'

          for (const pos of openPositions.slice(0, 10)) {
            const emoji = pos.size > 0 ? '🟢' : '🔴'
            message += `${emoji} *Market:* \`${pos.marketId.slice(0, 16)}...\`\n`
            message += `   Side: ${pos.size > 0 ? 'LONG' : 'SHORT'}\n`
            message += `   Size: ${Math.abs(pos.size)}\n`
            message += `   Avg Price: $${pos.avgPrice.toFixed(4)}\n\n`
          }

          if (openPositions.length > 10) {
            message += `\n_...and ${openPositions.length - 10} more_`
          }

          await ctx.reply(message, { parse_mode: 'Markdown' })
        }
        catch (error) {
          logger.error('[TradingCommands] positions command failed', error)
          await ctx.reply('❌ Failed to fetch positions')
        }
      },
    })
  }

  /**
   * /orders - View open orders
   */
  private defineOrdersCommand(): void {
    this.tgBot.defineCommand({
      command: 'orders',
      description: 'View open orders',
      privite: true,
      callback: async (ctx: TGBotContext) => {
        try {
          if (!this.pmClient) {
            await ctx.reply('❌ PM client not configured')
            return
          }

          const orders = await this.pmClient.getOpenOrders()

          if (!orders || orders.length === 0) {
            await ctx.reply('📭 No open orders')
            return
          }

          let message = '📋 *Open Orders*\n\n'

          for (const order of orders.slice(0, 10)) {
            const emoji = order.side === 'BUY' ? '🟢' : '🔴'
            message += `${emoji} \`${order.id.slice(0, 12)}...\`\n`
            message += `   ${order.side} ${order.original_size} @ $${Number(order.price).toFixed(4)}\n`
            message += `   Filled: ${order.size_matched}/${order.original_size}\n\n`
          }

          if (orders.length > 10) {
            message += `\n_...and ${orders.length - 10} more_`
          }

          message += `\n💡 Use /cancel <order\\_id> to cancel an order`

          await ctx.reply(message, { parse_mode: 'Markdown' })
        }
        catch (error) {
          logger.error('[TradingCommands] orders command failed', error)
          await ctx.reply('❌ Failed to fetch orders')
        }
      },
    })
  }

  /**
   * /cancel <orderId> - Cancel a specific order
   */
  private defineCancelCommand(): void {
    const command: TGCommand = {
      command: 'cancel',
      description: 'Cancel an order (/cancel <order_id>)',
      privite: true,
      callback: async (ctx: TGBotContext) => {
        try {
          if (!this.pmClient) {
            await ctx.reply('❌ PM client not configured')
            return
          }

          const text = ctx.message?.text || ''
          const parts = text.split(' ')

          if (parts.length < 2) {
            await ctx.reply('❌ Usage: /cancel <order\\_id>', { parse_mode: 'Markdown' })
            return
          }

          const orderId = parts[1] as string
          await ctx.reply(`⏳ Cancelling order \`${orderId.slice(0, 12)}...\``, { parse_mode: 'Markdown' })

          const success = await this.pmClient.cancelOrder(orderId)

          if (success) {
            await ctx.reply(`✅ Order cancelled: \`${orderId.slice(0, 12)}...\``, { parse_mode: 'Markdown' })
          }
          else {
            await ctx.reply(`❌ Failed to cancel order: \`${orderId.slice(0, 12)}...\``, { parse_mode: 'Markdown' })
          }
        }
        catch (error) {
          logger.error('[TradingCommands] cancel command failed', error)
          await ctx.reply('❌ Failed to cancel order')
        }
      },
    }

    this.tgBot.defineCommand(command)
  }

  /**
   * /cancelall - Cancel all orders
   */
  private defineCancelAllCommand(): void {
    this.tgBot.defineCommand({
      command: 'cancelall',
      description: 'Cancel all open orders',
      privite: true,
      callback: async (ctx: TGBotContext) => {
        try {
          if (!this.pmClient) {
            await ctx.reply('❌ PM client not configured')
            return
          }

          await ctx.reply('⏳ Cancelling all orders...')

          const success = await this.pmClient.cancelAll()

          if (success) {
            await ctx.reply('✅ All orders cancelled')
          }
          else {
            await ctx.reply('❌ Failed to cancel some orders')
          }
        }
        catch (error) {
          logger.error('[TradingCommands] cancelall command failed', error)
          await ctx.reply('❌ Failed to cancel orders')
        }
      },
    })
  }

  /**
   * /balance - View account balance
   */
  private defineBalanceCommand(): void {
    this.tgBot.defineCommand({
      command: 'balance',
      description: 'View account balance',
      privite: true,
      callback: async (ctx: TGBotContext) => {
        try {
          if (!this.pmClient) {
            await ctx.reply('❌ PM client not configured')
            return
          }

          const balance = await this.pmClient.getBalanceAllowance()

          let message = '💰 *Account Balance*\n\n'
          message += `📊 *USDC Balance:* $${Number(balance?.balance || 0).toFixed(2)}\n`
          message += `✅ *Allowance:* $${Number(balance?.allowance || 0).toFixed(2)}\n`

          await ctx.reply(message, { parse_mode: 'Markdown' })
        }
        catch (error) {
          logger.error('[TradingCommands] balance command failed', error)
          await ctx.reply('❌ Failed to fetch balance')
        }
      },
    })
  }

  /**
   * /pnl - View PnL summary
   */
  private definePnLCommand(): void {
    this.tgBot.defineCommand({
      command: 'pnl',
      description: 'View PnL summary',
      privite: true,
      callback: async (ctx: TGBotContext) => {
        try {
          if (!this.pmClient) {
            await ctx.reply('❌ PM client not configured')
            return
          }

          const trades = await this.pmClient.getTrades()

          if (!trades || trades.length === 0) {
            await ctx.reply('📭 No trades found')
            return
          }

          let totalPnL = 0
          let winCount = 0
          let lossCount = 0

          // Simple PnL calculation (this would need real position tracking for accuracy)
          for (const trade of trades) {
            const pnl = Number(trade.price) * Number(trade.size) * (trade.side === 'SELL' ? 1 : -1)
            totalPnL += pnl
            if (pnl > 0)
              winCount++
            else if (pnl < 0)
              lossCount++
          }

          const winRate = trades.length > 0 ? (winCount / trades.length) * 100 : 0
          const emoji = totalPnL >= 0 ? '📈' : '📉'

          let message = `${emoji} *PnL Summary*\n\n`
          message += `💰 *Total PnL:* ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}\n`
          message += `📊 *Total Trades:* ${trades.length}\n`
          message += `✅ *Wins:* ${winCount}\n`
          message += `❌ *Losses:* ${lossCount}\n`
          message += `🎯 *Win Rate:* ${winRate.toFixed(1)}%\n`

          await ctx.reply(message, { parse_mode: 'Markdown' })
        }
        catch (error) {
          logger.error('[TradingCommands] pnl command failed', error)
          await ctx.reply('❌ Failed to calculate PnL')
        }
      },
    })
  }

  /**
   * /strategies - View active strategies
   */
  private defineStrategiesCommand(): void {
    this.tgBot.defineCommand({
      command: 'strategies',
      description: 'View/toggle strategies',
      privite: true,
      callback: async (ctx: TGBotContext) => {
        try {
          if (!this.strategyContext) {
            await ctx.reply('❌ Strategy context not configured')
            return
          }

          const strategies = this.strategyContext.getAllStrategies()

          if (strategies.length === 0) {
            await ctx.reply('📭 No strategies configured')
            return
          }

          let message = '🤖 *Trading Strategies*\n\n'

          for (const strategy of strategies) {
            const emoji = strategy.enabled ? '✅' : '⏸️'
            message += `${emoji} *${strategy.name}*\n`
            message += `   Type: ${strategy.type}\n`
            message += `   Status: ${strategy.enabled ? 'Active' : 'Paused'}\n\n`
          }

          message += `\n💡 Strategies are managed automatically`

          await ctx.reply(message, { parse_mode: 'Markdown' })
        }
        catch (error) {
          logger.error('[TradingCommands] strategies command failed', error)
          await ctx.reply('❌ Failed to fetch strategies')
        }
      },
    })
  }

  /**
   * /risk - View risk metrics
   */
  private defineRiskCommand(): void {
    this.tgBot.defineCommand({
      command: 'risk',
      description: 'View risk metrics',
      privite: true,
      callback: async (ctx: TGBotContext) => {
        try {
          if (!this.riskManager) {
            await ctx.reply('❌ Risk manager not configured')
            return
          }

          const limits = this.riskManager.getLimits()

          let message = '⚠️ *Risk Configuration*\n\n'
          message += `📊 *Position Limits:*\n`
          message += `   Max Position Size: $${limits.maxPositionSize}\n`
          message += `   Max Positions: ${limits.maxPositions}\n`
          message += `   Max Per Market: $${limits.maxPerMarketExposure}\n\n`

          message += `📈 *Exposure Limits:*\n`
          message += `   Max Total Exposure: $${limits.maxTotalExposure}\n`
          message += `   Max Drawdown: ${limits.maxDrawdownPercent}%\n`
          message += `   Daily Loss Limit: $${limits.dailyLossLimit}\n`

          await ctx.reply(message, { parse_mode: 'Markdown' })
        }
        catch (error) {
          logger.error('[TradingCommands] risk command failed', error)
          await ctx.reply('❌ Failed to fetch risk metrics')
        }
      },
    })
  }

  /**
   * /status - View system status
   */
  private defineStatusCommand(): void {
    this.tgBot.defineCommand({
      command: 'status',
      description: 'View system status',
      privite: true,
      callback: async (ctx: TGBotContext) => {
        try {
          const memoryUsage = process.memoryUsage() as NodeJS.MemoryUsage
          const uptime = process.uptime() as number

          let message = '🔧 *System Status*\n\n'
          message += `✅ *Status:* Online\n`
          message += `⏱️ *Uptime:* ${this.formatUptime(uptime)}\n`
          message += `💾 *Memory:* ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(1)} MB\n\n`

          message += `🔌 *Services:*\n`
          message += `   PM Client: ${this.pmClient ? '✅' : '❌'}\n`
          message += `   Risk Manager: ${this.riskManager ? '✅' : '❌'}\n`
          message += `   Strategy Context: ${this.strategyContext ? '✅' : '❌'}\n`

          await ctx.reply(message, { parse_mode: 'Markdown' })
        }
        catch (error) {
          logger.error('[TradingCommands] status command failed', error)
          await ctx.reply('❌ Failed to fetch status')
        }
      },
    })
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

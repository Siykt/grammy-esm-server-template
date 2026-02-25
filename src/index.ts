import { dirname } from 'node:path'

import process from 'node:process'
import { fileURLToPath } from 'node:url'
import logger from './common/logger.js'

import { ENV } from './constants/env.js'
import { setupI18n } from './locales/index.js'
import { NotificationService } from './notifications/notification.service.js'
import { RiskManagerService } from './risk/risk-manager.service.js'
import { CronExpressions, CronSchedulerService } from './scheduler/cron-scheduler.service.js'
import { pmDataService, tgBotService } from './services/index.js'
import { PMClientService } from './services/pm/client.service.js'
import { TradingCommands } from './services/tg/commands/trading.commands.js'
import { PinnacleArbitrageStrategy } from './strategies/arbitrage/pinnacle.strategy.js'
import { StrategyContext } from './strategies/base/strategy-context.js'
import 'reflect-metadata'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

globalThis.__dirname = __dirname
globalThis.__filename = __filename

/**
 * Application Services
 */
interface AppServices {
  pmClient: PMClientService
  riskManager: RiskManagerService
  notificationService: NotificationService
  strategyContext: StrategyContext
  scheduler: CronSchedulerService
  tradingCommands: TradingCommands
}

/**
 * Initialize core services
 */
async function initServices(): Promise<AppServices> {
  // 1. Initialize PM Client
  const pmClient = new PMClientService()
  await pmClient.init()
  logger.info('[Bootstrap] PM Client initialized')

  // 2. Initialize Risk Manager
  const riskManager = new RiskManagerService({
    maxPositionSize: 1000,
    maxTotalExposure: 10000,
    maxDrawdownPercent: 10,
    maxPositions: 10,
    dailyLossLimit: 500,
  })
  logger.info('[Bootstrap] Risk Manager initialized')

  // 3. Initialize Notification Service
  const notificationService = new NotificationService(tgBotService)
  // Set admin chat ID for notifications (from ENV or first user)
  if (ENV.TELEGRAM_ADMIN_CHAT_ID) {
    notificationService.setChatId(ENV.TELEGRAM_ADMIN_CHAT_ID)
  }
  logger.info('[Bootstrap] Notification Service initialized')

  // 4. Initialize Strategy Context
  const strategyContext = new StrategyContext(10000) // 10 second scan interval
  logger.info('[Bootstrap] Strategy Context initialized')

  // 5. Initialize Scheduler
  const scheduler = new CronSchedulerService()
  logger.info('[Bootstrap] Scheduler initialized')

  // 6. Initialize Trading Commands
  const tradingCommands = new TradingCommands(
    tgBotService,
    pmClient,
    riskManager,
    strategyContext,
  )
  tradingCommands.register()
  logger.info('[Bootstrap] Trading Commands registered')

  return {
    pmClient,
    riskManager,
    notificationService,
    strategyContext,
    scheduler,
    tradingCommands,
  }
}

/**
 * Setup strategies
 */
function setupStrategies(services: AppServices): void {
  const { pmClient, strategyContext } = services

  // Setup Pinnacle Arbitrage Strategy (if API key is configured)
  if (ENV.ODDS_API_KEYS.length > 0) {
    const pinnacleStrategy = new PinnacleArbitrageStrategy(
      'pinnacle-value',
      pmClient,
      {
        oddsApiKeys: ENV.ODDS_API_KEYS,
        minEdge: 0.03, // 3% minimum edge
        // 黑名单模式：排除不需要的体育项目，留空则扫描所有
        excludedSports: [],
        confidenceThreshold: 0.6,
        maxPositionSize: 500,
        enabled: false,
        maxConcurrentTrades: 3,
        maxDailyTrades: 20,
      },
    )
    strategyContext.register(pinnacleStrategy)
    logger.info('[Bootstrap] Pinnacle Arbitrage Strategy registered')
  }
  else {
    logger.warn('[Bootstrap] ODDS_API_KEYS not configured, Pinnacle strategy disabled')
  }
}

/**
 * Setup scheduled jobs
 */
function setupScheduledJobs(services: AppServices): void {
  const { scheduler, strategyContext, notificationService } = services

  // Opportunity Scan Job (every 10 seconds)
  scheduler.addJob({
    name: 'opportunity-scan',
    cronExpression: CronExpressions.EVERY_10_SECONDS,
    enabled: true,
    handler: async () => {
      const results = await strategyContext.runAll()
      const totalOpportunities = results.reduce((sum, r) => sum + (r.opportunities || 0), 0)
      if (totalOpportunities > 0) {
        logger.info(`[Scheduler] Found ${totalOpportunities} opportunities`)
      }
    },
  })

  // Risk Monitor Job (every 30 seconds)
  scheduler.addJob({
    name: 'risk-monitor',
    cronExpression: CronExpressions.EVERY_30_SECONDS,
    enabled: true,
    handler: async () => {
      // This would integrate with position provider
      logger.debug('[Scheduler] Risk monitoring cycle')
    },
  })

  // Daily Report Job (every day at midnight UTC)
  scheduler.addJob({
    name: 'daily-report',
    cronExpression: CronExpressions.EVERY_DAY_MIDNIGHT,
    enabled: true,
    handler: async () => {
      const stats = strategyContext.getStats()
      const message = `📊 *Daily Report*\n\n`
        + `Strategies: ${stats.totals.strategiesCount}\n`
        + `Opportunities Found: ${stats.totals.totalOpportunitiesFound}\n`
        + `Opportunities Executed: ${stats.totals.totalOpportunitiesExecuted}\n`
        + `Total PnL: $${stats.totals.totalPnL.toFixed(2)}`

      await notificationService.broadcast(message)
    },
  })

  logger.info('[Bootstrap] Scheduled jobs configured')
}

/**
 * Setup WebSocket subscriptions
 */
function setupWebSocket(): void {
  // Subscribe to PM real-time data
  pmDataService.onMessage((message) => {
    logger.debug('[WebSocket] PM Message:', message)
  })

  logger.info('[Bootstrap] WebSocket subscriptions configured')
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown(services: AppServices): void {
  const shutdown = async (signal: string) => {
    logger.info(`[Shutdown] Received ${signal}, shutting down gracefully...`)

    try {
      // Stop scheduler
      services.scheduler.stop()
      logger.info('[Shutdown] Scheduler stopped')

      // Stop strategies
      await services.strategyContext.stopAll()
      logger.info('[Shutdown] Strategies stopped')

      // Send shutdown notification
      await services.notificationService.broadcast('🔴 *System Shutdown*\n\nBot is going offline.')

      logger.info('[Shutdown] Graceful shutdown completed')
      process.exit(0)
    }
    catch (error) {
      logger.error('[Shutdown] Error during shutdown', error)
      process.exit(1)
    }
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

/**
 * Main bootstrap function
 */
async function bootstrap() {
  logger.info('='.repeat(50))
  logger.info('  Polymarket Arbitrage Bot Starting...')
  logger.info('='.repeat(50))

  await setupI18n()

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason)
  })

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error)
    process.exit(1)
  })

  try {
    // Initialize services
    const services = await initServices()

    // Setup components
    setupStrategies(services)
    setupScheduledJobs(services)
    setupWebSocket()
    setupGracefulShutdown(services)

    // Start scheduler
    services.scheduler.start()
    logger.info('[Bootstrap] Scheduler started')

    // Start strategies
    await services.strategyContext.startAll()
    logger.info('[Bootstrap] Strategies started')

    // Start Telegram bot
    tgBotService.run()
    logger.info('[Bootstrap] Telegram bot started')

    // Send startup notification
    await services.notificationService.broadcast(
      `🟢 *System Online*\n\n`
      + `Strategies: ${services.strategyContext.getAll().length}\n`
      + `Jobs: ${services.scheduler.getAllJobs().length}`,
    )

    logger.info('='.repeat(50))
    logger.info('  Bot is running!')
    logger.info('='.repeat(50))
  }
  catch (error) {
    logger.error('[Bootstrap] Failed to start', error)
    process.exit(1)
  }
}

bootstrap()

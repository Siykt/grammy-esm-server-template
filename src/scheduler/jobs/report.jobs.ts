import type { Position } from '../../domain/entities/position.entity.js'
import type { Trade } from '../../domain/entities/trade.entity.js'
import type { NotificationService } from '../../notifications/notification.service.js'
import type { RiskManagerService } from '../../risk/risk-manager.service.js'
import type { JobConfig } from '../scheduler.interface.js'
import logger from '../../common/logger.js'

/**
 * Report data provider interface
 */
export interface IReportDataProvider {
  getTrades: (startTime: Date, endTime: Date) => Promise<Trade[]> | Trade[]
  getPositions: () => Promise<Position[]> | Position[]
}

/**
 * Create Hourly Report Job
 * Sends hourly trading summary
 *
 * @param notificationService Notification service
 * @param dataProvider Data provider for trades and positions
 * @param riskManager Risk manager for metrics
 */
export function createHourlyReportJob(
  notificationService: NotificationService,
  dataProvider: IReportDataProvider,
  riskManager?: RiskManagerService,
): JobConfig {
  return {
    name: 'hourly-report',
    intervalMs: 60 * 60 * 1000, // 1 hour
    enabled: true,
    runImmediately: false,
    maxRetries: 1,
    handler: async () => {
      logger.debug('[HourlyReportJob] Generating hourly report')

      try {
        const now = new Date()
        const startTime = new Date(now.getTime() - 60 * 60 * 1000) // 1 hour ago

        const trades = await dataProvider.getTrades(startTime, now)
        const positions = await dataProvider.getPositions()

        const reportData = calculateReportMetrics(trades, positions, 'hourly', startTime, now, riskManager)

        await notificationService.notifyReport(reportData)

        logger.info(
          `[HourlyReportJob] Report sent: ${trades.length} trades, PnL: $${reportData.totalPnL.toFixed(2)}`,
        )
      }
      catch (error) {
        logger.error('[HourlyReportJob] Failed to generate report', error)
        throw error
      }
    },
  }
}

/**
 * Create Daily Report Job
 * Sends daily trading summary
 *
 * @param notificationService Notification service
 * @param dataProvider Data provider for trades and positions
 * @param riskManager Risk manager for metrics
 * @param hourUTC Hour of day to run (default: 0 = midnight UTC)
 */
export function createDailyReportJob(
  notificationService: NotificationService,
  dataProvider: IReportDataProvider,
  riskManager?: RiskManagerService,
  hourUTC: number = 0,
): JobConfig {
  // Calculate initial delay to next scheduled hour
  const now = new Date()
  const nextRun = new Date(now)
  nextRun.setUTCHours(hourUTC, 0, 0, 0)
  if (nextRun <= now) {
    nextRun.setUTCDate(nextRun.getUTCDate() + 1)
  }

  return {
    name: 'daily-report',
    intervalMs: 24 * 60 * 60 * 1000, // 24 hours
    enabled: true,
    runImmediately: false,
    maxRetries: 2,
    handler: async () => {
      logger.debug('[DailyReportJob] Generating daily report')

      try {
        const now = new Date()
        const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago

        const trades = await dataProvider.getTrades(startTime, now)
        const positions = await dataProvider.getPositions()

        const reportData = calculateReportMetrics(trades, positions, 'daily', startTime, now, riskManager)

        await notificationService.notifyReport(reportData)

        logger.info(
          `[DailyReportJob] Report sent: ${trades.length} trades, PnL: $${reportData.totalPnL.toFixed(2)}`,
        )
      }
      catch (error) {
        logger.error('[DailyReportJob] Failed to generate report', error)
        throw error
      }
    },
  }
}

/**
 * Create Weekly Report Job
 * Sends weekly trading summary
 *
 * @param notificationService Notification service
 * @param dataProvider Data provider for trades and positions
 * @param riskManager Risk manager for metrics
 */
export function createWeeklyReportJob(
  notificationService: NotificationService,
  dataProvider: IReportDataProvider,
  riskManager?: RiskManagerService,
): JobConfig {
  return {
    name: 'weekly-report',
    intervalMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    enabled: true,
    runImmediately: false,
    maxRetries: 2,
    handler: async () => {
      logger.debug('[WeeklyReportJob] Generating weekly report')

      try {
        const now = new Date()
        const startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago

        const trades = await dataProvider.getTrades(startTime, now)
        const positions = await dataProvider.getPositions()

        const reportData = calculateReportMetrics(trades, positions, 'weekly', startTime, now, riskManager)

        await notificationService.notifyReport(reportData)

        logger.info(
          `[WeeklyReportJob] Report sent: ${trades.length} trades, PnL: $${reportData.totalPnL.toFixed(2)}`,
        )
      }
      catch (error) {
        logger.error('[WeeklyReportJob] Failed to generate report', error)
        throw error
      }
    },
  }
}

/**
 * Calculate report metrics from trades and positions
 */
function calculateReportMetrics(
  trades: Trade[],
  positions: Position[],
  period: 'hourly' | 'daily' | 'weekly',
  startTime: Date,
  endTime: Date,
  riskManager?: RiskManagerService,
) {
  let realizedPnL = 0
  let unrealizedPnL = 0
  let wins = 0
  // const losses = 0

  // Calculate realized PnL from trades
  for (const trade of trades) {
    const pnl = trade.pnl ?? 0
    realizedPnL += pnl
    if (pnl > 0) {
      wins++
    }
    else if (pnl < 0) {
      // losses++
    }
  }

  // Calculate unrealized PnL from positions
  for (const position of positions) {
    unrealizedPnL += position.unrealizedPnL
  }

  const totalPnL = realizedPnL + unrealizedPnL
  const winRate = trades.length > 0 ? wins / trades.length : 0

  // Get risk metrics if available
  const metrics = riskManager && positions.length > 0
    ? riskManager.evaluateRisk(positions)
    : undefined

  return {
    period,
    startTime,
    endTime,
    trades: trades.length,
    winRate,
    totalPnL,
    realizedPnL,
    unrealizedPnL,
    openPositions: positions.filter(p => p.isOpen).length,
    metrics,
  }
}

import type { PositionCollection } from '../../collections/position.collection.js'
import type { Position } from '../../domain/entities/position.entity.js'
import type { NotificationService } from '../../notifications/notification.service.js'
import type { RiskManagerService } from '../../risk/risk-manager.service.js'
import type { JobConfig } from '../scheduler.interface.js'
import logger from '../../common/logger.js'
import { createNotification, NotificationPriority, NotificationType } from '../../notifications/notification.interface.js'

/**
 * Position data provider interface
 */
export interface IPositionProvider {
  getOpenPositions: () => Promise<Position[]> | Position[]
}

/**
 * Create Position Monitor Job
 * Monitors open positions and evaluates risk conditions
 *
 * @param riskManager Risk manager service
 * @param positionProvider Provider for position data
 * @param notificationService Notification service for alerts
 * @param intervalMs Monitor interval in milliseconds (default: 10000 = 10 seconds)
 */
export function createPositionMonitorJob(
  riskManager: RiskManagerService,
  positionProvider: IPositionProvider,
  notificationService: NotificationService,
  intervalMs: number = 10000,
): JobConfig {
  return {
    name: 'position-monitor',
    intervalMs,
    enabled: true,
    runImmediately: false,
    maxRetries: 2,
    retryDelayMs: 3000,
    handler: async () => {
      logger.debug('[PositionMonitorJob] Starting position check')

      try {
        const positions = await positionProvider.getOpenPositions()

        if (positions.length === 0) {
          logger.debug('[PositionMonitorJob] No open positions to monitor')
          return
        }

        // Evaluate risk for all positions
        const alerts = riskManager.evaluateAllPositions(positions)

        // Process alerts
        for (const alert of alerts) {
          logger.info(`[PositionMonitorJob] Risk alert: ${alert.alertType} - ${alert.message}`)

          // Send notification
          await notificationService.notify(
            createNotification({
              type: alert.alertType.includes('stop_loss')
                ? NotificationType.STOP_LOSS
                : alert.alertType.includes('take_profit')
                  ? NotificationType.TAKE_PROFIT
                  : NotificationType.RISK_ALERT,
              priority: alert.isCritical ? NotificationPriority.URGENT : NotificationPriority.HIGH,
              title: `Risk Alert: ${alert.alertType}`,
              message: alert.message,
              data: {
                alertType: alert.alertType,
                level: alert.level,
                position: alert.position?.toJSON(),
                metrics: alert.metrics,
              },
            }),
          )
        }

        // Log metrics
        const metrics = riskManager.evaluateRisk(positions)
        logger.debug(
          `[PositionMonitorJob] Positions: ${positions.length}, `
          + `Exposure: $${metrics.totalExposure.toFixed(2)}, `
          + `Drawdown: ${metrics.drawdownPercent.toFixed(2)}%, `
          + `Risk Score: ${metrics.riskScore}`,
        )
      }
      catch (error) {
        logger.error('[PositionMonitorJob] Position check failed', error)
        throw error
      }
    },
  }
}

/**
 * Simple position provider using a PositionCollection
 */
export class CollectionPositionProvider implements IPositionProvider {
  constructor(private readonly collection: PositionCollection) {}

  getOpenPositions(): Position[] {
    return this.collection.getOpenPositions()
  }
}

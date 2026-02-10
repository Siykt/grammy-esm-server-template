import type { StrategyContext } from '../../strategies/base/strategy-context.js'
import type { JobConfig } from '../scheduler.interface.js'
import logger from '../../common/logger.js'

/**
 * Create Opportunity Scan Job
 * Scans for trading opportunities using configured strategies
 *
 * @param strategyContext Strategy context with registered strategies
 * @param intervalMs Scan interval in milliseconds (default: 10000 = 10 seconds)
 */
export function createOpportunityScanJob(
  strategyContext: StrategyContext,
  intervalMs: number = 10000,
): JobConfig {
  return {
    name: 'opportunity-scan',
    intervalMs,
    enabled: true,
    runImmediately: false,
    maxRetries: 2,
    retryDelayMs: 3000,
    handler: async () => {
      logger.debug('[OpportunityScanJob] Starting scan')

      try {
        // Run all enabled strategies
        const results = await strategyContext.runAll()

        let totalOpportunities = 0
        let totalExecuted = 0

        for (const result of results) {
          if (result.opportunities !== undefined) {
            totalOpportunities += result.opportunities
          }
          if (result.executed !== undefined) {
            totalExecuted += result.executed
          }
        }

        if (totalOpportunities > 0) {
          logger.info(
            `[OpportunityScanJob] Found ${totalOpportunities} opportunities, executed ${totalExecuted}`,
          )
        }
        else {
          logger.debug('[OpportunityScanJob] No opportunities found')
        }
      }
      catch (error) {
        logger.error('[OpportunityScanJob] Scan failed', error)
        throw error
      }
    },
  }
}

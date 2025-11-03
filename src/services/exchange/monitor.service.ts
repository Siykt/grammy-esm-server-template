import { pMapPool } from '@atp-tools/lib'
import { inject } from 'inversify'
import { Service } from '../../common/decorators/service.js'
import logger from '../../common/logger.js'
import { exchangeService } from '../index.js'
import { PairService } from './pair.service.js'

@Service()
export class ExchangeMonitorService {
  private timer: TimeoutHandle | null = null

  constructor(
    @inject(PairService)
    private readonly pairService: PairService,
  ) {}

  start(intervalMs = 60_000): void {
    if (this.timer)
      return

    this.tick()
    this.timer = setInterval(() => {
      this.tick().catch(e => logger.error(`[Monitor] tick error: ${e.message}`))
    }, intervalMs)
    logger.info(`[Monitor] started, interval=${intervalMs}ms`)
  }

  stop(): void {
    if (!this.timer)
      return
    clearInterval(this.timer)
    this.timer = null
  }

  private async tick(): Promise<void> {
    const pairs = await this.pairService.list({ enabled: true })
    if (!pairs.length) {
      logger.info('[Monitor] no enabled pairs')
      return
    }
    const adapters = exchangeService.listAdapters()
    for (const pair of pairs) {
      const symbol = pair.symbol
      const rates: Record<string, number> = {}
      await pMapPool(adapters, async (ad) => {
        try {
          const fr = await ad.fetchFundingRate(symbol)
          rates[ad.id] = fr.rate
        }
        catch (e) {
          logger.warn(`[Monitor] ${ad.id} fetchFundingRate ${symbol} failed: ${(e as Error).message}`)
        }
      })
      const entries = Object.entries(rates)
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          const [aId, aRate] = entries[i] as [string, number]
          const [bId, bRate] = entries[j] as [string, number]
          const spread = aRate - bRate
          // 大于 0.01% 的差价记录日志
          if (Math.abs(spread) > 0.0001) {
            logger.info(`[Monitor] ${symbol} ${aId}<->${bId} spread=${spread}`)
          }
        }
      }
    }
  }
}

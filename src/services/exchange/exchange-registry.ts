import type { ExchangeAdapter } from './exchange-adapter.js'
import type { ExchangeId } from './types.js'

/**
 * 适配器注册表：集中管理多交易所适配器
 */
export class ExchangeRegistry {
  private readonly idToAdapter = new Map<ExchangeId, ExchangeAdapter>()

  register(adapter: ExchangeAdapter): void {
    this.idToAdapter.set(adapter.id, adapter)
  }

  get(exchangeId: ExchangeId): ExchangeAdapter {
    const adapter = this.idToAdapter.get(exchangeId)
    if (!adapter)
      throw new Error(`Exchange adapter not found: ${exchangeId}`)
    return adapter
  }

  has(exchangeId: ExchangeId): boolean {
    return this.idToAdapter.has(exchangeId)
  }

  list(): ExchangeAdapter[] {
    return [...this.idToAdapter.values()]
  }
}

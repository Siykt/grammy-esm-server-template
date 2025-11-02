import type { ExchangeAdapter } from './exchange-adapter.js'
import type { ExchangeId, FundingRate, Order, PlaceOrderParams, SymbolPair, TickerPrices } from './types.js'
import { Service } from '../../common/decorators/service.js'
import { ExchangeRegistry } from './exchange-registry.js'

@Service()
export class ExchangeService {
  private readonly registry = new ExchangeRegistry()
  private readonly fundingIntervalCache = new Map<string, { value: number, expireAt: number }>()

  registerAdapter(adapter: ExchangeAdapter): void {
    this.registry.register(adapter)
  }

  getAdapter(exchangeId: ExchangeId): ExchangeAdapter {
    return this.registry.get(exchangeId)
  }

  listAdapters(): ExchangeAdapter[] {
    return this.registry.list()
  }

  // ---- 便捷封装（按交易所 ID 调用） ----

  fetchFundingRate(exchangeId: ExchangeId, symbol: SymbolPair): Promise<FundingRate> {
    return this.getAdapter(exchangeId).fetchFundingRate(symbol)
  }

  async fetchFundingRateInterval(exchangeId: ExchangeId, symbol?: SymbolPair): Promise<number> {
    const key = `${exchangeId}:${symbol ?? '*'}:`
    const hit = this.fundingIntervalCache.get(key)
    const now = Date.now()
    if (hit && hit.expireAt > now)
      return hit.value
    const val = await this.getAdapter(exchangeId).fetchFundingRateInterval(symbol)
    // 默认缓存 10 分钟
    this.fundingIntervalCache.set(key, { value: val, expireAt: now + 10 * 60 * 1000 })
    return val
  }

  fetchTickerPrices(exchangeId: ExchangeId, symbol: SymbolPair): Promise<TickerPrices> {
    return this.getAdapter(exchangeId).fetchTickerPrices(symbol)
  }

  fetchMarkPrice(exchangeId: ExchangeId, symbol: SymbolPair): Promise<number> {
    return this.getAdapter(exchangeId).fetchMarkPrice(symbol)
  }

  fetchIndexPrice(exchangeId: ExchangeId, symbol: SymbolPair): Promise<number> {
    return this.getAdapter(exchangeId).fetchIndexPrice(symbol)
  }

  placeLimitOrder(exchangeId: ExchangeId, params: PlaceOrderParams): Promise<Order> {
    return this.getAdapter(exchangeId).placeLimitOrder(params)
  }

  placeMarketOrder(exchangeId: ExchangeId, params: PlaceOrderParams): Promise<Order> {
    return this.getAdapter(exchangeId).placeMarketOrder(params)
  }

  cancelOrder(exchangeId: ExchangeId, symbol: SymbolPair, orderId: string): Promise<boolean> {
    return this.getAdapter(exchangeId).cancelOrder(symbol, orderId)
  }

  fetchOrder(exchangeId: ExchangeId, symbol: SymbolPair, orderId: string): Promise<Order> {
    return this.getAdapter(exchangeId).fetchOrder(symbol, orderId)
  }
}

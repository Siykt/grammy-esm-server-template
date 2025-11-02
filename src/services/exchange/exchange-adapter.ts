import type { ExchangeId, FundingRate, Order, PlaceOrderParams, SymbolPair, TickerPrices } from './types.js'

/**
 * 统一的交易所适配器抽象。各中心化交易所请继承并实现具体逻辑。
 */
export abstract class ExchangeAdapter {
  readonly id: ExchangeId
  readonly name: string

  constructor(id: ExchangeId, name: string) {
    this.id = id
    this.name = name
  }

  /** 获取资金费率 */
  abstract fetchFundingRate(symbol: SymbolPair): Promise<FundingRate>

  /** 获取资金费率间隔（毫秒）。部分交易所是全局固定，也有按合约不同 */
  abstract fetchFundingRateInterval(symbol?: SymbolPair): Promise<number>

  /** 获取标记价与指数价 */
  abstract fetchTickerPrices(symbol: SymbolPair): Promise<TickerPrices>

  /** 获取标记价格（便捷方法） */
  async fetchMarkPrice(symbol: SymbolPair): Promise<number> {
    const prices = await this.fetchTickerPrices(symbol)
    return prices.markPrice
  }

  /** 获取指数价格（便捷方法） */
  async fetchIndexPrice(symbol: SymbolPair): Promise<number> {
    const prices = await this.fetchTickerPrices(symbol)
    return prices.indexPrice
  }

  /** 限价单（挂单） */
  abstract placeLimitOrder(params: PlaceOrderParams): Promise<Order>

  /** 市价单（吃单） */
  abstract placeMarketOrder(params: PlaceOrderParams): Promise<Order>

  /** 取消订单 */
  abstract cancelOrder(symbol: SymbolPair, orderId: string): Promise<boolean>

  /** 查询订单 */
  abstract fetchOrder(symbol: SymbolPair, orderId: string): Promise<Order>
}

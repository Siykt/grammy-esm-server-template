import type { FundingRate, Order, PlaceOrderParams, SymbolPair, TickerPrices } from '../types.js'
import { ExchangeAdapter } from '../exchange-adapter.js'

export class KucoinAdapter extends ExchangeAdapter {
  constructor() {
    super('kucoin', 'KuCoin')
  }

  async fetchFundingRate(_: SymbolPair): Promise<FundingRate> {
    // TODO: 访问 KuCoin Futures 资金费率公共接口文档失败，待补充
    // 参考：
    // https://www.kucoin.com/docs
    throw new Error('Not implemented: KuCoin fetchFundingRate (公共文档访问失败占位)')
  }

  async fetchFundingRateInterval(): Promise<number> {
    return 8 * 60 * 60 * 1000
  }

  async fetchTickerPrices(_: SymbolPair): Promise<TickerPrices> {
    // TODO: 访问 KuCoin 标记/指数价格公共接口文档失败，待补充
    throw new Error('Not implemented: KuCoin fetchTickerPrices (公共文档访问失败占位)')
  }

  async placeLimitOrder(_: PlaceOrderParams): Promise<Order> {
    throw new Error('Not implemented: KuCoin placeLimitOrder')
  }

  async placeMarketOrder(_: PlaceOrderParams): Promise<Order> {
    throw new Error('Not implemented: KuCoin placeMarketOrder')
  }

  async cancelOrder(): Promise<boolean> {
    throw new Error('Not implemented: KuCoin cancelOrder')
  }

  async fetchOrder(): Promise<Order> {
    throw new Error('Not implemented: KuCoin fetchOrder')
  }
}

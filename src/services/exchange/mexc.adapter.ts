import type { FundingRate, Order, PlaceOrderParams, SymbolPair, TickerPrices } from './types.js'
import { ExchangeAdapter } from './exchange-adapter.js'

export class MexcAdapter extends ExchangeAdapter {
  constructor() {
    super('mexc', 'MEXC')
  }

  async fetchFundingRate(_: SymbolPair): Promise<FundingRate> {
    // TODO: 访问 MEXC 合约资金费率公共接口文档失败，待补充
    // 参考：
    // https://mexc.com/api-doc
    throw new Error('Not implemented: MEXC fetchFundingRate (公共文档访问失败占位)')
  }

  async fetchFundingRateInterval(): Promise<number> {
    return 8 * 60 * 60 * 1000
  }

  async fetchTickerPrices(_: SymbolPair): Promise<TickerPrices> {
    // TODO: 访问 MEXC 标记/指数价格公共接口文档失败，待补充
    throw new Error('Not implemented: MEXC fetchTickerPrices (公共文档访问失败占位)')
  }

  async placeLimitOrder(_: PlaceOrderParams): Promise<Order> {
    throw new Error('Not implemented: MEXC placeLimitOrder')
  }

  async placeMarketOrder(_: PlaceOrderParams): Promise<Order> {
    throw new Error('Not implemented: MEXC placeMarketOrder')
  }

  async cancelOrder(): Promise<boolean> {
    throw new Error('Not implemented: MEXC cancelOrder')
  }

  async fetchOrder(): Promise<Order> {
    throw new Error('Not implemented: MEXC fetchOrder')
  }
}

import type { FundingRate, Order, PlaceOrderParams, SymbolPair, TickerPrices } from '../types.js'
import { ExchangeAdapter } from '../exchange-adapter.js'
import { toBinanceSymbol } from '../utils.js'

interface BinancePremiumIndexResponse {
  symbol: string
  markPrice: string
  indexPrice: string
  lastFundingRate?: string
  nextFundingTime?: number
}

export class BinanceAdapter extends ExchangeAdapter {
  constructor() {
    super('binance', 'Binance')
  }

  async fetchFundingRate(symbol: SymbolPair): Promise<FundingRate> {
    const info = toBinanceSymbol(symbol)
    const url = `${info.baseUrl}/fapi/v1/premiumIndex`.replace('/fapi/', info.inverse ? '/dapi/' : '/fapi/')
    const res = await fetch(`${url}?symbol=${encodeURIComponent(info.symbol)}`)
    if (!res.ok)
      throw new Error(`Binance premiumIndex error: ${res.status}`)
    const data = (await res.json()) as BinancePremiumIndexResponse
    const rate = data.lastFundingRate ? Number(data.lastFundingRate) : 0
    return {
      symbol,
      rate,
      timestamp: Date.now(),
      nextFundingTime: data.nextFundingTime,
    }
  }

  async fetchFundingRateInterval(): Promise<number> {
    // Binance 永续通常 8 小时
    return 8 * 60 * 60 * 1000
  }

  async fetchTickerPrices(symbol: SymbolPair): Promise<TickerPrices> {
    const info = toBinanceSymbol(symbol)
    const url = `${info.baseUrl}/fapi/v1/premiumIndex`.replace('/fapi/', info.inverse ? '/dapi/' : '/fapi/')
    const res = await fetch(`${url}?symbol=${encodeURIComponent(info.symbol)}`)
    if (!res.ok)
      throw new Error(`Binance premiumIndex error: ${res.status}`)
    const data = (await res.json()) as BinancePremiumIndexResponse
    return {
      markPrice: Number(data.markPrice),
      indexPrice: Number(data.indexPrice),
    }
  }

  async placeLimitOrder(_: PlaceOrderParams): Promise<Order> {
    throw new Error('Not implemented: Binance placeLimitOrder')
  }

  async placeMarketOrder(_: PlaceOrderParams): Promise<Order> {
    throw new Error('Not implemented: Binance placeMarketOrder')
  }

  async cancelOrder(): Promise<boolean> {
    throw new Error('Not implemented: Binance cancelOrder')
  }

  async fetchOrder(): Promise<Order> {
    throw new Error('Not implemented: Binance fetchOrder')
  }
}

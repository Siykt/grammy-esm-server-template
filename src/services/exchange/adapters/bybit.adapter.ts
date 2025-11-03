import type { FundingRate, Order, PlaceOrderParams, SymbolPair, TickerPrices } from '../types.js'
import { ExchangeAdapter } from '../exchange-adapter.js'
import { toBybitSymbolAndCategory } from '../utils.js'

interface BybitFundingHistoryItem {
  fundingRate: string
  fundingRateTimestamp: string
}

interface BybitFundingHistoryResponse {
  retCode: number
  retMsg: string
  result?: { list?: BybitFundingHistoryItem[] }
}

interface BybitTickersItem {
  markPrice?: string
  indexPrice?: string
}

interface BybitTickersResponse {
  retCode: number
  retMsg: string
  result?: { list?: BybitTickersItem[] }
}

export class BybitAdapter extends ExchangeAdapter {
  constructor() {
    super('bybit', 'Bybit')
  }

  async fetchFundingRate(symbol: SymbolPair): Promise<FundingRate> {
    const { symbol: s, category } = toBybitSymbolAndCategory(symbol)
    const url = `https://api.bybit.com/v5/market/funding/history?category=${category}&symbol=${encodeURIComponent(s)}&limit=1`
    const res = await fetch(url)
    if (!res.ok)
      throw new Error(`Bybit funding history error: ${res.status}`)
    const data = (await res.json()) as BybitFundingHistoryResponse
    const item = data.result?.list?.[0]
    const rate = item?.fundingRate ? Number(item.fundingRate) : 0
    const timestamp = item?.fundingRateTimestamp ? Number(item.fundingRateTimestamp) : Date.now()
    return { symbol, rate, timestamp }
  }

  async fetchFundingRateInterval(): Promise<number> {
    // Bybit 永续通常 8 小时
    return 8 * 60 * 60 * 1000
  }

  async fetchTickerPrices(symbol: SymbolPair): Promise<TickerPrices> {
    const { symbol: s, category } = toBybitSymbolAndCategory(symbol)
    const url = `https://api.bybit.com/v5/market/tickers?category=${category}&symbol=${encodeURIComponent(s)}`
    const res = await fetch(url)
    if (!res.ok)
      throw new Error(`Bybit tickers error: ${res.status}`)
    const data = (await res.json()) as BybitTickersResponse
    const item = data.result?.list?.[0]
    return {
      markPrice: item?.markPrice ? Number(item.markPrice) : 0,
      indexPrice: item?.indexPrice ? Number(item.indexPrice) : 0,
    }
  }

  async placeLimitOrder(_: PlaceOrderParams): Promise<Order> {
    throw new Error('Not implemented: Bybit placeLimitOrder')
  }

  async placeMarketOrder(_: PlaceOrderParams): Promise<Order> {
    throw new Error('Not implemented: Bybit placeMarketOrder')
  }

  async cancelOrder(): Promise<boolean> {
    throw new Error('Not implemented: Bybit cancelOrder')
  }

  async fetchOrder(): Promise<Order> {
    throw new Error('Not implemented: Bybit fetchOrder')
  }
}



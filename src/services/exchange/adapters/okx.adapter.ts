import type { FundingRate, Order, PlaceOrderParams, SymbolPair, TickerPrices } from '../types.js'
import { ExchangeAdapter } from '../exchange-adapter.js'
import { toOkxInstId } from '../utils.js'

interface OkxFundingRateData {
  instId: string
  fundingRate: string
  nextFundingTime?: string
}

interface OkxFundingRateResponse {
  code: string
  msg: string
  data: OkxFundingRateData[]
}

interface OkxMarkPriceData {
  instId: string
  markPx: string
  indexPx?: string
}

interface OkxMarkPriceResponse {
  code: string
  msg: string
  data: OkxMarkPriceData[]
}

export class OkxAdapter extends ExchangeAdapter {
  private baseUrl = 'https://www.okx.com/api/v5'

  constructor() {
    super('okx', 'OKX')
  }

  async fetchFundingRate(symbol: SymbolPair): Promise<FundingRate> {
    const { instId } = toOkxInstId(symbol)
    const res = await fetch(`${this.baseUrl}/public/funding-rate?instId=${encodeURIComponent(instId)}`)
    if (!res.ok)
      throw new Error(`OKX funding-rate error: ${res.status}`)
    const data = (await res.json()) as OkxFundingRateResponse
    const item = data.data?.[0]
    const rate = item?.fundingRate ? Number(item.fundingRate) : 0
    const nextFundingTime = item?.nextFundingTime ? Number(item.nextFundingTime) : undefined
    return { symbol, rate, timestamp: Date.now(), nextFundingTime }
  }

  async fetchFundingRateInterval(): Promise<number> {
    // OKX 永续通常 8 小时
    return 8 * 60 * 60 * 1000
  }

  async fetchTickerPrices(symbol: SymbolPair): Promise<TickerPrices> {
    const { instId } = toOkxInstId(symbol)
    const res = await fetch(`${this.baseUrl}/public/mark-price?instId=${encodeURIComponent(instId)}`)
    if (!res.ok)
      throw new Error(`OKX mark-price error: ${res.status}`)
    const data = (await res.json()) as OkxMarkPriceResponse
    const item = data.data?.[0]
    return {
      markPrice: item?.markPx ? Number(item.markPx) : 0,
      indexPrice: item?.indexPx ? Number(item.indexPx) : 0,
    }
  }

  async placeLimitOrder(_: PlaceOrderParams): Promise<Order> {
    throw new Error('Not implemented: OKX placeLimitOrder')
  }

  async placeMarketOrder(_: PlaceOrderParams): Promise<Order> {
    throw new Error('Not implemented: OKX placeMarketOrder')
  }

  async cancelOrder(): Promise<boolean> {
    throw new Error('Not implemented: OKX cancelOrder')
  }

  async fetchOrder(): Promise<Order> {
    throw new Error('Not implemented: OKX fetchOrder')
  }
}



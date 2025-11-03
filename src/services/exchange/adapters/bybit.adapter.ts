import type { Exchange, Market } from 'ccxt'
import type { FundingRate, Order, PlaceOrderParams, SymbolPair, TickerPrices } from '../types.js'
import ccxt from 'ccxt'
import { ExchangeAdapter } from '../exchange-adapter.js'
import { isLinear, parseSymbol, toBybitSymbolAndCategory } from '../utils.js'

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

  private createClient(): Exchange {
    const opts: { enableRateLimit: boolean, apiKey?: string, secret?: string } = { enableRateLimit: true }
    if (this.credentials?.apiKey && this.credentials?.apiSecret) {
      opts.apiKey = this.credentials.apiKey
      opts.secret = this.credentials.apiSecret
    }
    const BybitCtor = ccxt.bybit
    return new BybitCtor(opts)
  }

  private async resolveCcxtSymbol(client: Exchange, symbol: SymbolPair): Promise<string> {
    const p = parseSymbol(symbol)
    await client.loadMarkets()
    const markets = Object.values(client.markets as Record<string, Market>)
      .filter(m => m && m.swap && m.base === p.base && m.quote === p.quote)
    if (markets.length === 0)
      throw new Error(`Bybit 找不到合约市场: ${symbol}`)
    const preferred = markets.find(m => m && (isLinear(p) ? m.linear : m.inverse)) || markets[0]
    return preferred?.symbol ?? ''
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
    const params = _
    const client = this.createClient()
    const ccxtSymbol = await this.resolveCcxtSymbol(client, params.symbol)
    const res = await client.createOrder(ccxtSymbol, 'limit', params.side, params.amount, params.price, {
      timeInForce: params.timeInForce,
      postOnly: params.postOnly,
      reduceOnly: params.reduceOnly,
      clientOrderId: params.clientOrderId,
    })
    const filled = Number(res.filled ?? 0)
    const amount = Number(res.amount ?? params.amount)
    const remaining = Number(res.remaining ?? Math.max(0, amount - filled))
    const status = ((): Order['status'] => {
      const s = String(res.status || '').toLowerCase()
      if (s === 'closed')
        return 'filled'

      if (s === 'canceled')
        return 'canceled'

      if (s === 'rejected')
        return 'rejected'

      return filled > 0 ? 'partially_filled' : 'new'
    })()
    return {
      id: res.id || params.clientOrderId || '',
      symbol: params.symbol,
      side: params.side,
      type: 'limit',
      price: params.price,
      amount,
      filled,
      remaining,
      status,
      timestamp: res.timestamp ?? Date.now(),
    }
  }

  async placeMarketOrder(_: PlaceOrderParams): Promise<Order> {
    const params = _
    const client = this.createClient()
    const ccxtSymbol = await this.resolveCcxtSymbol(client, params.symbol)
    const res = await client.createOrder(ccxtSymbol, 'market', params.side, params.amount, undefined, {
      timeInForce: params.timeInForce,
      reduceOnly: params.reduceOnly,
      clientOrderId: params.clientOrderId,
    })
    const filled = Number(res.filled ?? 0)
    const amount = Number(res.amount ?? params.amount)
    const remaining = Number(res.remaining ?? Math.max(0, amount - filled))
    const status = ((): Order['status'] => {
      const s = String(res.status || '').toLowerCase()
      if (s === 'closed')
        return 'filled'

      if (s === 'canceled')
        return 'canceled'

      if (s === 'rejected')
        return 'rejected'

      return filled > 0 ? 'partially_filled' : 'new'
    })()
    return {
      id: res.id || params.clientOrderId || '',
      symbol: params.symbol,
      side: params.side,
      type: 'market',
      amount,
      filled,
      remaining,
      status,
      timestamp: res.timestamp ?? Date.now(),
    }
  }

  async cancelOrder(symbol: SymbolPair, orderId: string): Promise<boolean> {
    const client = this.createClient()
    const ccxtSymbol = await this.resolveCcxtSymbol(client, symbol)
    await client.cancelOrder(orderId, ccxtSymbol)
    return true
  }

  async fetchOrder(symbol: SymbolPair, orderId: string): Promise<Order> {
    const client = this.createClient()
    const ccxtSymbol = await this.resolveCcxtSymbol(client, symbol)
    const o = await client.fetchOrder(orderId, ccxtSymbol)
    const filled = Number(o.filled ?? 0)
    const amount = Number(o.amount ?? 0)
    const remaining = Number(o.remaining ?? Math.max(0, amount - filled))
    const status = ((): Order['status'] => {
      const s = String(o.status || '').toLowerCase()
      if (s === 'closed')
        return 'filled'

      if (s === 'canceled')
        return 'canceled'

      if (s === 'rejected')
        return 'rejected'

      return filled > 0 ? 'partially_filled' : 'new'
    })()
    return {
      id: o.id || orderId,
      symbol,
      side: (o.side as Order['side']) || 'buy',
      type: (o.type as Order['type']) || 'limit',
      price: o.price ?? undefined,
      amount,
      filled,
      remaining,
      status,
      timestamp: o.timestamp ?? Date.now(),
    }
  }
}

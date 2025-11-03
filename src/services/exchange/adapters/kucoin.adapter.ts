import type { Exchange, Market } from 'ccxt'
import type { FundingRate, Order, PlaceOrderParams, SymbolPair, TickerPrices } from '../types.js'
import ccxt from 'ccxt'

import { ExchangeAdapter } from '../exchange-adapter.js'
import { isLinear, parseSymbol } from '../utils.js'

export class KucoinAdapter extends ExchangeAdapter {
  constructor() {
    super('kucoin', 'KuCoin')
  }

  private createClient(): Exchange {
    const opts: { enableRateLimit: boolean, apiKey?: string, secret?: string, password?: string } = { enableRateLimit: true }
    if (this.credentials?.apiKey && this.credentials?.apiSecret) {
      opts.apiKey = this.credentials.apiKey
      opts.secret = this.credentials.apiSecret
      if (this.credentials.passphrase)
        opts.password = this.credentials.passphrase
    }
    const KucoinFuturesCtor = ccxt.kucoinfutures
    return new KucoinFuturesCtor(opts)
  }

  private async resolveCcxtSymbol(client: Exchange, symbol: SymbolPair): Promise<string> {
    const p = parseSymbol(symbol)
    await client.loadMarkets()
    const markets = Object.values(client.markets as Record<string, Market>)
      .filter(m => m && m.swap && m.base === p.base && m.quote === p.quote)
    if (markets.length === 0)
      throw new Error(`KuCoin 找不到合约市场: ${symbol}`)
    const preferred = markets.find(m => m && (isLinear(p) ? m.linear : m.inverse)) || markets[0]
    return preferred?.symbol ?? ''
  }

  async fetchFundingRate(symbol: SymbolPair): Promise<FundingRate> {
    const client = this.createClient()
    const ccxtSymbol = await this.resolveCcxtSymbol(client, symbol)
    if (client.has.fetchFundingRate) {
      const fr = await client.fetchFundingRate(ccxtSymbol)
      const rate = fr.fundingRate != null ? Number(fr.fundingRate) : (fr.info?.fundingRate ? Number(fr.info.fundingRate) : 0)
      const nextTs = fr.nextFundingTimestamp ?? fr.info?.nextFundingTime ?? undefined
      return { symbol, rate, timestamp: Date.now(), nextFundingTime: nextTs ? Number(nextTs) : undefined }
    }

    if (client.has.fetchFundingRateHistory) {
      const hist = await client.fetchFundingRateHistory(ccxtSymbol, undefined, 1)
      const item = Array.isArray(hist) ? hist[0] : undefined
      const rate = item?.fundingRate != null ? Number(item.fundingRate) : 0
      const ts = item?.timestamp ?? Date.now()
      return { symbol, rate, timestamp: Number(ts) }
    }
    throw new Error('KuCoin 不支持通过 ccxt 获取资金费率')
  }

  async fetchFundingRateInterval(symbol?: SymbolPair): Promise<number> {
    if (!symbol)
      return 8 * 60 * 60 * 1000

    try {
      const client = this.createClient()
      const ccxtSymbol = await this.resolveCcxtSymbol(client, symbol)
      if (client.has.fetchFundingRateHistory) {
        const hist = await client.fetchFundingRateHistory(ccxtSymbol, undefined, 2)
        const arr = Array.isArray(hist) ? hist : []
        const times = arr
          .map((i: { timestamp?: number }) => Number(i.timestamp))
          .filter(t => Number.isFinite(t))
          .sort((a, b) => a - b)
        const lastTwo = times.slice(-2)
        if (lastTwo.length === 2) {
          const prevTs = lastTwo[0]
          const currTs = lastTwo[1]
          if (typeof prevTs === 'number' && typeof currTs === 'number') {
            const dt = currTs - prevTs
            if (dt > 0)
              return dt
          }
        }
      }
      return 8 * 60 * 60 * 1000
    }
    catch {
      return 8 * 60 * 60 * 1000
    }
  }

  async fetchTickerPrices(symbol: SymbolPair): Promise<TickerPrices> {
    const client = this.createClient()
    const ccxtSymbol = await this.resolveCcxtSymbol(client, symbol)
    const t = await client.fetchTicker(ccxtSymbol)
    const mark = t.markPrice ?? t.info?.markPrice ?? t.last
    const index = t.indexPrice ?? t.info?.indexPrice ?? mark
    return {
      markPrice: Number(mark ?? 0),
      indexPrice: Number(index ?? 0),
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

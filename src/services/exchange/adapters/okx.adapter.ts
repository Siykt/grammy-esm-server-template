import type { FundingRate, Order, PlaceOrderParams, SymbolPair, TickerPrices } from '../types.js'
import { createHmac } from 'node:crypto'
import axios, { AxiosHeaders } from 'axios'
import { ExchangeAdapter } from '../exchange-adapter.js'
import { ExchangePublicSubscribeAdapter, type PublicWsRoute } from '../public-subscribe.adapter.js'
import { toOkxInstId } from '../utils.js'

interface OkxFundingRateData {
  instId: string
  fundingRate: string
  fundingTime?: string
  nextFundingTime?: string
}

interface OkxFundingRateResponse {
  code: string
  msg: string
  data: OkxFundingRateData[]
}

interface OkxFundingRateHistoryData {
  instId: string
  fundingRate?: string
  realizedRate?: string
  fundingTime: string
  instType?: string
  formulaType?: string
  method?: string
}

interface OkxFundingRateHistoryResponse {
  code: string
  msg: string
  data: OkxFundingRateHistoryData[]
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

interface OkxOrderResult {
  ordId?: string
  clOrdId?: string
  tag?: string
  ts?: string
  sCode?: string
  sMsg?: string
}

interface OkxOrderResponse {
  code: string
  msg: string
  data?: OkxOrderResult[]
  inTime?: string
  outTime?: string
}

export class OkxAdapter extends ExchangeAdapter {
  private readonly client = axios.create({ baseURL: 'https://www.okx.com/api/v5' })
  private readonly wsUrl = 'wss://ws.okx.com:8443/ws/v5/public'
  private readonly publicWs: ExchangePublicSubscribeAdapter
  private readonly frRoute: PublicWsRoute<{ instId: string, rate: number, nextFundingTime?: number }>

  constructor() {
    super('okx(欧易)', 'OKX')
    // 请求拦截器：自动为私有请求添加签名与必需请求头
    this.client.interceptors.request.use((config) => {
      // 无凭证则跳过；公共接口（/public）也跳过签名
      if (!this.credentials?.apiKey || config.url?.startsWith('/public'))
        return config

      // 计算 requestPath（必须包含 /api/v5 前缀 + 路径 + 查询串）
      const fullUrl = new URL(config.url ?? '', config.baseURL)
      const requestPath = `${fullUrl.pathname}${fullUrl.search}`
      const method = (config.method ?? 'GET').toUpperCase() as 'GET' | 'POST'
      const timestamp = new Date().toISOString()
      const hasBody = method === 'POST' && typeof config.data !== 'undefined'
      const bodyString = hasBody ? JSON.stringify(config.data) : ''

      const signature = this.sign(method, requestPath, timestamp, bodyString)
      const headers = AxiosHeaders.from(config.headers)
      headers.set('OK-ACCESS-KEY', this.credentials.apiKey)
      headers.set('OK-ACCESS-SIGN', signature)
      headers.set('OK-ACCESS-TIMESTAMP', timestamp)
      headers.set('OK-ACCESS-PASSPHRASE', this.credentials.passphrase ?? '')
      headers.set('Content-Type', 'application/json')
      config.headers = headers
      return config
    })

    this.publicWs = new ExchangePublicSubscribeAdapter({ wsUrl: this.wsUrl })
    this.frRoute = {
      id: 'funding-rate',
      buildSubscribe: instId => ({ id: `fr-${Date.now()}`, op: 'subscribe', args: [{ channel: 'funding-rate', instId }] }),
      buildUnsubscribe: instId => ({ id: `fr-${Date.now()}`, op: 'unsubscribe', args: [{ channel: 'funding-rate', instId }] }),
      parseMessage: (msg: unknown) => {
        const m = msg as { event?: string, arg?: { channel?: string, instId?: string }, data?: unknown[] }
        if (m.event)
          return null
        const arg = m.arg
        const dataArr = Array.isArray(m.data) ? m.data : []
        if (!arg || arg.channel !== 'funding-rate' || !arg.instId || dataArr.length === 0)
          return null
        const d = dataArr[0] as { fundingRate?: string, funding_rate?: string, fr?: string, nextFundingTime?: string | number, next_funding_time?: string | number, fundingTime?: string | number }
        const rateStr = d.fundingRate ?? d.funding_rate ?? d.fr
        const rate = rateStr ? Number(rateStr) : 0
        const nextFundingTs = d.nextFundingTime ?? d.next_funding_time ?? d.fundingTime
        return [{ topicKey: arg.instId, payload: { instId: arg.instId, rate, nextFundingTime: nextFundingTs ? Number(nextFundingTs) : undefined } }]
      },
    }
  }

  async fetchFundingRate(symbol: SymbolPair): Promise<FundingRate> {
    const { instId } = toOkxInstId(symbol)
    const res = await this.client.get<OkxFundingRateResponse>(`/public/funding-rate?instId=${encodeURIComponent(instId)}`)
    const item = res.data.data?.[0]
    const rate = item?.fundingRate ? Number(item.fundingRate) : 0
    const nextFundingTime = item?.nextFundingTime ? Number(item.nextFundingTime) : undefined
    return { symbol, rate, timestamp: Date.now(), nextFundingTime: nextFundingTime ? new Date(nextFundingTime).getTime() : undefined }
  }

  async fetchFundingRateInterval(symbol?: SymbolPair): Promise<number> {
    // 若未指定具体合约，返回默认 8 小时（OKX 常见值）
    if (!symbol)
      return 8 * 60 * 60 * 1000

    try {
      const { instId } = toOkxInstId(symbol)
      // 取最近若干条历史记录，计算最近两次 fundingTime 的差值作为结算间隔
      const res = await this.client.get<OkxFundingRateHistoryResponse>(`/public/funding-rate-history?instId=${encodeURIComponent(instId)}&limit=5`)
      const arr = Array.isArray(res.data.data) ? res.data.data : []
      const times = arr
        .map(d => Number(d.fundingTime))
        .filter(t => Number.isFinite(t))
        .sort((a, b) => a - b)

      // 选择最新的两个不同时间戳计算间隔
      let interval = 0
      for (let i = times.length - 1; i > 0; i--) {
        const a = times[i]
        const b = times[i - 1]
        if (a != null && b != null) {
          const dt = a - b
          if (dt > 0) {
            interval = dt
            break
          }
        }
      }

      if (interval > 0)
        return interval

      // 回退：使用当前资金费率接口中的 fundingTime 与 nextFundingTime 推断
      const cur = await this.client.get<OkxFundingRateResponse>(`/public/funding-rate?instId=${encodeURIComponent(instId)}`)
      const item = cur.data.data?.[0]
      const ft = item?.fundingTime ? Number(item.fundingTime) : undefined
      const nft = item?.nextFundingTime ? Number(item.nextFundingTime) : undefined
      if (ft && nft && nft > ft)
        return nft - ft

      // 最后兜底：8 小时
      return 8 * 60 * 60 * 1000
    }
    catch {
      // 失败兜底：8 小时
      return 8 * 60 * 60 * 1000
    }
  }

  async fetchTickerPrices(symbol: SymbolPair): Promise<TickerPrices> {
    const { instId } = toOkxInstId(symbol)
    const res = await this.client.get<OkxMarkPriceResponse>(`/public/mark-price?instId=${encodeURIComponent(instId)}`)
    const item = res.data.data?.[0]
    return {
      markPrice: item?.markPx ? Number(item.markPx) : 0,
      indexPrice: item?.indexPx ? Number(item.indexPx) : 0,
    }
  }

  // ---- 私有请求签名 ----
  private sign(method: 'GET' | 'POST', requestPath: string, timestampIso: string, bodyString = ''): string {
    const secret = this.credentials?.apiSecret ?? ''
    const prehash = `${timestampIso}${method}${requestPath}${bodyString}`
    return createHmac('sha256', secret).update(prehash).digest('base64')
  }

  // ---- WebSocket：资金费率订阅 ----
  /** 订阅资金费率推送，返回用于取消订阅的函数 */
  subscribeFundingRate(symbol: SymbolPair, onUpdate: (data: FundingRate) => void): () => void {
    const { instId } = toOkxInstId(symbol)
    return this.publicWs.subscribeWith(this.frRoute, instId, (ev) => {
      const data = ev as { instId: string, rate: number, nextFundingTime?: number }
      onUpdate({ symbol, rate: data.rate, timestamp: Date.now(), nextFundingTime: data.nextFundingTime })
    })
  }

  async placeLimitOrder(params: PlaceOrderParams): Promise<Order> {
    const { symbol, side, type, amount, price, timeInForce, postOnly, reduceOnly, clientOrderId } = params
    if (type !== 'limit')
      throw new Error('OKX placeLimitOrder: params.type 必须为 limit')
    if (price == null)
      throw new Error('OKX placeLimitOrder: 限价单需要提供 price')

    const { instId } = toOkxInstId(symbol)

    const ordType: 'limit' | 'post_only' | 'fok' | 'ioc' = postOnly
      ? 'post_only'
      : (timeInForce === 'FOK')
          ? 'fok'
          : (timeInForce === 'IOC')
              ? 'ioc'
              : 'limit'

    const body: Record<string, unknown> = {
      instId,
      tdMode: 'cross',
      side,
      ordType,
      sz: String(amount),
      px: String(price),
    }
    if (typeof reduceOnly === 'boolean')
      body.reduceOnly = reduceOnly
    if (clientOrderId)
      body.clOrdId = clientOrderId

    const res = await this.client.post<OkxOrderResponse>('/trade/order', body)
    if (res.data.code !== '0')
      throw new Error(`OKX 下单失败: ${res.data.msg || res.data.code}`)
    const d = res.data.data?.[0]
    if (!d)
      throw new Error('OKX 下单返回数据异常: data 为空')
    if (d.sCode && d.sCode !== '0')
      throw new Error(`OKX 下单失败: ${d.sMsg || d.sCode}`)

    const ts = d.ts ? Number(d.ts) : Date.now()
    const order: Order = {
      id: d.ordId || clientOrderId || '',
      symbol,
      side,
      type: 'limit',
      price: Number(price),
      amount,
      filled: 0,
      remaining: amount,
      status: 'new',
      timestamp: ts,
    }
    return order
  }

  async placeMarketOrder(params: PlaceOrderParams): Promise<Order> {
    const { symbol, side, type, amount, timeInForce, reduceOnly, clientOrderId } = params
    if (type !== 'market')
      throw new Error('OKX placeMarketOrder: params.type 必须为 market')

    const { instId } = toOkxInstId(symbol)

    // 市价单：永续/交割支持 market；若指定 IOC，使用 optimal_limit_ioc
    if (timeInForce === 'FOK')
      throw new Error('OKX 市价单不支持 FOK')
    const ordType: 'market' | 'optimal_limit_ioc' = (timeInForce === 'IOC') ? 'optimal_limit_ioc' : 'market'

    const body: Record<string, unknown> = {
      instId,
      tdMode: 'cross',
      side,
      ordType,
      sz: String(amount),
    }
    if (typeof reduceOnly === 'boolean')
      body.reduceOnly = reduceOnly
    if (clientOrderId)
      body.clOrdId = clientOrderId

    const res = await this.client.post<OkxOrderResponse>('/trade/order', body)
    if (res.data.code !== '0')
      throw new Error(`OKX 下单失败: ${res.data.msg || res.data.code}`)
    const d = res.data.data?.[0]
    if (!d)
      throw new Error('OKX 下单返回数据异常: data 为空')
    if (d.sCode && d.sCode !== '0')
      throw new Error(`OKX 下单失败: ${d.sMsg || d.sCode}`)

    const ts = d.ts ? Number(d.ts) : Date.now()
    const order: Order = {
      id: d.ordId || clientOrderId || '',
      symbol,
      side,
      type: 'market',
      amount,
      filled: 0,
      remaining: amount,
      status: 'new',
      timestamp: ts,
    }
    return order
  }

  async cancelOrder(): Promise<boolean> {
    throw new Error('Not implemented: OKX cancelOrder')
  }

  async fetchOrder(): Promise<Order> {
    throw new Error('Not implemented: OKX fetchOrder')
  }
}

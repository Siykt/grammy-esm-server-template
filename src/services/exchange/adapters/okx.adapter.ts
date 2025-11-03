import type { FundingRate, Order, PlaceOrderParams, SymbolPair, TickerPrices } from '../types.js'
import { createHmac } from 'node:crypto'
import axios, { AxiosHeaders } from 'axios'
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
  private readonly client = axios.create({ baseURL: 'https://www.okx.com/api/v5' })

  constructor() {
    super('okx(欧易)', 'OKX')
    // 请求拦截器：自动为私有请求添加签名与必需请求头
    this.client.interceptors.request.use((config) => {
      // 无凭证则跳过（公共接口）
      if (!this.credentials?.apiKey || !config.url?.startsWith('/public'))
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
  }

  async fetchFundingRate(symbol: SymbolPair): Promise<FundingRate> {
    const { instId } = toOkxInstId(symbol)
    const res = await this.client.get<OkxFundingRateResponse>(`/public/funding-rate?instId=${encodeURIComponent(instId)}`)
    const item = res.data.data?.[0]
    const rate = item?.fundingRate ? Number(item.fundingRate) : 0
    const nextFundingTime = item?.nextFundingTime ? Number(item.nextFundingTime) : undefined
    return { symbol, rate, timestamp: Date.now(), nextFundingTime: nextFundingTime ? new Date(nextFundingTime).getTime() : undefined }
  }

  async fetchFundingRateInterval(): Promise<number> {
    // OKX 永续通常 8 小时
    return 8 * 60 * 60 * 1000
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

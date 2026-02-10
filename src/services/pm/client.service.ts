import type { BuilderApiKeyCreds } from '@polymarket/builder-signing-sdk'
import type {
  AssetType,
  BalanceAllowanceParams,
  BalanceAllowanceResponse,
  OpenOrder,
  OpenOrderParams,
  OrderBookSummary,
  OrderMarketCancelParams,
  Side,
  TickSize,
  Trade,
  TradeParams,
  UserMarketOrder,
  UserOrder,
} from '@polymarket/clob-client'
import { BuilderConfig } from '@polymarket/builder-signing-sdk'
import { Chain, ClobClient, OrderType } from '@polymarket/clob-client'
import axios from 'axios'
import { Wallet } from 'ethers'
import { Service } from '../../common/decorators/service.js'
import logger from '../../common/logger.js'
import { ENV } from '../../constants/env.js'

const HOST = 'https://clob.polymarket.com'
const CHAIN_ID = Chain.POLYGON

// ============ Gamma API Types ============
export interface GammaEvent {
  id: string
  slug: string
  title: string
  active: boolean
  closed: boolean
  tags: GammaTag[]
  markets: GammaMarket[]
  /** 事件开始时间 */
  startTime?: string
  /** 所属系列 ID */
  seriesId?: string
}

export interface GammaMarket {
  id: string
  question: string
  conditionId: string
  clobTokenIds: string[]
  outcomes: string
  outcomePrices: string
  volume: string
  liquidity: string
  endDate: string
}

export interface GammaTag {
  id: string
  label: string
  slug: string
}

/**
 * PM 体育项目信息（来自 /sports API）
 */
export interface GammaSportsSeries {
  /** 体育项目 ID */
  id: number
  /** 体育项目 slug（如 'ncaab', 'nba'） */
  sport: string
  /** 图片 URL */
  image?: string
  /** 结果解析 URL */
  resolution?: string
  /** 排序方式 */
  ordering?: string
  /** 标签 ID 列表（逗号分隔） */
  tags?: string
  /** 联赛系列 ID（用于查询事件） */
  series: string
  /** 创建时间 */
  createdAt?: string
}

export interface GammaMarketFilters {
  active?: boolean
  closed?: boolean
  limit?: number
  offset?: number
  order?: 'asc' | 'desc'
  ascending?: boolean
  id?: string
  slug?: string
  tag?: string
  tag_id?: string
  /** 体育联赛 ID */
  series_id?: string
}

// ============ Order Types ============
export interface CreateLimitOrderParams {
  tokenId: string
  price: number
  size: number
  side: Side
  expiration?: number
  postOnly?: boolean
}

export interface CreateMarketOrderParams {
  tokenId: string
  amount: number
  side: Side
  price?: number
}

export interface OrderResult {
  success: boolean
  orderId?: string
  errorMsg?: string
  status?: string
  transactionHashes?: string[]
}

// ============ Gamma Client ============
class GammaClient {
  private req = axios.create({
    baseURL: 'https://gamma-api.polymarket.com',
  })

  /**
   * 获取所有体育联赛列表
   */
  async getSports(): Promise<GammaSportsSeries[]> {
    const response = await this.req.get('/sports')
    return response.data as GammaSportsSeries[]
  }

  async getEvents(filters: GammaMarketFilters = {}): Promise<GammaEvent[]> {
    const response = await this.req.get('/events', {
      params: filters,
    })
    return response.data as GammaEvent[]
  }

  /**
   * 获取体育赛事事件
   * @param seriesId 联赛系列 ID
   * @param gameOnly 是否只获取比赛事件（排除期货市场）
   */
  async getSportsEvents(seriesId: string, gameOnly = true): Promise<GammaEvent[]> {
    const params: Record<string, string | boolean> = {
      series_id: seriesId,
      active: 'true',
      closed: 'false',
      order: 'startTime',
      ascending: 'true',
    }

    // tag_id=100639 用于过滤至仅比赛事件
    if (gameOnly) {
      params.tag_id = '100639'
    }

    try {
      return await this.getEvents(params as unknown as GammaMarketFilters)
    }
    catch (error) {
      // 记录详细错误信息
      if (axios.isAxiosError(error)) {
        console.error(`[GammaClient] getSportsEvents 失败 - series_id=${seriesId}`, {
          status: error.response?.status,
          data: error.response?.data,
          params,
        })
      }
      throw error
    }
  }

  async getMarkets(filters: GammaMarketFilters = {}): Promise<GammaMarket[]> {
    const response = await this.req.get('/markets', {
      params: filters,
    })
    return response.data as GammaMarket[]
  }

  async getMarket(conditionId: string): Promise<GammaMarket | null> {
    const response = await this.req.get(`/markets/${conditionId}`)
    return response.data as GammaMarket | null
  }

  static instance = new GammaClient()
}

// ============ PM Client Service ============
@Service()
export class PMClientService {
  private client: ClobClient
  private initialized = false
  readonly signer: Wallet

  constructor() {
    this.signer = new Wallet(ENV.PRIVATE_KEY)
    this.client = new ClobClient(
      HOST,
      CHAIN_ID,
      this.signer,
    )
  }

  // ============ Initialization ============
  async init(): Promise<void> {
    if (this.initialized) {
      logger.warn('[PMClientService] Already initialized')
      return
    }

    const builderCreds: BuilderApiKeyCreds = {
      key: ENV.PM_API_KEY,
      secret: ENV.PM_API_SECRET,
      passphrase: ENV.PM_API_PASSPHRASE,
    }

    const builderConfig = new BuilderConfig({
      localBuilderCreds: builderCreds,
    })

    const userCreds = await this.client.createOrDeriveApiKey()

    this.client = new ClobClient(
      HOST,
      CHAIN_ID,
      this.signer,
      userCreds,
      2,
      this.signer.address,
      undefined,
      false,
      builderConfig,
    )

    this.initialized = true
    logger.info('[PMClientService] Initialized successfully')
  }

  get isInitialized(): boolean {
    return this.initialized
  }

  get walletAddress(): string {
    return this.signer.address
  }

  get apiCredentials() {
    return {
      key: ENV.PM_API_KEY,
      secret: ENV.PM_API_SECRET,
      passphrase: ENV.PM_API_PASSPHRASE,
    }
  }

  // ============ Market Data (Public) ============

  /**
   * 获取所有体育联赛列表
   */
  async getSports(): Promise<GammaSportsSeries[]> {
    return GammaClient.instance.getSports()
  }

  /**
   * 获取体育赛事事件
   * @param seriesId 联赛 ID
   * @param gameOnly 是否只获取比赛事件（排除期货市场）
   */
  async getSportsEvents(seriesId: string, gameOnly = true): Promise<GammaEvent[]> {
    return GammaClient.instance.getSportsEvents(seriesId, gameOnly)
  }

  async getEvents(filters: GammaMarketFilters = {}): Promise<GammaEvent[]> {
    return GammaClient.instance.getEvents({
      active: true,
      closed: false,
      ...filters,
    })
  }

  async getMarkets(filters: GammaMarketFilters = {}): Promise<GammaMarket[]> {
    return GammaClient.instance.getMarkets({
      active: true,
      closed: false,
      ...filters,
    })
  }

  async getMarket(conditionId: string): Promise<GammaMarket | null> {
    return GammaClient.instance.getMarket(conditionId)
  }

  async getMarketFromClob(conditionId: string): Promise<unknown> {
    return await this.client.getMarket(conditionId)
  }

  async getOrderBook(tokenId: string): Promise<OrderBookSummary> {
    return await this.client.getOrderBook(tokenId)
  }

  async getOrderBooks(tokenIds: string[]): Promise<OrderBookSummary[]> {
    const params = tokenIds.map(tokenId => ({ token_id: tokenId, side: 'BUY' as Side }))
    return await this.client.getOrderBooks(params)
  }

  async getTickSize(tokenId: string): Promise<TickSize> {
    return await this.client.getTickSize(tokenId)
  }

  async getMidpoint(tokenId: string): Promise<number> {
    const result = await this.client.getMidpoint(tokenId)
    return Number.parseFloat(result.mid)
  }

  async getSpread(tokenId: string): Promise<{ bid: number, ask: number, spread: number }> {
    const result = await this.client.getSpread(tokenId)
    return {
      bid: Number.parseFloat(result.bid),
      ask: Number.parseFloat(result.ask),
      spread: Number.parseFloat(result.spread),
    }
  }

  async getLastTradePrice(tokenId: string): Promise<number> {
    const result = await this.client.getLastTradePrice(tokenId)
    return Number.parseFloat(result.price)
  }

  async getPriceHistory(params: {
    market?: string
    startTs?: number
    endTs?: number
    fidelity?: number
  }): Promise<Array<{ t: number, p: number }>> {
    return await this.client.getPricesHistory(params)
  }

  // ============ Order Management (Authenticated) ============
  async createLimitOrder(params: CreateLimitOrderParams): Promise<OrderResult> {
    this.ensureInitialized()

    const userOrder: UserOrder = {
      tokenID: params.tokenId,
      price: params.price,
      size: params.size,
      side: params.side,
      expiration: params.expiration,
    }

    try {
      const signedOrder = await this.client.createOrder(userOrder)
      const result = await this.client.postOrder(
        signedOrder,
        params.expiration ? OrderType.GTD : OrderType.GTC,
        false,
        params.postOnly,
      )

      logger.info(`[PMClientService] Limit order created: ${JSON.stringify(result)}`)

      return {
        success: result.success ?? true,
        orderId: result.orderID,
        errorMsg: result.errorMsg,
        status: result.status,
        transactionHashes: result.transactionsHashes,
      }
    }
    catch (error) {
      logger.error(`[PMClientService] Failed to create limit order: ${error}`)
      return {
        success: false,
        errorMsg: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async createMarketOrder(params: CreateMarketOrderParams): Promise<OrderResult> {
    this.ensureInitialized()

    const userMarketOrder: UserMarketOrder = {
      tokenID: params.tokenId,
      amount: params.amount,
      side: params.side,
      price: params.price,
      orderType: OrderType.FOK,
    }

    try {
      const signedOrder = await this.client.createMarketOrder(userMarketOrder)
      const result = await this.client.postOrder(signedOrder, OrderType.FOK)

      logger.info(`[PMClientService] Market order created: ${JSON.stringify(result)}`)

      return {
        success: result.success ?? true,
        orderId: result.orderID,
        errorMsg: result.errorMsg,
        status: result.status,
        transactionHashes: result.transactionsHashes,
      }
    }
    catch (error) {
      logger.error(`[PMClientService] Failed to create market order: ${error}`)
      return {
        success: false,
        errorMsg: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async createFillOrKillOrder(params: CreateMarketOrderParams): Promise<OrderResult> {
    return this.createMarketOrder({ ...params })
  }

  async createFillAndKillOrder(params: CreateMarketOrderParams): Promise<OrderResult> {
    this.ensureInitialized()

    const userMarketOrder: UserMarketOrder = {
      tokenID: params.tokenId,
      amount: params.amount,
      side: params.side,
      price: params.price,
      orderType: OrderType.FAK,
    }

    try {
      const signedOrder = await this.client.createMarketOrder(userMarketOrder)
      const result = await this.client.postOrder(signedOrder, OrderType.FAK)

      return {
        success: result.success ?? true,
        orderId: result.orderID,
        errorMsg: result.errorMsg,
        status: result.status,
        transactionHashes: result.transactionsHashes,
      }
    }
    catch (error) {
      logger.error(`[PMClientService] Failed to create FAK order: ${error}`)
      return {
        success: false,
        errorMsg: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // ============ Order Queries ============
  async getOrder(orderId: string): Promise<OpenOrder> {
    this.ensureInitialized()
    return await this.client.getOrder(orderId)
  }

  async getOpenOrders(params?: OpenOrderParams): Promise<OpenOrder[]> {
    this.ensureInitialized()
    return await this.client.getOpenOrders(params)
  }

  async getOpenOrdersByMarket(marketId: string): Promise<OpenOrder[]> {
    return this.getOpenOrders({ market: marketId })
  }

  async getOpenOrdersByToken(tokenId: string): Promise<OpenOrder[]> {
    return this.getOpenOrders({ asset_id: tokenId })
  }

  // ============ Trade History ============
  async getTrades(params?: TradeParams): Promise<Trade[]> {
    this.ensureInitialized()
    return await this.client.getTrades(params)
  }

  async getTradesByMarket(marketId: string): Promise<Trade[]> {
    return this.getTrades({ market: marketId })
  }

  async getTradesAfter(timestamp: string): Promise<Trade[]> {
    return this.getTrades({ after: timestamp })
  }

  // ============ Order Cancellation ============
  async cancelOrder(orderId: string): Promise<boolean> {
    this.ensureInitialized()

    try {
      await this.client.cancelOrder({ orderID: orderId })
      logger.info(`[PMClientService] Order cancelled: ${orderId}`)
      return true
    }
    catch (error) {
      logger.error(`[PMClientService] Failed to cancel order ${orderId}: ${error}`)
      return false
    }
  }

  async cancelOrders(orderIds: string[]): Promise<{ success: string[], failed: string[] }> {
    this.ensureInitialized()

    try {
      await this.client.cancelOrders(orderIds)
      logger.info(`[PMClientService] Orders cancelled: ${orderIds.join(', ')}`)
      return { success: orderIds, failed: [] }
    }
    catch (error) {
      logger.error(`[PMClientService] Failed to cancel orders: ${error}`)
      return { success: [], failed: orderIds }
    }
  }

  async cancelMarketOrders(params: OrderMarketCancelParams): Promise<boolean> {
    this.ensureInitialized()

    try {
      await this.client.cancelMarketOrders(params)
      logger.info(`[PMClientService] Market orders cancelled: ${JSON.stringify(params)}`)
      return true
    }
    catch (error) {
      logger.error(`[PMClientService] Failed to cancel market orders: ${error}`)
      return false
    }
  }

  async cancelAll(): Promise<boolean> {
    this.ensureInitialized()

    try {
      await this.client.cancelAll()
      logger.info('[PMClientService] All orders cancelled')
      return true
    }
    catch (error) {
      logger.error(`[PMClientService] Failed to cancel all orders: ${error}`)
      return false
    }
  }

  // ============ Balance & Allowance ============
  async getBalanceAllowance(params?: BalanceAllowanceParams): Promise<BalanceAllowanceResponse> {
    this.ensureInitialized()
    return await this.client.getBalanceAllowance(params)
  }

  async getCollateralBalance(): Promise<{ balance: string, allowance: string }> {
    return this.getBalanceAllowance({ asset_type: 'COLLATERAL' as AssetType })
  }

  async getTokenBalance(tokenId: string): Promise<{ balance: string, allowance: string }> {
    return this.getBalanceAllowance({
      asset_type: 'CONDITIONAL' as AssetType,
      token_id: tokenId,
    })
  }

  async updateBalanceAllowance(params?: BalanceAllowanceParams): Promise<void> {
    this.ensureInitialized()
    await this.client.updateBalanceAllowance(params)
  }

  // ============ Utility ============
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('PMClientService not initialized. Call init() first.')
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.getOk()
      return true
    }
    catch {
      return false
    }
  }

  async getServerTime(): Promise<number> {
    return await this.client.getServerTime()
  }
}

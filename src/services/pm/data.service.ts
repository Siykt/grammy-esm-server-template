import type { Buffer } from 'node:buffer'
import { EventEmitter } from 'node:events'
import { WebSocket } from 'ws'
import { Service } from '../../common/decorators/service.js'
import logger from '../../common/logger.js'
import { ENV } from '../../constants/env.js'

// ============ WebSocket Types ============

/**
 * WebSocket Authentication
 */
export interface WSAuth {
  apiKey: string
  secret: string
  passphrase: string
}

/**
 * Channel Types
 */
export enum WSChannelType {
  MARKET = 'market',
  USER = 'user',
}

/**
 * Market Channel Message Types
 */
export enum MarketMessageType {
  BOOK = 'book',
  PRICE_CHANGE = 'price_change',
  LAST_TRADE_PRICE = 'last_trade_price',
}

/**
 * User Channel Message Types
 */
export enum UserMessageType {
  ORDER = 'order',
  TRADE = 'trade',
}

/**
 * Subscription Message for CLOB WS
 */
export interface WSSubscribeMessage {
  auth?: WSAuth
  type: WSChannelType
  markets?: string[] // For USER channel - condition IDs
  assets_ids?: string[] // For MARKET channel - token IDs
}

/**
 * Dynamic Subscription Change
 */
export interface WSDynamicSubscription {
  assets_ids?: string[]
  markets?: string[]
  operation: 'subscribe' | 'unsubscribe'
}

/**
 * Order Book Entry
 */
export interface OrderBookEntry {
  price: string
  size: string
}

/**
 * Order Book Data from WS
 */
export interface WSOrderBookData {
  market: string
  asset_id: string
  hash: string
  timestamp: string
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
}

/**
 * Price Change Data from WS
 */
export interface WSPriceChangeData {
  asset_id: string
  price: string
  timestamp: string
}

/**
 * Trade Data from WS
 */
export interface WSTradeData {
  asset_id: string
  price: string
  size: string
  side: 'BUY' | 'SELL'
  timestamp: string
}

/**
 * Order Update from WS
 */
export interface WSOrderUpdate {
  id: string
  status: string
  owner: string
  market: string
  asset_id: string
  side: string
  original_size: string
  size_matched: string
  price: string
  outcome: string
  timestamp: number
}

/**
 * Base WebSocket Message
 */
export interface WSMessage<T = unknown> {
  event_type: string
  data: T
  timestamp: number
}

// Legacy types for backwards compatibility
export interface PMSubscriptionMessage {
  subscriptions: {
    topic: string
    type: string
    filters?: string
    clob_auth?: { key: string, secret: string, passphrase: string }
    gamma_auth?: { address: string }
  }[]
}

export interface PMRealTimeMessage {
  topic: string
  type: string
  timestamp: number
  payload: unknown
  connection_id: string
}

// ============ WebSocket Service ============

@Service()
export class PMRealTimeDataService extends EventEmitter {
  // Use CLOB WebSocket endpoint
  static readonly CLOB_WS_HOST = 'wss://ws-subscriptions-clob.polymarket.com/ws/'

  // Legacy host for backwards compatibility
  static readonly DEFAULT_HOST = 'wss://ws-live-data.polymarket.com'

  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private pingInterval: NodeJS.Timeout | null = null
  private subscribedMarketAssets: Set<string> = new Set()
  private subscribedUserMarkets: Set<string> = new Set()
  private isConnected = false

  constructor() {
    super()
  }

  // ============ Connection Management ============

  /**
   * Connect to the CLOB WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        logger.info('[PMRealTimeDataService] Already connected')
        resolve()
        return
      }

      this.ws = new WebSocket(PMRealTimeDataService.CLOB_WS_HOST)

      this.ws.on('open', () => {
        this.isConnected = true
        this.reconnectAttempts = 0
        this.startPingInterval()
        this.emit('open')
        logger.info('[PMRealTimeDataService] Connected to CLOB WebSocket')
        resolve()
      })

      this.ws.on('message', (data: Buffer | string) => {
        this.handleMessage(data)
      })

      this.ws.on('close', () => {
        this.isConnected = false
        this.stopPingInterval()
        this.emit('close')
        logger.info('[PMRealTimeDataService] Disconnected from WebSocket')
        this.attemptReconnect()
      })

      this.ws.on('error', (error) => {
        logger.error('[PMRealTimeDataService] WebSocket error', error)
        this.emit('error', error)
        reject(error)
      })

      this.ws.on('pong', () => {
        logger.debug('[PMRealTimeDataService] Pong received')
      })
    })
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.stopPingInterval()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
    this.subscribedMarketAssets.clear()
    this.subscribedUserMarkets.clear()
    logger.info('[PMRealTimeDataService] Disconnected')
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN
  }

  // ============ Subscription Methods ============

  /**
   * Subscribe to MARKET channel (orderbook and price updates)
   */
  subscribeMarket(assetIds: string[]): void {
    if (!this.connected) {
      logger.warn('[PMRealTimeDataService] Cannot subscribe: not connected')
      return
    }

    const message: WSSubscribeMessage = {
      type: WSChannelType.MARKET,
      assets_ids: assetIds,
    }

    this.sendMessage(message)
    assetIds.forEach(id => this.subscribedMarketAssets.add(id))
    logger.info(`[PMRealTimeDataService] Subscribed to MARKET channel: ${assetIds.join(', ')}`)
  }

  /**
   * Unsubscribe from MARKET channel
   */
  unsubscribeMarket(assetIds: string[]): void {
    if (!this.connected)
      return

    const message: WSDynamicSubscription = {
      assets_ids: assetIds,
      operation: 'unsubscribe',
    }

    this.sendMessage(message)
    assetIds.forEach(id => this.subscribedMarketAssets.delete(id))
    logger.info(`[PMRealTimeDataService] Unsubscribed from MARKET: ${assetIds.join(', ')}`)
  }

  /**
   * Subscribe to USER channel (order and trade updates)
   * Requires authentication
   */
  subscribeUser(marketIds: string[] = []): void {
    if (!this.connected) {
      logger.warn('[PMRealTimeDataService] Cannot subscribe: not connected')
      return
    }

    const message: WSSubscribeMessage = {
      auth: this.getAuth(),
      type: WSChannelType.USER,
      markets: marketIds,
    }

    this.sendMessage(message)
    marketIds.forEach(id => this.subscribedUserMarkets.add(id))
    logger.info(`[PMRealTimeDataService] Subscribed to USER channel: ${marketIds.length} markets`)
  }

  /**
   * Unsubscribe from USER channel
   */
  unsubscribeUser(marketIds?: string[]): void {
    if (!this.connected)
      return

    const message: WSDynamicSubscription = {
      markets: marketIds,
      operation: 'unsubscribe',
    }

    this.sendMessage(message)
    if (marketIds) {
      marketIds.forEach(id => this.subscribedUserMarkets.delete(id))
    }
    else {
      this.subscribedUserMarkets.clear()
    }
    logger.info('[PMRealTimeDataService] Unsubscribed from USER channel')
  }

  /**
   * Add assets to existing MARKET subscription
   */
  addMarketAssets(assetIds: string[]): void {
    if (!this.connected)
      return

    const newAssets = assetIds.filter(id => !this.subscribedMarketAssets.has(id))
    if (newAssets.length === 0)
      return

    const message: WSDynamicSubscription = {
      assets_ids: newAssets,
      operation: 'subscribe',
    }

    this.sendMessage(message)
    newAssets.forEach(id => this.subscribedMarketAssets.add(id))
  }

  /**
   * Add markets to existing USER subscription
   */
  addUserMarkets(marketIds: string[]): void {
    if (!this.connected)
      return

    const newMarkets = marketIds.filter(id => !this.subscribedUserMarkets.has(id))
    if (newMarkets.length === 0)
      return

    const message: WSDynamicSubscription = {
      markets: newMarkets,
      operation: 'subscribe',
    }

    this.sendMessage(message)
    newMarkets.forEach(id => this.subscribedUserMarkets.add(id))
  }

  // ============ Event Listeners ============

  /**
   * Listen for orderbook updates
   */
  onOrderBook(callback: (data: WSOrderBookData) => void): () => void {
    const handler = (msg: WSMessage<WSOrderBookData>) => {
      if (msg.event_type === MarketMessageType.BOOK) {
        callback(msg.data)
      }
    }
    this.on('market_message', handler)
    return () => this.off('market_message', handler)
  }

  /**
   * Listen for price changes
   */
  onPriceChange(callback: (data: WSPriceChangeData) => void): () => void {
    const handler = (msg: WSMessage<WSPriceChangeData>) => {
      if (msg.event_type === MarketMessageType.PRICE_CHANGE) {
        callback(msg.data)
      }
    }
    this.on('market_message', handler)
    return () => this.off('market_message', handler)
  }

  /**
   * Listen for order updates
   */
  onOrderUpdate(callback: (data: WSOrderUpdate) => void): () => void {
    const handler = (msg: WSMessage<WSOrderUpdate>) => {
      if (msg.event_type === UserMessageType.ORDER) {
        callback(msg.data)
      }
    }
    this.on('user_message', handler)
    return () => this.off('user_message', handler)
  }

  /**
   * Listen for trade updates
   */
  onTrade(callback: (data: WSTradeData) => void): () => void {
    const handler = (msg: WSMessage<WSTradeData>) => {
      if (msg.event_type === UserMessageType.TRADE) {
        callback(msg.data)
      }
    }
    this.on('user_message', handler)
    return () => this.off('user_message', handler)
  }

  /**
   * Generic message listener (legacy compatibility)
   */
  onMessage(callback: (message: PMRealTimeMessage) => void): () => void {
    this.on('message', callback)
    return () => this.off('message', callback)
  }

  // Legacy methods for backwards compatibility
  subscribe(msg: PMSubscriptionMessage): void {
    if (!this.connected) {
      logger.warn('[PMRealTimeDataService] Cannot subscribe: not connected')
      return
    }
    this.sendMessage({ action: 'subscribe', ...msg })
    logger.info('[PMRealTimeDataService] Legacy subscribe sent')
  }

  unsubscribe(msg: PMSubscriptionMessage): void {
    if (!this.connected)
      return
    this.sendMessage({ action: 'unsubscribe', ...msg })
    logger.info('[PMRealTimeDataService] Legacy unsubscribe sent')
  }

  // ============ Private Methods ============

  private handleMessage(data: Buffer | string): void {
    try {
      const message = typeof data === 'string' ? data : data.toString()

      // Handle ping/pong
      if (message === 'pong') {
        return
      }

      const parsed = JSON.parse(message)

      // Emit typed events based on message type
      if (parsed.event_type) {
        const eventType = parsed.event_type as string
        if (Object.values(MarketMessageType).includes(eventType as MarketMessageType)) {
          this.emit('market_message', parsed)
        }
        else if (Object.values(UserMessageType).includes(eventType as UserMessageType)) {
          this.emit('user_message', parsed)
        }
      }

      // Legacy event emission
      if (parsed.payload || parsed.data) {
        this.emit('message', {
          topic: parsed.topic ?? parsed.event_type ?? 'unknown',
          type: parsed.type ?? parsed.event_type ?? 'unknown',
          timestamp: parsed.timestamp ?? Date.now(),
          payload: parsed.payload ?? parsed.data,
          connection_id: parsed.connection_id ?? '',
        } as PMRealTimeMessage)
      }

      // Raw message event
      this.emit('raw_message', parsed)
    }
    catch (error) {
      logger.error('[PMRealTimeDataService] Failed to parse message', error)
    }
  }

  private sendMessage(message: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.warn('[PMRealTimeDataService] Cannot send: socket not open')
      return
    }

    const payload = JSON.stringify(message)
    this.ws.send(payload, (err) => {
      if (err) {
        logger.error('[PMRealTimeDataService] Send error', err)
      }
    })
  }

  private getAuth(): WSAuth {
    return {
      apiKey: ENV.PM_API_KEY,
      secret: ENV.PM_API_SECRET,
      passphrase: ENV.PM_API_PASSPHRASE,
    }
  }

  private startPingInterval(): void {
    this.stopPingInterval()
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping()
      }
    }, 30000) // Ping every 30 seconds
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('[PMRealTimeDataService] Max reconnect attempts reached')
      this.emit('reconnect_failed')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * 2 ** (this.reconnectAttempts - 1)

    logger.info(`[PMRealTimeDataService] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(async () => {
      try {
        await this.connect()
        // Resubscribe to previous subscriptions
        if (this.subscribedMarketAssets.size > 0) {
          this.subscribeMarket(Array.from(this.subscribedMarketAssets))
        }
        if (this.subscribedUserMarkets.size > 0) {
          this.subscribeUser(Array.from(this.subscribedUserMarkets))
        }
        this.emit('reconnected')
      }
      catch (error) {
        logger.error('[PMRealTimeDataService] Reconnect failed', error)
      }
    }, delay)
  }

  // ============ Utility Methods ============

  /**
   * Get currently subscribed market assets
   */
  getSubscribedMarketAssets(): string[] {
    return Array.from(this.subscribedMarketAssets)
  }

  /**
   * Get currently subscribed user markets
   */
  getSubscribedUserMarkets(): string[] {
    return Array.from(this.subscribedUserMarkets)
  }

  /**
   * Get subscription status
   */
  getStatus() {
    return {
      connected: this.connected,
      marketAssetsCount: this.subscribedMarketAssets.size,
      userMarketsCount: this.subscribedUserMarkets.size,
      reconnectAttempts: this.reconnectAttempts,
    }
  }
}

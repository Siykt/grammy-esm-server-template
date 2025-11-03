// 通用的（可多频道/多路由）WebSocket 订阅适配器

// WebSocket readyState：0 CONNECTING, 1 OPEN
const WS_CONNECTING = 0
const WS_OPEN = 1

interface WsLike {
  readyState: number
  send: (data: string) => void
  close: () => void
  ping: () => void
  on: (event: 'open' | 'message' | 'error' | 'close' | 'pong', listener: (...args: unknown[]) => void) => void
  removeAllListeners: () => void
}

export interface PublicWsConfig {
  wsUrl: string
  // 心跳/重连策略
  pingIntervalMs?: number // 默认 20s
  pongTimeoutMs?: number // 默认 60s
  reconnectDelayMs?: number // 默认 2s
}

export interface PublicWsRoute<T = unknown> {
  id: string
  // 构建订阅/退订消息
  buildSubscribe: (topicKey: string) => unknown
  buildUnsubscribe: (topicKey: string) => unknown
  // 解析服务端消息，返回当前路由下的事件；返回 null 表示与该路由无关
  parseMessage: (msg: unknown) => Array<{ topicKey: string, payload: T }> | null
}

export class ExchangePublicSubscribeAdapter<T = unknown> {
  private readonly wsUrl: string
  private readonly pingIntervalMs: number
  private readonly pongTimeoutMs: number
  private readonly reconnectDelayMs: number

  private ws?: WsLike
  private isConnecting = false
  private reconnectTimer?: NodeJS.Timeout
  private pingTimer?: NodeJS.Timeout
  private lastPongAt = 0
  private readonly topicToListeners = new Map<string, Set<(payload: T) => void>>()
  private readonly routes = new Map<string, PublicWsRoute<T>>()
  private readonly routeToTopics = new Map<string, Set<string>>()

  constructor(config: PublicWsConfig) {
    this.wsUrl = config.wsUrl
    this.pingIntervalMs = config.pingIntervalMs ?? 20_000
    this.pongTimeoutMs = config.pongTimeoutMs ?? 60_000
    this.reconnectDelayMs = config.reconnectDelayMs ?? 2_000
  }

  subscribeWith(route: PublicWsRoute<T>, topicKey: string, onUpdate: (payload: T) => void): () => void {
    if (!this.routes.has(route.id))
      this.routes.set(route.id, route)
    let topics = this.routeToTopics.get(route.id)
    if (!topics) {
      topics = new Set<string>()
      this.routeToTopics.set(route.id, topics)
    }
    topics.add(topicKey)

    const compositeKey = `${route.id}|${topicKey}`
    let set = this.topicToListeners.get(compositeKey)
    if (!set) {
      set = new Set()
      this.topicToListeners.set(compositeKey, set)
    }
    set.add(onUpdate)

    this.ensureWsConnected()
    if (this.ws && this.ws.readyState === WS_OPEN)
      this.wsSend(route.buildSubscribe(topicKey))

    return () => {
      const listeners = this.topicToListeners.get(compositeKey)
      if (!listeners)
        return
      listeners.delete(onUpdate)
      if (listeners.size === 0) {
        this.topicToListeners.delete(compositeKey)
        const t = this.routeToTopics.get(route.id)
        if (t) {
          t.delete(topicKey)
          if (this.ws && this.ws.readyState === WS_OPEN)
            this.wsSend(route.buildUnsubscribe(topicKey))
        }
      }
    }
  }

  private ensureWsConnected(): void {
    if (this.ws && (this.ws.readyState === WS_OPEN || this.ws.readyState === WS_CONNECTING))
      return
    if (this.isConnecting)
      return
    this.connectWs().catch(() => {})
  }

  private async connectWs(): Promise<void> {
    this.isConnecting = true
    clearTimeout(this.reconnectTimer)
    if (this.pingTimer)
      clearInterval(this.pingTimer)

    // @ts-expect-error: 动态引入在运行时解析
    const mod = await import('ws')
    const WsCtor = mod.default as unknown as new (url: string) => WsLike
    const ws = new WsCtor(this.wsUrl)
    this.ws = ws

    ws.on('open', () => {
      this.isConnecting = false
      this.lastPongAt = Date.now()
      for (const [routeId, topics] of this.routeToTopics.entries()) {
        const route = this.routes.get(routeId)
        if (!route || topics.size === 0)
          continue
        for (const topicKey of topics)
          this.wsSend(route.buildSubscribe(topicKey))
      }
      this.pingTimer = setInterval(() => {
        if (!this.ws || this.ws.readyState !== WS_OPEN)
          return
        try {
          this.ws.ping()
        }
        catch {
        }
        const now = Date.now()
        if (this.lastPongAt && now - this.lastPongAt > this.pongTimeoutMs)
          this.scheduleReconnect()
      }, this.pingIntervalMs)
    })

    ws.on('pong', () => {
      this.lastPongAt = Date.now()
    })

    ws.on('message', (buf: unknown) => {
      try {
        let text: string
        if (typeof buf === 'string')
          text = buf
        else if (buf instanceof Uint8Array)
          text = new TextDecoder().decode(buf)
        else
          text = String(buf)
        const msg = JSON.parse(text)
        for (const [routeId, route] of this.routes.entries()) {
          const routed = route.parseMessage(msg)
          if (!routed || routed.length === 0)
            continue
          for (const { topicKey, payload } of routed) {
            const compositeKey = `${routeId}|${topicKey}`
            const listeners = this.topicToListeners.get(compositeKey)
            if (listeners && listeners.size > 0) {
              for (const fn of listeners)
                fn(payload)
            }
          }
        }
      }
      catch {
      }
    })

    ws.on('error', () => {
      this.scheduleReconnect()
    })

    ws.on('close', () => {
      this.scheduleReconnect()
    })
  }

  private wsSend(payload: unknown): void {
    try {
      this.ws?.send(JSON.stringify(payload))
    }
    catch {
    }
  }

  private scheduleReconnect(): void {
    if (this.isConnecting)
      return
    try {
      this.ws?.removeAllListeners()
      this.ws?.close()
    }
    catch {
    }
    this.ws = undefined
    this.isConnecting = false
    if (this.pingTimer)
      clearInterval(this.pingTimer)
    clearTimeout(this.reconnectTimer)
    this.reconnectTimer = setTimeout(() => {
      this.connectWs().catch(() => {})
    }, this.reconnectDelayMs)
  }
}

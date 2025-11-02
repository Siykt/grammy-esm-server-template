// 基础类型与接口定义，用于多 CEX 资金费率套利场景

export type ExchangeId = 'binance' | 'okx' | 'bybit' | (string & {})

export type SymbolPair = string

export type OrderSide = 'buy' | 'sell'

export type OrderType = 'limit' | 'market'

export type TimeInForce = 'GTC' | 'IOC' | 'FOK'

export interface FundingRate {
  symbol: SymbolPair
  /** 资金费率（十进制，例如 0.0001 表示 0.01%） */
  rate: number
  /** 当前资金费率的时间戳（毫秒） */
  timestamp: number
  /** 下次资金费率结算时间（毫秒） */
  nextFundingTime?: number
}

export interface PlaceOrderParams {
  symbol: SymbolPair
  side: OrderSide
  type: OrderType
  /** 下单数量（合约张数或币的数量，依交易所而定） */
  amount: number
  /** 限价单价格（市价单可省略） */
  price?: number
  timeInForce?: TimeInForce
  /** 仅减仓（合约交易） */
  reduceOnly?: boolean
  /** 客户端自定义订单 ID */
  clientOrderId?: string
}

export type OrderStatus = 'new' | 'partially_filled' | 'filled' | 'canceled' | 'rejected'

export interface Order {
  id: string
  symbol: SymbolPair
  side: OrderSide
  type: OrderType
  price?: number
  amount: number
  filled: number
  remaining: number
  status: OrderStatus
  timestamp: number
}

export interface TickerPrices {
  /** 标记价格（Mark Price） */
  markPrice: number
  /** 指数价格（Index Price） */
  indexPrice: number
}

import type { ExchangeService } from './exchange.service.js'
import { BinanceAdapter } from './binance.adapter.js'
import { BitgetAdapter } from './bitget.adapter.js'
import { BybitAdapter } from './bybit.adapter.js'
import { KucoinAdapter } from './kucoin.adapter.js'
import { MexcAdapter } from './mexc.adapter.js'
import { OkxAdapter } from './okx.adapter.js'

export function registerDefaultExchangeAdapters(exchangeService: ExchangeService): void {
  exchangeService.registerAdapter(new BinanceAdapter())
  exchangeService.registerAdapter(new OkxAdapter())
  exchangeService.registerAdapter(new BybitAdapter())
  exchangeService.registerAdapter(new MexcAdapter())
  exchangeService.registerAdapter(new KucoinAdapter())
  exchangeService.registerAdapter(new BitgetAdapter())
}

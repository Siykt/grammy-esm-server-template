import type { ExchangeService } from './exchange.service.js'
import { BinanceAdapter } from './adapters/binance.adapter.js'
import { BitgetAdapter } from './adapters/bitget.adapter.js'
import { BybitAdapter } from './adapters/bybit.adapter.js'
// import { KucoinAdapter } from './adapters/kucoin.adapter.js'
// import { MexcAdapter } from './adapters/mexc.adapter.js'
import { OkxAdapter } from './adapters/okx.adapter.js'

export function registerDefaultExchangeAdapters(exchangeService: ExchangeService): void {
  exchangeService.registerAdapter(new BinanceAdapter())
  exchangeService.registerAdapter(new OkxAdapter())
  exchangeService.registerAdapter(new BybitAdapter())
  // exchangeService.registerAdapter(new MexcAdapter())
  // exchangeService.registerAdapter(new KucoinAdapter())
  exchangeService.registerAdapter(new BitgetAdapter())
}

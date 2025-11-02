import { dirname } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import logger from './common/logger.js'
import { registerDefaultExchangeAdapters } from './services/exchange/exchanges.bootstrap.js'
import { exchangeMonitorService, exchangeService, tgBotService } from './services/index.js'
import 'reflect-metadata'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

globalThis.__dirname = __dirname
globalThis.__filename = __filename

async function bootstrap() {
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection at:', reason)
  })

  // 注册默认交易所适配器
  registerDefaultExchangeAdapters(exchangeService)

  // 启动监控
  exchangeMonitorService.start()

  tgBotService.run()
  logger.info('Bot started')
}

bootstrap()

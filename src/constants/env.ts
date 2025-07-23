import process from 'node:process'
import { config } from 'dotenv'

let appHost = process.env.APP_HOST ?? 'http://127.0.0.1'

if (!appHost.startsWith('http')) {
  appHost = `https://${appHost}`
}

config()

export const ENV = {
  // app
  APP_NAME: process.env.APP_NAME ?? 'telegram-esm-server-template',
  APP_HOST: appHost,
  APP_PORT: +(process.env.APP_PORT ?? 10001),
  FILE_UPLOAD_SIZE: +(process.env.FILE_UPLOAD_SIZE ?? 10000000),

  // redis
  REDIS_PORT: +(process.env.REDIS_PORT ?? 6379),
  REDIS_HOST: process.env.REDIS_HOST ?? '127.0.0.1',
  REDIS_PASSWORD: process.env.REDIS_PASSWORD ?? '',

  // logger
  LOGGER_DIR_PATH: process.env.LOGGER_DIR_PATH ?? './',

  // Telegram
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ?? '',
  TELEGRAM_USE_WEBHOOK: process.env.TELEGRAM_USE_WEBHOOK === 'true',
  TELEGRAM_POLLING_INTERVAL: Number.parseInt(process.env.TELEGRAM_POLLING_INTERVAL ?? '5000', 10),

  // server auth
  SERVER_AUTH_PASSWORD: process.env.SERVER_AUTH_PASSWORD ?? '',
  API_USER_AUTH_PASSWORD: process.env.API_USER_AUTH_PASSWORD ?? '',
}

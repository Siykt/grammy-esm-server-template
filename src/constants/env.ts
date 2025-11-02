import process from 'node:process'
import { config } from 'dotenv'

let appHost = process.env.APP_HOST ?? 'http://127.0.0.1'

if (!appHost.startsWith('http')) {
  appHost = `https://${appHost}`
}

config()

export const ENV = {
  // logger
  LOGGER_DIR_PATH: process.env.LOGGER_DIR_PATH ?? './',

  // Telegram
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ?? '',
  TELEGRAM_USE_WEBHOOK: process.env.TELEGRAM_USE_WEBHOOK === 'true',

  // Ton
  TON_CENTER_API_KEY: process.env.TON_CENTER_API_KEY ?? '',
  TON_WALLETS_APP_MANIFEST_URL: process.env.TON_WALLETS_APP_MANIFEST_URL ?? '',

  // Socks proxy
  SOCKS_PROXY_HOST: process.env.SOCKS_PROXY_HOST ?? '',
  SOCKS_PROXY_PORT: process.env.SOCKS_PROXY_PORT ?? '',

  // Server
  SERVER_AUTH_PASSWORD: process.env.SERVER_AUTH_PASSWORD ?? '',

  // Admins (comma separated telegram ids)
  ADMIN_TG_IDS: (process.env.ADMIN_TG_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean),
}

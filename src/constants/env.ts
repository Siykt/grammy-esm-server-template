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
  TELEGRAM_ADMIN_CHAT_ID: process.env.TELEGRAM_ADMIN_CHAT_ID ?? '',

  // Ton
  TON_CENTER_API_KEY: process.env.TON_CENTER_API_KEY ?? '',
  TON_WALLETS_APP_MANIFEST_URL: process.env.TON_WALLETS_APP_MANIFEST_URL ?? '',

  // Socks proxy
  SOCKS_PROXY_HOST: process.env.SOCKS_PROXY_HOST ?? '',
  SOCKS_PROXY_PORT: process.env.SOCKS_PROXY_PORT ?? '',

  // Polymarket
  PRIVATE_KEY: process.env.PRIVATE_KEY ?? '',
  PM_API_KEY: process.env.PM_API_KEY ?? '',
  PM_API_SECRET: process.env.PM_API_SECRET ?? '',
  PM_API_PASSPHRASE: process.env.PM_API_PASSPHRASE ?? '',

  // The Odds API（支持多个 key，用逗号分隔）
  ODDS_API_KEYS: (process.env.ODDS_API_KEYS ?? process.env.ODDS_API_KEY ?? '')
    .split(',')
    .map(key => key.trim())
    .filter(Boolean),
}

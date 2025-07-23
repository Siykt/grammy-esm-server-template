import process from 'node:process'

export function isDev() {
  return process.env.NODE_ENV !== 'production'
}

export function isProd() {
  return process.env.NODE_ENV === 'production'
}

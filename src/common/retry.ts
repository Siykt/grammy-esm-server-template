import logger from './logger.js'

/** 瞬态错误码，遇到这些错误时应该重试 */
const TRANSIENT_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EPIPE',
  'EAI_AGAIN',
  'UND_ERR_SOCKET',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
])

/** 瞬态错误消息关键词 */
const TRANSIENT_ERROR_MESSAGES = [
  'socket hang up',
  'socket disconnected',
  'network error',
  'fetch failed',
  'aborted',
  'EHOSTUNREACH',
]

export interface RetryOptions {
  /** 最大重试次数（不含首次调用），默认 3 */
  maxRetries?: number
  /** 基础延迟（毫秒），默认 1000 */
  baseDelay?: number
  /** 最大延迟（毫秒），默认 10000 */
  maxDelay?: number
  /** 操作描述，用于日志 */
  label?: string
  /** 自定义判断是否应该重试 */
  shouldRetry?: (error: unknown) => boolean
}

/**
 * 判断错误是否为瞬态网络错误
 */
export function isTransientError(error: unknown): boolean {
  if (!(error instanceof Error))
    return false

  // 检查错误码
  const code = (error as NodeJS.ErrnoException).code
  if (code && TRANSIENT_ERROR_CODES.has(code))
    return true

  // 检查错误消息
  const msg = error.message.toLowerCase()
  if (TRANSIENT_ERROR_MESSAGES.some(keyword => msg.includes(keyword)))
    return true

  // 检查 axios 错误
  if ('isAxiosError' in error && (error as { isAxiosError: boolean }).isAxiosError) {
    const status = (error as { response?: { status?: number } }).response?.status
    // 5xx 服务端错误和 429 限流可重试
    if (status && (status >= 500 || status === 429))
      return true
    // 无响应的 axios 错误（网络层失败）
    if (!status)
      return true
  }

  // 检查 cause 链
  if (error.cause)
    return isTransientError(error.cause)

  return false
}

/**
 * 带指数退避的重试包装器
 *
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => client.getOrderBook(tokenId),
 *   { label: 'getOrderBook', maxRetries: 3 }
 * )
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    label = 'operation',
    shouldRetry = isTransientError,
  } = opts

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    }
    catch (error) {
      lastError = error

      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error
      }

      // 指数退避 + 随机抖动
      const delay = Math.min(baseDelay * 2 ** attempt, maxDelay)
      const jitter = delay * (0.5 + Math.random() * 0.5)

      logger.warn(
        `[Retry] ${label} 第 ${attempt + 1}/${maxRetries} 次重试，`
        + `${Math.round(jitter)}ms 后重试。`
        + `错误: ${error instanceof Error ? error.message : String(error)}`,
      )

      await sleep(jitter)
    }
  }

  throw lastError
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

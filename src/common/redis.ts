import { pTimeout } from '@atp-tools/lib'
import { Redis } from 'ioredis'
import _ from 'lodash'
import { nanoid } from 'nanoid'
import { ENV } from '../constants/env.js'

const redis = new Redis(+(ENV.REDIS_PORT ?? '6379'), ENV.REDIS_HOST, { password: ENV.REDIS_PASSWORD })
const redisPublisher = new Redis(+(ENV.REDIS_PORT ?? '6379'), ENV.REDIS_HOST, { password: ENV.REDIS_PASSWORD })
const redisSubscriber = new Redis(+(ENV.REDIS_PORT ?? '6379'), ENV.REDIS_HOST, { password: ENV.REDIS_PASSWORD })

export { redis, redisPublisher, redisSubscriber }

const PREFIX = _.snakeCase(ENV.APP_NAME)
function autoAddPrefixKey<F extends (...args: ExpectedAnyData[]) => ExpectedAnyData>(func: F) {
  return (...args: Parameters<F>) => `${PREFIX}:${func(...args)}`
}

export const RedisKeys = {
  scanKeys: autoAddPrefixKey(scanKeys),
}

export class RedisAsyncLock {
  private identifier = nanoid(32)
  private released = true

  constructor(private key: string, private ttl = 30000) { }

  async acquire(retryInterval = 100, maxRetries = 30) {
    let attempts = 0
    while (attempts < maxRetries) {
      const result = await redis.set(
        this.key,
        this.identifier,
        'PX',
        this.ttl,
        'NX',
      )

      if (result === 'OK') {
        this.released = false
        return true
      }

      await new Promise(resolve => setTimeout(resolve, retryInterval))
      attempts++
    }
    throw new Error(`Failed to acquire lock for key: ${this.key} after ${maxRetries} attempts`)
  }

  async release() {
    if (this.released)
      return

    // use lua script to release the lock atomically
    const result = await redis.eval(
      `if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
      else
        return 0
      end`,
      1,
      this.key,
      this.identifier,
    )

    if (result !== 1) {
      throw new Error(`Failed to release lock for key: ${this.key}`)
    }

    this.released = true
  }

  get isReleased() {
    return this.released
  }

  async execute<T>(fn: () => Promise<T>) {
    try {
      await this.acquire()
      return await fn()
    }
    finally {
      await this.release()
    }
  }
}

export async function scanKeys(pattern: string, options?: {
  maxKeys?: number
  timeout?: number
  scanTimeout?: number
  batchCallback?: (keys: string[]) => void | Promise<void>
}) {
  const { maxKeys = 10000, timeout = 30000, scanTimeout = 5000, batchCallback } = options || {}
  const keys: string[] = []
  let cursor = '0'
  let totalScanned = 0

  const startTime = Date.now()

  do {
    // 检查总体超时
    if (Date.now() - startTime > timeout) {
      throw new Error(`scanKeys timeout: ${timeout}ms, scanned ${totalScanned} keys`)
    }

    // 检查最大键数量限制
    if (keys.length >= maxKeys) {
      console.warn(`scanKeys maxKeys: ${maxKeys}, stop scanning`)
      break
    }

    try {
      // 给每个 scan 操作添加独立的超时
      const result = await pTimeout(redis.scan(cursor, 'MATCH', pattern, 'COUNT', 1000), scanTimeout)
      cursor = result[0]
      const batchKeys = result[1]

      // 如果有批处理回调，先处理批量键
      if (batchCallback && batchKeys.length > 0) {
        await batchCallback(batchKeys)
      }

      keys.push(...batchKeys)
      totalScanned += batchKeys.length

      // 添加小延迟避免占用过多 CPU
      if (batchKeys.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1))
      }
    }
    catch (error) {
      throw new Error(`scanKeys Redis error: ${error}`)
    }
  } while (cursor !== '0')

  return keys
}

// 流式扫描版本，适合处理大量数据，不会在内存中积累所有键
export async function* scanKeysStream(pattern: string, options?: {
  timeout?: number
  scanTimeout?: number
  batchSize?: number
}) {
  const { timeout = 30000, scanTimeout = 5000, batchSize = 1000 } = options || {}
  let cursor = '0'
  let totalScanned = 0

  const startTime = Date.now()

  do {
    // 检查总体超时
    if (Date.now() - startTime > timeout) {
      throw new Error(`scanKeysStream timeout: ${timeout}ms, scanned ${totalScanned} keys`)
    }

    try {
      // 给每个 scan 操作添加独立的超时
      const result = await pTimeout(redis.scan(cursor, 'MATCH', pattern, 'COUNT', batchSize), scanTimeout)
      cursor = result[0]
      const batchKeys = result[1]

      if (batchKeys.length > 0) {
        totalScanned += batchKeys.length
        yield batchKeys

        // 添加小延迟避免占用过多 CPU
        await new Promise(resolve => setTimeout(resolve, 1))
      }
    }
    catch (error) {
      throw new Error(`scanKeysStream Redis error: ${error}`)
    }
  } while (cursor !== '0')
}

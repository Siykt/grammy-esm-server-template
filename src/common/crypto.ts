import { Buffer } from 'node:buffer'
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'
import { ENV } from '../constants/env.js'

const ALGO = 'aes-256-gcm'
const SALT_BYTES = 16
const IV_BYTES = 12
const AUTH_TAG_BYTES = 16

function getKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, 32)
}

export function encryptWithPassword(plaintext: string): string {
  const password = ENV.SERVER_AUTH_PASSWORD
  if (!password)
    throw new Error('SERVER_AUTH_PASSWORD 未设置')

  const salt = randomBytes(SALT_BYTES)
  const iv = randomBytes(IV_BYTES)
  const key = getKey(password, salt)

  const cipher = createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  const packed = Buffer.concat([salt, iv, authTag, enc])
  return packed.toString('base64')
}

export function decryptWithPassword(ciphertextB64: string): string {
  const password = ENV.SERVER_AUTH_PASSWORD
  if (!password)
    throw new Error('SERVER_AUTH_PASSWORD 未设置')

  const packed = Buffer.from(ciphertextB64, 'base64')
  const salt = packed.subarray(0, SALT_BYTES)
  const iv = packed.subarray(SALT_BYTES, SALT_BYTES + IV_BYTES)
  const authTag = packed.subarray(SALT_BYTES + IV_BYTES, SALT_BYTES + IV_BYTES + AUTH_TAG_BYTES)
  const enc = packed.subarray(SALT_BYTES + IV_BYTES + AUTH_TAG_BYTES)
  const key = getKey(password, salt)

  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(authTag)
  const dec = Buffer.concat([decipher.update(enc), decipher.final()])
  return dec.toString('utf8')
}

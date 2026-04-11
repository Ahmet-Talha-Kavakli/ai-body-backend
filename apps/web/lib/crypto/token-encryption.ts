/**
 * AES-256-GCM encryption for sensitive tokens stored in the database.
 * Requires TOKEN_ENCRYPTION_KEY env var (32-byte hex string = 64 hex chars).
 *
 * Generate a key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const keyHex = process.env.TOKEN_ENCRYPTION_KEY
  if (!keyHex) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('TOKEN_ENCRYPTION_KEY environment variable is required in production')
    }
    // Dev fallback — NOT for production
    console.warn('[crypto] WARNING: TOKEN_ENCRYPTION_KEY not set, using insecure dev key')
    return Buffer.from('0'.repeat(64), 'hex')
  }
  if (keyHex.length !== 64) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
  }
  return Buffer.from(keyHex, 'hex')
}

/**
 * Encrypts a plaintext string.
 * Returns: `iv:authTag:ciphertext` (all hex-encoded), colon-separated.
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':')
}

/**
 * Decrypts a token previously encrypted with encryptToken.
 */
export function decryptToken(encryptedData: string): string {
  const key = getEncryptionKey()
  const parts = encryptedData.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format')
  }

  const [ivHex, authTagHex, ciphertextHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const ciphertext = Buffer.from(ciphertextHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

/**
 * Safely decrypts a token that might be stored as plaintext (migration helper).
 * Returns plaintext if decryption fails (for backwards compat during migration).
 */
export function safeDecryptToken(tokenValue: string | null | undefined): string | null {
  if (!tokenValue) return null
  // If it looks like our encrypted format (contains colons), try decrypting
  if (tokenValue.includes(':')) {
    try {
      return decryptToken(tokenValue)
    } catch {
      // Fall through — might be a plaintext legacy token
    }
  }
  return tokenValue
}

/**
 * Runtime environment variable validation.
 * Throws on startup if critical vars are missing in production.
 */

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    const msg = `Missing required environment variable: ${key}`
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg)
    }
    console.warn(`[env] WARNING: ${msg}`)
    return ''
  }
  return value
}

/**
 * Validates that CRON_SECRET is set and returns it.
 * Used at the top of every cron handler.
 */
export function getCronSecret(): string {
  return requireEnv('CRON_SECRET')
}

/**
 * Validates a cron request Authorization header.
 * Returns true if valid, false otherwise.
 */
export function isValidCronRequest(authHeader: string | null): boolean {
  const secret = getCronSecret()
  if (!secret) return false // production: secret required
  return authHeader === `Bearer ${secret}`
}

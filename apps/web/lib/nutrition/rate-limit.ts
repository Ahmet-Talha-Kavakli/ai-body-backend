/**
 * In-memory rate limiter for API endpoints
 * Redis'i taşıyabiliriz ama şu için in-memory yeterli
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const limiters = new Map<string, RateLimitEntry>()

/**
 * Check rate limit for a user/IP
 * @param key Unique identifier (e.g., "user:123" or "ip:192.168.1.1")
 * @param limit Max requests allowed
 * @param windowMs Time window in milliseconds
 * @returns true if within limit, false if exceeded
 */
export function checkRateLimit(
  key: string,
  limit: number = 100,
  windowMs: number = 60 * 1000 // 1 minute default
): boolean {
  const now = Date.now()
  const entry = limiters.get(key)

  if (!entry || now >= entry.resetAt) {
    // Window expired or no entry, create new
    limiters.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  // Window still active
  if (entry.count < limit) {
    entry.count++
    return true
  }

  // Limit exceeded
  return false
}

/**
 * Get remaining requests for a key
 */
export function getRateLimitRemaining(
  key: string,
  limit: number = 100,
  windowMs: number = 60 * 1000
): number {
  const now = Date.now()
  const entry = limiters.get(key)

  if (!entry || now >= entry.resetAt) {
    return limit
  }

  return Math.max(0, limit - entry.count)
}

/**
 * Get reset time for a key
 */
export function getRateLimitReset(key: string, windowMs: number = 60 * 1000): number {
  const now = Date.now()
  const entry = limiters.get(key)

  if (!entry || now >= entry.resetAt) {
    return now + windowMs
  }

  return entry.resetAt
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupRateLimiters(): void {
  const now = Date.now()
  for (const [key, entry] of limiters.entries()) {
    if (now >= entry.resetAt) {
      limiters.delete(key)
    }
  }
}

// Cleanup every 5 minutes
setInterval(
  () => {
    cleanupRateLimiters()
  },
  5 * 60 * 1000
)

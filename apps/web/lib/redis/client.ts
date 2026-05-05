import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// 20 AI requests per minute per user
export const aiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
  prefix: 'fitai:ai',
})

// 100 API requests per minute per user
export const apiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'fitai:api',
})

/**
 * Cache helper — Redis 5sn TTL ile.
 * Liste endpoint'lerinde tek-kullanıcılı cache, polling yükünü kapatır.
 *
 * Kullanım:
 *   const data = await cached(`conv:list:${userId}`, 5, async () => {...})
 */
export async function cached<T>(key: string, ttlSec: number, loader: () => Promise<T>): Promise<T> {
  try {
    const hit = await redis.get<T>(key)
    if (hit !== null && hit !== undefined) return hit
  } catch {
    // Redis erişilemez ise direkt loader
  }
  const value = await loader()
  try {
    await redis.set(key, value, { ex: ttlSec })
  } catch {
    // sessize al
  }
  return value
}

/** Belirli prefix'li cache satırlarını temizle (mesaj atınca invalidate için) */
export async function invalidateCache(...keys: string[]) {
  try {
    if (keys.length > 0) await redis.del(...keys)
  } catch {
    // sessize al
  }
}

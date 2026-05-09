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

/** Belirli key'leri temizle (mesaj atınca invalidate için) */
export async function invalidateCache(...keys: string[]) {
  try {
    if (keys.length > 0) await redis.del(...keys)
  } catch {
    // sessize al
  }
}

/** Prefix'le başlayan tüm cache key'lerini temizle (örn "mp:list:" → tüm listing cache'leri) */
export async function invalidateCachePrefix(prefix: string) {
  try {
    // Upstash Redis SCAN ile prefix taraması
    let cursor: string | number = 0
    const matched: string[] = []
    do {
      const [next, batch] = (await redis.scan(cursor, { match: `${prefix}*`, count: 100 })) as [
        string,
        string[],
      ]
      matched.push(...batch)
      cursor = next
    } while (cursor !== '0' && cursor !== 0)
    if (matched.length > 0) await redis.del(...matched)
  } catch {
    // sessize al
  }
}

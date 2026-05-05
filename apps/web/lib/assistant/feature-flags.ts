/**
 * V4 Feature Flag Helper
 *
 * Her V4 özelliği bir flag arkasında. Faz başında flag açılır, sorun çıkarsa kapatılır.
 *
 * Kullanım:
 *   if (await isFlagEnabled('v4_graph_memory', userId)) { ... }
 *
 * Çözüm sırası (öncelik yüksekten düşüğe):
 *  1. Kullanıcıya özel kayıt (userId set)
 *  2. Global kayıt (userId null)
 *  3. Default false (kayıt yoksa)
 *
 * Cache: in-memory 60sn — kritik path'lerde DB hit'i azaltmak için.
 */

import { db } from '@/lib/db/client'

export type V4FlagName =
  | 'v4_graph_memory'
  | 'v4_characters'
  | 'v4_life_engine'
  | 'v4_decision_engine'
  | 'v4_group_chat'
  | 'v4_ui'
  | 'v4_inner_thought'
  | 'v4_avatar_consistency'

const TTL_MS = 60_000
const cache = new Map<string, { value: boolean; expiresAt: number }>()

function cacheKey(flag: string, userId: string | null) {
  return `${flag}:${userId ?? '__global__'}`
}

export async function isFlagEnabled(
  flag: V4FlagName,
  userId: string | null = null
): Promise<boolean> {
  const now = Date.now()

  // Önce kullanıcıya özel kayıt
  if (userId) {
    const userKey = cacheKey(flag, userId)
    const userCached = cache.get(userKey)
    if (userCached && userCached.expiresAt > now) {
      if (userCached.value) return true
      // false ise yine de global'e bakalım (kullanıcı override yapmamış olabilir)
    } else {
      const userRow = await db.featureFlag.findUnique({
        where: { userId_flagName: { userId, flagName: flag } },
        select: { enabled: true },
      })
      if (userRow) {
        cache.set(userKey, { value: userRow.enabled, expiresAt: now + TTL_MS })
        if (userRow.enabled) return true
      }
    }
  }

  // Global kayıt
  const globalKey = cacheKey(flag, null)
  const globalCached = cache.get(globalKey)
  if (globalCached && globalCached.expiresAt > now) {
    return globalCached.value
  }

  const globalRow = await db.featureFlag.findFirst({
    where: { userId: null, flagName: flag },
    select: { enabled: true },
  })

  const value = globalRow?.enabled ?? false
  cache.set(globalKey, { value, expiresAt: now + TTL_MS })
  return value
}

/**
 * Cache'i temizle — flag değişikliği yapıldığında çağrılır.
 */
export function clearFlagCache(flag?: V4FlagName, userId?: string | null) {
  if (!flag) {
    cache.clear()
    return
  }
  if (userId !== undefined) {
    cache.delete(cacheKey(flag, userId))
    return
  }
  for (const key of cache.keys()) {
    if (key.startsWith(`${flag}:`)) cache.delete(key)
  }
}

/**
 * Bir flag'i aç/kapat (kullanıcı bazında veya global).
 * Admin endpoint'i için.
 */
export async function setFlag(
  flag: V4FlagName,
  enabled: boolean,
  userId: string | null = null
): Promise<void> {
  if (userId === null) {
    // Global — userId null'dur, unique constraint'i obey etmek için findFirst+upsert
    const existing = await db.featureFlag.findFirst({
      where: { userId: null, flagName: flag },
    })
    if (existing) {
      await db.featureFlag.update({
        where: { id: existing.id },
        data: { enabled },
      })
    } else {
      await db.featureFlag.create({
        data: { userId: null, flagName: flag, enabled },
      })
    }
  } else {
    await db.featureFlag.upsert({
      where: { userId_flagName: { userId, flagName: flag } },
      create: { userId, flagName: flag, enabled },
      update: { enabled },
    })
  }
  clearFlagCache(flag, userId)
}

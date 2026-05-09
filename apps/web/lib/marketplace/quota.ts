/**
 * V4.8 Faz A — Karakter Yaratım Quota
 *
 * Free 3 / Premium 10 / Pro creator 50 aktif karakter.
 * Aktif olmayan (isRetired=true) sayılmaz.
 */

import { db } from '@/lib/db/client'

export const QUOTA_LIMITS = {
  free: 3,
  premium: 10,
  pro_creator: 50,
} as const

export type QuotaTier = keyof typeof QUOTA_LIMITS

export async function getUserQuota(userId: string): Promise<QuotaTier> {
  // V4.8 Faz A — şimdilik tüm yaratıcılar 'free' tier
  // Faz D'de Subscription tablosundan tier okunacak + creator-tier-updater cron
  const sub = await db.subscription.findFirst({
    where: { userId, status: 'active' },
  })
  if (!sub) return 'free'
  if (sub.plan === 'pro' || sub.plan === 'elite') return 'premium'
  return 'free'
}

export async function checkQuotaForCreate(userId: string): Promise<{
  allowed: boolean
  current: number
  limit: number
  tier: QuotaTier
  reason?: string
}> {
  const tier = await getUserQuota(userId)
  const limit = QUOTA_LIMITS[tier]

  const current = await db.character.count({
    where: {
      creatorId: userId,
      isRetired: false,
    },
  })

  return {
    allowed: current < limit,
    current,
    limit,
    tier,
    reason: current >= limit ? `${tier} planda max ${limit} aktif karakter olabilir` : undefined,
  }
}

/**
 * V4.8 Faz E — Yaratıcı Tier Sistemi
 *
 * Kazanç bazlı seviye atlama. Bronze → Silver → Gold → Diamond → Legend.
 */

export type CreatorTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'legend'

export interface TierThreshold {
  tier: CreatorTier
  label: string
  emoji: string
  color: string
  minEarnings: number
}

export const TIERS: TierThreshold[] = [
  { tier: 'bronze', label: 'Bronz', emoji: '🥉', color: '#CD7F32', minEarnings: 0 },
  { tier: 'silver', label: 'Gümüş', emoji: '🥈', color: '#C0C0C0', minEarnings: 500 },
  { tier: 'gold', label: 'Altın', emoji: '🥇', color: '#FFCC00', minEarnings: 2000 },
  { tier: 'diamond', label: 'Elmas', emoji: '💎', color: '#0A84FF', minEarnings: 10000 },
  { tier: 'legend', label: 'Efsane', emoji: '👑', color: '#FF3B30', minEarnings: 50000 },
]

export function tierFor(totalEarnings: number): TierThreshold {
  let current = TIERS[0]
  for (const t of TIERS) {
    if (totalEarnings >= t.minEarnings) current = t
  }
  return current
}

export function nextTier(totalEarnings: number): TierThreshold | null {
  const current = tierFor(totalEarnings)
  const idx = TIERS.findIndex((t) => t.tier === current.tier)
  if (idx === TIERS.length - 1) return null
  return TIERS[idx + 1]
}

export function tierProgress(totalEarnings: number): {
  current: TierThreshold
  next: TierThreshold | null
  progress: number // 0-1
  remainingEarnings: number
} {
  const current = tierFor(totalEarnings)
  const next = nextTier(totalEarnings)
  if (!next) {
    return { current, next: null, progress: 1, remainingEarnings: 0 }
  }
  const range = next.minEarnings - current.minEarnings
  const earned = totalEarnings - current.minEarnings
  return {
    current,
    next,
    progress: Math.max(0, Math.min(1, earned / range)),
    remainingEarnings: next.minEarnings - totalEarnings,
  }
}

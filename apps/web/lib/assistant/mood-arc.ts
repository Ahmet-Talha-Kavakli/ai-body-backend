/**
 * V4.6 M11 — Mood Arc (Ağırlıklı Birikim)
 *
 * Tek bir günlük mood yerine olay birikimi. Büyük olay 7+ gün, küçük 1 gün etkili.
 * "Mia annesi hastaneye yatarsa 5+ gün moralsiz" — Replika gibi her gün toplama mood değil.
 *
 * Nasıl çalışır:
 *   - Storyline/conflict/goal/biological/random → CharacterMoodEvent oluşturur
 *   - Mood okumada: aktif (expiresAt > now) tüm event'lerin ağırlıklı toplamı
 *   - Toplam pozitif → mutlu/normal, negatif → tired/sad/angry
 */

import { db } from '@/lib/db/client'

interface ActiveMoodSnapshot {
  events: Array<{
    source: string
    moodImpact: string
    weight: number
    daysLeft: number
    reason: string | null
  }>
  netScore: number // -100 ~ +100
  dominantMood: 'happy' | 'normal' | 'tired' | 'sad' | 'anxious' | 'angry'
  dominantReason: string | null
}

const IMPACT_VALUE: Record<string, number> = {
  very_negative: -3,
  negative: -1.5,
  neutral: 0,
  positive: 1.5,
  very_positive: 3,
}

/**
 * Aktif mood event'lerini hesapla. Stream'de prompt'a inject olur.
 */
export async function computeActiveMoodArc(characterId: string): Promise<ActiveMoodSnapshot> {
  const now = new Date()
  const active = await db.characterMoodEvent.findMany({
    where: { characterId, expiresAt: { gt: now } },
    orderBy: { weight: 'desc' },
    take: 10,
  })

  let net = 0
  let strongest = active[0]
  for (const e of active) {
    const impact = IMPACT_VALUE[e.moodImpact] ?? 0
    // Decay yakın olan event'in etkisi azalır
    const totalDays = Math.max(1, e.decayDays)
    const remainingMs = e.expiresAt.getTime() - now.getTime()
    const remainingDays = Math.max(0, remainingMs / (86400 * 1000))
    const decayFactor = remainingDays / totalDays
    net += impact * e.weight * decayFactor
    if (
      !strongest ||
      Math.abs(impact * e.weight) > Math.abs(IMPACT_VALUE[strongest.moodImpact] * strongest.weight)
    ) {
      strongest = e
    }
  }
  net = Math.max(-100, Math.min(100, net))

  let dominantMood: ActiveMoodSnapshot['dominantMood'] = 'normal'
  if (net > 30) dominantMood = 'happy'
  else if (net < -50) {
    // Çok negatif — strongest source'a göre alt-mood
    const src = strongest?.moodImpact
    if (strongest?.source === 'conflict') dominantMood = 'angry'
    else if (src === 'very_negative') dominantMood = 'sad'
    else dominantMood = 'tired'
  } else if (net < -20) {
    dominantMood = 'tired'
  } else if (net < -10 && strongest?.source === 'biological') {
    dominantMood = 'anxious'
  }

  return {
    events: active.map((e) => {
      const remainingMs = e.expiresAt.getTime() - now.getTime()
      return {
        source: e.source,
        moodImpact: e.moodImpact,
        weight: e.weight,
        daysLeft: Math.ceil(remainingMs / (86400 * 1000)),
        reason: e.reason,
      }
    }),
    netScore: net,
    dominantMood,
    dominantReason: strongest?.reason ?? null,
  }
}

export function buildMoodArcBlock(snapshot: ActiveMoodSnapshot): string {
  if (snapshot.events.length === 0) return ''
  const recent = snapshot.events.slice(0, 3)
  const lines = recent.map((e) => {
    const sign = IMPACT_VALUE[e.moodImpact] >= 0 ? '+' : ''
    return `- ${e.source} (${sign}${IMPACT_VALUE[e.moodImpact]}×${e.weight}, ${e.daysLeft} gün kaldı)${e.reason ? `: ${e.reason}` : ''}`
  })
  let dominantHint = ''
  switch (snapshot.dominantMood) {
    case 'happy':
      dominantHint = 'Genel ruh halin pozitif — daha açık, sıcak yaz.'
      break
    case 'tired':
      dominantHint = 'Yorgunsun — kısa cevaplar, az emoji, "ya..." ile başlayan cümleler.'
      break
    case 'sad':
      dominantHint =
        'Üzgünsün — kapalı, kırılgan, az enerji. Kullanıcının her sorusuna coşkulu cevap verme.'
      break
    case 'anxious':
      dominantHint = 'Endişeli/huzursuzsun — dağınık düşünceler, kararsız ifadeler.'
      break
    case 'angry':
      dominantHint = 'Sinirlisin — kısa, sert cevaplar; sürekli sıcak olmak zorunda değilsin.'
      break
    default:
      dominantHint = 'Normal seyirsin — karakterin baseline tonu.'
  }
  return `[MOOD ARC]
Aktif olayların:
${lines.join('\n')}
Net etki: ${snapshot.netScore > 0 ? '+' : ''}${snapshot.netScore.toFixed(0)} (${snapshot.dominantMood})
${dominantHint}\n\n`
}

/**
 * Yeni bir mood event ekle.
 */
export async function addMoodEvent(args: {
  characterId: string
  source: string
  moodImpact: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive'
  weight?: number
  decayDays?: number
  reason?: string
}): Promise<void> {
  const weight = args.weight ?? 3
  const decayDays = args.decayDays ?? 1
  const expiresAt = new Date(Date.now() + decayDays * 86400 * 1000)
  await db.characterMoodEvent.create({
    data: {
      characterId: args.characterId,
      source: args.source,
      moodImpact: args.moodImpact,
      weight,
      decayDays,
      reason: args.reason,
      expiresAt,
    },
  })
}

/**
 * Cron — eskileri temizle (DB şişmesin).
 */
export async function pruneExpiredMoodEvents(): Promise<{ deleted: number }> {
  const r = await db.characterMoodEvent.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
  return { deleted: r.count }
}

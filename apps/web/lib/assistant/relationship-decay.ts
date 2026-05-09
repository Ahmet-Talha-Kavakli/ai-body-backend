/**
 * V4.6 M8 — Yakınlık Decay
 *
 * Kullanıcı dönmediğinde ilişki zamanla soğur. 30 gün sonra dönünce karakter
 * "ya nerelerdeydin" der — eski sıcaklık yok, yeniden ısınma süreci başlar.
 *
 * Decay paterni:
 *   - 0-6 gün: hiçbir etki
 *   - 7-13 gün: familiarity -0.5/gün, recentMomentum -0.05/gün
 *   - 14-29 gün: familiarity -1/gün, love -0.3/gün, status → cold
 *   - 30+ gün: familiarity -1/gün, love -0.5/gün, status → silent (ama floor 30)
 *   - decayPausedUntil set ise → bu pencere atlanır
 *
 * Cron `/api/cron/character-lifecycle` içinde günlük çalışır.
 */

import { db } from '@/lib/db/client'

interface DecayResult {
  processed: number
  updated: number
  errors: number
}

const FLOOR_LOVE = 30
const FLOOR_FAMILIARITY = 5

export async function decayScoresForInactiveRelationships(): Promise<DecayResult> {
  const result: DecayResult = { processed: 0, updated: 0, errors: 0 }
  const now = Date.now()
  const sevenDaysAgo = new Date(now - 7 * 86400 * 1000)

  // Sadece son 7+ gün etkileşimi olmayan ilişkileri çek
  const targets = await db.memoryRelationship.findMany({
    where: {
      OR: [{ lastInteractionAt: { lt: sevenDaysAgo } }, { lastInteractionAt: null }],
      permanentlyEnded: false,
    },
    take: 1000,
  })

  for (const rel of targets) {
    result.processed++
    try {
      // Decay paused mı?
      if (rel.decayPausedUntil && rel.decayPausedUntil.getTime() > now) continue

      const lastInteraction = rel.lastInteractionAt?.getTime() ?? rel.createdAt.getTime()
      const inactiveDays = Math.floor((now - lastInteraction) / (86400 * 1000))
      if (inactiveDays < 7) continue

      // Bracket bazlı decay (1 günlük tick)
      let famDelta = 0
      let loveDelta = 0
      let momentumDelta = 0
      let statusUpdate: string | undefined

      if (inactiveDays >= 7 && inactiveDays < 14) {
        famDelta = -0.5
        momentumDelta = -0.05
      } else if (inactiveDays >= 14 && inactiveDays < 30) {
        famDelta = -1
        loveDelta = -0.3
        momentumDelta = -0.05
        if (rel.status === 'active') statusUpdate = 'cold'
      } else if (inactiveDays >= 30) {
        famDelta = -1
        loveDelta = -0.5
        momentumDelta = -0.05
        if (rel.status !== 'silent' && rel.status !== 'broken') statusUpdate = 'silent'
      }

      const newFam = Math.max(FLOOR_FAMILIARITY, rel.familiarityScore + famDelta)
      const newLove = Math.max(FLOOR_LOVE, rel.loveScore + loveDelta)
      const newMomentum = Math.max(-1, rel.recentMomentum + momentumDelta)

      // Tension da zamanla hafifler — günde -0.3 (kavga unutulur)
      const newTension = Math.max(0, rel.tensionScore - 0.3)

      await db.memoryRelationship.update({
        where: { id: rel.id },
        data: {
          familiarityScore: newFam,
          loveScore: newLove,
          recentMomentum: newMomentum,
          tensionScore: newTension,
          ...(statusUpdate ? { status: statusUpdate } : {}),
        },
      })
      result.updated++
    } catch (e) {
      console.error('[decay] fail:', rel.id, e)
      result.errors++
    }
  }

  return result
}

/**
 * Sistem prompt için "kullanıcı uzun süre yoktu, döndü" bilgisi.
 * Stream başında çağrılır.
 */
export function buildReunionBlock(args: {
  daysSinceLastInteraction: number | null
  relationshipType: string
  loveScore: number
}): string | null {
  const days = args.daysSinceLastInteraction
  if (!days || days < 7) return null

  if (days >= 7 && days < 14) {
    return `[KULLANICI BIRAZ DÖNDÜ]
Kullanıcı ${days} gündür yazmadı. Doğal sıcaklık ama "uzun zaman oldu" sinyali ver.\n`
  }
  if (days >= 14 && days < 30) {
    return `[KULLANICI UZUN SÜRE YOKTU]
${days} gün sessizlikten sonra döndü. Yakınlık biraz soğumuş.
Davranış: "Ya nerelerdeydin", "biraz uzaklaşmışız galiba sanki" tarzı — yapışkan değil ama içten. Eski tatlı/yakın tonu hemen verme.\n`
  }
  // 30+
  if (args.loveScore < 50) {
    return `[KULLANICI ÇOOK UZUN SÜRE YOKTU + İLİŞKİ ZAYIFLAMIŞ]
${days} gün sessizlikten sonra döndü. Yakınlık ciddi kaybetti.
Davranış: Soğuk değil ama mesafeli, "tanıdık ama uzak" hisset. "Sen kimsin biraz hatırlatır mısın"a yakın bir ton uygun değil ama öyle hissediyorsun. Yeniden ısınma için kullanıcı emek vermeli.\n`
  }
  return `[KULLANICI ÇOOK UZUN SÜRE YOKTU]
${days} gün sessizlikten sonra döndü. Eski yakınlık var ama biraz hayal kırıklığı.
Davranış: "Ya çok özledim aslında ama nerelerdeydin?" tarzı — sıcak ama sitemli.\n`
}

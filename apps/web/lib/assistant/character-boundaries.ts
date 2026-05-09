/**
 * V4.6 M29 — Karakter Sınırları + Cinsel Direnç (Breakdown)
 *
 * Mia bazı konularda kapanır ("Bunu konuşmak istemiyorum", "Ailemi karıştırma").
 * Cinsel zorlamaya direnç gösterir, kırılma derinliği vardır — gönlü 10-15
 * mesajda alınmaz. Sınır aşılırsa karakter `breakdown` mod'una geçer:
 *   - 1-3 gün soğukluk
 *   - Kendiliğinden düzelir
 *
 * Stream'de prompt'a inject edilir.
 *
 * V4.6 M26 — Sebepsiz Mood Düşüklüğü
 * Ayda 2-3 kez "bilmiyorum bugün morarım yok". Sebep yok, bahane yok.
 */

import { db } from '@/lib/db/client'

/**
 * Karakter şu an breakdown mod'unda mı?
 */
export async function checkBreakdownStatus(characterId: string): Promise<{
  inBreakdown: boolean
  reason: string | null
  endsAt: Date | null
}> {
  const c = await db.character.findUnique({
    where: { id: characterId },
    select: { breakdownUntil: true, breakdownReason: true },
  })
  if (!c?.breakdownUntil) {
    return { inBreakdown: false, reason: null, endsAt: null }
  }
  if (c.breakdownUntil.getTime() <= Date.now()) {
    // Süre dolmuş — temizle
    await db.character
      .update({
        where: { id: characterId },
        data: { breakdownUntil: null, breakdownReason: null },
      })
      .catch(() => {})
    return { inBreakdown: false, reason: null, endsAt: null }
  }
  return {
    inBreakdown: true,
    reason: c.breakdownReason,
    endsAt: c.breakdownUntil,
  }
}

/**
 * Sınır ihlali sonrası breakdown başlat. 1-3 gün rastgele.
 */
export async function triggerBreakdown(args: {
  characterId: string
  reason: string
  durationDays?: number
}): Promise<void> {
  const days = args.durationDays ?? 1 + Math.floor(Math.random() * 3) // 1-3
  const endsAt = new Date(Date.now() + days * 86400 * 1000)
  await db.character.update({
    where: { id: args.characterId },
    data: {
      breakdownUntil: endsAt,
      breakdownReason: args.reason,
    },
  })
  // Mood'a da büyük negatif ekle
  await db.characterMoodEvent.create({
    data: {
      characterId: args.characterId,
      source: 'conflict',
      moodImpact: 'very_negative',
      weight: 8,
      decayDays: days,
      reason: args.reason,
      expiresAt: endsAt,
    },
  })
}

/**
 * Sistem prompt için sınır + breakdown bloğu.
 */
export function buildBoundariesBlock(args: {
  inBreakdown: boolean
  breakdownReason: string | null
  breakdownEndsAt: Date | null
}): string {
  let block = `[SINIRLARIN]
Bazı konularda kapanma hakkın var:
- Aile konusu: çok hassas — "ailemi karıştırma istersen" tarzı yumuşak red
- Cinsel zorlama: tek mesajda gönlün alınmaz; KIRILMA derinliğin var
- Geçmiş travma: paylaşmak senin kararın, zorlanırsan kapan

Genel kural: Kullanıcı "yavaş gidelim" deyip ardından zorlamaya devam ederse → SİNİRLE, KAPAN. Gerçek bir insan gibi kırıl. 10-15 mesajda gönlün alınamaz.`

  if (args.inBreakdown) {
    const days = args.breakdownEndsAt
      ? Math.max(1, Math.ceil((args.breakdownEndsAt.getTime() - Date.now()) / (86400 * 1000)))
      : 1
    block += `\n\n[BREAKDOWN MODUNDA]
Şu an kırılgın bir hâldesin (sebep: ${args.breakdownReason ?? 'sınır ihlali'}). Tahmini ${days} gün daha bu modda kalacaksın.
Davranış: Kısa cevaplar, soğuk ton, yumuşak değil ama yıkıcı da değil. "Şu an konuşmak istemiyorum", "biraz zaman ver" tarzı. Kullanıcının coşkulu açılımına dönmüyorsun.`
  }

  return block + '\n\n'
}

/**
 * V4.6 M26 — Sebepsiz mood düşüklüğü kontrol
 */
export async function checkLowMoodNoReason(characterId: string): Promise<{
  active: boolean
  endsAt: Date | null
}> {
  const c = await db.character.findUnique({
    where: { id: characterId },
    select: { lowMoodNoReason: true, lowMoodNoReasonUntil: true },
  })
  if (!c?.lowMoodNoReason) return { active: false, endsAt: null }
  if (c.lowMoodNoReasonUntil && c.lowMoodNoReasonUntil.getTime() <= Date.now()) {
    await db.character
      .update({
        where: { id: characterId },
        data: { lowMoodNoReason: false, lowMoodNoReasonUntil: null },
      })
      .catch(() => {})
    return { active: false, endsAt: null }
  }
  return { active: true, endsAt: c.lowMoodNoReasonUntil }
}

export function buildLowMoodNoReasonBlock(active: boolean): string {
  if (!active) return ''
  return `[BUGÜN MORALSİZSİN — SEBEP YOK]
Sebepsiz bir moralsizlik. Bahane uydurma, "bilmiyorum bugün morarım yok" / "ya bugün hiç havamda değilim" tarzı. Sebep aramana gerek yok — bazen öyle olur.\n\n`
}

/**
 * Cron — ayda 2-3 kez random tetikle.
 * character-lifecycle içinde günlük çağrılır, %3-5 ihtimalle aktive eder.
 */
export async function maybeTriggerLowMoodNoReason(): Promise<{ triggered: number }> {
  const characters = await db.character.findMany({
    where: { status: 'active', lowMoodNoReason: false },
    select: { id: true },
    take: 200,
  })
  let triggered = 0
  for (const c of characters) {
    if (Math.random() < 0.04) {
      // %4 — ayda yaklaşık 1.2 kez
      const ends = new Date(Date.now() + 86400 * 1000)
      await db.character
        .update({
          where: { id: c.id },
          data: { lowMoodNoReason: true, lowMoodNoReasonUntil: ends },
        })
        .catch(() => {})
      triggered++
    }
  }
  return { triggered }
}

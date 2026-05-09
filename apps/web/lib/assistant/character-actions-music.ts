/**
 * V4.6 M50, M51, M52, M54, M56 — Karakter aksiyonları + müzik + foto cevap
 */

import { db } from '@/lib/db/client'

// ─────────────────────────────────────────────────────────────────
// M51 — Gerçek aksiyon (state machine)
// ─────────────────────────────────────────────────────────────────

export async function loadActiveRealAction(characterId: string) {
  return db.characterRealAction.findFirst({
    where: { characterId, endedAt: null },
    orderBy: { startedAt: 'desc' },
  })
}

export function buildRealActionBlock(
  action: Awaited<ReturnType<typeof loadActiveRealAction>>
): string {
  if (!action) return ''
  let block = `[GERÇEK DURUMUN]\nŞu an: ${action.action}`
  if (action.withWho) block += ` (${action.withWho})`
  if (action.toldUserAs && action.toldUserAs !== action.action) {
    block += `\nKullanıcıya söylediğin: "${action.toldUserAs}" ${action.isLie ? '(YALAN)' : ''}`
    block += `\nDavranış: Yalanı sürdür ya da bırak. Sürdürürsen TUTARLI ol — aktiviteler tutuyor olmalı. Aşırı abartma.`
  }
  return block + '\n\n'
}

// ─────────────────────────────────────────────────────────────────
// M52 — Şarkı paylaşma
// ─────────────────────────────────────────────────────────────────

export async function loadCharacterMusicTaste(characterId: string) {
  return db.characterMusicTaste.findMany({
    where: { characterId, liked: true },
    orderBy: { lastUsedAt: 'asc' },
    take: 5,
  })
}

export function buildMusicTasteBlock(
  tracks: Awaited<ReturnType<typeof loadCharacterMusicTaste>>
): string {
  if (tracks.length === 0) return ''
  const lines = tracks
    .slice(0, 3)
    .map((t) => `- ${t.trackTitle}${t.artist ? ` (${t.artist})` : ''} — mood: ${t.mood}`)
  return `[SEVDİĞİN ŞARKILAR]
${lines.join('\n')}
KURAL: Bağlam uygunsa Spotify/YouTube link paylaşabilirsin. Aynı şarkıyı tekrar paylaşma — sharedAt damgası tutuluyor.\n\n`
}

// ─────────────────────────────────────────────────────────────────
// M54 — Önemli tarih hatırlama (cron)
// ─────────────────────────────────────────────────────────────────

export async function tickImportantDates(): Promise<{ triggered: number }> {
  // Bugünün tarihi
  const today = new Date()
  const todayMonth = today.getMonth()
  const todayDay = today.getDate()
  let triggered = 0

  // Memory fact'lerden important_date kategorisindeki kayıtları çek
  // Format: content içinde "DD/MM" veya "DD.MM" tarih beklenir
  const facts = await db.characterMemoryFact.findMany({
    where: { category: 'important_date', archived: false },
    take: 200,
  })

  for (const fact of facts) {
    // Basit parse — content içinde "X tarihi var" tarzı
    const dateMatch = /(\d{1,2})[/.](\d{1,2})/.exec(fact.content)
    if (!dateMatch) continue
    const day = parseInt(dateMatch[1], 10)
    const month = parseInt(dateMatch[2], 10) - 1
    if (day !== todayDay || month !== todayMonth) continue

    // Bugün önemli tarih — proaktif mesaj kuyruğuna ekle (basit: lastUsedAt güncelle)
    await db.characterMemoryFact
      .update({
        where: { id: fact.id },
        data: { lastUsedAt: new Date(), importance: Math.min(5, fact.importance + 1) },
      })
      .catch(() => {})
    triggered++
  }
  return { triggered }
}

// ─────────────────────────────────────────────────────────────────
// M56 — Foto'ya foto cevap (rastgele havuzdan seç)
// ─────────────────────────────────────────────────────────────────

export async function pickReplyPhoto(args: {
  characterId: string
  category: string
}): Promise<{ url: string; caption: string | null } | null> {
  const photo = await db.characterPhotoLibrary.findFirst({
    where: { characterId: args.characterId, category: args.category },
    orderBy: { lastUsedAt: 'asc' },
  })
  if (!photo) return null
  await db.characterPhotoLibrary
    .update({
      where: { id: photo.id },
      data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
    })
    .catch(() => {})
  return { url: photo.url, caption: photo.caption }
}

/**
 * V4.7 L1 — Absence Recap Builder (günde 1)
 *
 * Her aktif karakter ilişkisi için:
 *   - lastUserMessageAt (memoryRelationship) ≥ 3 gün önce
 *   - O karakterde son 3 günde anlamlı mood event veya storyline progression varsa
 *   - UserAbsenceRecap (delivered=false) zaten yoksa:
 *       gpt-4o-mini ile özet üret → kayıt
 *
 * Recap stream'de kullanıcı geri döndüğünde prompt'a girer (buildAbsenceRecapBlock).
 *
 * Lokal: curl http://localhost:3000/api/cron/absence-recap-builder
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'

export const maxDuration = 300

async function summarizeRecap(args: {
  characterName: string
  daysAway: number
  events: string[]
}): Promise<string | null> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `${args.characterName} olarak son ${args.daysAway} günde yaşadıklarını özetliyorsun.

Son olaylar:
${args.events.map((e) => `- ${e}`).join('\n')}

Format:
- 3-5 kısa satır.
- Doğal anlatım: "şunu yaşadım, sonra şu oldu".
- ASLA tracker / liste tonu.
- ASLA Replika klişesi.
- Karakter tonunda samimi.

Sadece özeti yaz.`,
        },
        { role: 'user', content: 'Özet üret.' },
      ],
      temperature: 0.85,
      max_tokens: 250,
    })
    const text = r.choices[0]?.message?.content?.trim()
    if (!text) return null
    return text
  } catch (e) {
    console.error('[absence-recap-builder] AI fail:', e)
    return null
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (
    cronSecret &&
    authHeader !== `Bearer ${cronSecret}` &&
    process.env.NODE_ENV === 'production'
  ) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const now = new Date()
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  const relationships = await db.memoryRelationship.findMany({
    where: {
      lastUserMessageAt: { lte: threeDaysAgo },
      status: { in: ['active', 'recovering'] },
    },
    select: {
      userId: true,
      characterId: true,
      lastUserMessageAt: true,
    },
  })

  let scanned = 0
  let created = 0
  let skipped = 0

  for (const rel of relationships) {
    scanned++
    if (!rel.lastUserMessageAt) continue

    // Pending recap zaten varsa skip
    const existing = await db.userAbsenceRecap.findFirst({
      where: {
        characterId: rel.characterId,
        userId: rel.userId,
        delivered: false,
      },
      select: { id: true },
    })
    if (existing) {
      skipped++
      continue
    }

    // Karakterde son 3 günde mood/storyline var mı
    const moodEvents = await db.characterMoodEvent.findMany({
      where: {
        characterId: rel.characterId,
        appliedAt: { gte: threeDaysAgo },
        weight: { gte: 4 },
      },
      select: { reason: true, source: true, moodImpact: true },
      take: 5,
    })
    if (moodEvents.length === 0) {
      skipped++
      continue
    }

    const character = await db.character.findUnique({
      where: { id: rel.characterId },
      select: { name: true },
    })
    if (!character) continue

    const daysAway = Math.floor(
      (now.getTime() - rel.lastUserMessageAt.getTime()) / (24 * 60 * 60 * 1000)
    )

    const events = moodEvents
      .map((e) => e.reason || `${e.source} (${e.moodImpact})`)
      .filter(Boolean)
      .slice(0, 5)

    const recap = await summarizeRecap({
      characterName: character.name,
      daysAway,
      events,
    })
    if (!recap) continue

    await db.userAbsenceRecap.create({
      data: {
        characterId: rel.characterId,
        userId: rel.userId,
        absenceStart: rel.lastUserMessageAt,
        daysAway,
        recapBlock: recap,
        delivered: false,
      },
    })
    created++
  }

  return NextResponse.json({
    ok: true,
    scanned,
    created,
    skipped,
    timestamp: now.toISOString(),
  })
}

/**
 * V4.7 E2 — Anniversary Checker (günde 1)
 *
 * Her trust ≥ 70 ilişki için:
 *   - İlk mesajın MM-DD'si bugün ise + AnniversaryLetter (year=N) yoksa:
 *     - Top 3-5 verbatim memory (importance + emotional)
 *     - gpt-4o-mini ile mektup oluştur
 *     - AnniversaryLetter kayıt + ScheduledCharacterMessage (mektup formatı)
 *
 * year hesabı: (yılFarkı) tam sayı.
 *
 * Lokal: curl http://localhost:3000/api/cron/anniversary-checker
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'

export const maxDuration = 300

async function buildLetter(args: {
  characterName: string
  year: number
  highlights: { topic: string; content: string }[]
}): Promise<string | null> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const highlightsText = args.highlights
    .map((h) => `- (${h.topic}) "${h.content.slice(0, 200)}"`)
    .join('\n')
  try {
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `${args.characterName} olarak yıl dönümü mektubu yazıyorsun.

Tanışmamızın ${args.year}. yılı.
Bu yılki en önemli anılar (kullanıcının mesajları):
${highlightsText}

Mektup formatı:
- Doğal Türk arkadaş tonu, içten.
- 4-7 cümle.
- "Bu yıl seninle X yaşadık" / "En hatırladığım Y oldu" / "Sevdiğim tarafın Z" kalıpları.
- ASLA Replika tarzı melodrama, ASLA "duygularını paylaş" klişesi.
- ASLA aşırı şeker — gerçek arkadaş minneti.

Sadece mektubun metnini yaz. Başlık/imza yok.`,
        },
        { role: 'user', content: 'Mektubu yaz.' },
      ],
      temperature: 0.85,
      max_tokens: 400,
    })
    const text = r.choices[0]?.message?.content?.trim()
    if (!text) return null
    return text
  } catch (e) {
    console.error('[anniversary-checker] AI fail:', e)
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
  const todayMM = now.getMonth()
  const todayDD = now.getDate()

  // Trust ≥ 70 ilişkiler
  const relationships = await db.memoryRelationship.findMany({
    where: { trustScore: { gte: 70 }, status: { in: ['active', 'recovering'] } },
    select: { userId: true, characterId: true },
  })

  let scanned = 0
  let created = 0

  for (const rel of relationships) {
    scanned++

    // İlk mesaj tarihini bul (en eski user mesajı bu karakterle)
    const firstMsg = await db.assistantMessage.findFirst({
      where: {
        role: 'user',
        conversation: { userId: rel.userId, characterId: rel.characterId },
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    })
    if (!firstMsg) continue

    if (firstMsg.createdAt.getMonth() !== todayMM || firstMsg.createdAt.getDate() !== todayDD) {
      continue
    }
    const yearDiff = now.getFullYear() - firstMsg.createdAt.getFullYear()
    if (yearDiff < 1) continue

    // Zaten bu yıl mektup var mı?
    const existing = await db.anniversaryLetter.findUnique({
      where: {
        characterId_userId_year: {
          characterId: rel.characterId,
          userId: rel.userId,
          year: yearDiff,
        },
      },
    })
    if (existing) continue

    const character = await db.character.findUnique({
      where: { id: rel.characterId },
      select: { name: true },
    })
    if (!character) continue

    // Top 5 verbatim
    const highlights = await db.characterVerbatimMemory.findMany({
      where: { characterId: rel.characterId, importance: { gte: 4 } },
      orderBy: [{ importance: 'desc' }, { recordedAt: 'desc' }],
      take: 5,
      select: { id: true, topic: true, content: true },
    })
    if (highlights.length === 0) continue

    const letterContent = await buildLetter({
      characterName: character.name,
      year: yearDiff,
      highlights: highlights.map((h) => ({ topic: h.topic, content: h.content })),
    })
    if (!letterContent) continue

    await db.anniversaryLetter.create({
      data: {
        characterId: rel.characterId,
        userId: rel.userId,
        year: yearDiff,
        letterContent,
        highlights: highlights.map((h) => h.id),
        sentAt: now,
      },
    })

    // Sohbete schedule
    const conv = await db.assistantConversation.findFirst({
      where: { userId: rel.userId, characterId: rel.characterId, archived: false },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    })
    if (conv) {
      await db.scheduledCharacterMessage.create({
        data: {
          userId: rel.userId,
          characterId: rel.characterId,
          conversationId: conv.id,
          content: letterContent,
          scheduledFor: now,
          status: 'pending',
          attachments: {
            kind: 'anniversary_letter',
            year: yearDiff,
            characterName: character.name,
          },
        },
      })
    }
    created++
  }

  return NextResponse.json({
    ok: true,
    scanned,
    created,
    timestamp: now.toISOString(),
  })
}

/**
 * V4.7 D5 — Gift Suggester (haftada 1)
 *
 * Her aktif karakter için trust ≥ 50 olan kullanıcıların preference fact'lerini al,
 * top 1-2 preference için gpt-4o-mini'den hediye/jest önerisi üret (Türkiye pazarı).
 * Dış API yok — pragmatik MVP. Model popüler markaları/şarkıları biliyor.
 *
 * Üretilen GiftSuggestion → 1-3 gün içinde ScheduledCharacterMessage olarak paylaşılacak
 * (paylaşım kararı ayrı: aşağıdaki "ihtimal" mantığı).
 *
 * Lokal: curl http://localhost:3000/api/cron/gift-suggester
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'

export const maxDuration = 300

type Suggestion = {
  category: 'product' | 'song' | 'movie' | 'book' | 'jest'
  itemRef: string
  reasoning: string
}

async function suggestForFact(args: {
  characterName: string
  factContent: string
}): Promise<Suggestion | null> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Bir Türk karakter (${args.characterName}) kullanıcısı için arkadaşça hediye/jest önerisi üretiyorsun.

Kullanıcı tercihi: "${args.factContent}"

KURALLAR:
- Türkiye pazarında bulunabilir bir şey (marka, yerel ürün, popüler Türk şarkısı/film/kitap).
- ASLA reklam tonu — arkadaş tonu.
- itemRef: ürünün/parçanın adı (URL değil, kısa metin).
- reasoning: hangi tercihten dolayı önerildi (kısa).

JSON dön:
{"category":"product|song|movie|book|jest","itemRef":"...","reasoning":"..."}`,
        },
        { role: 'user', content: 'Öneri üret.' },
      ],
      temperature: 0.85,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    })
    const text = r.choices[0]?.message?.content
    if (!text) return null
    return JSON.parse(text) as Suggestion
  } catch (e) {
    console.error('[gift-suggester] AI fail:', e)
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

  // Trust ≥ 50 ilişkiler
  const relationships = await db.memoryRelationship.findMany({
    where: { trustScore: { gte: 50 }, status: { in: ['active', 'recovering'] } },
    select: { userId: true, characterId: true },
  })

  // Karakter isimleri
  const characterIds = Array.from(new Set(relationships.map((r) => r.characterId)))
  const characters = await db.character.findMany({
    where: { id: { in: characterIds } },
    select: { id: true, name: true },
  })
  const charNameById = new Map(characters.map((c) => [c.id, c.name]))

  let processed = 0
  let created = 0

  for (const rel of relationships) {
    processed++
    const characterName = charNameById.get(rel.characterId)
    if (!characterName) continue

    // Bu rel için son 30 gün GiftSuggestion var mı? Spam önle (haftada 1 cron olsa da)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recent = await db.giftSuggestion.findFirst({
      where: {
        characterId: rel.characterId,
        userId: rel.userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { id: true },
    })
    if (recent) continue

    // Top preference fact'ler
    const prefs = await db.characterMemoryFact.findMany({
      where: {
        characterId: rel.characterId,
        userId: rel.userId,
        subject: 'user',
        category: 'preference',
        archived: false,
      },
      orderBy: [{ importance: 'desc' }, { lastUsedAt: 'desc' }],
      take: 2,
    })
    if (prefs.length === 0) continue

    for (const pref of prefs) {
      const suggestion = await suggestForFact({
        characterName,
        factContent: pref.content,
      })
      if (!suggestion) continue

      // Paylaşım için 1-3 gün içinde rastgele bir an
      const delayHours = 24 + Math.floor(Math.random() * 48)
      const scheduledFor = new Date(Date.now() + delayHours * 60 * 60 * 1000)

      await db.giftSuggestion.create({
        data: {
          characterId: rel.characterId,
          userId: rel.userId,
          category: suggestion.category,
          itemRef: suggestion.itemRef,
          reasoning: suggestion.reasoning,
          scheduledFor,
          shared: false,
        },
      })
      created++
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    created,
    timestamp: new Date().toISOString(),
  })
}

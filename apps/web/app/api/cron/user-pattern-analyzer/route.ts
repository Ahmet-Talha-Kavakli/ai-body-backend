/**
 * V4.7 G2 / N4 — User Pattern Analyzer
 *
 * Haftalık cron (Pazar gece). Her aktif kullanıcı için:
 *   - Son 7 gün vs önceki 7 gün mesaj sayısı
 *   - Saat dağılımı değişimi (peak hours)
 *   - Konu dağılımı (mesaj içeriği topic frequency — gpt-4o-mini)
 *   - Mood dağılımı (mesaj duygu etiketi varsa)
 *
 * Karakterler için: anlamlı değişim varsa CharacterMemoryFact ekle
 * (kategori: 'pattern_change'). Karakterler bunu prompt'ta sızdıracak
 * (buildPatternShiftBlock).
 *
 * Lokal dev: curl http://localhost:3000/api/cron/user-pattern-analyzer
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'

export const maxDuration = 300

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface PatternShift {
  description: string
  topic: string
  significance: number // 0-1
}

async function detectPatternShift(
  recentMessages: string[],
  olderMessages: string[]
): Promise<PatternShift | null> {
  if (recentMessages.length < 5 || olderMessages.length < 5) return null

  const sys = `Kullanıcının iki dönemdeki mesajlarına bak. Belirgin bir davranış/konu/mood değişimi var mı?

Son 7 gün (${recentMessages.length} mesaj):
${recentMessages
  .slice(0, 30)
  .map((m, i) => `${i + 1}. ${m.slice(0, 150)}`)
  .join('\n')}

Önceki dönem (${olderMessages.length} mesaj):
${olderMessages
  .slice(0, 30)
  .map((m, i) => `${i + 1}. ${m.slice(0, 150)}`)
  .join('\n')}

JSON formatta cevap:
{ "shift": "açıklama (Türkçe, 1 cümle)" | null, "topic": "konu özeti", "significance": 0.0-1.0 }

Sadece **belirgin** değişimleri belirt (örn. "son 7 gün iş şikayeti çok azaldı, önceki 7 günde sürekliydi"). Sıradan dalgalanmalar değil. Çok küçük değişimleri null döndür.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: sys }],
      max_tokens: 200,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })
    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.shift) return null
    return {
      description: String(parsed.shift),
      topic: String(parsed.topic || 'genel'),
      significance: Math.min(1, Math.max(0, Number(parsed.significance) || 0.5)),
    }
  } catch (e) {
    console.error('[pattern-detect]', e)
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
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  // Aktif kullanıcılar (son 14 gün'de mesaj atmış)
  const activeUserMessages = await db.assistantMessage.groupBy({
    by: ['conversationId'],
    where: { role: 'user', createdAt: { gte: fourteenDaysAgo } },
    _count: true,
    having: { conversationId: { _count: { gt: 10 } } },
  })

  let usersScanned = 0
  let factsCreated = 0

  // Conversation → user map
  const convIds = activeUserMessages.map((c) => c.conversationId)
  const convs = await db.assistantConversation.findMany({
    where: { id: { in: convIds } },
    select: { id: true, userId: true, characterId: true },
  })

  // userId bazında dedup
  const seen = new Set<string>()
  for (const c of convs) {
    if (seen.has(c.userId)) continue
    seen.add(c.userId)
    usersScanned++

    const recentMsgs = await db.assistantMessage.findMany({
      where: {
        role: 'user',
        createdAt: { gte: sevenDaysAgo },
        conversation: { userId: c.userId },
      },
      select: { content: true },
      take: 50,
      orderBy: { createdAt: 'desc' },
    })
    const olderMsgs = await db.assistantMessage.findMany({
      where: {
        role: 'user',
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        conversation: { userId: c.userId },
      },
      select: { content: true },
      take: 50,
      orderBy: { createdAt: 'desc' },
    })

    if (recentMsgs.length < 5 || olderMsgs.length < 5) continue

    const shift = await detectPatternShift(
      recentMsgs.map((m) => m.content),
      olderMsgs.map((m) => m.content)
    )
    if (!shift) continue

    // Bu kullanıcının tüm aktif karakterlerine fact ekle
    const characters = await db.character.findMany({
      where: { userId: c.userId, status: { not: 'departed' } },
      select: { id: true },
    })

    for (const ch of characters) {
      // Aynı topic'te yakın zamanda fact var mı?
      const existing = await db.characterMemoryFact.findFirst({
        where: {
          characterId: ch.id,
          userId: c.userId,
          subject: 'user',
          category: 'pattern_change',
          archived: false,
          createdAt: { gte: sevenDaysAgo },
        },
      })
      if (existing) continue

      await db.characterMemoryFact.create({
        data: {
          characterId: ch.id,
          userId: c.userId,
          subject: 'user',
          category: 'pattern_change',
          content: shift.description,
          importance: Math.round(2 + shift.significance * 2), // 2-4
          patternStable: false,
        },
      })
      factsCreated++
    }
  }

  return NextResponse.json({ ok: true, usersScanned, factsCreated })
}

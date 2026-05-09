/**
 * V4.7 K8 — Verbatim Scorer (haftada 1 — Pazar)
 *
 * Algoritma:
 *   - Son 7 günde role='user' olan AssistantMessage'leri al
 *   - gpt-4o-mini ile importance puanı (1-5)
 *     1 trivial / 2 normal / 3 notable / 4 big / 5 life-defining
 *   - importance ≥ 4 olanları CharacterVerbatimMemory'e ekle (kelime kelime)
 *   - Karakter başına max 200 satır limit (overflow → en az retrievedCount silinir)
 *
 * KURAL: Sadece user mesajları (assistant mesajları zaten karakterin kendi sözü).
 *
 * Lokal: curl http://localhost:3000/api/cron/verbatim-scorer
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'

export const maxDuration = 300

const PER_CHARACTER_CAP = 200

type ScoredMessage = {
  importance: number // 1-5
  topic: string // kısa konu özeti
}

async function scoreMessage(content: string): Promise<ScoredMessage | null> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Bir kullanıcı mesajına önem puanı veriyorsun. Karakter bu mesajı SONRA tartışma sırasında kelime kelime alıntılayabilir.

Skala:
1 - trivial (selamlaşma, kısa onay, "ok", "tamam")
2 - normal (günlük konu, sıradan paylaşım)
3 - notable (ilginç bir gelişme, hafif duygusal)
4 - big (önemli olay, hayat kararı, duygusal yoğun, çelişkili görüş, özel paylaşım)
5 - life-defining (büyük olay: ölüm, ayrılık, hastalık, evlilik, taşınma, iş kaybı/kazancı)

Topic: 2-4 kelimelik konu etiketi (örn: "annesi hastalandı", "iş kararı", "eski sevgili")

JSON dön:
{"importance": 1-5, "topic": "..."}`,
        },
        { role: 'user', content: content.slice(0, 1500) },
      ],
      temperature: 0.2,
      max_tokens: 100,
      response_format: { type: 'json_object' },
    })
    const text = r.choices[0]?.message?.content
    if (!text) return null
    const parsed = JSON.parse(text) as ScoredMessage
    if (!parsed.importance || parsed.importance < 1 || parsed.importance > 5) return null
    return parsed
  } catch (e) {
    console.error('[verbatim-scorer] AI fail:', e)
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

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Son 7 günde role=user olan mesajlar (karakter sohbetleri)
  const messages = await db.assistantMessage.findMany({
    where: {
      role: 'user',
      content: { not: '' },
      createdAt: { gte: sevenDaysAgo },
      conversation: { characterId: { not: null }, archived: false },
    },
    select: {
      id: true,
      content: true,
      conversationId: true,
      conversation: { select: { characterId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 500, // güvenlik tavanı
  })

  // Zaten verbatim'e alınmış mesaj id'lerini topla
  const existingIds = new Set(
    (
      await db.characterVerbatimMemory.findMany({
        where: { messageId: { in: messages.map((m) => m.id) } },
        select: { messageId: true },
      })
    ).map((v) => v.messageId)
  )

  let scored = 0
  let added = 0
  let skipped = 0

  for (const m of messages) {
    if (existingIds.has(m.id)) {
      skipped++
      continue
    }
    const characterId = m.conversation.characterId
    if (!characterId) {
      skipped++
      continue
    }
    // Çok kısa mesajları skip (selamlaşma)
    if (m.content.trim().length < 25) {
      skipped++
      continue
    }

    const score = await scoreMessage(m.content)
    scored++
    if (!score || score.importance < 4) continue

    await db.characterVerbatimMemory.create({
      data: {
        characterId,
        conversationId: m.conversationId,
        messageId: m.id,
        role: 'user',
        content: m.content,
        importance: score.importance,
        topic: score.topic,
      },
    })
    added++
  }

  // Cap kontrolü — karakter başına 200'ü geçenler
  const overflowChars = await db.characterVerbatimMemory.groupBy({
    by: ['characterId'],
    _count: { id: true },
    having: { id: { _count: { gt: PER_CHARACTER_CAP } } },
  })
  let trimmed = 0
  for (const c of overflowChars) {
    const count = c._count.id
    const excess = count - PER_CHARACTER_CAP
    if (excess <= 0) continue
    // En az retrieve edilen + en eski olanları sil
    const candidates = await db.characterVerbatimMemory.findMany({
      where: { characterId: c.characterId },
      orderBy: [{ retrievedCount: 'asc' }, { recordedAt: 'asc' }],
      take: excess,
      select: { id: true },
    })
    if (candidates.length > 0) {
      await db.characterVerbatimMemory.deleteMany({
        where: { id: { in: candidates.map((x) => x.id) } },
      })
      trimmed += candidates.length
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: messages.length,
    scored,
    added,
    skipped,
    trimmed,
    timestamp: new Date().toISOString(),
  })
}

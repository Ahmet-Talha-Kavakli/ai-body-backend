/**
 * V4.7 G3 — Contradiction Scanner
 *
 * Günlük cron. Son 7 günde extract edilen yeni fact'leri eski (archived
 * olmayan) fact'lerle karşılaştırır. Aynı topic + farklı içerik tespit
 * ederse UserContradictionFlag oluşturur.
 *
 * Karakter pre-prompt fazında bu flag'leri okuyup mesajına dolaylı
 * yansıtabilir (sistem prompt buildContradictionBlock).
 *
 * Lokal dev: curl http://localhost:3000/api/cron/contradiction-scanner
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'

export const maxDuration = 180

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Hafif konular (karakter güvenle dile getirebilir): preference, likes, dislikes
// Hassas konular (karakter sormaz, sadece anlar): identity, work, family
const LIGHT_CATEGORIES = ['preference']

interface FactPair {
  oldFact: { id: string; content: string; createdAt: Date }
  newFact: { id: string; content: string; createdAt: Date }
}

async function detectContradictions(
  oldFacts: Array<{ id: string; content: string; createdAt: Date }>,
  newFacts: Array<{ id: string; content: string; createdAt: Date }>,
  topic: string
): Promise<FactPair[]> {
  if (oldFacts.length === 0 || newFacts.length === 0) return []

  const sys = `İki listede aynı kullanıcının tercih/görüş fact'leri var. Çelişki var mı tespit et.

Eski fact'ler:
${oldFacts.map((f, i) => `${i + 1}. ${f.content}`).join('\n')}

Yeni fact'ler:
${newFacts.map((f, i) => `${i + 1}. ${f.content}`).join('\n')}

JSON formatta cevap ver:
{ "contradictions": [{ "oldIdx": 1, "newIdx": 2 }, ...] }

Sadece **net** çelişkileri belirt (örn. "yeşil seviyorum" vs "yeşilden nefret ediyorum"). Belirsiz/zaman bağlı olanları atla.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: sys }],
      max_tokens: 200,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    })
    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) return []
    const parsed = JSON.parse(raw)
    const arr = Array.isArray(parsed?.contradictions) ? parsed.contradictions : []
    const result: FactPair[] = []
    for (const c of arr) {
      const oldIdx = Number(c.oldIdx) - 1
      const newIdx = Number(c.newIdx) - 1
      const oldFact = oldFacts[oldIdx]
      const newFact = newFacts[newIdx]
      if (oldFact && newFact) result.push({ oldFact, newFact })
    }
    return result
  } catch (e) {
    console.error('[contradiction-detect]', topic, e)
    return []
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

  // AssistantMemoryFact üzerinden çalış (kullanıcı fact'leri Jarvis'in hafızası)
  const usersWithRecentFacts = await db.assistantMemoryFact.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: sevenDaysAgo }, archived: false },
    _count: true,
  })

  let flagsCreated = 0
  let usersScanned = 0

  for (const u of usersWithRecentFacts) {
    usersScanned++
    // Her kategori için tarama
    for (const cat of LIGHT_CATEGORIES) {
      const newFacts = await db.assistantMemoryFact.findMany({
        where: {
          userId: u.userId,
          category: cat,
          archived: false,
          createdAt: { gte: sevenDaysAgo },
        },
        select: { id: true, content: true, createdAt: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
      const oldFacts = await db.assistantMemoryFact.findMany({
        where: {
          userId: u.userId,
          category: cat,
          archived: false,
          createdAt: { lt: sevenDaysAgo },
        },
        select: { id: true, content: true, createdAt: true },
        take: 20,
        orderBy: { lastUsedAt: 'desc' },
      })
      if (newFacts.length === 0 || oldFacts.length === 0) continue

      const contradictions = await detectContradictions(oldFacts, newFacts, cat)
      for (const pair of contradictions) {
        // Daha önce flag'lenmiş mi?
        const existing = await db.userContradictionFlag.findFirst({
          where: {
            userId: u.userId,
            oldFactId: pair.oldFact.id,
            newFactId: pair.newFact.id,
          },
        })
        if (existing) continue

        await db.userContradictionFlag.create({
          data: {
            userId: u.userId,
            factCategory: cat,
            oldFactId: pair.oldFact.id,
            newFactId: pair.newFact.id,
            topic: pair.newFact.content.slice(0, 80),
          },
        })
        flagsCreated++
      }
    }
  }

  return NextResponse.json({ ok: true, usersScanned, flagsCreated })
}

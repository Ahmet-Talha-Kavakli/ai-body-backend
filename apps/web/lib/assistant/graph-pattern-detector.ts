/**
 * V4 Faz B — Graph Pattern Detector (haftalık)
 *
 * Kullanıcının son 14 günlük node'larından örüntüleri tespit eder.
 * Yeni `pattern` tipinde node oluşturur ve ilgili node'lara `related_to` edge çeker.
 *
 * Cron: haftada 1 (pazar gece).
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'

const MODEL = 'gpt-4o-mini'

const PATTERN_PROMPT = `Sen bir pattern detector'sın. Kullanıcının son 14 gündeki bilgi parçalarına bakıp **tekrar eden davranış örüntüleri** tespit ediyorsun.

Örüntü ne demek?
- "Stresli olunca sporu bırakıyor"
- "Pazartesi sabahları enerjisi düşük"
- "Aile konularında savunmaya geçiyor"

KURALLAR:
- Maksimum 3 örüntü çıkar.
- Her örüntü için: title (kısa), content (1-2 cümle açıklama), relatedNodeIds (örüntüye dahil olan node id'leri, max 5).
- Hiçbir örüntü yoksa: {"patterns": []}
- Örüntü ZATEN graph'ta varsa (mevcut pattern node'larına bak) duplicate ETME.

YANITINI SADECE JSON olarak ver:
{"patterns":[{"title":"...","content":"...","relatedNodeIds":["..."]}]}`

export async function detectPatternsForUser(userId: string): Promise<{
  patternsCreated: number
}> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  // Son 14 günün node'ları + mevcut pattern node'ları
  const [recentNodes, existingPatterns] = await Promise.all([
    db.memoryNode.findMany({
      where: {
        userId,
        ownerType: 'user',
        archived: false,
        createdAt: { gte: fourteenDaysAgo },
      },
      orderBy: { importance: 'desc' },
      take: 50,
      select: { id: true, type: true, title: true, content: true },
    }),
    db.memoryNode.findMany({
      where: { userId, ownerType: 'user', type: 'pattern', archived: false },
      take: 20,
      select: { title: true, content: true },
    }),
  ])

  if (recentNodes.length < 5) {
    // Yeterli sinyal yok
    return { patternsCreated: 0 }
  }

  const nodesContext = recentNodes
    .map((n) => `[${n.id}|${n.type}] ${n.title}: ${n.content}`)
    .join('\n')

  const existingContext =
    existingPatterns.length > 0
      ? existingPatterns.map((p) => `- ${p.title}: ${p.content}`).join('\n')
      : '(henüz örüntü yok)'

  const userPrompt = `MEVCUT ÖRÜNTÜLER (bunları duplicate ETME):
${existingContext}

SON 14 GÜNDEKİ BİLGİ PARÇALARI:
${nodesContext}

Yeni örüntüleri çıkar.`

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const r = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: PATTERN_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 800,
    })
    const raw = r.choices[0]?.message?.content
    if (!raw) return { patternsCreated: 0 }

    const parsed = JSON.parse(raw) as {
      patterns?: Array<{ title: string; content: string; relatedNodeIds?: string[] }>
    }
    const patterns = parsed.patterns ?? []
    if (patterns.length === 0) return { patternsCreated: 0 }

    let created = 0
    for (const p of patterns) {
      try {
        if (!p.title || !p.content) continue
        const node = await db.memoryNode.create({
          data: {
            userId,
            ownerType: 'user',
            ownerId: userId,
            type: 'pattern',
            title: p.title.slice(0, 200),
            content: p.content.slice(0, 4000),
            importance: 4,
            visibility: 'public',
            sourceType: 'inference',
          },
          select: { id: true },
        })

        // Edge'leri çek
        if (Array.isArray(p.relatedNodeIds)) {
          for (const relId of p.relatedNodeIds.slice(0, 5)) {
            try {
              await db.memoryEdge.create({
                data: {
                  userId,
                  fromNodeId: node.id,
                  toNodeId: relId,
                  relation: 'related_to',
                  strength: 0.7,
                },
              })
            } catch {
              // unique veya ref hatası — geç
            }
          }
        }
        created++
      } catch (e) {
        console.error('[pattern-detector] create fail:', e)
      }
    }

    return { patternsCreated: created }
  } catch (e) {
    console.error('[pattern-detector] failed:', e)
    return { patternsCreated: 0 }
  }
}

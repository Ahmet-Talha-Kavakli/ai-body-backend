/**
 * V4 Faz B — Graph Essence Layer (aylık)
 *
 * Kullanıcının tüm pattern + emotion + value node'larından
 * **öz** çıkarımları yapar:
 *  - "Yalnız kalmaktan korkuyor"
 *  - "Başkalarına yumuşak, kendine sert"
 *  - "Aile bağı her şeyin önünde"
 *
 * Cron: ayda 1 (ay sonu).
 * Model: gpt-4o (büyük prompt + derin sinyal — bu işte mini yetmez).
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'

const MODEL = 'gpt-4o'

const ESSENCE_PROMPT = `Sen bir derinlik analisti'sin. Kullanıcının zaman içinde biriken örüntü, duygu, değer ve inançlarına bakarak **özünü** çıkarıyorsun.

ÖZ NE DEMEK?
- Kullanıcının kim olduğunu en derinden tanımlayan 3-7 cümle
- Korkular, değerler, içsel çelişkiler
- Davranışlarının ardındaki çekirdek motivasyon

ÖRNEK ÖZ CÜMLELERİ:
- "Hayal kırıklığına uğratmaktan korkuyor — bu yüzden 'hayır' demekte zorlanıyor"
- "Aile bağı kimliğinin merkezinde — kararlarını ailesine etkisini düşünerek alıyor"
- "Başkalarına şefkatli, kendine acımasız"

KURALLAR:
- Bir önceki "öz" varsa, onu silme — geliştir veya yenisini ekle.
- Klişe yazma. "Sevgiyi hak ediyor" tarzı boş cümleler yasak.
- Her cümle SOMUT olsun, kullanıcının gerçek davranışına dayalı.
- Maksimum 5 öz cümlesi.
- Hiçbir derin örüntü yoksa: {"essence": []}

YANITINI SADECE JSON olarak ver:
{"essence":[{"title":"kısa başlık","content":"detaylı cümle","supportingNodeIds":["..."]}]}`

export async function generateEssenceForUser(userId: string): Promise<{
  essenceCreated: number
}> {
  // Pattern + emotion + value + belief node'ları
  const sourceNodes = await db.memoryNode.findMany({
    where: {
      userId,
      ownerType: 'user',
      archived: false,
      type: { in: ['pattern', 'emotion', 'value', 'belief', 'trauma'] },
    },
    orderBy: { importance: 'desc' },
    take: 60,
    select: { id: true, type: true, title: true, content: true },
  })

  if (sourceNodes.length < 8) {
    return { essenceCreated: 0 }
  }

  // Mevcut öz cümleleri
  const existingEssence = await db.memoryNode.findMany({
    where: { userId, ownerType: 'user', type: 'value', archived: false },
    take: 10,
    select: { title: true, content: true },
  })

  const sourceContext = sourceNodes
    .map((n) => `[${n.id}|${n.type}] ${n.title}: ${n.content}`)
    .join('\n')
  const existingContext =
    existingEssence.length > 0
      ? existingEssence.map((e) => `- ${e.title}: ${e.content}`).join('\n')
      : '(henüz öz çıkarımı yok)'

  const userPrompt = `MEVCUT ÖZ ÇIKARIMLARI:
${existingContext}

KULLANICININ ÖRÜNTÜLERİ + DUYGULARI + DEĞERLERİ:
${sourceContext}

Bu kişinin ÖZÜNÜ çıkar.`

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const startedAt = Date.now()
    const r = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: ESSENCE_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 1200,
    })
    const raw = r.choices[0]?.message?.content
    if (!raw) return { essenceCreated: 0 }

    const parsed = JSON.parse(raw) as {
      essence?: Array<{ title: string; content: string; supportingNodeIds?: string[] }>
    }
    const items = parsed.essence ?? []

    let created = 0
    for (const item of items) {
      try {
        if (!item.title || !item.content) continue
        const node = await db.memoryNode.create({
          data: {
            userId,
            ownerType: 'user',
            ownerId: userId,
            type: 'value',
            title: item.title.slice(0, 200),
            content: item.content.slice(0, 4000),
            importance: 5, // Öz katman = en yüksek önem
            visibility: 'inner_circle',
            sourceType: 'inference',
          },
          select: { id: true },
        })

        if (Array.isArray(item.supportingNodeIds)) {
          for (const relId of item.supportingNodeIds.slice(0, 5)) {
            try {
              await db.memoryEdge.create({
                data: {
                  userId,
                  fromNodeId: node.id,
                  toNodeId: relId,
                  relation: 'related_to',
                  strength: 0.8,
                },
              })
            } catch {}
          }
        }
        created++
      } catch (e) {
        console.error('[essence] create fail:', e)
      }
    }

    // Maliyet logla
    try {
      const usage = r.usage
      await db.aiCallLog.create({
        data: {
          userId,
          model: MODEL,
          provider: 'openai',
          purpose: 'pattern',
          inputTokens: usage?.prompt_tokens ?? 0,
          outputTokens: usage?.completion_tokens ?? 0,
          // gpt-4o: in $2.50/M, out $10/M
          costUsd:
            ((usage?.prompt_tokens ?? 0) * 2.5) / 1_000_000 +
            ((usage?.completion_tokens ?? 0) * 10) / 1_000_000,
          durationMs: Date.now() - startedAt,
          metadata: { essenceCreated: created },
        },
      })
    } catch {}

    return { essenceCreated: created }
  } catch (e) {
    console.error('[essence] failed:', e)
    return { essenceCreated: 0 }
  }
}

/**
 * Memory Extractor — kullanıcı mesajı + AI cevabı sonrası arka planda çalışır.
 * gpt-4o-mini ile "bu mesajda hatırlanması gereken fact var mı?" sorar.
 * Çıkan fact'leri AssistantMemoryFact'e ekler.
 *
 * Async fire-and-forget: kullanıcıyı bekletmez.
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'

const EXTRACT_PROMPT = `Sen bir memory extraction servisisin. Kullanıcı mesajından hatırlanması gereken fact'leri çıkar.

Kategoriler:
- identity: yaş, cinsiyet, kronik hastalık, alerji, kullanılan ilaç, mesleki bilgi
- preference: vegan, kafein hassasiyeti, uyku tercihi, tonlama tercihi
- pattern: davranış kalıbı (örn. "X yedikten sonra reflu", "Pazartesi geç yatma")
- event: önemli yaşam olayı (yeni iş, kayıp, doğum, taşınma)
- promise: kullanıcının verdiği söz (örn. "kafein bırakacağım")

Kurallar:
- Sadece **ÖNEMLİ ve KALICI** olanları çıkar. "300ml su içtim" geçici, çıkarma.
- Her fact KISA olsun (1 cümle, 100 char altı).
- Kullanıcının hakkında 3. tekil şahıs gibi yaz: "Vegan", "Babası kanser", "Kafein hassasiyeti var"
- Emin değilsen ÇIKARMA. Boş array dön.
- Maksimum 3 fact döndür (genelde 0-1 fact olur).

Yanıtın SADECE şu JSON formatında olsun:
{"facts": [{"category": "identity|preference|pattern|event|promise", "content": "kısa fact"}]}

Yanıtla başka açıklama YAPMA, sadece JSON dön.`

export interface ExtractedFact {
  category: 'identity' | 'preference' | 'pattern' | 'event' | 'promise'
  content: string
}

/**
 * Kullanıcı + AI mesaj çiftinden fact'leri çıkar ve DB'ye ekle.
 * Arka planda çalışacak şekilde tasarlandı (await yapma!).
 */
export async function extractAndStoreFacts(args: {
  userId: string
  userMessage: string
  aiResponse: string
  sourceMessageId: string
}): Promise<ExtractedFact[]> {
  const { userId, userMessage, aiResponse, sourceMessageId } = args
  try {
    const openai = new OpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: EXTRACT_PROMPT },
        {
          role: 'user',
          content: `KULLANICI: "${userMessage}"\n\nAI: "${aiResponse.slice(0, 800)}"`,
        },
      ],
    })

    const text = completion.choices[0]?.message?.content?.trim() ?? '{}'
    let parsed: { facts?: ExtractedFact[] }
    try {
      parsed = JSON.parse(text)
    } catch {
      return []
    }
    const facts = (parsed.facts ?? []).filter(
      (f) =>
        f &&
        f.content &&
        ['identity', 'preference', 'pattern', 'event', 'promise'].includes(f.category)
    )
    if (!facts.length) return []

    // Mevcut fact'leri çek (duplikasyon kontrolü için)
    const existing = await db.assistantMemoryFact.findMany({
      where: { userId, archived: false },
      select: { id: true, content: true, category: true },
    })
    const existingNorm = new Set(
      existing.map((e) => `${e.category}|${e.content.toLowerCase().trim()}`)
    )

    const toInsert = facts
      .filter((f) => !existingNorm.has(`${f.category}|${f.content.toLowerCase().trim()}`))
      .slice(0, 3)
    if (!toInsert.length) return []

    await db.assistantMemoryFact.createMany({
      data: toInsert.map((f) => ({
        userId,
        category: f.category,
        content: f.content.slice(0, 200),
        confidence: 0.85,
        sourceMessageId,
      })),
    })
    return toInsert
  } catch (e) {
    // Sessiz fail — kullanıcıyı etkilemesin
    console.error('[memory-extract]', e)
    return []
  }
}

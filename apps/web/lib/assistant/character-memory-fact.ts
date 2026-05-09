/**
 * V4.5 Faz 9A — Karakter Hafıza Fact Extractor
 *
 * Sorun: Mia "annem son zamanlarda babamdan bahsediyor, üzgünüm" dedi,
 * 12 mesaj sonra Talha "hala babanı düşünüyor musun?" dediğinde Mia
 * hatırlamıyor. Çünkü context window düştü, hiçbir kalıcı yere yazılmadı.
 *
 * Çözüm: Her AI mesajından sonra arka planda extraction çağrısı.
 * gpt-4o-mini ile (ucuz + hızlı), kritik bilgileri yakalar:
 *   - karakter kendi hayatına dair şey söyledi mi (annesi, kardeşi, iş, sınav)
 *   - kullanıcı önemli bir şey paylaştı mı (kayıp, hastalık, mutluluk)
 *   - karakter söz verdi mi
 *   - karakter sır paylaştı mı
 *
 * Stream başında loadCharacterMemoryFacts() çekilir, system prompt'a inject.
 */

import { db } from '@/lib/db/client'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface ExtractedFact {
  subject: 'character' | 'user' | 'shared'
  category:
    | 'family'
    | 'work'
    | 'feeling'
    | 'event'
    | 'preference'
    | 'promise'
    | 'secret'
    | 'shared_event'
    | 'user_speech_pattern'
    | 'important_date'
    | 'other'
  content: string
  importance: 1 | 2 | 3 | 4 | 5
}

const EXTRACTION_PROMPT = `Sen bir hafıza çıkarma motorusun. İki konuşmacı arasındaki son mesaj parçasından KALICI HATIRLANMASI GEREKEN bilgileri JSON olarak döndür.

KURALLAR:
- Sadece somut, kalıcı bilgileri yakala. "Bugün üzgünüm" geçici, kayıt etme. "Annem hasta" kalıcı, kaydet.
- Karakter kendi hayatından bir şey paylaştıysa → subject="character"
- Kullanıcı kendi hayatından bir şey paylaştıysa → subject="user"
- İkisi arasında olan bir şeyse (söz, anlaşma, ortak deneyim) → subject="shared"
- Hiç fact yoksa boş array dön.
- Maksimum 3 fact.

importance ölçeği:
1 = trivial (favori renk vb)
2 = normal (iş arkadaşı adı)
3 = notable (yeni ev aldı, sınava giriyor)
4 = big (yakını hasta, ayrılık, taşınma)
5 = life-defining (ölüm, evlilik, doğum, ciddi hastalık)

Çıktı formatı (sadece JSON, başka şey yok):
{"facts": [{"subject":"...", "category":"...", "content":"...", "importance":N}]}

KATEGORİLER:
- family — aile bireyleri
- work — iş, meslek
- feeling — kalıcı duygu/durum
- event — yaşanan olay
- preference — zevk, tercih
- promise — verilen söz
- secret — paylaşılan sır
- shared_event — IKISI BIRLIKTE yaşadığı olay (örn. "ilk kafede buluştuk", "geçen şu konuyu konuştuk") — subject="shared"
- user_speech_pattern — KULLANICININ sık kullandığı kelime/ifade ("valla", "abi", "ya"). subject="user". content: "Talha 'valla' kelimesini sık kullanıyor"
- important_date — ÖNEMLİ TARİH. content içinde MUTLAKA gün/ay olmalı format "DD/MM" veya "DD.MM" (örn. "Talha'nın doğum günü 15/03"). subject="user" veya "shared"
- other`

interface ExtractInput {
  characterName: string
  userName: string | null
  recentExchange: Array<{ role: 'user' | 'assistant'; content: string }>
}

export async function extractFacts(input: ExtractInput): Promise<ExtractedFact[]> {
  const conversation = input.recentExchange
    .map(
      (m) =>
        `${m.role === 'user' ? (input.userName ?? 'Kullanıcı') : input.characterName}: ${m.content}`
    )
    .join('\n')

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        { role: 'user', content: conversation },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_tokens: 400,
    })

    const text = res.choices[0]?.message?.content
    if (!text) return []
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed.facts)) return []

    return parsed.facts
      .filter(
        (f: any) =>
          f &&
          typeof f.content === 'string' &&
          ['character', 'user', 'shared'].includes(f.subject) &&
          typeof f.importance === 'number'
      )
      .slice(0, 3)
      .map((f: any) => ({
        subject: f.subject,
        category: f.category || 'other',
        content: String(f.content).slice(0, 500),
        importance: Math.max(1, Math.min(5, Math.round(f.importance))) as 1 | 2 | 3 | 4 | 5,
      }))
  } catch (e) {
    console.warn('[memory-fact] extract fail', e)
    return []
  }
}

/**
 * Yeni mesaj çiftinden fact çıkar ve DB'ye yaz. Arka planda çağrılır,
 * stream akışını bloklamaz.
 */
export async function extractAndSaveFacts(args: {
  userId: string
  characterId: string
  characterName: string
  userName: string | null
  recentExchange: Array<{ role: 'user' | 'assistant'; content: string }>
  sourceMessageId?: string
}): Promise<void> {
  const facts = await extractFacts({
    characterName: args.characterName,
    userName: args.userName,
    recentExchange: args.recentExchange,
  })
  if (facts.length === 0) return

  await Promise.all(
    facts.map((f) =>
      db.characterMemoryFact
        .create({
          data: {
            userId: args.userId,
            characterId: args.characterId,
            subject: f.subject,
            category: f.category,
            content: f.content,
            importance: f.importance,
            sourceMessageId: args.sourceMessageId,
          },
        })
        .catch(() => {})
    )
  )
}

/**
 * Stream başında çağrılır. Karakter ile ilgili kalıcı fact'leri yükler.
 * - Önemli olanlar (importance >= 3) önce
 * - Son kullanılma sırası bonus
 * - Maksimum 12 fact, system prompt'u şişirme
 *
 * V4.5 Faz 11C — Bilinçli unutkanlık:
 *   forgetfulness yüksek olan karakter düşük öncelik fact'ları (importance 1-2)
 *   zaman zaman "unutur" — prompt'a inject edilmez. Kritik şeyler (3-5) hep yüklü.
 */
export async function loadCharacterMemoryFacts(args: {
  userId: string
  characterId: string
  limit?: number
  forgetfulness?: number // 0-1, default 0.05
}): Promise<
  Array<{
    subject: string
    category: string
    content: string
    importance: number
    createdAt: Date
  }>
> {
  const limit = args.limit ?? 12
  const forgetfulness = args.forgetfulness ?? 0.05

  const facts = await db.characterMemoryFact.findMany({
    where: {
      userId: args.userId,
      characterId: args.characterId,
      archived: false,
    },
    orderBy: [{ importance: 'desc' }, { lastUsedAt: 'desc' }],
    take: limit * 2, // ekstra çek, unutulanlar için tampon
    select: {
      subject: true,
      category: true,
      content: true,
      importance: true,
      createdAt: true,
    },
  })

  // Düşük öncelik fact'leri forgetfulness ile filtrele
  // importance 1: forgetfulness * 2 olasılıkla unut (max %30)
  // importance 2: forgetfulness olasılıkla unut
  // importance >= 3: hep yüklü
  const remembered = facts.filter((f) => {
    if (f.importance >= 3) return true
    const forgetChance = f.importance === 1 ? Math.min(forgetfulness * 2, 0.3) : forgetfulness
    return Math.random() > forgetChance
  })

  return remembered.slice(0, limit)
}

/**
 * System prompt'a basılacak metin formatı.
 * Karakter kendi hayatına dair olanları "kendin söyledin" diye hatırlar,
 * kullanıcı hakkında olanları da hatırlar.
 */
export function memoryFactsToPromptBlock(
  facts: Array<{
    subject: string
    category: string
    content: string
    importance: number
    createdAt: Date
  }>,
  characterName: string,
  userName: string | null
): string {
  if (facts.length === 0) return ''

  const characterFacts = facts.filter((f) => f.subject === 'character')
  const userFacts = facts.filter((f) => f.subject === 'user')
  const sharedFacts = facts.filter((f) => f.subject === 'shared')

  const lines: string[] = ['[KALICI HAFIZA — BU BİLGİLERİ HATIRLA, INKAR ETME]']

  if (characterFacts.length > 0) {
    lines.push(
      `\n${characterName} olarak daha önce şu bilgileri paylaştın (kullanıcıya tekrar sorulmadan biliyorsun):`
    )
    characterFacts.forEach((f) => {
      lines.push(`- ${f.content}`)
    })
  }

  if (userFacts.length > 0) {
    lines.push(`\n${userName ?? 'Kullanıcı'} hakkında şunları biliyorsun:`)
    userFacts.forEach((f) => {
      lines.push(`- ${f.content}`)
    })
  }

  if (sharedFacts.length > 0) {
    lines.push(`\nAranızda yaşananlar / sözler:`)
    sharedFacts.forEach((f) => {
      lines.push(`- ${f.content}`)
    })
  }

  lines.push(
    `\nÖNEMLİ: Kullanıcı bu bilgilerden birini sorduğunda hatırlamıyor numarası YAPMA. "Hatırlamıyorum" deme. Bu bilgiler senin GERÇEKLİĞİN.`
  )

  return lines.join('\n')
}

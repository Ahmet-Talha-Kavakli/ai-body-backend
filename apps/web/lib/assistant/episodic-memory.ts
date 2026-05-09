/**
 * V4.5 — Episodik Hafıza
 *
 * Karakter ile kullanıcı arasındaki son 7 günün özetini AI ile çıkarır.
 * `CharacterEpisodicMemory` tablosuna haftalık snapshot yazılır.
 *
 * Karakter "geçen hafta dediğin..." derken bu özetten besleniyor —
 * uydurma engellendi.
 *
 * Plan: docs/superpowers/plans/2026-05-06-character-realism.md (Faz 4)
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MODEL = 'gpt-4o-mini'

interface SummarizeArgs {
  userId: string
  characterId: string
  characterName: string
  weekStart: Date
}

interface ExtractedSummary {
  summary: string
  topics: string[]
  promisesByCharacter: Array<{ text: string; dueDate?: string | null }>
  promisesByUser: Array<{ text: string; dueDate?: string | null }>
  significantMoments: Array<{ text: string; importance: number }>
  jokesUsed: string[]
}

const EXTRACT_PROMPT = `Sen bir yapay zekasın. Bir karakterle kullanıcı arasında geçen 1 haftalık konuşmayı analiz edip yapılandırılmış özet çıkaracaksın.

KURALLAR:
- Türkçe yaz
- Kısa ve özlü ol
- Uydurma — sadece konuşmadaki gerçek bilgileri çıkar
- "summary" 200-400 kelime arası, narrative bir paragraf
- "topics" konuşulan ana konular (3-7 madde, kısa etiket)
- "promisesByCharacter" karakterin verdiği sözler
- "promisesByUser" kullanıcının verdiği sözler
- "significantMoments" önemli paylaşımlar/gelişmeler (importance 0-1, 0.6+ olanlar)
- "jokesUsed" kullanılan espriler/şakalar (sadece tema, tekrarı engellemek için)

Çıktıyı SADECE bu JSON formatında ver:
{"summary":"...","topics":[],"promisesByCharacter":[],"promisesByUser":[],"significantMoments":[],"jokesUsed":[]}`

/**
 * Bir kullanıcı × karakter için verilen haftaya ait konuşmaları özetler.
 * Mesaj yoksa null döner.
 */
export async function summarizeWeekForCharacter(
  args: SummarizeArgs
): Promise<ExtractedSummary | null> {
  const weekEnd = new Date(args.weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Bu karaktere ait conversation
  const conversation = await db.assistantConversation.findFirst({
    where: { userId: args.userId, characterId: args.characterId },
    select: { id: true },
  })
  if (!conversation) return null

  const messages = await db.assistantMessage.findMany({
    where: {
      conversationId: conversation.id,
      createdAt: { gte: args.weekStart, lt: weekEnd },
      role: { in: ['user', 'assistant'] },
    },
    orderBy: { createdAt: 'asc' },
    take: 200,
    select: { role: true, content: true, createdAt: true },
  })

  if (messages.length < 4) return null // çok az mesaj varsa özet çıkarmaya değmez

  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'Kullanıcı' : args.characterName}: ${m.content}`)
    .join('\n')

  // Token koruması — çok uzunsa kırp (yaklaşık 8000 token cap)
  const truncated = transcript.length > 24000 ? transcript.slice(-24000) : transcript

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: EXTRACT_PROMPT },
        { role: 'user', content: truncated },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800,
      temperature: 0.3,
    })
    const raw = response.choices[0]?.message?.content
    if (!raw) return null
    const parsed = JSON.parse(raw) as ExtractedSummary
    return parsed
  } catch (err) {
    console.warn('[episodic-memory] summarize failed:', err)
    return null
  }
}

/**
 * Hafta başı tarihini hesapla (Pazartesi 00:00 UTC).
 */
export function weekStartOf(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  const dayOfWeek = d.getUTCDay() // 0 Pazar, 1 Pazartesi
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  d.setUTCDate(d.getUTCDate() + diff)
  return d
}

/**
 * Karakter için son N haftanın özetlerini çek (en yeni en başta).
 */
export async function loadRecentEpisodes(
  userId: string,
  characterId: string,
  weeks = 2
): Promise<
  Array<{
    weekStart: Date
    summary: string
    topics: string[]
    jokesUsed: string[]
    promisesByCharacter: any
    promisesByUser: any
  }>
> {
  const earliest = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000)
  const rows = await db.characterEpisodicMemory.findMany({
    where: {
      userId,
      characterId,
      weekStartDate: { gte: earliest },
    },
    orderBy: { weekStartDate: 'desc' },
    take: weeks,
    select: {
      weekStartDate: true,
      summary: true,
      topicsDiscussed: true,
      jokesUsed: true,
      promisesByCharacter: true,
      promisesByUser: true,
    },
  })

  return rows.map((r) => ({
    weekStart: r.weekStartDate,
    summary: r.summary,
    topics: r.topicsDiscussed,
    jokesUsed: r.jokesUsed,
    promisesByCharacter: r.promisesByCharacter,
    promisesByUser: r.promisesByUser,
  }))
}

/**
 * Episodik hafızayı system prompt'a uygun bloğa dönüştür.
 */
export function buildEpisodicMemoryBlock(
  episodes: Awaited<ReturnType<typeof loadRecentEpisodes>>
): string {
  if (episodes.length === 0) return ''

  const lines: string[] = ['[GEÇEN HAFTALARIN ÖZETİ — UYDURMA YASAK]']

  for (const ep of episodes) {
    const dateStr = ep.weekStart.toISOString().split('T')[0]
    lines.push(`\nHafta başı ${dateStr}:`)
    // Özetin ilk 600 karakterini al — token bütçesi
    const summarySnippet = ep.summary.length > 600 ? ep.summary.slice(0, 600) + '…' : ep.summary
    lines.push(summarySnippet)
    if (ep.topics.length > 0) {
      lines.push(`Konular: ${ep.topics.slice(0, 5).join(', ')}`)
    }
    if (Array.isArray(ep.promisesByCharacter) && ep.promisesByCharacter.length > 0) {
      lines.push(`Verdiğin sözler:`)
      for (const p of ep.promisesByCharacter.slice(0, 3) as Array<{ text: string }>) {
        lines.push(`  - "${p.text}"`)
      }
    }
    if (Array.isArray(ep.promisesByUser) && ep.promisesByUser.length > 0) {
      lines.push(`Kullanıcının verdiği sözler:`)
      for (const p of ep.promisesByUser.slice(0, 3) as Array<{ text: string }>) {
        lines.push(`  - "${p.text}"`)
      }
    }
    if (ep.jokesUsed.length > 0) {
      lines.push(`Tekrar etmediğin espriler: ${ep.jokesUsed.slice(0, 4).join(', ')}`)
    }
  }

  lines.push('')
  lines.push(
    'KURAL: "Geçen hafta dediğin..." derken yukarıdaki özetlerden referans ver. Burada GEÇMEYEN bir konuyu hatırlıyormuş gibi yapma.'
  )

  return lines.join('\n') + '\n\n'
}

/**
 * Cron'dan çağrılan ana iş — tüm aktif kullanıcı × karakter çiftleri için
 * geçen haftanın özetini üretir ve DB'ye yazar.
 */
export async function runEpisodicSummarizer(): Promise<{
  processed: number
  written: number
  skipped: number
  errors: number
}> {
  const lastWeekStart = new Date()
  lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7)
  const weekStart = weekStartOf(lastWeekStart)

  // Aktif karakter listesi
  const activePairs = await db.character.findMany({
    where: { status: { in: ['active', 'cold', 'recovering'] } },
    select: { id: true, name: true, userId: true },
  })

  let written = 0
  let skipped = 0
  let errors = 0

  for (const c of activePairs) {
    try {
      // Bu hafta için zaten yazıldı mı?
      const existing = await db.characterEpisodicMemory.findUnique({
        where: {
          userId_characterId_weekStartDate: {
            userId: c.userId,
            characterId: c.id,
            weekStartDate: weekStart,
          },
        },
        select: { id: true },
      })
      if (existing) {
        skipped++
        continue
      }

      const summary = await summarizeWeekForCharacter({
        userId: c.userId,
        characterId: c.id,
        characterName: c.name,
        weekStart,
      })
      if (!summary) {
        skipped++
        continue
      }

      await db.characterEpisodicMemory.create({
        data: {
          userId: c.userId,
          characterId: c.id,
          weekStartDate: weekStart,
          summary: summary.summary,
          topicsDiscussed: summary.topics,
          promisesByCharacter: summary.promisesByCharacter as any,
          promisesByUser: summary.promisesByUser as any,
          significantMoments: summary.significantMoments as any,
          jokesUsed: summary.jokesUsed,
        },
      })
      written++
    } catch (err) {
      console.error('[episodic-summarizer] error for', c.name, err)
      errors++
    }
  }

  return { processed: activePairs.length, written, skipped, errors }
}

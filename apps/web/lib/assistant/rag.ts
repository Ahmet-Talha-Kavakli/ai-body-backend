/**
 * Retrieval-Augmented Generation — pgvector ile semantic search.
 *
 * 1. Mesaj kaydedilince embed et, AssistantMessage.embedding'e yaz (async).
 * 2. Yeni mesaj geldiğinde, query'yi embed et + top-K eski mesajı çek + system prompt'a ekle.
 *
 * Model: text-embedding-3-small ($0.02 / 1M token, 1536 boyut)
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'

const EMBED_MODEL = 'text-embedding-3-small'
const TOP_K = 6

/**
 * Bir mesajın embedding'ini üret ve DB'ye yaz.
 * Arka planda çalışsın diye fire-and-forget.
 *
 * Hata olursa 1 kez yeniden dener (embedding API geçici hata atabilir).
 */
export async function embedAndStoreMessage(messageId: string, content: string): Promise<void> {
  if (!content?.trim()) return
  const trimmed = content.slice(0, 8000)

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const openai = new OpenAI()
      const res = await openai.embeddings.create({ model: EMBED_MODEL, input: trimmed })
      const vector = res.data[0]?.embedding
      if (!vector) return
      const literal = '[' + vector.join(',') + ']'
      await db.$executeRawUnsafe(
        `UPDATE "AssistantMessage" SET embedding = $1::vector WHERE id = $2`,
        literal,
        messageId
      )
      return
    } catch (e) {
      if (attempt === 0) {
        // 800ms bekle ve tekrar dene
        await new Promise((r) => setTimeout(r, 800))
        continue
      }
      console.error('[rag/embed/failed-after-retry]', e)
    }
  }
}

/**
 * Embedding'i olmayan mesajları topluca tamamlamak için (background fallback).
 * Cron veya admin endpoint'ten çağrılabilir.
 */
export async function backfillMissingEmbeddings(userId: string, limit = 50): Promise<number> {
  const rows = await db.$queryRawUnsafe<Array<{ id: string; content: string }>>(
    `
    SELECT m.id, m.content
    FROM "AssistantMessage" m
    JOIN "AssistantConversation" c ON c.id = m."conversationId"
    WHERE c."userId" = $1 AND m.embedding IS NULL AND m.content IS NOT NULL AND m.content <> ''
    ORDER BY m."createdAt" DESC
    LIMIT $2
    `,
    userId,
    limit
  )
  let done = 0
  for (const r of rows) {
    try {
      await embedAndStoreMessage(r.id, r.content)
      done++
    } catch {}
  }
  return done
}

/**
 * Kullanıcının query'sine en yakın K mesajı (semantic search) döner.
 * Mevcut conversation'daki mesajlar hariç tutulur (zaten history'de varlar).
 */
export async function searchSimilarMessages(args: {
  userId: string
  query: string
  excludeConversationId?: string
  limit?: number
}): Promise<
  Array<{
    content: string
    role: string
    conversationTitle: string
    createdAt: Date
    score: number
  }>
> {
  const { userId, query, excludeConversationId, limit = TOP_K } = args
  if (!query?.trim()) return []
  try {
    const openai = new OpenAI()
    const res = await openai.embeddings.create({
      model: EMBED_MODEL,
      input: query.slice(0, 4000),
    })
    const vector = res.data[0]?.embedding
    if (!vector) return []
    const literal = '[' + vector.join(',') + ']'

    // Cosine distance (lower = better). Top K.
    const rows = await db.$queryRawUnsafe<
      Array<{
        content: string
        role: string
        title: string
        createdAt: Date
        distance: number
      }>
    >(
      `
      SELECT m.content, m.role, c.title, m."createdAt",
        m.embedding <=> $1::vector AS distance
      FROM "AssistantMessage" m
      JOIN "AssistantConversation" c ON c.id = m."conversationId"
      WHERE c."userId" = $2
        AND m.embedding IS NOT NULL
        ${excludeConversationId ? 'AND m."conversationId" != $4' : ''}
      ORDER BY distance ASC
      LIMIT $3
      `,
      literal,
      userId,
      limit,
      ...(excludeConversationId ? [excludeConversationId] : [])
    )

    return rows
      .map((r) => ({
        content: r.content,
        role: r.role,
        conversationTitle: r.title,
        createdAt: r.createdAt,
        score: 1 - r.distance, // similarity (0..1)
      }))
      .filter((r) => r.score > 0.6) // 0.3 çok geniştı, alakasız mesajlar geliyordu
  } catch (e) {
    console.error('[rag/search]', e)
    return []
  }
}

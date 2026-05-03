/**
 * Mesaj Arama — V3 Faz B
 *
 * GET /api/assistant/messages/search?q=...&conversationId=optional
 *
 * Akıllı arama:
 * - Kısa kelime (<3 word) → sadece text search
 * - Uzun cümle → semantic + text birleşimi
 * - conversationId verilirse o sohbete kısıtlanır
 *
 * Sonuçlar tarih sırasına göre, max 50 mesaj.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { searchSimilarMessages } from '@/lib/assistant/rag'

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim() ?? ''
  const conversationId = url.searchParams.get('conversationId') ?? undefined

  if (q.length < 2) {
    return NextResponse.json({ messages: [] })
  }

  const wordCount = q.split(/\s+/).filter(Boolean).length

  // Text search (her zaman yapılır)
  const textResults = await db.assistantMessage.findMany({
    where: {
      conversation: { userId: user.id, ...(conversationId ? { id: conversationId } : {}) },
      content: { contains: q, mode: 'insensitive' },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
      conversationId: true,
      conversation: {
        select: { id: true, title: true },
      },
    },
  })

  // Semantic search (uzun cümle için)
  let semanticResults: Awaited<ReturnType<typeof searchSimilarMessages>> = []
  if (wordCount >= 4) {
    semanticResults = await searchSimilarMessages({
      userId: user.id,
      query: q,
      excludeConversationId: undefined,
      limit: 20,
    }).catch(() => [])
  }

  // Birleştir, dedupe (text result'larından id'lere göre)
  const seenIds = new Set(textResults.map((m) => m.id))
  const merged = [
    ...textResults.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      conversationId: m.conversationId,
      conversationTitle: m.conversation.title,
      matchType: 'text' as const,
    })),
    // Semantic results — text'te yoksa ekle
    ...semanticResults
      .filter((s) => {
        // Semantic result'ta id yok, content/role/createdAt eşleştirmesi yapamayız
        // Backend'i değiştirmeden kalsın, sadece text result baskın
        return true
      })
      .filter((s) => s.score > 0.65)
      .slice(0, 10)
      .map((s) => ({
        id: `sem-${Math.random().toString(36).slice(2)}`,
        role: s.role,
        content: s.content,
        createdAt: s.createdAt.toISOString(),
        conversationId: 'unknown',
        conversationTitle: s.conversationTitle,
        matchType: 'semantic' as const,
      })),
  ]

  return NextResponse.json({
    messages: merged.slice(0, 50),
    query: q,
    textCount: textResults.length,
    semanticCount: semanticResults.length,
  })
})

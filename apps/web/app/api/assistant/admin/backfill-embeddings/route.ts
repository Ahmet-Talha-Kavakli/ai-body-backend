/**
 * Tek seferlik: var olan AssistantMessage'ların embedding'lerini doldur.
 * Sadece auth'lu kullanıcının kendi mesajlarını işler.
 * GET /api/assistant/admin/backfill-embeddings
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { embedAndStoreMessage } from '@/lib/assistant/rag'

export const GET = withAuth(async (_req, { user }) => {
  const messages = await db.assistantMessage.findMany({
    where: {
      conversation: { userId: user.id },
    },
    select: { id: true, content: true },
    take: 500,
  })

  let processed = 0
  for (const m of messages) {
    if (!m.content?.trim()) continue
    await embedAndStoreMessage(m.id, m.content)
    processed++
    // Rate limit korumak için 100ms gecikme
    await new Promise((r) => setTimeout(r, 100))
  }

  return NextResponse.json({ ok: true, processed })
})

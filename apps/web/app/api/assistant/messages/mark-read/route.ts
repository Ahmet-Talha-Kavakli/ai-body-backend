/**
 * Mesajları Okundu İşaretle — V3 Faz B
 *
 * POST /api/assistant/messages/mark-read
 *   Body: { conversationId, lastReadMessageId? }
 *
 * Verilen conversation'daki AI mesajlarını "okundu" olarak işaretler.
 * Mobile uygulama sohbet ekranı açıldığında çağırır.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json().catch(() => ({}))) as {
    conversationId?: string
    lastReadMessageId?: string
  }

  if (!body.conversationId) {
    return NextResponse.json({ error: 'missing_conversation' }, { status: 400 })
  }

  // Conversation kullanıcının mı?
  const conv = await db.assistantConversation.findFirst({
    where: { id: body.conversationId, userId: user.id },
    select: { id: true },
  })
  if (!conv) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // AI'nın okunmamış mesajlarını okundu olarak işaretle
  const result = await db.assistantMessage.updateMany({
    where: {
      conversationId: body.conversationId,
      role: 'assistant',
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  })

  return NextResponse.json({ marked: result.count })
})

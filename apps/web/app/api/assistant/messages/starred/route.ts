/**
 * Favori Anlarımız — V3 Faz B
 *
 * GET /api/assistant/messages/starred
 *
 * Yıldızlanmış mesajları döner — kullanıcının ve AI'nın işaretlediği önemli anlar.
 * Her mesajla birlikte: konuşma başlığı, tarih, hangi tarafın yıldızladığı.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const messages = await db.assistantMessage.findMany({
    where: {
      conversation: { userId: user.id },
      OR: [{ starredAt: { not: null } }, { isPinned: true }],
    },
    orderBy: { starredAt: 'desc' },
    take: 200,
    select: {
      id: true,
      role: true,
      content: true,
      starredAt: true,
      starredBy: true,
      createdAt: true,
      conversationId: true,
      conversation: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      starredAt: m.starredAt?.toISOString() ?? m.createdAt.toISOString(),
      starredBy: m.starredBy ?? 'user',
      createdAt: m.createdAt.toISOString(),
      conversationId: m.conversationId,
      conversationTitle: m.conversation.title,
    })),
  })
})

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import {
  shouldShowBriefing,
  loadBriefingContext,
  generateBriefing,
} from '@/lib/assistant/morning-briefing'

// GET /api/assistant/conversations?archived=true
export const GET = withAuth(async (req: NextRequest, { user }) => {
  const archived = req.nextUrl.searchParams.get('archived') === 'true'
  const conversations = await db.assistantConversation.findMany({
    // V4: characterId null = Jarvis sohbeti. Karakter sohbetleri V3 listesinde görünmez.
    where: { userId: user.id, archived, characterId: null },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { messages: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true, role: true, createdAt: true },
      },
    },
  })
  return NextResponse.json({ conversations })
})

// POST /api/assistant/conversations — yeni sohbet
export const POST = withAuth(async (_req: NextRequest, { user }) => {
  const conversation = await db.assistantConversation.create({
    data: { userId: user.id },
  })

  // Sabah briefing — saat 5-12 arası ve son mesajdan 6+ saat geçtiyse,
  // AI ilk mesajı kendi atar (gerçek arkadaş hissi için).
  try {
    const [lastMessage, userRow] = await Promise.all([
      db.assistantMessage.findFirst({
        where: { conversation: { userId: user.id } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      db.user.findUnique({ where: { id: user.id }, select: { timezone: true } }),
    ])
    const now = new Date()
    if (shouldShowBriefing(now, lastMessage?.createdAt ?? null, userRow?.timezone)) {
      const ctx = await loadBriefingContext(user.id)
      if (ctx) {
        const briefingText = await generateBriefing(ctx)
        if (briefingText) {
          await db.assistantMessage.create({
            data: {
              conversationId: conversation.id,
              role: 'assistant',
              content: briefingText,
            },
          })
          await db.assistantConversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
          })
        }
      }
    }
  } catch (e) {
    console.error('[conversations/POST/briefing]', e)
  }

  return NextResponse.json(conversation)
})

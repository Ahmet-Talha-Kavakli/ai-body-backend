import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

// GET /api/ai/dream/conversations — listele
export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const conversations = await db.dreamConversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
      _count: { select: { messages: true } },
    },
  })
  return NextResponse.json({ conversations })
})

// POST /api/ai/dream/conversations — yeni sohbet
export const POST = withAuth(async (_req: NextRequest, { user }) => {
  const conversation = await db.dreamConversation.create({
    data: {
      userId: user.id,
      messages: {
        create: [
          {
            role: 'assistant',
            content:
              'Merhaba. Ben rüya yorumcunum. Gördüğün rüyayı olabildiğince ayrıntılı anlat — hangi sahneler, hangi duygular vardı, kim vardı, neredeydin? Anlattıkça birlikte sembolleri çözeriz.',
          },
        ],
      },
    },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })
  return NextResponse.json(conversation)
})

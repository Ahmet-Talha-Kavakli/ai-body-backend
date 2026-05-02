import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

// GET /api/assistant/conversations?archived=true
export const GET = withAuth(async (req: NextRequest, { user }) => {
  const archived = req.nextUrl.searchParams.get('archived') === 'true'
  const conversations = await db.assistantConversation.findMany({
    where: { userId: user.id, archived },
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
  return NextResponse.json(conversation)
})

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type Ctx = { params: Promise<{ mid: string }> }

// POST /api/assistant/messages/[mid]/pin — toggle pin
export const POST = withAuth<Ctx>(async (_req: NextRequest, { user, params }) => {
  const { mid } = await params
  const msg = await db.assistantMessage.findFirst({
    where: { id: mid, conversation: { userId: user.id } },
    select: { id: true, isPinned: true },
  })
  if (!msg) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const updated = await db.assistantMessage.update({
    where: { id: mid },
    data: { isPinned: !msg.isPinned },
  })
  return NextResponse.json({ id: updated.id, isPinned: updated.isPinned })
})

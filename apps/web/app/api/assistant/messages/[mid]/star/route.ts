/**
 * Mesaj Yıldızla — V3 Faz B
 *
 * POST /api/assistant/messages/[mid]/star
 *   Body: { starred: boolean }
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type Params = { params: Promise<{ mid: string }> }

export const POST = withAuth<Params>(async (req, { user, params }) => {
  const { mid } = await params
  const body = (await req.json().catch(() => ({}))) as { starred?: boolean }

  const msg = await db.assistantMessage.findFirst({
    where: { id: mid, conversation: { userId: user.id } },
    select: { id: true, starredAt: true, role: true },
  })
  if (!msg) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const shouldStar = body.starred ?? !msg.starredAt
  const updated = await db.assistantMessage.update({
    where: { id: mid },
    data: {
      starredAt: shouldStar ? new Date() : null,
      starredBy: shouldStar ? 'user' : null,
      isPinned: shouldStar,
    },
  })

  return NextResponse.json({
    id: updated.id,
    starredAt: updated.starredAt,
    starredBy: updated.starredBy,
  })
})

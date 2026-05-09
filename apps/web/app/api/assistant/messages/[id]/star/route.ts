/**
 * Mesaj Yıldızla — V3 Faz B
 *
 * POST /api/assistant/messages/[id]/star
 *   Body: { starred: boolean }
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { ensureSharedMilestone } from '@/lib/assistant/shared-milestones'

type Params = { params: Promise<{ id: string }> }

export const POST = withAuth<Params>(async (req, { user, params }) => {
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as { starred?: boolean }

  const msg = await db.assistantMessage.findFirst({
    where: { id: id, conversation: { userId: user.id } },
    select: { id: true, starredAt: true, role: true },
  })
  if (!msg) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const shouldStar = body.starred ?? !msg.starredAt
  const updated = await db.assistantMessage.update({
    where: { id },
    data: {
      starredAt: shouldStar ? new Date() : null,
      starredBy: shouldStar ? 'user' : null,
      isPinned: shouldStar,
    },
  })

  // V3 Faz C — İlk yıldızlama milestone'u
  if (shouldStar) {
    ensureSharedMilestone({
      userId: user.id,
      type: 'first_star',
      relatedMessageId: id,
    }).catch(() => {})
  }

  return NextResponse.json({
    id: updated.id,
    starredAt: updated.starredAt,
    starredBy: updated.starredBy,
  })
})

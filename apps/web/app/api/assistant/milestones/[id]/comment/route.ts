/**
 * Milestone Comment — V3 Faz C
 *
 * POST /api/assistant/milestones/[id]/comment?type=past|shared
 *   Body: { content: string }
 *   Yorumu kaydeder.
 *
 * GET /api/assistant/milestones/[id]/comment?type=past|shared
 *   Yorumları listeler.
 *
 * DELETE /api/assistant/milestones/[id]/comment?commentId=xxx
 *   Bir yorumu siler (sadece sahibi).
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type Params = { params: Promise<{ id: string }> }

const MAX_LEN = 1000

export const POST = withAuth<Params>(async (req: NextRequest, { user, params }) => {
  const { id } = await params
  const url = new URL(req.url)
  const type = url.searchParams.get('type') === 'shared' ? 'shared' : 'past'
  const body = (await req.json().catch(() => ({}))) as { content?: string }
  const content = (body.content ?? '').trim().slice(0, MAX_LEN)
  if (!content) return NextResponse.json({ error: 'empty' }, { status: 400 })

  // Milestone'ın bu kullanıcıya ait olduğunu doğrula
  if (type === 'past') {
    const m = await db.milestone.findFirst({
      where: {
        id: id,
        characterStory: { assistantProfile: { userId: user.id } },
      },
      select: { id: true },
    })
    if (!m) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  } else {
    const m = await db.sharedMilestone.findFirst({
      where: {
        id: id,
        characterStory: { assistantProfile: { userId: user.id } },
      },
      select: { id: true },
    })
    if (!m) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const comment = await db.milestoneComment.create({
    data: {
      content,
      userId: user.id,
      ...(type === 'past' ? { milestoneId: id } : { sharedMilestoneId: id }),
    },
  })

  return NextResponse.json({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
  })
})

export const GET = withAuth<Params>(async (req: NextRequest, { user, params }) => {
  const { id } = await params
  const url = new URL(req.url)
  const type = url.searchParams.get('type') === 'shared' ? 'shared' : 'past'

  const comments = await db.milestoneComment.findMany({
    where: {
      userId: user.id,
      ...(type === 'past' ? { milestoneId: id } : { sharedMilestoneId: id }),
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, content: true, createdAt: true },
  })
  return NextResponse.json({ comments })
})

export const DELETE = withAuth<Params>(async (req: NextRequest, { user, params }) => {
  const { id } = await params
  const url = new URL(req.url)
  const commentId = url.searchParams.get('commentId')
  if (!commentId) return NextResponse.json({ error: 'no_comment_id' }, { status: 400 })

  const c = await db.milestoneComment.findFirst({
    where: { id: commentId, userId: user.id },
    select: { id: true },
  })
  if (!c) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  await db.milestoneComment.delete({ where: { id: c.id } })
  return NextResponse.json({ ok: true })
})

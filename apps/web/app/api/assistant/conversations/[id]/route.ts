import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params
  const url = new URL(req.url)
  const take = Math.min(parseInt(url.searchParams.get('take') ?? '50', 10), 200)

  const conv = await db.assistantConversation.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      title: true,
      archived: true,
      pinnedAt: true,
      mutedUntil: true,
      aiTypingUntil: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  if (!conv) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // Son N mesaj — embedding ve büyük JSON field'ları DIŞARIDA
  const messages = await db.assistantMessage.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      role: true,
      content: true,
      toolCalls: true,
      toolResults: true,
      attachments: true,
      isPinned: true,
      starredAt: true,
      starredBy: true,
      repliedToMessageId: true,
      readAt: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ ...conv, messages: messages.reverse() })
})

export const PATCH = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params
  const body = (await req.json()) as {
    title?: string
    archived?: boolean
    // V3 Faz B — pin & mute
    pinned?: boolean
    // mute süresi: 'off' | '8h' | '1d' | '1w' | 'forever'
    mute?: 'off' | '8h' | '1d' | '1w' | 'forever'
  }
  const existing = await db.assistantConversation.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  })
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const data: {
    title?: string
    archived?: boolean
    pinnedAt?: Date | null
    mutedUntil?: Date | null
  } = {}
  if (typeof body.title === 'string') data.title = body.title
  if (typeof body.archived === 'boolean') data.archived = body.archived
  if (typeof body.pinned === 'boolean') {
    data.pinnedAt = body.pinned ? new Date() : null
  }
  if (body.mute) {
    const now = Date.now()
    if (body.mute === 'off') data.mutedUntil = null
    else if (body.mute === '8h') data.mutedUntil = new Date(now + 8 * 3600_000)
    else if (body.mute === '1d') data.mutedUntil = new Date(now + 24 * 3600_000)
    else if (body.mute === '1w') data.mutedUntil = new Date(now + 7 * 24 * 3600_000)
    else if (body.mute === 'forever') data.mutedUntil = new Date('9999-12-31')
  }

  const updated = await db.assistantConversation.update({ where: { id }, data })
  return NextResponse.json(updated)
})

export const DELETE = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params
  const existing = await db.assistantConversation.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  })
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  await db.assistantConversation.delete({ where: { id } })
  return NextResponse.json({ ok: true })
})

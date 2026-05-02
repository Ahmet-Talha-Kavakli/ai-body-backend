import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params
  const conv = await db.dreamConversation.findFirst({
    where: { id, userId: user.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })
  if (!conv) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(conv)
})

export const DELETE = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params
  const existing = await db.dreamConversation.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  })
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  await db.dreamConversation.delete({ where: { id } })
  return NextResponse.json({ ok: true })
})

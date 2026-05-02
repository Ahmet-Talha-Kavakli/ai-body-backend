import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params
  const body = (await req.json()) as {
    events: Array<{
      type: string
      timestamp: string
      value?: number | null
      stage?: string | null
      durationSec?: number | null
    }>
  }

  const session = await db.sleepSession.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  })
  if (!session) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  if (!body.events?.length) return NextResponse.json({ inserted: 0 })

  await db.sleepEvent.createMany({
    data: body.events.map((e) => ({
      sessionId: id,
      type: e.type,
      timestamp: new Date(e.timestamp),
      value: e.value ?? null,
      stage: e.stage ?? null,
      durationSec: e.durationSec ?? null,
    })),
  })

  return NextResponse.json({ inserted: body.events.length })
})

export const GET = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params
  const session = await db.sleepSession.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  })
  if (!session) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const events = await db.sleepEvent.findMany({
    where: { sessionId: id },
    orderBy: { timestamp: 'asc' },
  })
  return NextResponse.json({ events })
})

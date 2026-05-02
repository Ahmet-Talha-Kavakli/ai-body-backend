import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params
  const body = (await req.json()) as {
    fileUrl: string
    durationSec: number
    peakDb: number
    recordedAt: string
    category: 'snore' | 'noise'
  }

  const session = await db.sleepSession.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  })
  if (!session) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const snippet = await db.sleepSnippet.create({
    data: {
      sessionId: id,
      fileUrl: body.fileUrl,
      durationSec: body.durationSec,
      peakDb: body.peakDb,
      recordedAt: new Date(body.recordedAt),
      category: body.category,
    },
  })
  return NextResponse.json(snippet)
})

export const GET = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params
  const session = await db.sleepSession.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  })
  if (!session) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const snippets = await db.sleepSnippet.findMany({
    where: { sessionId: id },
    orderBy: { recordedAt: 'asc' },
  })
  return NextResponse.json({ snippets })
})

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const days = parseInt(searchParams.get('days') ?? '30')

    const since = new Date()
    since.setDate(since.getDate() - days)

    const logs = await db.healthMetricLog.findMany({
      where: {
        userId: user.id,
        ...(type ? { type } : {}),
        recordedAt: { gte: since },
      },
      orderBy: { recordedAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(logs)
  } catch (err) {
    console.error('[health-metrics GET]', err)
    return NextResponse.json({ error: 'Failed to fetch health metrics' }, { status: 500 })
  }
})

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = (await req.json()) as {
      type: string
      value: number
      value2?: number
      unit: string
      note?: string
      recordedAt?: string
    }

    const log = await db.healthMetricLog.create({
      data: {
        userId: user.id,
        type: body.type,
        value: body.value,
        value2: body.value2 ?? null,
        unit: body.unit,
        note: body.note ?? null,
        recordedAt: body.recordedAt ? new Date(body.recordedAt) : new Date(),
      },
    })

    return NextResponse.json(log)
  } catch (err) {
    console.error('[health-metrics POST]', err)
    return NextResponse.json({ error: 'Failed to create health metric' }, { status: 500 })
  }
})

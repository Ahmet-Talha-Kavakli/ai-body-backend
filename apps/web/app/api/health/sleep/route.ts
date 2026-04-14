import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') ?? '7')
    const since = new Date()
    since.setDate(since.getDate() - days)

    const readings = await db.wearableReading.findMany({
      where: {
        userId: user.id,
        recordedAt: { gte: since },
        type: 'sleep_minutes',
      },
      orderBy: { recordedAt: 'asc' },
    })

    const chartData = readings.map((r) => ({
      date: r.recordedAt.toISOString().split('T')[0],
      hours: +(r.value / 60).toFixed(1),
    }))

    const avg = chartData.length
      ? +(chartData.reduce((s, d) => s + d.hours, 0) / chartData.length).toFixed(1)
      : 0

    return NextResponse.json({ chartData, avg })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
        type: { in: ['steps', 'calories_burned', 'heart_rate', 'hrv'] },
      },
      orderBy: { recordedAt: 'asc' },
    })

    const byDay: Record<
      string,
      { steps: number; calories: number; heartRate: number[]; hrv: number[] }
    > = {}
    readings.forEach((r) => {
      const day = r.recordedAt.toISOString().split('T')[0]
      if (!byDay[day]) byDay[day] = { steps: 0, calories: 0, heartRate: [], hrv: [] }
      if (r.type === 'steps') byDay[day].steps += r.value
      if (r.type === 'calories_burned') byDay[day].calories += r.value
      if (r.type === 'heart_rate') byDay[day].heartRate.push(r.value)
      if (r.type === 'hrv') byDay[day].hrv.push(r.value)
    })

    const chartData = Object.entries(byDay).map(([date, d]) => ({
      date,
      steps: d.steps,
      calories: Math.round(d.calories),
      avgHeartRate: d.heartRate.length
        ? Math.round(d.heartRate.reduce((a, b) => a + b) / d.heartRate.length)
        : null,
      hrv: d.hrv.length ? Math.round(d.hrv.reduce((a, b) => a + b) / d.hrv.length) : null,
    }))

    return NextResponse.json({ chartData })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

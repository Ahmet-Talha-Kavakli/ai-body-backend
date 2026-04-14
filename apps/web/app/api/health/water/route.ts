import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const ml = body.ml ?? 250

    // Bugünkü su kaydı — wearable reading olarak kaydet
    const reading = await db.wearableReading.create({
      data: {
        userId: user.id,
        deviceId:
          (await db.wearableDevice.findFirst({ where: { userId: user.id } }))?.id ??
          (
            await db.wearableDevice.create({
              data: {
                userId: user.id,
                type: 'manual',
                brand: 'Manuel',
                model: 'Takip',
                isConnected: true,
              },
            })
          ).id,
        type: 'water_ml',
        value: ml,
        unit: 'ml',
        recordedAt: new Date(),
      },
    })

    // Bugünkü toplam su
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayWater = await db.wearableReading.findMany({
      where: { userId: user.id, type: 'water_ml', recordedAt: { gte: todayStart } },
    })
    const totalMl = todayWater.reduce((s, r) => s + r.value, 0)

    return NextResponse.json({ success: true, totalMl, reading })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Today totals
    const readings = await db.wearableReading.findMany({
      where: { userId: user.id, type: 'water_ml', recordedAt: { gte: todayStart } },
    })
    const totalMl = readings.reduce((s, r) => s + r.value, 0)

    // Weekly data (last 7 days grouped by day)
    const { searchParams } = new URL(req.url)
    const includeWeekly = searchParams.get('weekly') === 'true'

    let weeklyData: { date: string; totalMl: number }[] = []
    if (includeWeekly) {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      weekAgo.setHours(0, 0, 0, 0)

      const weekReadings = await db.wearableReading.findMany({
        where: { userId: user.id, type: 'water_ml', recordedAt: { gte: weekAgo } },
        orderBy: { recordedAt: 'asc' },
      })

      const byDay: Record<string, number> = {}
      weekReadings.forEach((r) => {
        const day = r.recordedAt.toISOString().split('T')[0]
        byDay[day] = (byDay[day] ?? 0) + r.value
      })

      weeklyData = Object.entries(byDay).map(([date, total]) => ({ date, totalMl: total }))
    }

    return NextResponse.json({ totalMl, count: readings.length, weeklyData })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

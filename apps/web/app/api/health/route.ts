import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({
      where: { clerkId },
      include: { healthProfile: true },
    })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Son 7 günlük wearable okumalar
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)

    const readings = await db.wearableReading.findMany({
      where: { userId: user.id, recordedAt: { gte: weekAgo } },
      orderBy: { recordedAt: 'desc' },
    })

    const devices = await db.wearableDevice.findMany({
      where: { userId: user.id },
    })

    // Tip bazında son okuma
    const latest: Record<string, number> = {}
    readings.forEach(r => {
      if (!(r.type in latest)) latest[r.type] = r.value
    })

    // Son 7 gün adım ortalaması
    const stepReadings = readings.filter(r => r.type === 'steps')
    const avgSteps = stepReadings.length
      ? Math.round(stepReadings.reduce((s, r) => s + r.value, 0) / stepReadings.length)
      : 0

    // Son 7 gün uyku (dakika)
    const sleepReadings = readings.filter(r => r.type === 'sleep_minutes')

    return NextResponse.json({
      profile: user.healthProfile,
      devices,
      latestReadings: latest,
      avgSteps,
      sleepData: sleepReadings.slice(0, 7).map(r => ({
        date: r.recordedAt,
        hours: r.value / 60,
      })),
      hasDevice: devices.some(d => d.isConnected),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

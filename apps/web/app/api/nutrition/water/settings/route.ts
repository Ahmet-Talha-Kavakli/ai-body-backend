import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const settings = await db.waterSettings.findUnique({ where: { userId: user.id } })
    return NextResponse.json({
      settings: settings ?? {
        dailyGoalMl: 2500,
        cupSizeMl: 200,
        reminderMode: 'interval',
        reminderIntervalHours: 2,
        reminderTimes: [],
        isManualGoal: false,
        city: null,
        tempBonusMl: 0,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const {
      dailyGoalMl,
      cupSizeMl,
      reminderMode,
      reminderIntervalHours,
      reminderTimes,
      isManualGoal,
      city,
    } = await req.json()

    const data: Record<string, unknown> = {}
    if (dailyGoalMl !== undefined) data.dailyGoalMl = dailyGoalMl
    if (cupSizeMl !== undefined) data.cupSizeMl = cupSizeMl
    if (reminderMode !== undefined) data.reminderMode = reminderMode
    if (reminderIntervalHours !== undefined) data.reminderIntervalHours = reminderIntervalHours
    if (reminderTimes !== undefined) data.reminderTimes = reminderTimes
    if (isManualGoal !== undefined) data.isManualGoal = isManualGoal
    if (city !== undefined) data.city = city

    await db.waterSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        dailyGoalMl: dailyGoalMl ?? 2500,
        cupSizeMl: cupSizeMl ?? 200,
        ...data,
      },
      update: data,
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

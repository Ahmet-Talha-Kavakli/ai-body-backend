import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function POST(_req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [healthProfile, settings] = await Promise.all([
      db.healthProfile.findUnique({ where: { userId: user.id } }),
      db.waterSettings.findUnique({ where: { userId: user.id } }),
    ])

    const currentGoal = settings?.dailyGoalMl ?? 2500
    const isManualGoal = settings?.isManualGoal ?? false

    if (isManualGoal || !healthProfile?.weightKg) {
      return NextResponse.json({ dailyGoalMl: currentGoal })
    }

    const autoGoal = Math.round(healthProfile.weightKg * 33)

    await db.waterSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, dailyGoalMl: autoGoal, cupSizeMl: 200 },
      update: { dailyGoalMl: autoGoal },
    })

    return NextResponse.json({ dailyGoalMl: autoGoal })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function DELETE() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await Promise.all([
      db.workoutSession.deleteMany({ where: { userId: user.id } }),
      db.mealLog.deleteMany({ where: { userId: user.id } }),
      db.userAchievement.deleteMany({ where: { userId: user.id } }),
      db.waterLog.deleteMany({ where: { userId: user.id } }),
      db.sleepRecord.deleteMany({ where: { userId: user.id } }),
    ])

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

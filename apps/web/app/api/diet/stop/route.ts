import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const POST = withAuth(async (_req, ctx) => {
  try {
    const userId = ctx.user.id
    const plan = await db.activeDietPlan.findUnique({ where: { userId } })
    if (!plan) return NextResponse.json({ error: 'No active plan' }, { status: 404 })

    // Restore previous nutrition goal snapshot
    if (plan.previousGoalSnapshot && typeof plan.previousGoalSnapshot === 'object') {
      const snap = plan.previousGoalSnapshot as any
      if (snap.dailyCalories) {
        await db.nutritionGoal.upsert({
          where: { userId },
          update: {
            dailyCalories: snap.dailyCalories,
            proteinG: snap.proteinG,
            carbsG: snap.carbsG,
            fatG: snap.fatG,
          },
          create: {
            userId,
            dailyCalories: snap.dailyCalories,
            proteinG: snap.proteinG ?? 0,
            carbsG: snap.carbsG ?? 0,
            fatG: snap.fatG ?? 0,
          },
        })
      }
    }

    // Delete plan (cascade also deletes dayMenus). userId @unique olduğu için
    // `update status: stopped` yerine direkt sil — yeni plan başlatabilmek için.
    await db.activeDietPlan.delete({ where: { userId } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[diet/stop POST]', err)
    return NextResponse.json({ error: 'Failed to stop plan' }, { status: 500 })
  }
})

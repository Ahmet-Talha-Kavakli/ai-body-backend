import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json()
    const { mealType, name, calories, protein, carbs, fat, amount, unit } = body

    const log = await db.mealLog.create({
      data: {
        userId: user.id,
        mealType: mealType ?? 'snack',
        items: [{ name, calories, protein, carbs, fat, amount, unit }],
        totalCalories: calories ?? 0,
        totalProteinG: protein ?? 0,
        totalCarbsG: carbs ?? 0,
        totalFatG: fat ?? 0,
        loggedAt: new Date(),
      },
    })

    return NextResponse.json(log)
  } catch (err) {
    console.error('[nutrition/log POST]', err)
    return NextResponse.json({ error: 'Failed to log meal' }, { status: 500 })
  }
})

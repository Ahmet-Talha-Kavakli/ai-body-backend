import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { todayStr } from '../_helpers'
import type { PresetMealItem } from '../_helpers'

export const POST = withAuth(async (req, ctx) => {
  try {
    const body = await req.json().catch(() => ({}))
    const date = body.date ?? todayStr()
    const userId = ctx.user.id

    const plan = await db.activeDietPlan.findUnique({ where: { userId } })
    if (!plan) return NextResponse.json({ error: 'No active plan' }, { status: 404 })

    const menus = await db.dietDayMenu.findMany({
      where: { planId: plan.id, date, appliedAt: null },
    })

    if (menus.length === 0) return NextResponse.json({ applied: 0 })

    const loggedAt = new Date()

    const results = await Promise.all(
      menus.map(async (menu) => {
        const items = menu.items as PresetMealItem[]
        const totalCalories = items.reduce((s, it) => s + it.calories * it.quantity, 0)
        const totalProteinG = items.reduce((s, it) => s + it.proteinG * it.quantity, 0)
        const totalCarbsG = items.reduce((s, it) => s + it.carbsG * it.quantity, 0)
        const totalFatG = items.reduce((s, it) => s + it.fatG * it.quantity, 0)

        const mealItems = items.map((it) => ({
          name: it.name,
          servingSize: it.servingSize,
          servingUnit: it.servingUnit,
          quantity: it.quantity,
          calories: it.calories,
          proteinG: it.proteinG,
          carbsG: it.carbsG,
          fatG: it.fatG,
          source: 'diet_plan' as const,
        }))

        const mealLog = await db.mealLog.create({
          data: {
            userId,
            loggedAt,
            mealType: menu.mealType,
            source: 'diet_plan',
            items: mealItems,
            totalCalories,
            totalProteinG,
            totalCarbsG,
            totalFatG,
          },
        })
        await db.dietDayMenu.update({
          where: { id: menu.id },
          data: { appliedAt: loggedAt, appliedMealLogId: mealLog.id },
        })
        return mealLog.id
      })
    )

    return NextResponse.json({ applied: results.length, mealLogIds: results })
  } catch (err) {
    console.error('[diet/apply-day POST]', err)
    return NextResponse.json({ error: 'Failed to apply day' }, { status: 500 })
  }
})

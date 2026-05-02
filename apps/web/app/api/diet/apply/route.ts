import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import type { PresetMealItem } from '../_helpers'

export const POST = withAuth(async (req, ctx) => {
  try {
    const { menuId } = await req.json()
    if (!menuId) return NextResponse.json({ error: 'menuId required' }, { status: 400 })

    const menu = await db.dietDayMenu.findUnique({ where: { id: menuId } })
    if (!menu) return NextResponse.json({ error: 'Menu not found' }, { status: 404 })

    // Verify plan belongs to user
    const plan = await db.activeDietPlan.findUnique({ where: { id: menu.planId } })
    if (!plan || plan.userId !== ctx.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const items = menu.items as PresetMealItem[]
    const loggedAt = new Date()

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
        userId: ctx.user.id,
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
      where: { id: menuId },
      data: { appliedAt: loggedAt, appliedMealLogId: mealLog.id },
    })

    return NextResponse.json({ mealLogId: mealLog.id })
  } catch (err) {
    console.error('[diet/apply POST]', err)
    return NextResponse.json({ error: 'Failed to apply menu' }, { status: 500 })
  }
})

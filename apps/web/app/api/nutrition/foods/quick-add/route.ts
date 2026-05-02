import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

/**
 * POST /api/nutrition/foods/quick-add
 *
 * Yazio "Quick Add" — yemek yaratmadan sadece sayılarla bir öğüne ekle.
 * Body: {
 *   mealType: 'breakfast'|'lunch'|'dinner'|'snack',
 *   name?: string (default: 'Hızlı Ekle'),
 *   calories: number,
 *   proteinG?: number,
 *   carbsG?: number,
 *   fatG?: number,
 *   loggedAt?: ISO,
 *   savePersistent?: boolean (true ise ileride tekrar kullanmak için CustomFood olarak kaydet)
 * }
 *
 * Response: { meal } — eğer savePersistent true ise { meal, customFood }
 */
export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json()
    const {
      mealType,
      name = 'Hızlı Ekle',
      calories,
      proteinG = 0,
      carbsG = 0,
      fatG = 0,
      loggedAt,
      savePersistent = false,
    } = body

    if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
      return NextResponse.json({ error: 'Geçersiz öğün tipi' }, { status: 400 })
    }
    const cal = Number(calories)
    if (isNaN(cal) || cal < 0 || cal > 10000) {
      return NextResponse.json({ error: 'Kalori 0-10000 arasında olmalı' }, { status: 400 })
    }

    let customFood: any = null
    if (savePersistent) {
      customFood = await db.customFood.create({
        data: {
          userId: user.id,
          name,
          calories: cal,
          proteinG: Number(proteinG) || 0,
          carbsG: Number(carbsG) || 0,
          fatG: Number(fatG) || 0,
          isQuickAdd: true,
        },
      })
    }

    const item = {
      customFoodId: customFood?.id,
      name,
      servingSize: 1,
      servingUnit: 'porsiyon',
      quantity: 1,
      calories: cal,
      proteinG: Number(proteinG) || 0,
      carbsG: Number(carbsG) || 0,
      fatG: Number(fatG) || 0,
      source: 'quick' as const,
    }

    const meal = await db.mealLog.create({
      data: {
        userId: user.id,
        mealType,
        items: [item] as any,
        loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
        source: 'quick_add',
        totalCalories: cal,
        totalProteinG: Number(proteinG) || 0,
        totalCarbsG: Number(carbsG) || 0,
        totalFatG: Number(fatG) || 0,
      },
    })

    return NextResponse.json({ meal, customFood }, { status: 201 })
  } catch (err) {
    console.error('[quick-add]', err)
    return NextResponse.json({ error: 'Hızlı ekleme başarısız' }, { status: 500 })
  }
})

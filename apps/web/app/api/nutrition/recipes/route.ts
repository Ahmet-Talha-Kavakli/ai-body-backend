import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

/**
 * GET /api/nutrition/recipes
 * Kullanıcının tüm tariflerini liste olarak döndürür (useCount sıralı).
 */
export const GET = withAuth(async (_req, { user }) => {
  try {
    const recipes = await db.recipe.findMany({
      where: { userId: user.id },
      orderBy: [{ useCount: 'desc' }, { createdAt: 'desc' }],
      include: {
        ingredients: { orderBy: { order: 'asc' } },
      },
    })
    return NextResponse.json({ recipes })
  } catch (err) {
    console.error('[recipes GET]', err)
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
  }
})

type IngredientInput = {
  foodId?: string
  customFoodId?: string
  name: string
  quantity: number
  unit: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

/**
 * POST /api/nutrition/recipes
 * Yeni tarif oluştur. Per-serving makrolar otomatik hesaplanır.
 */
export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json()
    const { name, description, photoUrl, servings, ingredients } = body as {
      name: string
      description?: string
      photoUrl?: string
      servings: number
      ingredients: IngredientInput[]
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'İsim zorunlu' }, { status: 400 })
    }
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: 'En az bir malzeme gerekli' }, { status: 400 })
    }
    const srv = Number(servings) || 1
    if (srv < 1) {
      return NextResponse.json({ error: 'Servis sayısı en az 1 olmalı' }, { status: 400 })
    }

    // Toplam → per-serving
    let totalCal = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    for (const ing of ingredients) {
      totalCal += Number(ing.calories) || 0
      totalProtein += Number(ing.proteinG) || 0
      totalCarbs += Number(ing.carbsG) || 0
      totalFat += Number(ing.fatG) || 0
    }

    const recipe = await db.recipe.create({
      data: {
        userId: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        photoUrl: photoUrl || null,
        servings: srv,
        caloriesPerServing: totalCal / srv,
        proteinPerServing: totalProtein / srv,
        carbsPerServing: totalCarbs / srv,
        fatPerServing: totalFat / srv,
        ingredients: {
          create: ingredients.map((ing, i) => ({
            foodId: ing.foodId ?? null,
            customFoodId: ing.customFoodId ?? null,
            name: ing.name,
            quantity: Number(ing.quantity) || 1,
            unit: ing.unit ?? 'g',
            calories: Number(ing.calories) || 0,
            proteinG: Number(ing.proteinG) || 0,
            carbsG: Number(ing.carbsG) || 0,
            fatG: Number(ing.fatG) || 0,
            order: i,
          })),
        },
      },
      include: { ingredients: true },
    })

    return NextResponse.json({ recipe }, { status: 201 })
  } catch (err) {
    console.error('[recipes POST]', err)
    return NextResponse.json(
      { error: 'Failed to create recipe', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }
})

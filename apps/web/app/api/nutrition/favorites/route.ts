import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

/**
 * GET /api/nutrition/favorites
 * Returns user's favorite foods (denormalized snapshot).
 */
export const GET = withAuth(async (_req, { user }) => {
  try {
    const favs = await db.favoriteFood.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ favorites: favs })
  } catch (err) {
    console.error('[favorites GET]', err)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
})

/**
 * POST /api/nutrition/favorites
 * Body: { source: 'off'|'usda'|'fatsecret'|'custom'|'food', sourceId: string, snapshot: {...} }
 * Toggle: yoksa ekler, varsa siler.
 */
export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json()
    const source = body.source as 'off' | 'usda' | 'fatsecret' | 'custom' | 'food'
    const sourceId = String(body.sourceId ?? '')
    if (!source || !sourceId) {
      return NextResponse.json({ error: 'Missing source or sourceId' }, { status: 400 })
    }

    const where: any = { userId: user.id }
    if (source === 'off') where.offCode = sourceId
    else if (source === 'usda') where.usdaFdcId = sourceId
    else if (source === 'fatsecret') where.fatSecretFoodId = sourceId
    else if (source === 'custom') where.customFoodId = sourceId
    else if (source === 'food') where.foodId = sourceId
    else return NextResponse.json({ error: 'Invalid source' }, { status: 400 })

    const existing = await db.favoriteFood.findFirst({ where })
    if (existing) {
      await db.favoriteFood.delete({ where: { id: existing.id } })
      return NextResponse.json({ favorited: false })
    }

    const snap = body.snapshot ?? {}
    const data: any = {
      userId: user.id,
      name: String(snap.name ?? 'Yemek'),
      brand: snap.brand ?? null,
      photoUrl: snap.photoUrl ?? null,
      servingSize: Number(snap.servingSize) || 100,
      servingUnit: String(snap.servingUnit ?? 'g'),
      calories: Number(snap.calories) || 0,
      proteinG: Number(snap.proteinG) || 0,
      carbsG: Number(snap.carbsG) || 0,
      fatG: Number(snap.fatG) || 0,
    }
    if (source === 'off') data.offCode = sourceId
    else if (source === 'usda') data.usdaFdcId = sourceId
    else if (source === 'fatsecret') data.fatSecretFoodId = sourceId
    else if (source === 'custom') data.customFoodId = sourceId
    else if (source === 'food') data.foodId = sourceId

    const fav = await db.favoriteFood.create({ data })
    return NextResponse.json({ favorited: true, favorite: fav })
  } catch (err) {
    console.error('[favorites POST]', err)
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 })
  }
})

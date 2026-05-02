import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

/**
 * GET /api/nutrition/foods/custom
 * Kullanıcının kendi yarattığı yemekleri listeler.
 */
export const GET = withAuth(async (_req, { user }) => {
  const customs = await db.customFood.findMany({
    where: { userId: user.id },
    orderBy: [{ useCount: 'desc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json({ customs })
})

/**
 * POST /api/nutrition/foods/custom
 *
 * Yeni custom food yarat (barkodlu/barkodsuz/Quick Add hepsi).
 * Body: {
 *   name, brand?, barcode?, photoUrl?,
 *   servingSize, servingUnit,
 *   calories, proteinG, carbsG, fatG,
 *   fiberG?, sugarG?, ... (opsiyonel sub-makro)
 *   micros?: { vitA, vitC, ... }
 *   isQuickAdd?: boolean
 * }
 */
export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json()

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'İsim gerekli' }, { status: 400 })
    }
    const calories = Number(body.calories)
    if (isNaN(calories) || calories < 0 || calories > 10000) {
      return NextResponse.json({ error: 'Geçersiz kalori' }, { status: 400 })
    }

    const data: any = {
      userId: user.id,
      name: body.name.trim(),
      brand: body.brand?.trim() || null,
      barcode: body.barcode?.trim() || null,
      photoUrl: body.photoUrl ?? null,
      servingSize: Number(body.servingSize) || 100,
      servingUnit: body.servingUnit || 'g',
      calories,
      proteinG: Number(body.proteinG) || 0,
      carbsG: Number(body.carbsG) || 0,
      fatG: Number(body.fatG) || 0,
      fiberG: Number(body.fiberG) || 0,
      sugarG: Number(body.sugarG) || 0,
      addedSugarG: Number(body.addedSugarG) || 0,
      saturatedFatG: Number(body.saturatedFatG) || 0,
      monounsaturatedFatG: Number(body.monounsaturatedFatG) || 0,
      polyunsaturatedFatG: Number(body.polyunsaturatedFatG) || 0,
      transFatG: Number(body.transFatG) || 0,
      cholesterolMg: Number(body.cholesterolMg) || 0,
      sodiumMg: Number(body.sodiumMg) || 0,
      saltMg: Number(body.saltMg) || 0,
      waterG: Number(body.waterG) || 0,
      alcoholG: Number(body.alcoholG) || 0,
      micros: body.micros ?? null,
      isQuickAdd: !!body.isQuickAdd,
    }

    const customFood = await db.customFood.create({ data })
    return NextResponse.json({ customFood }, { status: 201 })
  } catch (err) {
    console.error('[foods/custom POST]', err)
    return NextResponse.json({ error: 'Yemek oluşturulamadı' }, { status: 500 })
  }
})

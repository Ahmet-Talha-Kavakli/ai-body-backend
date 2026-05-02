import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

/**
 * GET /api/nutrition/foods/barcode?code=8690...
 *
 * Barkod araması — sırayla:
 * 1. Kullanıcının kendi CustomFood (barcode unique)
 * 2. Cache'lenmiş FoodItem (barcode unique)
 * 3. (TODO) OpenFoodFacts API
 *
 * Bulunduysa { found: true, food } döner. Bulunamadıysa { found: false }.
 */
export const GET = withAuth(async (req, { user }) => {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')?.trim()
    if (!code || code.length < 6) {
      return NextResponse.json({ error: 'Geçersiz barkod' }, { status: 400 })
    }

    const [custom, cached] = await Promise.all([
      db.customFood.findFirst({ where: { userId: user.id, barcode: code } }),
      db.foodItem.findUnique({ where: { barcode: code } }),
    ])

    if (custom) {
      return NextResponse.json({ found: true, source: 'custom', food: custom })
    }
    if (cached) {
      return NextResponse.json({ found: true, source: 'cache', food: cached })
    }

    // OpenFoodFacts (varsa helper)
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`)
      if (res.ok) {
        const data = await res.json()
        if (data.status === 1 && data.product) {
          const p = data.product
          const n = p.nutriments ?? {}
          const food = {
            barcode: code,
            name: p.product_name || p.generic_name || 'Bilinmeyen ürün',
            brand: p.brands ?? null,
            servingSize: 100,
            servingUnit: 'g',
            calories: Number(n['energy-kcal_100g']) || 0,
            proteinG: Number(n.proteins_100g) || 0,
            carbsG: Number(n.carbohydrates_100g) || 0,
            fatG: Number(n.fat_100g) || 0,
            fiberG: Number(n.fiber_100g) || 0,
            sugarG: Number(n.sugars_100g) || 0,
            saturatedFatG: Number(n['saturated-fat_100g']) || 0,
            transFatG: Number(n['trans-fat_100g']) || 0,
            saltMg: (Number(n.salt_100g) || 0) * 1000,
            sodiumMg: (Number(n.sodium_100g) || 0) * 1000,
            cholesterolMg: (Number(n.cholesterol_100g) || 0) * 1000,
            photoUrl: p.image_url ?? null,
          }
          return NextResponse.json({ found: true, source: 'openfoodfacts', food })
        }
      }
    } catch (e) {
      console.error('[foods/barcode OFF]', e)
    }

    return NextResponse.json({ found: false, code })
  } catch (err) {
    console.error('[foods/barcode]', err)
    return NextResponse.json({ error: 'Barkod araması başarısız' }, { status: 500 })
  }
})

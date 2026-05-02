import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type RouteContext = { params: Promise<{ code: string }> }

// Open Food Facts'ten supplement/ürün bilgisi çek
async function fetchOpenFoodFacts(barcode: string) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { status: number; product?: Record<string, unknown> }
    if (data.status !== 1 || !data.product) return null

    const p = data.product
    return {
      name: (p.product_name as string) ?? (p.product_name_en as string) ?? '',
      brand: (p.brands as string)?.split(',')[0]?.trim() ?? '',
      barcode,
      source: 'open-food-facts',
      category: (p.categories_tags as string[])?.[0]?.replace('en:', '') ?? 'genel',
    }
  } catch {
    return null
  }
}

export const GET = withAuth(async (_req: NextRequest, { params: paramsPromise }: RouteContext) => {
  try {
    const { code } = await paramsPromise

    // 1. Önce kendi katalogumuzda ara
    const catalogItem = await db.supplementCatalog.findFirst({ where: { barcode: code } })
    if (catalogItem) {
      return NextResponse.json({ found: true, source: 'catalog', ...catalogItem })
    }

    // 2. Open Food Facts fallback
    const offResult = await fetchOpenFoodFacts(code)
    if (offResult && offResult.name) {
      return NextResponse.json({ found: true, ...offResult })
    }

    return NextResponse.json({ found: false, barcode: code })
  } catch (error) {
    console.error('[supplements/barcode GET]', error)
    return NextResponse.json({ error: 'Barcode lookup failed' }, { status: 500 })
  }
})

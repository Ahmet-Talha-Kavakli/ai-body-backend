import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'

type RouteContext = { params: Promise<{ code: string }> }

const CATEGORY_MAP: Record<string, string> = {
  beverages: 'other',
  waters: 'water',
  sodas: 'soda',
  'carbonated-waters': 'water',
  juices: 'juice',
  'fruit-juices': 'juice',
  nectars: 'juice',
  coffees: 'coffee',
  teas: 'tea',
  'herbal-teas': 'herbal',
  'energy-drinks': 'sports',
  'sports-drinks': 'sports',
  milks: 'dairy',
  'plant-milks': 'dairy',
  beers: 'alcohol',
  wines: 'alcohol',
  spirits: 'alcohol',
  smoothies: 'smoothie',
}

async function fetchOpenFoodFacts(barcode: string) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'FitAI/1.0 (contact@fitai.app)' },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { status: number; product?: Record<string, unknown> }
    if (data.status !== 1 || !data.product) return null

    const p = data.product
    const name =
      (p.product_name_tr as string) ||
      (p.product_name as string) ||
      (p.product_name_en as string) ||
      ''
    if (!name) return null

    const categories = (p.categories_tags as string[]) ?? []
    const catRaw = categories[categories.length - 1]?.replace('en:', '').replace('tr:', '') ?? ''
    const category = CATEGORY_MAP[catRaw] ?? 'other'

    const servingSizeRaw = typeof p.serving_size === 'string' ? p.serving_size : ''
    const servingMatch = servingSizeRaw.match(/(\d+)\s*(ml|l|cl)/i)
    let defaultServingMl = 250
    if (servingMatch) {
      const val = parseInt(servingMatch[1])
      const unit = servingMatch[2].toLowerCase()
      defaultServingMl = unit === 'l' ? val * 1000 : unit === 'cl' ? val * 10 : val
      defaultServingMl = Math.min(Math.max(defaultServingMl, 20), 1500)
    }

    return {
      nametr: name,
      nameen: (p.product_name_en as string) || name,
      brand: (p.brands as string)?.split(',')[0]?.trim() ?? '',
      category,
      defaultServingMl,
    }
  } catch {
    return null
  }
}

export const GET = withAuth(async (_req: NextRequest, { params: paramsPromise }: RouteContext) => {
  try {
    const { code } = await paramsPromise
    const result = await fetchOpenFoodFacts(code)

    if (result?.nametr) {
      return NextResponse.json({ found: true, ...result })
    }

    return NextResponse.json({ found: false, barcode: code })
  } catch (error) {
    console.error('[drinks/barcode GET]', error)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
})

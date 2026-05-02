/**
 * OpenFoodFacts arama — anahtarsız, ücretsiz, ~3.6M ürün.
 *
 * Türkiye için iyi: BİM, Migros, A101, Şok markaları + uluslararası paketli ürünler.
 * Çiğ besinler için zayıf — FatSecret onu tamamlar.
 *
 * Endpoint: https://world.openfoodfacts.org/cgi/search.pl
 *   GET ?search_terms=X&search_simple=1&json=1&page_size=20
 */

export type OffNormalized = {
  source: 'openfoodfacts'
  offCode: string
  name: string
  brand?: string
  photoUrl?: string
  servingSize: number
  servingUnit: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  sugarG: number
  saturatedFatG: number
  transFatG: number
  cholesterolMg: number
  sodiumMg: number
  saltMg: number
}

type OffProduct = {
  code: string
  product_name?: string
  product_name_tr?: string
  generic_name?: string
  brands?: string | string[]
  image_small_url?: string
  image_url?: string
  serving_size?: string
  nutriments?: Record<string, any>
}

function parseServing(s?: string): { size: number; unit: string } {
  if (!s) return { size: 100, unit: 'g' }
  const m = s.match(/([\d.,]+)\s*(g|ml|oz)?/i)
  if (!m) return { size: 100, unit: 'g' }
  const size = Number(m[1].replace(',', '.')) || 100
  const unit = (m[2] || 'g').toLowerCase()
  return { size, unit }
}

function normalize(p: OffProduct): OffNormalized | null {
  const name = p.product_name_tr || p.product_name || p.generic_name
  if (!name || !p.code) return null
  const n = p.nutriments ?? {}
  const cal = Number(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0)
  if (!cal && !n.proteins_100g && !n.carbohydrates_100g && !n.fat_100g) {
    return null // boş veri varsa ekleme
  }
  const serving = parseServing(p.serving_size)

  return {
    source: 'openfoodfacts',
    offCode: p.code,
    name: name.trim(),
    brand: (Array.isArray(p.brands) ? p.brands[0] : p.brands?.split(',')[0])?.trim() || undefined,
    photoUrl: p.image_small_url || p.image_url,
    servingSize: serving.size,
    servingUnit: serving.unit,
    calories: cal,
    proteinG: Number(n.proteins_100g) || 0,
    carbsG: Number(n.carbohydrates_100g) || 0,
    fatG: Number(n.fat_100g) || 0,
    fiberG: Number(n.fiber_100g) || 0,
    sugarG: Number(n.sugars_100g) || 0,
    saturatedFatG: Number(n['saturated-fat_100g']) || 0,
    transFatG: Number(n['trans-fat_100g']) || 0,
    cholesterolMg: (Number(n.cholesterol_100g) || 0) * 1000,
    sodiumMg: (Number(n.sodium_100g) || 0) * 1000,
    saltMg: (Number(n.salt_100g) || 0) * 1000,
  }
}

/**
 * GET search — yeni Search-a-licious API'si (Elasticsearch tabanlı).
 * Eski CGI endpoint anonim kullanıcılara 503 dönüyor; bu yeni endpoint hâlâ açık.
 * Doc: https://search.openfoodfacts.org/docs
 */
export async function searchOpenFoodFacts(query: string, limit = 15): Promise<OffNormalized[]> {
  const trim = query.trim()
  if (trim.length < 2) return []

  const fields = [
    'code',
    'product_name',
    'product_name_tr',
    'generic_name',
    'brands',
    'image_small_url',
    'image_url',
    'serving_size',
    'nutriments',
  ].join(',')

  const url = new URL('https://search.openfoodfacts.org/search')
  url.searchParams.set('q', trim)
  url.searchParams.set('page_size', String(limit))
  url.searchParams.set('fields', fields)

  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'FitAI/1.0 (talha@fitai.app)' },
      signal: AbortSignal.timeout(8000),
    }).catch(() => null)

    if (!res?.ok) return []
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('application/json')) {
      console.warn('[off-search] non-json response:', ct)
      return []
    }
    const data = (await res.json().catch(() => null)) as { hits?: OffProduct[] } | null
    if (!data?.hits) return []

    const seen = new Set<string>()
    const out: OffNormalized[] = []
    for (const p of data.hits) {
      if (!p.code || seen.has(p.code)) continue
      seen.add(p.code)
      const n = normalize(p)
      if (n) out.push(n)
      if (out.length >= limit) break
    }
    return out
  } catch (err) {
    console.error('[off-search]', err)
    return []
  }
}

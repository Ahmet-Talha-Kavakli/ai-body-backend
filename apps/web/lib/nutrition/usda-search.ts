/**
 * USDA FoodData Central — Amerikan resmi gıda veritabanı.
 * 600K+ marka ürünü + 7K+ standart besin (raw, generic).
 *
 * Endpoint: https://api.nal.usda.gov/fdc/v1/foods/search
 * Free tier: 1000 req/saat (USDA_API_KEY env). DEMO_KEY: 30/saat.
 *
 * Çiğ besinler ve restoran zincirleri için iyi.
 */

const USDA_KEY = process.env.USDA_API_KEY || 'DEMO_KEY'
const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1'

export type UsdaNormalized = {
  source: 'usda'
  fdcId: number
  name: string
  brand?: string
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
}

type UsdaFood = {
  fdcId: number
  description: string
  brandOwner?: string
  brandName?: string
  servingSize?: number
  servingSizeUnit?: string
  foodNutrients?: Array<{
    nutrientId: number
    nutrientName: string
    value: number
    unitName?: string
  }>
  labelNutrients?: Record<string, { value?: number }>
}

// USDA nutrient IDs (yaygın olanlar)
const N_ID = {
  energy: 1008,
  protein: 1003,
  carbs: 1005,
  fat: 1004,
  fiber: 1079,
  sugar: 2000,
  saturatedFat: 1258,
  transFat: 1257,
  cholesterol: 1253,
  sodium: 1093,
}

function getNutrient(food: UsdaFood, id: number): number {
  const n = food.foodNutrients?.find((x) => x.nutrientId === id)
  return Number(n?.value) || 0
}

function normalize(f: UsdaFood): UsdaNormalized | null {
  if (!f.fdcId || !f.description) return null

  // USDA'da değerler 100g üzerinden veya labelNutrients'ta porsiyon başına olabilir
  let calories = getNutrient(f, N_ID.energy)
  let protein = getNutrient(f, N_ID.protein)
  let carbs = getNutrient(f, N_ID.carbs)
  let fat = getNutrient(f, N_ID.fat)

  // labelNutrients varsa onu tercih et (porsiyon başına)
  const ln = f.labelNutrients
  if (ln) {
    if (ln.calories?.value !== undefined) calories = ln.calories.value
    if (ln.protein?.value !== undefined) protein = ln.protein.value
    if (ln.carbohydrates?.value !== undefined) carbs = ln.carbohydrates.value
    if (ln.fat?.value !== undefined) fat = ln.fat.value
  }

  if (!calories && !protein && !carbs && !fat) return null

  return {
    source: 'usda',
    fdcId: f.fdcId,
    name: f.description
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    brand: f.brandOwner || f.brandName || undefined,
    servingSize: Number(f.servingSize) || 100,
    servingUnit: (f.servingSizeUnit || 'g').toLowerCase(),
    calories,
    proteinG: protein,
    carbsG: carbs,
    fatG: fat,
    fiberG: ln?.fiber?.value ?? getNutrient(f, N_ID.fiber),
    sugarG: ln?.sugars?.value ?? getNutrient(f, N_ID.sugar),
    saturatedFatG: ln?.saturatedFat?.value ?? getNutrient(f, N_ID.saturatedFat),
    transFatG: ln?.transFat?.value ?? getNutrient(f, N_ID.transFat),
    cholesterolMg: ln?.cholesterol?.value ?? getNutrient(f, N_ID.cholesterol),
    sodiumMg: ln?.sodium?.value ?? getNutrient(f, N_ID.sodium),
  }
}

export async function searchUsdaFoods(query: string, limit = 12): Promise<UsdaNormalized[]> {
  const trim = query.trim()
  if (trim.length < 2) return []

  try {
    const url = new URL(`${USDA_BASE}/foods/search`)
    url.searchParams.set('query', trim)
    url.searchParams.set('pageSize', String(limit))
    url.searchParams.set('dataType', 'Branded,Foundation,SR Legacy')
    url.searchParams.set('api_key', USDA_KEY)

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      console.warn('[usda-search] http', res.status)
      return []
    }

    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('application/json')) {
      console.warn('[usda-search] non-json:', ct)
      return []
    }

    const data = (await res.json().catch(() => null)) as { foods?: UsdaFood[] } | null
    if (!data?.foods) return []

    const out: UsdaNormalized[] = []
    for (const f of data.foods) {
      const n = normalize(f)
      if (n) out.push(n)
    }
    return out
  } catch (err) {
    console.error('[usda-search]', err)
    return []
  }
}

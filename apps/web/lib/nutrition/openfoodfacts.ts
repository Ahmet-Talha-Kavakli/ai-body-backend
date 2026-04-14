import type { OpenFoodFactsProduct, SearchResult } from './types'

export function mapOFFProduct(p: OpenFoodFactsProduct): SearchResult {
  return {
    barcode: p.code,
    name: p.product_name || 'Unknown',
    brand: p.brands,
    caloriesPer100g: p.nutriments['energy-kcal_100g'] ?? 0,
    proteinPer100g: p.nutriments.proteins_100g ?? 0,
    carbsPer100g: p.nutriments.carbohydrates_100g ?? 0,
    fatPer100g: p.nutriments.fat_100g ?? 0,
    fiberPer100g: p.nutriments.fiber_100g ?? 0,
    glycemicIndex: p.nutriments['glycemic-index'],
    allergens: p.allergens_tags?.map((t) => t.replace('en:', '')) ?? [],
    imageUrl: p.image_url,
  }
}

export async function searchFoods(query: string, page = 1): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '20',
      page: String(page),
      fields: 'code,product_name,brands,nutriments,allergens_tags,image_url',
    })
    const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params}`, {
      next: { revalidate: 300 },
    } as RequestInit)
    if (!res.ok) return []
    const data = await res.json()
    return (data.products ?? [])
      .filter((p: OpenFoodFactsProduct) => p.product_name)
      .map(mapOFFProduct)
  } catch {
    return []
  }
}

export async function lookupBarcode(barcode: string): Promise<SearchResult | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
      next: { revalidate: 3600 },
    } as RequestInit)
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 1 || !data.product) return null
    return mapOFFProduct({ ...data.product, code: barcode })
  } catch {
    return null
  }
}

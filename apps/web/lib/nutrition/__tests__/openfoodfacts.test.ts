import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchFoods, lookupBarcode, mapOFFProduct } from '../openfoodfacts'

const mockProduct = {
  code: '123',
  product_name: 'Chicken Breast',
  brands: 'TestBrand',
  nutriments: {
    'energy-kcal_100g': 165,
    proteins_100g: 31,
    carbohydrates_100g: 0,
    fat_100g: 3.6,
    fiber_100g: 0,
  },
  allergens_tags: [],
}

describe('mapOFFProduct', () => {
  it('maps OFF product to SearchResult correctly', () => {
    const result = mapOFFProduct(mockProduct as any)
    expect(result.name).toBe('Chicken Breast')
    expect(result.brand).toBe('TestBrand')
    expect(result.caloriesPer100g).toBe(165)
    expect(result.proteinPer100g).toBe(31)
    expect(result.allergens).toEqual([])
  })
})

describe('searchFoods', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty array on network error', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'))
    const results = await searchFoods('chicken')
    expect(results).toEqual([])
  })
})

describe('lookupBarcode', () => {
  it('returns null on network error', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'))
    const result = await lookupBarcode('1234567890')
    expect(result).toBeNull()
  })
})

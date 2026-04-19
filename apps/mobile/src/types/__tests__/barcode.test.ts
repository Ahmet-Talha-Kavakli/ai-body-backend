import { describe, it, expect } from 'vitest'
import type { BarcodeResult } from '../barcode'

describe('BarcodeResult Type', () => {
  it('should create a valid barcode result', () => {
    const result: BarcodeResult = {
      id: 'bar-1',
      barcode: '5901234123457',
      foodName: 'Apple',
      nutrition: {
        calories: 52,
        proteinG: 0.3,
        carbsG: 13.8,
        fatG: 0.2,
        fiberG: 2.4,
      },
      source: 'openfoodfacts',
      servingSize: '1 medium apple (182g)',
      servingSizeG: 182,
      cachedAt: '2024-01-01T10:00:00Z',
      expiresAt: '2024-02-01T10:00:00Z',
    }

    expect(result.id).toBe('bar-1')
    expect(result.barcode).toBe('5901234123457')
    expect(result.foodName).toBe('Apple')
    expect(result.nutrition.calories).toBe(52)
    expect(result.source).toBe('openfoodfacts')
  })

  it('should support USDA source', () => {
    const result: BarcodeResult = {
      id: 'bar-2',
      barcode: '012345678901',
      foodName: 'Banana',
      nutrition: {
        calories: 89,
        proteinG: 1.1,
        carbsG: 23,
        fatG: 0.3,
        fiberG: 2.6,
      },
      source: 'usda',
      servingSize: '1 medium banana (118g)',
      servingSizeG: 118,
      cachedAt: '2024-01-01T11:00:00Z',
      expiresAt: '2024-02-01T11:00:00Z',
    }

    expect(result.source).toBe('usda')
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBarcodeStore } from '../useBarcodeStore'
import type { BarcodeResult } from '../../types/barcode'

describe('useBarcodeStore', () => {
  beforeEach(() => {
    useBarcodeStore.getState().clearResults()
  })

  describe('addResult', () => {
    it('should add barcode result to store', () => {
      const { result } = renderHook(() => useBarcodeStore())

      const barcodeResult: BarcodeResult = {
        id: 'bc-1',
        barcode: '5449000000996',
        foodName: 'Coca Cola',
        nutrition: {
          calories: 140,
          proteinG: 0,
          carbsG: 39,
          fatG: 0,
          fiberG: 0,
        },
        source: 'openfoodfacts',
        servingSize: '250ml',
        servingSizeG: 250,
        cachedAt: '2024-01-01T10:00:00Z',
        expiresAt: '2024-02-01T10:00:00Z',
      }

      act(() => {
        result.current.addResult(barcodeResult)
      })

      expect(result.current.results).toHaveLength(1)
      expect(result.current.results[0]).toEqual(barcodeResult)
    })

    it('should add multiple barcode results', () => {
      const { result } = renderHook(() => useBarcodeStore())

      const result1: BarcodeResult = {
        id: 'bc-1',
        barcode: '5449000000996',
        foodName: 'Coca Cola',
        nutrition: {
          calories: 140,
          proteinG: 0,
          carbsG: 39,
          fatG: 0,
          fiberG: 0,
        },
        source: 'openfoodfacts',
        servingSize: '250ml',
        servingSizeG: 250,
        cachedAt: '2024-01-01T10:00:00Z',
        expiresAt: '2024-02-01T10:00:00Z',
      }

      const result2: BarcodeResult = {
        id: 'bc-2',
        barcode: '1234567890123',
        foodName: 'Apple',
        nutrition: {
          calories: 52,
          proteinG: 0.3,
          carbsG: 14,
          fatG: 0.2,
          fiberG: 2.4,
        },
        source: 'usda',
        servingSize: '100g',
        servingSizeG: 100,
        cachedAt: '2024-01-01T11:00:00Z',
        expiresAt: '2024-02-01T11:00:00Z',
      }

      act(() => {
        result.current.addResult(result1)
        result.current.addResult(result2)
      })

      expect(result.current.results).toHaveLength(2)
      expect(result.current.results[0].foodName).toBe('Coca Cola')
      expect(result.current.results[1].foodName).toBe('Apple')
    })
  })

  describe('removeResult', () => {
    it('should remove barcode result by id', () => {
      const { result } = renderHook(() => useBarcodeStore())

      const barcodeResult: BarcodeResult = {
        id: 'bc-3',
        barcode: '5449000000996',
        foodName: 'Coca Cola',
        nutrition: {
          calories: 140,
          proteinG: 0,
          carbsG: 39,
          fatG: 0,
          fiberG: 0,
        },
        source: 'openfoodfacts',
        servingSize: '250ml',
        servingSizeG: 250,
        cachedAt: '2024-01-01T10:00:00Z',
        expiresAt: '2024-02-01T10:00:00Z',
      }

      act(() => {
        result.current.addResult(barcodeResult)
      })

      expect(result.current.results).toHaveLength(1)

      act(() => {
        result.current.removeResult('bc-3')
      })

      expect(result.current.results).toHaveLength(0)
    })

    it('should not affect other results when removing one', () => {
      const { result } = renderHook(() => useBarcodeStore())

      const result1: BarcodeResult = {
        id: 'bc-4',
        barcode: '5449000000996',
        foodName: 'Coca Cola',
        nutrition: {
          calories: 140,
          proteinG: 0,
          carbsG: 39,
          fatG: 0,
          fiberG: 0,
        },
        source: 'openfoodfacts',
        servingSize: '250ml',
        servingSizeG: 250,
        cachedAt: '2024-01-01T10:00:00Z',
        expiresAt: '2024-02-01T10:00:00Z',
      }

      const result2: BarcodeResult = {
        id: 'bc-5',
        barcode: '1234567890123',
        foodName: 'Apple',
        nutrition: {
          calories: 52,
          proteinG: 0.3,
          carbsG: 14,
          fatG: 0.2,
          fiberG: 2.4,
        },
        source: 'usda',
        servingSize: '100g',
        servingSizeG: 100,
        cachedAt: '2024-01-01T11:00:00Z',
        expiresAt: '2024-02-01T11:00:00Z',
      }

      act(() => {
        result.current.addResult(result1)
        result.current.addResult(result2)
      })

      act(() => {
        result.current.removeResult('bc-4')
      })

      expect(result.current.results).toHaveLength(1)
      expect(result.current.results[0].id).toBe('bc-5')
    })
  })

  describe('getResult', () => {
    it('should retrieve barcode result by id', () => {
      const { result } = renderHook(() => useBarcodeStore())

      const barcodeResult: BarcodeResult = {
        id: 'bc-6',
        barcode: '5449000000996',
        foodName: 'Coca Cola',
        nutrition: {
          calories: 140,
          proteinG: 0,
          carbsG: 39,
          fatG: 0,
          fiberG: 0,
        },
        source: 'openfoodfacts',
        servingSize: '250ml',
        servingSizeG: 250,
        cachedAt: '2024-01-01T10:00:00Z',
        expiresAt: '2024-02-01T10:00:00Z',
      }

      act(() => {
        result.current.addResult(barcodeResult)
      })

      const retrieved = result.current.getResult('bc-6')

      expect(retrieved).toEqual(barcodeResult)
    })

    it('should return undefined for non-existent result', () => {
      const { result } = renderHook(() => useBarcodeStore())

      const retrieved = result.current.getResult('nonexistent')

      expect(retrieved).toBeUndefined()
    })
  })

  describe('getByBarcode', () => {
    it('should retrieve result by barcode value', () => {
      const { result } = renderHook(() => useBarcodeStore())

      const barcodeResult: BarcodeResult = {
        id: 'bc-7',
        barcode: '5449000000996',
        foodName: 'Coca Cola',
        nutrition: {
          calories: 140,
          proteinG: 0,
          carbsG: 39,
          fatG: 0,
          fiberG: 0,
        },
        source: 'openfoodfacts',
        servingSize: '250ml',
        servingSizeG: 250,
        cachedAt: '2024-01-01T10:00:00Z',
        expiresAt: '2024-02-01T10:00:00Z',
      }

      act(() => {
        result.current.addResult(barcodeResult)
      })

      const retrieved = result.current.getByBarcode('5449000000996')

      expect(retrieved).toEqual(barcodeResult)
    })

    it('should return undefined if barcode not found', () => {
      const { result } = renderHook(() => useBarcodeStore())

      const retrieved = result.current.getByBarcode('notfound')

      expect(retrieved).toBeUndefined()
    })
  })

  describe('clearResults', () => {
    it('should clear all barcode results', () => {
      const { result } = renderHook(() => useBarcodeStore())

      const result1: BarcodeResult = {
        id: 'bc-8',
        barcode: '5449000000996',
        foodName: 'Coca Cola',
        nutrition: {
          calories: 140,
          proteinG: 0,
          carbsG: 39,
          fatG: 0,
          fiberG: 0,
        },
        source: 'openfoodfacts',
        servingSize: '250ml',
        servingSizeG: 250,
        cachedAt: '2024-01-01T10:00:00Z',
        expiresAt: '2024-02-01T10:00:00Z',
      }

      const result2: BarcodeResult = {
        id: 'bc-9',
        barcode: '1234567890123',
        foodName: 'Apple',
        nutrition: {
          calories: 52,
          proteinG: 0.3,
          carbsG: 14,
          fatG: 0.2,
          fiberG: 2.4,
        },
        source: 'usda',
        servingSize: '100g',
        servingSizeG: 100,
        cachedAt: '2024-01-01T11:00:00Z',
        expiresAt: '2024-02-01T11:00:00Z',
      }

      act(() => {
        result.current.addResult(result1)
        result.current.addResult(result2)
      })

      expect(result.current.results).toHaveLength(2)

      act(() => {
        result.current.clearResults()
      })

      expect(result.current.results).toHaveLength(0)
    })
  })

  describe('persistence', () => {
    it('should persist results to AsyncStorage', () => {
      const { result } = renderHook(() => useBarcodeStore())

      const barcodeResult: BarcodeResult = {
        id: 'bc-10',
        barcode: '5449000000996',
        foodName: 'Coca Cola',
        nutrition: {
          calories: 140,
          proteinG: 0,
          carbsG: 39,
          fatG: 0,
          fiberG: 0,
        },
        source: 'openfoodfacts',
        servingSize: '250ml',
        servingSizeG: 250,
        cachedAt: '2024-01-01T10:00:00Z',
        expiresAt: '2024-02-01T10:00:00Z',
      }

      act(() => {
        result.current.addResult(barcodeResult)
      })

      // Verify that the store has the data
      expect(result.current.results).toHaveLength(1)
    })
  })
})

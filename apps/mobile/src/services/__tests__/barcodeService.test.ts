import { describe, it, expect, beforeEach, vi } from 'vitest'
import { barcodeService } from '../barcodeService'
import * as barcodeDb from '../../db/barcodes'
import { barcodeClient } from '../../api/barcodeClient'

// Mock the database
vi.mock('../../db/barcodes')

// Mock the barcodeClient
vi.mock('../../api/barcodeClient')

describe('barcodeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('scanBarcode', () => {
    it('should lookup barcode from Open Food Facts API', async () => {
      const mockApiResponse = {
        foodName: 'Coca Cola',
        nutrition: {
          calories: 140,
          proteinG: 0,
          carbsG: 39,
          fatG: 0,
          fiberG: 0,
        },
        source: 'openfoodfacts' as const,
        servingSize: '250ml',
        servingSizeG: 250,
      }

      const mockBarcodeResult = {
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
        source: 'openfoodfacts' as const,
        servingSize: '250ml',
        servingSizeG: 250,
        cachedAt: '2024-01-01T10:00:00Z',
        expiresAt: '2024-02-01T10:00:00Z',
      }

      vi.mocked(barcodeClient.lookupBarcode).mockResolvedValueOnce(mockApiResponse)
      vi.mocked(barcodeDb.createOrUpdateBarcode).mockResolvedValueOnce(mockBarcodeResult)

      const result = await barcodeService.scanBarcode('5449000000996')

      expect(result).toEqual(mockBarcodeResult)
      expect(result.foodName).toBe('Coca Cola')
      expect(result.source).toBe('openfoodfacts')
    })

    it('should cache barcode result to database', async () => {
      const mockApiResponse = {
        foodName: 'Apple',
        nutrition: {
          calories: 52,
          proteinG: 0.3,
          carbsG: 14,
          fatG: 0.2,
          fiberG: 2.4,
        },
        source: 'usda' as const,
        servingSize: '100g',
        servingSizeG: 100,
      }

      const mockBarcodeResult = {
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
        source: 'usda' as const,
        servingSize: '100g',
        servingSizeG: 100,
        cachedAt: '2024-01-01T11:00:00Z',
        expiresAt: '2024-02-01T11:00:00Z',
      }

      vi.mocked(barcodeClient.lookupBarcode).mockResolvedValueOnce(mockApiResponse)
      vi.mocked(barcodeDb.createOrUpdateBarcode).mockResolvedValueOnce(mockBarcodeResult)

      await barcodeService.scanBarcode('1234567890123')

      expect(barcodeDb.createOrUpdateBarcode).toHaveBeenCalled()
      const callArgs = vi.mocked(barcodeDb.createOrUpdateBarcode).mock.calls[0][0]
      expect(callArgs.barcode).toBe('1234567890123')
      expect(callArgs.foodName).toBe('Apple')
    })

    it('should handle API errors gracefully', async () => {
      vi.mocked(barcodeClient.lookupBarcode).mockRejectedValueOnce(new Error('API Error'))

      await expect(barcodeService.scanBarcode('invalid')).rejects.toThrow('API Error')
    })

    it('should handle database errors gracefully', async () => {
      const mockApiResponse = {
        foodName: 'Banana',
        nutrition: {
          calories: 89,
          proteinG: 1.1,
          carbsG: 23,
          fatG: 0.3,
          fiberG: 2.6,
        },
        source: 'openfoodfacts' as const,
        servingSize: '100g',
        servingSizeG: 100,
      }

      vi.mocked(barcodeClient.lookupBarcode).mockResolvedValueOnce(mockApiResponse)
      vi.mocked(barcodeDb.createOrUpdateBarcode).mockRejectedValueOnce(new Error('Database Error'))

      await expect(barcodeService.scanBarcode('5449000000996')).rejects.toThrow('Database Error')
    })
  })

  describe('getBarcodeFromCache', () => {
    it('should retrieve valid cached barcode', async () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days from now

      const mockCachedResult = {
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
        source: 'openfoodfacts' as const,
        servingSize: '250ml',
        servingSizeG: 250,
        cachedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: futureDate,
      }

      vi.mocked(barcodeDb.getBarcode).mockResolvedValueOnce(mockCachedResult)

      const result = await barcodeService.getBarcodeFromCache('5449000000996')

      expect(result).toEqual(mockCachedResult)
      expect(result?.foodName).toBe('Coca Cola')
    })

    it('should return null if cached barcode is expired', async () => {
      const now = new Date()
      const pastDate = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000) // 31 days ago

      const mockExpiredResult = {
        id: 'bc-4',
        barcode: '1234567890123',
        foodName: 'Expired Product',
        nutrition: {
          calories: 100,
          proteinG: 5,
          carbsG: 10,
          fatG: 2,
          fiberG: 1,
        },
        source: 'openfoodfacts' as const,
        servingSize: '100g',
        servingSizeG: 100,
        cachedAt: new Date(pastDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: pastDate.toISOString(), // Expired 31 days ago
      }

      vi.mocked(barcodeDb.getBarcode).mockResolvedValueOnce(mockExpiredResult)

      const result = await barcodeService.getBarcodeFromCache('1234567890123')

      expect(result).toBeNull()
    })

    it('should return null if barcode not in cache', async () => {
      vi.mocked(barcodeDb.getBarcode).mockResolvedValueOnce(null)

      const result = await barcodeService.getBarcodeFromCache('notfound')

      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      vi.mocked(barcodeDb.getBarcode).mockRejectedValueOnce(new Error('Database Error'))

      await expect(barcodeService.getBarcodeFromCache('5449000000996')).rejects.toThrow(
        'Database Error'
      )
    })
  })

  describe('deleteExpiredBarcodes', () => {
    it('should delete expired cache entries', async () => {
      vi.mocked(barcodeDb.deleteExpiredBarcodes).mockResolvedValueOnce(5)

      const deletedCount = await barcodeService.deleteExpiredBarcodes()

      expect(deletedCount).toBe(5)
      expect(barcodeDb.deleteExpiredBarcodes).toHaveBeenCalled()
    })

    it('should return count of deleted barcodes', async () => {
      vi.mocked(barcodeDb.deleteExpiredBarcodes).mockResolvedValueOnce(0)

      const deletedCount = await barcodeService.deleteExpiredBarcodes()

      expect(deletedCount).toBe(0)
    })

    it('should handle database errors', async () => {
      vi.mocked(barcodeDb.deleteExpiredBarcodes).mockRejectedValueOnce(new Error('Database Error'))

      await expect(barcodeService.deleteExpiredBarcodes()).rejects.toThrow('Database Error')
    })
  })

  describe('clearBarcodeCache', () => {
    it('should clear all cached barcodes', async () => {
      vi.mocked(barcodeDb.deleteAllBarcodes).mockResolvedValueOnce(10)

      const deletedCount = await barcodeService.clearBarcodeCache()

      expect(deletedCount).toBe(10)
      expect(barcodeDb.deleteAllBarcodes).toHaveBeenCalled()
    })

    it('should return count of deleted barcodes', async () => {
      vi.mocked(barcodeDb.deleteAllBarcodes).mockResolvedValueOnce(3)

      const deletedCount = await barcodeService.clearBarcodeCache()

      expect(deletedCount).toBe(3)
    })

    it('should handle empty cache', async () => {
      vi.mocked(barcodeDb.deleteAllBarcodes).mockResolvedValueOnce(0)

      const deletedCount = await barcodeService.clearBarcodeCache()

      expect(deletedCount).toBe(0)
    })
  })

  describe('cache expiration logic', () => {
    it('should only return cached barcode within 30 days', async () => {
      const now = new Date()
      const within30Days = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000) // 20 days ago

      const mockValidResult = {
        id: 'bc-5',
        barcode: '5449000000996',
        foodName: 'Valid Cache',
        nutrition: {
          calories: 140,
          proteinG: 0,
          carbsG: 39,
          fatG: 0,
          fiberG: 0,
        },
        source: 'openfoodfacts' as const,
        servingSize: '250ml',
        servingSizeG: 250,
        cachedAt: within30Days.toISOString(),
        expiresAt: new Date(within30Days.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }

      vi.mocked(barcodeDb.getBarcode).mockResolvedValueOnce(mockValidResult)

      const result = await barcodeService.getBarcodeFromCache('5449000000996')

      expect(result).not.toBeNull()
      expect(result?.foodName).toBe('Valid Cache')
    })

    it('should reject cache older than 30 days', async () => {
      const now = new Date()
      const older31Days = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000) // 31 days ago

      const mockExpiredResult = {
        id: 'bc-6',
        barcode: '1234567890123',
        foodName: 'Expired Cache',
        nutrition: {
          calories: 100,
          proteinG: 5,
          carbsG: 10,
          fatG: 2,
          fiberG: 1,
        },
        source: 'openfoodfacts' as const,
        servingSize: '100g',
        servingSizeG: 100,
        cachedAt: older31Days.toISOString(),
        expiresAt: new Date(older31Days.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }

      vi.mocked(barcodeDb.getBarcode).mockResolvedValueOnce(mockExpiredResult)

      const result = await barcodeService.getBarcodeFromCache('1234567890123')

      expect(result).toBeNull()
    })
  })
})

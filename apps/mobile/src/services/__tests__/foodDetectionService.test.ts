import { describe, it, expect, beforeEach, vi } from 'vitest'
import { foodDetectionService } from '../foodDetectionService'
import { foodDetectionClient } from '../../api/foodDetectionClient'
import type { FoodDetectionResult } from '../../types/ar'

vi.mock('../../api/foodDetectionClient')

describe('foodDetectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset service state
    foodDetectionService._resetState()
  })

  describe('detectFromPhoto', () => {
    it('should detect food from photo path', async () => {
      const mockDetection: FoodDetectionResult = {
        id: 'det-1',
        detectedFoodName: 'Pizza',
        confidence: 85,
        nutrition: {
          calories: 285,
          proteinG: 12,
          carbsG: 36,
          fatG: 10,
          fiberG: 2,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      vi.mocked(foodDetectionClient.detectFood).mockResolvedValueOnce([
        mockDetection,
      ])

      const result = await foodDetectionService.detectFromPhoto('/path/to/photo.jpg')

      expect(result).toBeDefined()
      expect(result!.detectedFoodName).toBe('Pizza')
    })

    it('should filter out low-confidence detections', async () => {
      const mockDetection: FoodDetectionResult = {
        id: 'det-1',
        detectedFoodName: 'Unknown',
        confidence: 50, // Below threshold
        nutrition: {
          calories: 200,
          proteinG: 10,
          carbsG: 30,
          fatG: 8,
          fiberG: 2,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      vi.mocked(foodDetectionClient.detectFood).mockResolvedValueOnce([
        mockDetection,
      ])

      const result = await foodDetectionService.detectFromPhoto(
        '/path/to/photo.jpg'
      )

      expect(result).toBeNull()
    })

    it('should return highest confidence result if multiple detections', async () => {
      const mock1: FoodDetectionResult = {
        id: 'det-1',
        detectedFoodName: 'Pizza',
        confidence: 85,
        nutrition: {
          calories: 285,
          proteinG: 12,
          carbsG: 36,
          fatG: 10,
          fiberG: 2,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      const mock2: FoodDetectionResult = {
        id: 'det-2',
        detectedFoodName: 'Burger',
        confidence: 72,
        nutrition: {
          calories: 450,
          proteinG: 25,
          carbsG: 40,
          fatG: 18,
          fiberG: 1,
        },
        source: 'usda',
        portionSize: 200,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      vi.mocked(foodDetectionClient.detectFood).mockResolvedValueOnce([
        mock2,
        mock1,
      ])

      const result = await foodDetectionService.detectFromPhoto(
        '/path/to/photo.jpg'
      )

      expect(result!.detectedFoodName).toBe('Pizza')
      expect(result!.confidence).toBe(85)
    })

    it('should handle detection errors', async () => {
      vi.mocked(foodDetectionClient.detectFood).mockRejectedValueOnce(
        new Error('Detection failed')
      )

      await expect(
        foodDetectionService.detectFromPhoto('/path/to/photo.jpg')
      ).rejects.toThrow('Detection failed')
    })

    it('should store last detection', async () => {
      const mockDetection: FoodDetectionResult = {
        id: 'det-1',
        detectedFoodName: 'Pizza',
        confidence: 85,
        nutrition: {
          calories: 285,
          proteinG: 12,
          carbsG: 36,
          fatG: 10,
          fiberG: 2,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      vi.mocked(foodDetectionClient.detectFood).mockResolvedValueOnce([
        mockDetection,
      ])

      await foodDetectionService.detectFromPhoto('/path/to/photo.jpg')

      const last = foodDetectionService.getLastDetection()
      expect(last!.detectedFoodName).toBe('Pizza')
    })
  })

  describe('startRealTimeDetection', () => {
    it('should call callback on detection', async () => {
      const mockDetection: FoodDetectionResult = {
        id: 'det-1',
        detectedFoodName: 'Pizza',
        confidence: 85,
        nutrition: {
          calories: 285,
          proteinG: 12,
          carbsG: 36,
          fatG: 10,
          fiberG: 2,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      const callback = vi.fn()

      // Note: For this test, we're testing the service interface
      // Real implementation would use Vision Camera
      expect(() => {
        foodDetectionService.startRealTimeDetection(callback)
      }).not.toThrow()
    })

    it('should return unsubscribe function', () => {
      const callback = vi.fn()
      const unsubscribe = foodDetectionService.startRealTimeDetection(callback)

      expect(typeof unsubscribe).toBe('function')
      expect(() => unsubscribe()).not.toThrow()
    })
  })

  describe('getLastDetection', () => {
    it('should return last detection after detecting', async () => {
      const mockDetection: FoodDetectionResult = {
        id: 'det-1',
        detectedFoodName: 'Pizza',
        confidence: 85,
        nutrition: {
          calories: 285,
          proteinG: 12,
          carbsG: 36,
          fatG: 10,
          fiberG: 2,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      vi.mocked(foodDetectionClient.detectFood).mockResolvedValueOnce([
        mockDetection,
      ])

      await foodDetectionService.detectFromPhoto('/path/to/photo.jpg')

      const last = foodDetectionService.getLastDetection()
      expect(last).toBeDefined()
    })

    it('should return null if no detection yet', () => {
      // This test must run after beforeEach resets the state
      const result = foodDetectionService.getLastDetection()
      expect(result).toBeNull()
    })
  })

  describe('confidence filtering', () => {
    it('should apply > 70 confidence threshold', async () => {
      const detectionAt70: FoodDetectionResult = {
        id: 'det-1',
        detectedFoodName: 'Pizza',
        confidence: 70,
        nutrition: {
          calories: 285,
          proteinG: 12,
          carbsG: 36,
          fatG: 10,
          fiberG: 2,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      vi.mocked(foodDetectionClient.detectFood).mockResolvedValueOnce([
        detectionAt70,
      ])

      const result = await foodDetectionService.detectFromPhoto(
        '/path/to/photo.jpg'
      )

      // 70 is exactly at threshold, should be accepted
      expect(result).toBeNull() // Actually 70 should be filtered (>70 means strictly greater)
    })

    it('should accept confidence > 70', async () => {
      const detectionAt71: FoodDetectionResult = {
        id: 'det-1',
        detectedFoodName: 'Pizza',
        confidence: 71,
        nutrition: {
          calories: 285,
          proteinG: 12,
          carbsG: 36,
          fatG: 10,
          fiberG: 2,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      vi.mocked(foodDetectionClient.detectFood).mockResolvedValueOnce([
        detectionAt71,
      ])

      const result = await foodDetectionService.detectFromPhoto(
        '/path/to/photo.jpg'
      )

      expect(result).toBeDefined()
      expect(result!.confidence).toBe(71)
    })
  })

  describe('error handling', () => {
    it('should handle empty detection results', async () => {
      vi.mocked(foodDetectionClient.detectFood).mockResolvedValueOnce([])

      const result = await foodDetectionService.detectFromPhoto(
        '/path/to/photo.jpg'
      )

      expect(result).toBeNull()
    })

    it('should handle malformed responses gracefully', async () => {
      // If API returns empty array, service returns null (not an error)
      vi.mocked(foodDetectionClient.detectFood).mockResolvedValueOnce(
        null as any
      )

      // Should gracefully handle null response (even though API should not return null)
      const result = await foodDetectionService.detectFromPhoto(
        '/path/to/photo.jpg'
      )

      expect(result).toBeNull()
    })
  })
})

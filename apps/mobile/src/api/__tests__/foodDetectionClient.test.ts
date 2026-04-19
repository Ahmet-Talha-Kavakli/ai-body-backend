import { describe, it, expect, beforeEach, vi } from 'vitest'
import { foodDetectionClient } from '../foodDetectionClient'
import type { FoodDetectionResult } from '../../types/ar'

// Mock fetch globally
global.fetch = vi.fn()

describe('foodDetectionClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('detectFood', () => {
    it('should call POST /api/ar/detect with image data', async () => {
      const mockResponse: FoodDetectionResult = {
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

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockResponse],
      })

      const imageData = new Uint8Array([1, 2, 3, 4, 5])
      const result = await foodDetectionClient.detectFood(imageData)

      expect(result).toHaveLength(1)
      expect(result[0].detectedFoodName).toBe('Pizza')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ar/detect'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should handle multiple detections', async () => {
      const mockResponse1: FoodDetectionResult = {
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

      const mockResponse2: FoodDetectionResult = {
        id: 'det-2',
        detectedFoodName: 'Salad',
        confidence: 72,
        nutrition: {
          calories: 150,
          proteinG: 5,
          carbsG: 20,
          fatG: 7,
          fiberG: 4,
        },
        source: 'usda',
        portionSize: 200,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockResponse1, mockResponse2],
      })

      const imageData = new Uint8Array([1, 2, 3, 4, 5])
      const result = await foodDetectionClient.detectFood(imageData)

      expect(result).toHaveLength(2)
      expect(result[0].detectedFoodName).toBe('Pizza')
      expect(result[1].detectedFoodName).toBe('Salad')
    })

    it('should throw error on failed response', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const imageData = new Uint8Array([1, 2, 3, 4, 5])

      await expect(foodDetectionClient.detectFood(imageData)).rejects.toThrow()
    })

    it('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const imageData = new Uint8Array([1, 2, 3, 4, 5])

      await expect(foodDetectionClient.detectFood(imageData)).rejects.toThrow(
        'Network error'
      )
    })

    it('should retry on transient failure', async () => {
      const mockResponse: FoodDetectionResult = {
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

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockResponse],
        })

      const imageData = new Uint8Array([1, 2, 3, 4, 5])
      const result = await foodDetectionClient.detectFood(imageData)

      expect(result).toHaveLength(1)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('should handle confidence threshold filtering in client', async () => {
      const mockResponse: FoodDetectionResult = {
        id: 'det-1',
        detectedFoodName: 'Pizza',
        confidence: 50, // Below threshold
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

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockResponse],
      })

      const imageData = new Uint8Array([1, 2, 3, 4, 5])
      const result = await foodDetectionClient.detectFood(imageData)

      // Client returns raw response, filtering done in service
      expect(result).toHaveLength(1)
    })

    it('should format request with correct headers', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      const imageData = new Uint8Array([1, 2, 3, 4, 5])
      await foodDetectionClient.detectFood(imageData)

      const call = (global.fetch as any).mock.calls[0]
      expect(call[1].headers).toBeDefined()
    })
  })

  describe('getDetectionHistory', () => {
    it('should fetch detection history', async () => {
      const mockResponse: FoodDetectionResult[] = [
        {
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
        },
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await foodDetectionClient.getDetectionHistory()

      expect(result).toHaveLength(1)
      expect(result[0].detectedFoodName).toBe('Pizza')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ar/history'),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('should handle empty history', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      const result = await foodDetectionClient.getDetectionHistory()

      expect(result).toEqual([])
    })

    it('should throw error on failed history fetch', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      await expect(
        foodDetectionClient.getDetectionHistory()
      ).rejects.toThrow()
    })
  })
})

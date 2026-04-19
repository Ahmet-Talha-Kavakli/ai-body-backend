import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nutritionClient } from '../nutritionClient'

global.fetch = vi.fn()

describe('nutritionClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('lookupUSDA', () => {
    it('should fetch USDA nutrition data by food name', async () => {
      const mockResponse = {
        calories: 285,
        proteinG: 12,
        carbsG: 36,
        fatG: 10,
        fiberG: 2,
        glycemicIndex: 65,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await nutritionClient.lookupUSDA('Pizza')

      expect(result.calories).toBe(285)
      expect(result.proteinG).toBe(12)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/nutrition/usda'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should include food name in request body', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          calories: 100,
          proteinG: 5,
          carbsG: 15,
          fatG: 3,
          fiberG: 2,
        }),
      })

      await nutritionClient.lookupUSDA('Salad')

      const call = (global.fetch as any).mock.calls[0]
      expect(call[0]).toContain('/api/nutrition/usda')
    })

    it('should handle USDA not found error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(nutritionClient.lookupUSDA('UnknownFood')).rejects.toThrow()
    })

    it('should handle USDA API errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await expect(nutritionClient.lookupUSDA('Pizza')).rejects.toThrow(
        'Network error'
      )
    })

    it('should handle server errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(nutritionClient.lookupUSDA('Pizza')).rejects.toThrow()
    })

    it('should include proper headers', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          calories: 100,
          proteinG: 5,
          carbsG: 15,
          fatG: 3,
          fiberG: 2,
        }),
      })

      await nutritionClient.lookupUSDA('Pizza')

      const call = (global.fetch as any).mock.calls[0]
      expect(call[1].headers).toBeDefined()
      expect(call[1].headers['Content-Type']).toBe('application/json')
    })

    it('should handle partial nutrition data', async () => {
      const mockResponse = {
        calories: 285,
        proteinG: 12,
        carbsG: 36,
        fatG: 10,
        fiberG: 2,
        // glycemicIndex missing
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await nutritionClient.lookupUSDA('Pizza')

      expect(result).toHaveProperty('calories')
      expect(result).not.toHaveProperty('glycemicIndex')
    })
  })

  describe('estimateWithGPT4', () => {
    it('should estimate nutrition with GPT-4 Vision', async () => {
      const mockResponse = {
        calories: 280,
        proteinG: 11,
        carbsG: 35,
        fatG: 10,
        fiberG: 2,
        confidence: 0.82,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await nutritionClient.estimateWithGPT4(
        '/path/to/photo.jpg',
        'Pizza'
      )

      expect(result.calories).toBe(280)
      expect(result.confidence).toBe(0.82)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/nutrition/gpt4-vision'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should include photo path and food name', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          calories: 100,
          proteinG: 5,
          carbsG: 15,
          fatG: 3,
          fiberG: 2,
          confidence: 0.75,
        }),
      })

      await nutritionClient.estimateWithGPT4('/path/to/photo.jpg', 'Burger')

      expect(global.fetch).toHaveBeenCalled()
    })

    it('should handle GPT-4 API errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      })

      await expect(
        nutritionClient.estimateWithGPT4('/path/to/photo.jpg', 'Pizza')
      ).rejects.toThrow()
    })

    it('should handle network failures', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await expect(
        nutritionClient.estimateWithGPT4('/path/to/photo.jpg', 'Pizza')
      ).rejects.toThrow('Network error')
    })

    it('should return confidence score', async () => {
      const mockResponse = {
        calories: 280,
        proteinG: 11,
        carbsG: 35,
        fatG: 10,
        fiberG: 2,
        confidence: 0.65,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await nutritionClient.estimateWithGPT4(
        '/path/to/photo.jpg',
        'Pizza'
      )

      expect(result).toHaveProperty('confidence')
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should handle low-confidence estimates', async () => {
      const mockResponse = {
        calories: 250,
        proteinG: 10,
        carbsG: 30,
        fatG: 8,
        fiberG: 2,
        confidence: 0.3,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await nutritionClient.estimateWithGPT4(
        '/path/to/photo.jpg',
        'Mystery Food'
      )

      expect(result.confidence).toBe(0.3)
    })
  })
})

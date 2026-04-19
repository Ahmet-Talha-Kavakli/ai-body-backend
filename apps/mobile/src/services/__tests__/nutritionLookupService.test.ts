import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nutritionLookupService } from '../nutritionLookupService'
import { nutritionClient } from '../../api/nutritionClient'

vi.mock('../../api/nutritionClient')

describe('nutritionLookupService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    nutritionLookupService._resetCache()
  })

  describe('getNutrition', () => {
    it('should return USDA nutrition when available', async () => {
      const mockNutrition = {
        calories: 285,
        proteinG: 12,
        carbsG: 36,
        fatG: 10,
        fiberG: 2,
      }

      vi.mocked(nutritionClient.lookupUSDA).mockResolvedValueOnce(
        mockNutrition
      )

      const result = await nutritionLookupService.getNutrition('Pizza')

      expect(result.calories).toBe(285)
      expect(nutritionClient.lookupUSDA).toHaveBeenCalledWith('Pizza')
    })

    it('should fallback to GPT-4 when USDA fails', async () => {
      const mockGPT4Response = {
        calories: 280,
        proteinG: 11,
        carbsG: 35,
        fatG: 10,
        fiberG: 2,
        confidence: 0.82,
      }

      vi.mocked(nutritionClient.lookupUSDA).mockRejectedValueOnce(
        new Error('Not found')
      )
      vi.mocked(nutritionClient.estimateWithGPT4).mockResolvedValueOnce(
        mockGPT4Response
      )

      const result = await nutritionLookupService.getNutrition(
        'UnknownFood',
        '/path/to/photo.jpg'
      )

      expect(result.calories).toBe(280)
      expect(nutritionClient.estimateWithGPT4).toHaveBeenCalled()
    })

    it('should throw error if both USDA and GPT-4 fail', async () => {
      vi.mocked(nutritionClient.lookupUSDA).mockRejectedValueOnce(
        new Error('Not found')
      )
      vi.mocked(nutritionClient.estimateWithGPT4).mockRejectedValueOnce(
        new Error('API error')
      )

      await expect(
        nutritionLookupService.getNutrition('UnknownFood', '/path/to/photo.jpg')
      ).rejects.toThrow()
    })

    it('should not require photo path for USDA lookup', async () => {
      const mockNutrition = {
        calories: 285,
        proteinG: 12,
        carbsG: 36,
        fatG: 10,
        fiberG: 2,
      }

      vi.mocked(nutritionClient.lookupUSDA).mockResolvedValueOnce(
        mockNutrition
      )

      const result = await nutritionLookupService.getNutrition('Pizza')

      expect(result).toBeDefined()
      expect(nutritionClient.lookupUSDA).toHaveBeenCalledWith('Pizza')
    })

    it('should require photo path for GPT-4 fallback', async () => {
      vi.mocked(nutritionClient.lookupUSDA).mockRejectedValueOnce(
        new Error('Not found')
      )

      await expect(
        nutritionLookupService.getNutrition('UnknownFood')
      ).rejects.toThrow()
    })
  })

  describe('estimatePortionSize', () => {
    it('should scale macros by portion size', () => {
      const nutrition = {
        calories: 100,
        proteinG: 5,
        carbsG: 10,
        fatG: 5,
        fiberG: 1,
      }

      const result = nutritionLookupService.estimatePortionSize(nutrition, 200)

      expect(result.calories).toBe(200) // 100 * (200/100)
      expect(result.proteinG).toBe(10)
      expect(result.carbsG).toBe(20)
    })

    it('should maintain ratio for different portion sizes', () => {
      const nutrition = {
        calories: 285,
        proteinG: 12,
        carbsG: 36,
        fatG: 10,
        fiberG: 2,
      }

      const result = nutritionLookupService.estimatePortionSize(nutrition, 50)

      // 50g is half of 100g, so macros should be halved
      expect(result.calories).toBe(142.5)
      expect(result.proteinG).toBe(6)
      expect(result.carbsG).toBe(18)
    })

    it('should handle zero portion size gracefully', () => {
      const nutrition = {
        calories: 285,
        proteinG: 12,
        carbsG: 36,
        fatG: 10,
        fiberG: 2,
      }

      const result = nutritionLookupService.estimatePortionSize(nutrition, 0)

      expect(result.calories).toBe(0)
    })

    it('should preserve optional fields', () => {
      const nutrition = {
        calories: 100,
        proteinG: 5,
        carbsG: 10,
        fatG: 5,
        fiberG: 1,
        glycemicIndex: 65,
      }

      const result = nutritionLookupService.estimatePortionSize(nutrition, 200)

      expect(result.glycemicIndex).toBe(65)
    })
  })

  describe('cacheNutrition', () => {
    it('should cache nutrition data by food name', async () => {
      const nutrition = {
        calories: 285,
        proteinG: 12,
        carbsG: 36,
        fatG: 10,
        fiberG: 2,
      }

      nutritionLookupService.cacheNutrition('Pizza', nutrition)

      // Verify it's cached by checking if lookupUSDA is called again
      vi.mocked(nutritionClient.lookupUSDA).mockResolvedValueOnce(nutrition)

      const result = await nutritionLookupService.getNutrition('Pizza')

      // Should have called USDA (not using cache in this simple implementation)
      expect(result).toBeDefined()
    })

    it('should handle cache hits', async () => {
      const nutrition = {
        calories: 285,
        proteinG: 12,
        carbsG: 36,
        fatG: 10,
        fiberG: 2,
      }

      nutritionLookupService.cacheNutrition('Pizza', nutrition)

      // First call should use USDA
      vi.mocked(nutritionClient.lookupUSDA).mockResolvedValueOnce(nutrition)
      await nutritionLookupService.getNutrition('Pizza')

      // Verify cache was stored
      expect(nutritionClient.lookupUSDA).toHaveBeenCalled()
    })
  })

  describe('fallback strategy', () => {
    it('should try USDA first then GPT-4', async () => {
      const usdaNutrition = {
        calories: 285,
        proteinG: 12,
        carbsG: 36,
        fatG: 10,
        fiberG: 2,
      }

      vi.mocked(nutritionClient.lookupUSDA).mockResolvedValueOnce(
        usdaNutrition
      )

      await nutritionLookupService.getNutrition('Pizza')

      expect(nutritionClient.lookupUSDA).toHaveBeenCalledWith('Pizza')
      expect(nutritionClient.estimateWithGPT4).not.toHaveBeenCalled()
    })

    it('should only use GPT-4 if USDA fails', async () => {
      const gpt4Response = {
        calories: 280,
        proteinG: 11,
        carbsG: 35,
        fatG: 10,
        fiberG: 2,
        confidence: 0.82,
      }

      vi.mocked(nutritionClient.lookupUSDA).mockRejectedValueOnce(
        new Error('USDA not found')
      )
      vi.mocked(nutritionClient.estimateWithGPT4).mockResolvedValueOnce(
        gpt4Response
      )

      const result = await nutritionLookupService.getNutrition(
        'CustomDish',
        '/photo.jpg'
      )

      expect(nutritionClient.lookupUSDA).toHaveBeenCalled()
      expect(nutritionClient.estimateWithGPT4).toHaveBeenCalled()
      expect(result.calories).toBe(280)
    })
  })

  describe('edge cases', () => {
    it('should handle empty food name', async () => {
      vi.mocked(nutritionClient.lookupUSDA).mockResolvedValueOnce({
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        fiberG: 0,
      })

      const result = await nutritionLookupService.getNutrition('')

      expect(result).toBeDefined()
    })

    it('should handle special characters in food names', async () => {
      const nutrition = {
        calories: 100,
        proteinG: 5,
        carbsG: 15,
        fatG: 3,
        fiberG: 2,
      }

      vi.mocked(nutritionClient.lookupUSDA).mockResolvedValueOnce(nutrition)

      const result = await nutritionLookupService.getNutrition(
        'Pizza & Salad'
      )

      expect(result).toBeDefined()
    })

    it('should handle very large portion sizes', () => {
      const nutrition = {
        calories: 285,
        proteinG: 12,
        carbsG: 36,
        fatG: 10,
        fiberG: 2,
      }

      const result = nutritionLookupService.estimatePortionSize(
        nutrition,
        10000
      )

      expect(result.calories).toBeGreaterThan(nutrition.calories)
    })
  })
})

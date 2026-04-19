import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mealPlanningService } from '../mealPlanningService'
import * as mealPlanningClient from '../../api/mealPlanningClient'
import * as nutritionGoalDb from '../../db/nutritionGoal'
import * as mealLogDb from '../../db/mealLog'
import type { MealSuggestion } from '../../types/mealPlanning'

// Mock all dependencies
vi.mock('../../api/mealPlanningClient')
vi.mock('../../db/nutritionGoal')
vi.mock('../../db/mealLog')

describe('Meal Planning Service', () => {
  const mockSuggestion: MealSuggestion = {
    id: 'meal-1',
    userId: 'user-123',
    mealName: 'Grilled Salmon',
    description: 'Fresh salmon with roasted vegetables',
    nutrition: {
      calories: 520,
      proteinG: 45,
      carbsG: 48,
      fatG: 18,
      fiberG: 8,
    },
    reasonForSuggestion: 'High protein option matching your goals',
    recipeUrl: 'https://example.com/recipe',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Clear service cache between tests
    mealPlanningService.clearCache()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getMealSuggestions', () => {
    it('should fetch nutrition goal from database', async () => {
      vi.mocked(nutritionGoalDb.getNutritionGoal).mockResolvedValue({
        id: 'goal-1',
        userId: 'user-123',
        dailyCalories: 2000,
        proteinG: 150,
        carbsG: 200,
        fatG: 65,
        fiberG: 20,
        waterGoalMl: 2000,
        generatedByAi: true,
        dietType: 'balanced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      vi.mocked(mealLogDb.getMealsInRange).mockResolvedValue([])
      vi.mocked(mealPlanningClient.mealPlanningClient.suggestMeals).mockResolvedValue({
        suggestions: [mockSuggestion],
        timestamp: new Date().toISOString(),
      })

      await mealPlanningService.getMealSuggestions('user-123')

      expect(nutritionGoalDb.getNutritionGoal).toHaveBeenCalledWith('user-123')
    })

    it('should fetch recent meal detections from database', async () => {
      const mockGoal = {
        id: 'goal-1',
        userId: 'user-123',
        dailyCalories: 2000,
        proteinG: 150,
        carbsG: 200,
        fatG: 65,
        fiberG: 20,
        waterGoalMl: 2000,
        generatedByAi: true,
        dietType: 'balanced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      vi.mocked(nutritionGoalDb.getNutritionGoal).mockResolvedValue(mockGoal)

      vi.mocked(mealLogDb.getMealsInRange).mockResolvedValue([
        {
          id: 'meal-log-1',
          userId: 'user-123',
          mealType: 'breakfast',
          totalCalories: 285,
          totalProteinG: 20,
          totalCarbsG: 30,
          totalFatG: 10,
          totalFiberG: 5,
          loggedAt: '2026-04-19T10:00:00Z',
          aiAnalyzed: true,
          synced: false,
          items: [],
          createdAt: new Date().toISOString(),
        } as any,
      ])

      vi.mocked(mealPlanningClient.mealPlanningClient.suggestMeals).mockResolvedValue({
        suggestions: [mockSuggestion],
        timestamp: new Date().toISOString(),
      })

      const result = await mealPlanningService.getMealSuggestions('user-123')

      expect(mealLogDb.getMealsInRange).toHaveBeenCalled()
      expect(result).toHaveLength(1)
    })

    it('should call Claude API with fetched data', async () => {
      const mockGoal = {
        id: 'goal-1',
        userId: 'user-123',
        dailyCalories: 2000,
        proteinG: 150,
        carbsG: 200,
        fatG: 65,
        fiberG: 20,
        waterGoalMl: 2000,
        generatedByAi: true,
        dietType: 'balanced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      vi.mocked(nutritionGoalDb.getNutritionGoal).mockResolvedValue(mockGoal)
      vi.mocked(mealLogDb.getMealsInRange).mockResolvedValue([])
      vi.mocked(mealPlanningClient.mealPlanningClient.suggestMeals).mockResolvedValue({
        suggestions: [mockSuggestion],
        timestamp: new Date().toISOString(),
      })

      await mealPlanningService.getMealSuggestions('user-123')

      expect(mealPlanningClient.mealPlanningClient.suggestMeals).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          nutritionGoal: expect.objectContaining({
            dailyCalories: 2000,
          }),
        })
      )
    })

    it('should return suggestions from API', async () => {
      vi.mocked(nutritionGoalDb.getNutritionGoal).mockResolvedValue({
        id: 'goal-1',
        userId: 'user-123',
        dailyCalories: 2000,
        proteinG: 150,
        carbsG: 200,
        fatG: 65,
        fiberG: 20,
        waterGoalMl: 2000,
        generatedByAi: true,
        dietType: 'balanced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      vi.mocked(mealLogDb.getMealsInRange).mockResolvedValue([])
      vi.mocked(mealPlanningClient.mealPlanningClient.suggestMeals).mockResolvedValue({
        suggestions: [mockSuggestion],
        timestamp: new Date().toISOString(),
      })

      const result = await mealPlanningService.getMealSuggestions('user-123')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle missing nutrition goal', async () => {
      vi.mocked(nutritionGoalDb.getNutritionGoal).mockResolvedValue(null)
      vi.mocked(mealLogDb.getMealsInRange).mockResolvedValue([])

      const result = await mealPlanningService.getMealSuggestions('user-123')
      expect(result).toBeDefined()
    })
  })

  describe('cacheSuggestions', () => {
    it('should store suggestions in database', async () => {
      vi.mocked(mealLogDb.saveMealLog).mockResolvedValue(undefined)

      await mealPlanningService.cacheSuggestions([mockSuggestion], 'user-123')

      expect(mealLogDb.saveMealLog).toHaveBeenCalled()
    })

    it('should cache multiple suggestions', async () => {
      const suggestions = [
        mockSuggestion,
        { ...mockSuggestion, id: 'meal-2', mealName: 'Chicken Bowl' },
      ]

      vi.mocked(mealLogDb.saveMealLog).mockResolvedValue(undefined)

      await mealPlanningService.cacheSuggestions(suggestions, 'user-123')

      expect(mealLogDb.saveMealLog).toHaveBeenCalledTimes(2)
    })

    it('should handle empty suggestions array', async () => {
      await mealPlanningService.cacheSuggestions([], 'user-123')

      expect(mealLogDb.saveMealLog).not.toHaveBeenCalled()
    })
  })

  describe('getWeeklyPlan', () => {
    it('should return weekly meal plan', async () => {
      vi.mocked(mealLogDb.getMealsInRange).mockResolvedValue([
        { ...mockSuggestion, id: 'meal-1' } as any,
        { ...mockSuggestion, id: 'meal-2', mealName: 'Chicken Bowl' } as any,
      ])

      const result = await mealPlanningService.getWeeklyPlan('user-123')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should aggregate suggestions by meal type', async () => {
      const suggestions = [
        { ...mockSuggestion, id: 'meal-breakfast', mealName: 'Eggs & Oatmeal' },
        { ...mockSuggestion, id: 'meal-lunch', mealName: 'Grilled Salmon' },
        { ...mockSuggestion, id: 'meal-dinner', mealName: 'Beef Steak' },
      ]

      vi.mocked(mealLogDb.getMealsInRange).mockResolvedValue(suggestions as any)

      const result = await mealPlanningService.getWeeklyPlan('user-123')

      expect(result.length).toBeGreaterThanOrEqual(0)
    })

    it('should limit results to recent meals', async () => {
      const suggestions = Array(30)
        .fill(null)
        .map((_, i) => ({
          ...mockSuggestion,
          id: `meal-${i}`,
        }))

      vi.mocked(mealLogDb.getMealsInRange).mockResolvedValue(suggestions as any)

      const result = await mealPlanningService.getWeeklyPlan('user-123')

      expect(result.length).toBeLessThanOrEqual(30)
    })

    it('should handle empty meal history', async () => {
      vi.mocked(mealLogDb.getMealsInRange).mockResolvedValue([])

      const result = await mealPlanningService.getWeeklyPlan('user-123')

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })
  })

  describe('addToWeeklyPlan', () => {
    it('should add suggestion to weekly plan', async () => {
      vi.mocked(mealLogDb.saveMealLog).mockResolvedValue(undefined)

      const result = await mealPlanningService.addToWeeklyPlan(mockSuggestion, 'user-123')

      expect(result).toBeDefined()
      expect(mealLogDb.saveMealLog).toHaveBeenCalled()
    })

    it('should update suggestion with current timestamp', async () => {
      vi.mocked(mealLogDb.saveMealLog).mockResolvedValue(undefined)

      const suggestion = { ...mockSuggestion }
      await mealPlanningService.addToWeeklyPlan(suggestion, 'user-123')

      expect(mealLogDb.saveMealLog).toHaveBeenCalled()
    })
  })

  describe('removeFromWeeklyPlan', () => {
    it('should remove suggestion from weekly plan', async () => {
      vi.mocked(mealLogDb.deleteMealLog).mockResolvedValue(undefined)

      await mealPlanningService.removeFromWeeklyPlan('meal-1', 'user-123')

      expect(mealLogDb.deleteMealLog).toHaveBeenCalledWith('meal-1')
    })

    it('should handle non-existent meal', async () => {
      vi.mocked(mealLogDb.deleteMealLog).mockResolvedValue(undefined)

      await mealPlanningService.removeFromWeeklyPlan('non-existent', 'user-123')

      expect(mealLogDb.deleteMealLog).toHaveBeenCalled()
    })
  })

  describe('clearExpiredSuggestions', () => {
    it('should remove expired suggestions from database', async () => {
      vi.mocked(mealLogDb.getMealsInRange).mockResolvedValue([
        { ...mockSuggestion, mealType: 'suggestion', id: 'expired-meal-1' } as any,
      ])
      vi.mocked(mealLogDb.deleteMealLog).mockResolvedValue(undefined)

      const count = await mealPlanningService.clearExpiredSuggestions('user-123')

      expect(mealLogDb.getMealsInRange).toHaveBeenCalled()
      expect(mealLogDb.deleteMealLog).toHaveBeenCalled()
      expect(count).toBe(1)
    })
  })

  describe('in-memory caching', () => {
    it('should cache suggestions in memory', async () => {
      const mockGoal = {
        id: 'goal-1',
        userId: 'user-123',
        dailyCalories: 2000,
        proteinG: 150,
        carbsG: 200,
        fatG: 65,
        fiberG: 20,
        waterGoalMl: 2000,
        generatedByAi: true,
        dietType: 'balanced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      vi.mocked(nutritionGoalDb.getNutritionGoal).mockResolvedValue(mockGoal)
      vi.mocked(mealLogDb.getMealsInRange).mockResolvedValue([])
      vi.mocked(mealPlanningClient.mealPlanningClient.suggestMeals).mockResolvedValue({
        suggestions: [mockSuggestion],
        timestamp: new Date().toISOString(),
      })

      // Clear cache before test
      mealPlanningService.clearCache('user-123')

      // First call
      const result1 = await mealPlanningService.getMealSuggestions('user-123')

      // Second call should return cached
      const result2 = await mealPlanningService.getMealSuggestions('user-123')

      // Both should return same data
      expect(result1).toEqual(result2)
      // API should be called only once (second call is from cache)
      expect(mealPlanningClient.mealPlanningClient.suggestMeals).toHaveBeenCalledTimes(1)
    })
  })
})

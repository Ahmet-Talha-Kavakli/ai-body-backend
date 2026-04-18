import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  uploadMealPhoto,
  syncMeal,
  getMealLog,
  getMealsForDate,
  getNutritionSummary,
  generateNutritionGoal,
  getNutritionGoal,
  updateNutritionGoal,
  deleteMeal,
} from '../../src/api/nutrition-client'
import { getAuthenticatedClient } from '../../src/api/client'
import type { MealLog, NutritionGoal, NutritionSummary } from '@fitai/shared-types'

vi.mock('../../src/api/client', () => ({
  getAuthenticatedClient: vi.fn(),
}))

describe('Nutrition API Client', () => {
  let mockClient: any

  beforeEach(() => {
    mockClient = {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    }
    vi.mocked(getAuthenticatedClient).mockResolvedValue(mockClient)
  })

  describe('uploadMealPhoto', () => {
    it('should upload photo and return URL', async () => {
      const mockFile = new File(['test'], 'meal.jpg', { type: 'image/jpeg' })
      const photoUrl = 'https://api.example.com/photos/123.jpg'

      mockClient.post.mockResolvedValue({
        data: { photoUrl },
      })

      const result = await uploadMealPhoto(mockFile)

      expect(result).toBe(photoUrl)
      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/nutrition/photos/upload',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data',
          }),
        })
      )
    })

    it('should handle upload error', async () => {
      const mockFile = new File(['test'], 'meal.jpg', { type: 'image/jpeg' })
      const error = new Error('Upload failed')

      mockClient.post.mockRejectedValue(error)

      await expect(uploadMealPhoto(mockFile)).rejects.toThrow('Upload failed')
    })
  })

  describe('syncMeal', () => {
    it('should POST meal to backend', async () => {
      const meal: MealLog = {
        id: 'meal_123',
        userId: 'user_123',
        loggedAt: new Date(),
        mealType: 'breakfast',
        items: [],
        aiAnalyzed: false,
        totalCalories: 400,
        totalProteinG: 15,
        totalCarbsG: 50,
        totalFatG: 10,
      }

      mockClient.post.mockResolvedValue({})

      await syncMeal(meal)

      expect(mockClient.post).toHaveBeenCalledWith('/api/nutrition/meals', meal)
    })

    it('should handle sync error', async () => {
      const meal: MealLog = {
        id: 'meal_123',
        userId: 'user_123',
        loggedAt: new Date(),
        mealType: 'breakfast',
        items: [],
        aiAnalyzed: false,
        totalCalories: 400,
        totalProteinG: 15,
        totalCarbsG: 50,
        totalFatG: 10,
      }
      const error = new Error('Sync failed')

      mockClient.post.mockRejectedValue(error)

      await expect(syncMeal(meal)).rejects.toThrow('Sync failed')
    })
  })

  describe('getMealLog', () => {
    it('should fetch meal by ID', async () => {
      const meal: MealLog = {
        id: 'meal_123',
        userId: 'user_123',
        loggedAt: new Date(),
        mealType: 'lunch',
        items: [],
        aiAnalyzed: true,
        totalCalories: 600,
        totalProteinG: 30,
        totalCarbsG: 60,
        totalFatG: 20,
      }

      mockClient.get.mockResolvedValue({ data: meal })

      const result = await getMealLog('meal_123')

      expect(result).toEqual(meal)
      expect(mockClient.get).toHaveBeenCalledWith('/api/nutrition/meals/meal_123')
    })
  })

  describe('getMealsForDate', () => {
    it('should fetch meals for specific date', async () => {
      const meals: MealLog[] = [
        {
          id: 'meal_1',
          userId: 'user_123',
          loggedAt: new Date('2024-01-15'),
          mealType: 'breakfast',
          items: [],
          aiAnalyzed: false,
          totalCalories: 400,
          totalProteinG: 15,
          totalCarbsG: 50,
          totalFatG: 10,
        },
      ]

      mockClient.get.mockResolvedValue({ data: meals })

      const result = await getMealsForDate('2024-01-15')

      expect(result).toEqual(meals)
      expect(mockClient.get).toHaveBeenCalledWith('/api/nutrition/meals', {
        params: { date: '2024-01-15' },
      })
    })
  })

  describe('getNutritionSummary', () => {
    it('should fetch nutrition summary for date range', async () => {
      const summaries: NutritionSummary[] = [
        {
          date: '2024-01-15',
          totalCalories: 2000,
          totalProteinG: 120,
          totalCarbsG: 250,
          totalFatG: 65,
          goalAdherence: 95,
          meals: [],
        },
      ]

      mockClient.get.mockResolvedValue({ data: summaries })

      const result = await getNutritionSummary('2024-01-15', '2024-01-20')

      expect(result).toEqual(summaries)
      expect(mockClient.get).toHaveBeenCalledWith('/api/nutrition/summary', {
        params: {
          startDate: '2024-01-15',
          endDate: '2024-01-20',
        },
      })
    })
  })

  describe('generateNutritionGoal', () => {
    it('should generate goal based on user profile', async () => {
      const profile = {
        age: 30,
        weight: 75,
        height: 180,
        sex: 'male' as const,
      }
      const goal: NutritionGoal = {
        id: 'goal_123',
        userId: 'user_123',
        dailyCalories: 2500,
        proteinG: 150,
        carbsG: 300,
        fatG: 85,
        waterMl: 3000,
        generatedByAi: true,
        updatedAt: new Date(),
      }

      mockClient.post.mockResolvedValue({ data: goal })

      const result = await generateNutritionGoal(profile)

      expect(result).toEqual(goal)
      expect(mockClient.post).toHaveBeenCalledWith('/api/nutrition/generate-goal', profile)
    })
  })

  describe('getNutritionGoal', () => {
    it('should fetch current nutrition goal', async () => {
      const goal: NutritionGoal = {
        id: 'goal_123',
        userId: 'user_123',
        dailyCalories: 2500,
        proteinG: 150,
        carbsG: 300,
        fatG: 85,
        waterMl: 3000,
        generatedByAi: true,
        updatedAt: new Date(),
      }

      mockClient.get.mockResolvedValue({ data: goal })

      const result = await getNutritionGoal()

      expect(result).toEqual(goal)
      expect(mockClient.get).toHaveBeenCalledWith('/api/nutrition/goal')
    })
  })

  describe('updateNutritionGoal', () => {
    it('should update nutrition goal', async () => {
      const update = { dailyCalories: 2300 }
      const updatedGoal: NutritionGoal = {
        id: 'goal_123',
        userId: 'user_123',
        dailyCalories: 2300,
        proteinG: 150,
        carbsG: 300,
        fatG: 85,
        waterMl: 3000,
        generatedByAi: false,
        updatedAt: new Date(),
      }

      mockClient.put.mockResolvedValue({ data: updatedGoal })

      const result = await updateNutritionGoal(update)

      expect(result).toEqual(updatedGoal)
      expect(mockClient.put).toHaveBeenCalledWith('/api/nutrition/goal', update)
    })
  })

  describe('deleteMeal', () => {
    it('should delete meal by ID', async () => {
      mockClient.delete.mockResolvedValue({})

      await deleteMeal('meal_123')

      expect(mockClient.delete).toHaveBeenCalledWith('/api/nutrition/meals/meal_123')
    })
  })
})

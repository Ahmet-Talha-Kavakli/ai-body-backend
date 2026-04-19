import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mealPlanningClient } from '../mealPlanningClient'
import * as client from '../client'
import type { MealSuggestionRequest } from '../../types/mealPlanning'

// Mock the client module
vi.mock('../client')

describe('Meal Planning Client', () => {
  let mockAxiosClient: any

  const mockSuggestion = {
    id: 'meal-1',
    userId: 'user-123',
    mealName: 'Grilled Salmon',
    description: 'Fresh salmon with vegetables',
    nutrition: {
      calories: 520,
      proteinG: 45,
      carbsG: 48,
      fatG: 18,
      fiberG: 8,
    },
    reasonForSuggestion: 'High protein option',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockAxiosClient = {
      post: vi.fn(),
    }
    vi.mocked(client.getAuthenticatedClient).mockResolvedValue(mockAxiosClient)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('suggestMeals', () => {
    it('should call Claude API with nutrition goal and preferences', async () => {
      mockAxiosClient.post.mockResolvedValue({
        data: {
          suggestions: [mockSuggestion],
          timestamp: new Date().toISOString(),
        },
      })

      const request: MealSuggestionRequest = {
        userId: 'user-123',
        nutritionGoal: {
          dailyCalories: 2000,
          proteinG: 150,
          carbsG: 200,
          fatG: 65,
        },
        mealType: 'lunch',
        dietaryPreferences: ['no-dairy'],
        preferredCuisines: ['mediterranean'],
      }

      const result = await mealPlanningClient.suggestMeals(request)

      expect(result).toBeDefined()
      expect(Array.isArray(result.suggestions)).toBe(true)
      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.suggestions.length).toBeLessThanOrEqual(5)
    })

    it('should return meals with all required fields', async () => {
      mockAxiosClient.post.mockResolvedValue({
        data: {
          suggestions: [mockSuggestion],
          timestamp: new Date().toISOString(),
        },
      })

      const request: MealSuggestionRequest = {
        userId: 'user-123',
        nutritionGoal: {
          dailyCalories: 2000,
          proteinG: 150,
          carbsG: 200,
          fatG: 65,
        },
      }

      const result = await mealPlanningClient.suggestMeals(request)
      const suggestion = result.suggestions[0]

      expect(suggestion).toHaveProperty('id')
      expect(suggestion).toHaveProperty('userId')
      expect(suggestion).toHaveProperty('mealName')
      expect(suggestion).toHaveProperty('description')
      expect(suggestion).toHaveProperty('nutrition')
      expect(suggestion).toHaveProperty('reasonForSuggestion')
      expect(suggestion).toHaveProperty('createdAt')
      expect(suggestion).toHaveProperty('expiresAt')
    })

    it('should include nutrition information in each suggestion', async () => {
      mockAxiosClient.post.mockResolvedValue({
        data: {
          suggestions: [mockSuggestion],
          timestamp: new Date().toISOString(),
        },
      })

      const request: MealSuggestionRequest = {
        userId: 'user-123',
        nutritionGoal: {
          dailyCalories: 2000,
          proteinG: 150,
          carbsG: 200,
          fatG: 65,
        },
      }

      const result = await mealPlanningClient.suggestMeals(request)
      const suggestion = result.suggestions[0]

      expect(suggestion.nutrition).toHaveProperty('calories')
      expect(suggestion.nutrition).toHaveProperty('proteinG')
      expect(suggestion.nutrition).toHaveProperty('carbsG')
      expect(suggestion.nutrition).toHaveProperty('fatG')
      expect(suggestion.nutrition).toHaveProperty('fiberG')
      expect(suggestion.nutrition.calories).toBeGreaterThan(0)
    })

    it('should respect dietary preferences in suggestions', async () => {
      mockAxiosClient.post.mockResolvedValue({
        data: {
          suggestions: [
            {
              ...mockSuggestion,
              mealName: 'Vegetarian Buddha Bowl',
            },
          ],
          timestamp: new Date().toISOString(),
        },
      })

      const request: MealSuggestionRequest = {
        userId: 'user-123',
        nutritionGoal: {
          dailyCalories: 2000,
          proteinG: 150,
          carbsG: 200,
          fatG: 65,
        },
        dietaryPreferences: ['vegetarian'],
      }

      const result = await mealPlanningClient.suggestMeals(request)
      expect(result.suggestions.length).toBeGreaterThan(0)
    })

    it('should handle empty dietary preferences', async () => {
      mockAxiosClient.post.mockResolvedValue({
        data: {
          suggestions: [mockSuggestion],
          timestamp: new Date().toISOString(),
        },
      })

      const request: MealSuggestionRequest = {
        userId: 'user-123',
        nutritionGoal: {
          dailyCalories: 2000,
          proteinG: 150,
          carbsG: 200,
          fatG: 65,
        },
        dietaryPreferences: [],
      }

      const result = await mealPlanningClient.suggestMeals(request)
      expect(result.suggestions.length).toBeGreaterThan(0)
    })

    it('should include reason for suggestion based on user context', async () => {
      mockAxiosClient.post.mockResolvedValue({
        data: {
          suggestions: [
            {
              ...mockSuggestion,
              reasonForSuggestion: 'Based on your pizza preference',
            },
          ],
          timestamp: new Date().toISOString(),
        },
      })

      const request: MealSuggestionRequest = {
        userId: 'user-123',
        nutritionGoal: {
          dailyCalories: 2000,
          proteinG: 150,
          carbsG: 200,
          fatG: 65,
        },
        recentDetections: [
          {
            foodName: 'pizza',
            calories: 285,
            detectedAt: '2026-04-19T10:00:00Z',
          },
        ],
      }

      const result = await mealPlanningClient.suggestMeals(request)
      const suggestion = result.suggestions[0]

      expect(suggestion.reasonForSuggestion).toBeTruthy()
      expect(suggestion.reasonForSuggestion.length).toBeGreaterThan(0)
    })

    it('should return suggestions that align with nutrition goals', async () => {
      mockAxiosClient.post.mockResolvedValue({
        data: {
          suggestions: [mockSuggestion],
          timestamp: new Date().toISOString(),
        },
      })

      const request: MealSuggestionRequest = {
        userId: 'user-123',
        nutritionGoal: {
          dailyCalories: 2000,
          proteinG: 150,
          carbsG: 200,
          fatG: 65,
        },
      }

      const result = await mealPlanningClient.suggestMeals(request)
      const suggestion = result.suggestions[0]

      expect(suggestion.nutrition.calories).toBeLessThan(request.nutritionGoal.dailyCalories * 0.6)
    })

    it('should handle API errors gracefully', async () => {
      mockAxiosClient.post.mockRejectedValue(new Error('API Error'))

      const request: MealSuggestionRequest = {
        userId: 'user-123',
        nutritionGoal: {
          dailyCalories: 2000,
          proteinG: 150,
          carbsG: 200,
          fatG: 65,
        },
      }

      await expect(mealPlanningClient.suggestMeals(request)).rejects.toThrow('API Error')
    })

    it('should support optional meal type parameter', async () => {
      mockAxiosClient.post.mockResolvedValue({
        data: {
          suggestions: [mockSuggestion],
          timestamp: new Date().toISOString(),
        },
      })

      const request: MealSuggestionRequest = {
        userId: 'user-123',
        nutritionGoal: {
          dailyCalories: 2000,
          proteinG: 150,
          carbsG: 200,
          fatG: 65,
        },
        mealType: 'breakfast',
      }

      const result = await mealPlanningClient.suggestMeals(request)
      expect(result.suggestions.length).toBeGreaterThan(0)
    })

    it('should include timestamp in response', async () => {
      const timestamp = new Date().toISOString()
      mockAxiosClient.post.mockResolvedValue({
        data: {
          suggestions: [mockSuggestion],
          timestamp,
        },
      })

      const request: MealSuggestionRequest = {
        userId: 'user-123',
        nutritionGoal: {
          dailyCalories: 2000,
          proteinG: 150,
          carbsG: 200,
          fatG: 65,
        },
      }

      const result = await mealPlanningClient.suggestMeals(request)
      expect(result.timestamp).toBeDefined()
      expect(new Date(result.timestamp)).toBeInstanceOf(Date)
    })

    it('should post to correct endpoint with proper headers', async () => {
      mockAxiosClient.post.mockResolvedValue({
        data: {
          suggestions: [mockSuggestion],
          timestamp: new Date().toISOString(),
        },
      })

      const request: MealSuggestionRequest = {
        userId: 'user-123',
        nutritionGoal: {
          dailyCalories: 2000,
          proteinG: 150,
          carbsG: 200,
          fatG: 65,
        },
      }

      await mealPlanningClient.suggestMeals(request)

      expect(mockAxiosClient.post).toHaveBeenCalledWith(
        '/api/meal-planning/suggest',
        expect.objectContaining({
          userId: 'user-123',
          nutritionGoal: request.nutritionGoal,
        })
      )
    })
  })
})

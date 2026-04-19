import { describe, it, expect } from 'vitest'
import type { MealSuggestion, MealSuggestionRequest } from '../mealPlanning'

describe('Meal Planning Types', () => {
  it('should create meal suggestion with required fields', () => {
    const suggestion: MealSuggestion = {
      id: 'meal-1',
      userId: 'user-123',
      mealName: 'Grilled Salmon Bowl',
      description: 'Salmon fillet with quinoa, roasted vegetables, and olive oil dressing',
      nutrition: {
        calories: 520,
        proteinG: 45,
        carbsG: 48,
        fatG: 18,
        fiberG: 8,
      },
      reasonForSuggestion: 'Based on your 2000 cal goal and preference for Mediterranean cuisine',
      createdAt: '2026-04-19T12:00:00Z',
      expiresAt: '2026-04-20T12:00:00Z',
    }
    expect(suggestion.mealName).toBe('Grilled Salmon Bowl')
    expect(suggestion.nutrition.calories).toBe(520)
    expect(suggestion.nutrition.proteinG).toBe(45)
  })

  it('should allow optional recipeUrl', () => {
    const suggestion: MealSuggestion = {
      id: 'meal-2',
      userId: 'user-123',
      mealName: 'Grilled Chicken Tacos',
      description: 'Chicken with black beans and salsa',
      nutrition: {
        calories: 380,
        proteinG: 32,
        carbsG: 42,
        fatG: 12,
        fiberG: 6,
      },
      reasonForSuggestion: 'Quick lunch option matching your macros',
      recipeUrl: 'https://example.com/recipe/chicken-tacos',
      createdAt: '2026-04-19T12:30:00Z',
      expiresAt: '2026-04-20T12:30:00Z',
    }
    expect(suggestion.recipeUrl).toBe('https://example.com/recipe/chicken-tacos')
  })

  it('should validate nutrition values are non-negative', () => {
    const suggestion: MealSuggestion = {
      id: 'meal-3',
      userId: 'user-123',
      mealName: 'Protein Smoothie',
      description: 'Protein powder with berries and almond milk',
      nutrition: {
        calories: 200,
        proteinG: 25,
        carbsG: 20,
        fatG: 3,
        fiberG: 2,
      },
      reasonForSuggestion: 'Post-workout snack',
      createdAt: '2026-04-19T14:00:00Z',
      expiresAt: '2026-04-20T14:00:00Z',
    }
    expect(suggestion.nutrition.calories).toBeGreaterThanOrEqual(0)
    expect(suggestion.nutrition.proteinG).toBeGreaterThanOrEqual(0)
    expect(suggestion.nutrition.carbsG).toBeGreaterThanOrEqual(0)
    expect(suggestion.nutrition.fatG).toBeGreaterThanOrEqual(0)
    expect(suggestion.nutrition.fiberG).toBeGreaterThanOrEqual(0)
  })

  it('should create meal suggestion request', () => {
    const request: MealSuggestionRequest = {
      userId: 'user-123',
      nutritionGoal: {
        dailyCalories: 2000,
        proteinG: 150,
        carbsG: 200,
        fatG: 65,
      },
      dietaryPreferences: ['no-dairy', 'low-sodium'],
      recentDetections: [
        {
          foodName: 'pizza',
          calories: 285,
          detectedAt: '2026-04-19T10:00:00Z',
        },
      ],
      mealType: 'lunch',
      preferredCuisines: ['mediterranean', 'asian'],
    }
    expect(request.nutritionGoal.dailyCalories).toBe(2000)
    expect(request.dietaryPreferences).toContain('no-dairy')
    expect(request.mealType).toBe('lunch')
  })

  it('should handle optional fields in suggestion request', () => {
    const request: MealSuggestionRequest = {
      userId: 'user-456',
      nutritionGoal: {
        dailyCalories: 1800,
        proteinG: 120,
        carbsG: 180,
        fatG: 50,
      },
    }
    expect(request.mealType).toBeUndefined()
    expect(request.dietaryPreferences).toBeUndefined()
    expect(request.preferredCuisines).toBeUndefined()
  })
})

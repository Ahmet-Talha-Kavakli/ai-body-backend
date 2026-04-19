import { getAuthenticatedClient } from './client'
import type {
  MealSuggestionRequest,
  MealSuggestionsResponse,
  MealSuggestion,
} from '../types/mealPlanning'
import { generateId } from '../utils/uuid'

const MEAL_PLANNING_ENDPOINT = '/api/meal-planning/suggest'

export const mealPlanningClient = {
  async suggestMeals(request: MealSuggestionRequest): Promise<MealSuggestionsResponse> {
    const client = await getAuthenticatedClient()

    const response = await client.post<MealSuggestionsResponse>(MEAL_PLANNING_ENDPOINT, {
      userId: request.userId,
      nutritionGoal: request.nutritionGoal,
      mealType: request.mealType,
      dietaryPreferences: request.dietaryPreferences,
      recentDetections: request.recentDetections,
      preferredCuisines: request.preferredCuisines,
    })

    // Ensure suggestions have proper format
    const suggestions = response.data.suggestions.map((suggestion) => ({
      ...suggestion,
      userId: request.userId,
      createdAt: suggestion.createdAt || new Date().toISOString(),
      expiresAt: suggestion.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }))

    return {
      suggestions,
      timestamp: response.data.timestamp || new Date().toISOString(),
    }
  },
}

import { mealPlanningClient } from '../api/mealPlanningClient'
import { getNutritionGoal } from '../db/nutritionGoal'
import { getMealsInRange, saveMealLog, deleteMealLog } from '../db/mealLog'
import type { MealSuggestion, MealSuggestionRequest } from '../types/mealPlanning'
import { generateId } from '../utils/uuid'

// In-memory cache for suggestions
const suggestionCache: Map<string, { data: MealSuggestion[]; timestamp: number }> = new Map()
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

export const mealPlanningService = {
  /**
   * Get personalized meal suggestions for a user
   * Fetches nutrition goals, recent meals, and preferences, then calls Claude API
   */
  async getMealSuggestions(userId: string): Promise<MealSuggestion[]> {
    // Check cache first
    const cached = suggestionCache.get(userId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }

    // Fetch user's nutrition goal
    const goal = await getNutritionGoal(userId)
    if (!goal) {
      return []
    }

    // Fetch recent meal detections (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentMeals = await getMealsInRange(
      userId,
      sevenDaysAgo.toISOString(),
      new Date().toISOString()
    )

    // Convert recent meals to detection history
    const recentDetections = recentMeals.slice(0, 10).map((meal) => ({
      foodName: meal.mealType,
      calories: meal.totalCalories,
      detectedAt: meal.loggedAt,
    }))

    // Build suggestion request
    const request: MealSuggestionRequest = {
      userId,
      nutritionGoal: {
        dailyCalories: goal.dailyCalories,
        proteinG: goal.proteinG,
        carbsG: goal.carbsG,
        fatG: goal.fatG,
      },
      recentDetections,
    }

    try {
      // Call Claude API
      const response = await mealPlanningClient.suggestMeals(request)
      const suggestions = response.suggestions

      // Cache in memory
      suggestionCache.set(userId, {
        data: suggestions,
        timestamp: Date.now(),
      })

      return suggestions
    } catch (error) {
      console.error('Error getting meal suggestions:', error)
      return []
    }
  },

  /**
   * Cache suggestions in SQLite for offline access
   */
  async cacheSuggestions(suggestions: MealSuggestion[], userId: string): Promise<void> {
    for (const suggestion of suggestions) {
      // Convert MealSuggestion to MealLog format
      const mealLog = {
        id: suggestion.id,
        userId,
        mealType: 'suggestion',
        totalCalories: suggestion.nutrition.calories,
        totalProteinG: suggestion.nutrition.proteinG,
        totalCarbsG: suggestion.nutrition.carbsG,
        totalFatG: suggestion.nutrition.fatG,
        totalFiberG: suggestion.nutrition.fiberG,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: true,
        photoUrl: undefined,
        photoPath: undefined,
        notes: suggestion.reasonForSuggestion,
        synced: false,
        items: [],
      }

      await saveMealLog(mealLog as any)
    }
  },

  /**
   * Get weekly meal plan from suggestions
   */
  async getWeeklyPlan(userId: string): Promise<MealSuggestion[]> {
    // Fetch meals logged/planned in the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const meals = await getMealsInRange(
      userId,
      sevenDaysAgo.toISOString(),
      new Date().toISOString()
    )

    // Filter for suggestion-type meals and convert back to MealSuggestion format
    return meals
      .filter((m) => m.mealType === 'suggestion')
      .map((m) => ({
        id: m.id,
        userId,
        mealName: m.notes || 'Meal',
        description: '',
        nutrition: {
          calories: m.totalCalories,
          proteinG: m.totalProteinG,
          carbsG: m.totalCarbsG,
          fatG: m.totalFatG,
          fiberG: m.totalFiberG,
        },
        reasonForSuggestion: '',
        createdAt: m.createdAt,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }))
  },

  /**
   * Add a suggestion to the weekly plan
   */
  async addToWeeklyPlan(suggestion: MealSuggestion, userId: string): Promise<MealSuggestion> {
    const mealLog = {
      id: suggestion.id,
      userId,
      mealType: 'suggestion',
      totalCalories: suggestion.nutrition.calories,
      totalProteinG: suggestion.nutrition.proteinG,
      totalCarbsG: suggestion.nutrition.carbsG,
      totalFatG: suggestion.nutrition.fatG,
      totalFiberG: suggestion.nutrition.fiberG,
      loggedAt: new Date().toISOString(),
      aiAnalyzed: true,
      photoUrl: undefined,
      photoPath: undefined,
      notes: suggestion.reasonForSuggestion,
      synced: false,
      items: [],
    }

    await saveMealLog(mealLog as any)
    return suggestion
  },

  /**
   * Remove a suggestion from the weekly plan
   */
  async removeFromWeeklyPlan(mealId: string, userId: string): Promise<void> {
    await deleteMealLog(mealId)
  },

  /**
   * Clear expired suggestions (older than 1 day)
   */
  async clearExpiredSuggestions(userId: string): Promise<number> {
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const meals = await getMealsInRange(userId, '2000-01-01T00:00:00Z', oneDayAgo.toISOString())
    const expiredMeals = meals.filter((m) => m.mealType === 'suggestion')

    let count = 0
    for (const meal of expiredMeals) {
      await deleteMealLog(meal.id)
      count++
    }

    return count
  },

  /**
   * Clear in-memory cache
   */
  clearCache(userId?: string): void {
    if (userId) {
      suggestionCache.delete(userId)
    } else {
      suggestionCache.clear()
    }
  },
}

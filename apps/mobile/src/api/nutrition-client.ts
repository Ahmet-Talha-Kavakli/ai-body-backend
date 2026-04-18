import { getAuthenticatedClient } from './client'
import type { MealLog, NutritionGoal, NutritionSummary, UserProfile } from '@fitai/shared-types'

/**
 * Upload a meal photo to the backend
 * @param file - Photo file from camera or library
 * @returns URL of uploaded photo
 */
export async function uploadMealPhoto(file: File): Promise<string> {
  const client = await getAuthenticatedClient()
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await client.post<{ photoUrl: string }>(
      '/api/nutrition/photos/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data.photoUrl
  } catch (error) {
    console.error('Error uploading meal photo:', error)
    throw error
  }
}

/**
 * Sync a meal log to the backend
 * @param meal - MealLog to sync
 * @returns Promise that resolves when sync completes
 */
export async function syncMeal(meal: MealLog): Promise<void> {
  const client = await getAuthenticatedClient()

  try {
    await client.post('/api/nutrition/meals', meal)
  } catch (error) {
    console.error('Error syncing meal:', error)
    throw error
  }
}

/**
 * Get meal log by ID
 * @param mealId - ID of meal to fetch
 * @returns MealLog object
 */
export async function getMealLog(mealId: string): Promise<MealLog> {
  const client = await getAuthenticatedClient()

  try {
    const response = await client.get<MealLog>(`/api/nutrition/meals/${mealId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching meal:', error)
    throw error
  }
}

/**
 * Get meals for a specific date
 * @param date - Date string (YYYY-MM-DD)
 * @returns Array of MealLog objects for that date
 */
export async function getMealsForDate(date: string): Promise<MealLog[]> {
  const client = await getAuthenticatedClient()

  try {
    const response = await client.get<MealLog[]>('/api/nutrition/meals', {
      params: { date },
    })
    return response.data
  } catch (error) {
    console.error('Error fetching meals for date:', error)
    throw error
  }
}

/**
 * Get nutrition summary for a date range
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Array of NutritionSummary objects
 */
export async function getNutritionSummary(
  startDate: string,
  endDate: string
): Promise<NutritionSummary[]> {
  const client = await getAuthenticatedClient()

  try {
    const response = await client.get<NutritionSummary[]>('/api/nutrition/summary', {
      params: { startDate, endDate },
    })
    return response.data
  } catch (error) {
    console.error('Error fetching nutrition summary:', error)
    throw error
  }
}

/**
 * Generate AI-powered nutrition goal based on user profile
 * @param profile - User profile with demographics and preferences
 * @returns Generated NutritionGoal
 */
export async function generateNutritionGoal(profile: Partial<UserProfile>): Promise<NutritionGoal> {
  const client = await getAuthenticatedClient()

  try {
    const response = await client.post<NutritionGoal>('/api/nutrition/generate-goal', profile)
    return response.data
  } catch (error) {
    console.error('Error generating nutrition goal:', error)
    throw error
  }
}

/**
 * Get current nutrition goal for user
 * @returns Current NutritionGoal
 */
export async function getNutritionGoal(): Promise<NutritionGoal> {
  const client = await getAuthenticatedClient()

  try {
    const response = await client.get<NutritionGoal>('/api/nutrition/goal')
    return response.data
  } catch (error) {
    console.error('Error fetching nutrition goal:', error)
    throw error
  }
}

/**
 * Update user's nutrition goal
 * @param goal - Updated NutritionGoal
 * @returns Updated NutritionGoal from server
 */
export async function updateNutritionGoal(goal: Partial<NutritionGoal>): Promise<NutritionGoal> {
  const client = await getAuthenticatedClient()

  try {
    const response = await client.put<NutritionGoal>('/api/nutrition/goal', goal)
    return response.data
  } catch (error) {
    console.error('Error updating nutrition goal:', error)
    throw error
  }
}

/**
 * Delete a meal log
 * @param mealId - ID of meal to delete
 */
export async function deleteMeal(mealId: string): Promise<void> {
  const client = await getAuthenticatedClient()

  try {
    await client.delete(`/api/nutrition/meals/${mealId}`)
  } catch (error) {
    console.error('Error deleting meal:', error)
    throw error
  }
}

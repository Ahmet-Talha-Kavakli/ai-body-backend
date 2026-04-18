import { useCallback } from 'react'
import { getMealLogsForDate } from '../db/nutrition'
import { getStreak } from '../db/nutritionStreak'
import { nutritionGoalStore } from '../store/nutritionGoalStore'
import type { CoachContext } from '../types/nutrition-coach'

export function useCoachContext() {
  const buildContext = useCallback(async (userId: string): Promise<CoachContext> => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date()
      const dateStr = today.toISOString().split('T')[0]

      // 1. Get meals for today
      const todaysMeals = await getMealLogsForDate(dateStr)
      const recentMeals = todaysMeals.map((m) => m.mealType)

      // 2. Calculate today's macros
      const todayIntake = {
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        fiberG: 0,
      }

      for (const meal of todaysMeals) {
        todayIntake.calories += meal.totalCalories
        todayIntake.proteinG += meal.totalProteinG
        todayIntake.carbsG += meal.totalCarbsG
        todayIntake.fatG += meal.totalFatG
        todayIntake.fiberG += meal.totalFiberG
      }

      // 3. Get nutrition goals
      const state = nutritionGoalStore.getState()
      const goals = state.goals

      // 4. Get streak data
      const streak = await getStreak(userId)

      // 5. Build and return context
      const context: CoachContext = {
        recentMeals,
        todayIntake,
        goals: goals || null,
        streakData: {
          current: streak.current,
          longest: streak.longest,
        },
      }

      return context
    } catch (error) {
      console.error('Error building coach context:', error)
      // Return empty context on error
      return {
        recentMeals: [],
        todayIntake: {
          calories: 0,
          proteinG: 0,
          carbsG: 0,
          fatG: 0,
          fiberG: 0,
        },
        goals: null,
        streakData: {
          current: 0,
          longest: 0,
        },
      }
    }
  }, [])

  return { buildContext }
}

// Export the buildCoachContext function for direct use (for testing and external usage)
export async function buildCoachContext(userId: string): Promise<CoachContext> {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0]

    // 1. Get meals for today
    const todaysMeals = await getMealLogsForDate(dateStr)
    const recentMeals = todaysMeals.map((m) => m.mealType)

    // 2. Calculate today's macros
    const todayIntake = {
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
    }

    for (const meal of todaysMeals) {
      todayIntake.calories += meal.totalCalories
      todayIntake.proteinG += meal.totalProteinG
      todayIntake.carbsG += meal.totalCarbsG
      todayIntake.fatG += meal.totalFatG
      todayIntake.fiberG += meal.totalFiberG
    }

    // 3. Get nutrition goals
    const state = nutritionGoalStore.getState()
    const goals = state.goals

    // 4. Get streak data
    const streak = await getStreak(userId)

    // 5. Build and return context
    const context: CoachContext = {
      recentMeals,
      todayIntake,
      goals: goals || null,
      streakData: {
        current: streak.current,
        longest: streak.longest,
      },
    }

    return context
  } catch (error) {
    console.error('Error building coach context:', error)
    // Return empty context on error
    return {
      recentMeals: [],
      todayIntake: {
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        fiberG: 0,
      },
      goals: null,
      streakData: {
        current: 0,
        longest: 0,
      },
    }
  }
}

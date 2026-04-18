import { create } from 'zustand'
import type { MealLog, MacroTotals } from '../types/nutrition'

interface NutritionStoreState {
  meals: MealLog[]
  addMeal: (meal: MealLog) => void
  removeMeal: (id: string) => void
  calculateTodaysMacros: () => MacroTotals
  getMealsForDate: (date: string) => MealLog[]
  clear: () => void
}

export const useNutritionStore = create<NutritionStoreState>((set, get) => ({
  meals: [],

  addMeal: (meal: MealLog) => {
    set((state) => ({
      meals: [...state.meals, meal],
    }))
  },

  removeMeal: (id: string) => {
    set((state) => ({
      meals: state.meals.filter((meal) => meal.id !== id),
    }))
  },

  calculateTodaysMacros: () => {
    const today = new Date().toISOString().split('T')[0]
    const todaysMeals = get().getMealsForDate(today)

    return {
      calories: todaysMeals.reduce((sum, meal) => sum + meal.totalCalories, 0),
      proteinG: todaysMeals.reduce((sum, meal) => sum + meal.totalProteinG, 0),
      carbsG: todaysMeals.reduce((sum, meal) => sum + meal.totalCarbsG, 0),
      fatG: todaysMeals.reduce((sum, meal) => sum + meal.totalFatG, 0),
      fiberG: todaysMeals.reduce((sum, meal) => sum + meal.totalFiberG, 0),
    }
  },

  getMealsForDate: (date: string) => {
    return get().meals.filter((meal) => meal.loggedAt.startsWith(date))
  },

  clear: () => {
    set({ meals: [] })
  },
}))

import { create } from 'zustand'
import type { MealSuggestion, NutritionInfo } from '../types/mealPlanning'

interface MealPlanningState {
  // Current suggestions
  currentSuggestions: MealSuggestion[]
  setSuggestions: (suggestions: MealSuggestion[]) => void
  clearSuggestions: () => void

  // Weekly plan management
  weeklyPlan: MealSuggestion[]
  addToWeeklyPlan: (suggestion: MealSuggestion) => void
  removeFromWeeklyPlan: (id: string) => void
  setWeeklyPlan: (suggestions: MealSuggestion[]) => void
  clearWeeklyPlan: () => void

  // Loading and error states
  isLoading: boolean
  setLoading: (loading: boolean) => void

  error: string | null
  setError: (error: string | null) => void

  // Derived/computed state
  getTotalWeeklyNutrition?: () => NutritionInfo
}

export const useMealPlanningStore = create<MealPlanningState>((set, get) => ({
  // Initial state
  currentSuggestions: [],
  weeklyPlan: [],
  isLoading: false,
  error: null,

  // Actions for current suggestions
  setSuggestions: (suggestions: MealSuggestion[]) => set({ currentSuggestions: suggestions }),

  clearSuggestions: () => set({ currentSuggestions: [] }),

  // Actions for weekly plan
  addToWeeklyPlan: (suggestion: MealSuggestion) =>
    set((state) => {
      // Check if already exists
      const exists = state.weeklyPlan.some((s) => s.id === suggestion.id)
      if (exists) {
        return state
      }
      return {
        weeklyPlan: [...state.weeklyPlan, suggestion],
      }
    }),

  removeFromWeeklyPlan: (id: string) =>
    set((state) => ({
      weeklyPlan: state.weeklyPlan.filter((s) => s.id !== id),
    })),

  setWeeklyPlan: (suggestions: MealSuggestion[]) => set({ weeklyPlan: suggestions }),

  clearWeeklyPlan: () => set({ weeklyPlan: [] }),

  // Loading state
  setLoading: (loading: boolean) => set({ isLoading: loading }),

  // Error state
  setError: (error: string | null) => set({ error }),

  // Derived state: calculate total weekly nutrition
  getTotalWeeklyNutrition: () => {
    const state = get()
    if (state.weeklyPlan.length === 0) {
      return {
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        fiberG: 0,
      }
    }

    return state.weeklyPlan.reduce(
      (total, meal) => ({
        calories: total.calories + meal.nutrition.calories,
        proteinG: total.proteinG + meal.nutrition.proteinG,
        carbsG: total.carbsG + meal.nutrition.carbsG,
        fatG: total.fatG + meal.nutrition.fatG,
        fiberG: total.fiberG + meal.nutrition.fiberG,
      }),
      {
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        fiberG: 0,
      }
    )
  },
}))

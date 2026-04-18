import { create } from 'zustand'
import type { NutritionGoal } from '../types/nutrition'

interface NutritionGoalStoreState {
  goal: NutritionGoal | null
  loading: boolean
  error: string | null
  setGoal: (goal: NutritionGoal | null) => void
  updateGoal: (updates: Partial<NutritionGoal>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useNutritionGoalStore = create<NutritionGoalStoreState>((set) => ({
  goal: null,
  loading: false,
  error: null,

  setGoal: (goal: NutritionGoal | null) => {
    set({ goal })
  },

  updateGoal: (updates: Partial<NutritionGoal>) => {
    set((state) => {
      if (!state.goal) return {}
      return {
        goal: { ...state.goal, ...updates },
      }
    })
  },

  setLoading: (loading: boolean) => {
    set({ loading })
  },

  setError: (error: string | null) => {
    set({ error })
  },
}))

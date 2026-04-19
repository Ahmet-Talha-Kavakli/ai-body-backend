import { create } from 'zustand'
import type { Recommendation } from '@/types/analytics'
import * as recommendationService from '../services/recommendationService'

interface RecommendationState {
  meals: Recommendation[]
  workouts: Recommendation[]
  health: Recommendation[]
  friends: Recommendation[]
  challenges: Recommendation[]
  allRecommendations: Recommendation[]
  loading: boolean
  error: string | null

  setMeals: (recs: Recommendation[]) => void
  setWorkouts: (recs: Recommendation[]) => void
  setHealth: (recs: Recommendation[]) => void
  setFriends: (recs: Recommendation[]) => void
  setChallenges: (recs: Recommendation[]) => void
  setAllRecommendations: (recs: Recommendation[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  loadMealRecommendations: (userId: string) => Promise<void>
  loadWorkoutRecommendations: (userId: string) => Promise<void>
  loadAllRecommendations: (userId: string) => Promise<void>
  getTopRecommendations: (count: number) => Recommendation[]
  clearRecommendations: () => void
}

export const useRecommendationStore = create<RecommendationState>((set, get) => ({
  meals: [],
  workouts: [],
  health: [],
  friends: [],
  challenges: [],
  allRecommendations: [],
  loading: false,
  error: null,

  setMeals: (recs) => set({ meals: recs }),
  setWorkouts: (recs) => set({ workouts: recs }),
  setHealth: (recs) => set({ health: recs }),
  setFriends: (recs) => set({ friends: recs }),
  setChallenges: (recs) => set({ challenges: recs }),
  setAllRecommendations: (recs) => set({ allRecommendations: recs }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  loadMealRecommendations: async (userId) => {
    set({ loading: true, error: null })
    try {
      const recs = await recommendationService.getMealRecommendations(userId)
      set({ meals: recs, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  loadWorkoutRecommendations: async (userId) => {
    set({ loading: true, error: null })
    try {
      const recs = await recommendationService.getWorkoutRecommendations(userId)
      set({ workouts: recs, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  loadAllRecommendations: async (userId) => {
    set({ loading: true, error: null })
    try {
      const recs = await recommendationService.getAllRecommendations(userId)
      set({ allRecommendations: recs, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  getTopRecommendations: (count) => {
    const { allRecommendations } = get()
    return allRecommendations.slice(0, count)
  },

  clearRecommendations: () => set({
    meals: [],
    workouts: [],
    health: [],
    friends: [],
    challenges: [],
    allRecommendations: [],
  }),
}))

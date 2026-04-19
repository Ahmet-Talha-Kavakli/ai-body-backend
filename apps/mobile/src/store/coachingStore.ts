import { create } from 'zustand'
import { CoachingInsight } from '../types/analytics'
import * as coachingService from '../services/coachingService'

interface CoachingState {
  insights: CoachingInsight[]
  performanceInsights: CoachingInsight[]
  nutritionInsights: CoachingInsight[]
  recoveryInsights: CoachingInsight[]
  behavioralInsights: CoachingInsight[]
  loading: boolean
  error: string | null

  setInsights: (insights: CoachingInsight[]) => void
  setPerformanceInsights: (insights: CoachingInsight[]) => void
  setNutritionInsights: (insights: CoachingInsight[]) => void
  setRecoveryInsights: (insights: CoachingInsight[]) => void
  setBehavioralInsights: (insights: CoachingInsight[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  generatePerformanceInsights: (userId: string, data: any) => Promise<void>
  generateNutritionInsights: (userId: string, data: any) => Promise<void>
  generateRecoveryInsights: (userId: string, data: any) => Promise<void>
  generateBehavioralInsights: (userId: string, data: any) => Promise<void>
  generateAllInsights: (userId: string, data: any) => Promise<void>

  getInsightsByDomain: (domain: string) => CoachingInsight[]
  getActionableInsights: () => CoachingInsight[]
  clearInsights: () => void
}

export const useCoachingStore = create<CoachingState>((set, get) => ({
  insights: [],
  performanceInsights: [],
  nutritionInsights: [],
  recoveryInsights: [],
  behavioralInsights: [],
  loading: false,
  error: null,

  setInsights: (insights) => set({ insights }),
  setPerformanceInsights: (insights) => set({ performanceInsights: insights }),
  setNutritionInsights: (insights) => set({ nutritionInsights: insights }),
  setRecoveryInsights: (insights) => set({ recoveryInsights: insights }),
  setBehavioralInsights: (insights) => set({ behavioralInsights: insights }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  generatePerformanceInsights: async (userId, data) => {
    set({ loading: true, error: null })
    try {
      const insights = await coachingService.generatePerformanceInsights(userId, data)
      set({ performanceInsights: insights, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  generateNutritionInsights: async (userId, data) => {
    set({ loading: true, error: null })
    try {
      const insights = await coachingService.generateNutritionInsights(userId, data)
      set({ nutritionInsights: insights, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  generateRecoveryInsights: async (userId, data) => {
    set({ loading: true, error: null })
    try {
      const insights = await coachingService.generateRecoveryInsights(userId, data)
      set({ recoveryInsights: insights, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  generateBehavioralInsights: async (userId, data) => {
    set({ loading: true, error: null })
    try {
      const insights = await coachingService.generateBehavioralInsights(userId, data)
      set({ behavioralInsights: insights, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  generateAllInsights: async (userId, data) => {
    set({ loading: true, error: null })
    try {
      const [perf, nutr, recov, behav] = await Promise.all([
        coachingService.generatePerformanceInsights(userId, data.workout),
        coachingService.generateNutritionInsights(userId, data.nutrition),
        coachingService.generateRecoveryInsights(userId, data.recovery),
        coachingService.generateBehavioralInsights(userId, data.behavioral),
      ])

      const allInsights = [...perf, ...nutr, ...recov, ...behav]
      set({
        insights: allInsights,
        performanceInsights: perf,
        nutritionInsights: nutr,
        recoveryInsights: recov,
        behavioralInsights: behav,
        loading: false,
      })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  getInsightsByDomain: (domain) => {
    const { insights } = get()
    return insights.filter((i) => i.domain === domain)
  },

  getActionableInsights: () => {
    const { insights } = get()
    return insights.filter((i) => i.actionable)
  },

  clearInsights: () =>
    set({
      insights: [],
      performanceInsights: [],
      nutritionInsights: [],
      recoveryInsights: [],
      behavioralInsights: [],
    }),
}))

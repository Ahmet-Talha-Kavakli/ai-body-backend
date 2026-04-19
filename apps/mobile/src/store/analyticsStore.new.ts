import { create } from 'zustand'
import { AnalyticsSummary, TrendData } from '../types/analytics'
import * as analyticsService from '../services/analyticsService'

interface AnalyticsState {
  summary: AnalyticsSummary | null
  trends: Record<string, TrendData>
  period: 'daily' | 'weekly' | 'monthly'
  loading: boolean
  error: string | null

  setSummary: (summary: AnalyticsSummary | null) => void
  setTrends: (trends: Record<string, TrendData>) => void
  setPeriod: (period: 'daily' | 'weekly' | 'monthly') => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  generateSummary: (userId: string, period?: 'daily' | 'weekly' | 'monthly') => Promise<void>
  getTrendData: (userId: string, metric: string) => Promise<TrendData | null>

  getGoalProgress: (metric: string) => number // 0-100
  clearAnalytics: () => void
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  summary: null,
  trends: {},
  period: 'weekly',
  loading: false,
  error: null,

  setSummary: (summary) => set({ summary }),
  setTrends: (trends) => set({ trends }),
  setPeriod: (period) => set({ period }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  generateSummary: async (userId, period = 'weekly') => {
    set({ loading: true, error: null })
    try {
      const summary = await analyticsService.generateAnalyticsSummary(userId, period)
      set({ summary, period, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  getTrendData: async (userId, metric) => {
    try {
      const trend = await analyticsService.getTrendData(userId, metric)
      if (trend) {
        set((state) => ({
          trends: { ...state.trends, [metric]: trend },
        }))
      }
      return trend
    } catch (error) {
      console.error('Failed to get trend:', error)
      return null
    }
  },

  getGoalProgress: (metric) => {
    const { summary } = get()
    if (!summary) return 0

    const goal = (summary.goals as any)[`${metric}Goal`]
    const actual = (summary.goals as any)[`${metric}Actual`]

    if (!goal) return 0
    return Math.min(100, Math.round((actual / goal) * 100))
  },

  clearAnalytics: () =>
    set({
      summary: null,
      trends: {},
    }),
}))

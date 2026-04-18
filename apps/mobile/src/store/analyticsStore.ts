import { create } from 'zustand'

interface SessionMetrics {
  sessionId: string
  totalDuration: number
  exercisesCompleted: number
  setsCompleted: number
  totalReps: number
  totalVolume: number // weight * reps
  averageFormScore: number
  caloriesBurned?: number
  timestamp: number
}

interface ExerciseMetrics {
  exerciseId: string
  totalSessions: number
  totalSets: number
  totalReps: number
  personalRecord?: {
    weight: number
    reps: number
    date: number
  }
  averageFormScore: number
  progressTrend: number // Percentage change over time
}

interface DailyStats {
  date: string // YYYY-MM-DD
  totalDuration: number
  exercisesCompleted: number
  sessionsCompleted: number
  totalVolume: number
  averageFormScore: number
}

interface AnalyticsState {
  sessionMetrics: Map<string, SessionMetrics>
  exerciseMetrics: Map<string, ExerciseMetrics>
  dailyStats: Map<string, DailyStats>
  periodStart: number
  periodEnd: number
}

interface AnalyticsStore extends AnalyticsState {
  // Session recording
  recordSession: (metrics: SessionMetrics) => void
  getSessionMetrics: (sessionId: string) => SessionMetrics | undefined
  getRecentSessions: (days: number) => SessionMetrics[]

  // Exercise analytics
  recordExerciseMetrics: (metrics: ExerciseMetrics) => void
  getExerciseMetrics: (exerciseId: string) => ExerciseMetrics | undefined
  updateExerciseMetrics: (exerciseId: string, updates: Partial<ExerciseMetrics>) => void
  getTopExercises: (limit: number) => ExerciseMetrics[]
  getPersonalRecords: () => Map<string, { weight: number; reps: number; date: number }>

  // Daily aggregation
  recordDailyStats: (stats: DailyStats) => void
  getDailyStats: (date: string) => DailyStats | undefined
  getWeeklyStats: () => DailyStats[]
  getMonthlyStats: () => DailyStats[]

  // Computed metrics
  getTotalSessionCount: () => number
  getTotalDuration: () => number // Total duration across all sessions
  getAverageFormScore: () => number
  getProgressTrend: (exerciseId: string, days: number) => number
  getWeeklyProgress: () => { date: string; metric: number }[]

  // Period management
  setPeriod: (start: number, end: number) => void
  clearPeriod: () => void

  // Reset
  clear: () => void
}

const initialState: AnalyticsState = {
  sessionMetrics: new Map(),
  exerciseMetrics: new Map(),
  dailyStats: new Map(),
  periodStart: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
  periodEnd: Date.now(),
}

export const useAnalyticsStore = create<AnalyticsStore>((set, get) => ({
  ...initialState,

  recordSession: (metrics: SessionMetrics) =>
    set((state) => {
      const updated = new Map(state.sessionMetrics)
      updated.set(metrics.sessionId, metrics)
      return {
        sessionMetrics: updated,
      }
    }),

  getSessionMetrics: (sessionId: string) => {
    return get().sessionMetrics.get(sessionId)
  },

  getRecentSessions: (days: number) => {
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000
    const sessions: SessionMetrics[] = []

    get().sessionMetrics.forEach((metric) => {
      if (metric.timestamp >= cutoffTime) {
        sessions.push(metric)
      }
    })

    return sessions.sort((a, b) => b.timestamp - a.timestamp)
  },

  recordExerciseMetrics: (metrics: ExerciseMetrics) =>
    set((state) => {
      const updated = new Map(state.exerciseMetrics)
      updated.set(metrics.exerciseId, metrics)
      return {
        exerciseMetrics: updated,
      }
    }),

  getExerciseMetrics: (exerciseId: string) => {
    return get().exerciseMetrics.get(exerciseId)
  },

  updateExerciseMetrics: (exerciseId: string, updates: Partial<ExerciseMetrics>) =>
    set((state) => {
      const current = state.exerciseMetrics.get(exerciseId)
      if (current) {
        const updated = new Map(state.exerciseMetrics)
        updated.set(exerciseId, {
          ...current,
          ...updates,
        })
        return {
          exerciseMetrics: updated,
        }
      }
    }),

  getTopExercises: (limit: number) => {
    const exercises: ExerciseMetrics[] = []
    get().exerciseMetrics.forEach((metric) => {
      exercises.push(metric)
    })
    return exercises.sort((a, b) => b.totalSessions - a.totalSessions).slice(0, limit)
  },

  getPersonalRecords: () => {
    const records = new Map<string, { weight: number; reps: number; date: number }>()
    get().exerciseMetrics.forEach((metric) => {
      if (metric.personalRecord) {
        records.set(metric.exerciseId, metric.personalRecord)
      }
    })
    return records
  },

  recordDailyStats: (stats: DailyStats) =>
    set((state) => {
      const updated = new Map(state.dailyStats)
      updated.set(stats.date, stats)
      return {
        dailyStats: updated,
      }
    }),

  getDailyStats: (date: string) => {
    return get().dailyStats.get(date)
  },

  getWeeklyStats: () => {
    const stats: DailyStats[] = []
    const now = Date.now()
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000

    get().dailyStats.forEach((stat) => {
      const statDate = new Date(stat.date).getTime()
      if (statDate >= weekAgo && statDate <= now) {
        stats.push(stat)
      }
    })

    return stats
  },

  getMonthlyStats: () => {
    const stats: DailyStats[] = []
    const now = Date.now()
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000

    get().dailyStats.forEach((stat) => {
      const statDate = new Date(stat.date).getTime()
      if (statDate >= monthAgo && statDate <= now) {
        stats.push(stat)
      }
    })

    return stats
  },

  getTotalSessionCount: () => {
    return get().sessionMetrics.size
  },

  getTotalDuration: () => {
    let total = 0
    get().sessionMetrics.forEach((metric) => {
      total += metric.totalDuration
    })
    return total
  },

  getAverageFormScore: () => {
    const metrics = Array.from(get().sessionMetrics.values())
    if (metrics.length === 0) return 0
    const sum = metrics.reduce((acc, m) => acc + m.averageFormScore, 0)
    return sum / metrics.length
  },

  getProgressTrend: (exerciseId: string, days: number) => {
    const metric = get().getExerciseMetrics(exerciseId)
    if (!metric) return 0
    return metric.progressTrend
  },

  getWeeklyProgress: () => {
    const progress: { date: string; metric: number }[] = []
    get()
      .getWeeklyStats()
      .forEach((stat) => {
        progress.push({
          date: stat.date,
          metric: stat.totalVolume,
        })
      })
    return progress.sort((a, b) => a.date.localeCompare(b.date))
  },

  setPeriod: (start: number, end: number) =>
    set({
      periodStart: start,
      periodEnd: end,
    }),

  clearPeriod: () =>
    set({
      periodStart: Date.now() - 30 * 24 * 60 * 60 * 1000,
      periodEnd: Date.now(),
    }),

  clear: () => set(initialState),
}))

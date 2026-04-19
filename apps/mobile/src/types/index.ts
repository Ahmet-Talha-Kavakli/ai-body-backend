export interface UserProfile {
  id: string
  email: string
  name: string
  phone?: string
  avatarUrl?: string
  age?: number
  gender?: string
  height?: number
  weight?: number
  goalType?: string
  healthConditions?: string[]
  injuries?: string[]
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  todayCalories: number
  calorieGoal: number
  todayWater: number
  waterGoal: number
  todaySteps: number
  stepsGoal: number
  recentWorkouts?: any[]
}

export interface AuthState {
  isSignedIn: boolean
  isInitializing: boolean
  userEmail?: string
  error?: string
}

export interface SyncQueueItem {
  id: string
  userId: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  endpoint: string
  payload?: any
  createdAt: string
  retries: number
}

// Re-export analytics types
export type {
  UserEmbedding,
  Recommendation,
  CoachingInsight,
  AnalyticsSummary,
} from './analytics'

// Re-export insights types
export type {
  InsightCard,
  AnalyticsChartData,
  TrendData,
} from './insights'

// Nutrition coach types for AI coaching interactions

import type { MacroTotals, NutritionGoal } from './nutrition'

export interface CoachQuestion {
  id: string
  userId: string
  question: string
  inputType: 'text' | 'voice'
  createdAt: string
  synced: boolean
}

export interface CoachResponse {
  id: string
  questionId: string
  response: string
  context: CoachContext
}

export interface CoachContext {
  recentMeals: string[]
  todayIntake: MacroTotals
  goals: NutritionGoal | null
  streakData: { current: number; longest: number }
}

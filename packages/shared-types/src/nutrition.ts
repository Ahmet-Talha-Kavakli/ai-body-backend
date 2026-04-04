import type { ID, Timestamp } from './common'

export interface MealLog {
  id: ID
  userId: ID
  loggedAt: Timestamp
  mealType: MealType
  items: FoodItem[]
  photoUrl?: string
  aiAnalyzed: boolean
  totalCalories: number
  totalProteinG: number
  totalCarbsG: number
  totalFatG: number
  notes?: string
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout'

export interface FoodItem {
  id: ID
  name: string
  servingSize: number
  servingUnit: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number
  sugarG?: number
  sodiumMg?: number
}

export interface NutritionGoal {
  id: ID
  userId: ID
  dailyCalories: number
  proteinG: number
  carbsG: number
  fatG: number
  waterMl: number
  generatedByAi: boolean
  updatedAt: Timestamp
}

export interface NutritionSummary {
  date: string // YYYY-MM-DD
  totalCalories: number
  totalProteinG: number
  totalCarbsG: number
  totalFatG: number
  goalAdherence: number // 0-100%
  meals: MealLog[]
}

// Core nutrition types for meal logging and macro tracking

export interface MealLog {
  id: string
  userId: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout'
  items: FoodItem[]
  totalCalories: number
  totalProteinG: number
  totalCarbsG: number
  totalFatG: number
  totalFiberG: number
  loggedAt: string // ISO timestamp
  aiAnalyzed: boolean
  photoUrl?: string
  photoPath?: string
  notes?: string
  synced: boolean
}

export interface FoodItem {
  name: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  glycemicIndex?: number
  allergens?: string[]
  portionSize?: number
  portionUnit?: string // 'g', 'ml', 'cup', 'oz', etc.
  barcode?: string
  servingSize?: number
  servingSizeUnit?: string
}

export interface NutritionGoal {
  id: string
  userId: string
  dailyCalories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  waterGoalMl: number
  generatedByAi: boolean
  dietType: 'balanced' | 'keto' | 'vegan' | 'paleo' | 'low_carb'
  createdAt: string
  updatedAt: string
}

export interface MacroTotals {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
}

export interface NutritionScore {
  scorePercent: number
  calorieStatus: 'under' | 'target' | 'over'
  proteinStatus: 'under' | 'target' | 'over'
}

export interface NutritionStreak {
  userId: string
  currentStreak: number
  longestStreak: number
  lastLogDate: string
}

export interface MealPhoto {
  id: string
  mealLogId: string
  filePath: string
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'failed'
  createdAt: string
}

export interface WaterIntake {
  date: string // YYYY-MM-DD
  totalMl: number
  goalMl: number
  timestamp: string
}

export interface WeeklyStats {
  weekStart: string // ISO date
  totalCalories: number
  avgCalories: number
  mealsLogged: number
  daysWithLogs: number
}

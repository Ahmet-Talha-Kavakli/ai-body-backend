// apps/web/lib/nutrition/types.ts

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout'

export type DietType = 'balanced' | 'keto' | 'vegan' | 'paleo' | 'low_carb'

export interface FoodItem {
  name: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number
  glycemicIndex?: number
  allergens?: string[]
  portionSize?: number
  portionUnit?: string
  barcode?: string
}

export interface MealLog {
  id: string
  mealType: MealType
  items: FoodItem[]
  totalCalories: number
  totalProteinG: number
  totalCarbsG: number
  totalFatG: number
  totalFiberG?: number
  loggedAt: string
  aiAnalyzed: boolean
  photoUrl?: string
  notes?: string
}

export interface NutritionGoal {
  dailyCalories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  waterGoalMl: number
}

export interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

export interface NutritionStreak {
  currentStreak: number
  longestStreak: number
  lastLogDate: string | null
}

export interface NutritionScore {
  score: number // 0-100
  breakdown: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    water: number
  }
}

export interface OpenFoodFactsProduct {
  code: string
  product_name: string
  brands?: string
  nutriments: {
    'energy-kcal_100g'?: number
    proteins_100g?: number
    carbohydrates_100g?: number
    fat_100g?: number
    fiber_100g?: number
    'glycemic-index'?: number
  }
  allergens_tags?: string[]
  image_url?: string
}

export interface SearchResult {
  barcode: string
  name: string
  brand?: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  fiberPer100g?: number
  glycemicIndex?: number
  allergens: string[]
  imageUrl?: string
}

export interface DailyEntry {
  date: string // YYYY-MM-DD
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface WeeklyStats {
  weekLabel: string // e.g. "14 Apr - 20 Apr"
  avgCalories: number
  avgProtein: number
  avgCarbs: number
  avgFat: number
  daysLogged: number
  goalHitDays: number
  badge: 'excellent' | 'good' | 'needs_work'
}

export interface MealTimingStats {
  breakfast: number // avg calories
  lunch: number
  dinner: number
  snack: number
}

export interface TopFood {
  name: string
  count: number
  avgCalories: number
}

export interface HistoryStats {
  daily: DailyEntry[]
  goal: { dailyCalories: number; proteinG: number; carbsG: number; fatG: number } | null
  goalHitPercent: number // 0-100
  topFoods: TopFood[]
  mealTiming: MealTimingStats
  streakCalendar: Record<string, boolean> // YYYY-MM-DD -> logged?
}

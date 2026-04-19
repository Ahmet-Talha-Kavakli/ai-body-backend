export interface NutritionInfo {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
}

export interface MealSuggestion {
  id: string
  userId: string
  mealName: string
  description: string
  nutrition: NutritionInfo
  reasonForSuggestion: string // "Based on your 2000 cal goal and love of pizza"
  recipeUrl?: string
  createdAt: string // ISO timestamp
  expiresAt: string // ISO timestamp (1 day from creation)
}

export interface DetectionHistory {
  foodName: string
  calories: number
  detectedAt: string
}

export interface NutritionGoal {
  dailyCalories: number
  proteinG: number
  carbsG: number
  fatG: number
}

export interface MealSuggestionRequest {
  userId: string
  nutritionGoal: NutritionGoal
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  dietaryPreferences?: string[]
  recentDetections?: DetectionHistory[]
  preferredCuisines?: string[]
}

export interface MealSuggestionsResponse {
  suggestions: MealSuggestion[]
  timestamp: string
}

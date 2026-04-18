import type { NutritionGoal } from '@fitai/shared-types'

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extra_active'
export type Goal = 'lose_weight' | 'maintain' | 'gain_muscle'
export type DietType = 'balanced' | 'keto' | 'vegan' | 'paleo' | 'low_carb'
export type Sex = 'male' | 'female'

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
}

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  lose_weight: -500, // 500 cal deficit
  maintain: 0,
  gain_muscle: 500, // 500 cal surplus
}

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor formula
 */
function calculateBMR(age: number, weightKg: number, heightCm: number, sex: Sex): number {
  if (sex === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5
  } else {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161
  }
}

/**
 * Calculate Total Daily Energy Expenditure
 */
function calculateTDEE(
  age: number,
  weightKg: number,
  heightCm: number,
  activityLevel: ActivityLevel,
  sex: Sex
): number {
  const bmr = calculateBMR(age, weightKg, heightCm, sex)
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel]
  return Math.round(bmr * multiplier)
}

/**
 * Calculate water intake goal (25-35 ml per kg body weight)
 */
function calculateWaterGoal(weightKg: number): number {
  // Average 30 ml per kg
  return Math.round(weightKg * 30)
}

/**
 * Split macros based on diet type
 */
interface MacroSplit {
  proteinPercent: number
  carbPercent: number
  fatPercent: number
}

function getMacroSplit(dietType: DietType, goal: Goal): MacroSplit {
  switch (dietType) {
    case 'keto':
      return { proteinPercent: 25, carbPercent: 5, fatPercent: 70 }
    case 'low_carb':
      return { proteinPercent: 30, carbPercent: 25, fatPercent: 45 }
    case 'vegan':
      return { proteinPercent: 20, carbPercent: 60, fatPercent: 20 }
    case 'paleo':
      return { proteinPercent: 30, carbPercent: 35, fatPercent: 35 }
    case 'balanced':
    default:
      return { proteinPercent: 30, carbPercent: 45, fatPercent: 25 }
  }
}

/**
 * Generate nutrition goal based on user profile
 */
export function generateNutritionGoal(
  age: number,
  weightKg: number,
  heightCm: number,
  activityLevel: ActivityLevel,
  goal: Goal,
  dietType: DietType,
  sex: Sex,
  userId?: string
): NutritionGoal {
  // Calculate TDEE
  const tdee = calculateTDEE(age, weightKg, heightCm, activityLevel, sex)

  // Apply goal adjustment (deficit/surplus)
  const adjustment = GOAL_ADJUSTMENTS[goal]
  const dailyCalories = Math.max(1200, tdee + adjustment) // Minimum 1200 calories for safety

  // Get macro split
  const macroSplit = getMacroSplit(dietType, goal)

  // Calculate macros in grams
  // Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g
  const caloriesForProtein = (dailyCalories * macroSplit.proteinPercent) / 100
  const caloriesForCarbs = (dailyCalories * macroSplit.carbPercent) / 100
  const caloriesForFat = (dailyCalories * macroSplit.fatPercent) / 100

  const proteinG = Math.round(caloriesForProtein / 4)
  const carbsG = Math.round(caloriesForCarbs / 4)
  const fatG = Math.round(caloriesForFat / 9)

  // Calculate water goal
  const waterMl = calculateWaterGoal(weightKg)

  const nutritionGoal: NutritionGoal = {
    id: `goal_${Date.now()}`,
    userId: userId || '',
    dailyCalories,
    proteinG,
    carbsG,
    fatG,
    waterMl,
    generatedByAi: true,
    updatedAt: new Date(),
  }

  return nutritionGoal
}

/**
 * Validate if generated goal is reasonable
 */
export function isGoalReasonable(goal: NutritionGoal, weightKg: number): boolean {
  // Check calorie range (500-4000 is generally reasonable)
  if (goal.dailyCalories < 500 || goal.dailyCalories > 4000) {
    return false
  }

  // Protein should be at least 0.8g per kg body weight
  if (goal.proteinG < 0.8 * weightKg) {
    return false
  }

  // Macros should sum to roughly the calorie target
  const totalCalcsFromMacros = goal.proteinG * 4 + goal.carbsG * 4 + goal.fatG * 9
  const difference = Math.abs(totalCalcsFromMacros - goal.dailyCalories)
  if (difference > goal.dailyCalories * 0.1) {
    // Allow 10% variance due to rounding
    return false
  }

  // Water goal should be at least 1500ml daily
  if (goal.waterMl < 1500) {
    return false
  }

  return true
}

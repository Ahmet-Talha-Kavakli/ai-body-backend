import type { MacroTotals, NutritionGoal, NutritionScore } from './types'

function pct(current: number, goal: number): number {
  if (goal === 0) return 0
  // penalize going over: over 120% = 0 points for that macro
  const ratio = current / goal
  if (ratio > 1.2) return Math.max(0, 100 - (ratio - 1.2) * 200)
  return Math.min(100, ratio * 100)
}

export function calculateNutritionScore(
  totals: MacroTotals,
  goal: NutritionGoal,
  waterGlasses: number
): NutritionScore {
  const waterGoalGlasses = Math.round(goal.waterGoalMl / 250)
  const breakdown = {
    calories: Math.round(pct(totals.calories, goal.dailyCalories)),
    protein: Math.round(pct(totals.protein, goal.proteinG)),
    carbs: Math.round(pct(totals.carbs, goal.carbsG)),
    fat: Math.round(pct(totals.fat, goal.fatG)),
    fiber: Math.round(pct(totals.fiber, goal.fiberG)),
    water: Math.round(pct(waterGlasses, waterGoalGlasses)),
  }
  const weights = { calories: 0.3, protein: 0.25, carbs: 0.15, fat: 0.1, fiber: 0.1, water: 0.1 }
  const score = Math.round(
    breakdown.calories * weights.calories +
      breakdown.protein * weights.protein +
      breakdown.carbs * weights.carbs +
      breakdown.fat * weights.fat +
      breakdown.fiber * weights.fiber +
      breakdown.water * weights.water
  )
  return { score, breakdown }
}

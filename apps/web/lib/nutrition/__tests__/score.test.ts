import { describe, it, expect } from 'vitest'
import { calculateNutritionScore } from '../score'
import type { MacroTotals, NutritionGoal } from '../types'

const goal: NutritionGoal = {
  dailyCalories: 2000,
  proteinG: 150,
  carbsG: 200,
  fatG: 65,
  fiberG: 25,
  waterGoalMl: 2000,
}

describe('calculateNutritionScore', () => {
  it('returns 100 when all goals met exactly', () => {
    const totals: MacroTotals = { calories: 2000, protein: 150, carbs: 200, fat: 65, fiber: 25 }
    const result = calculateNutritionScore(totals, goal, 8)
    expect(result.score).toBe(100)
  })

  it('returns 0 when nothing logged', () => {
    const totals: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    const result = calculateNutritionScore(totals, goal, 0)
    expect(result.score).toBe(0)
  })

  it('score is capped at 100 even when over goal', () => {
    const totals: MacroTotals = { calories: 5000, protein: 300, carbs: 400, fat: 200, fiber: 60 }
    const result = calculateNutritionScore(totals, goal, 8)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('partial completion returns partial score', () => {
    const totals: MacroTotals = { calories: 1000, protein: 75, carbs: 100, fat: 32, fiber: 12 }
    const result = calculateNutritionScore(totals, goal, 4)
    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThan(100)
  })
})

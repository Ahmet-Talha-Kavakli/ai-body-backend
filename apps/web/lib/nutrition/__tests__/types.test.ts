import { describe, it, expect } from 'vitest'
import type { FoodItem, MealLog, NutritionScore } from '../types'

describe('NutritionScore', () => {
  it('score is a number between 0 and 100', () => {
    const score: NutritionScore = {
      score: 75,
      breakdown: { calories: 80, protein: 70, carbs: 75, fat: 80, fiber: 60, water: 75 },
    }
    expect(score.score).toBeGreaterThanOrEqual(0)
    expect(score.score).toBeLessThanOrEqual(100)
  })
})

describe('FoodItem', () => {
  it('accepts optional fields', () => {
    const item: FoodItem = { name: 'Chicken', calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6 }
    expect(item.glycemicIndex).toBeUndefined()
    expect(item.allergens).toBeUndefined()
  })
})

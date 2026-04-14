'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MealLog, NutritionGoal, MacroTotals } from '@/lib/nutrition/types'
import { calculateNutritionScore } from '@/lib/nutrition/score'
import type { NutritionScore } from '@/lib/nutrition/types'

interface TodayData {
  meals: MealLog[]
  goal: NutritionGoal
  totals: MacroTotals
  waterGlasses: number
  streak: { currentStreak: number; longestStreak: number }
  score: NutritionScore
  loading: boolean
}

const DEFAULT_GOAL: NutritionGoal = {
  dailyCalories: 2200,
  proteinG: 150,
  carbsG: 250,
  fatG: 70,
  fiberG: 25,
  waterGoalMl: 2000,
}

export function useNutritionToday() {
  const [data, setData] = useState<TodayData>({
    meals: [],
    goal: DEFAULT_GOAL,
    totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    waterGlasses: 0,
    streak: { currentStreak: 0, longestStreak: 0 },
    score: { score: 0, breakdown: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, water: 0 } },
    loading: true,
  })

  const fetchAll = useCallback(async () => {
    const [mealsRes, waterRes, streakRes] = await Promise.all([
      fetch('/api/nutrition'),
      fetch('/api/nutrition/water'),
      fetch('/api/nutrition/streak'),
    ])
    const [mealsData, waterData, streakData] = await Promise.all([
      mealsRes.json(),
      waterRes.json(),
      streakRes.json(),
    ])
    const meals: MealLog[] = mealsData.meals ?? []
    const goal: NutritionGoal = mealsData.nutritionGoal ?? DEFAULT_GOAL
    const waterGlasses: number = waterData.glasses ?? 0
    const totals: MacroTotals = {
      calories: meals.reduce((s, m) => s + m.totalCalories, 0),
      protein: meals.reduce((s, m) => s + m.totalProteinG, 0),
      carbs: meals.reduce((s, m) => s + m.totalCarbsG, 0),
      fat: meals.reduce((s, m) => s + m.totalFatG, 0),
      fiber: meals.reduce((s, m) => s + (m.totalFiberG ?? 0), 0),
    }
    const score = calculateNutritionScore(totals, goal, waterGlasses)
    setData({ meals, goal, totals, waterGlasses, streak: streakData, score, loading: false })
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const deleteMeal = async (id: string) => {
    const prev = data.meals
    setData((d) => ({ ...d, meals: d.meals.filter((m) => m.id !== id) }))
    try {
      await fetch(`/api/nutrition/${id}`, { method: 'DELETE' })
      await fetchAll()
    } catch {
      setData((d) => ({ ...d, meals: prev }))
    }
  }

  const copyMeal = async (meal: MealLog) => {
    const prev = data.meals
    const optimistic = { ...meal, id: `temp-${Date.now()}`, loggedAt: new Date().toISOString() }
    setData((d) => ({ ...d, meals: [...d.meals, optimistic] }))
    try {
      await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType: meal.mealType,
          items: meal.items,
          totalCalories: meal.totalCalories,
          totalProteinG: meal.totalProteinG,
          totalCarbsG: meal.totalCarbsG,
          totalFatG: meal.totalFatG,
        }),
      })
      await fetchAll()
    } catch {
      setData((d) => ({ ...d, meals: prev }))
    }
  }

  const updateWater = async (glasses: number) => {
    const prev = data.waterGlasses
    setData((d) => ({ ...d, waterGlasses: glasses }))
    try {
      await fetch('/api/nutrition/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ glasses }),
      })
    } catch {
      setData((d) => ({ ...d, waterGlasses: prev }))
    }
  }

  const addQuickItem = async (item: {
    name: string
    cals: number
    type: string
    protein: number
    carbs: number
    fat: number
  }) => {
    await fetch('/api/nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealType: item.type,
        items: [{ name: item.name, calories: item.cals }],
        totalCalories: item.cals,
        totalProteinG: item.protein,
        totalCarbsG: item.carbs,
        totalFatG: item.fat,
      }),
    })
    await fetchAll()
    await fetch('/api/nutrition/streak', { method: 'POST' })
  }

  return { ...data, deleteMeal, copyMeal, updateWater, addQuickItem, refresh: fetchAll }
}

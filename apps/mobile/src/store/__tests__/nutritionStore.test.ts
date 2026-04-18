import { describe, it, expect, beforeEach } from 'vitest'
import { useNutritionStore } from '../nutritionStore'
import type { MealLog, FoodItem } from '../../types/nutrition'

describe('nutritionStore', () => {
  beforeEach(() => {
    useNutritionStore.getState().clear()
  })

  describe('addMeal', () => {
    it('should add a meal to the store', () => {
      const meal: MealLog = {
        id: 'meal-1',
        userId: 'user-1',
        mealType: 'breakfast',
        items: [],
        totalCalories: 500,
        totalProteinG: 20,
        totalCarbsG: 60,
        totalFatG: 15,
        totalFiberG: 5,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }

      useNutritionStore.getState().addMeal(meal)
      const meals = useNutritionStore.getState().meals
      expect(meals).toHaveLength(1)
      expect(meals[0].id).toBe('meal-1')
    })

    it('should add multiple meals', () => {
      const meal1: MealLog = {
        id: 'meal-1',
        userId: 'user-1',
        mealType: 'breakfast',
        items: [],
        totalCalories: 500,
        totalProteinG: 20,
        totalCarbsG: 60,
        totalFatG: 15,
        totalFiberG: 5,
        loggedAt: '2024-04-18T08:00:00Z',
        aiAnalyzed: false,
        synced: false,
      }

      const meal2: MealLog = {
        id: 'meal-2',
        userId: 'user-1',
        mealType: 'lunch',
        items: [],
        totalCalories: 700,
        totalProteinG: 35,
        totalCarbsG: 75,
        totalFatG: 25,
        totalFiberG: 8,
        loggedAt: '2024-04-18T12:00:00Z',
        aiAnalyzed: false,
        synced: false,
      }

      useNutritionStore.getState().addMeal(meal1)
      useNutritionStore.getState().addMeal(meal2)

      const meals = useNutritionStore.getState().meals
      expect(meals).toHaveLength(2)
    })
  })

  describe('removeMeal', () => {
    it('should remove a meal by id', () => {
      const meal: MealLog = {
        id: 'meal-1',
        userId: 'user-1',
        mealType: 'breakfast',
        items: [],
        totalCalories: 500,
        totalProteinG: 20,
        totalCarbsG: 60,
        totalFatG: 15,
        totalFiberG: 5,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }

      useNutritionStore.getState().addMeal(meal)
      expect(useNutritionStore.getState().meals).toHaveLength(1)

      useNutritionStore.getState().removeMeal('meal-1')
      expect(useNutritionStore.getState().meals).toHaveLength(0)
    })

    it('should not remove if id does not exist', () => {
      const meal: MealLog = {
        id: 'meal-1',
        userId: 'user-1',
        mealType: 'breakfast',
        items: [],
        totalCalories: 500,
        totalProteinG: 20,
        totalCarbsG: 60,
        totalFatG: 15,
        totalFiberG: 5,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }

      useNutritionStore.getState().addMeal(meal)
      useNutritionStore.getState().removeMeal('non-existent')
      expect(useNutritionStore.getState().meals).toHaveLength(1)
    })
  })

  describe('calculateTodaysMacros', () => {
    it('should return zero macros for empty meals', () => {
      const macros = useNutritionStore.getState().calculateTodaysMacros()
      expect(macros.calories).toBe(0)
      expect(macros.proteinG).toBe(0)
      expect(macros.carbsG).toBe(0)
      expect(macros.fatG).toBe(0)
      expect(macros.fiberG).toBe(0)
    })

    it('should sum macros from all meals today', () => {
      const today = new Date().toISOString().split('T')[0]
      const meal1: MealLog = {
        id: 'meal-1',
        userId: 'user-1',
        mealType: 'breakfast',
        items: [],
        totalCalories: 300,
        totalProteinG: 15,
        totalCarbsG: 40,
        totalFatG: 10,
        totalFiberG: 3,
        loggedAt: `${today}T08:00:00Z`,
        aiAnalyzed: false,
        synced: false,
      }

      const meal2: MealLog = {
        id: 'meal-2',
        userId: 'user-1',
        mealType: 'lunch',
        items: [],
        totalCalories: 600,
        totalProteinG: 35,
        totalCarbsG: 70,
        totalFatG: 20,
        totalFiberG: 8,
        loggedAt: `${today}T12:00:00Z`,
        aiAnalyzed: false,
        synced: false,
      }

      useNutritionStore.getState().addMeal(meal1)
      useNutritionStore.getState().addMeal(meal2)

      const macros = useNutritionStore.getState().calculateTodaysMacros()
      expect(macros.calories).toBe(900)
      expect(macros.proteinG).toBe(50)
      expect(macros.carbsG).toBe(110)
      expect(macros.fatG).toBe(30)
      expect(macros.fiberG).toBe(11)
    })

    it('should not include meals from other days', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const meal: MealLog = {
        id: 'meal-1',
        userId: 'user-1',
        mealType: 'breakfast',
        items: [],
        totalCalories: 500,
        totalProteinG: 20,
        totalCarbsG: 60,
        totalFatG: 15,
        totalFiberG: 5,
        loggedAt: `${yesterday}T08:00:00Z`,
        aiAnalyzed: false,
        synced: false,
      }

      useNutritionStore.getState().addMeal(meal)
      const macros = useNutritionStore.getState().calculateTodaysMacros()
      expect(macros.calories).toBe(0)
    })
  })

  describe('getMealsForDate', () => {
    it('should return meals for a specific date', () => {
      const date = '2024-04-18'
      const meal1: MealLog = {
        id: 'meal-1',
        userId: 'user-1',
        mealType: 'breakfast',
        items: [],
        totalCalories: 300,
        totalProteinG: 15,
        totalCarbsG: 40,
        totalFatG: 10,
        totalFiberG: 3,
        loggedAt: `${date}T08:00:00Z`,
        aiAnalyzed: false,
        synced: false,
      }

      const meal2: MealLog = {
        id: 'meal-2',
        userId: 'user-1',
        mealType: 'lunch',
        items: [],
        totalCalories: 600,
        totalProteinG: 35,
        totalCarbsG: 70,
        totalFatG: 20,
        totalFiberG: 8,
        loggedAt: `${date}T12:00:00Z`,
        aiAnalyzed: false,
        synced: false,
      }

      useNutritionStore.getState().addMeal(meal1)
      useNutritionStore.getState().addMeal(meal2)

      const meals = useNutritionStore.getState().getMealsForDate(date)
      expect(meals).toHaveLength(2)
      expect(meals[0].id).toBe('meal-1')
      expect(meals[1].id).toBe('meal-2')
    })

    it('should return empty array for date with no meals', () => {
      const meals = useNutritionStore.getState().getMealsForDate('2024-01-01')
      expect(meals).toHaveLength(0)
    })

    it('should filter by date correctly', () => {
      const date1 = '2024-04-18'
      const date2 = '2024-04-19'

      const meal1: MealLog = {
        id: 'meal-1',
        userId: 'user-1',
        mealType: 'breakfast',
        items: [],
        totalCalories: 300,
        totalProteinG: 15,
        totalCarbsG: 40,
        totalFatG: 10,
        totalFiberG: 3,
        loggedAt: `${date1}T08:00:00Z`,
        aiAnalyzed: false,
        synced: false,
      }

      const meal2: MealLog = {
        id: 'meal-2',
        userId: 'user-1',
        mealType: 'breakfast',
        items: [],
        totalCalories: 350,
        totalProteinG: 18,
        totalCarbsG: 45,
        totalFatG: 12,
        totalFiberG: 4,
        loggedAt: `${date2}T08:00:00Z`,
        aiAnalyzed: false,
        synced: false,
      }

      useNutritionStore.getState().addMeal(meal1)
      useNutritionStore.getState().addMeal(meal2)

      const mealsDate1 = useNutritionStore.getState().getMealsForDate(date1)
      const mealsDate2 = useNutritionStore.getState().getMealsForDate(date2)

      expect(mealsDate1).toHaveLength(1)
      expect(mealsDate1[0].id).toBe('meal-1')
      expect(mealsDate2).toHaveLength(1)
      expect(mealsDate2[0].id).toBe('meal-2')
    })
  })

  describe('clear', () => {
    it('should clear all meals', () => {
      const meal: MealLog = {
        id: 'meal-1',
        userId: 'user-1',
        mealType: 'breakfast',
        items: [],
        totalCalories: 500,
        totalProteinG: 20,
        totalCarbsG: 60,
        totalFatG: 15,
        totalFiberG: 5,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }

      useNutritionStore.getState().addMeal(meal)
      expect(useNutritionStore.getState().meals).toHaveLength(1)

      useNutritionStore.getState().clear()
      expect(useNutritionStore.getState().meals).toHaveLength(0)
    })
  })
})

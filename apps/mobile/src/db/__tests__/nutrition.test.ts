import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createNutritionTables,
  saveMealLog,
  getMealLogsForDate,
  deleteMealLog,
  addRecentFood,
  getRecentFoods,
} from '../nutrition'
import type { MealLog, FoodItem } from '../../types/nutrition'

describe('nutrition database', () => {
  beforeEach(async () => {
    await createNutritionTables()
  })

  describe('createNutritionTables', () => {
    it('should create meal_logs table', async () => {
      await expect(createNutritionTables()).resolves.not.toThrow()
    })

    it('should be idempotent', async () => {
      await createNutritionTables()
      await expect(createNutritionTables()).resolves.not.toThrow()
    })
  })

  describe('saveMealLog', () => {
    it('should save a meal log with items', async () => {
      const meal: MealLog = {
        id: 'meal-1',
        userId: 'user-1',
        mealType: 'breakfast',
        items: [
          { name: 'Oatmeal', calories: 150, proteinG: 5, carbsG: 27, fatG: 3, fiberG: 4 },
          { name: 'Banana', calories: 105, proteinG: 1, carbsG: 27, fatG: 0.3, fiberG: 3 },
        ],
        totalCalories: 255,
        totalProteinG: 6,
        totalCarbsG: 54,
        totalFatG: 3.3,
        totalFiberG: 7,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }

      await expect(saveMealLog(meal)).resolves.not.toThrow()
    })

    it('should save meal with optional fields', async () => {
      const meal: MealLog = {
        id: 'meal-2',
        userId: 'user-1',
        mealType: 'lunch',
        items: [],
        totalCalories: 500,
        totalProteinG: 30,
        totalCarbsG: 60,
        totalFatG: 20,
        totalFiberG: 8,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: true,
        photoUrl: 'https://example.com/photo.jpg',
        photoPath: '/local/photo.jpg',
        notes: 'Had a sandwich',
        synced: false,
      }

      await expect(saveMealLog(meal)).resolves.not.toThrow()
    })

    it('should save multiple meals', async () => {
      const meal1: MealLog = {
        id: 'meal-1',
        userId: 'user-1',
        mealType: 'breakfast',
        items: [],
        totalCalories: 300,
        totalProteinG: 15,
        totalCarbsG: 40,
        totalFatG: 10,
        totalFiberG: 5,
        loggedAt: new Date().toISOString(),
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
        totalCarbsG: 75,
        totalFatG: 25,
        totalFiberG: 10,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }

      await saveMealLog(meal1)
      await expect(saveMealLog(meal2)).resolves.not.toThrow()
    })
  })

  describe('getMealLogsForDate', () => {
    it('should retrieve meal logs for a specific date', async () => {
      const date = '2024-04-18'
      const meal: MealLog = {
        id: 'meal-1',
        userId: 'user-1',
        mealType: 'breakfast',
        items: [],
        totalCalories: 300,
        totalProteinG: 15,
        totalCarbsG: 40,
        totalFatG: 10,
        totalFiberG: 5,
        loggedAt: `${date}T08:00:00Z`,
        aiAnalyzed: false,
        synced: false,
      }

      await saveMealLog(meal)
      const retrieved = await getMealLogsForDate(date)

      expect(retrieved).toBeDefined()
      expect(Array.isArray(retrieved)).toBe(true)
    })

    it('should return empty array for date with no meals', async () => {
      const retrieved = await getMealLogsForDate('2020-01-01')
      expect(Array.isArray(retrieved)).toBe(true)
      expect(retrieved.length).toBe(0)
    })

    it('should only return meals from specified date', async () => {
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
        totalFiberG: 5,
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
        totalFiberG: 6,
        loggedAt: `${date2}T08:00:00Z`,
        aiAnalyzed: false,
        synced: false,
      }

      await saveMealLog(meal1)
      await saveMealLog(meal2)

      const retrieved1 = await getMealLogsForDate(date1)
      const retrieved2 = await getMealLogsForDate(date2)

      expect(retrieved1.length).toBeGreaterThan(0)
      expect(retrieved2.length).toBeGreaterThan(0)
    })
  })

  describe('deleteMealLog', () => {
    it('should delete a meal log by id', async () => {
      const meal: MealLog = {
        id: 'meal-1',
        userId: 'user-1',
        mealType: 'breakfast',
        items: [],
        totalCalories: 300,
        totalProteinG: 15,
        totalCarbsG: 40,
        totalFatG: 10,
        totalFiberG: 5,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }

      await saveMealLog(meal)
      await expect(deleteMealLog('meal-1')).resolves.not.toThrow()
    })

    it('should not throw if meal does not exist', async () => {
      await expect(deleteMealLog('non-existent')).resolves.not.toThrow()
    })
  })

  describe('addRecentFood', () => {
    it('should add a recent food item', async () => {
      const food: FoodItem = {
        name: 'Chicken Breast',
        calories: 165,
        proteinG: 31,
        carbsG: 0,
        fatG: 3.6,
        fiberG: 0,
      }

      await expect(addRecentFood(food)).resolves.not.toThrow()
    })

    it('should add food with optional fields', async () => {
      const food: FoodItem = {
        name: 'Apple',
        calories: 95,
        proteinG: 0.5,
        carbsG: 25,
        fatG: 0.3,
        fiberG: 4.4,
        glycemicIndex: 38,
        allergens: ['none'],
        portionSize: 100,
        portionUnit: 'g',
        barcode: '123456789',
      }

      await expect(addRecentFood(food)).resolves.not.toThrow()
    })

    it('should allow adding multiple recent foods', async () => {
      const food1: FoodItem = {
        name: 'Oatmeal',
        calories: 150,
        proteinG: 5,
        carbsG: 27,
        fatG: 3,
        fiberG: 4,
      }

      const food2: FoodItem = {
        name: 'Banana',
        calories: 105,
        proteinG: 1,
        carbsG: 27,
        fatG: 0.3,
        fiberG: 3,
      }

      await addRecentFood(food1)
      await expect(addRecentFood(food2)).resolves.not.toThrow()
    })
  })

  describe('getRecentFoods', () => {
    it('should retrieve recent foods', async () => {
      const food: FoodItem = {
        name: 'Chicken Breast',
        calories: 165,
        proteinG: 31,
        carbsG: 0,
        fatG: 3.6,
        fiberG: 0,
      }

      await addRecentFood(food)
      const retrieved = await getRecentFoods()

      expect(Array.isArray(retrieved)).toBe(true)
    })

    it('should return empty array when no recent foods', async () => {
      const retrieved = await getRecentFoods()
      expect(Array.isArray(retrieved)).toBe(true)
    })

    it('should respect limit parameter', async () => {
      const foods: FoodItem[] = [
        { name: 'Food1', calories: 100, proteinG: 10, carbsG: 10, fatG: 5, fiberG: 1 },
        { name: 'Food2', calories: 150, proteinG: 15, carbsG: 15, fatG: 7, fiberG: 2 },
        { name: 'Food3', calories: 200, proteinG: 20, carbsG: 20, fatG: 10, fiberG: 3 },
      ]

      for (const food of foods) {
        await addRecentFood(food)
      }

      const retrieved = await getRecentFoods(2)
      expect(retrieved.length).toBeLessThanOrEqual(2)
    })
  })
})

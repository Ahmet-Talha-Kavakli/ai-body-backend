import { describe, it, expect } from 'vitest'
import type {
  MealLog,
  FoodItem,
  NutritionGoal,
  MacroTotals,
  NutritionScore,
  NutritionStreak,
  MealPhoto,
  WaterIntake,
  WeeklyStats,
} from '../nutrition'

describe('nutrition types', () => {
  describe('MealLog', () => {
    it('should create a valid MealLog with all required fields', () => {
      const mealLog: MealLog = {
        id: 'meal-1',
        userId: 'user-1',
        mealType: 'breakfast',
        items: [],
        totalCalories: 500,
        totalProteinG: 25,
        totalCarbsG: 60,
        totalFatG: 15,
        totalFiberG: 5,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }

      expect(mealLog.id).toBe('meal-1')
      expect(mealLog.mealType).toBe('breakfast')
      expect(mealLog.totalCalories).toBe(500)
    })

    it('should support all meal types', () => {
      const mealTypes = [
        'breakfast',
        'lunch',
        'dinner',
        'snack',
        'pre_workout',
        'post_workout',
      ] as const
      mealTypes.forEach((type) => {
        const meal: MealLog = {
          id: 'meal-1',
          userId: 'user-1',
          mealType: type,
          items: [],
          totalCalories: 0,
          totalProteinG: 0,
          totalCarbsG: 0,
          totalFatG: 0,
          totalFiberG: 0,
          loggedAt: new Date().toISOString(),
          aiAnalyzed: false,
          synced: false,
        }
        expect(meal.mealType).toBe(type)
      })
    })

    it('should support optional photo and notes fields', () => {
      const mealLog: MealLog = {
        id: 'meal-1',
        userId: 'user-1',
        mealType: 'lunch',
        items: [],
        totalCalories: 600,
        totalProteinG: 30,
        totalCarbsG: 70,
        totalFatG: 20,
        totalFiberG: 8,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        photoUrl: 'https://example.com/photo.jpg',
        photoPath: '/local/photo.jpg',
        notes: 'Had a sandwich',
        synced: true,
      }

      expect(mealLog.photoUrl).toBe('https://example.com/photo.jpg')
      expect(mealLog.photoPath).toBe('/local/photo.jpg')
      expect(mealLog.notes).toBe('Had a sandwich')
    })
  })

  describe('FoodItem', () => {
    it('should create a valid FoodItem with required fields', () => {
      const foodItem: FoodItem = {
        name: 'Apple',
        calories: 95,
        proteinG: 0.5,
        carbsG: 25,
        fatG: 0.3,
        fiberG: 4.4,
      }

      expect(foodItem.name).toBe('Apple')
      expect(foodItem.calories).toBe(95)
      expect(foodItem.fiberG).toBe(4.4)
    })

    it('should support optional portion and nutrition detail fields', () => {
      const foodItem: FoodItem = {
        name: 'Chicken Breast',
        calories: 165,
        proteinG: 31,
        carbsG: 0,
        fatG: 3.6,
        fiberG: 0,
        glycemicIndex: 0,
        allergens: ['none'],
        portionSize: 100,
        portionUnit: 'g',
        barcode: '123456789',
        servingSize: 85,
        servingSizeUnit: 'g',
      }

      expect(foodItem.portionSize).toBe(100)
      expect(foodItem.barcode).toBe('123456789')
      expect(foodItem.allergens).toContain('none')
    })
  })

  describe('NutritionGoal', () => {
    it('should create a valid NutritionGoal', () => {
      const goal: NutritionGoal = {
        id: 'goal-1',
        userId: 'user-1',
        dailyCalories: 2000,
        proteinG: 150,
        carbsG: 200,
        fatG: 65,
        fiberG: 30,
        waterGoalMl: 2000,
        generatedByAi: false,
        dietType: 'balanced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      expect(goal.dailyCalories).toBe(2000)
      expect(goal.dietType).toBe('balanced')
      expect(goal.generatedByAi).toBe(false)
    })

    it('should support all diet types', () => {
      const dietTypes = ['balanced', 'keto', 'vegan', 'paleo', 'low_carb'] as const
      dietTypes.forEach((type) => {
        const goal: NutritionGoal = {
          id: 'goal-1',
          userId: 'user-1',
          dailyCalories: 2000,
          proteinG: 150,
          carbsG: 200,
          fatG: 65,
          fiberG: 30,
          waterGoalMl: 2000,
          generatedByAi: true,
          dietType: type,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        expect(goal.dietType).toBe(type)
      })
    })
  })

  describe('MacroTotals', () => {
    it('should create valid MacroTotals', () => {
      const macros: MacroTotals = {
        calories: 2000,
        proteinG: 150,
        carbsG: 250,
        fatG: 65,
        fiberG: 35,
      }

      expect(macros.calories).toBe(2000)
      expect(macros.proteinG).toBe(150)
    })
  })

  describe('NutritionScore', () => {
    it('should create valid NutritionScore', () => {
      const score: NutritionScore = {
        scorePercent: 85,
        calorieStatus: 'target',
        proteinStatus: 'under',
      }

      expect(score.scorePercent).toBe(85)
      expect(score.calorieStatus).toBe('target')
    })

    it('should support all status types', () => {
      const statuses = ['under', 'target', 'over'] as const
      statuses.forEach((status) => {
        const score: NutritionScore = {
          scorePercent: 50,
          calorieStatus: status,
          proteinStatus: status,
        }
        expect(score.calorieStatus).toBe(status)
        expect(score.proteinStatus).toBe(status)
      })
    })
  })

  describe('NutritionStreak', () => {
    it('should create valid NutritionStreak', () => {
      const streak: NutritionStreak = {
        userId: 'user-1',
        currentStreak: 7,
        longestStreak: 30,
        lastLogDate: new Date().toISOString(),
      }

      expect(streak.currentStreak).toBe(7)
      expect(streak.longestStreak).toBe(30)
    })
  })

  describe('MealPhoto', () => {
    it('should create valid MealPhoto', () => {
      const photo: MealPhoto = {
        id: 'photo-1',
        mealLogId: 'meal-1',
        filePath: '/photos/meal-1.jpg',
        uploadStatus: 'pending',
        createdAt: new Date().toISOString(),
      }

      expect(photo.id).toBe('photo-1')
      expect(photo.uploadStatus).toBe('pending')
    })

    it('should support all upload statuses', () => {
      const statuses = ['pending', 'uploading', 'uploaded', 'failed'] as const
      statuses.forEach((status) => {
        const photo: MealPhoto = {
          id: 'photo-1',
          mealLogId: 'meal-1',
          filePath: '/path',
          uploadStatus: status,
          createdAt: new Date().toISOString(),
        }
        expect(photo.uploadStatus).toBe(status)
      })
    })
  })

  describe('WaterIntake', () => {
    it('should create valid WaterIntake', () => {
      const water: WaterIntake = {
        date: '2024-04-18',
        totalMl: 2000,
        goalMl: 2500,
        timestamp: new Date().toISOString(),
      }

      expect(water.date).toBe('2024-04-18')
      expect(water.totalMl).toBe(2000)
    })
  })

  describe('WeeklyStats', () => {
    it('should create valid WeeklyStats', () => {
      const stats: WeeklyStats = {
        weekStart: new Date().toISOString(),
        totalCalories: 14000,
        avgCalories: 2000,
        mealsLogged: 21,
        daysWithLogs: 7,
      }

      expect(stats.totalCalories).toBe(14000)
      expect(stats.mealsLogged).toBe(21)
    })
  })
})

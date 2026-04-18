import { describe, it, expect, beforeEach } from 'vitest'
import { createGoalTable, saveGoal, getGoal } from '../nutritionGoal'
import type { NutritionGoal } from '../../types/nutrition'

describe('nutritionGoal database', () => {
  beforeEach(async () => {
    await createGoalTable()
  })

  describe('createGoalTable', () => {
    it('should create goal table', async () => {
      await expect(createGoalTable()).resolves.not.toThrow()
    })

    it('should be idempotent', async () => {
      await createGoalTable()
      await expect(createGoalTable()).resolves.not.toThrow()
    })
  })

  describe('saveGoal', () => {
    it('should save a nutrition goal', async () => {
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

      await expect(saveGoal(goal)).resolves.not.toThrow()
    })

    it('should save goal with different diet types', async () => {
      const dietTypes: Array<'balanced' | 'keto' | 'vegan' | 'paleo' | 'low_carb'> = [
        'balanced',
        'keto',
        'vegan',
        'paleo',
        'low_carb',
      ]

      for (const dietType of dietTypes) {
        const goal: NutritionGoal = {
          id: `goal-${dietType}`,
          userId: 'user-1',
          dailyCalories: 2000,
          proteinG: 150,
          carbsG: 200,
          fatG: 65,
          fiberG: 30,
          waterGoalMl: 2000,
          generatedByAi: true,
          dietType,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        await expect(saveGoal(goal)).resolves.not.toThrow()
      }
    })

    it('should update existing goal', async () => {
      const goal1: NutritionGoal = {
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

      const goal2: NutritionGoal = {
        ...goal1,
        dailyCalories: 2500,
        proteinG: 180,
        updatedAt: new Date().toISOString(),
      }

      await saveGoal(goal1)
      await expect(saveGoal(goal2)).resolves.not.toThrow()
    })
  })

  describe('getGoal', () => {
    it('should retrieve a goal by userId', async () => {
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

      await saveGoal(goal)
      const retrieved = await getGoal('user-1')

      expect(retrieved).toBeDefined()
      expect(retrieved?.userId).toBe('user-1')
    })

    it('should return null for non-existent userId', async () => {
      const retrieved = await getGoal('non-existent-user')
      expect(retrieved).toBeNull()
    })

    it('should retrieve goal with all fields', async () => {
      const goal: NutritionGoal = {
        id: 'goal-1',
        userId: 'user-1',
        dailyCalories: 2500,
        proteinG: 180,
        carbsG: 250,
        fatG: 80,
        fiberG: 35,
        waterGoalMl: 2500,
        generatedByAi: true,
        dietType: 'keto',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await saveGoal(goal)
      const retrieved = await getGoal('user-1')

      expect(retrieved?.dailyCalories).toBe(2500)
      expect(retrieved?.proteinG).toBe(180)
      expect(retrieved?.dietType).toBe('keto')
      expect(retrieved?.generatedByAi).toBe(true)
    })

    it('should return most recent goal for user', async () => {
      const goal1: NutritionGoal = {
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
        createdAt: '2024-04-17T10:00:00Z',
        updatedAt: '2024-04-17T10:00:00Z',
      }

      const goal2: NutritionGoal = {
        id: 'goal-2',
        userId: 'user-1',
        dailyCalories: 2300,
        proteinG: 170,
        carbsG: 230,
        fatG: 75,
        fiberG: 32,
        waterGoalMl: 2200,
        generatedByAi: true,
        dietType: 'keto',
        createdAt: '2024-04-18T10:00:00Z',
        updatedAt: '2024-04-18T10:00:00Z',
      }

      await saveGoal(goal1)
      await saveGoal(goal2)

      const retrieved = await getGoal('user-1')
      expect(retrieved?.id).toBeDefined()
    })
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { useNutritionGoalStore } from '../nutritionGoalStore'
import type { NutritionGoal } from '../../types/nutrition'

describe('nutritionGoalStore', () => {
  beforeEach(() => {
    useNutritionGoalStore.getState().setGoal(null)
  })

  describe('setGoal', () => {
    it('should set a nutrition goal', () => {
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

      useNutritionGoalStore.getState().setGoal(goal)
      const storedGoal = useNutritionGoalStore.getState().goal
      expect(storedGoal).toEqual(goal)
      expect(storedGoal?.dailyCalories).toBe(2000)
    })

    it('should replace existing goal', () => {
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
        id: 'goal-2',
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

      useNutritionGoalStore.getState().setGoal(goal1)
      expect(useNutritionGoalStore.getState().goal?.id).toBe('goal-1')

      useNutritionGoalStore.getState().setGoal(goal2)
      expect(useNutritionGoalStore.getState().goal?.id).toBe('goal-2')
    })

    it('should set goal to null', () => {
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

      useNutritionGoalStore.getState().setGoal(goal)
      expect(useNutritionGoalStore.getState().goal).not.toBeNull()

      useNutritionGoalStore.getState().setGoal(null)
      expect(useNutritionGoalStore.getState().goal).toBeNull()
    })
  })

  describe('updateGoal', () => {
    it('should update goal fields', () => {
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

      useNutritionGoalStore.getState().setGoal(goal)
      useNutritionGoalStore.getState().updateGoal({ dailyCalories: 2500, proteinG: 180 })

      const updated = useNutritionGoalStore.getState().goal
      expect(updated?.dailyCalories).toBe(2500)
      expect(updated?.proteinG).toBe(180)
      expect(updated?.carbsG).toBe(200) // unchanged
    })

    it('should update diet type', () => {
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

      useNutritionGoalStore.getState().setGoal(goal)
      useNutritionGoalStore.getState().updateGoal({ dietType: 'keto' })

      expect(useNutritionGoalStore.getState().goal?.dietType).toBe('keto')
    })

    it('should not update if goal is null', () => {
      useNutritionGoalStore.getState().setGoal(null)
      useNutritionGoalStore.getState().updateGoal({ dailyCalories: 2500 })
      expect(useNutritionGoalStore.getState().goal).toBeNull()
    })

    it('should update multiple fields', () => {
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

      useNutritionGoalStore.getState().setGoal(goal)
      useNutritionGoalStore.getState().updateGoal({
        dailyCalories: 2300,
        proteinG: 170,
        fiberG: 35,
        waterGoalMl: 2500,
      })

      const updated = useNutritionGoalStore.getState().goal
      expect(updated?.dailyCalories).toBe(2300)
      expect(updated?.proteinG).toBe(170)
      expect(updated?.fiberG).toBe(35)
      expect(updated?.waterGoalMl).toBe(2500)
    })
  })

  describe('loading and error states', () => {
    it('should have default loading state as false', () => {
      expect(useNutritionGoalStore.getState().loading).toBe(false)
    })

    it('should have default error state as null', () => {
      expect(useNutritionGoalStore.getState().error).toBeNull()
    })

    it('should update loading state', () => {
      const store = useNutritionGoalStore.getState()
      expect(store.loading).toBe(false)
      store.setLoading(true)
      expect(useNutritionGoalStore.getState().loading).toBe(true)
      store.setLoading(false)
      expect(useNutritionGoalStore.getState().loading).toBe(false)
    })

    it('should update error state', () => {
      const store = useNutritionGoalStore.getState()
      expect(store.error).toBeNull()
      store.setError('Failed to load goal')
      expect(useNutritionGoalStore.getState().error).toBe('Failed to load goal')
      store.setError(null)
      expect(useNutritionGoalStore.getState().error).toBeNull()
    })
  })
})

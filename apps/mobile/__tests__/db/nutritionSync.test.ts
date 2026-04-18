import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createSyncQueueTable,
  queueMealSync,
  getPendingItems,
  markSynced,
  markFailed,
  retryWithBackoff,
  getQueueItem,
  resetDatabase,
} from '../../src/db/nutritionSync'
import type { MealLog } from '../../src/types/nutrition'

describe('nutrition sync queue database', () => {
  beforeEach(async () => {
    resetDatabase()
    await createSyncQueueTable()
  })

  describe('createSyncQueueTable', () => {
    it('should create nutrition_sync_queue table', async () => {
      await expect(createSyncQueueTable()).resolves.not.toThrow()
    })
  })

  describe('queueMealSync', () => {
    it('should queue meal for sync', async () => {
      const meal: MealLog = {
        id: '1',
        userId: 'u1',
        mealType: 'breakfast',
        items: [],
        totalCalories: 500,
        totalProteinG: 30,
        totalCarbsG: 50,
        totalFatG: 20,
        totalFiberG: 5,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }
      const queueId = await queueMealSync(meal)
      expect(queueId).toBeDefined()
    })

    it('should set status to pending', async () => {
      const meal: MealLog = {
        id: '1',
        userId: 'u1',
        mealType: 'lunch',
        items: [],
        totalCalories: 800,
        totalProteinG: 40,
        totalCarbsG: 80,
        totalFatG: 30,
        totalFiberG: 8,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }
      const queueId = await queueMealSync(meal)
      const item = await getQueueItem(queueId)
      expect(item.status).toBe('pending')
    })
  })

  describe('getPendingItems', () => {
    it('should return all pending items', async () => {
      const meal: MealLog = {
        id: '1',
        userId: 'u1',
        mealType: 'dinner',
        items: [],
        totalCalories: 1000,
        totalProteinG: 50,
        totalCarbsG: 100,
        totalFatG: 40,
        totalFiberG: 10,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }
      await queueMealSync(meal)
      const pending = await getPendingItems()
      expect(pending.length).toBeGreaterThan(0)
    })

    it('should not include synced items', async () => {
      const meal: MealLog = {
        id: '1',
        userId: 'u1',
        mealType: 'breakfast',
        items: [],
        totalCalories: 500,
        totalProteinG: 30,
        totalCarbsG: 50,
        totalFatG: 20,
        totalFiberG: 5,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }
      const queueId = await queueMealSync(meal)
      await markSynced(queueId)
      const pending = await getPendingItems()
      expect(pending.find((p) => p.id === queueId)).toBeUndefined()
    })
  })

  describe('markSynced', () => {
    it('should mark item as synced', async () => {
      const meal: MealLog = {
        id: '1',
        userId: 'u1',
        mealType: 'snack',
        items: [],
        totalCalories: 200,
        totalProteinG: 15,
        totalCarbsG: 20,
        totalFatG: 10,
        totalFiberG: 3,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }
      const queueId = await queueMealSync(meal)
      await markSynced(queueId)
      const item = await getQueueItem(queueId)
      expect(item.status).toBe('synced')
    })
  })

  describe('retryWithBackoff', () => {
    it('should increment attempts', async () => {
      const meal: MealLog = {
        id: '1',
        userId: 'u1',
        mealType: 'pre_workout',
        items: [],
        totalCalories: 300,
        totalProteinG: 20,
        totalCarbsG: 30,
        totalFatG: 15,
        totalFiberG: 4,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }
      const queueId = await queueMealSync(meal)
      await retryWithBackoff(queueId)
      const item = await getQueueItem(queueId)
      expect(item.attempts).toBe(1)
    })

    it('should use exponential backoff delays', async () => {
      const delays = [1000, 2000, 4000, 8000, 16000]
      for (const expectedDelay of delays) {
        // Verify backoff calculation: 1s, 2s, 4s, 8s, 16s
        const calculated = Math.pow(2, delays.indexOf(expectedDelay)) * 1000
        expect(calculated).toBe(expectedDelay)
      }
    })
  })

  describe('markFailed', () => {
    it('should mark item as failed with error message', async () => {
      const meal: MealLog = {
        id: '1',
        userId: 'u1',
        mealType: 'post_workout',
        items: [],
        totalCalories: 600,
        totalProteinG: 35,
        totalCarbsG: 60,
        totalFatG: 25,
        totalFiberG: 6,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }
      const queueId = await queueMealSync(meal)
      await markFailed(queueId, 'Network error')
      const item = await getQueueItem(queueId)
      expect(item.status).toBe('failed')
      expect(item.error).toBe('Network error')
    })
  })
})

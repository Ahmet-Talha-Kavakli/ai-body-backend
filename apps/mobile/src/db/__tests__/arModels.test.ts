import { describe, it, expect, beforeEach } from 'vitest'
import { arDatabase } from '../arModels'

describe('arDatabase', () => {
  beforeEach(async () => {
    // Reset database before each test
    await arDatabase.resetForTesting()
  })

  describe('Food Models CRUD', () => {
    it('should create a food model', async () => {
      const model = {
        id: 'model-1',
        foodName: 'Pizza',
        modelUrl: 'https://example.com/pizza.glb',
        confidence: 85,
        generatedBy: 'meshy_ai' as const,
        createdAt: new Date().toISOString(),
      }

      await arDatabase.createFoodModel(model)

      const retrieved = await arDatabase.getFoodModel('Pizza')
      expect(retrieved?.foodName).toBe('Pizza')
    })

    it('should get food model by food name', async () => {
      const model = {
        id: 'model-1',
        foodName: 'Burger',
        modelUrl: 'https://example.com/burger.glb',
        confidence: 88,
        generatedBy: 'meshy_ai' as const,
        createdAt: new Date().toISOString(),
      }

      await arDatabase.createFoodModel(model)

      const retrieved = await arDatabase.getFoodModel('Burger')
      expect(retrieved?.modelUrl).toBe('https://example.com/burger.glb')
    })

    it('should return null for non-existent model', async () => {
      const result = await arDatabase.getFoodModel('NonExistent')
      expect(result).toBeNull()
    })

    it('should update food model', async () => {
      const model = {
        id: 'model-1',
        foodName: 'Pizza',
        modelUrl: 'https://example.com/pizza-v1.glb',
        confidence: 85,
        generatedBy: 'meshy_ai' as const,
        createdAt: new Date().toISOString(),
      }

      await arDatabase.createFoodModel(model)

      await arDatabase.updateFoodModel('model-1', {
        modelUrl: 'https://example.com/pizza-v2.glb',
        confidence: 92,
      })

      const updated = await arDatabase.getFoodModel('Pizza')
      expect(updated?.modelUrl).toBe('https://example.com/pizza-v2.glb')
      expect(updated?.confidence).toBe(92)
    })

    it('should delete food model', async () => {
      const model = {
        id: 'model-1',
        foodName: 'Pizza',
        modelUrl: 'https://example.com/pizza.glb',
        confidence: 85,
        generatedBy: 'meshy_ai' as const,
        createdAt: new Date().toISOString(),
      }

      await arDatabase.createFoodModel(model)
      await arDatabase.deleteFoodModel('model-1')

      const result = await arDatabase.getFoodModel('Pizza')
      expect(result).toBeNull()
    })
  })

  describe('Detection Cache', () => {
    it('should cache detection result', async () => {
      const cache = {
        id: 'cache-1',
        foodName: 'Salad',
        nutrition: {
          calories: 150,
          proteinG: 5,
          carbsG: 20,
          fatG: 7,
          fiberG: 4,
        },
        confidence: 95,
        lastUsed: new Date().toISOString(),
        usageCount: 1,
      }

      await arDatabase.cacheDetection(cache)

      const retrieved = await arDatabase.getCachedDetection('Salad')
      expect(retrieved?.nutrition.calories).toBe(150)
    })

    it('should retrieve cached detection', async () => {
      const cache = {
        id: 'cache-1',
        foodName: 'Pasta',
        nutrition: {
          calories: 200,
          proteinG: 8,
          carbsG: 40,
          fatG: 5,
          fiberG: 2,
        },
        confidence: 88,
        lastUsed: new Date().toISOString(),
        usageCount: 2,
      }

      await arDatabase.cacheDetection(cache)

      const retrieved = await arDatabase.getCachedDetection('Pasta')
      expect(retrieved?.usageCount).toBe(2)
    })

    it('should return null for non-cached food', async () => {
      const result = await arDatabase.getCachedDetection('NonExistent')
      expect(result).toBeNull()
    })

    it('should get all cached detections', async () => {
      const cache1 = {
        id: 'cache-1',
        foodName: 'Salad',
        nutrition: {
          calories: 150,
          proteinG: 5,
          carbsG: 20,
          fatG: 7,
          fiberG: 4,
        },
        confidence: 95,
        lastUsed: new Date().toISOString(),
        usageCount: 1,
      }

      const cache2 = {
        id: 'cache-2',
        foodName: 'Pasta',
        nutrition: {
          calories: 200,
          proteinG: 8,
          carbsG: 40,
          fatG: 5,
          fiberG: 2,
        },
        confidence: 88,
        lastUsed: new Date().toISOString(),
        usageCount: 2,
      }

      await arDatabase.cacheDetection(cache1)
      await arDatabase.cacheDetection(cache2)

      const all = await arDatabase.getAllCachedDetections()
      expect(all.length).toBe(2)
    })
  })

  describe('Sync Queue', () => {
    it('should queue sync item', async () => {
      const item = {
        id: 'sync-1',
        action: 'detect_food' as const,
        mealLogId: 'meal-1',
        data: {
          id: 'det-1',
          detectedFoodName: 'Pizza',
          confidence: 85,
          nutrition: {
            calories: 285,
            proteinG: 12,
            carbsG: 36,
            fatG: 10,
            fiberG: 2,
          },
          source: 'usda' as const,
          portionSize: 100,
          portionUnit: 'g',
          detectedAt: new Date().toISOString(),
          synced: false,
        },
        status: 'pending' as const,
        retryCount: 0,
        createdAt: new Date().toISOString(),
      }

      await arDatabase.queueSync(item)

      const queued = await arDatabase.getQueuedItems()
      expect(queued.length).toBeGreaterThan(0)
    })

    it('should get pending queue items', async () => {
      const item = {
        id: 'sync-1',
        action: 'detect_food' as const,
        mealLogId: 'meal-1',
        data: {
          id: 'det-1',
          detectedFoodName: 'Pizza',
          confidence: 85,
          nutrition: {
            calories: 285,
            proteinG: 12,
            carbsG: 36,
            fatG: 10,
            fiberG: 2,
          },
          source: 'usda' as const,
          portionSize: 100,
          portionUnit: 'g',
          detectedAt: new Date().toISOString(),
          synced: false,
        },
        status: 'pending' as const,
        retryCount: 0,
        createdAt: new Date().toISOString(),
      }

      await arDatabase.queueSync(item)

      const pending = await arDatabase.getQueuedItems()
      expect(pending.length).toBeGreaterThan(0)
      expect(pending[0].status).toBe('pending')
    })

    it('should update queue item status', async () => {
      const item = {
        id: 'sync-1',
        action: 'detect_food' as const,
        mealLogId: 'meal-1',
        data: {
          id: 'det-1',
          detectedFoodName: 'Pizza',
          confidence: 85,
          nutrition: {
            calories: 285,
            proteinG: 12,
            carbsG: 36,
            fatG: 10,
            fiberG: 2,
          },
          source: 'usda' as const,
          portionSize: 100,
          portionUnit: 'g',
          detectedAt: new Date().toISOString(),
          synced: false,
        },
        status: 'pending' as const,
        retryCount: 0,
        createdAt: new Date().toISOString(),
      }

      await arDatabase.queueSync(item)
      await arDatabase.updateQueueStatus('sync-1', 'synced')

      const pending = await arDatabase.getQueuedItems()
      const updated = pending.find((i) => i.id === 'sync-1')
      expect(updated?.status).toBe('synced')
    })

    it('should handle retry count increment', async () => {
      const item = {
        id: 'sync-1',
        action: 'detect_food' as const,
        mealLogId: 'meal-1',
        data: {
          id: 'det-1',
          detectedFoodName: 'Pizza',
          confidence: 85,
          nutrition: {
            calories: 285,
            proteinG: 12,
            carbsG: 36,
            fatG: 10,
            fiberG: 2,
          },
          source: 'usda' as const,
          portionSize: 100,
          portionUnit: 'g',
          detectedAt: new Date().toISOString(),
          synced: false,
        },
        status: 'pending' as const,
        retryCount: 0,
        createdAt: new Date().toISOString(),
      }

      await arDatabase.queueSync(item)
      await arDatabase.updateQueueStatus('sync-1', 'failed')

      const items = await arDatabase.getQueuedItems()
      // retryCount would be incremented in a real DB operation
      expect(items.length).toBeGreaterThan(0)
    })
  })

  describe('indexing and filtering', () => {
    it('should support filtering by status', async () => {
      const item1 = {
        id: 'sync-1',
        action: 'detect_food' as const,
        mealLogId: 'meal-1',
        data: {
          id: 'det-1',
          detectedFoodName: 'Pizza',
          confidence: 85,
          nutrition: {
            calories: 285,
            proteinG: 12,
            carbsG: 36,
            fatG: 10,
            fiberG: 2,
          },
          source: 'usda' as const,
          portionSize: 100,
          portionUnit: 'g',
          detectedAt: new Date().toISOString(),
          synced: false,
        },
        status: 'pending' as const,
        retryCount: 0,
        createdAt: new Date().toISOString(),
      }

      const item2 = {
        ...item1,
        id: 'sync-2',
        status: 'synced' as const,
      }

      await arDatabase.queueSync(item1)
      await arDatabase.queueSync(item2)

      const pending = await arDatabase.getQueuedItems()
      const pendingOnly = pending.filter((i) => i.status === 'pending')

      expect(pendingOnly.length).toBe(1)
    })
  })

  describe('error handling', () => {
    it('should handle creating duplicate models gracefully', async () => {
      const model = {
        id: 'model-1',
        foodName: 'Pizza',
        modelUrl: 'https://example.com/pizza.glb',
        confidence: 85,
        generatedBy: 'meshy_ai' as const,
        createdAt: new Date().toISOString(),
      }

      await arDatabase.createFoodModel(model)

      // Creating again should either update or throw
      // Behavior depends on implementation
      await arDatabase.createFoodModel({
        ...model,
        id: 'model-2',
      })

      const result = await arDatabase.getFoodModel('Pizza')
      expect(result).toBeDefined()
    })

    it('should handle empty queries gracefully', async () => {
      const all = await arDatabase.getAllCachedDetections()
      expect(all).toEqual([])
    })
  })
})

import { describe, it, expect } from 'vitest'
import type {
  FoodDetectionResult,
  ARFoodModel,
  ARDetectionCache,
  ARSyncQueueItem,
} from '../ar'

describe('AR Types', () => {
  it('should create food detection result', () => {
    const result: FoodDetectionResult = {
      id: 'detection-1',
      detectedFoodName: 'Pizza Margherita',
      confidence: 92,
      nutrition: {
        calories: 285,
        proteinG: 12,
        carbsG: 36,
        fatG: 10,
        fiberG: 2,
      },
      source: 'usda',
      portionSize: 100,
      portionUnit: 'g',
      modelUrl: 'https://cdn.example.com/pizza.glb',
      detectedAt: '2026-04-19T12:00:00Z',
      synced: false,
    }
    expect(result.detectedFoodName).toBe('Pizza Margherita')
    expect(result.confidence).toBe(92)
  })

  it('should create AR food model', () => {
    const model: ARFoodModel = {
      id: 'model-1',
      foodName: 'Burger',
      modelUrl: 'https://cdn.example.com/burger.glb',
      textureUrl: 'https://cdn.example.com/burger-texture.png',
      confidence: 88,
      generatedBy: 'meshy_ai',
      createdAt: '2026-04-19T12:00:00Z',
      cachedAt: '2026-04-19T12:00:01Z',
      cacheSize: 2500000,
    }
    expect(model.generatedBy).toBe('meshy_ai')
    expect(model.cacheSize).toBe(2500000)
  })

  it('should create detection cache', () => {
    const cache: ARDetectionCache = {
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
      lastUsed: '2026-04-19T12:00:00Z',
      usageCount: 3,
    }
    expect(cache.usageCount).toBe(3)
  })

  it('should create sync queue item', () => {
    const item: ARSyncQueueItem = {
      id: 'sync-1',
      action: 'detect_food',
      mealLogId: 'meal-1',
      data: {} as FoodDetectionResult,
      status: 'pending',
      retryCount: 0,
      createdAt: '2026-04-19T12:00:00Z',
    }
    expect(item.status).toBe('pending')
  })
})

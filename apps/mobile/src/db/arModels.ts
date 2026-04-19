import type {
  ARFoodModel,
  ARDetectionCache,
  ARSyncQueueItem,
  FoodDetectionResult,
} from '../types/ar'

// In-memory storage for testing/demo
const foodModelsStore = new Map<string, ARFoodModel>()
const detectionCacheStore = new Map<string, ARDetectionCache>()
const syncQueueStore = new Map<string, ARSyncQueueItem>()

export const arDatabase = {
  // Food Models CRUD
  async createFoodModel(model: ARFoodModel): Promise<void> {
    foodModelsStore.set(model.id, model)
  },

  async getFoodModel(foodName: string): Promise<ARFoodModel | null> {
    // Search by food name (case-insensitive)
    for (const model of foodModelsStore.values()) {
      if (model.foodName.toLowerCase() === foodName.toLowerCase()) {
        return model
      }
    }
    return null
  },

  async updateFoodModel(
    id: string,
    updates: Partial<ARFoodModel>
  ): Promise<void> {
    const model = foodModelsStore.get(id)
    if (model) {
      foodModelsStore.set(id, { ...model, ...updates })
    }
  },

  async deleteFoodModel(id: string): Promise<void> {
    foodModelsStore.delete(id)
  },

  // Detection Cache
  async cacheDetection(cache: ARDetectionCache): Promise<void> {
    const key = cache.foodName.toLowerCase()
    detectionCacheStore.set(key, cache)
  },

  async getCachedDetection(foodName: string): Promise<ARDetectionCache | null> {
    const key = foodName.toLowerCase()
    return detectionCacheStore.get(key) || null
  },

  async getAllCachedDetections(): Promise<ARDetectionCache[]> {
    return Array.from(detectionCacheStore.values())
  },

  // Sync Queue
  async queueSync(item: ARSyncQueueItem): Promise<void> {
    syncQueueStore.set(item.id, item)
  },

  async getQueuedItems(): Promise<ARSyncQueueItem[]> {
    return Array.from(syncQueueStore.values())
  },

  async getQueuedItemsByStatus(
    status: ARSyncQueueItem['status']
  ): Promise<ARSyncQueueItem[]> {
    return Array.from(syncQueueStore.values()).filter((item) => item.status === status)
  },

  async updateQueueStatus(
    id: string,
    status: ARSyncQueueItem['status']
  ): Promise<void> {
    const item = syncQueueStore.get(id)
    if (item) {
      // Increment retry count on failure
      if (status === 'failed') {
        item.retryCount += 1
      }
      item.status = status
      syncQueueStore.set(id, item)
    }
  },

  async deleteQueueItem(id: string): Promise<void> {
    syncQueueStore.delete(id)
  },

  // Testing utilities
  async resetForTesting(): Promise<void> {
    foodModelsStore.clear()
    detectionCacheStore.clear()
    syncQueueStore.clear()
  },
}

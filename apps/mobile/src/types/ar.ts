export interface FoodDetectionResult {
  id: string
  detectedFoodName: string
  confidence: number // 0-100
  nutrition: {
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG: number
    glycemicIndex?: number
  }
  source: 'usda' | 'gpt4_vision' | 'user_correction'
  portionSize: number
  portionUnit: string // 'g', 'ml', 'oz', etc.
  modelUrl?: string
  photoPath?: string
  detectedAt: string // ISO timestamp
  synced: boolean
}

export interface ARFoodModel {
  id: string
  foodName: string
  modelUrl: string // S3/CDN URL to .glb or .gltf
  textureUrl?: string
  confidence: number
  generatedBy: 'meshy_ai' | 'user_upload'
  createdAt: string
  cachedAt?: string
  cacheSize?: number // bytes
}

export interface ARDetectionCache {
  id: string
  foodName: string
  nutrition: {
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG: number
    glycemicIndex?: number
  }
  modelUrl?: string
  confidence: number
  lastUsed: string
  usageCount: number
}

export interface ARSyncQueueItem {
  id: string
  action: 'detect_food' | 'create_meal_log' | 'correction_submitted'
  mealLogId: string
  data: FoodDetectionResult
  status: 'pending' | 'synced' | 'failed'
  retryCount: number
  createdAt: string
}

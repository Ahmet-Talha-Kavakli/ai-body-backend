import type { ARFoodModel } from '../types/ar'

const modelCache = new Map<string, ARFoodModel>()
const usageCounter = new Map<string, number>()

function generateId(): string {
  return `model-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function normalizeKey(foodName: string): string {
  return foodName.toLowerCase().trim()
}

export const arModelGenerationService = {
  async generateModel(foodName: string): Promise<ARFoodModel> {
    // In production, this would call Meshy.ai API
    // For now, return a mock model with proper structure

    const model: ARFoodModel = {
      id: generateId(),
      foodName,
      modelUrl: `https://models.example.com/${normalizeKey(foodName)}.glb`,
      textureUrl: `https://textures.example.com/${normalizeKey(foodName)}-texture.png`,
      confidence: Math.floor(Math.random() * 20) + 80, // 80-100
      generatedBy: 'meshy_ai',
      createdAt: new Date().toISOString(),
    }

    return model
  },

  async getOrGenerateModel(foodName: string): Promise<ARFoodModel> {
    const key = normalizeKey(foodName)

    // Check cache
    if (modelCache.has(key)) {
      const cached = modelCache.get(key)!
      // Update usage count
      usageCounter.set(key, (usageCounter.get(key) || 0) + 1)
      return cached
    }

    // Generate new model
    const model = await this.generateModel(foodName)

    // Cache it
    this.cacheModel(model)

    return model
  },

  cacheModel(model: ARFoodModel): void {
    const key = normalizeKey(model.foodName)
    modelCache.set(key, model)
    usageCounter.set(key, (usageCounter.get(key) || 0) + 1)
  },

  getTopCachedModels(limit: number = 100): ARFoodModel[] {
    // Sort by usage count descending
    const sorted = Array.from(modelCache.entries())
      .sort((a, b) => {
        const countA = usageCounter.get(a[0]) || 0
        const countB = usageCounter.get(b[0]) || 0
        return countB - countA
      })
      .slice(0, limit)
      .map(([_, model]) => model)

    return sorted
  },

  _resetCache(): void {
    modelCache.clear()
    usageCounter.clear()
  },
}

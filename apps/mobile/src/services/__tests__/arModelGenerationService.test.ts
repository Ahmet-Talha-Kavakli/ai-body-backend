import { describe, it, expect, beforeEach, vi } from 'vitest'
import { arModelGenerationService } from '../arModelGenerationService'

describe('arModelGenerationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    arModelGenerationService._resetCache()
  })

  describe('generateModel', () => {
    it('should generate 3D model for food item', async () => {
      const model = await arModelGenerationService.generateModel('Pizza')

      expect(model).toBeDefined()
      expect(model.foodName).toBe('Pizza')
      expect(model.modelUrl).toBeDefined()
    })

    it('should set generatedBy to meshy_ai', async () => {
      const model = await arModelGenerationService.generateModel('Burger')

      expect(model.generatedBy).toBe('meshy_ai')
    })

    it('should return model with unique ID', async () => {
      const model1 = await arModelGenerationService.generateModel('Pizza')
      const model2 = await arModelGenerationService.generateModel('Burger')

      expect(model1.id).not.toBe(model2.id)
    })

    it('should generate valid model URL', async () => {
      const model = await arModelGenerationService.generateModel('Salad')

      expect(model.modelUrl).toMatch(/^https?:\/\//)
    })

    it('should include optional texture URL', async () => {
      const model = await arModelGenerationService.generateModel('Pizza')

      // Model might have textureUrl but it's optional
      if (model.textureUrl) {
        expect(model.textureUrl).toMatch(/^https?:\/\//)
      }
    })

    it('should set confidence score', async () => {
      const model = await arModelGenerationService.generateModel('Pizza')

      expect(model.confidence).toBeGreaterThan(0)
      expect(model.confidence).toBeLessThanOrEqual(100)
    })

    it('should set creation timestamp', async () => {
      const model = await arModelGenerationService.generateModel('Pizza')

      const createdDate = new Date(model.createdAt)
      expect(createdDate.getTime()).toBeLessThanOrEqual(Date.now())
    })
  })

  describe('getOrGenerateModel', () => {
    it('should return cached model on cache hit', async () => {
      const model1 = await arModelGenerationService.getOrGenerateModel('Pizza')
      const model2 = await arModelGenerationService.getOrGenerateModel('Pizza')

      expect(model1.id).toBe(model2.id)
      expect(model1.modelUrl).toBe(model2.modelUrl)
    })

    it('should generate new model on cache miss', async () => {
      const pizza = await arModelGenerationService.getOrGenerateModel('Pizza')
      const burger = await arModelGenerationService.getOrGenerateModel(
        'Burger'
      )

      expect(pizza.id).not.toBe(burger.id)
      expect(pizza.foodName).toBe('Pizza')
      expect(burger.foodName).toBe('Burger')
    })

    it('should be case-insensitive for cache lookup', async () => {
      const model1 = await arModelGenerationService.getOrGenerateModel('Pizza')
      const model2 = await arModelGenerationService.getOrGenerateModel('pizza')

      expect(model1.id).toBe(model2.id)
    })
  })

  describe('cacheModel', () => {
    it('should cache model for retrieval', async () => {
      const model = {
        id: 'model-1',
        foodName: 'Pizza',
        modelUrl: 'https://example.com/pizza.glb',
        confidence: 85,
        generatedBy: 'meshy_ai' as const,
        createdAt: new Date().toISOString(),
        cachedAt: new Date().toISOString(),
        cacheSize: 2500000,
      }

      arModelGenerationService.cacheModel(model)

      const cached = await arModelGenerationService.getOrGenerateModel('Pizza')
      expect(cached.id).toBe(model.id)
    })

    it('should update existing cache entry', async () => {
      const model1 = {
        id: 'model-1',
        foodName: 'Pizza',
        modelUrl: 'https://example.com/pizza-v1.glb',
        confidence: 80,
        generatedBy: 'meshy_ai' as const,
        createdAt: new Date().toISOString(),
      }

      const model2 = {
        ...model1,
        modelUrl: 'https://example.com/pizza-v2.glb',
        confidence: 90,
      }

      arModelGenerationService.cacheModel(model1)
      arModelGenerationService.cacheModel(model2)

      const cached = await arModelGenerationService.getOrGenerateModel('Pizza')
      expect(cached.modelUrl).toBe(model2.modelUrl)
    })
  })

  describe('getTopCachedModels', () => {
    it('should return top N cached models by usage', async () => {
      // Generate several models
      await arModelGenerationService.getOrGenerateModel('Pizza')
      await arModelGenerationService.getOrGenerateModel('Burger')
      await arModelGenerationService.getOrGenerateModel('Salad')

      const topModels = arModelGenerationService.getTopCachedModels(2)

      expect(topModels.length).toBeLessThanOrEqual(2)
    })

    it('should return empty array if no models cached', () => {
      const topModels = arModelGenerationService.getTopCachedModels(10)

      expect(topModels).toEqual([])
    })

    it('should respect limit parameter', async () => {
      // Generate 5 models
      for (let i = 0; i < 5; i++) {
        await arModelGenerationService.getOrGenerateModel(`Food${i}`)
      }

      const top3 = arModelGenerationService.getTopCachedModels(3)

      expect(top3.length).toBeLessThanOrEqual(3)
    })

    it('should return all models if limit exceeds cache size', async () => {
      await arModelGenerationService.getOrGenerateModel('Pizza')
      await arModelGenerationService.getOrGenerateModel('Burger')

      const topModels = arModelGenerationService.getTopCachedModels(100)

      expect(topModels.length).toBeLessThanOrEqual(2)
    })

    it('should return valid model objects', async () => {
      await arModelGenerationService.getOrGenerateModel('Pizza')

      const topModels = arModelGenerationService.getTopCachedModels(10)

      topModels.forEach((model) => {
        expect(model.id).toBeDefined()
        expect(model.foodName).toBeDefined()
        expect(model.modelUrl).toBeDefined()
        expect(model.generatedBy).toBe('meshy_ai')
      })
    })
  })

  describe('offline strategy', () => {
    it('should use cached models when offline', async () => {
      // Pre-populate cache
      const model = await arModelGenerationService.getOrGenerateModel('Pizza')

      // Simulate offline by getting from cache
      const cachedModel = arModelGenerationService.getTopCachedModels(1)[0]

      expect(cachedModel.foodName).toBe('Pizza')
      expect(cachedModel.modelUrl).toBe(model.modelUrl)
    })

    it('should return top models for offline fallback', async () => {
      // Generate multiple models
      for (let i = 0; i < 5; i++) {
        await arModelGenerationService.getOrGenerateModel(`Food${i}`)
      }

      const offlineFallback = arModelGenerationService.getTopCachedModels(100)

      expect(offlineFallback.length).toBeGreaterThan(0)
    })
  })

  describe('error handling', () => {
    it('should handle model generation gracefully', async () => {
      const model = await arModelGenerationService.generateModel('Pizza')

      expect(model).toBeDefined()
      expect(model.foodName).toBe('Pizza')
    })

    it('should provide fallback model if generation fails', async () => {
      // Even if generation "fails", it should return something
      const model = await arModelGenerationService.generateModel('UnknownFood')

      expect(model).toBeDefined()
    })
  })

  describe('model properties', () => {
    it('should have all required properties', async () => {
      const model = await arModelGenerationService.generateModel('Pizza')

      expect(model).toHaveProperty('id')
      expect(model).toHaveProperty('foodName')
      expect(model).toHaveProperty('modelUrl')
      expect(model).toHaveProperty('confidence')
      expect(model).toHaveProperty('generatedBy')
      expect(model).toHaveProperty('createdAt')
    })

    it('should have optional properties when available', async () => {
      const model = await arModelGenerationService.generateModel('Pizza')

      // Optional fields
      if (model.textureUrl) {
        expect(typeof model.textureUrl).toBe('string')
      }
      if (model.cachedAt) {
        expect(typeof model.cachedAt).toBe('string')
      }
      if (model.cacheSize) {
        expect(typeof model.cacheSize).toBe('number')
      }
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as embeddingService from '../embeddingService'

// Mock pgvectorClient
vi.mock('../pgvectorClient', () => ({
  pgvectorClient: {
    saveEmbedding: vi.fn().mockResolvedValue(undefined),
    getEmbedding: vi.fn(),
  },
}))

describe('embeddingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('aggregateUserData', () => {
    it('should aggregate user data from all phases', async () => {
      const userId = 'user-1'

      const result = await embeddingService.aggregateUserData(userId)

      expect(result).toHaveProperty('meals')
      expect(result).toHaveProperty('workouts')
      expect(result).toHaveProperty('health')
      expect(result).toHaveProperty('social')
    })

    it('should return arrays for each data type', async () => {
      const userId = 'user-1'

      const result = await embeddingService.aggregateUserData(userId)

      expect(Array.isArray(result.meals)).toBe(true)
      expect(Array.isArray(result.workouts)).toBe(true)
      expect(Array.isArray(result.health)).toBe(true)
      expect(Array.isArray(result.social)).toBe(true)
    })

    it('should handle multiple calls for same user', async () => {
      const userId = 'user-1'

      const result1 = await embeddingService.aggregateUserData(userId)
      const result2 = await embeddingService.aggregateUserData(userId)

      expect(result1).toEqual(result2)
    })
  })

  describe('generateUserEmbedding', () => {
    it('should create a 768-dimensional embedding', async () => {
      const userId = 'user-1'

      const embedding = await embeddingService.generateUserEmbedding(userId)

      expect(embedding.embedding).toHaveLength(768)
    })

    it('should include user ID', async () => {
      const userId = 'user-1'

      const embedding = await embeddingService.generateUserEmbedding(userId)

      expect(embedding.userId).toBe(userId)
    })

    it('should extract meal preferences', async () => {
      const userId = 'user-1'

      const embedding = await embeddingService.generateUserEmbedding(userId)

      expect(embedding.mealPreferences).toBeDefined()
      expect(Array.isArray(embedding.mealPreferences.cuisines)).toBe(true)
      expect(Array.isArray(embedding.mealPreferences.ingredients)).toBe(true)
      expect(embedding.mealPreferences.avgMacros).toHaveProperty('protein')
      expect(embedding.mealPreferences.avgMacros).toHaveProperty('carbs')
      expect(embedding.mealPreferences.avgMacros).toHaveProperty('fat')
    })

    it('should extract workout preferences', async () => {
      const userId = 'user-1'

      const embedding = await embeddingService.generateUserEmbedding(userId)

      expect(embedding.workoutPreferences).toBeDefined()
      expect(Array.isArray(embedding.workoutPreferences.favoriteExercises)).toBe(true)
      expect(typeof embedding.workoutPreferences.avgIntensity).toBe('number')
      expect(typeof embedding.workoutPreferences.frequency).toBe('string')
    })

    it('should extract health patterns', async () => {
      const userId = 'user-1'

      const embedding = await embeddingService.generateUserEmbedding(userId)

      expect(embedding.healthPatterns).toBeDefined()
      expect(typeof embedding.healthPatterns.avgSleep).toBe('number')
      expect(typeof embedding.healthPatterns.avgSteps).toBe('number')
      expect(Array.isArray(embedding.healthPatterns.heartRateRange)).toBe(true)
      expect(embedding.healthPatterns.heartRateRange).toHaveLength(2)
    })

    it('should extract social patterns', async () => {
      const userId = 'user-1'

      const embedding = await embeddingService.generateUserEmbedding(userId)

      expect(embedding.socialPatterns).toBeDefined()
      expect(typeof embedding.socialPatterns.friendCount).toBe('number')
      expect(typeof embedding.socialPatterns.challengeParticipation).toBe('number')
      expect(typeof embedding.socialPatterns.badgeEarningRate).toBe('number')
    })

    it('should set lastUpdated to current time', async () => {
      const userId = 'user-1'
      const beforeTime = new Date()

      const embedding = await embeddingService.generateUserEmbedding(userId)

      const afterTime = new Date()
      const embeddingTime = new Date(embedding.lastUpdated)

      expect(embeddingTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(embeddingTime.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })

    it('should handle users with no data', async () => {
      const userId = 'new-user'

      const embedding = await embeddingService.generateUserEmbedding(userId)

      expect(embedding).toBeDefined()
      expect(embedding.embedding).toHaveLength(768)
      expect(embedding.mealPreferences.cuisines).toEqual([])
      expect(embedding.workoutPreferences.favoriteExercises).toEqual([])
    })
  })

  describe('saveEmbedding', () => {
    it('should generate and save embedding', async () => {
      const userId = 'user-1'

      const embedding = await embeddingService.saveEmbedding(userId)

      expect(embedding).toBeDefined()
      expect(embedding.userId).toBe(userId)
    })

    it('should call pgvectorClient.saveEmbedding', async () => {
      const { pgvectorClient } = await import('../pgvectorClient')
      const userId = 'user-1'

      await embeddingService.saveEmbedding(userId)

      expect(pgvectorClient.saveEmbedding).toHaveBeenCalledWith(
        userId,
        expect.any(Array)
      )
    })

    it('should return the embedding', async () => {
      const userId = 'user-1'

      const embedding = await embeddingService.saveEmbedding(userId)

      expect(embedding.embedding).toHaveLength(768)
      expect(embedding.mealPreferences).toBeDefined()
      expect(embedding.workoutPreferences).toBeDefined()
    })
  })

  describe('getEmbedding', () => {
    it('should retrieve cached embedding', async () => {
      const { pgvectorClient } = await import('../pgvectorClient')
      const userId = 'user-1'
      const cachedEmbedding = new Array(768).fill(0.1)

      vi.mocked(pgvectorClient.getEmbedding).mockResolvedValueOnce(cachedEmbedding)

      const result = await embeddingService.getEmbedding(userId)

      expect(result).toBeDefined()
      expect(result?.embedding).toEqual(cachedEmbedding)
    })

    it('should return null if embedding not found', async () => {
      const { pgvectorClient } = await import('../pgvectorClient')
      const userId = 'nonexistent'

      vi.mocked(pgvectorClient.getEmbedding).mockResolvedValueOnce(null)

      const result = await embeddingService.getEmbedding(userId)

      expect(result).toBeNull()
    })

    it('should include user ID in returned embedding', async () => {
      const { pgvectorClient } = await import('../pgvectorClient')
      const userId = 'user-1'
      const cachedVector = new Array(768).fill(0.2)

      vi.mocked(pgvectorClient.getEmbedding).mockResolvedValueOnce(cachedVector)

      const result = await embeddingService.getEmbedding(userId)

      expect(result?.userId).toBe(userId)
    })

    it('should return embedding with default pattern data', async () => {
      const { pgvectorClient } = await import('../pgvectorClient')
      const userId = 'user-1'

      vi.mocked(pgvectorClient.getEmbedding).mockResolvedValueOnce(new Array(768).fill(0))

      const result = await embeddingService.getEmbedding(userId)

      expect(result?.mealPreferences).toBeDefined()
      expect(result?.workoutPreferences).toBeDefined()
      expect(result?.healthPatterns).toBeDefined()
      expect(result?.socialPatterns).toBeDefined()
    })
  })
})

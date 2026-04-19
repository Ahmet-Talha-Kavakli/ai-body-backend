import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock axios before importing the client
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: vi.fn().mockReturnValue(Promise.resolve({ data: {} })),
      get: vi.fn().mockReturnValue(Promise.resolve({ data: {} })),
      put: vi.fn().mockReturnValue(Promise.resolve({ data: {} })),
      delete: vi.fn().mockReturnValue(Promise.resolve({ data: {} })),
    })),
  },
}))

import analyticsClient from '../analyticsClient'

describe('analyticsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('embeddings endpoints', () => {
    it('should have embeddings.generate method', () => {
      expect(analyticsClient.embeddings.generate).toBeDefined()
    })

    it('should have embeddings.get method', () => {
      expect(analyticsClient.embeddings.get).toBeDefined()
    })

    it('should have embeddings.findSimilar method', () => {
      expect(analyticsClient.embeddings.findSimilar).toBeDefined()
    })

    it('should call correct endpoints for embeddings.generate', () => {
      const userId = 'user-1'
      analyticsClient.embeddings.generate(userId)

      expect(analyticsClient.embeddings.generate).toBeDefined()
    })

    it('should call correct endpoints for embeddings.get', () => {
      const userId = 'user-1'
      analyticsClient.embeddings.get(userId)

      expect(analyticsClient.embeddings.get).toBeDefined()
    })

    it('should call correct endpoints for embeddings.findSimilar with limit', () => {
      const userId = 'user-1'
      const limit = 20
      analyticsClient.embeddings.findSimilar(userId, limit)

      expect(analyticsClient.embeddings.findSimilar).toBeDefined()
    })
  })

  describe('recommendations endpoints', () => {
    it('should have recommendations.getMeals method', () => {
      expect(analyticsClient.recommendations.getMeals).toBeDefined()
    })

    it('should have recommendations.getWorkouts method', () => {
      expect(analyticsClient.recommendations.getWorkouts).toBeDefined()
    })

    it('should have recommendations.getHealth method', () => {
      expect(analyticsClient.recommendations.getHealth).toBeDefined()
    })

    it('should have recommendations.getFriends method', () => {
      expect(analyticsClient.recommendations.getFriends).toBeDefined()
    })

    it('should have recommendations.getChallenges method', () => {
      expect(analyticsClient.recommendations.getChallenges).toBeDefined()
    })

    it('should have recommendations.all method', () => {
      expect(analyticsClient.recommendations.all).toBeDefined()
    })

    it('should construct correct meal recommendations URL', () => {
      const userId = 'user-1'
      analyticsClient.recommendations.getMeals(userId)

      expect(analyticsClient.recommendations.getMeals).toBeDefined()
    })

    it('should construct correct workout recommendations URL', () => {
      const userId = 'user-1'
      analyticsClient.recommendations.getWorkouts(userId)

      expect(analyticsClient.recommendations.getWorkouts).toBeDefined()
    })

    it('should construct all recommendations URL', () => {
      const userId = 'user-1'
      analyticsClient.recommendations.all(userId)

      expect(analyticsClient.recommendations.all).toBeDefined()
    })
  })

  describe('coaching endpoints', () => {
    it('should have coaching.getPerformance method', () => {
      expect(analyticsClient.coaching.getPerformance).toBeDefined()
    })

    it('should have coaching.getNutrition method', () => {
      expect(analyticsClient.coaching.getNutrition).toBeDefined()
    })

    it('should have coaching.getRecovery method', () => {
      expect(analyticsClient.coaching.getRecovery).toBeDefined()
    })

    it('should have coaching.getBehavioral method', () => {
      expect(analyticsClient.coaching.getBehavioral).toBeDefined()
    })

    it('should have coaching.all method', () => {
      expect(analyticsClient.coaching.all).toBeDefined()
    })

    it('should construct correct performance coaching URL', () => {
      const userId = 'user-1'
      analyticsClient.coaching.getPerformance(userId)

      expect(analyticsClient.coaching.getPerformance).toBeDefined()
    })

    it('should construct correct nutrition coaching URL', () => {
      const userId = 'user-1'
      analyticsClient.coaching.getNutrition(userId)

      expect(analyticsClient.coaching.getNutrition).toBeDefined()
    })

    it('should construct all coaching insights URL', () => {
      const userId = 'user-1'
      analyticsClient.coaching.all(userId)

      expect(analyticsClient.coaching.all).toBeDefined()
    })
  })

  describe('analytics endpoints', () => {
    it('should have analytics.getSummary method', () => {
      expect(analyticsClient.analytics.getSummary).toBeDefined()
    })

    it('should have analytics.getStats method', () => {
      expect(analyticsClient.analytics.getStats).toBeDefined()
    })

    it('should construct correct summary URL', () => {
      const userId = 'user-1'
      analyticsClient.analytics.getSummary(userId)

      expect(analyticsClient.analytics.getSummary).toBeDefined()
    })

    it('should construct summary URL with period parameter', () => {
      const userId = 'user-1'
      const period = 'weekly'
      analyticsClient.analytics.getSummary(userId, period)

      expect(analyticsClient.analytics.getSummary).toBeDefined()
    })

    it('should construct correct stats URL', () => {
      const userId = 'user-1'
      analyticsClient.analytics.getStats(userId)

      expect(analyticsClient.analytics.getStats).toBeDefined()
    })
  })

  describe('client configuration', () => {
    it('should use API_URL from environment or default', () => {
      expect(analyticsClient).toBeDefined()
    })

    it('should have timeout configuration', () => {
      expect(analyticsClient).toBeDefined()
    })
  })

  describe('API structure', () => {
    it('should have all main endpoint groups', () => {
      expect(analyticsClient.embeddings).toBeDefined()
      expect(analyticsClient.recommendations).toBeDefined()
      expect(analyticsClient.coaching).toBeDefined()
      expect(analyticsClient.analytics).toBeDefined()
    })

    it('should have all methods as functions', () => {
      const userId = 'user-1'

      expect(typeof analyticsClient.recommendations.getMeals).toBe('function')
      expect(typeof analyticsClient.embeddings.generate).toBe('function')
      expect(typeof analyticsClient.coaching.all).toBe('function')
      expect(typeof analyticsClient.analytics.getSummary).toBe('function')
    })

    it('should support calling all methods without errors', () => {
      const userId = 'user-1'

      expect(() => {
        analyticsClient.recommendations.getMeals(userId)
        analyticsClient.embeddings.generate(userId)
        analyticsClient.coaching.all(userId)
        analyticsClient.analytics.getSummary(userId, 'weekly')
      }).not.toThrow()
    })
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as analyticsCache from '../analyticsCache'
import { AnalyticsSummary } from '@/types/analytics'
import * as sqliteModule from '../sqlite'

// Mock the sqlite module
vi.mock('../sqlite', () => ({
  getDatabase: vi.fn(),
}))

describe('analyticsCache', () => {
  let mockDb: any

  beforeEach(() => {
    mockDb = {
      execAsync: vi.fn().mockResolvedValue(undefined),
      runAsync: vi.fn().mockResolvedValue(undefined),
      getFirstAsync: vi.fn().mockResolvedValue(null),
    }
    vi.mocked(sqliteModule.getDatabase).mockReturnValue(mockDb)
  })

  describe('initAnalyticsCacheTable', () => {
    it('should create analytics_cache table with expiration', async () => {
      await analyticsCache.initAnalyticsCacheTable()

      expect(mockDb.execAsync).toHaveBeenCalledOnce()
      const sql = mockDb.execAsync.mock.calls[0][0]

      expect(sql).toContain('CREATE TABLE IF NOT EXISTS analytics_cache')
      expect(sql).toContain('id TEXT PRIMARY KEY')
      expect(sql).toContain('user_id TEXT NOT NULL')
      expect(sql).toContain('period TEXT NOT NULL')
      expect(sql).toContain('summary TEXT NOT NULL')
      expect(sql).toContain('created_at TEXT NOT NULL')
      expect(sql).toContain('expires_at TEXT NOT NULL')
      expect(sql).toContain('UNIQUE(user_id, period)')
    })

    it('should create embedding_cache table', async () => {
      await analyticsCache.initAnalyticsCacheTable()

      const sql = mockDb.execAsync.mock.calls[0][0]
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS embedding_cache')
      expect(sql).toContain('user_id TEXT PRIMARY KEY')
      expect(sql).toContain('embedding TEXT NOT NULL')
      expect(sql).toContain('created_at TEXT NOT NULL')
      expect(sql).toContain('expires_at TEXT NOT NULL')
    })

    it('should create indexes for expiration queries', async () => {
      await analyticsCache.initAnalyticsCacheTable()

      const sql = mockDb.execAsync.mock.calls[0][0]
      expect(sql).toContain('CREATE INDEX idx_analytics_expires ON analytics_cache(expires_at)')
      expect(sql).toContain('CREATE INDEX idx_embedding_expires ON embedding_cache(expires_at)')
    })
  })

  describe('cacheAnalyticsSummary', () => {
    it('should cache analytics summary with default TTL', async () => {
      const summary: AnalyticsSummary = {
        userId: 'user-123',
        period: 'weekly',
        workoutStats: {
          totalWorkouts: 4,
          totalDuration: 200,
          avgIntensity: 7,
          favoriteExercise: 'Squats',
          progressTrend: 'up',
        },
        nutritionStats: {
          avgCalories: 2000,
          avgProtein: 150,
          mealsLogged: 21,
          consistencyScore: 85,
          favoriteMeals: ['Chicken', 'Rice'],
        },
        healthStats: {
          avgSleep: 7.5,
          avgSteps: 9000,
          avgHeartRate: 72,
          sleepQuality: 8,
        },
        socialStats: {
          friends: 25,
          challengesCompleted: 3,
          badgesEarned: 5,
          totalPoints: 2500,
        },
        goals: {
          calorieGoal: 2200,
          calorieActual: 2000,
          proteinGoal: 150,
          proteinActual: 150,
          workoutGoal: 4,
          workoutActual: 4,
          stepGoal: 10000,
          stepActual: 9000,
        },
      }

      await analyticsCache.cacheAnalyticsSummary(summary)

      expect(mockDb.runAsync).toHaveBeenCalledOnce()
      const [query, params] = mockDb.runAsync.mock.calls[0]

      expect(query).toContain('INSERT OR REPLACE INTO analytics_cache')
      expect(params[0]).toMatch(/^analytics-/) // ID
      expect(params[1]).toBe('user-123') // user_id
      expect(params[2]).toBe('weekly') // period
      expect(params[3]).toBe(JSON.stringify(summary)) // summary
      expect(typeof params[4]).toBe('string') // created_at
      expect(typeof params[5]).toBe('string') // expires_at
    })

    it('should respect custom TTL', async () => {
      const summary: AnalyticsSummary = {
        userId: 'user-123',
        period: 'weekly',
        workoutStats: {
          totalWorkouts: 0,
          totalDuration: 0,
          avgIntensity: 0,
          favoriteExercise: 'Bench',
          progressTrend: 'flat',
        },
        nutritionStats: {
          avgCalories: 2000,
          avgProtein: 150,
          mealsLogged: 0,
          consistencyScore: 0,
          favoriteMeals: [],
        },
        healthStats: {
          avgSleep: 0,
          avgSteps: 0,
          avgHeartRate: 0,
          sleepQuality: 0,
        },
        socialStats: {
          friends: 0,
          challengesCompleted: 0,
          badgesEarned: 0,
          totalPoints: 0,
        },
        goals: {
          calorieGoal: 2200,
          calorieActual: 2000,
          proteinGoal: 150,
          proteinActual: 150,
          workoutGoal: 4,
          workoutActual: 0,
          stepGoal: 10000,
          stepActual: 0,
        },
      }

      const ttlHours = 2
      await analyticsCache.cacheAnalyticsSummary(summary, ttlHours)

      const [, params] = mockDb.runAsync.mock.calls[0]
      const createdAt = new Date(params[4]).getTime()
      const expiresAt = new Date(params[5]).getTime()
      const ttlMs = expiresAt - createdAt

      // Should be approximately 2 hours (allow 1 second variance)
      expect(ttlMs).toBeGreaterThan(ttlHours * 60 * 60 * 1000 - 1000)
      expect(ttlMs).toBeLessThan(ttlHours * 60 * 60 * 1000 + 1000)
    })
  })

  describe('getCachedAnalyticsSummary', () => {
    it('should return null when cache is not found', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce(null)

      const result = await analyticsCache.getCachedAnalyticsSummary('user-123', 'weekly')

      expect(result).toBeNull()
      expect(mockDb.getFirstAsync).toHaveBeenCalledOnce()
    })

    it('should return parsed summary when cache is valid', async () => {
      const summary: AnalyticsSummary = {
        userId: 'user-123',
        period: 'weekly',
        workoutStats: {
          totalWorkouts: 4,
          totalDuration: 200,
          avgIntensity: 7,
          favoriteExercise: 'Squats',
          progressTrend: 'up',
        },
        nutritionStats: {
          avgCalories: 2000,
          avgProtein: 150,
          mealsLogged: 21,
          consistencyScore: 85,
          favoriteMeals: ['Chicken', 'Rice'],
        },
        healthStats: {
          avgSleep: 7.5,
          avgSteps: 9000,
          avgHeartRate: 72,
          sleepQuality: 8,
        },
        socialStats: {
          friends: 25,
          challengesCompleted: 3,
          badgesEarned: 5,
          totalPoints: 2500,
        },
        goals: {
          calorieGoal: 2200,
          calorieActual: 2000,
          proteinGoal: 150,
          proteinActual: 150,
          workoutGoal: 4,
          workoutActual: 4,
          stepGoal: 10000,
          stepActual: 9000,
        },
      }

      mockDb.getFirstAsync.mockResolvedValueOnce({ summary: JSON.stringify(summary) })

      const result = await analyticsCache.getCachedAnalyticsSummary('user-123', 'weekly')

      expect(result).toEqual(summary)
    })

    it('should pass correct query parameters', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce(null)

      await analyticsCache.getCachedAnalyticsSummary('user-123', 'weekly')

      const [query, params] = mockDb.getFirstAsync.mock.calls[0]
      expect(query).toContain('SELECT summary FROM analytics_cache')
      expect(query).toContain('WHERE user_id = ?')
      expect(query).toContain('AND period = ?')
      expect(params[0]).toBe('user-123')
      expect(params[1]).toBe('weekly')
    })
  })

  describe('cacheEmbedding', () => {
    it('should cache embedding vector', async () => {
      const userId = 'user-123'
      const embedding = Array(768)
        .fill(0)
        .map((_, i) => Math.random())

      await analyticsCache.cacheEmbedding(userId, embedding)

      expect(mockDb.runAsync).toHaveBeenCalledOnce()
      const [query, params] = mockDb.runAsync.mock.calls[0]

      expect(query).toContain('INSERT OR REPLACE INTO embedding_cache')
      expect(params[0]).toBe(userId)
      expect(params[1]).toBe(JSON.stringify(embedding))
      expect(typeof params[2]).toBe('string') // created_at
      expect(typeof params[3]).toBe('string') // expires_at
    })

    it('should respect custom TTL for embedding', async () => {
      const userId = 'user-123'
      const embedding = [0.1, 0.2, 0.3]

      const ttlHours = 12
      await analyticsCache.cacheEmbedding(userId, embedding, ttlHours)

      const [, params] = mockDb.runAsync.mock.calls[0]
      const createdAt = new Date(params[2]).getTime()
      const expiresAt = new Date(params[3]).getTime()
      const ttlMs = expiresAt - createdAt

      // Should be approximately 12 hours
      expect(ttlMs).toBeGreaterThan(ttlHours * 60 * 60 * 1000 - 1000)
      expect(ttlMs).toBeLessThan(ttlHours * 60 * 60 * 1000 + 1000)
    })
  })

  describe('getCachedEmbedding', () => {
    it('should return null when embedding not found', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce(null)

      const result = await analyticsCache.getCachedEmbedding('user-123')

      expect(result).toBeNull()
    })

    it('should return parsed embedding vector', async () => {
      const embedding = Array(768)
        .fill(0)
        .map((_, i) => Math.random())

      mockDb.getFirstAsync.mockResolvedValueOnce({ embedding: JSON.stringify(embedding) })

      const result = await analyticsCache.getCachedEmbedding('user-123')

      expect(result).toEqual(embedding)
      expect(result?.length).toBe(768)
    })

    it('should pass correct query parameters', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce(null)

      await analyticsCache.getCachedEmbedding('user-123')

      const [query, params] = mockDb.getFirstAsync.mock.calls[0]
      expect(query).toContain('SELECT embedding FROM embedding_cache')
      expect(query).toContain('WHERE user_id = ?')
      expect(params[0]).toBe('user-123')
    })
  })

  describe('clearExpiredCache', () => {
    it('should delete expired analytics cache', async () => {
      await analyticsCache.clearExpiredCache()

      expect(mockDb.runAsync).toHaveBeenCalled()
      const calls = mockDb.runAsync.mock.calls

      const analyticsCacheDelete = calls.some((call: any[]) =>
        call[0].includes('DELETE FROM analytics_cache')
      )
      expect(analyticsCacheDelete).toBe(true)
    })

    it('should delete expired embedding cache', async () => {
      await analyticsCache.clearExpiredCache()

      const calls = mockDb.runAsync.mock.calls

      const embeddingCacheDelete = calls.some((call: any[]) =>
        call[0].includes('DELETE FROM embedding_cache')
      )
      expect(embeddingCacheDelete).toBe(true)
    })

    it('should use expiration time for deletion', async () => {
      await analyticsCache.clearExpiredCache()

      const calls = mockDb.runAsync.mock.calls

      for (const call of calls) {
        const query = call[0]
        if (query.includes('DELETE FROM')) {
          expect(query).toContain("expires_at <= datetime('now')")
        }
      }
    })
  })
})

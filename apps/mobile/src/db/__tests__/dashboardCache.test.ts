import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as SQLite from 'expo-sqlite'
import { saveDashboardCache, getDashboardCache } from '../dashboardCache'
import * as sqliteModule from '../sqlite'

// Mock the sqlite module
vi.mock('../sqlite', () => ({
  getDatabase: vi.fn(),
}))

describe('dashboardCache', () => {
  let mockDb: any

  beforeEach(() => {
    mockDb = {
      runAsync: vi.fn().mockResolvedValue(undefined),
      getFirstAsync: vi.fn().mockResolvedValue(null),
    }
    vi.mocked(sqliteModule.getDatabase).mockReturnValue(mockDb)
  })

  describe('saveDashboardCache', () => {
    it('should insert dashboard cache with expiration', async () => {
      const userId = 'user-123'
      const stats = {
        todayCalories: 1500,
        calorieGoal: 2000,
      }

      await saveDashboardCache(userId, stats)

      expect(mockDb.runAsync).toHaveBeenCalledOnce()
      const [query, params] = mockDb.runAsync.mock.calls[0]

      expect(query).toContain('INSERT OR REPLACE INTO dashboard_cache')
      expect(params[0]).toBe(userId)
      expect(params[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD format
      expect(params[2]).toBe(1500)
      expect(params[3]).toBe(2000)
      expect(typeof params[4]).toBe('number') // cachedAt
      expect(typeof params[5]).toBe('number') // expiresAt
      expect(params[5]).toBeGreaterThan(params[4]) // expiresAt > cachedAt
    })
  })

  describe('getDashboardCache', () => {
    it('should return null when cache is expired', async () => {
      const userId = 'user-123'
      mockDb.getFirstAsync.mockResolvedValueOnce(null)

      const result = await getDashboardCache(userId)

      expect(result).toBeNull()
      expect(mockDb.getFirstAsync).toHaveBeenCalledOnce()
      const [query, params] = mockDb.getFirstAsync.mock.calls[0]
      expect(query).toContain('SELECT * FROM dashboard_cache')
      expect(params[0]).toBe(userId)
      expect(typeof params[1]).toBe('number') // now timestamp
    })

    it('should return cached data when not expired', async () => {
      const userId = 'user-123'
      const cachedData = {
        userId,
        date: '2026-04-18',
        todayCalories: 1500,
        calorieGoal: 2000,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 3600000,
      }
      mockDb.getFirstAsync.mockResolvedValueOnce(cachedData)

      const result = await getDashboardCache(userId)

      expect(result).toEqual(cachedData)
    })
  })
})

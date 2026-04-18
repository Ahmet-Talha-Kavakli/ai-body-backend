import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveUserCache, getUserCache } from '../userCache'
import * as sqliteModule from '../sqlite'

// Mock the sqlite module
vi.mock('../sqlite', () => ({
  getDatabase: vi.fn(),
}))

describe('userCache', () => {
  let mockDb: any

  beforeEach(() => {
    mockDb = {
      runAsync: vi.fn().mockResolvedValue(undefined),
      getFirstAsync: vi.fn().mockResolvedValue(null),
    }
    vi.mocked(sqliteModule.getDatabase).mockReturnValue(mockDb)
  })

  describe('saveUserCache', () => {
    it('should insert user cache with expiration', async () => {
      const profile = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'John Doe',
      }

      await saveUserCache(profile)

      expect(mockDb.runAsync).toHaveBeenCalledOnce()
      const [query, params] = mockDb.runAsync.mock.calls[0]

      expect(query).toContain('INSERT OR REPLACE INTO user_cache')
      expect(params[0]).toBe('user-123')
      expect(params[1]).toBe('test@example.com')
      expect(params[2]).toBe('John Doe')
      expect(typeof params[3]).toBe('number') // cachedAt
      expect(typeof params[4]).toBe('number') // expiresAt
      expect(params[4]).toBeGreaterThan(params[3]) // expiresAt > cachedAt
    })
  })

  describe('getUserCache', () => {
    it('should return null when cache is expired', async () => {
      const userId = 'user-123'
      mockDb.getFirstAsync.mockResolvedValueOnce(null)

      const result = await getUserCache(userId)

      expect(result).toBeNull()
      expect(mockDb.getFirstAsync).toHaveBeenCalledOnce()
      const [query, params] = mockDb.getFirstAsync.mock.calls[0]
      expect(query).toContain('SELECT * FROM user_cache')
      expect(params[0]).toBe(userId)
      expect(typeof params[1]).toBe('number') // now timestamp
    })

    it('should return cached user data when not expired', async () => {
      const userId = 'user-123'
      const cachedData = {
        userId,
        email: 'test@example.com',
        name: 'John Doe',
        cachedAt: Date.now(),
        expiresAt: Date.now() + 3600000,
      }
      mockDb.getFirstAsync.mockResolvedValueOnce(cachedData)

      const result = await getUserCache(userId)

      expect(result).toEqual(cachedData)
    })
  })
})

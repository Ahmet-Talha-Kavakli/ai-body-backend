import { describe, it, expect, beforeEach, vi } from 'vitest'
import { queueSync, getPendingSyncQueue, removeSyncQueueItem } from '../syncQueue'
import * as sqliteModule from '../sqlite'

// Mock the sqlite module
vi.mock('../sqlite', () => ({
  getDatabase: vi.fn(),
}))

describe('syncQueue', () => {
  let mockDb: any

  beforeEach(() => {
    mockDb = {
      runAsync: vi.fn().mockResolvedValue(undefined),
      getFirstAsync: vi.fn().mockResolvedValue(null),
      getAllAsync: vi.fn().mockResolvedValue([]),
    }
    vi.mocked(sqliteModule.getDatabase).mockReturnValue(mockDb)
  })

  describe('queueSync', () => {
    it('should insert sync queue item with payload', async () => {
      const userId = 'user-123'
      const payload = { calories: 1500 }

      await queueSync(userId, 'POST', '/api/workouts', payload)

      expect(mockDb.runAsync).toHaveBeenCalledOnce()
      const [query, params] = mockDb.runAsync.mock.calls[0]

      expect(query).toContain('INSERT INTO sync_queue')
      expect(params[0]).toBe(userId)
      expect(params[1]).toBe('POST')
      expect(params[2]).toBe('/api/workouts')
      expect(params[3]).toBe(JSON.stringify(payload))
      expect(typeof params[4]).toBe('number') // createdAt
      expect(params[5]).toBe(0) // retries
    })
  })

  describe('getPendingSyncQueue', () => {
    it('should return empty array when no pending items', async () => {
      const userId = 'user-123'
      mockDb.getAllAsync.mockResolvedValueOnce([])

      const result = await getPendingSyncQueue(userId)

      expect(result).toEqual([])
      expect(mockDb.getAllAsync).toHaveBeenCalledOnce()
      const [query, params] = mockDb.getAllAsync.mock.calls[0]
      expect(query).toContain('SELECT * FROM sync_queue')
      expect(params[0]).toBe(userId)
    })

    it('should return pending sync items ordered by creation', async () => {
      const userId = 'user-123'
      const items = [
        { id: 1, userId, action: 'POST', endpoint: '/api/workouts', payload: '{}', createdAt: 100 },
        {
          id: 2,
          userId,
          action: 'PUT',
          endpoint: '/api/profile',
          payload: '{}',
          createdAt: 200,
        },
      ]
      mockDb.getAllAsync.mockResolvedValueOnce(items)

      const result = await getPendingSyncQueue(userId)

      expect(result).toEqual(items)
      expect(result[0].createdAt).toBeLessThan(result[1].createdAt)
    })
  })

  describe('removeSyncQueueItem', () => {
    it('should delete sync queue item by id', async () => {
      const itemId = '1'

      await removeSyncQueueItem(itemId)

      expect(mockDb.runAsync).toHaveBeenCalledOnce()
      const [query, params] = mockDb.runAsync.mock.calls[0]

      expect(query).toContain('DELETE FROM sync_queue')
      expect(params[0]).toBe(itemId)
    })
  })
})

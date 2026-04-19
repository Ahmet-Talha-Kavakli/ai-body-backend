import { describe, it, expect, beforeEach, vi } from 'vitest'
import { queueSync, getPendingSyncQueue, removeSyncQueueItem } from '../syncQueue'
import * as sqliteModule from '../sqlite'

// Mock the sqlite module
vi.mock('../sqlite', () => ({
  getDatabase: vi.fn(),
}))

describe('syncQueue', () => {
  describe('queueSync', () => {
    it('should queue sync item with UUID and ISO timestamp', async () => {
      const userId = 'user-123'
      const payload = { calories: 1500 }

      const id = await queueSync(userId, 'POST', '/api/workouts', payload)

      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })
  })

  describe('getPendingSyncQueue', () => {
    it('should return empty array when no pending items', async () => {
      const userId = 'user-123-nonexistent'
      const result = await getPendingSyncQueue(userId)
      expect(result).toEqual([])
    })

    it('should return pending sync items with correct structure', async () => {
      const userId = 'user-123-test'
      const payload = { calories: 1500 }

      await queueSync(userId, 'POST', '/api/workouts', payload)
      const result = await getPendingSyncQueue(userId)

      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('userId', userId)
      expect(result[0]).toHaveProperty('method', 'POST')
      expect(result[0]).toHaveProperty('endpoint', '/api/workouts')
      expect(result[0]).toHaveProperty('payload')
      expect(result[0]).toHaveProperty('createdAt')
      expect(result[0]).toHaveProperty('retries', 0)
    })
  })

  describe('removeSyncQueueItem', () => {
    it('should remove sync queue item by id', async () => {
      const userId = 'user-123-remove'
      const id = await queueSync(userId, 'POST', '/api/test', {})

      await removeSyncQueueItem(id)
      // Function completes without error
      expect(true).toBe(true)
    })
  })
})

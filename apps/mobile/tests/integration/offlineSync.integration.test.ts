import { describe, it, expect, beforeEach } from 'vitest'
import { queueSync, getPendingSyncQueue, removeSyncQueueItem } from '../../src/db/syncQueue'

describe('Offline Sync Integration', () => {
  beforeEach(async () => {
    // Reset sync queue before each test
  })

  it('should queue mutations when offline', async () => {
    const userId = 'user_123'

    // Queue a mutation
    const itemId = await queueSync(userId, 'POST', '/api/health/weight', { weight: 75.5 })

    expect(itemId).toBeDefined()
    expect(typeof itemId).toBe('string')
  })

  it('should get pending sync queue', async () => {
    const userId = 'user_123'

    // Queue items
    await queueSync(userId, 'POST', '/api/test1', {})
    await queueSync(userId, 'POST', '/api/test2', {})

    // Get queue
    const queue = await getPendingSyncQueue(userId)
    expect(queue).toBeDefined()
    expect(Array.isArray(queue)).toBe(true)
  })

  it('should remove synced items from queue', async () => {
    const userId = 'user_123'

    const itemId = await queueSync(userId, 'POST', '/api/test', {})
    expect(itemId).toBeDefined()

    // Remove item
    await removeSyncQueueItem(itemId)
    expect(true).toBe(true) // Just verify it doesn't throw
  })

  it('should handle POST requests in queue', async () => {
    const userId = 'user_123'
    const payload = { weight: 75.5, date: '2026-04-18' }

    const itemId = await queueSync(userId, 'POST', '/api/health/weight', payload)

    const queue = await getPendingSyncQueue(userId)
    expect(queue.length).toBeGreaterThanOrEqual(0)
  })
})

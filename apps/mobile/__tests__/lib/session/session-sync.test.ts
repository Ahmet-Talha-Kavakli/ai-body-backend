import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  syncSessionToBackend,
  getSyncQueue,
  clearSyncQueue,
  getBacklog,
  initSyncQueue,
} from '@/lib/session/session-sync'
import type { SessionRecord } from '@/lib/session/types'

// Mock fetch globally
global.fetch = vi.fn()

describe('Session Sync Module', () => {
  let mockSessionRecord: SessionRecord

  beforeEach(async () => {
    vi.clearAllMocks()
    await clearSyncQueue()
    await initSyncQueue()

    mockSessionRecord = {
      id: 'session-001',
      userId: 'user-123',
      exercise: 'squat',
      startTime: new Date('2026-04-12T10:00:00Z'),
      endTime: new Date('2026-04-12T10:15:00Z'),
      totalReps: 10,
      avgFormScore: 85.5,
      frames: [
        {
          timestamp: 1712921400000,
          exercise: 'squat',
          formScore: 85,
          repNumber: 1,
          errors: [],
          muscleEngagement: { quadriceps: 0.85, glutes: 0.78 },
        },
      ],
      voiceFeedback: ['Great form!', 'Keep chest up'],
      syncStatus: 'pending',
    }
  })

  afterEach(async () => {
    await clearSyncQueue()
    vi.clearAllMocks()
  })

  describe('syncSessionToBackend', () => {
    it('should immediately sync successful sessions to backend', async () => {
      ;(global.fetch as any).mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      )

      await syncSessionToBackend(mockSessionRecord)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sessions/sync'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockSessionRecord),
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    it('should queue session for retry on network error', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await syncSessionToBackend(mockSessionRecord)

      // Wait for async sync attempt
      await new Promise((resolve) => setTimeout(resolve, 100))

      const queue = await getSyncQueue()
      expect(queue).toHaveLength(1)
      expect(queue[0].syncStatus).toBe('pending')
      expect(queue[0].retryCount).toBe(1) // Queued for first retry
    })

    it('should not block app on sync failure', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const startTime = Date.now()
      await syncSessionToBackend(mockSessionRecord)
      const duration = Date.now() - startTime

      // Should return immediately (within 100ms), not wait for retries
      expect(duration).toBeLessThan(100)
    })

    it('should update sync status on successful sync', async () => {
      ;(global.fetch as any).mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      )

      await syncSessionToBackend(mockSessionRecord)

      // Wait for async sync attempt
      await new Promise((resolve) => setTimeout(resolve, 100))

      const queue = await getSyncQueue()
      const syncedItem = queue.find((item) => item.sessionId === mockSessionRecord.id)
      expect(syncedItem?.syncStatus).toBe('synced')
    })

    it('should mark 4xx errors as failed (no retry)', async () => {
      ;(global.fetch as any).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 })
      )

      await syncSessionToBackend(mockSessionRecord)

      // Wait for async sync attempt
      await new Promise((resolve) => setTimeout(resolve, 100))

      const queue = await getSyncQueue()
      const failedItem = queue.find((item) => item.sessionId === mockSessionRecord.id)
      expect(failedItem?.syncStatus).toBe('failed')
      expect(failedItem?.retryCount).toBe(0)
    })

    it('should queue 5xx errors for retry', async () => {
      ;(global.fetch as any).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
      )

      await syncSessionToBackend(mockSessionRecord)

      // Wait for async sync attempt
      await new Promise((resolve) => setTimeout(resolve, 100))

      const queue = await getSyncQueue()
      const pendingItem = queue.find((item) => item.sessionId === mockSessionRecord.id)
      expect(pendingItem?.syncStatus).toBe('pending')
      expect(pendingItem?.nextRetryAt).toBeGreaterThan(Date.now())
    })
  })

  describe('Exponential Backoff Retry', () => {
    it('should queue failed items with exponential backoff delay', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await syncSessionToBackend(mockSessionRecord)
      await new Promise((resolve) => setTimeout(resolve, 300))

      const queue = await getSyncQueue()
      const item = queue.find((i) => i.sessionId === mockSessionRecord.id)

      // Should be queued with retry count and nextRetryAt set
      expect(item?.retryCount).toBe(1)
      expect(item?.nextRetryAt).toBeGreaterThan(Date.now())
      expect(item?.syncStatus).toBe('pending')
    })

    it('should increment retry count on each failure', async () => {
      ;(global.fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))

      const record1: SessionRecord = { ...mockSessionRecord, id: 'retry-count-test' }

      // First failure
      await syncSessionToBackend(record1)
      await new Promise((resolve) => setTimeout(resolve, 300))

      let queue = await getSyncQueue()
      let item = queue.find((i) => i.sessionId === 'retry-count-test')
      expect(item?.retryCount).toBe(1)

      // Second failure
      await syncSessionToBackend(item!.record)
      await new Promise((resolve) => setTimeout(resolve, 300))

      queue = await getSyncQueue()
      item = queue.find((i) => i.sessionId === 'retry-count-test')
      expect(item?.retryCount).toBe(2)
      expect(item?.syncStatus).toBe('pending')
    })
  })

  describe('getSyncQueue', () => {
    it('should return empty queue initially', async () => {
      const queue = await getSyncQueue()
      expect(queue).toEqual([])
    })

    it('should return all pending sync items', async () => {
      ;(global.fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))

      await syncSessionToBackend(mockSessionRecord)
      const record2: SessionRecord = {
        ...mockSessionRecord,
        id: 'session-002',
      }
      await syncSessionToBackend(record2)

      const queue = await getSyncQueue()
      expect(queue).toHaveLength(2)
      expect(queue.map((item) => item.sessionId)).toContain('session-001')
      expect(queue.map((item) => item.sessionId)).toContain('session-002')
    })

    it('should include synced items in queue', async () => {
      const record: SessionRecord = { ...mockSessionRecord, id: 'queue-synced-test' }
      ;(global.fetch as any).mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      )

      await syncSessionToBackend(record)

      // Wait for async sync attempt
      await new Promise((resolve) => setTimeout(resolve, 300))

      const queue = await getSyncQueue()
      const syncedItem = queue.find(
        (item) => item.sessionId === 'queue-synced-test' && item.syncStatus === 'synced'
      )
      expect(syncedItem).toBeDefined()
    })

    it('should include failed items in queue', async () => {
      const record: SessionRecord = { ...mockSessionRecord, id: 'queue-failed-test' }
      ;(global.fetch as any).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 })
      )

      await syncSessionToBackend(record)

      // Wait for async sync attempt
      await new Promise((resolve) => setTimeout(resolve, 300))

      const queue = await getSyncQueue()
      const failedItem = queue.find(
        (item) => item.sessionId === 'queue-failed-test' && item.syncStatus === 'failed'
      )
      expect(failedItem).toBeDefined()
    })
  })

  describe('clearSyncQueue', () => {
    it('should remove all items from sync queue', async () => {
      ;(global.fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))

      await syncSessionToBackend(mockSessionRecord)
      const record2: SessionRecord = {
        ...mockSessionRecord,
        id: 'session-002',
      }
      await syncSessionToBackend(record2)

      let queue = await getSyncQueue()
      expect(queue.length).toBeGreaterThan(0)

      await clearSyncQueue()

      queue = await getSyncQueue()
      expect(queue).toEqual([])
    })

    it('should not throw when clearing empty queue', async () => {
      expect(async () => {
        await clearSyncQueue()
      }).not.toThrow()
    })
  })

  describe('getBacklog', () => {
    it('should return count of pending items', async () => {
      ;(global.fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))

      await syncSessionToBackend(mockSessionRecord)
      const record2: SessionRecord = {
        ...mockSessionRecord,
        id: 'session-002',
      }
      await syncSessionToBackend(record2)

      const backlog = getBacklog()
      expect(backlog).toBe(2)
    })

    it('should not count synced items in backlog', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
        .mockRejectedValueOnce(new Error('Network error'))

      await syncSessionToBackend(mockSessionRecord)
      const record2: SessionRecord = {
        ...mockSessionRecord,
        id: 'session-002',
      }
      await syncSessionToBackend(record2)

      // Wait for async sync attempts
      await new Promise((resolve) => setTimeout(resolve, 100))

      const backlog = getBacklog()
      expect(backlog).toBe(1)
    })

    it('should not count failed items in backlog', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 })
        )
        .mockRejectedValueOnce(new Error('Network error'))

      await syncSessionToBackend(mockSessionRecord)
      const record2: SessionRecord = {
        ...mockSessionRecord,
        id: 'session-002',
      }
      await syncSessionToBackend(record2)

      // Wait for async sync attempts
      await new Promise((resolve) => setTimeout(resolve, 100))

      const backlog = getBacklog()
      expect(backlog).toBe(1)
    })

    it('should return 0 for empty queue', async () => {
      const backlog = getBacklog()
      expect(backlog).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should mark network errors as pending for retry', async () => {
      const record: SessionRecord = { ...mockSessionRecord, id: 'eh-network' }
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network timeout'))

      await syncSessionToBackend(record)

      // Wait for async sync attempt to complete
      await new Promise((resolve) => setTimeout(resolve, 300))

      const queue = await getSyncQueue()
      const item = queue.find((i) => i.sessionId === 'eh-network')

      expect(item?.syncStatus).toBe('pending')
      expect(item?.retryCount).toBeGreaterThan(0)
    })

    it('should mark 5xx errors as pending for retry', async () => {
      const record: SessionRecord = { ...mockSessionRecord, id: 'eh-5xx' }
      ;(global.fetch as any).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Server error' }), { status: 503 })
      )

      await syncSessionToBackend(record)

      // Wait for async sync attempt to complete
      await new Promise((resolve) => setTimeout(resolve, 300))

      const queue = await getSyncQueue()
      const item = queue.find((i) => i.sessionId === 'eh-5xx')

      expect(item?.syncStatus).toBe('pending')
      expect(item?.retryCount).toBeGreaterThan(0)
    })

    it('should mark 4xx errors as failed with no retry', async () => {
      const record: SessionRecord = { ...mockSessionRecord, id: 'eh-4xx' }
      ;(global.fetch as any).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 })
      )

      await syncSessionToBackend(record)

      // Wait for async sync attempt to complete
      await new Promise((resolve) => setTimeout(resolve, 300))

      const queue = await getSyncQueue()
      const item = queue.find((i) => i.sessionId === 'eh-4xx')

      expect(item?.syncStatus).toBe('failed')
      expect(item?.retryCount).toBe(0)
    })
  })

  describe('SyncItem Interface', () => {
    it('should store complete SyncItem with all fields', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await syncSessionToBackend(mockSessionRecord)

      const queue = await getSyncQueue()
      const item = queue[0]

      expect(item).toHaveProperty('sessionId')
      expect(item).toHaveProperty('record')
      expect(item).toHaveProperty('syncStatus')
      expect(item).toHaveProperty('retryCount')
      expect(item).toHaveProperty('nextRetryAt')

      expect(item.sessionId).toBe(mockSessionRecord.id)
      expect(item.record).toEqual(mockSessionRecord)
      expect(item.syncStatus).toBe('pending')
      expect(item.retryCount).toBe(1) // Queued for first retry
      expect(typeof item.nextRetryAt).toBe('number')
    })
  })

  describe('API Endpoint', () => {
    it('should POST to correct API endpoint', async () => {
      ;(global.fetch as any).mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      )

      await syncSessionToBackend(mockSessionRecord)

      const [url] = (global.fetch as any).mock.calls[0]
      expect(url).toContain('/api/sessions/sync')
    })

    it('should include Content-Type header', async () => {
      ;(global.fetch as any).mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      )

      await syncSessionToBackend(mockSessionRecord)

      const [, options] = (global.fetch as any).mock.calls[0]
      expect(options.headers['Content-Type']).toBe('application/json')
    })

    it('should send JSON stringified SessionRecord', async () => {
      ;(global.fetch as any).mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      )

      await syncSessionToBackend(mockSessionRecord)

      const [, options] = (global.fetch as any).mock.calls[0]
      expect(options.body).toBe(JSON.stringify(mockSessionRecord))
    })
  })
})

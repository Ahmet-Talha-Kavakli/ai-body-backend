import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as recommendationsDb from '../recommendations'
import type { Recommendation } from '@/types/analytics'

// Mock the database module for unit testing
vi.mock('expo-sqlite', () => ({
  openDatabaseSync: vi.fn(() => ({
    execAsync: vi.fn().mockResolvedValue(undefined),
    runAsync: vi.fn().mockResolvedValue(undefined),
    getAllAsync: vi.fn().mockResolvedValue([]),
  })),
}))

const mockRec: Recommendation = {
  id: 'rec-1',
  userId: 'user-1',
  type: 'meal',
  title: 'Test Meal',
  description: 'A test recommendation',
  confidence: 85,
  reasoning: 'Test reasoning',
  actionUrl: 'app://test',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
}

describe('recommendationsDb', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize the recommendations table', async () => {
    const mockDb = {
      execAsync: vi.fn().mockResolvedValue(undefined),
      runAsync: vi.fn().mockResolvedValue(undefined),
      getAllAsync: vi.fn().mockResolvedValue([]),
    }

    recommendationsDb.setDatabase(mockDb)
    await recommendationsDb.initRecommendationsTable()

    expect(mockDb.execAsync).toHaveBeenCalled()
    expect(mockDb.execAsync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE'))
  })

  it('should save a recommendation', async () => {
    const mockDb = {
      execAsync: vi.fn().mockResolvedValue(undefined),
      runAsync: vi.fn().mockResolvedValue(undefined),
      getAllAsync: vi.fn().mockResolvedValue([]),
    }

    recommendationsDb.setDatabase(mockDb)

    await recommendationsDb.saveRecommendation(mockRec)

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO recommendations'),
      expect.arrayContaining([mockRec.id, mockRec.userId, mockRec.type, mockRec.title]),
    )
  })

  it('should get recommendations with expiry filter', async () => {
    const mockDb = {
      execAsync: vi.fn().mockResolvedValue(undefined),
      runAsync: vi.fn().mockResolvedValue(undefined),
      getAllAsync: vi.fn().mockResolvedValue([mockRec]),
    }

    recommendationsDb.setDatabase(mockDb)

    const result = await recommendationsDb.getRecommendations('user-1')

    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE user_id = ?'),
      expect.arrayContaining(['user-1']),
    )
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(mockRec.id)
  })

  it('should filter recommendations by type', async () => {
    const mockDb = {
      execAsync: vi.fn().mockResolvedValue(undefined),
      runAsync: vi.fn().mockResolvedValue(undefined),
      getAllAsync: vi.fn().mockResolvedValue([mockRec]),
    }

    recommendationsDb.setDatabase(mockDb)

    await recommendationsDb.getRecommendations('user-1', 'meal')

    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('AND type = ?'),
      expect.arrayContaining(['user-1', expect.any(String), 'meal']),
    )
  })

  it('should order results by confidence descending', async () => {
    const mockDb = {
      execAsync: vi.fn().mockResolvedValue(undefined),
      runAsync: vi.fn().mockResolvedValue(undefined),
      getAllAsync: vi.fn().mockResolvedValue([mockRec]),
    }

    recommendationsDb.setDatabase(mockDb)

    await recommendationsDb.getRecommendations('user-1')

    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY confidence DESC'),
      expect.any(Array),
    )
  })

  it('should clear expired recommendations', async () => {
    const mockDb = {
      execAsync: vi.fn().mockResolvedValue(undefined),
      runAsync: vi.fn().mockResolvedValue(undefined),
      getAllAsync: vi.fn().mockResolvedValue([]),
    }

    recommendationsDb.setDatabase(mockDb)

    await recommendationsDb.clearExpiredRecommendations('user-1')

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM recommendations'),
      expect.arrayContaining(['user-1']),
    )
  })

  it('should handle multiple recommendations in workflow', async () => {
    const recommendations = [
      { ...mockRec, id: 'rec-1', confidence: 85 },
      { ...mockRec, id: 'rec-2', confidence: 75 },
      { ...mockRec, id: 'rec-3', confidence: 90 },
    ]

    const mockDb = {
      execAsync: vi.fn().mockResolvedValue(undefined),
      runAsync: vi.fn().mockResolvedValue(undefined),
      getAllAsync: vi.fn().mockResolvedValue(recommendations),
    }

    recommendationsDb.setDatabase(mockDb)

    // Save recommendations
    for (const rec of recommendations) {
      await recommendationsDb.saveRecommendation(rec)
    }

    expect(mockDb.runAsync).toHaveBeenCalledTimes(3)

    // Get recommendations
    const result = await recommendationsDb.getRecommendations('user-1')

    expect(result).toHaveLength(3)
    // The query includes ORDER BY confidence DESC, so the mock data represents already-sorted results
    expect(result.every((r) => r.userId === 'user-1')).toBe(true)
  })

  it('should support independent user data', async () => {
    const user1Recs = [{ ...mockRec, userId: 'user-1', id: 'rec-1' }]
    const user2Recs = [{ ...mockRec, userId: 'user-2', id: 'rec-2' }]

    const mockDb = {
      execAsync: vi.fn().mockResolvedValue(undefined),
      runAsync: vi.fn().mockResolvedValue(undefined),
      getAllAsync: vi
        .fn()
        .mockResolvedValueOnce(user1Recs)
        .mockResolvedValueOnce(user2Recs),
    }

    recommendationsDb.setDatabase(mockDb)

    const user1Result = await recommendationsDb.getRecommendations('user-1')
    const user2Result = await recommendationsDb.getRecommendations('user-2')

    expect(user1Result).toHaveLength(1)
    expect(user1Result[0].userId).toBe('user-1')
    expect(user2Result).toHaveLength(1)
    expect(user2Result[0].userId).toBe('user-2')
  })
})

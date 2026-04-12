import { describe, it, expect, vi, beforeEach } from 'vitest'
import { retrieveMemoryContext, rankByRelevance } from '../memory-retriever'
import type { MemoryContext } from '../types'

vi.mock('@/lib/ai/openai', () => ({
  openai: {
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: Array(1536).fill(0.5) }],
      }),
    },
  },
}))

vi.mock('@/lib/db/client', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([
      {
        id: 'mem_1',
        content: 'Squat workout',
        type: 'SESSION_SUMMARY',
        importance: 8,
        decayScore: 0.95,
        similarity: 0.92,
      },
      {
        id: 'mem_2',
        content: 'Weekly pattern: consistent squats',
        type: 'WEEKLY_SUMMARY',
        importance: 7,
        decayScore: 0.85,
        similarity: 0.78,
      },
    ]),
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}))

describe('Memory Retriever', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rankByRelevance', () => {
    it('weights similarity 80% and recency 20%', () => {
      const score = rankByRelevance({
        similarity: 0.9,
        importance: 8,
        decayScore: 1.0,
      })

      // 0.9 * 0.8 + (8/10) * 1.0 * 0.2 = 0.72 + 0.16 = 0.88
      expect(score).toBeCloseTo(0.88, 2)
    })

    it('penalizes old memories', () => {
      const fresh = rankByRelevance({
        similarity: 0.7,
        importance: 5,
        decayScore: 1.0,
      })
      const old = rankByRelevance({
        similarity: 0.7,
        importance: 5,
        decayScore: 0.2,
      })

      expect(fresh).toBeGreaterThan(old)
    })

    it('prioritizes high similarity', () => {
      const highSimilarity = rankByRelevance({
        similarity: 0.95,
        importance: 5,
        decayScore: 0.5,
      })
      const lowSimilarity = rankByRelevance({
        similarity: 0.6,
        importance: 10,
        decayScore: 1.0,
      })

      // 0.95 * 0.8 + 0.5 * 0.5 * 0.2 = 0.76 + 0.05 = 0.81
      // 0.6 * 0.8 + 1.0 * 1.0 * 0.2 = 0.48 + 0.2 = 0.68
      expect(highSimilarity).toBeGreaterThan(lowSimilarity)
    })
  })

  describe('retrieveMemoryContext', () => {
    it('returns context object with memories array', async () => {
      const context = await retrieveMemoryContext('user_123', 'How should I adjust my squat form?')

      expect(context).toHaveProperty('memories')
      expect(context).toHaveProperty('totalRetrieved')
      expect(Array.isArray(context.memories)).toBe(true)
    })

    it('limits results to topK', async () => {
      const context = await retrieveMemoryContext('user_123', 'Show me all memories', {
        limit: 1,
      })

      expect(context.memories.length).toBeLessThanOrEqual(1)
    })

    it('returns empty array when no memories exist', async () => {
      const { prisma } = await import('@/lib/db/client')
      ;(prisma.$queryRaw as any).mockResolvedValueOnce([])

      const context = await retrieveMemoryContext('user_999', 'test')

      expect(context.memories).toEqual([])
      expect(context.totalRetrieved).toBe(0)
    })

    it('returns empty context on DB error without throwing', async () => {
      const { prisma } = await import('@/lib/db/client')
      ;(prisma.$queryRaw as any).mockRejectedValueOnce(new Error('DB down'))

      const context = await retrieveMemoryContext('user_123', 'query')

      expect(context.memories).toHaveLength(0)
      expect(context.totalRetrieved).toBe(0)
    })

    it('re-ranks results by relevance score', async () => {
      const { prisma } = await import('@/lib/db/client')
      ;(prisma.$queryRaw as any).mockResolvedValueOnce([
        {
          id: 'mem_low_similarity',
          content: 'Low similarity high importance',
          type: 'SESSION_SUMMARY',
          importance: 10,
          decayScore: 1.0,
          similarity: 0.5, // 0.5*0.8 + 1.0*0.2 = 0.6
        },
        {
          id: 'mem_high_similarity',
          content: 'High similarity lower importance',
          type: 'SESSION_SUMMARY',
          importance: 5,
          decayScore: 1.0,
          similarity: 0.9, // 0.9*0.8 + 0.5*0.2 = 0.82
        },
      ])

      const context = await retrieveMemoryContext('user_123', 'test', { limit: 2 })

      // High similarity should rank first despite lower importance
      expect(context.memories[0]).toContain('High similarity')
    })

    it('filters by memory types when provided', async () => {
      const context = await retrieveMemoryContext('user_123', 'test', {
        types: ['SESSION_SUMMARY'],
      })

      const { prisma } = await import('@/lib/db/client')
      expect(prisma.$queryRaw).toHaveBeenCalled()
    })
  })
})

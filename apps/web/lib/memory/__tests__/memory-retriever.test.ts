import { describe, it, expect, vi } from 'vitest'
import { rankByRelevance, retrieveMemoryContext } from '../memory-retriever'

vi.mock('@/lib/db/client', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([
      {
        content: '[Antrenman - 01.04] Squat: 3x5 @ 100kg',
        importance: 8,
        decayScore: 0.9,
        type: 'SESSION_SUMMARY',
      },
      {
        content: '[Haftalık Özet] 4 antrenman tutarlı',
        importance: 7,
        decayScore: 0.7,
        type: 'WEEKLY_SUMMARY',
      },
      {
        content: '[Antrenman - 15.03] Bench: 4x5 @ 80kg',
        importance: 5,
        decayScore: 0.4,
        type: 'SESSION_SUMMARY',
      },
    ]),
  },
}))

vi.mock('@/lib/embeddings/client', () => ({
  createEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}))

describe('rankByRelevance', () => {
  const items = [
    { content: 'A', importance: 8, decayScore: 0.9 },
    { content: 'B', importance: 5, decayScore: 0.5 },
    { content: 'C', importance: 7, decayScore: 0.8 },
  ]

  it('ranks highest importance*decay first', () => {
    // A: 0.8*0.9=0.72, C: 0.7*0.8=0.56, B: 0.5*0.5=0.25
    const ranked = rankByRelevance(items)
    expect(ranked[0].content).toBe('A')
    expect(ranked[2].content).toBe('B')
  })

  it('returns all items', () => {
    expect(rankByRelevance(items)).toHaveLength(3)
  })

  it('does not mutate the original array', () => {
    const copy = [...items]
    rankByRelevance(items)
    expect(items[0].content).toBe(copy[0].content)
  })
})

describe('retrieveMemoryContext', () => {
  it('returns memories array', async () => {
    const ctx = await retrieveMemoryContext('user_123', 'squat form')
    expect(ctx.memories).toBeInstanceOf(Array)
    expect(ctx.totalRetrieved).toBeGreaterThan(0)
  })

  it('respects limit option', async () => {
    const ctx = await retrieveMemoryContext('user_123', 'nutrition', { limit: 1 })
    expect(ctx.memories.length).toBeLessThanOrEqual(1)
  })

  it('returns empty context when no memories', async () => {
    const { prisma } = await import('@/lib/db/client')
    ;(prisma.$queryRaw as any).mockResolvedValueOnce([])
    const ctx = await retrieveMemoryContext('user_123', 'anything')
    expect(ctx.memories).toHaveLength(0)
    expect(ctx.totalRetrieved).toBe(0)
  })

  it('returns empty context on DB error without throwing', async () => {
    const { prisma } = await import('@/lib/db/client')
    ;(prisma.$queryRaw as any).mockRejectedValueOnce(new Error('DB down'))
    const ctx = await retrieveMemoryContext('user_123', 'query')
    expect(ctx.memories).toHaveLength(0)
  })
})

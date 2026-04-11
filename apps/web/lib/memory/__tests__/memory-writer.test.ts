import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateImportance, calculateDecayScore, writeSessionMemory } from '../memory-writer'
import type { SessionMemoryInput } from '../types'

vi.mock('@/lib/db/client', () => ({
  prisma: {
    userMemoryEmbedding: {
      create: vi.fn().mockResolvedValue({ id: 'mem_1' }),
    },
  },
}))

vi.mock('@/lib/embeddings/client', () => ({
  createEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}))

const mockInput: SessionMemoryInput = {
  userId: 'user_123',
  sessionId: 'session_abc',
  exercises: [
    {
      name: 'Barbell Squat',
      sets: [
        { setNumber: 1, reps: 5, weightKg: 120, formScore: 90 },
        { setNumber: 2, reps: 5, weightKg: 120, formScore: 88 },
      ],
      avgFormScore: 89,
    },
  ],
  durationSeconds: 2700,
  overallFormScore: 89,
  caloriesBurned: 380,
  notes: null,
}

describe('calculateImportance', () => {
  it('returns high importance for high form score', () => {
    expect(
      calculateImportance({ overallFormScore: 95, totalVolume: 1000, hasPainNote: false })
    ).toBeGreaterThanOrEqual(8)
  })

  it('returns high importance when pain note exists regardless of form score', () => {
    expect(
      calculateImportance({ overallFormScore: 60, totalVolume: 500, hasPainNote: true })
    ).toBeGreaterThanOrEqual(8)
  })

  it('returns moderate importance for average session', () => {
    const score = calculateImportance({
      overallFormScore: 70,
      totalVolume: 1000,
      hasPainNote: false,
    })
    expect(score).toBeGreaterThanOrEqual(4)
    expect(score).toBeLessThanOrEqual(7)
  })

  it('clamps result between 1 and 10', () => {
    expect(
      calculateImportance({ overallFormScore: 5, totalVolume: 0, hasPainNote: false })
    ).toBeGreaterThanOrEqual(1)
    expect(
      calculateImportance({ overallFormScore: 100, totalVolume: 10000, hasPainNote: true })
    ).toBeLessThanOrEqual(10)
  })
})

describe('calculateDecayScore', () => {
  it('returns ~1.0 for a brand new memory', () => {
    expect(calculateDecayScore(new Date(), 'SESSION_SUMMARY')).toBeCloseTo(1.0, 1)
  })

  it('decays over 30 days for sessions', () => {
    const ago = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    expect(calculateDecayScore(ago, 'SESSION_SUMMARY')).toBeCloseTo(0.5, 1)
  })

  it('milestones decay slower than sessions at same age', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    const session = calculateDecayScore(tenDaysAgo, 'SESSION_SUMMARY')
    const milestone = calculateDecayScore(tenDaysAgo, 'MILESTONE')
    expect(milestone).toBeGreaterThan(session)
  })
})

describe('writeSessionMemory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates exactly one memory record', async () => {
    const { prisma } = await import('@/lib/db/client')
    await writeSessionMemory(mockInput)
    expect(prisma.userMemoryEmbedding.create).toHaveBeenCalledOnce()
  })

  it('saves correct userId and type', async () => {
    const { prisma } = await import('@/lib/db/client')
    await writeSessionMemory(mockInput)
    const data = (prisma.userMemoryEmbedding.create as any).mock.calls[0][0].data
    expect(data.userId).toBe('user_123')
    expect(data.type).toBe('SESSION_SUMMARY')
  })

  it('saves sessionId as sourceId', async () => {
    const { prisma } = await import('@/lib/db/client')
    await writeSessionMemory(mockInput)
    const data = (prisma.userMemoryEmbedding.create as any).mock.calls[0][0].data
    expect(data.sourceId).toBe('session_abc')
    expect(data.sourceType).toBe('session')
  })

  it('does not throw when DB fails — logs silently', async () => {
    const { prisma } = await import('@/lib/db/client')
    ;(prisma.userMemoryEmbedding.create as any).mockRejectedValueOnce(new Error('DB error'))
    await expect(writeSessionMemory(mockInput)).resolves.not.toThrow()
  })
})

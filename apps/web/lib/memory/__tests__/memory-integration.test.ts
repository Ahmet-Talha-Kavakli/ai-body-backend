import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db/client', () => ({
  prisma: {
    userMemoryEmbedding: {
      create: vi.fn().mockResolvedValue({ id: 'mem_new' }),
    },
    $queryRaw: vi.fn().mockResolvedValue([
      {
        content: '[Antrenman - 01.04.2026] Squat: 3x5 @ 100kg, form: 88/100',
        importance: 8,
        decayScore: 0.92,
        type: 'SESSION_SUMMARY',
      },
    ]),
  },
}))

vi.mock('@/lib/embeddings/client', () => ({
  createEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0.05)),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn() },
}))

describe('Memory Layer — End-to-End', () => {
  beforeEach(() => vi.clearAllMocks())

  it('full session memory write flow works', async () => {
    const { writeSessionMemory } = await import('../memory-writer')
    const { prisma } = await import('@/lib/db/client')

    await writeSessionMemory({
      userId: 'user_e2e',
      sessionId: 'sess_e2e',
      exercises: [
        {
          name: 'Barbell Squat',
          sets: [
            { setNumber: 1, reps: 5, weightKg: 110, formScore: 90 },
            { setNumber: 2, reps: 5, weightKg: 110, formScore: 88 },
          ],
          avgFormScore: 89,
        },
      ],
      durationSeconds: 3000,
      overallFormScore: 89,
      caloriesBurned: 420,
      notes: null,
    })

    expect(prisma.userMemoryEmbedding.create).toHaveBeenCalledOnce()
    const data = (prisma.userMemoryEmbedding.create as any).mock.calls[0][0].data
    expect(data.userId).toBe('user_e2e')
    expect(data.content).toContain('Barbell Squat')
    expect(data.importance).toBeGreaterThanOrEqual(1)
    expect(data.decayScore).toBeCloseTo(1.0, 1)
    expect(data.type).toBe('SESSION_SUMMARY')
  })

  it('retrieve → inject pipeline: memories appear in prompt', async () => {
    const { injectMemoryIntoPrompt } = await import('../prompt-injector')

    const result = await injectMemoryIntoPrompt('user_e2e', 'squat coaching', 'Sen bir koçsun.')

    expect(result).toContain('Sen bir koçsun.')
    expect(result).toContain('KULLANICI GEÇMİŞİ')
    expect(result).toContain('Squat')
  })

  it('DB write failure does not crash the caller', async () => {
    const { prisma } = await import('@/lib/db/client')
    ;(prisma.userMemoryEmbedding.create as any).mockRejectedValueOnce(new Error('DB down'))

    const { writeSessionMemory } = await import('../memory-writer')

    await expect(
      writeSessionMemory({
        userId: 'user_e2e',
        sessionId: 'sess_fail',
        exercises: [],
        durationSeconds: 0,
        overallFormScore: null,
        caloriesBurned: null,
        notes: null,
      })
    ).resolves.not.toThrow()
  })

  it('memory retrieval failure returns empty context without throwing', async () => {
    const { prisma } = await import('@/lib/db/client')
    ;(prisma.$queryRaw as any).mockRejectedValueOnce(new Error('pgvector down'))

    const { retrieveMemoryContext } = await import('../memory-retriever')
    const ctx = await retrieveMemoryContext('user_e2e', 'anything')

    expect(ctx.memories).toHaveLength(0)
    expect(ctx.totalRetrieved).toBe(0)
  })
})

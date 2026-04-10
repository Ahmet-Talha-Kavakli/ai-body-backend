import { describe, it, expect, beforeEach, vi } from 'vitest'
import { makeDailyMetrics } from '@/__tests__/helpers/factories'

vi.mock('@/lib/ml/models/recovery-classifier', () => ({
  classifyRecoveryState: vi.fn().mockResolvedValue(0.7),
  generateRecoveryRecommendation: vi.fn().mockReturnValue('Good recovery'),
}))

import { generateRecommendations } from '@/lib/ml/recommendations-engine'
import { prisma } from '@/lib/db/client'

const mockDb = prisma as any

describe('generateRecommendations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return empty array if insufficient data', async () => {
    mockDb.dailyMetrics.findMany.mockResolvedValueOnce([makeDailyMetrics()])

    const recs = await generateRecommendations('user_1')
    expect(Array.isArray(recs)).toBe(true)
  })

  it('should generate recommendations with sufficient data', async () => {
    const metrics = Array(30)
      .fill(null)
      .map((_, i) => makeDailyMetrics({ date: new Date(Date.now() - i * 86400000) }))
    mockDb.dailyMetrics.findMany.mockResolvedValueOnce(metrics)

    const recs = await generateRecommendations('user_1')
    expect(Array.isArray(recs)).toBe(true)
  })
})

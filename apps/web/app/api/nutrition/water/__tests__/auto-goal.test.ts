import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockDb = {
  user: { findUnique: vi.fn() },
  healthProfile: { findUnique: vi.fn() },
  waterSettings: { findUnique: vi.fn(), upsert: vi.fn() },
}

vi.mock('@/lib/db/client', () => ({ db: mockDb }))
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_123' }),
}))

describe('POST /api/nutrition/water/auto-goal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.user.findUnique.mockResolvedValue({ id: 'user_1' })
  })

  it('calculates goal from weight when isManualGoal is false', async () => {
    mockDb.healthProfile.findUnique.mockResolvedValue({ weightKg: 70 })
    mockDb.waterSettings.findUnique.mockResolvedValue({ isManualGoal: false, dailyGoalMl: 2500 })
    mockDb.waterSettings.upsert.mockResolvedValue({ dailyGoalMl: 2310 })

    const req = new NextRequest('http://localhost/api/nutrition/water/auto-goal', {
      method: 'POST',
    })

    const { POST } = await import('../auto-goal/route')
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.dailyGoalMl).toBe(2310) // 70 * 33
    expect(mockDb.waterSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ dailyGoalMl: 2310 }),
      })
    )
  })

  it('does NOT update goal when isManualGoal is true', async () => {
    mockDb.healthProfile.findUnique.mockResolvedValue({ weightKg: 70 })
    mockDb.waterSettings.findUnique.mockResolvedValue({ isManualGoal: true, dailyGoalMl: 3000 })

    const req = new NextRequest('http://localhost/api/nutrition/water/auto-goal', {
      method: 'POST',
    })

    const { POST } = await import('../auto-goal/route')
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.dailyGoalMl).toBe(3000)
    expect(mockDb.waterSettings.upsert).not.toHaveBeenCalled()
  })

  it('returns 2500 default when no health profile', async () => {
    mockDb.healthProfile.findUnique.mockResolvedValue(null)
    mockDb.waterSettings.findUnique.mockResolvedValue({ isManualGoal: false, dailyGoalMl: 2500 })

    const req = new NextRequest('http://localhost/api/nutrition/water/auto-goal', {
      method: 'POST',
    })

    const { POST } = await import('../auto-goal/route')
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.dailyGoalMl).toBe(2500)
    expect(mockDb.waterSettings.upsert).not.toHaveBeenCalled()
  })
})

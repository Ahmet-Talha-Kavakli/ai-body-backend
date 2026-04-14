import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockDb = {
  user: { findUnique: vi.fn() },
  waterSettings: { findUnique: vi.fn(), upsert: vi.fn() },
}

vi.mock('@/lib/db/client', () => ({ db: mockDb }))
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_123' }),
}))

describe('PUT /api/nutrition/water/settings - reminder fields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.user.findUnique.mockResolvedValue({ id: 'user_1' })
  })

  it('saves reminderMode and reminderIntervalHours', async () => {
    mockDb.waterSettings.upsert.mockResolvedValue({
      dailyGoalMl: 2500,
      cupSizeMl: 200,
      reminderMode: 'interval',
      reminderIntervalHours: 3,
      reminderTimes: [],
      isManualGoal: false,
      city: null,
      tempBonusMl: 0,
    })

    const req = new NextRequest('http://localhost/api/nutrition/water/settings', {
      method: 'PUT',
      body: JSON.stringify({
        dailyGoalMl: 2500,
        cupSizeMl: 200,
        reminderMode: 'interval',
        reminderIntervalHours: 3,
        reminderTimes: [],
        isManualGoal: false,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const { PUT } = await import('../settings/route')
    const res = await PUT(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockDb.waterSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          reminderMode: 'interval',
          reminderIntervalHours: 3,
        }),
      })
    )
  })

  it('saves manual reminder times', async () => {
    mockDb.waterSettings.upsert.mockResolvedValue({})

    const req = new NextRequest('http://localhost/api/nutrition/water/settings', {
      method: 'PUT',
      body: JSON.stringify({
        dailyGoalMl: 2500,
        cupSizeMl: 200,
        reminderMode: 'manual',
        reminderIntervalHours: 2,
        reminderTimes: ['09:00', '12:00', '18:00'],
        isManualGoal: false,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const { PUT } = await import('../settings/route')
    const res = await PUT(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(mockDb.waterSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          reminderMode: 'manual',
          reminderTimes: ['09:00', '12:00', '18:00'],
        }),
      })
    )
  })
})

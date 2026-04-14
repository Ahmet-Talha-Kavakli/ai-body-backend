import { describe, it, expect, vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_123' }),
}))

const mockUser = { id: 'user_1' }
const mockSettings = { dailyGoalMl: 2500, cupSizeMl: 200 }
const mockStreak = { currentStreak: 3, longestStreak: 7, totalDaysGoal: 10 }
const mockLog = { id: 'log_1', glasses: 4, amountMl: 800, date: new Date() }

vi.mock('@/lib/db/client', () => ({
  db: {
    user: { findUnique: vi.fn().mockResolvedValue(mockUser) },
    waterLog: {
      upsert: vi.fn().mockResolvedValue(mockLog),
      findUnique: vi.fn().mockResolvedValue(mockLog),
      findMany: vi.fn().mockResolvedValue([mockLog]),
    },
    waterSettings: {
      upsert: vi.fn().mockResolvedValue(mockSettings),
      findUnique: vi.fn().mockResolvedValue(mockSettings),
    },
    waterStreak: {
      upsert: vi.fn().mockResolvedValue(mockStreak),
      findUnique: vi.fn().mockResolvedValue(mockStreak),
    },
  },
}))

describe('GET /api/nutrition/water/history', () => {
  it('returns weekly history', async () => {
    const { GET } = await import('../history/route')
    const req = new Request('http://localhost/api/nutrition/water/history?period=week')
    const response = await GET(req as any)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(Array.isArray(data.history)).toBe(true)
  })

  it('returns monthly history', async () => {
    const { GET } = await import('../history/route')
    const req = new Request('http://localhost/api/nutrition/water/history?period=month')
    const response = await GET(req as any)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(Array.isArray(data.history)).toBe(true)
  })
})

describe('GET /api/nutrition/water/settings', () => {
  it('returns user water settings', async () => {
    const { GET } = await import('../settings/route')
    const response = await GET()
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(typeof data.settings.dailyGoalMl).toBe('number')
    expect(typeof data.settings.cupSizeMl).toBe('number')
  })
})

describe('PUT /api/nutrition/water/settings', () => {
  it('updates water settings', async () => {
    const { PUT } = await import('../settings/route')
    const req = new Request('http://localhost/api/nutrition/water/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dailyGoalMl: 3000, cupSizeMl: 250 }),
    })
    const response = await PUT(req as any)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

describe('GET /api/nutrition/water/streak', () => {
  it('returns streak data', async () => {
    const { GET } = await import('../streak/route')
    const response = await GET()
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(typeof data.streak.currentStreak).toBe('number')
    expect(typeof data.streak.longestStreak).toBe('number')
  })
})

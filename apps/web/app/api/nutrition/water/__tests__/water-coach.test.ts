import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

process.env.CRON_SECRET = 'test-secret'

const mockDb = {
  user: { findUnique: vi.fn() },
  waterLog: { findUnique: vi.fn(), upsert: vi.fn() },
  waterSettings: { findUnique: vi.fn() },
  waterStreak: { findUnique: vi.fn(), upsert: vi.fn() },
}

vi.mock('@/lib/db/client', () => ({ db: mockDb }))
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_123' }),
}))

const mockCreate = vi.fn()
vi.mock('@/lib/ai/client', () => ({
  openai: {
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  },
}))

describe('POST /api/nutrition/water - coach message', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.user.findUnique.mockResolvedValue({ id: 'user_1' })
    mockDb.waterSettings.findUnique.mockResolvedValue({ cupSizeMl: 200, dailyGoalMl: 2500 })
    mockDb.waterLog.findUnique.mockResolvedValue(null)
    mockDb.waterLog.upsert.mockResolvedValue({ glasses: 1, amountMl: 200 })
    mockDb.waterStreak.findUnique.mockResolvedValue(null)
    mockDb.waterStreak.upsert.mockResolvedValue({})
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Harika, güne iyi başladın!' } }],
    })
  })

  it('returns coachMessage in response after adding water', async () => {
    const req = new NextRequest('http://localhost/api/nutrition/water', {
      method: 'POST',
      body: JSON.stringify({ ml: 200 }),
      headers: { 'Content-Type': 'application/json' },
    })

    const { POST } = await import('../route')
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.coachMessage).toBe('Harika, güne iyi başladın!')
  })

  it('returns null coachMessage if AI fails', async () => {
    mockCreate.mockRejectedValue(new Error('AI error'))

    const req = new NextRequest('http://localhost/api/nutrition/water', {
      method: 'POST',
      body: JSON.stringify({ ml: 200 }),
      headers: { 'Content-Type': 'application/json' },
    })

    const { POST } = await import('../route')
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.coachMessage).toBeNull()
  })
})

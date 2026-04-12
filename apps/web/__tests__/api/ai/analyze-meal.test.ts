import { POST } from '@/app/api/ai/analyze-meal/route'
import { NextRequest } from 'next/server'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: null }),
}))
vi.mock('@/lib/redis/ratelimit-middleware', () => ({
  withAiRateLimit: vi.fn().mockResolvedValue(null),
}))
vi.mock('@/lib/db/client', () => ({
  db: {
    user: { findUnique: vi.fn() },
    subscription: { update: vi.fn().mockResolvedValue({}) },
    mealLog: { create: vi.fn().mockResolvedValue({}) },
  },
}))
vi.mock('@/lib/ai/client', () => ({
  openai: { chat: { completions: { create: vi.fn() } } },
}))
vi.mock('@/lib/memory', () => ({
  retrieveMemoryContext: vi.fn().mockResolvedValue([]),
  injectMemoryIntoPrompt: vi.fn((p: string) => p),
}))
vi.mock('@/lib/stripe/plans', () => ({
  getPlanLimits: vi.fn().mockReturnValue({ aiMeals: 20 }),
  canUseFeatureWithLimit: vi.fn().mockReturnValue(true),
  isUsageResetNeeded: vi.fn().mockReturnValue(false),
}))

const validBase64 = Buffer.from('fake image data').toString('base64')

const mockUser = {
  id: 'db-1',
  clerkId: 'user_123',
  subscriptionTier: 'STANDARD',
  subscription: { id: 'sub-1', aiMealsUsed: 0, usageResetAt: new Date(Date.now() - 1000) },
}

describe('POST /api/ai/analyze-meal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    const req = new NextRequest('http://localhost/api/ai/analyze-meal', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: validBase64 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid base64 (special chars)', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as any)

    const req = new NextRequest('http://localhost/api/ai/analyze-meal', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: 'not!!valid!!base64' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing imageBase64', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as any)

    const req = new NextRequest('http://localhost/api/ai/analyze-meal', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 404 when user not found in DB', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as any)
    const { db } = await import('@/lib/db/client')
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost/api/ai/analyze-meal', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: validBase64 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('returns 403 when plan has no meal analysis access', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as any)
    const { db } = await import('@/lib/db/client')
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      ...mockUser,
      subscriptionTier: 'FREE',
    } as any)
    const { getPlanLimits } = await import('@/lib/stripe/plans')
    vi.mocked(getPlanLimits).mockReturnValueOnce({ aiMeals: 0 } as any)

    const req = new NextRequest('http://localhost/api/ai/analyze-meal', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: validBase64 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns 200 with analysis on success', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as any)
    const { db } = await import('@/lib/db/client')
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(mockUser as any)
    const { openai } = await import('@/lib/ai/client')
    vi.mocked(openai.chat.completions.create).mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              foodItems: [
                { name: 'Tavuk', portion: '200g', calories: 300, proteinG: 40, carbsG: 0, fatG: 8 },
              ],
              totalCalories: 300,
              totalProteinG: 40,
              totalCarbsG: 0,
              totalFatG: 8,
              confidence: 'high',
              notes: 'Izgara tavuk',
            }),
          },
        },
      ],
    } as any)

    const req = new NextRequest('http://localhost/api/ai/analyze-meal', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: validBase64, mealType: 'lunch' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.analysis).toBeDefined()
  })
})

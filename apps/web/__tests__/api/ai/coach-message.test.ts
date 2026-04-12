import { POST } from '@/app/api/ai/coach-message/route'
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
  getPlanLimits: vi.fn().mockReturnValue({ aiCoach: 100 }),
  canUseFeatureWithLimit: vi.fn().mockReturnValue(true),
  isUsageResetNeeded: vi.fn().mockReturnValue(false),
}))

const validBody = {
  exercise: 'squat',
  repCount: 5,
  targetReps: 10,
  setNumber: 1,
  totalSets: 3,
}

describe('POST /api/ai/coach-message', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any)

    const req = new NextRequest('http://localhost/api/ai/coach-message', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 404 when user not found in DB', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as any)
    const { db } = await import('@/lib/db/client')
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost/api/ai/coach-message', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('returns 200 with fallback message for free tier (aiCoach limit = 0)', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as any)
    const { db } = await import('@/lib/db/client')
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: 'db-1',
      clerkId: 'user_123',
      subscriptionTier: 'FREE',
      subscription: null,
    } as any)
    const { getPlanLimits } = await import('@/lib/stripe/plans')
    vi.mocked(getPlanLimits).mockReturnValueOnce({ aiCoach: 0 } as any)

    const req = new NextRequest('http://localhost/api/ai/coach-message', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBeDefined()
  })

  it('returns 200 with AI message on success', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as any)
    const { db } = await import('@/lib/db/client')
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: 'db-1',
      clerkId: 'user_123',
      subscriptionTier: 'STANDARD',
      subscription: { id: 'sub-1', aiCoachUsed: 0, usageResetAt: new Date(Date.now() - 1000) },
    } as any)
    const { openai } = await import('@/lib/ai/client')
    vi.mocked(openai.chat.completions.create).mockResolvedValueOnce({
      choices: [{ message: { content: 'Harika gidiyorsun!' } }],
    } as any)

    const req = new NextRequest('http://localhost/api/ai/coach-message', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('Harika gidiyorsun!')
  })

  it('returns fallback message when rate limited', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as any)
    const { withAiRateLimit } = await import('@/lib/redis/ratelimit-middleware')
    vi.mocked(withAiRateLimit).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 }) as any
    )

    const req = new NextRequest('http://localhost/api/ai/coach-message', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(429)
  })
})

import { POST } from '@/app/api/onboarding/route'
import { NextRequest } from 'next/server'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_test123' }),
}))

vi.mock('@/lib/db/client', () => ({
  db: {
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'db-user-1', clerkId: 'user_test123' }),
    },
    healthProfile: { upsert: vi.fn().mockResolvedValue({}) },
    injury: {
      updateMany: vi.fn().mockResolvedValue({}),
      createMany: vi.fn().mockResolvedValue({}),
    },
  },
}))

describe('POST /api/onboarding', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 for malformed JSON body', async () => {
    const req = new NextRequest('http://localhost/api/onboarding', {
      method: 'POST',
      body: '{ invalid json !!!',
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('returns 200 for valid onboarding data', async () => {
    const req = new NextRequest('http://localhost/api/onboarding', {
      method: 'POST',
      body: JSON.stringify({ fitnessLevel: 'beginner', goals: ['lose_weight'], injuries: [] }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('returns 401 when unauthenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any)
    const req = new NextRequest('http://localhost/api/onboarding', {
      method: 'POST',
      body: JSON.stringify({ fitnessLevel: 'beginner' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})

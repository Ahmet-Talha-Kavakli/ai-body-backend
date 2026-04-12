import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/fitness-coach/session/route'
import { NextRequest } from 'next/server'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))
vi.mock('@/lib/db/client', () => ({
  prisma: {
    healthProfile: { findUnique: vi.fn() },
    workoutSession: { count: vi.fn() },
    fitnessCoachSession: { create: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}))

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/client'

describe('GET /api/fitness-coach/session', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)
    const res = await GET(new NextRequest('http://localhost/api/fitness-coach/session'))
    expect(res.status).toBe(401)
  })

  it('returns coach profile when authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'u1' } as any)
    vi.mocked(prisma.healthProfile.findUnique).mockResolvedValue({
      weightKg: 80,
      heightCm: 178,
      fitnessLevel: 'intermediate',
      injuries: [],
      goals: [],
      supplements: [],
    } as any)
    vi.mocked(prisma.workoutSession.count).mockResolvedValue(15)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Ahmet' } as any)
    const res = await GET(new NextRequest('http://localhost/api/fitness-coach/session'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.profile).toBeDefined()
    expect(data.systemPrompt).toBeDefined()
  })
})

describe('POST /api/fitness-coach/session', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)
    const req = new NextRequest('http://localhost/api/fitness-coach/session', {
      method: 'POST',
      body: JSON.stringify({ transcript: [] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('saves transcript and returns 201', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'u1' } as any)
    vi.mocked(prisma.fitnessCoachSession.create).mockResolvedValue({ id: 'sess1' } as any)
    const req = new NextRequest('http://localhost/api/fitness-coach/session', {
      method: 'POST',
      body: JSON.stringify({
        transcript: [{ speaker: 'assistant', text: 'Merhaba!', timestamp: 1 }],
        durationSeconds: 120,
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })
})

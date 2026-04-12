import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/character/morph/route'
import { NextRequest } from 'next/server'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))
vi.mock('@/lib/db/client', () => ({
  db: { user: { findUnique: vi.fn() } },
}))

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

describe('GET /api/character/morph', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)
    const res = await GET(new NextRequest('http://localhost/api/character/morph'))
    expect(res.status).toBe(401)
  })

  it('returns cached morph params when present', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk_u1' } as any)
    const cached = {
      bmi: 22,
      muscleLevel: 0.3,
      heightNorm: 1.0,
      gender: 'male',
      fitnessLevel: 'intermediate',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    vi.mocked(db.user.findUnique).mockResolvedValue({ characterMorphCache: cached } as any)
    const res = await GET(new NextRequest('http://localhost/api/character/morph'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.bmi).toBe(22)
  })

  it('returns default params when cache is null', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk_u1' } as any)
    vi.mocked(db.user.findUnique).mockResolvedValue({ characterMorphCache: null } as any)
    const res = await GET(new NextRequest('http://localhost/api/character/morph'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.bmi).toBe(22)
    expect(data.fitnessLevel).toBe('beginner')
  })
})

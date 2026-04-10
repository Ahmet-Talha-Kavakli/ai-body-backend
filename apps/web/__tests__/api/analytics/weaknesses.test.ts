import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/api/user/weaknesses/route'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/client'

const mockAuth = auth as any
const mockDb = prisma as any

describe('GET /api/user/weaknesses', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return 401 if not authenticated', async () => {
    mockAuth.mockReturnValueOnce({ userId: null })
    const req = new Request('http://localhost/api/user/weaknesses')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('should return empty array if no weaknesses', async () => {
    mockAuth.mockReturnValueOnce({ userId: 'user_1' })
    mockDb.userWeakness.findMany.mockResolvedValueOnce([])

    const req = new Request('http://localhost/api/user/weaknesses')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.data).toEqual([])
  })

  it('should return weaknesses sorted by severity', async () => {
    mockAuth.mockReturnValueOnce({ userId: 'user_1' })
    mockDb.userWeakness.findMany.mockResolvedValueOnce([
      { id: 'w1', userId: 'user_1', muscleGroup: 'biceps', severity: 'high' },
      { id: 'w2', userId: 'user_1', muscleGroup: 'shoulders', severity: 'medium' },
    ])

    const req = new Request('http://localhost/api/user/weaknesses')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.data.length).toBe(2)
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { makeUser, makeLeaderboard } from '@/__tests__/helpers/factories'
import { GET } from '@/app/api/user/leaderboard/[type]/route'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

const mockAuth = auth as any
const mockDb = db as any

describe('GET /api/user/leaderboard/[type]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return 401 if not authenticated', async () => {
    mockAuth.mockReturnValueOnce({ userId: null })
    const req = new Request('http://localhost/api/user/leaderboard/form_score')
    const res = await GET(req, { params: Promise.resolve({ type: 'form_score' }) })
    expect(res.status).toBe(401)
  })

  it('should return 404 if user not found', async () => {
    mockAuth.mockReturnValueOnce({ userId: 'clerk_test_user_1' })
    mockDb.user.findUnique.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/user/leaderboard/form_score')
    const res = await GET(req, { params: Promise.resolve({ type: 'form_score' }) })
    expect(res.status).toBe(404)
  })

  it('should return 400 for invalid leaderboard type', async () => {
    mockAuth.mockReturnValueOnce({ userId: 'clerk_test_user_1' })
    mockDb.user.findUnique.mockResolvedValueOnce(makeUser())

    const req = new Request('http://localhost/api/user/leaderboard/invalid') as any
    req.nextUrl = new URL('http://localhost/api/user/leaderboard/invalid')
    const res = await GET(req, { params: Promise.resolve({ type: 'invalid' }) })
    expect(res.status).toBe(400)
  })

  it('should return leaderboard with entries', async () => {
    mockAuth.mockReturnValueOnce({ userId: 'clerk_test_user_1' })
    mockDb.user.findUnique.mockResolvedValueOnce(makeUser())
    mockDb.leaderboard.findUnique.mockResolvedValueOnce(makeLeaderboard())

    const req = new Request('http://localhost/api/user/leaderboard/form_score?period=weekly') as any
    req.nextUrl = new URL('http://localhost/api/user/leaderboard/form_score?period=weekly')
    const res = await GET(req, { params: Promise.resolve({ type: 'form_score' }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.leaderboard).toBeDefined()
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { makeUser, makeActivity } from '@/__tests__/helpers/factories'
import { POST } from '@/app/api/user/activity/log/route'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

const mockAuth = auth as any
const mockDb = db as any

describe('POST /api/user/activity/log', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return 401 if not authenticated', async () => {
    mockAuth.mockReturnValueOnce({ userId: null })
    const req = new Request('http://localhost/api/user/activity/log', {
      method: 'POST',
      body: JSON.stringify({ activityType: 'workout_completed', description: 'test' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('should return 404 if user not found', async () => {
    mockAuth.mockReturnValueOnce({ userId: 'clerk_test_user_1' })
    mockDb.user.findUnique.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/user/activity/log', {
      method: 'POST',
      body: JSON.stringify({ activityType: 'workout_completed', description: 'test' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('should return 400 for invalid activity type', async () => {
    mockAuth.mockReturnValueOnce({ userId: 'clerk_test_user_1' })
    mockDb.user.findUnique.mockResolvedValueOnce(makeUser())

    const req = new Request('http://localhost/api/user/activity/log', {
      method: 'POST',
      body: JSON.stringify({ activityType: 'invalid', description: 'test' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('should create activity on success', async () => {
    mockAuth.mockReturnValueOnce({ userId: 'clerk_test_user_1' })
    mockDb.user.findUnique.mockResolvedValueOnce(makeUser())
    mockDb.userActivity.create.mockResolvedValueOnce(makeActivity())

    const req = new Request('http://localhost/api/user/activity/log', {
      method: 'POST',
      body: JSON.stringify({
        activityType: 'workout_completed',
        description: 'Upper body',
        visibility: 'friends_only',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { makeUser, makeFriendship, makeActivity } from '@/__tests__/helpers/factories'
import { GET } from '@/app/api/user/activity/feed/route'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

const mockAuth = auth as any
const mockDb = db as any

describe('GET /api/user/activity/feed', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return 401 if not authenticated', async () => {
    mockAuth.mockReturnValueOnce({ userId: null })
    const req = new Request('http://localhost/api/user/activity/feed')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('should return 404 if user not found', async () => {
    mockAuth.mockReturnValueOnce({ userId: 'clerk_test_user_1' })
    mockDb.user.findUnique.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/user/activity/feed')
    const res = await GET(req)
    expect(res.status).toBe(404)
  })

  it('should return empty activities if no friends', async () => {
    mockAuth.mockReturnValueOnce({ userId: 'clerk_test_user_1' })
    mockDb.user.findUnique.mockResolvedValueOnce(makeUser())
    mockDb.userFriend.findMany.mockResolvedValueOnce([])
    mockDb.userActivity.findMany.mockResolvedValueOnce([])

    const req = new Request('http://localhost/api/user/activity/feed')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.activities).toEqual([])
  })

  it('should return friends activities', async () => {
    const user = makeUser({ id: 'user_1' })
    const friend = makeUser({ id: 'user_2' })
    const friendship = makeFriendship({
      userId: user.id,
      friendId: friend.id,
      status: 'accepted',
    })
    const activity = makeActivity({
      userId: friend.id,
      visibility: 'friends_only',
      user: friend,
    })

    mockAuth.mockReturnValueOnce({ userId: 'clerk_test_user_1' })
    mockDb.user.findUnique.mockResolvedValueOnce(user)
    mockDb.userFriend.findMany.mockResolvedValueOnce([friendship])
    mockDb.userActivity.findMany.mockResolvedValueOnce([activity])

    const req = new Request('http://localhost/api/user/activity/feed')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.activities.length).toBe(1)
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { makeUser, makeFriendship } from '@/__tests__/helpers/factories'
import { GET } from '@/app/api/user/friends/list/route'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

const mockAuth = auth as any
const mockDb = db as any

describe('GET /api/user/friends/list', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return 401 if not authenticated', async () => {
    mockAuth.mockReturnValueOnce({ userId: null })
    const req = new Request('http://localhost/api/user/friends/list')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('should return 404 if user not found', async () => {
    mockAuth.mockReturnValueOnce({ userId: 'clerk_test_user_1' })
    mockDb.user.findUnique.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/user/friends/list')
    const res = await GET(req)
    expect(res.status).toBe(404)
  })

  it('should return empty friends list if user has no friends', async () => {
    mockAuth.mockReturnValueOnce({ userId: 'clerk_test_user_1' })
    mockDb.user.findUnique.mockResolvedValueOnce(makeUser())
    mockDb.userFriend.findMany.mockResolvedValueOnce([])

    const req = new Request('http://localhost/api/user/friends/list')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.friends).toEqual([])
    expect(data.count).toBe(0)
  })

  it('should return list of accepted friends', async () => {
    const user = makeUser({ id: 'user_1' })
    const friendUser = makeUser({ id: 'user_2', username: 'alice' })

    mockAuth.mockReturnValueOnce({ userId: 'clerk_test_user_1' })
    mockDb.user.findUnique.mockResolvedValueOnce(user)
    mockDb.userFriend.findMany.mockResolvedValueOnce([
      {
        id: 'friend_1',
        userId: user.id,
        friendId: friendUser.id,
        status: 'accepted',
        requestedAt: new Date(),
        acceptedAt: new Date(),
        friend: friendUser,
        user: user,
      },
    ])

    const req = new Request('http://localhost/api/user/friends/list')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.friends.length).toBe(1)
  })
})

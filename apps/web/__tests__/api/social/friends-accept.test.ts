import { describe, it, expect, beforeEach, vi } from 'vitest'
import { makeFriendship, makeUser } from '@/__tests__/helpers/factories'
import { POST } from '@/app/api/user/friends/accept/route'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

const mockAuth = auth as any
const mockDb = db as any

describe('POST /api/user/friends/accept', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return 401 if not authenticated', async () => {
    mockAuth.mockReturnValueOnce({ userId: null })
    const req = new Request('http://localhost/api/user/friends/accept', {
      method: 'POST',
      body: JSON.stringify({ friendRequestId: 'friend_1' }),
    }) as any
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('should return 404 if user not found', async () => {
    mockAuth.mockReturnValueOnce({ userId: 'clerk_test_user_1' })
    mockDb.user.findUnique.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/user/friends/accept', {
      method: 'POST',
      body: JSON.stringify({ friendRequestId: 'friend_1' }),
    }) as any
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('should return 404 if friend request not found', async () => {
    mockAuth.mockReturnValueOnce({ userId: 'clerk_test_user_1' })
    mockDb.user.findUnique.mockResolvedValueOnce(makeUser())
    mockDb.userFriend.findUnique.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/user/friends/accept', {
      method: 'POST',
      body: JSON.stringify({ friendRequestId: 'friend_1' }),
    }) as any
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('should accept friend request on success', async () => {
    const user = makeUser({ id: 'user_2' })
    const friendRequest = makeFriendship({
      id: 'friend_1',
      userId: 'user_1',
      friendId: 'user_2',
      status: 'pending',
    })

    mockAuth.mockReturnValueOnce({ userId: 'clerk_test_user_1' })
    mockDb.user.findUnique.mockResolvedValueOnce(user)
    mockDb.userFriend.findUnique.mockResolvedValueOnce(friendRequest)
    mockDb.userFriend.update.mockResolvedValueOnce({
      ...friendRequest,
      status: 'accepted',
    })

    const req = new Request('http://localhost/api/user/friends/accept', {
      method: 'POST',
      body: JSON.stringify({ friendRequestId: 'friend_1' }),
    }) as any
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })
})

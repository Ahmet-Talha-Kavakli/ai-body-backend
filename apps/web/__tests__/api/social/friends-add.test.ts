import { describe, it, expect, beforeEach, vi } from 'vitest'
import { makeUser } from '@/__tests__/helpers/factories'
import { POST } from '@/app/api/user/friends/add/route'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

const mockAuth = auth as any
const mockDb = db as any

describe('POST /api/user/friends/add', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if not authenticated', async () => {
    mockAuth.mockReturnValueOnce({ userId: null })
    const req = new Request('http://localhost/api/user/friends/add', {
      method: 'POST',
      body: JSON.stringify({ friendId: 'user_2' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('should return 404 if user not found', async () => {
    mockAuth.mockReturnValueOnce({ userId: 'clerk_test_user_1' })
    mockDb.user.findUnique.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/user/friends/add', {
      method: 'POST',
      body: JSON.stringify({ friendId: 'user_2' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('should return 400 if friendId is missing', async () => {
    mockAuth.mockReturnValueOnce({ userId: 'clerk_test_user_1' })
    mockDb.user.findUnique.mockResolvedValueOnce(makeUser())

    const req = new Request('http://localhost/api/user/friends/add', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('should return 400 if trying to add self as friend', async () => {
    mockAuth.mockReturnValueOnce({ userId: 'clerk_test_user_1' })
    mockDb.user.findUnique.mockResolvedValueOnce(makeUser({ clerkId: 'clerk_test_user_1', id: 'user_1' }))

    const req = new Request('http://localhost/api/user/friends/add', {
      method: 'POST',
      body: JSON.stringify({ friendId: 'user_1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('should create friend request on success', async () => {
    const currentUser = makeUser({ clerkId: 'clerk_test_user_1', id: 'user_1' })
    const friend = makeUser({ id: 'user_2' })
    const newFriendship = {
      id: 'friend_1',
      userId: 'user_1',
      friendId: 'user_2',
      status: 'pending',
      requestedAt: new Date(),
      acceptedAt: null,
    }

    mockAuth.mockReturnValueOnce({ userId: 'clerk_test_user_1' })
    mockDb.user.findUnique
      .mockResolvedValueOnce(currentUser)
      .mockResolvedValueOnce(friend)
    mockDb.userFriend.findFirst.mockResolvedValueOnce(null)
    mockDb.userFriend.create.mockResolvedValueOnce(newFriendship)

    const req = new Request('http://localhost/api/user/friends/add', {
      method: 'POST',
      body: JSON.stringify({ friendId: 'user_2' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.success).toBe(true)
  })
})

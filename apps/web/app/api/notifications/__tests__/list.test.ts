import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db/client', () => ({
  db: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'user-1', clerkId: 'clerk-1' }),
    },
  },
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk-1' }),
}))

import { db } from '@/lib/db/client'
import { auth } from '@clerk/nextjs/server'

describe('GET /api/notifications', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns notifications and unreadCount', async () => {
    const mockNotifs = [
      {
        id: 'n1',
        type: 'achievement',
        title: 'Test',
        body: 'B',
        read: false,
        createdAt: new Date(),
        link: null,
      },
    ]
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-1' } as any)
    vi.mocked(db.notification.findMany).mockResolvedValue(mockNotifs as any)
    vi.mocked(db.notification.count).mockResolvedValue(1)

    const req = new NextRequest('http://localhost/api/notifications')
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.notifications).toHaveLength(1)
    expect(json.unreadCount).toBe(1)
    expect(db.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any)

    const req = new NextRequest('http://localhost/api/notifications')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})

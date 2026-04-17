import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db/client', () => ({
  db: {
    notification: {
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 3 }),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'user-1', clerkId: 'clerk-1' }),
    },
  },
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk-1' }),
}))

import { NextRequest } from 'next/server'
import { db } from '@/lib/db/client'

describe('POST /api/notifications/[id]/read', () => {
  beforeEach(() => vi.clearAllMocks())

  it('marks single notification as read', async () => {
    const { POST } = await import('../[id]/read/route')
    const req = new NextRequest('http://localhost/api/notifications/notif-1/read', {
      method: 'POST',
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'notif-1' }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(db.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1', userId: 'user-1' },
      data: { read: true },
    })
  })
})

describe('POST /api/notifications/read-all', () => {
  it('marks all notifications as read', async () => {
    const { POST } = await import('../read-all/route')
    const req = new NextRequest('http://localhost/api/notifications/read-all', { method: 'POST' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(db.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', read: false },
      data: { read: true },
    })
  })
})

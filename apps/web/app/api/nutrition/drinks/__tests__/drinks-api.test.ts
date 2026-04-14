import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockDb = {
  user: { findUnique: vi.fn() },
  drinkLog: {
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
  },
}

vi.mock('@/lib/db/client', () => ({ db: mockDb }))
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_123' }),
}))

describe('GET /api/nutrition/drinks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.user.findUnique.mockResolvedValue({ id: 'user_1' })
  })

  it('returns today drink logs', async () => {
    mockDb.drinkLog.findMany.mockResolvedValue([
      { id: 'log_1', drinkType: 'coffee', amountMl: 200, createdAt: new Date() },
    ])

    const req = new NextRequest('http://localhost/api/nutrition/drinks')
    const { GET } = await import('../route')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.logs).toHaveLength(1)
    expect(data.logs[0].drinkType).toBe('coffee')
  })
})

describe('POST /api/nutrition/drinks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.user.findUnique.mockResolvedValue({ id: 'user_1' })
  })

  it('creates a drink log', async () => {
    mockDb.drinkLog.create.mockResolvedValue({
      id: 'log_1',
      drinkType: 'tea',
      amountMl: 300,
      createdAt: new Date(),
    })

    const req = new NextRequest('http://localhost/api/nutrition/drinks', {
      method: 'POST',
      body: JSON.stringify({ drinkType: 'tea', amountMl: 300 }),
      headers: { 'Content-Type': 'application/json' },
    })

    const { POST } = await import('../route')
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.log.drinkType).toBe('tea')
  })

  it('rejects invalid drinkType', async () => {
    const req = new NextRequest('http://localhost/api/nutrition/drinks', {
      method: 'POST',
      body: JSON.stringify({ drinkType: 'beer', amountMl: 300 }),
      headers: { 'Content-Type': 'application/json' },
    })

    const { POST } = await import('../route')
    const res = await POST(req)

    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/nutrition/drinks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.user.findUnique.mockResolvedValue({ id: 'user_1' })
  })

  it('deletes a drink log by id', async () => {
    mockDb.drinkLog.findUnique.mockResolvedValue({ id: 'log_1', userId: 'user_1' })
    mockDb.drinkLog.delete.mockResolvedValue({})

    const req = new NextRequest('http://localhost/api/nutrition/drinks', {
      method: 'DELETE',
      body: JSON.stringify({ id: 'log_1' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const { DELETE } = await import('../route')
    const res = await DELETE(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('returns 404 if log not found or belongs to other user', async () => {
    mockDb.drinkLog.findUnique.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/nutrition/drinks', {
      method: 'DELETE',
      body: JSON.stringify({ id: 'log_999' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const { DELETE } = await import('../route')
    const res = await DELETE(req)

    expect(res.status).toBe(404)
  })
})

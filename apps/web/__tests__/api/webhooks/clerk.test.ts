import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock svix Webhook
const mockVerify = vi.fn()
vi.mock('svix', () => ({
  Webhook: vi.fn().mockImplementation(() => ({ verify: mockVerify })),
}))

// Mock db
const mockUserUpsert = vi.fn()
const mockUserUpdate = vi.fn()
const mockUserDelete = vi.fn()
vi.mock('@/lib/db/client', () => ({
  db: {
    user: {
      upsert: mockUserUpsert,
      update: mockUserUpdate,
      delete: mockUserDelete,
    },
  },
}))

// Mock next/headers — return valid svix headers
const mockHeadersGet = vi.fn()
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({ get: mockHeadersGet }),
}))

process.env.CLERK_WEBHOOK_SECRET = 'whsec_clerk_test'

const { POST } = await import('@/app/api/webhooks/clerk/route')

function makeRequest(body: object) {
  return new Request('http://localhost/api/webhooks/clerk', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'svix-id': 'msg_test',
      'svix-timestamp': '1234567890',
      'svix-signature': 'v1,test',
    },
  })
}

describe('Clerk webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHeadersGet.mockImplementation((key: string) => {
      const map: Record<string, string> = {
        'svix-id': 'msg_test',
        'svix-timestamp': '1234567890',
        'svix-signature': 'v1,test',
      }
      return map[key] ?? null
    })
  })

  it('returns 500 when CLERK_WEBHOOK_SECRET is not set', async () => {
    const original = process.env.CLERK_WEBHOOK_SECRET
    delete process.env.CLERK_WEBHOOK_SECRET

    const req = makeRequest({})
    const res = await POST(req)
    expect(res.status).toBe(500)

    process.env.CLERK_WEBHOOK_SECRET = original
  })

  it('returns 400 when svix headers are missing', async () => {
    mockHeadersGet.mockReturnValue(null)
    const req = makeRequest({})
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when svix signature is invalid', async () => {
    mockVerify.mockImplementation(() => {
      throw new Error('Invalid signature')
    })
    const req = makeRequest({})
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('handles user.created — upserts user in DB', async () => {
    mockVerify.mockReturnValue({
      type: 'user.created',
      data: {
        id: 'user_clerk_123',
        email_addresses: [{ email_address: 'test@example.com' }],
        first_name: 'John',
        last_name: 'Doe',
        image_url: 'https://example.com/avatar.jpg',
      },
    })
    mockUserUpsert.mockResolvedValue({})

    const req = makeRequest({})
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockUserUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clerkId: 'user_clerk_123' },
        create: expect.objectContaining({
          clerkId: 'user_clerk_123',
          email: 'test@example.com',
          name: 'John Doe',
        }),
      })
    )
  })

  it('handles user.updated — updates user in DB', async () => {
    mockVerify.mockReturnValue({
      type: 'user.updated',
      data: {
        id: 'user_clerk_123',
        email_addresses: [{ email_address: 'new@example.com' }],
        first_name: 'Jane',
        last_name: 'Doe',
        image_url: 'https://example.com/new-avatar.jpg',
      },
    })
    mockUserUpdate.mockResolvedValue({})

    const req = makeRequest({})
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clerkId: 'user_clerk_123' },
        data: expect.objectContaining({ email: 'new@example.com', name: 'Jane Doe' }),
      })
    )
  })
})

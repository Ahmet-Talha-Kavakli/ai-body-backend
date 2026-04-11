import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock stripe before importing route
const mockConstructEvent = vi.fn()
vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    webhooks: { constructEvent: mockConstructEvent },
  },
}))

// Mock db
const mockSubscriptionUpdate = vi.fn()
const mockSubscriptionFindUnique = vi.fn()
const mockUserUpdate = vi.fn()
vi.mock('@/lib/db/client', () => ({
  db: {
    subscription: {
      update: mockSubscriptionUpdate,
      findUnique: mockSubscriptionFindUnique,
    },
    user: { update: mockUserUpdate },
  },
}))

// Mock next/headers — return a valid signature by default
const mockHeadersGet = vi.fn().mockReturnValue('test-signature')
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({ get: mockHeadersGet }),
}))

// Set required env var
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'

const { POST } = await import('@/app/api/webhooks/stripe/route')

function makeRequest(body: string) {
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    body,
    headers: { 'stripe-signature': 'test-signature' },
  })
}

describe('Stripe webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: valid signature header
    mockHeadersGet.mockReturnValue('test-signature')
  })

  it('returns 400 when signature is missing', async () => {
    mockHeadersGet.mockReturnValue(null)
    const req = makeRequest('{}')
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when constructEvent throws (invalid signature)', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })
    const req = makeRequest('{}')
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('handles checkout.session.completed and updates subscription', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { userId: 'user_123', plan: 'pro' },
          subscription: 'sub_abc',
          expires_at: Math.floor(Date.now() / 1000) + 86400,
        },
      },
    })
    mockSubscriptionUpdate.mockResolvedValue({})
    mockUserUpdate.mockResolvedValue({})

    const req = makeRequest('{}')
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.received).toBe(true)
    expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user_123' },
        data: expect.objectContaining({ tier: 'pro', status: 'active' }),
      })
    )
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user_123' },
        data: { subscriptionTier: 'pro' },
      })
    )
  })

  it('handles customer.subscription.deleted — downgrades to free', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_abc' } },
    })
    mockSubscriptionFindUnique.mockResolvedValue({ id: 'db_sub_1', userId: 'user_123' })
    mockSubscriptionUpdate.mockResolvedValue({})
    mockUserUpdate.mockResolvedValue({})

    const req = makeRequest('{}')
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tier: 'free', status: 'canceled' }),
      })
    )
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { subscriptionTier: 'free' } })
    )
  })

  it('handles invoice.payment_failed — sets past_due', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'invoice.payment_failed',
      data: { object: { customer: 'cus_abc' } },
    })
    mockSubscriptionFindUnique.mockResolvedValue({ id: 'db_sub_1', userId: 'user_123' })
    mockSubscriptionUpdate.mockResolvedValue({})

    const req = makeRequest('{}')
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'past_due' } })
    )
  })

  it('returns 200 and received:true for unknown event types', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'some.unknown.event',
      data: { object: {} },
    })

    const req = makeRequest('{}')
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.received).toBe(true)
  })
})

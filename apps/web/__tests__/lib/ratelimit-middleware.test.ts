import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAiLimit = vi.fn()
const mockApiLimit = vi.fn()

vi.mock('@/lib/redis/client', () => ({
  aiRatelimit: { limit: mockAiLimit },
  apiRatelimit: { limit: mockApiLimit },
}))

const { withAiRateLimit, withApiRateLimit } = await import('@/lib/redis/ratelimit-middleware')

describe('withAiRateLimit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when request is allowed', async () => {
    mockAiLimit.mockResolvedValue({ success: true, limit: 10, reset: Date.now() + 60000, remaining: 9 })
    const result = await withAiRateLimit('user_123')
    expect(result).toBeNull()
  })

  it('returns 429 response when limit exceeded', async () => {
    mockAiLimit.mockResolvedValue({ success: false, limit: 10, reset: Date.now() + 60000, remaining: 0 })
    const result = await withAiRateLimit('user_123')
    expect(result).not.toBeNull()
    expect(result!.status).toBe(429)
  })

  it('calls limit with the userId', async () => {
    mockAiLimit.mockResolvedValue({ success: true, limit: 10, reset: Date.now() + 60000, remaining: 9 })
    await withAiRateLimit('user_abc')
    expect(mockAiLimit).toHaveBeenCalledWith('user_abc')
  })
})

describe('withApiRateLimit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when request is allowed', async () => {
    mockApiLimit.mockResolvedValue({ success: true, limit: 100, reset: Date.now() + 60000, remaining: 99 })
    const result = await withApiRateLimit('user_123')
    expect(result).toBeNull()
  })

  it('returns 429 response when limit exceeded', async () => {
    mockApiLimit.mockResolvedValue({ success: false, limit: 100, reset: Date.now() + 60000, remaining: 0 })
    const result = await withApiRateLimit('user_123')
    expect(result).not.toBeNull()
    expect(result!.status).toBe(429)
  })
})

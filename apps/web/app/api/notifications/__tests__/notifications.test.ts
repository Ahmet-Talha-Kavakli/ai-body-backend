import { describe, it, expect, vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_123' }),
}))

vi.mock('@/lib/db/client', () => ({
  db: {
    user: { findUnique: vi.fn().mockResolvedValue({ id: 'user_1' }) },
    notificationPreference: {
      upsert: vi.fn().mockResolvedValue({
        id: 'pref_1',
        webPushEnabled: true,
        webPushEndpoint: 'https://push.example.com/endpoint',
        mobilePushEnabled: false,
        expoPushToken: null,
        waterReminder: true,
        mealReminder: true,
        smartCalorie: true,
      }),
      findUnique: vi.fn().mockResolvedValue({
        webPushEnabled: true,
        mobilePushEnabled: false,
        waterReminder: true,
        mealReminder: true,
        smartCalorie: true,
      }),
    },
  },
}))

describe('POST /api/notifications/register', () => {
  it('registers web push subscription', async () => {
    const { POST } = await import('../register/route')
    const req = new Request('http://localhost/api/notifications/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'web',
        endpoint: 'https://push.example.com/endpoint',
        auth: 'auth_key',
        p256dh: 'p256dh_key',
      }),
    })
    const response = await POST(req as any)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('registers expo push token', async () => {
    const { POST } = await import('../register/route')
    const req = new Request('http://localhost/api/notifications/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'expo',
        token: 'ExponentPushToken[xxxxxx]',
      }),
    })
    const response = await POST(req as any)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

describe('GET /api/notifications/preferences', () => {
  it('returns user notification preferences', async () => {
    const { GET } = await import('../preferences/route')
    const response = await GET()
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(typeof data.prefs.waterReminder).toBe('boolean')
  })
})

describe('PUT /api/notifications/preferences', () => {
  it('updates notification preferences', async () => {
    const { PUT } = await import('../preferences/route')
    const req = new Request('http://localhost/api/notifications/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waterReminder: false, mealReminder: true, smartCalorie: true }),
    })
    const response = await PUT(req as any)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

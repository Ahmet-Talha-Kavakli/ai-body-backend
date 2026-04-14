import { describe, it, expect, vi } from 'vitest'

process.env.CRON_SECRET = 'test-secret'

vi.mock('@/lib/db/client', () => ({
  db: {
    notificationPreference: {
      findMany: vi.fn().mockResolvedValue([
        {
          userId: 'user_1',
          webPushEnabled: true,
          webPushEndpoint: 'https://push.example.com',
          webPushAuth: 'auth',
          webPushP256dh: 'p256dh',
          smartCalorie: true,
          user: {
            mealLogs: [{ totalCalories: 800 }],
            nutritionGoal: { dailyCalories: 2000 },
          },
        },
      ]),
    },
  },
}))

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({}),
  },
}))

describe('GET /api/cron/smart-notification', () => {
  it('returns 200 and sent count', async () => {
    const { GET } = await import('../route')
    const req = new Request('http://localhost/api/cron/smart-notification', {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? 'test-secret'}` },
    })
    const response = await GET(req as any)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(typeof data.sent).toBe('number')
  })
})

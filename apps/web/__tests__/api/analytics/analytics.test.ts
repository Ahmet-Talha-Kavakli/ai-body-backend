import { describe, it, expect, beforeEach, vi } from 'vitest'
import { makeDailyMetrics } from '@/__tests__/helpers/factories'
import { GET } from '@/app/api/user/analytics/route'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/client'

const mockAuth = auth as any
const mockDb = prisma as any

describe('GET /api/user/analytics', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return 401 if not authenticated', async () => {
    mockAuth.mockReturnValueOnce({ userId: null })
    const req = new Request('http://localhost/api/user/analytics')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('should return data if no analytics', async () => {
    mockAuth.mockReturnValueOnce({ userId: 'user_1' })
    mockDb.workoutAnalytics.findMany.mockResolvedValueOnce([])
    mockDb.dailyMetrics.findMany.mockResolvedValueOnce([])

    const req = new Request('http://localhost/api/user/analytics')
    const res = await GET(req)
    expect(res.status).toBe(200)
  })

  it('should aggregate metrics correctly', async () => {
    mockAuth.mockReturnValueOnce({ userId: 'user_1' })
    mockDb.workoutAnalytics.findMany.mockResolvedValueOnce([])
    mockDb.dailyMetrics.findMany.mockResolvedValueOnce([
      makeDailyMetrics({ sleepHours: 8, stressLevel: 3 }),
      makeDailyMetrics({ sleepHours: 6, stressLevel: 5 }),
    ])

    const req = new Request('http://localhost/api/user/analytics')
    const res = await GET(req)
    expect(res.status).toBe(200)
  })
})

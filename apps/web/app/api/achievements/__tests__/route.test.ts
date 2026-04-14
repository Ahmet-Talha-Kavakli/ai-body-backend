import { describe, it, expect, vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_123' }),
}))

vi.mock('@/lib/db/client', () => ({
  db: {
    user: { findUnique: vi.fn().mockResolvedValue({ id: 'user_1' }) },
    userAchievement: {
      findMany: vi.fn().mockResolvedValue([
        { achievementId: 'first_log', earnedAt: new Date('2026-04-14'), xpAwarded: 20 },
        { achievementId: 'streak_3', earnedAt: new Date('2026-04-14'), xpAwarded: 50 },
      ]),
    },
    userXP: {
      findUnique: vi.fn().mockResolvedValue({ total: 70, level: 1 }),
    },
  },
}))

describe('GET /api/achievements', () => {
  it('returns user achievements and XP', async () => {
    const { GET } = await import('../route')
    const response = await GET()
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(Array.isArray(data.achievements)).toBe(true)
    expect(data.achievements[0].achievementId).toBe('first_log')
    expect(data.xp.total).toBe(70)
    expect(data.xp.level).toBe(1)
  })

  it('returns allDefinitions array', async () => {
    const { GET } = await import('../route')
    const response = await GET()
    const data = await response.json()
    expect(Array.isArray(data.allDefinitions)).toBe(true)
    expect(data.allDefinitions.length).toBeGreaterThanOrEqual(15)
  })

  it('returns default xp when no XP record exists', async () => {
    const { db } = await import('@/lib/db/client')
    ;(db.userXP.findUnique as any).mockResolvedValueOnce(null)
    const { GET } = await import('../route')
    const response = await GET()
    const data = await response.json()
    expect(data.xp.total).toBe(0)
    expect(data.xp.level).toBe(1)
  })
})

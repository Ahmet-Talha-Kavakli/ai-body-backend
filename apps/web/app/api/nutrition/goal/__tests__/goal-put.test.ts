import { describe, it, expect, vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_123' }),
}))

vi.mock('@/lib/db/client', () => ({
  db: {
    user: { findUnique: vi.fn().mockResolvedValue({ id: 'user_1' }) },
    nutritionGoal: {
      upsert: vi.fn().mockResolvedValue({
        dailyCalories: 2200,
        proteinG: 160,
        carbsG: 220,
        fatG: 75,
        waterGoalMl: 2500,
        fiberG: 25,
      }),
    },
  },
}))

describe('PUT /api/nutrition/goal', () => {
  it('updates goal and returns updated goal', async () => {
    const { PUT } = await import('../route')
    const req = new Request('http://localhost/api/nutrition/goal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dailyCalories: 2200,
        proteinG: 160,
        carbsG: 220,
        fatG: 75,
        waterGoalMl: 2500,
        fiberG: 25,
      }),
    })
    const response = await PUT(req as any)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.goal.dailyCalories).toBe(2200)
  })
})

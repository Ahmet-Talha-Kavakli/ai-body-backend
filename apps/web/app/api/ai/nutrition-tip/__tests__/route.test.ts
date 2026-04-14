import { describe, it, expect, vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_123' }),
}))

vi.mock('@/lib/db/client', () => ({
  db: {
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'user_1' }),
    },
    mealLog: {
      findMany: vi.fn().mockResolvedValue([
        {
          mealType: 'breakfast',
          totalCalories: 450,
          totalProteinG: 35,
          totalCarbsG: 40,
          totalFatG: 15,
        },
      ]),
    },
    nutritionGoal: {
      findUnique: vi.fn().mockResolvedValue({ dailyCalories: 2000, proteinG: 150 }),
    },
  },
}))

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Great job on your protein intake today! Consider adding more vegetables.',
              },
            },
          ],
        }),
      },
    },
  })),
}))

describe('GET /api/ai/nutrition-tip', () => {
  it('returns a tip string', async () => {
    const { GET } = await import('../route')
    const response = await GET()
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(typeof data.tip).toBe('string')
    expect(data.tip.length).toBeGreaterThan(0)
  })

  it('returns fallback tip when AI fails', async () => {
    vi.mock('openai', () => ({
      default: vi.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error('API error')),
          },
        },
      })),
    }))
    const { GET } = await import('../route')
    const response = await GET()
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(typeof data.tip).toBe('string')
    expect(data.tip.length).toBeGreaterThan(0)
  })
})

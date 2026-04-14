import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockDb = {
  userAchievement: {
    findMany: vi.fn(),
    createMany: vi.fn().mockResolvedValue({ count: 1 }),
  },
  userXP: {
    upsert: vi.fn().mockResolvedValue({ total: 150, level: 2 }),
    update: vi.fn().mockResolvedValue({ total: 150, level: 2 }),
  },
  mealLog: {
    count: vi.fn().mockResolvedValue(5),
    findMany: vi.fn().mockResolvedValue([]),
    groupBy: vi.fn().mockResolvedValue([]),
  },
  nutritionStreak: {
    findUnique: vi.fn().mockResolvedValue({ currentStreak: 7 }),
  },
  workoutSession: {
    count: vi.fn().mockResolvedValue(1),
  },
  nutritionGoal: {
    findUnique: vi.fn().mockResolvedValue(null),
  },
}

vi.mock('@/lib/db/client', () => ({ db: mockDb }))

describe('checkAndAwardAchievements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.userAchievement.findMany.mockResolvedValue([])
    mockDb.userXP.upsert.mockResolvedValue({ total: 150, level: 2 })
    mockDb.userXP.update.mockResolvedValue({ total: 150, level: 2 })
  })

  it('awards first_log on first meal log', async () => {
    mockDb.mealLog.count.mockResolvedValue(1)
    const { checkAndAwardAchievements } = await import('../checker')
    const result = await checkAndAwardAchievements('user_1', 'meal_logged')
    expect(result.newAchievements.some((a) => a.id === 'first_log')).toBe(true)
  })

  it('awards streak_7 when streak is 7', async () => {
    mockDb.nutritionStreak.findUnique.mockResolvedValue({ currentStreak: 7 })
    const { checkAndAwardAchievements } = await import('../checker')
    const result = await checkAndAwardAchievements('user_1', 'meal_logged')
    expect(result.newAchievements.some((a) => a.id === 'streak_7')).toBe(true)
  })

  it('awards first_workout on first workout session', async () => {
    mockDb.workoutSession.count.mockResolvedValue(1)
    const { checkAndAwardAchievements } = await import('../checker')
    const result = await checkAndAwardAchievements('user_1', 'workout_completed')
    expect(result.newAchievements.some((a) => a.id === 'first_workout')).toBe(true)
  })

  it('does not re-award already earned achievements', async () => {
    mockDb.userAchievement.findMany.mockResolvedValue([{ achievementId: 'first_log' }])
    mockDb.mealLog.count.mockResolvedValue(1)
    const { checkAndAwardAchievements } = await import('../checker')
    const result = await checkAndAwardAchievements('user_1', 'meal_logged')
    expect(result.newAchievements.some((a) => a.id === 'first_log')).toBe(false)
  })

  it('returns xpGained and newLevel', async () => {
    mockDb.mealLog.count.mockResolvedValue(1)
    const { checkAndAwardAchievements } = await import('../checker')
    const result = await checkAndAwardAchievements('user_1', 'meal_logged')
    expect(typeof result.xpGained).toBe('number')
    expect(typeof result.newLevel).toBe('number')
  })
})

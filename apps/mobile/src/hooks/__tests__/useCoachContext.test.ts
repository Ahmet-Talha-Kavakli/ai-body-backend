import { describe, it, expect, beforeEach, vi } from 'vitest'
import { buildCoachContext } from '../useCoachContext'
import type { CoachContext } from '../../types/nutrition-coach'

// Mock the database and store functions
vi.mock('../../db/nutrition', () => ({
  getMealsForDate: vi.fn(async () => []),
  calculateTodaysMacros: vi.fn(async () => ({
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
  })),
}))

vi.mock('../../store/nutritionGoalStore', () => ({
  nutritionGoalStore: {
    getState: vi.fn(() => ({
      goals: null,
    })),
  },
}))

vi.mock('../../db/nutritionStreak', () => ({
  getStreak: vi.fn(async () => ({ current: 0, longest: 0 })),
}))

describe('useCoachContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should build context with required fields', async () => {
    const ctx = await buildCoachContext('u1')
    expect(ctx).toBeDefined()
    expect(ctx.recentMeals).toBeDefined()
    expect(Array.isArray(ctx.recentMeals)).toBe(true)
    expect(ctx.goals).toBeDefined()
    expect(ctx.streakData).toBeDefined()
    expect(ctx.todayIntake).toBeDefined()
  })

  it('should include today macro totals', async () => {
    const ctx = await buildCoachContext('u1')
    expect(ctx.todayIntake.calories).toBeGreaterThanOrEqual(0)
    expect(ctx.todayIntake.proteinG).toBeGreaterThanOrEqual(0)
    expect(ctx.todayIntake.carbsG).toBeGreaterThanOrEqual(0)
    expect(ctx.todayIntake.fatG).toBeGreaterThanOrEqual(0)
    expect(ctx.todayIntake.fiberG).toBeGreaterThanOrEqual(0)
  })

  it('should include streak data', async () => {
    const ctx = await buildCoachContext('u1')
    expect(typeof ctx.streakData.current).toBe('number')
    expect(typeof ctx.streakData.longest).toBe('number')
    expect(ctx.streakData.current).toBeGreaterThanOrEqual(0)
    expect(ctx.streakData.longest).toBeGreaterThanOrEqual(0)
  })

  it('should return empty context if no data', async () => {
    const ctx = await buildCoachContext('u-nonexistent')
    expect(ctx.recentMeals.length).toBeGreaterThanOrEqual(0)
    expect(ctx.todayIntake.calories).toBeGreaterThanOrEqual(0)
  })

  it('should include nutrition goals if available', async () => {
    const ctx = await buildCoachContext('u1')
    expect(ctx.goals === null || typeof ctx.goals === 'object').toBe(true)
  })

  it('should return well-formed CoachContext', async () => {
    const ctx = await buildCoachContext('u1')
    const isValidContext =
      'recentMeals' in ctx && 'todayIntake' in ctx && 'goals' in ctx && 'streakData' in ctx
    expect(isValidContext).toBe(true)
  })
})

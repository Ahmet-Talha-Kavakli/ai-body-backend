import { describe, it, expect } from 'vitest'
import {
  computeWeeklyStats,
  computeGoalHitPercent,
  computeMealTiming,
  computeTopFoods,
  computeStreakCalendar,
  getBadge,
} from '../history'
import type { DailyEntry } from '../types'

const makeDaily = (overrides: Partial<DailyEntry>[] = []): DailyEntry[] =>
  overrides.map((o, i) => ({
    date: `2026-04-${String(i + 1).padStart(2, '0')}`,
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 70,
    ...o,
  }))

describe('computeGoalHitPercent', () => {
  it('returns 100 when all days hit goal', () => {
    const daily = makeDaily([{}, {}, {}])
    expect(computeGoalHitPercent(daily, 2000)).toBe(100)
  })

  it('returns 0 when no days hit goal', () => {
    const daily = makeDaily([{ calories: 500 }, { calories: 600 }])
    expect(computeGoalHitPercent(daily, 2000)).toBe(0)
  })

  it('allows 10% tolerance above and below goal', () => {
    const daily = makeDaily([{ calories: 1900 }, { calories: 2100 }, { calories: 1000 }])
    expect(computeGoalHitPercent(daily, 2000)).toBeCloseTo(66.67, 1)
  })

  it('returns 0 for empty array', () => {
    expect(computeGoalHitPercent([], 2000)).toBe(0)
  })
})

describe('getBadge', () => {
  it('returns excellent when goalHitPercent >= 80', () => {
    expect(getBadge(80)).toBe('excellent')
    expect(getBadge(100)).toBe('excellent')
  })

  it('returns good when goalHitPercent >= 50', () => {
    expect(getBadge(50)).toBe('good')
    expect(getBadge(79)).toBe('good')
  })

  it('returns needs_work when goalHitPercent < 50', () => {
    expect(getBadge(0)).toBe('needs_work')
    expect(getBadge(49)).toBe('needs_work')
  })
})

describe('computeWeeklyStats', () => {
  it('groups entries into weeks of 7 days', () => {
    const daily = makeDaily(Array(14).fill({}))
    const weeks = computeWeeklyStats(daily, 2000)
    expect(weeks).toHaveLength(2)
  })

  it('computes correct average calories', () => {
    const daily = makeDaily([{ calories: 1000 }, { calories: 3000 }])
    const weeks = computeWeeklyStats(daily, 2000)
    expect(weeks[0].avgCalories).toBe(2000)
  })

  it('assigns badge based on goal hit percent', () => {
    const daily = makeDaily(Array(7).fill({ calories: 2000 }))
    const weeks = computeWeeklyStats(daily, 2000)
    expect(weeks[0].badge).toBe('excellent')
  })
})

describe('computeMealTiming', () => {
  it('sums calories by meal type', () => {
    const meals = [
      { mealType: 'breakfast', totalCalories: 400 },
      { mealType: 'lunch', totalCalories: 600 },
      { mealType: 'breakfast', totalCalories: 200 },
    ] as any[]
    const result = computeMealTiming(meals)
    expect(result.breakfast).toBe(300) // avg
    expect(result.lunch).toBe(600)
    expect(result.dinner).toBe(0)
    expect(result.snack).toBe(0)
  })
})

describe('computeTopFoods', () => {
  it('returns top 5 foods sorted by count', () => {
    const meals = [
      {
        items: [
          { name: 'Apple', calories: 80 },
          { name: 'Banana', calories: 100 },
        ],
      },
      { items: [{ name: 'Apple', calories: 80 }] },
    ] as any[]
    const result = computeTopFoods(meals)
    expect(result[0].name).toBe('Apple')
    expect(result[0].count).toBe(2)
    expect(result.length).toBeLessThanOrEqual(5)
  })
})

describe('computeStreakCalendar', () => {
  it('marks dates with logs as true', () => {
    const daily = makeDaily([{}, {}])
    const calendar = computeStreakCalendar(daily)
    expect(calendar['2026-04-01']).toBe(true)
    expect(calendar['2026-04-02']).toBe(true)
  })

  it('covers last 30 days only', () => {
    const daily = makeDaily([{}])
    const calendar = computeStreakCalendar(daily)
    expect(Object.keys(calendar).length).toBe(30)
  })
})

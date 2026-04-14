import { describe, it, expect } from 'vitest'
import { calcNewStreak } from '../streak-freeze'

describe('calcNewStreak', () => {
  const today = new Date('2026-04-14T00:00:00.000Z')
  const yesterday = new Date('2026-04-13T00:00:00.000Z')
  const twoDaysAgo = new Date('2026-04-12T00:00:00.000Z')

  it('breaks streak when no freeze charges and goal not met yesterday', () => {
    const result = calcNewStreak({
      currentStreak: 5,
      longestStreak: 10,
      lastGoalDate: twoDaysAgo,
      freezeCharges: 0,
      freezeUsedDates: [],
      today,
    })
    expect(result.currentStreak).toBe(0)
    expect(result.freezeUsed).toBe(false)
    expect(result.freezeCharges).toBe(0)
  })

  it('uses freeze charge when goal not met yesterday and charges available', () => {
    const result = calcNewStreak({
      currentStreak: 5,
      longestStreak: 10,
      lastGoalDate: twoDaysAgo,
      freezeCharges: 2,
      freezeUsedDates: [],
      today,
    })
    expect(result.currentStreak).toBe(5) // streak korunur
    expect(result.freezeUsed).toBe(true)
    expect(result.freezeCharges).toBe(1) // 1 azaldı
    expect(result.freezeUsedDates).toContain('2026-04-13') // dün kullanıldı
  })

  it('does nothing when goal was met yesterday', () => {
    const result = calcNewStreak({
      currentStreak: 5,
      longestStreak: 10,
      lastGoalDate: yesterday,
      freezeCharges: 2,
      freezeUsedDates: [],
      today,
    })
    expect(result.currentStreak).toBe(5)
    expect(result.freezeUsed).toBe(false)
    expect(result.freezeCharges).toBe(2) // değişmez
  })

  it('awards +1 freeze charge at 7-day milestone', () => {
    const result = calcNewStreak({
      currentStreak: 6,
      longestStreak: 10,
      lastGoalDate: yesterday,
      freezeCharges: 0,
      freezeUsedDates: [],
      today,
      newStreakAfterGoal: 7,
    })
    expect(result.bonusCharge).toBe(1)
  })

  it('awards +1 freeze charge at 30-day milestone', () => {
    const result = calcNewStreak({
      currentStreak: 29,
      longestStreak: 30,
      lastGoalDate: yesterday,
      freezeCharges: 1,
      freezeUsedDates: [],
      today,
      newStreakAfterGoal: 30,
    })
    expect(result.bonusCharge).toBe(1)
  })
})

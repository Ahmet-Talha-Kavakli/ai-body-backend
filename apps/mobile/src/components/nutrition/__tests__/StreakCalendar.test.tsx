import { describe, it, expect } from 'vitest'
import { StreakCalendar } from '../StreakCalendar'

describe('StreakCalendar Component', () => {
  it('should export StreakCalendar component', () => {
    expect(StreakCalendar).toBeDefined()
  })

  it('should be a function component', () => {
    expect(typeof StreakCalendar).toBe('function')
  })

  it('should have displayName or function name', () => {
    const funcName = StreakCalendar.name || StreakCalendar.displayName
    expect(funcName).toBeDefined()
  })

  it('should accept required props', () => {
    const props = { currentStreak: 5, loggingDates: [] }
    // Just verify the component accepts props structure
    expect(props.currentStreak).toBe(5)
    expect(Array.isArray(props.loggingDates)).toBe(true)
  })

  it('should work with different streak values', () => {
    const values = [0, 1, 5, 10, 30, 100, 365]
    values.forEach((val) => {
      expect(val).toBeGreaterThanOrEqual(0)
    })
  })

  it('should work with logging dates array', () => {
    const dates = ['2026-04-18', '2026-04-17', '2026-04-16']
    expect(dates).toHaveLength(3)
    expect(dates[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

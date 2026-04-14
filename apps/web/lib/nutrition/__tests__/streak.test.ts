import { describe, it, expect } from 'vitest'
import { computeNewStreak } from '../streak'

describe('computeNewStreak', () => {
  it('increments streak when logging on consecutive day', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString()
    const result = computeNewStreak(
      { currentStreak: 3, longestStreak: 5, lastLogDate: yesterday },
      new Date()
    )
    expect(result.currentStreak).toBe(4)
    expect(result.longestStreak).toBe(5)
  })

  it('updates longestStreak when current exceeds it', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString()
    const result = computeNewStreak(
      { currentStreak: 5, longestStreak: 5, lastLogDate: yesterday },
      new Date()
    )
    expect(result.longestStreak).toBe(6)
  })

  it('resets streak to 1 when gap > 1 day', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString()
    const result = computeNewStreak(
      { currentStreak: 10, longestStreak: 10, lastLogDate: threeDaysAgo },
      new Date()
    )
    expect(result.currentStreak).toBe(1)
  })

  it('does not double-increment when logging same day', () => {
    const today = new Date().toISOString()
    const result = computeNewStreak(
      { currentStreak: 3, longestStreak: 5, lastLogDate: today },
      new Date()
    )
    expect(result.currentStreak).toBe(3)
  })

  it('starts streak at 1 when no previous log', () => {
    const result = computeNewStreak(
      { currentStreak: 0, longestStreak: 0, lastLogDate: null },
      new Date()
    )
    expect(result.currentStreak).toBe(1)
  })
})

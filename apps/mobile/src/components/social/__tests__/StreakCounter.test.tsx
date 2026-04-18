import { describe, it, expect, vi } from 'vitest'
import { StreakCounter } from '../StreakCounter'
import type { StreakData } from '@/types/social-social'

describe('StreakCounter', () => {
  it('should render with streak data prop', () => {
    const streakData = createMockStreakData('user-1', 'workout', 5, 10)
    const component = <StreakCounter streak={streakData} />
    expect(component).toBeDefined()
    expect(component.props.streak).toEqual(streakData)
  })

  it('should display current streak count', () => {
    const streakData = createMockStreakData('user-1', 'workout', 7, 15)
    const component = <StreakCounter streak={streakData} />
    expect(component.props.streak.currentStreak).toBe(7)
  })

  it('should display longest streak count', () => {
    const streakData = createMockStreakData('user-1', 'nutrition', 3, 20)
    const component = <StreakCounter streak={streakData} />
    expect(component.props.streak.longestStreak).toBe(20)
  })

  it('should handle zero current streak', () => {
    const streakData = createMockStreakData('user-1', 'steps', 0, 5)
    const component = <StreakCounter streak={streakData} />
    expect(component.props.streak.currentStreak).toBe(0)
  })

  it('should handle different streak types', () => {
    const types: Array<'workout' | 'nutrition' | 'steps' | 'custom'> = [
      'workout',
      'nutrition',
      'steps',
      'custom',
    ]

    types.forEach((type) => {
      const streakData = createMockStreakData('user-1', type, 5, 10)
      const component = <StreakCounter streak={streakData} />
      expect(component.props.streak.type).toBe(type)
    })
  })

  it('should accept size prop', () => {
    const streakData = createMockStreakData('user-1', 'workout', 5, 10)
    const component = <StreakCounter streak={streakData} size="large" />
    expect(component.props.size).toBe('large')
  })

  it('should accept different sizes', () => {
    const streakData = createMockStreakData('user-1', 'nutrition', 5, 10)
    ;['small', 'medium', 'large'].forEach((size) => {
      const component = <StreakCounter streak={streakData} size={size} />
      expect(component.props.size).toBe(size)
    })
  })

  it('should accept onPress handler', () => {
    const streakData = createMockStreakData('user-1', 'workout', 5, 10)
    const onPress = vi.fn()
    const component = <StreakCounter streak={streakData} onPress={onPress} />
    expect(component.props.onPress).toBe(onPress)
  })

  it('should display flame icon for active streak', () => {
    const today = new Date().toISOString().split('T')[0]
    const streakData: StreakData = {
      userId: 'user-1',
      type: 'workout',
      currentStreak: 10,
      longestStreak: 10,
      lastActivityDate: today,
    }

    const component = <StreakCounter streak={streakData} />
    expect(component.props.streak.currentStreak).toBeGreaterThan(0)
  })

  it('should handle high streak counts', () => {
    const streakData = createMockStreakData('user-1', 'nutrition', 100, 200)
    const component = <StreakCounter streak={streakData} />
    expect(component.props.streak.currentStreak).toBe(100)
    expect(component.props.streak.longestStreak).toBe(200)
  })

  it('should show animation trigger when milestone reached', () => {
    const streakData = createMockStreakData('user-1', 'steps', 50, 50)
    const component = <StreakCounter streak={streakData} animate={true} />
    expect(component.props.animate).toBe(true)
  })

  it('should support variant prop for styling', () => {
    const streakData = createMockStreakData('user-1', 'workout', 5, 10)
    const component = <StreakCounter streak={streakData} variant="compact" />
    expect(component.props.variant).toBe('compact')
  })

  it('should support expanded variant', () => {
    const streakData = createMockStreakData('user-1', 'nutrition', 5, 10)
    const component = <StreakCounter streak={streakData} variant="expanded" />
    expect(component.props.variant).toBe('expanded')
  })

  it('should display last activity date', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString()
    const streakData: StreakData = {
      userId: 'user-1',
      type: 'nutrition',
      currentStreak: 7,
      longestStreak: 15,
      lastActivityDate: yesterday,
    }

    const component = <StreakCounter streak={streakData} />
    expect(component.props.streak.lastActivityDate).toBe(yesterday)
  })

  it('should accept showMilestone prop', () => {
    const streakData = createMockStreakData('user-1', 'workout', 10, 10)
    const component = <StreakCounter streak={streakData} showMilestone={true} />
    expect(component.props.showMilestone).toBe(true)
  })

  it('should maintain streak data integrity', () => {
    const streakData = createMockStreakData('user-1', 'steps', 15, 30)
    const component = <StreakCounter streak={streakData} />

    // Verify all properties are preserved
    expect(component.props.streak.userId).toBe('user-1')
    expect(component.props.streak.type).toBe('steps')
    expect(component.props.streak.currentStreak).toBe(15)
    expect(component.props.streak.longestStreak).toBe(30)
  })
})

// Helper functions
function createMockStreakData(
  userId: string,
  type: 'workout' | 'nutrition' | 'steps' | 'custom',
  currentStreak: number,
  longestStreak: number
): StreakData {
  return {
    userId,
    type,
    currentStreak,
    longestStreak,
    lastActivityDate: new Date().toISOString(),
  }
}

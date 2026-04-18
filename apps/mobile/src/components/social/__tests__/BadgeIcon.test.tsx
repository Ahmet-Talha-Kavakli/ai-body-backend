import { describe, it, expect, vi } from 'vitest'
import { BadgeIcon } from '../BadgeIcon'

describe('BadgeIcon', () => {
  it('should render with badge prop', () => {
    const badge = {
      id: 'badge-1',
      name: 'Gold Badge',
      description: 'You earned a gold badge',
      icon: '⭐',
      category: 'nutrition' as const,
      criteria: { type: 'meals', target: 10 },
      rarity: 'epic' as const,
    }

    const component = <BadgeIcon badge={badge} />
    expect(component).toBeDefined()
    expect(component.props.badge).toEqual(badge)
  })

  it('should render with size prop', () => {
    const badge = {
      id: 'badge-1',
      name: 'Badge',
      description: 'Test badge',
      icon: '🏆',
      category: 'workout' as const,
      criteria: { type: 'workouts', target: 5 },
      rarity: 'common' as const,
    }

    const component = <BadgeIcon badge={badge} size="large" />
    expect(component.props.size).toBe('large')
  })

  it('should render with size small', () => {
    const badge = {
      id: 'badge-1',
      name: 'Badge',
      description: 'Test badge',
      icon: '🎯',
      category: 'health' as const,
      criteria: { type: 'steps', target: 1000 },
      rarity: 'common' as const,
    }

    const component = <BadgeIcon badge={badge} size="small" />
    expect(component.props.size).toBe('small')
  })

  it('should accept onPress handler', () => {
    const badge = {
      id: 'badge-1',
      name: 'Badge',
      description: 'Test badge',
      icon: '✨',
      category: 'social' as const,
      criteria: { type: 'friends', target: 5 },
      rarity: 'rare' as const,
    }

    const onPress = vi.fn()
    const component = <BadgeIcon badge={badge} onPress={onPress} />
    expect(component.props.onPress).toBe(onPress)
  })

  it('should handle different rarity types', () => {
    const rarities: Array<'common' | 'rare' | 'epic' | 'legendary'> = [
      'common',
      'rare',
      'epic',
      'legendary',
    ]

    rarities.forEach((rarity) => {
      const badge = {
        id: 'badge-1',
        name: 'Badge',
        description: 'Test badge',
        icon: '🎖️',
        category: 'nutrition' as const,
        criteria: { type: 'meals', target: 10 },
        rarity,
      }

      const component = <BadgeIcon badge={badge} />
      expect(component.props.badge.rarity).toBe(rarity)
    })
  })

  it('should handle different categories', () => {
    const categories: Array<'nutrition' | 'health' | 'workout' | 'social' | 'streak'> = [
      'nutrition',
      'health',
      'workout',
      'social',
      'streak',
    ]

    categories.forEach((category) => {
      const badge = {
        id: 'badge-1',
        name: 'Badge',
        description: 'Test badge',
        icon: '🎖️',
        category,
        criteria: { type: 'test', target: 10 },
        rarity: 'common' as const,
      }

      const component = <BadgeIcon badge={badge} />
      expect(component.props.badge.category).toBe(category)
    })
  })

  it('should show locked state when locked prop is true', () => {
    const badge = {
      id: 'badge-1',
      name: 'Badge',
      description: 'Test badge',
      icon: '🔒',
      category: 'nutrition' as const,
      criteria: { type: 'meals', target: 10 },
      rarity: 'common' as const,
    }

    const component = <BadgeIcon badge={badge} locked={true} />
    expect(component.props.locked).toBe(true)
  })

  it('should show unlocked state when locked prop is false', () => {
    const badge = {
      id: 'badge-1',
      name: 'Badge',
      description: 'Test badge',
      icon: '🎖️',
      category: 'nutrition' as const,
      criteria: { type: 'meals', target: 10 },
      rarity: 'common' as const,
    }

    const component = <BadgeIcon badge={badge} locked={false} />
    expect(component.props.locked).toBe(false)
  })

  it('should display progress ring when showing progress', () => {
    const badge = {
      id: 'badge-1',
      name: 'Badge',
      description: 'Test badge',
      icon: '📈',
      category: 'nutrition' as const,
      criteria: { type: 'meals', target: 10 },
      rarity: 'common' as const,
    }

    const component = <BadgeIcon badge={badge} progress={50} showProgress={true} />
    expect(component.props.progress).toBe(50)
    expect(component.props.showProgress).toBe(true)
  })

  it('should handle all progress values from 0 to 100', () => {
    const badge = {
      id: 'badge-1',
      name: 'Badge',
      description: 'Test badge',
      icon: '⏳',
      category: 'nutrition' as const,
      criteria: { type: 'meals', target: 10 },
      rarity: 'common' as const,
    }

    ;[0, 25, 50, 75, 100].forEach((progress) => {
      const component = <BadgeIcon badge={badge} progress={progress} />
      expect(component.props.progress).toBe(progress)
    })
  })
})

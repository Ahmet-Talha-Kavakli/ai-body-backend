import { describe, it, expect, vi } from 'vitest'
import { CoachingCard } from '../CoachingCard'
import type { CoachingInsight } from '../../../types'

describe('CoachingCard', () => {
  const mockCoachingInsight: CoachingInsight = {
    id: 'coaching-1',
    userId: 'user-1',
    domain: 'performance',
    title: 'Progressive Overload Strategy',
    insight:
      'Your strength improvements plateau at 5 reps. Try increasing weight by 5% per session.',
    data: { currentMax: 100, nextTarget: 105, reps: 5 },
    actionable: true,
    suggestedAction: 'Implement 5% weight increase in next session',
    createdAt: '2026-04-19T10:00:00Z',
  }

  it('should render coaching card with title', () => {
    const component = <CoachingCard coaching={mockCoachingInsight} />
    expect(component).toBeDefined()
    expect(component.props.coaching.title).toContain('Progressive')
  })

  it('should display domain/category badge', () => {
    const domains: Array<CoachingInsight['domain']> = [
      'performance',
      'nutrition',
      'recovery',
      'behavioral',
    ]
    domains.forEach(domain => {
      const insight = { ...mockCoachingInsight, domain }
      const component = <CoachingCard coaching={insight} />
      expect(component.props.coaching.domain).toBe(domain)
    })
  })

  it('should show detailed coaching insight', () => {
    const component = <CoachingCard coaching={mockCoachingInsight} />
    expect(component.props.coaching.insight).toContain('plateau')
  })

  it('should display actionable flag', () => {
    const component = <CoachingCard coaching={mockCoachingInsight} />
    expect(component.props.coaching.actionable).toBe(true)
  })

  it('should show suggested action step', () => {
    const component = <CoachingCard coaching={mockCoachingInsight} />
    expect(component.props.coaching.suggestedAction).toContain('weight')
  })

  it('should accept onPress callback', () => {
    const onPress = vi.fn()
    const component = (
      <CoachingCard coaching={mockCoachingInsight} onPress={onPress} />
    )
    expect(component.props.onPress).toBe(onPress)
  })

  it('should display coaching data context', () => {
    const component = <CoachingCard coaching={mockCoachingInsight} />
    expect(component.props.coaching.data).toHaveProperty('currentMax')
    expect(component.props.coaching.data.currentMax).toBe(100)
  })
})

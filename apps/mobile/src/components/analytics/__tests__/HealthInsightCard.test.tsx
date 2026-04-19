import { describe, it, expect, vi } from 'vitest'
import { HealthInsightCard } from '../HealthInsightCard'
import type { CoachingInsight } from '../../../types'

describe('HealthInsightCard', () => {
  const mockHealthInsight: CoachingInsight = {
    id: 'insight-1',
    userId: 'user-1',
    domain: 'recovery',
    title: 'Optimize Your Sleep Schedule',
    insight:
      'Your sleep patterns show variability. Try maintaining consistent bedtime for better recovery.',
    data: { avgSleep: 6.5, targetSleep: 8 },
    actionable: true,
    suggestedAction: 'Set a bedtime reminder at 10:30 PM',
    createdAt: '2026-04-19T10:00:00Z',
  }

  it('should render health insight with title', () => {
    const component = <HealthInsightCard insight={mockHealthInsight} />
    expect(component).toBeDefined()
    expect(component.props.insight.title).toBe('Optimize Your Sleep Schedule')
  })

  it('should display domain badge', () => {
    const domains: Array<CoachingInsight['domain']> = [
      'performance',
      'nutrition',
      'recovery',
      'behavioral',
    ]
    domains.forEach(domain => {
      const insight = { ...mockHealthInsight, domain }
      const component = <HealthInsightCard insight={insight} />
      expect(component.props.insight.domain).toBe(domain)
    })
  })

  it('should show full insight text', () => {
    const component = <HealthInsightCard insight={mockHealthInsight} />
    expect(component.props.insight.insight).toContain('sleep patterns')
  })

  it('should display actionable indicator', () => {
    const component = <HealthInsightCard insight={mockHealthInsight} />
    expect(component.props.insight.actionable).toBe(true)
  })

  it('should show suggested action when available', () => {
    const component = <HealthInsightCard insight={mockHealthInsight} />
    expect(component.props.insight.suggestedAction).toBe(
      'Set a bedtime reminder at 10:30 PM'
    )
  })

  it('should accept onPress callback', () => {
    const onPress = vi.fn()
    const component = (
      <HealthInsightCard insight={mockHealthInsight} onPress={onPress} />
    )
    expect(component.props.onPress).toBe(onPress)
  })

  it('should handle insights without suggested action', () => {
    const insightNoAction = { ...mockHealthInsight, suggestedAction: undefined }
    const component = <HealthInsightCard insight={insightNoAction} />
    expect(component.props.insight.suggestedAction).toBeUndefined()
  })
})

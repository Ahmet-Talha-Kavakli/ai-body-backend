import { describe, it, expect, vi } from 'vitest'
import { ChallengeRecommendationCard } from '../ChallengeRecommendationCard'
import type { Recommendation } from '../../../types'

describe('ChallengeRecommendationCard', () => {
  const mockChallengeRecommendation: Recommendation = {
    id: 'challenge-1',
    userId: 'user-1',
    type: 'challenge',
    title: 'April Protein Challenge',
    description: 'Maintain 150g+ protein daily for 30 days',
    confidence: 90,
    reasoning:
      'Aligns with your current nutrition goals and track record',
    actionUrl: '/challenges/april-protein',
    createdAt: '2026-04-19T10:00:00Z',
    expiresAt: '2026-04-26T10:00:00Z',
  }

  it('should render challenge recommendation with title', () => {
    const component = (
      <ChallengeRecommendationCard challenge={mockChallengeRecommendation} />
    )
    expect(component).toBeDefined()
    expect(component.props.challenge.title).toBe('April Protein Challenge')
  })

  it('should display challenge rules', () => {
    const component = (
      <ChallengeRecommendationCard challenge={mockChallengeRecommendation} />
    )
    expect(component.props.challenge.description).toContain('protein')
  })

  it('should show success probability', () => {
    const component = (
      <ChallengeRecommendationCard challenge={mockChallengeRecommendation} />
    )
    expect(component.props.challenge.confidence).toBe(90)
  })

  it('should accept onPress callback', () => {
    const onPress = vi.fn()
    const component = (
      <ChallengeRecommendationCard
        challenge={mockChallengeRecommendation}
        onPress={onPress}
      />
    )
    expect(component.props.onPress).toBe(onPress)
  })

  it('should display challenge action URL', () => {
    const component = (
      <ChallengeRecommendationCard challenge={mockChallengeRecommendation} />
    )
    expect(component.props.challenge.actionUrl).toBe('/challenges/april-protein')
  })

  it('should display personalized recommendation reasoning', () => {
    const component = (
      <ChallengeRecommendationCard challenge={mockChallengeRecommendation} />
    )
    expect(component.props.challenge.reasoning).toContain('nutrition goals')
  })
})

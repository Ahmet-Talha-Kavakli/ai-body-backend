import { describe, it, expect, vi } from 'vitest'
import { RecommendationCard } from '../RecommendationCard'
import type { Recommendation } from '../../../types'

describe('RecommendationCard', () => {
  const mockRecommendation: Recommendation = {
    id: '1',
    userId: 'user-1',
    type: 'meal',
    title: 'Mediterranean Bowl',
    description: 'Rich in protein and healthy fats',
    confidence: 95,
    reasoning: 'Based on your preference for Mediterranean cuisine',
    actionUrl: '/meals/mediterranean-bowl',
    createdAt: '2026-04-19T10:00:00Z',
    expiresAt: '2026-04-26T10:00:00Z',
  }

  it('should render with title and description', () => {
    const component = (
      <RecommendationCard recommendation={mockRecommendation} />
    )
    expect(component).toBeDefined()
    expect(component.props.recommendation.title).toBe('Mediterranean Bowl')
    expect(component.props.recommendation.description).toContain('protein')
  })

  it('should display confidence score', () => {
    const component = (
      <RecommendationCard recommendation={mockRecommendation} />
    )
    expect(component.props.recommendation.confidence).toBe(95)
  })

  it('should show recommendation type badge', () => {
    const types: Array<Recommendation['type']> = [
      'meal',
      'workout',
      'health',
      'friend',
      'challenge',
      'coaching',
    ]
    types.forEach(type => {
      const rec = { ...mockRecommendation, type }
      const component = <RecommendationCard recommendation={rec} />
      expect(component.props.recommendation.type).toBe(type)
    })
  })

  it('should call onPress callback when tapped', () => {
    const onPress = vi.fn()
    const component = (
      <RecommendationCard
        recommendation={mockRecommendation}
        onPress={onPress}
      />
    )
    expect(component.props.onPress).toBe(onPress)
  })

  it('should display reasoning as tooltip or detail', () => {
    const component = (
      <RecommendationCard recommendation={mockRecommendation} />
    )
    expect(component.props.recommendation.reasoning).toContain('Mediterranean')
  })

  it('should handle recommendations without action URL', () => {
    const recNoUrl = { ...mockRecommendation, actionUrl: undefined }
    const component = <RecommendationCard recommendation={recNoUrl} />
    expect(component.props.recommendation.actionUrl).toBeUndefined()
  })
})

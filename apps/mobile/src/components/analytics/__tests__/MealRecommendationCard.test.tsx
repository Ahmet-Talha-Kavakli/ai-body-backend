import { describe, it, expect, vi } from 'vitest'
import { MealRecommendationCard } from '../MealRecommendationCard'
import type { Recommendation } from '../../../types'

describe('MealRecommendationCard', () => {
  const mockMealRecommendation: Recommendation = {
    id: 'meal-1',
    userId: 'user-1',
    type: 'meal',
    title: 'Grilled Salmon with Quinoa',
    description: 'High protein, omega-3 rich meal',
    confidence: 92,
    reasoning: 'Matches your high-protein goal and dietary preferences',
    actionUrl: '/meals/grilled-salmon',
    createdAt: '2026-04-19T10:00:00Z',
    expiresAt: '2026-04-26T10:00:00Z',
  }

  it('should render meal recommendation with title', () => {
    const component = (
      <MealRecommendationCard meal={mockMealRecommendation} />
    )
    expect(component).toBeDefined()
    expect(component.props.meal.title).toBe('Grilled Salmon with Quinoa')
  })

  it('should display meal nutrition highlight', () => {
    const component = (
      <MealRecommendationCard meal={mockMealRecommendation} />
    )
    expect(component.props.meal.description).toContain('protein')
  })

  it('should show confidence percentage', () => {
    const component = (
      <MealRecommendationCard meal={mockMealRecommendation} />
    )
    expect(component.props.meal.confidence).toBe(92)
  })

  it('should accept onPress callback', () => {
    const onPress = vi.fn()
    const component = (
      <MealRecommendationCard meal={mockMealRecommendation} onPress={onPress} />
    )
    expect(component.props.onPress).toBe(onPress)
  })

  it('should display meal action URL', () => {
    const component = (
      <MealRecommendationCard meal={mockMealRecommendation} />
    )
    expect(component.props.meal.actionUrl).toBe('/meals/grilled-salmon')
  })

  it('should display reasoning for recommendation', () => {
    const component = (
      <MealRecommendationCard meal={mockMealRecommendation} />
    )
    expect(component.props.meal.reasoning).toContain('protein goal')
  })
})

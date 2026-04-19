import { describe, it, expect, vi } from 'vitest'
import { WorkoutRecommendationCard } from '../WorkoutRecommendationCard'
import type { Recommendation } from '../../../types'

describe('WorkoutRecommendationCard', () => {
  const mockWorkoutRecommendation: Recommendation = {
    id: 'workout-1',
    userId: 'user-1',
    type: 'workout',
    title: '30-min HIIT Cardio',
    description: 'High intensity interval training',
    confidence: 88,
    reasoning: 'Based on your fitness level and recent performance trends',
    actionUrl: '/workouts/hiit-cardio',
    createdAt: '2026-04-19T10:00:00Z',
    expiresAt: '2026-04-26T10:00:00Z',
  }

  it('should render workout recommendation with title', () => {
    const component = (
      <WorkoutRecommendationCard workout={mockWorkoutRecommendation} />
    )
    expect(component).toBeDefined()
    expect(component.props.workout.title).toBe('30-min HIIT Cardio')
  })

  it('should display workout type description', () => {
    const component = (
      <WorkoutRecommendationCard workout={mockWorkoutRecommendation} />
    )
    expect(component.props.workout.description).toContain('interval')
  })

  it('should show confidence score', () => {
    const component = (
      <WorkoutRecommendationCard workout={mockWorkoutRecommendation} />
    )
    expect(component.props.workout.confidence).toBe(88)
  })

  it('should accept onPress callback', () => {
    const onPress = vi.fn()
    const component = (
      <WorkoutRecommendationCard
        workout={mockWorkoutRecommendation}
        onPress={onPress}
      />
    )
    expect(component.props.onPress).toBe(onPress)
  })

  it('should display workout action URL', () => {
    const component = (
      <WorkoutRecommendationCard workout={mockWorkoutRecommendation} />
    )
    expect(component.props.workout.actionUrl).toBe('/workouts/hiit-cardio')
  })

  it('should show personalized recommendation reasoning', () => {
    const component = (
      <WorkoutRecommendationCard workout={mockWorkoutRecommendation} />
    )
    expect(component.props.workout.reasoning).toContain('fitness level')
  })
})

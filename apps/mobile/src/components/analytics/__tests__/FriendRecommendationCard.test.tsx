import { describe, it, expect, vi } from 'vitest'
import { FriendRecommendationCard } from '../FriendRecommendationCard'
import type { Recommendation } from '../../../types'

describe('FriendRecommendationCard', () => {
  const mockFriendRecommendation: Recommendation = {
    id: 'friend-1',
    userId: 'user-1',
    type: 'friend',
    title: 'Connect with Alex',
    description: 'Fitness enthusiast interested in morning runs',
    confidence: 85,
    reasoning: 'Similar workout preferences and goals',
    actionUrl: '/users/alex',
    createdAt: '2026-04-19T10:00:00Z',
    expiresAt: '2026-04-26T10:00:00Z',
  }

  it('should render friend recommendation with name', () => {
    const component = (
      <FriendRecommendationCard friend={mockFriendRecommendation} />
    )
    expect(component).toBeDefined()
    expect(component.props.friend.title).toContain('Alex')
  })

  it('should display friendship reason', () => {
    const component = (
      <FriendRecommendationCard friend={mockFriendRecommendation} />
    )
    expect(component.props.friend.reasoning).toContain('workout')
  })

  it('should show compatibility score', () => {
    const component = (
      <FriendRecommendationCard friend={mockFriendRecommendation} />
    )
    expect(component.props.friend.confidence).toBe(85)
  })

  it('should accept onPress callback', () => {
    const onPress = vi.fn()
    const component = (
      <FriendRecommendationCard
        friend={mockFriendRecommendation}
        onPress={onPress}
      />
    )
    expect(component.props.onPress).toBe(onPress)
  })

  it('should display friend profile URL', () => {
    const component = (
      <FriendRecommendationCard friend={mockFriendRecommendation} />
    )
    expect(component.props.friend.actionUrl).toBe('/users/alex')
  })

  it('should display friend interests', () => {
    const component = (
      <FriendRecommendationCard friend={mockFriendRecommendation} />
    )
    expect(component.props.friend.description).toContain('morning runs')
  })
})

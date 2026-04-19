import { describe, it, expect, vi } from 'vitest'
import { SocialFeedCard } from '../SocialFeedCard'

describe('SocialFeedCard Component', () => {
  const mockSharedMeal = {
    id: 'share-1',
    mealLogId: 'meal-1',
    userId: 'user-123',
    foodName: 'Grilled Salmon',
    photoUrl: 'https://example.com/salmon.jpg',
    nutrition: {
      calories: 520,
      proteinG: 42,
      carbsG: 28,
      fatG: 18,
      fiberG: 4,
    },
    shareType: 'friends' as const,
    sharedWith: ['user-456', 'user-789'],
    userName: 'John Fitness',
    userAvatar: 'https://example.com/avatar.jpg',
    createdAt: '2026-04-19T10:30:00Z',
    likes: 8,
    comments: 3,
  }

  it('should display food name', () => {
    const component = <SocialFeedCard sharedMeal={mockSharedMeal} />

    expect(component.props.sharedMeal.foodName).toBe('Grilled Salmon')
  })

  it('should display user name', () => {
    const component = <SocialFeedCard sharedMeal={mockSharedMeal} />

    expect(component.props.sharedMeal.userName).toBe('John Fitness')
  })

  it('should display nutrition info', () => {
    const component = <SocialFeedCard sharedMeal={mockSharedMeal} />

    expect(component.props.sharedMeal.nutrition.calories).toBe(520)
    expect(component.props.sharedMeal.nutrition.proteinG).toBe(42)
  })

  it('should display photo', () => {
    const component = <SocialFeedCard sharedMeal={mockSharedMeal} />

    expect(component.props.sharedMeal.photoUrl).toBe('https://example.com/salmon.jpg')
  })

  it('should display like count', () => {
    const component = <SocialFeedCard sharedMeal={mockSharedMeal} />

    expect(component.props.sharedMeal.likes).toBe(8)
  })

  it('should display comment count', () => {
    const component = <SocialFeedCard sharedMeal={mockSharedMeal} />

    expect(component.props.sharedMeal.comments).toBe(3)
  })

  it('should support onPress callback', () => {
    const mockOnPress = vi.fn()
    const component = <SocialFeedCard sharedMeal={mockSharedMeal} onPress={mockOnPress} />

    expect(component.props.onPress).toBe(mockOnPress)
  })
})

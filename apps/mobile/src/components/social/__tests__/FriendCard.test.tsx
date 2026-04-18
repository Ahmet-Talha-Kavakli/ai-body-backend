import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { FriendCard } from '../FriendCard'
import type { UserProfile } from '../../../types/social'

describe('FriendCard', () => {
  const mockFriend: UserProfile = {
    id: '1',
    userId: 'user1',
    username: 'johndoe',
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Fitness enthusiast',
    stats: {
      totalWorkouts: 42,
      totalSteps: 500000,
      totalCalories: 150000,
      longestStreak: 15,
    },
    badges: ['streak_warrior', 'cardio_king'],
    createdAt: '2026-01-01T00:00:00Z',
  }

  it('should render friend card with user info', () => {
    render(
      <FriendCard friend={mockFriend} isFriend={false} />
    )

    expect(screen.getByText('johndoe')).toBeTruthy()
    expect(screen.getByText(/42 workouts/)).toBeTruthy()
  })

  it('should display Follow button when not a friend', () => {
    render(
      <FriendCard friend={mockFriend} isFriend={false} />
    )

    expect(screen.getByText('Follow')).toBeTruthy()
  })

  it('should display Unfollow button when already a friend', () => {
    render(
      <FriendCard friend={mockFriend} isFriend={true} />
    )

    expect(screen.getByText('Unfollow')).toBeTruthy()
  })

  it('should call onFollow when Follow button pressed and not a friend', () => {
    const onFollow = vi.fn()
    render(
      <FriendCard friend={mockFriend} isFriend={false} onFollow={onFollow} />
    )

    const followButton = screen.getByText('Follow')
    fireEvent.press(followButton)

    expect(onFollow).toHaveBeenCalled()
  })

  it('should call onUnfollow when Unfollow button pressed and is a friend', () => {
    const onUnfollow = vi.fn()
    render(
      <FriendCard friend={mockFriend} isFriend={true} onUnfollow={onUnfollow} />
    )

    const unfollowButton = screen.getByText('Unfollow')
    fireEvent.press(unfollowButton)

    expect(onUnfollow).toHaveBeenCalled()
  })

  it('should call onPress when card is pressed', () => {
    const onPress = vi.fn()
    render(
      <FriendCard friend={mockFriend} isFriend={false} onPress={onPress} />
    )

    const card = screen.getByText('johndoe')
    fireEvent.press(card)

    expect(onPress).toHaveBeenCalled()
  })

  it('should render avatar image', () => {
    render(
      <FriendCard friend={mockFriend} isFriend={false} />
    )

    const image = screen.getByTestId('friend-avatar')
    expect(image).toBeTruthy()
  })

  it('should display correct workout count', () => {
    render(
      <FriendCard friend={mockFriend} isFriend={false} />
    )

    expect(screen.getByText('42 workouts')).toBeTruthy()
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { useFriendStore } from '../../../store/friendStore'
import type { UserProfile } from '../../../types/social'

describe('FriendDiscoveryScreen Integration', () => {
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
    badges: ['badge1'],
    createdAt: '2026-01-01T00:00:00Z',
  }

  beforeEach(() => {
    useFriendStore.setState({
      friends: [],
      friendRequests: [],
      myProfile: null,
      searchResults: [],
      loading: false,
      error: null,
    })
  })

  it('should add friend to store when discovered', () => {
    const { addFriend, isFriend } = useFriendStore.getState()

    addFriend(mockFriend)

    expect(isFriend(mockFriend.userId)).toBe(true)
  })

  it('should remove friend from search results when added', () => {
    const { addFriend, setSearchResults } = useFriendStore.getState()

    setSearchResults([mockFriend])
    addFriend(mockFriend)

    const state = useFriendStore.getState()
    expect(state.searchResults).toHaveLength(0)
  })

  it('should track friend count', () => {
    const { addFriend, getFriendCount } = useFriendStore.getState()

    const friend2 = { ...mockFriend, userId: 'user2', id: '2' }
    addFriend(mockFriend)
    addFriend(friend2)

    expect(getFriendCount()).toBe(2)
  })

  it('should search and display results', async () => {
    const { setSearchResults } = useFriendStore.getState()

    setSearchResults([mockFriend])

    const state = useFriendStore.getState()
    expect(state.searchResults).toHaveLength(1)
    expect(state.searchResults[0].username).toBe('johndoe')
  })
})

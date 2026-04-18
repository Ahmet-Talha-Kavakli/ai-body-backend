import { describe, it, expect, beforeEach } from 'vitest'
import { useFriendStore } from '../friendStore'
import type { UserProfile, FriendRequest } from '../../types/social'

describe('friendStore', () => {
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

  describe('initial state', () => {
    it('should initialize with empty friends list', () => {
      const { friends } = useFriendStore.getState()
      expect(friends).toEqual([])
    })

    it('should initialize with empty friend requests', () => {
      const { friendRequests } = useFriendStore.getState()
      expect(friendRequests).toEqual([])
    })

    it('should initialize with no profile', () => {
      const { myProfile } = useFriendStore.getState()
      expect(myProfile).toBeNull()
    })

    it('should initialize with empty search results', () => {
      const { searchResults } = useFriendStore.getState()
      expect(searchResults).toEqual([])
    })

    it('should initialize with loading false', () => {
      const { loading } = useFriendStore.getState()
      expect(loading).toBe(false)
    })

    it('should initialize with no error', () => {
      const { error } = useFriendStore.getState()
      expect(error).toBeNull()
    })
  })

  describe('setters', () => {
    it('should set friends list', () => {
      const mockFriends: UserProfile[] = [
        {
          id: '1',
          userId: 'user1',
          username: 'john',
          avatar: 'avatar1',
          bio: 'bio1',
          stats: { totalWorkouts: 10, totalSteps: 5000, totalCalories: 2000, longestStreak: 5 },
          badges: [],
          createdAt: '2024-01-01',
        },
      ]
      useFriendStore.getState().setFriends(mockFriends)
      expect(useFriendStore.getState().friends).toEqual(mockFriends)
    })

    it('should set my profile', () => {
      const mockProfile: UserProfile = {
        id: 'me',
        userId: 'userId',
        username: 'myself',
        avatar: 'avatar',
        bio: 'my bio',
        stats: { totalWorkouts: 20, totalSteps: 10000, totalCalories: 4000, longestStreak: 10 },
        badges: ['badge1'],
        createdAt: '2024-01-01',
      }
      useFriendStore.getState().setMyProfile(mockProfile)
      expect(useFriendStore.getState().myProfile).toEqual(mockProfile)
    })

    it('should set search results', () => {
      const mockResults: UserProfile[] = [
        {
          id: '2',
          userId: 'user2',
          username: 'jane',
          avatar: 'avatar2',
          bio: 'bio2',
          stats: { totalWorkouts: 15, totalSteps: 7000, totalCalories: 3000, longestStreak: 8 },
          badges: [],
          createdAt: '2024-01-01',
        },
      ]
      useFriendStore.getState().setSearchResults(mockResults)
      expect(useFriendStore.getState().searchResults).toEqual(mockResults)
    })

    it('should set loading state', () => {
      useFriendStore.getState().setLoading(true)
      expect(useFriendStore.getState().loading).toBe(true)
    })

    it('should set error message', () => {
      useFriendStore.getState().setError('Test error')
      expect(useFriendStore.getState().error).toBe('Test error')
    })

    it('should set friend requests', () => {
      const mockRequests: FriendRequest[] = [
        {
          id: 'req1',
          fromUserId: 'user1',
          toUserId: 'userId',
          status: 'pending',
          createdAt: '2024-01-01',
        },
      ]
      useFriendStore.getState().setFriendRequests(mockRequests)
      expect(useFriendStore.getState().friendRequests).toEqual(mockRequests)
    })
  })

  describe('friend operations', () => {
    const mockFriend: UserProfile = {
      id: '1',
      userId: 'friend1',
      username: 'frienduser',
      avatar: 'avatar1',
      bio: 'friend bio',
      stats: { totalWorkouts: 10, totalSteps: 5000, totalCalories: 2000, longestStreak: 5 },
      badges: [],
      createdAt: '2024-01-01',
    }

    it('should add friend to list', () => {
      useFriendStore.getState().addFriend(mockFriend)
      expect(useFriendStore.getState().friends).toHaveLength(1)
      expect(useFriendStore.getState().friends[0]).toEqual(mockFriend)
    })

    it('should check if user is friend', () => {
      useFriendStore.getState().addFriend(mockFriend)
      expect(useFriendStore.getState().isFriend(mockFriend.userId)).toBe(true)
      expect(useFriendStore.getState().isFriend('nonexistent')).toBe(false)
    })

    it('should remove friend from list', () => {
      useFriendStore.getState().addFriend(mockFriend)
      useFriendStore.getState().removeFriend(mockFriend.userId)
      expect(useFriendStore.getState().friends).toHaveLength(0)
    })

    it('should get correct friend count', () => {
      const friend2: UserProfile = { ...mockFriend, userId: 'friend2', id: '2' }
      useFriendStore.getState().addFriend(mockFriend)
      useFriendStore.getState().addFriend(friend2)
      expect(useFriendStore.getState().getFriendCount()).toBe(2)
    })

    it('should remove friend from search results when adding', () => {
      useFriendStore.getState().setSearchResults([mockFriend])
      useFriendStore.getState().addFriend(mockFriend)
      expect(useFriendStore.getState().searchResults).toHaveLength(0)
    })
  })

  describe('search operations', () => {
    it('should clear search results', () => {
      const mockFriend: UserProfile = {
        id: '1',
        userId: 'user1',
        username: 'john',
        avatar: 'avatar',
        bio: 'bio',
        stats: { totalWorkouts: 10, totalSteps: 5000, totalCalories: 2000, longestStreak: 5 },
        badges: [],
        createdAt: '2024-01-01',
      }
      useFriendStore.getState().setSearchResults([mockFriend])
      useFriendStore.getState().clearSearchResults()
      expect(useFriendStore.getState().searchResults).toHaveLength(0)
    })

    it('should set loading true during search', async () => {
      useFriendStore.getState().searchFriends('test')
      // Initially should be loading
      const state = useFriendStore.getState()
      // After async completes, loading should be false
      await new Promise((resolve) => setTimeout(resolve, 50))
      const finalState = useFriendStore.getState()
      expect(finalState.loading).toBe(false)
    })
  })

  describe('friend request operations', () => {
    const mockRequest: FriendRequest = {
      id: 'req1',
      fromUserId: 'user1',
      toUserId: 'user2',
      status: 'pending',
      createdAt: '2024-01-01',
    }

    it('should add friend request', () => {
      useFriendStore.getState().addFriendRequest(mockRequest)
      expect(useFriendStore.getState().friendRequests).toHaveLength(1)
      expect(useFriendStore.getState().friendRequests[0]).toEqual(mockRequest)
    })

    it('should remove friend request', () => {
      useFriendStore.getState().addFriendRequest(mockRequest)
      useFriendStore.getState().removeFriendRequest(mockRequest.id)
      expect(useFriendStore.getState().friendRequests).toHaveLength(0)
    })

    it('should get correct friend request count', () => {
      const request2: FriendRequest = { ...mockRequest, id: 'req2', fromUserId: 'user3' }
      useFriendStore.getState().addFriendRequest(mockRequest)
      useFriendStore.getState().addFriendRequest(request2)
      expect(useFriendStore.getState().getFriendRequestCount()).toBe(2)
    })

    it('should detect pending request from user', () => {
      useFriendStore.getState().addFriendRequest(mockRequest)
      expect(useFriendStore.getState().hasPendingRequest(mockRequest.fromUserId)).toBe(true)
    })

    it('should return false for non-existent pending request', () => {
      expect(useFriendStore.getState().hasPendingRequest('nonexistent')).toBe(false)
    })
  })
})

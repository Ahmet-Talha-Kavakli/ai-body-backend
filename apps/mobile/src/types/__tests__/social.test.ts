import { describe, it, expect } from 'vitest'
import type {
  UserProfile,
  Friendship,
  FriendRequest,
  FriendListItem,
  FriendSearchResult,
} from '../social'

describe('social types', () => {
  describe('UserProfile', () => {
    it('should create a valid UserProfile with all required fields', () => {
      const profile: UserProfile = {
        id: 'user-1',
        userId: 'user-1',
        username: 'johndoe',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Fitness enthusiast',
        stats: {
          totalWorkouts: 50,
          totalSteps: 100000,
          totalCalories: 75000,
          longestStreak: 30,
        },
        badges: ['first-workout', 'week-streak'],
        createdAt: new Date().toISOString(),
      }

      expect(profile.id).toBe('user-1')
      expect(profile.username).toBe('johndoe')
      expect(profile.stats.totalWorkouts).toBe(50)
      expect(profile.badges).toHaveLength(2)
    })

    it('should support bio and stats with zero values', () => {
      const profile: UserProfile = {
        id: 'user-2',
        userId: 'user-2',
        username: 'newuser',
        avatar: '',
        bio: '',
        stats: {
          totalWorkouts: 0,
          totalSteps: 0,
          totalCalories: 0,
          longestStreak: 0,
        },
        badges: [],
        createdAt: new Date().toISOString(),
      }

      expect(profile.stats.totalWorkouts).toBe(0)
      expect(profile.badges).toHaveLength(0)
    })
  })

  describe('Friendship', () => {
    it('should create a valid Friendship with pending status', () => {
      const friendship: Friendship = {
        id: 'friendship-1',
        userId: 'user-1',
        friendId: 'user-2',
        status: 'pending',
        createdAt: new Date().toISOString(),
      }

      expect(friendship.status).toBe('pending')
      expect(friendship.userId).toBe('user-1')
    })

    it('should support all friendship statuses', () => {
      const statuses = ['pending', 'accepted', 'blocked'] as const
      statuses.forEach((status) => {
        const friendship: Friendship = {
          id: 'friendship-1',
          userId: 'user-1',
          friendId: 'user-2',
          status,
          createdAt: new Date().toISOString(),
        }
        expect(friendship.status).toBe(status)
      })
    })
  })

  describe('FriendRequest', () => {
    it('should create a valid FriendRequest', () => {
      const request: FriendRequest = {
        id: 'req-1',
        fromUserId: 'user-1',
        toUserId: 'user-2',
        status: 'pending',
        createdAt: new Date().toISOString(),
      }

      expect(request.status).toBe('pending')
      expect(request.fromUserId).toBe('user-1')
      expect(request.toUserId).toBe('user-2')
    })

    it('should support all request statuses', () => {
      const statuses = ['pending', 'accepted', 'rejected'] as const
      statuses.forEach((status) => {
        const request: FriendRequest = {
          id: 'req-1',
          fromUserId: 'user-1',
          toUserId: 'user-2',
          status,
          createdAt: new Date().toISOString(),
        }
        expect(request.status).toBe(status)
      })
    })
  })

  describe('FriendListItem', () => {
    it('should create a valid FriendListItem extending UserProfile', () => {
      const item: FriendListItem = {
        id: 'user-2',
        userId: 'user-2',
        username: 'friend',
        avatar: 'https://example.com/friend.jpg',
        bio: 'My friend',
        stats: {
          totalWorkouts: 25,
          totalSteps: 50000,
          totalCalories: 40000,
          longestStreak: 15,
        },
        badges: ['first-workout'],
        createdAt: new Date().toISOString(),
        friendshipStatus: 'friend',
      }

      expect(item.friendshipStatus).toBe('friend')
      expect(item.username).toBe('friend')
    })

    it('should support all friendship status values', () => {
      const statuses = ['friend', 'pending', 'blocked'] as const
      statuses.forEach((status) => {
        const item: FriendListItem = {
          id: 'user-2',
          userId: 'user-2',
          username: 'test',
          avatar: '',
          bio: '',
          stats: {
            totalWorkouts: 0,
            totalSteps: 0,
            totalCalories: 0,
            longestStreak: 0,
          },
          badges: [],
          createdAt: new Date().toISOString(),
          friendshipStatus: status,
        }
        expect(item.friendshipStatus).toBe(status)
      })
    })
  })

  describe('FriendSearchResult', () => {
    it('should create a valid FriendSearchResult', () => {
      const result: FriendSearchResult = {
        userId: 'user-3',
        username: 'searchresult',
        avatar: 'https://example.com/user3.jpg',
        bio: 'Fitness lover',
        isFriend: false,
      }

      expect(result.userId).toBe('user-3')
      expect(result.isFriend).toBe(false)
      expect(result.pendingRequest).toBeUndefined()
    })

    it('should support optional pendingRequest field', () => {
      const result: FriendSearchResult = {
        userId: 'user-3',
        username: 'searchresult',
        avatar: 'https://example.com/user3.jpg',
        bio: 'Fitness lover',
        isFriend: false,
        pendingRequest: true,
      }

      expect(result.pendingRequest).toBe(true)
    })

    it('should support isFriend as true when already connected', () => {
      const result: FriendSearchResult = {
        userId: 'user-4',
        username: 'bestfriend',
        avatar: 'https://example.com/user4.jpg',
        bio: 'Best friend',
        isFriend: true,
      }

      expect(result.isFriend).toBe(true)
    })
  })
})

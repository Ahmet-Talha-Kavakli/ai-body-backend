import { describe, it, expect } from 'vitest'
import type {
  UserProfile,
  Friendship,
  FriendRequest,
  FriendListItem,
  FriendSearchResult,
  SharedMeal,
  SocialFeedItem,
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

describe('Social Sharing Types', () => {
  describe('SharedMeal', () => {
    it('should create a private shared meal', () => {
      const meal: SharedMeal = {
        id: 'share-1',
        mealLogId: 'meal-123',
        userId: 'user-1',
        foodName: 'Grilled Chicken with Rice',
        photoUrl: 'https://example.com/meal.jpg',
        nutrition: {
          calories: 450,
          proteinG: 35,
          carbsG: 45,
          fatG: 12,
          fiberG: 5,
        },
        shareType: 'private',
        sharedWith: {},
        createdAt: '2026-04-19T12:00:00Z',
      }
      expect(meal.shareType).toBe('private')
      expect(meal.nutrition.calories).toBe(450)
    })

    it('should create a friends shared meal', () => {
      const meal: SharedMeal = {
        id: 'share-2',
        mealLogId: 'meal-456',
        userId: 'user-2',
        foodName: 'Salad Bowl',
        photoUrl: 'https://example.com/salad.jpg',
        nutrition: {
          calories: 280,
          proteinG: 15,
          carbsG: 35,
          fatG: 8,
          fiberG: 8,
        },
        shareType: 'friends',
        sharedWith: {
          friendIds: ['friend-1', 'friend-2', 'friend-3'],
        },
        createdAt: '2026-04-19T13:00:00Z',
      }
      expect(meal.shareType).toBe('friends')
      expect(meal.sharedWith.friendIds).toHaveLength(3)
    })

    it('should create a team shared meal', () => {
      const meal: SharedMeal = {
        id: 'share-3',
        mealLogId: 'meal-789',
        userId: 'user-3',
        foodName: 'Protein Smoothie',
        photoUrl: 'https://example.com/smoothie.jpg',
        nutrition: {
          calories: 320,
          proteinG: 25,
          carbsG: 40,
          fatG: 6,
          fiberG: 3,
        },
        shareType: 'team',
        sharedWith: {
          teamId: 'team-1',
        },
        createdAt: '2026-04-19T14:00:00Z',
      }
      expect(meal.shareType).toBe('team')
      expect(meal.sharedWith.teamId).toBe('team-1')
    })

    it('should include reactions on shared meal', () => {
      const meal: SharedMeal = {
        id: 'share-4',
        mealLogId: 'meal-999',
        userId: 'user-4',
        foodName: 'Sushi Platter',
        photoUrl: 'https://example.com/sushi.jpg',
        nutrition: {
          calories: 500,
          proteinG: 30,
          carbsG: 60,
          fatG: 10,
          fiberG: 4,
        },
        shareType: 'friends',
        sharedWith: {
          friendIds: ['friend-1'],
        },
        createdAt: '2026-04-19T15:00:00Z',
        reactions: [
          { userId: 'friend-1', type: 'heart' },
          { userId: 'friend-2', type: 'like' },
        ],
      }
      expect(meal.reactions).toHaveLength(2)
      expect(meal.reactions[0].type).toBe('heart')
    })
  })

  describe('SocialFeedItem', () => {
    it('should display friend meal in feed', () => {
      const item: SocialFeedItem = {
        id: 'feed-1',
        userId: 'user-1',
        userName: 'Alice',
        userAvatar: 'https://example.com/avatar1.jpg',
        foodName: 'Grilled Chicken',
        photoUrl: 'https://example.com/meal.jpg',
        nutrition: {
          calories: 450,
          proteinG: 35,
          carbsG: 45,
          fatG: 12,
          fiberG: 5,
        },
        timestamp: '2026-04-19T12:00:00Z',
        shareType: 'friends',
        reactions: [
          { type: 'like', count: 3 },
          { type: 'heart', count: 2 },
        ],
      }
      expect(item.userName).toBe('Alice')
      expect(item.shareType).toBe('friends')
      expect(item.reactions[0].count).toBe(3)
    })

    it('should display team meal in feed', () => {
      const item: SocialFeedItem = {
        id: 'feed-2',
        userId: 'user-2',
        userName: 'Bob',
        userAvatar: 'https://example.com/avatar2.jpg',
        foodName: 'Protein Smoothie',
        photoUrl: 'https://example.com/smoothie.jpg',
        nutrition: {
          calories: 320,
          proteinG: 25,
          carbsG: 40,
          fatG: 6,
          fiberG: 3,
        },
        timestamp: '2026-04-19T13:00:00Z',
        shareType: 'team',
        reactions: [
          { type: 'like', count: 5 },
          { type: 'heart', count: 1 },
        ],
      }
      expect(item.shareType).toBe('team')
      expect(item.reactions[0].count).toBe(5)
    })

    it('should have empty reactions initially', () => {
      const item: SocialFeedItem = {
        id: 'feed-3',
        userId: 'user-3',
        userName: 'Carol',
        userAvatar: 'https://example.com/avatar3.jpg',
        foodName: 'Salad Bowl',
        photoUrl: 'https://example.com/salad.jpg',
        nutrition: {
          calories: 280,
          proteinG: 15,
          carbsG: 35,
          fatG: 8,
          fiberG: 8,
        },
        timestamp: '2026-04-19T14:00:00Z',
        shareType: 'friends',
        reactions: [],
      }
      expect(item.reactions).toHaveLength(0)
    })
  })
})

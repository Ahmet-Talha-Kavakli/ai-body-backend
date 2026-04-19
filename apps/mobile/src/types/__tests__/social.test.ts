import { describe, it, expect } from 'vitest'
import type { SharedMeal, SocialFeedItem, SocialFeedFilter } from '../social'

describe('Social Sharing Types', () => {
  describe('SharedMeal', () => {
    it('should have required id field', () => {
      const meal: SharedMeal = {
        id: 'meal-1',
        mealLogId: 'log-1',
        userId: 'user-1',
        foodName: 'Pizza',
        photoUrl: 'https://example.com/pizza.jpg',
        nutrition: {
          calories: 285,
          proteinG: 12,
          carbsG: 36,
          fatG: 10,
          fiberG: 2,
        },
        shareType: 'private',
        sharedWith: {},
        createdAt: '2026-04-19T10:00:00Z',
      }
      expect(meal.id).toBe('meal-1')
    })

    it('should have shareType as private, friends, or team', () => {
      const privateMeal: SharedMeal = {
        id: 'meal-1',
        mealLogId: 'log-1',
        userId: 'user-1',
        foodName: 'Pizza',
        photoUrl: 'https://example.com/pizza.jpg',
        nutrition: {
          calories: 285,
          proteinG: 12,
          carbsG: 36,
          fatG: 10,
          fiberG: 2,
        },
        shareType: 'private',
        sharedWith: {},
        createdAt: '2026-04-19T10:00:00Z',
      }

      const friendsMeal: SharedMeal = {
        ...privateMeal,
        id: 'meal-2',
        shareType: 'friends',
        sharedWith: { friendIds: ['friend-1', 'friend-2'] },
      }

      const teamMeal: SharedMeal = {
        ...privateMeal,
        id: 'meal-3',
        shareType: 'team',
        sharedWith: { teamId: 'team-1' },
      }

      expect(privateMeal.shareType).toBe('private')
      expect(friendsMeal.shareType).toBe('friends')
      expect(teamMeal.shareType).toBe('team')
    })

    it('should have nutrition object with all required fields', () => {
      const meal: SharedMeal = {
        id: 'meal-1',
        mealLogId: 'log-1',
        userId: 'user-1',
        foodName: 'Salad',
        photoUrl: 'https://example.com/salad.jpg',
        nutrition: {
          calories: 150,
          proteinG: 8,
          carbsG: 18,
          fatG: 5,
          fiberG: 4,
        },
        shareType: 'friends',
        sharedWith: { friendIds: ['friend-1'] },
        createdAt: '2026-04-19T10:00:00Z',
      }

      expect(meal.nutrition.calories).toBe(150)
      expect(meal.nutrition.proteinG).toBe(8)
      expect(meal.nutrition.carbsG).toBe(18)
      expect(meal.nutrition.fatG).toBe(5)
      expect(meal.nutrition.fiberG).toBe(4)
    })

    it('should optionally have reactions array', () => {
      const mealWithoutReactions: SharedMeal = {
        id: 'meal-1',
        mealLogId: 'log-1',
        userId: 'user-1',
        foodName: 'Pizza',
        photoUrl: 'https://example.com/pizza.jpg',
        nutrition: {
          calories: 285,
          proteinG: 12,
          carbsG: 36,
          fatG: 10,
          fiberG: 2,
        },
        shareType: 'private',
        sharedWith: {},
        createdAt: '2026-04-19T10:00:00Z',
      }

      const mealWithReactions: SharedMeal = {
        ...mealWithoutReactions,
        reactions: [
          { userId: 'user-2', type: 'like' },
          { userId: 'user-3', type: 'heart' },
        ],
      }

      expect(mealWithoutReactions.reactions).toBeUndefined()
      expect(mealWithReactions.reactions).toHaveLength(2)
      expect(mealWithReactions.reactions?.[0].type).toBe('like')
    })
  })

  describe('SocialFeedItem', () => {
    it('should have all required fields for feed display', () => {
      const feedItem: SocialFeedItem = {
        id: 'feed-1',
        userId: 'user-2',
        userName: 'John Doe',
        userAvatar: 'https://example.com/avatar.jpg',
        foodName: 'Grilled Chicken',
        photoUrl: 'https://example.com/chicken.jpg',
        nutrition: {
          calories: 280,
          proteinG: 40,
          carbsG: 0,
          fatG: 12,
          fiberG: 0,
        },
        timestamp: '2026-04-19T10:00:00Z',
        shareType: 'friends',
        reactions: [
          { type: 'like', count: 5 },
          { type: 'heart', count: 3 },
        ],
      }

      expect(feedItem.userName).toBe('John Doe')
      expect(feedItem.shareType).toBe('friends')
      expect(feedItem.reactions).toHaveLength(2)
    })

    it('should support team shareType', () => {
      const teamFeedItem: SocialFeedItem = {
        id: 'feed-1',
        userId: 'user-2',
        userName: 'Team Member',
        userAvatar: 'https://example.com/avatar.jpg',
        foodName: 'Salad',
        photoUrl: 'https://example.com/salad.jpg',
        nutrition: {
          calories: 150,
          proteinG: 8,
          carbsG: 18,
          fatG: 5,
          fiberG: 4,
        },
        timestamp: '2026-04-19T10:00:00Z',
        shareType: 'team',
        reactions: [],
      }

      expect(teamFeedItem.shareType).toBe('team')
    })

    it('should track reaction counts by type', () => {
      const feedItem: SocialFeedItem = {
        id: 'feed-1',
        userId: 'user-2',
        userName: 'Jane Doe',
        userAvatar: 'https://example.com/avatar.jpg',
        foodName: 'Pasta',
        photoUrl: 'https://example.com/pasta.jpg',
        nutrition: {
          calories: 450,
          proteinG: 15,
          carbsG: 60,
          fatG: 12,
          fiberG: 3,
        },
        timestamp: '2026-04-19T10:00:00Z',
        shareType: 'friends',
        reactions: [
          { type: 'like', count: 10 },
          { type: 'heart', count: 7 },
        ],
      }

      const likeReaction = feedItem.reactions.find((r) => r.type === 'like')
      expect(likeReaction?.count).toBe(10)
    })
  })

  describe('SocialFeedFilter', () => {
    it('should allow filtering by shareType', () => {
      const filter: SocialFeedFilter = {
        shareType: 'friends',
      }

      expect(filter.shareType).toBe('friends')
    })

    it('should allow filtering by userId', () => {
      const filter: SocialFeedFilter = {
        userId: 'user-1',
      }

      expect(filter.userId).toBe('user-1')
    })

    it('should support pagination with limit and offset', () => {
      const filter: SocialFeedFilter = {
        limit: 20,
        offset: 40,
      }

      expect(filter.limit).toBe(20)
      expect(filter.offset).toBe(40)
    })

    it('should support combining multiple filters', () => {
      const filter: SocialFeedFilter = {
        shareType: 'team',
        userId: 'user-1',
        limit: 10,
        offset: 0,
      }

      expect(filter.shareType).toBe('team')
      expect(filter.userId).toBe('user-1')
      expect(filter.limit).toBe(10)
    })
  })
})

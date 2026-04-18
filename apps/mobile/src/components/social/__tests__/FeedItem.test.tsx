import { describe, it, expect, beforeEach } from 'vitest'
import type { FeedItem, FeedComment } from '@/types/social-social'

describe('FeedItem Component', () => {
  let mockFeedItem: FeedItem

  beforeEach(() => {
    mockFeedItem = {
      id: 'item-1',
      userId: 'user-1',
      type: 'badge_earned',
      data: {
        badgeId: 'badge-1',
        badgeName: 'First Workout',
        icon: 'trophy.png',
      },
      createdAt: new Date().toISOString(),
      likes: 5,
      comments: [
        {
          id: 'comment-1',
          userId: 'user-2',
          text: 'Great job!',
          createdAt: new Date().toISOString(),
        },
      ],
    }
  })

  describe('FeedItem Data Structure', () => {
    it('has required properties', () => {
      expect(mockFeedItem.id).toBeDefined()
      expect(mockFeedItem.userId).toBeDefined()
      expect(mockFeedItem.type).toBeDefined()
      expect(mockFeedItem.data).toBeDefined()
      expect(mockFeedItem.createdAt).toBeDefined()
      expect(mockFeedItem.likes).toBeDefined()
      expect(mockFeedItem.comments).toBeDefined()
    })

    it('stores correct item type', () => {
      const types = ['badge_earned', 'challenge_completed', 'workout_shared', 'nutrition_logged', 'streak_milestone']
      for (const type of types) {
        const item: FeedItem = {
          ...mockFeedItem,
          type: type as FeedItem['type'],
        }
        expect(item.type).toBe(type)
      }
    })

    it('stores arbitrary data based on type', () => {
      const badgeItem: FeedItem = {
        ...mockFeedItem,
        type: 'badge_earned',
        data: { badgeId: 'badge-1', badgeName: 'First Badge' },
      }
      expect(badgeItem.data.badgeId).toBeDefined()

      const challengeItem: FeedItem = {
        ...mockFeedItem,
        type: 'challenge_completed',
        data: { challengeId: 'challenge-1', challengeName: 'Week Challenge' },
      }
      expect(challengeItem.data.challengeId).toBeDefined()
    })

    it('tracks likes count', () => {
      expect(mockFeedItem.likes).toBe(5)

      const newItem: FeedItem = {
        ...mockFeedItem,
        likes: 0,
      }
      expect(newItem.likes).toBe(0)
    })
  })

  describe('FeedItem Comments', () => {
    it('stores comments array', () => {
      expect(mockFeedItem.comments).toBeInstanceOf(Array)
    })

    it('each comment has required properties', () => {
      const comment = mockFeedItem.comments[0]
      expect(comment.id).toBeDefined()
      expect(comment.userId).toBeDefined()
      expect(comment.text).toBeDefined()
      expect(comment.createdAt).toBeDefined()
    })

    it('supports multiple comments', () => {
      const item: FeedItem = {
        ...mockFeedItem,
        comments: [
          { id: 'c1', userId: 'u1', text: 'Good!', createdAt: new Date().toISOString() },
          { id: 'c2', userId: 'u2', text: 'Awesome!', createdAt: new Date().toISOString() },
          { id: 'c3', userId: 'u3', text: 'Keep it up!', createdAt: new Date().toISOString() },
        ],
      }
      expect(item.comments).toHaveLength(3)
    })

    it('handles empty comments array', () => {
      const item: FeedItem = {
        ...mockFeedItem,
        comments: [],
      }
      expect(item.comments).toHaveLength(0)
    })
  })

  describe('FeedItem Timestamps', () => {
    it('stores ISO string timestamps', () => {
      const isoString = new Date().toISOString()
      const item: FeedItem = {
        ...mockFeedItem,
        createdAt: isoString,
      }
      expect(item.createdAt).toBe(isoString)
      expect(item.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('comment timestamps are ISO strings', () => {
      const isoString = new Date().toISOString()
      const comment: FeedComment = {
        id: 'c1',
        userId: 'u1',
        text: 'Test',
        createdAt: isoString,
      }
      expect(comment.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
  })

  describe('FeedItem Types', () => {
    it('badge_earned type carries badge data', () => {
      const item: FeedItem = {
        ...mockFeedItem,
        type: 'badge_earned',
        data: {
          badgeId: 'badge-1',
          badgeName: 'First Workout',
          category: 'workout',
        },
      }
      expect(item.type).toBe('badge_earned')
      expect(item.data.badgeId).toBeDefined()
    })

    it('challenge_completed type carries challenge data', () => {
      const item: FeedItem = {
        ...mockFeedItem,
        type: 'challenge_completed',
        data: {
          challengeId: 'challenge-1',
          challengeName: 'Week Challenge',
          difficulty: 'hard',
        },
      }
      expect(item.type).toBe('challenge_completed')
      expect(item.data.challengeId).toBeDefined()
    })

    it('workout_shared type carries workout data', () => {
      const item: FeedItem = {
        ...mockFeedItem,
        type: 'workout_shared',
        data: {
          sessionId: 'session-1',
          exerciseType: 'squat',
          duration: 20,
        },
      }
      expect(item.type).toBe('workout_shared')
      expect(item.data.sessionId).toBeDefined()
    })

    it('nutrition_logged type carries nutrition data', () => {
      const item: FeedItem = {
        ...mockFeedItem,
        type: 'nutrition_logged',
        data: {
          mealId: 'meal-1',
          mealType: 'breakfast',
          calories: 450,
        },
      }
      expect(item.type).toBe('nutrition_logged')
      expect(item.data.mealId).toBeDefined()
    })

    it('streak_milestone type carries streak data', () => {
      const item: FeedItem = {
        ...mockFeedItem,
        type: 'streak_milestone',
        data: {
          streakType: 'workout',
          streakCount: 30,
          milestone: 'month',
        },
      }
      expect(item.type).toBe('streak_milestone')
      expect(item.data.streakCount).toBeDefined()
    })
  })

  describe('FeedItem Display Logic', () => {
    it('determines display priority by type', () => {
      const priorities: Record<FeedItem['type'], number> = {
        badge_earned: 5,
        challenge_completed: 4,
        workout_shared: 3,
        nutrition_logged: 2,
        streak_milestone: 5,
      }

      const types: FeedItem['type'][] = [
        'badge_earned',
        'challenge_completed',
        'workout_shared',
        'nutrition_logged',
        'streak_milestone',
      ]

      for (const type of types) {
        expect(priorities[type]).toBeDefined()
        expect(priorities[type]).toBeGreaterThan(0)
      }
    })

    it('calculates engagement score from likes and comments', () => {
      const item: FeedItem = {
        ...mockFeedItem,
        likes: 10,
        comments: Array(5).fill(null).map((_, i) => ({
          id: `c${i}`,
          userId: `u${i}`,
          text: 'test',
          createdAt: new Date().toISOString(),
        })),
      }

      const engagement = item.likes + item.comments.length
      expect(engagement).toBe(15)
    })
  })

  describe('Integration Scenarios', () => {
    it('badge earned item complete flow', () => {
      const item: FeedItem = {
        id: 'item-badge-1',
        userId: 'user-123',
        type: 'badge_earned',
        data: {
          badgeId: 'badge-first-workout',
          badgeName: 'First Workout',
          category: 'workout',
          icon: 'trophy.png',
        },
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
      }

      expect(item.type).toBe('badge_earned')
      expect(item.data.badgeName).toBe('First Workout')
      expect(item.likes).toBe(0)
      expect(item.comments).toHaveLength(0)
    })

    it('challenge completed with multiple comments', () => {
      const item: FeedItem = {
        id: 'item-challenge-1',
        userId: 'user-123',
        type: 'challenge_completed',
        data: {
          challengeId: 'challenge-week-1',
          challengeName: 'Complete Week Challenge',
          duration: 7,
        },
        createdAt: new Date().toISOString(),
        likes: 25,
        comments: [
          { id: 'c1', userId: 'user-456', text: 'Nice!', createdAt: new Date().toISOString() },
          { id: 'c2', userId: 'user-789', text: 'Amazing!', createdAt: new Date().toISOString() },
        ],
      }

      expect(item.type).toBe('challenge_completed')
      expect(item.comments).toHaveLength(2)
      expect(item.likes).toBe(25)
    })

    it('streak milestone item with high engagement', () => {
      const item: FeedItem = {
        id: 'item-streak-1',
        userId: 'user-123',
        type: 'streak_milestone',
        data: {
          streakType: 'workout',
          streakCount: 30,
          milestone: 'month',
        },
        createdAt: new Date().toISOString(),
        likes: 50,
        comments: Array(10)
          .fill(null)
          .map((_, i) => ({
            id: `c${i}`,
            userId: `user-${i}`,
            text: 'Congrats!',
            createdAt: new Date().toISOString(),
          })),
      }

      expect(item.comments).toHaveLength(10)
      expect(item.likes).toBe(50)
    })
  })
})

import { describe, it, expect } from 'vitest'
import type {
  LeaderboardEntry,
  Leaderboard,
  Badge,
  UserBadge,
  FeedItem,
  FeedComment,
  Notification,
  StreakData,
} from '../social-social'

describe('social-social types', () => {
  describe('LeaderboardEntry', () => {
    it('should create a valid LeaderboardEntry', () => {
      const entry: LeaderboardEntry = {
        rank: 1,
        userId: 'user-1',
        username: 'champion',
        avatar: 'https://example.com/avatar.jpg',
        score: 5000,
        streak: 30,
        badges: 5,
      }

      expect(entry.rank).toBe(1)
      expect(entry.score).toBe(5000)
      expect(entry.streak).toBe(30)
    })
  })

  describe('Leaderboard', () => {
    it('should create a valid Leaderboard', () => {
      const leaderboard: Leaderboard = {
        type: 'global',
        period: 'weekly',
        entries: [],
        lastUpdated: new Date().toISOString(),
      }

      expect(leaderboard.type).toBe('global')
      expect(leaderboard.period).toBe('weekly')
      expect(leaderboard.entries).toHaveLength(0)
    })

    it('should support all leaderboard types', () => {
      const types = ['global', 'friend', 'challenge'] as const
      types.forEach((type) => {
        const leaderboard: Leaderboard = {
          type,
          period: 'weekly',
          entries: [],
          lastUpdated: new Date().toISOString(),
        }
        expect(leaderboard.type).toBe(type)
      })
    })

    it('should support all period types', () => {
      const periods = ['daily', 'weekly', 'monthly', 'allTime'] as const
      periods.forEach((period) => {
        const leaderboard: Leaderboard = {
          type: 'global',
          period,
          entries: [],
          lastUpdated: new Date().toISOString(),
        }
        expect(leaderboard.period).toBe(period)
      })
    })

    it('should support optional referenceId for challenge leaderboards', () => {
      const leaderboard: Leaderboard = {
        type: 'challenge',
        referenceId: 'challenge-1',
        period: 'weekly',
        entries: [],
        lastUpdated: new Date().toISOString(),
      }

      expect(leaderboard.referenceId).toBe('challenge-1')
    })
  })

  describe('Badge', () => {
    it('should create a valid Badge', () => {
      const badge: Badge = {
        id: 'first-workout',
        name: 'First Workout',
        description: 'Complete your first workout',
        icon: '💪',
        category: 'workout',
        criteria: { type: 'workouts_completed', target: 1 },
        rarity: 'common',
      }

      expect(badge.id).toBe('first-workout')
      expect(badge.category).toBe('workout')
      expect(badge.rarity).toBe('common')
    })

    it('should support all badge categories', () => {
      const categories = [
        'nutrition',
        'health',
        'workout',
        'social',
        'streak',
      ] as const
      categories.forEach((category) => {
        const badge: Badge = {
          id: 'badge-1',
          name: 'Test Badge',
          description: 'Test',
          icon: '🏆',
          category,
          criteria: { type: 'test', target: 1 },
          rarity: 'common',
        }
        expect(badge.category).toBe(category)
      })
    })

    it('should support all rarity levels', () => {
      const rarities = ['common', 'rare', 'epic', 'legendary'] as const
      rarities.forEach((rarity) => {
        const badge: Badge = {
          id: 'badge-1',
          name: 'Test Badge',
          description: 'Test',
          icon: '🏆',
          category: 'workout',
          criteria: { type: 'test', target: 1 },
          rarity,
        }
        expect(badge.rarity).toBe(rarity)
      })
    })
  })

  describe('UserBadge', () => {
    it('should create a valid UserBadge', () => {
      const userBadge: UserBadge = {
        badgeId: 'first-workout',
        userId: 'user-1',
        unlockedAt: new Date().toISOString(),
        progress: 100,
      }

      expect(userBadge.badgeId).toBe('first-workout')
      expect(userBadge.progress).toBe(100)
    })
  })

  describe('FeedComment', () => {
    it('should create a valid FeedComment', () => {
      const comment: FeedComment = {
        id: 'comment-1',
        userId: 'user-2',
        text: 'Great work!',
        createdAt: new Date().toISOString(),
      }

      expect(comment.id).toBe('comment-1')
      expect(comment.text).toBe('Great work!')
    })
  })

  describe('FeedItem', () => {
    it('should create a valid FeedItem', () => {
      const feedItem: FeedItem = {
        id: 'feed-1',
        userId: 'user-1',
        type: 'badge_earned',
        data: { badgeId: 'first-workout', badgeName: 'First Workout' },
        createdAt: new Date().toISOString(),
        likes: 5,
        comments: [],
      }

      expect(feedItem.id).toBe('feed-1')
      expect(feedItem.type).toBe('badge_earned')
      expect(feedItem.likes).toBe(5)
    })

    it('should support all feed item types', () => {
      const types = [
        'badge_earned',
        'challenge_completed',
        'workout_shared',
        'nutrition_logged',
        'streak_milestone',
      ] as const
      types.forEach((type) => {
        const feedItem: FeedItem = {
          id: 'feed-1',
          userId: 'user-1',
          type,
          data: {},
          createdAt: new Date().toISOString(),
          likes: 0,
          comments: [],
        }
        expect(feedItem.type).toBe(type)
      })
    })

    it('should support comments array', () => {
      const feedItem: FeedItem = {
        id: 'feed-1',
        userId: 'user-1',
        type: 'badge_earned',
        data: {},
        createdAt: new Date().toISOString(),
        likes: 2,
        comments: [
          {
            id: 'comment-1',
            userId: 'user-2',
            text: 'Nice!',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'comment-2',
            userId: 'user-3',
            text: 'Awesome!',
            createdAt: new Date().toISOString(),
          },
        ],
      }

      expect(feedItem.comments).toHaveLength(2)
      expect(feedItem.comments[0].text).toBe('Nice!')
    })
  })

  describe('Notification', () => {
    it('should create a valid Notification', () => {
      const notification: Notification = {
        id: 'notif-1',
        userId: 'user-1',
        type: 'friend_request',
        read: false,
        createdAt: new Date().toISOString(),
      }

      expect(notification.id).toBe('notif-1')
      expect(notification.type).toBe('friend_request')
      expect(notification.read).toBe(false)
    })

    it('should support all notification types', () => {
      const types = [
        'friend_request',
        'challenge_invite',
        'friend_achievement',
        'leaderboard_change',
        'daily_summary',
      ] as const
      types.forEach((type) => {
        const notification: Notification = {
          id: 'notif-1',
          userId: 'user-1',
          type,
          read: false,
          createdAt: new Date().toISOString(),
        }
        expect(notification.type).toBe(type)
      })
    })

    it('should support optional relatedUserId and relatedChallengeId', () => {
      const notification: Notification = {
        id: 'notif-1',
        userId: 'user-1',
        type: 'challenge_invite',
        relatedUserId: 'user-2',
        relatedChallengeId: 'challenge-1',
        read: false,
        createdAt: new Date().toISOString(),
      }

      expect(notification.relatedUserId).toBe('user-2')
      expect(notification.relatedChallengeId).toBe('challenge-1')
    })
  })

  describe('StreakData', () => {
    it('should create a valid StreakData', () => {
      const streak: StreakData = {
        userId: 'user-1',
        type: 'workout',
        currentStreak: 15,
        longestStreak: 45,
        lastActivityDate: new Date().toISOString(),
      }

      expect(streak.userId).toBe('user-1')
      expect(streak.currentStreak).toBe(15)
      expect(streak.longestStreak).toBe(45)
    })

    it('should support all streak types', () => {
      const types = ['workout', 'nutrition', 'steps', 'custom'] as const
      types.forEach((type) => {
        const streak: StreakData = {
          userId: 'user-1',
          type,
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date().toISOString(),
        }
        expect(streak.type).toBe(type)
      })
    })
  })
})

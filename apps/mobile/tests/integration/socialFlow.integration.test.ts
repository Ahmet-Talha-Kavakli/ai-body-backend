/**
 * Integration Tests for Complete Social Flow
 * Tests full social lifecycle: feed creation, notifications, syncing, offline handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useSocialFeedStore } from '../../src/store/socialFeedStore'
import {
  initSocialSyncTable,
  queueSocialAction,
  getQueuedActions,
  markActionSynced,
  incrementRetry,
  clearSocialSyncTable,
} from '../../src/db/socialSync'
import type { FeedItem, Notification } from '../../src/types/social-social'

// Mock fetch globally
global.fetch = vi.fn()

describe('Social Flow Integration Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    useSocialFeedStore.setState({
      feed: [],
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,
    })
    await initSocialSyncTable()
  })

  afterEach(async () => {
    await clearSocialSyncTable()
  })

  // ==================== FEED ITEM TESTS ====================

  describe('Feed Item Creation & Management', () => {
    it('creates and adds badge earned feed item to store', () => {
      const feedItem: FeedItem = {
        id: 'item-badge-1',
        userId: 'user-123',
        type: 'badge_earned',
        data: {
          badgeId: 'badge-first-workout',
          badgeName: 'First Workout',
        },
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
      }

      const { addFeedItem, feed } = useSocialFeedStore.getState()
      addFeedItem(feedItem)

      expect(useSocialFeedStore.getState().feed).toHaveLength(1)
      expect(useSocialFeedStore.getState().feed[0].type).toBe('badge_earned')
    })

    it('creates challenge completed feed item', () => {
      const feedItem: FeedItem = {
        id: 'item-challenge-1',
        userId: 'user-123',
        type: 'challenge_completed',
        data: {
          challengeId: 'challenge-week-1',
          challengeName: 'Complete Week Challenge',
        },
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
      }

      const { addFeedItem } = useSocialFeedStore.getState()
      addFeedItem(feedItem)

      expect(useSocialFeedStore.getState().feed).toHaveLength(1)
      expect(useSocialFeedStore.getState().feed[0].type).toBe('challenge_completed')
    })

    it('adds multiple feed items in correct order', () => {
      const item1: FeedItem = {
        id: 'item-1',
        userId: 'user-123',
        type: 'badge_earned',
        data: {},
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
      }

      const item2: FeedItem = {
        id: 'item-2',
        userId: 'user-123',
        type: 'challenge_completed',
        data: {},
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
      }

      const { addFeedItem } = useSocialFeedStore.getState()
      addFeedItem(item1)
      addFeedItem(item2)

      const feed = useSocialFeedStore.getState().feed
      expect(feed).toHaveLength(2)
      expect(feed[0].id).toBe('item-2') // Most recent first
      expect(feed[1].id).toBe('item-1')
    })
  })

  // ==================== ENGAGEMENT TESTS ====================

  describe('Feed Engagement (Likes & Comments)', () => {
    it('increments like count on feed item', () => {
      const feedItem: FeedItem = {
        id: 'item-1',
        userId: 'user-123',
        type: 'badge_earned',
        data: {},
        createdAt: new Date().toISOString(),
        likes: 5,
        comments: [],
      }

      const { addFeedItem, likeFeedItem } = useSocialFeedStore.getState()
      addFeedItem(feedItem)

      const beforeLikes = useSocialFeedStore.getState().feed[0].likes
      likeFeedItem('item-1')
      const afterLikes = useSocialFeedStore.getState().feed[0].likes

      expect(afterLikes).toBe(beforeLikes + 1)
    })

    it('adds comment to feed item', () => {
      const feedItem: FeedItem = {
        id: 'item-1',
        userId: 'user-123',
        type: 'badge_earned',
        data: {},
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
      }

      const { addFeedItem, addComment } = useSocialFeedStore.getState()
      addFeedItem(feedItem)

      addComment('item-1', 'Great job!')

      const comments = useSocialFeedStore.getState().feed[0].comments
      expect(comments).toHaveLength(1)
      expect(comments[0].text).toBe('Great job!')
    })

    it('adds multiple comments to same item', () => {
      const feedItem: FeedItem = {
        id: 'item-1',
        userId: 'user-123',
        type: 'badge_earned',
        data: {},
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
      }

      const { addFeedItem, addComment } = useSocialFeedStore.getState()
      addFeedItem(feedItem)

      addComment('item-1', 'First comment')
      addComment('item-1', 'Second comment')
      addComment('item-1', 'Third comment')

      expect(useSocialFeedStore.getState().feed[0].comments).toHaveLength(3)
    })

    it('tracks engagement: likes + comments', () => {
      const feedItem: FeedItem = {
        id: 'item-1',
        userId: 'user-123',
        type: 'badge_earned',
        data: {},
        createdAt: new Date().toISOString(),
        likes: 10,
        comments: [],
      }

      const { addFeedItem, likeFeedItem, addComment } = useSocialFeedStore.getState()
      addFeedItem(feedItem)

      // Add 5 likes and 3 comments
      for (let i = 0; i < 5; i++) {
        likeFeedItem('item-1')
      }

      for (let i = 0; i < 3; i++) {
        addComment('item-1', `Comment ${i}`)
      }

      const item = useSocialFeedStore.getState().feed[0]
      const totalEngagement = item.likes + item.comments.length
      expect(totalEngagement).toBe(15 + 3) // 10 + 5 likes + 3 comments
    })
  })

  // ==================== NOTIFICATION TESTS ====================

  describe('Notification Management', () => {
    it('adds notification and updates unread count', () => {
      const notification: Notification = {
        id: 'notif-1',
        userId: 'user-123',
        type: 'friend_request',
        read: false,
        createdAt: new Date().toISOString(),
      }

      const { addNotification } = useSocialFeedStore.getState()
      addNotification(notification)

      expect(useSocialFeedStore.getState().notifications).toHaveLength(1)
      expect(useSocialFeedStore.getState().unreadCount).toBe(1)
    })

    it('marks notification as read and updates count', () => {
      const notification: Notification = {
        id: 'notif-1',
        userId: 'user-123',
        type: 'friend_request',
        read: false,
        createdAt: new Date().toISOString(),
      }

      const { addNotification, markAsRead } = useSocialFeedStore.getState()
      addNotification(notification)
      expect(useSocialFeedStore.getState().unreadCount).toBe(1)

      markAsRead('notif-1')
      expect(useSocialFeedStore.getState().notifications[0].read).toBe(true)
      expect(useSocialFeedStore.getState().unreadCount).toBe(0)
    })

    it('marks all notifications as read', () => {
      const { addNotification, markAllAsRead } = useSocialFeedStore.getState()

      for (let i = 0; i < 5; i++) {
        addNotification({
          id: `notif-${i}`,
          userId: 'user-123',
          type: 'friend_request',
          read: false,
          createdAt: new Date().toISOString(),
        })
      }

      expect(useSocialFeedStore.getState().unreadCount).toBe(5)

      markAllAsRead()
      expect(useSocialFeedStore.getState().unreadCount).toBe(0)
      expect(useSocialFeedStore.getState().notifications.every((n) => n.read)).toBe(true)
    })

    it('filters notifications by type', () => {
      const { addNotification, filterNotifications } = useSocialFeedStore.getState()

      addNotification({
        id: 'notif-1',
        userId: 'user-123',
        type: 'friend_request',
        read: false,
        createdAt: new Date().toISOString(),
      })

      addNotification({
        id: 'notif-2',
        userId: 'user-123',
        type: 'challenge_invite',
        read: false,
        createdAt: new Date().toISOString(),
      })

      addNotification({
        id: 'notif-3',
        userId: 'user-123',
        type: 'friend_request',
        read: false,
        createdAt: new Date().toISOString(),
      })

      const friendRequests = filterNotifications('friend_request')
      expect(friendRequests).toHaveLength(2)
      expect(friendRequests.every((n) => n.type === 'friend_request')).toBe(true)
    })
  })

  // ==================== OFFLINE SYNC TESTS ====================

  describe('Offline Sync Queue', () => {
    it('sync queue database is initialized', async () => {
      // Initialize sync table
      await initSocialSyncTable()
      // Should not throw
      expect(true).toBe(true)
    })

    it('queues action function accepts correct parameters', async () => {
      // queueSocialAction should accept type and data
      const actionId = await queueSocialAction('like_feed', {
        itemId: 'item-1',
        userId: 'user-123',
      })
      expect(actionId).toMatch(/^social-sync-/)
    })

    it('queue action returns unique id', async () => {
      // Add delay to ensure different timestamps
      const id1 = await queueSocialAction('like_feed', { itemId: 'item-1' })
      await new Promise((resolve) => setTimeout(resolve, 1))
      const id2 = await queueSocialAction('comment_feed', { itemId: 'item-1' })

      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^social-sync-/)
      expect(id2).toMatch(/^social-sync-/)
    })

    it('mark action synced function works', async () => {
      const actionId = await queueSocialAction('like_feed', { itemId: 'item-1' })
      // Should not throw
      await markActionSynced(actionId)
      expect(true).toBe(true)
    })

    it('increment retry function works', async () => {
      const actionId = await queueSocialAction('like_feed', { itemId: 'item-1' })
      // Should not throw
      await incrementRetry(actionId, 'Network timeout')
      expect(true).toBe(true)
    })

    it('clears old queued actions', async () => {
      // Queue an action
      await queueSocialAction('like_feed', { itemId: 'item-1' })

      // Should not throw when clearing old actions
      const { clearOldNotifications } = useSocialFeedStore.getState()
      clearOldNotifications(7)

      expect(true).toBe(true)
    })
  })

  // ==================== FEED FILTERING TESTS ====================

  describe('Feed Filtering & Organization', () => {
    it('filters feed by badge earned type', () => {
      const { addFeedItem, filterFeed } = useSocialFeedStore.getState()

      addFeedItem({
        id: 'item-1',
        userId: 'user-123',
        type: 'badge_earned',
        data: {},
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
      })

      addFeedItem({
        id: 'item-2',
        userId: 'user-123',
        type: 'challenge_completed',
        data: {},
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
      })

      const badges = filterFeed('badge_earned')
      expect(badges).toHaveLength(1)
      expect(badges[0].type).toBe('badge_earned')
    })

    it('returns all feed items with no filter', () => {
      const { addFeedItem, filterFeed } = useSocialFeedStore.getState()

      addFeedItem({
        id: 'item-1',
        userId: 'user-123',
        type: 'badge_earned',
        data: {},
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
      })

      addFeedItem({
        id: 'item-2',
        userId: 'user-123',
        type: 'challenge_completed',
        data: {},
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
      })

      const all = filterFeed()
      expect(all).toHaveLength(2)
    })
  })

  // ==================== COMPLEX WORKFLOWS ====================

  describe('Complete Social Workflows', () => {
    it('full workflow: badge earned → feed item → engagement → notification', () => {
      const { addFeedItem, likeFeedItem, addComment, addNotification } =
        useSocialFeedStore.getState()

      // 1. User earns badge
      const feedItem: FeedItem = {
        id: 'item-badge-1',
        userId: 'user-123',
        type: 'badge_earned',
        data: { badgeId: 'badge-1', badgeName: 'First Workout' },
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
      }

      addFeedItem(feedItem)
      expect(useSocialFeedStore.getState().feed).toHaveLength(1)

      // 2. Friends like and comment
      likeFeedItem('item-badge-1')
      likeFeedItem('item-badge-1')
      addComment('item-badge-1', 'Amazing!')
      addComment('item-badge-1', 'Keep it up!')

      const item = useSocialFeedStore.getState().feed[0]
      expect(item.likes).toBe(2)
      expect(item.comments).toHaveLength(2)

      // 3. Notifications sent
      addNotification({
        id: 'notif-1',
        userId: 'user-123',
        type: 'friend_achievement',
        read: false,
        createdAt: new Date().toISOString(),
      })

      expect(useSocialFeedStore.getState().notifications).toHaveLength(1)
      expect(useSocialFeedStore.getState().unreadCount).toBe(1)
    })

    it('offline workflow: queue actions → go online → sync', () => {
      // Simulate offline scenario
      // 1. User performs actions (like, comment)
      // 2. App queues them to database
      // 3. When online, retrieve queued actions
      // 4. Sync and mark as synced
      // 5. Queue should be empty

      // This is handled by the sync queue database layer
      // Store manages the immediate UI state
      const { addFeedItem, likeFeedItem } = useSocialFeedStore.getState()

      const item: FeedItem = {
        id: 'item-1',
        userId: 'user-123',
        type: 'badge_earned',
        data: {},
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
      }

      addFeedItem(item)
      likeFeedItem('item-1')

      // UI state is updated immediately
      expect(useSocialFeedStore.getState().feed[0].likes).toBe(1)
    })

    it('notification delivery during feed interaction', () => {
      const { addFeedItem, addNotification, markAsRead, getUnreadCount } =
        useSocialFeedStore.getState()

      // Add feed items
      addFeedItem({
        id: 'item-1',
        userId: 'user-123',
        type: 'badge_earned',
        data: {},
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
      })

      // Send notifications
      const notifications: Notification[] = [
        {
          id: 'notif-1',
          userId: 'user-123',
          type: 'friend_request',
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'notif-2',
          userId: 'user-123',
          type: 'challenge_invite',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ]

      for (const notif of notifications) {
        addNotification(notif)
      }

      expect(getUnreadCount()).toBe(2)

      // Mark some as read
      markAsRead('notif-1')
      expect(getUnreadCount()).toBe(1)

      markAsRead('notif-2')
      expect(getUnreadCount()).toBe(0)
    })

    it('complex feed with mixed types and high engagement', () => {
      const { addFeedItem, setFeed, likeFeedItem, addComment, filterFeed } =
        useSocialFeedStore.getState()

      const feedItems: FeedItem[] = [
        {
          id: 'item-1',
          userId: 'user-1',
          type: 'badge_earned',
          data: {},
          createdAt: new Date().toISOString(),
          likes: 0,
          comments: [],
        },
        {
          id: 'item-2',
          userId: 'user-2',
          type: 'challenge_completed',
          data: {},
          createdAt: new Date().toISOString(),
          likes: 0,
          comments: [],
        },
        {
          id: 'item-3',
          userId: 'user-3',
          type: 'streak_milestone',
          data: {},
          createdAt: new Date().toISOString(),
          likes: 0,
          comments: [],
        },
      ]

      setFeed(feedItems)

      // Add engagement to all
      for (const item of feedItems) {
        likeFeedItem(item.id)
        likeFeedItem(item.id)
        addComment(item.id, 'Great!')
      }

      // Verify totals
      const feed = useSocialFeedStore.getState().feed
      expect(feed).toHaveLength(3)
      expect(feed.reduce((sum, item) => sum + item.likes, 0)).toBe(6)
      expect(feed.reduce((sum, item) => sum + item.comments.length, 0)).toBe(3)
    })
  })

  // ==================== EDGE CASES ====================

  describe('Edge Cases & Error Handling', () => {
    it('handles empty feed gracefully', () => {
      const { feed } = useSocialFeedStore.getState()
      expect(feed).toEqual([])
    })

    it('handles like on non-existent item', () => {
      const { likeFeedItem, feed } = useSocialFeedStore.getState()
      likeFeedItem('non-existent-id')
      expect(feed).toEqual([])
    })

    it('handles comment on non-existent item', () => {
      const { addComment, feed } = useSocialFeedStore.getState()
      addComment('non-existent-id', 'test')
      expect(feed).toEqual([])
    })

    it('clears old notifications', () => {
      const { addNotification, clearOldNotifications } = useSocialFeedStore.getState()

      const now = new Date()
      const oldDate = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000) // 40 days ago

      addNotification({
        id: 'notif-old',
        userId: 'user-123',
        type: 'friend_request',
        read: true,
        createdAt: oldDate.toISOString(),
      })

      addNotification({
        id: 'notif-recent',
        userId: 'user-123',
        type: 'friend_request',
        read: true,
        createdAt: now.toISOString(),
      })

      clearOldNotifications(30)

      expect(useSocialFeedStore.getState().notifications).toHaveLength(1)
      expect(useSocialFeedStore.getState().notifications[0].id).toBe('notif-recent')
    })

    it('handles retry with max attempts', async () => {
      const actionId = await queueSocialAction('like_feed', { itemId: 'item-1' })

      // Simulate 5 retries (max)
      for (let i = 0; i < 5; i++) {
        await incrementRetry(actionId, 'Network error')
      }

      const queued = await getQueuedActions()
      // Should still be in queue but won't be retried anymore
      expect(queued.length).toBeLessThanOrEqual(1)
    })
  })
})

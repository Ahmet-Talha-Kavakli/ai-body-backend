import { describe, it, expect, beforeEach } from 'vitest'
import { useSocialFeedStore } from '../socialFeedStore'
import type { FeedItem, Notification } from '@/types/social-social'

describe('SocialFeedStore', () => {
  beforeEach(() => {
    useSocialFeedStore.setState({
      feed: [],
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,
    })
  })

  function getState() {
    return useSocialFeedStore.getState()
  }

  describe('State Initialization', () => {
    it('initializes with empty feed', () => {
      expect(getState().feed).toEqual([])
    })

    it('initializes with empty notifications', () => {
      expect(getState().notifications).toEqual([])
    })

    it('initializes with unreadCount 0', () => {
      expect(getState().unreadCount).toBe(0)
    })

    it('initializes with loading false', () => {
      expect(getState().loading).toBe(false)
    })

    it('initializes with error null', () => {
      expect(getState().error).toBeNull()
    })
  })

  describe('setFeed', () => {
    it('sets feed array', () => {
      const mockFeed = [createMockFeedItem('item-1'), createMockFeedItem('item-2')]
      getState().setFeed(mockFeed)

      expect(getState().feed).toEqual(mockFeed)
      expect(getState().feed).toHaveLength(2)
    })

    it('replaces existing feed', () => {
      const feed1 = [createMockFeedItem('item-1')]
      const feed2 = [createMockFeedItem('item-2'), createMockFeedItem('item-3')]

      getState().setFeed(feed1)
      getState().setFeed(feed2)

      expect(getState().feed).toEqual(feed2)
      expect(getState().feed).toHaveLength(2)
    })
  })

  describe('setNotifications', () => {
    it('sets notifications and calculates unread count', () => {
      const notifications = [
        createMockNotification('notif-1', false),
        createMockNotification('notif-2', true),
        createMockNotification('notif-3', false),
      ]
      getState().setNotifications(notifications)

      expect(getState().notifications).toEqual(notifications)
      expect(getState().unreadCount).toBe(2)
    })

    it('updates unread count to 0 when all read', () => {
      const notifications = [
        createMockNotification('notif-1', true),
        createMockNotification('notif-2', true),
      ]
      getState().setNotifications(notifications)

      expect(getState().unreadCount).toBe(0)
    })

    it('handles empty notifications array', () => {
      getState().setNotifications([])

      expect(getState().notifications).toEqual([])
      expect(getState().unreadCount).toBe(0)
    })
  })

  describe('setLoading', () => {
    it('sets loading state', () => {
      getState().setLoading(true)
      expect(getState().loading).toBe(true)

      getState().setLoading(false)
      expect(getState().loading).toBe(false)
    })
  })

  describe('setError', () => {
    it('sets error message', () => {
      getState().setError('Test error')
      expect(getState().error).toBe('Test error')
    })

    it('clears error when set to null', () => {
      getState().setError('Test error')
      getState().setError(null)
      expect(getState().error).toBeNull()
    })
  })

  describe('addFeedItem', () => {
    it('adds item to start of feed', () => {
      const item1 = createMockFeedItem('item-1')
      const item2 = createMockFeedItem('item-2')

      getState().addFeedItem(item1)
      getState().addFeedItem(item2)

      expect(getState().feed).toHaveLength(2)
      expect(getState().feed[0].id).toBe('item-2')
      expect(getState().feed[1].id).toBe('item-1')
    })

    it('preserves existing feed items', () => {
      const item1 = createMockFeedItem('item-1')
      const item2 = createMockFeedItem('item-2')

      getState().setFeed([item1])
      getState().addFeedItem(item2)

      expect(getState().feed).toHaveLength(2)
      expect(getState().feed[0].id).toBe('item-2')
      expect(getState().feed[1].id).toBe('item-1')
    })
  })

  describe('likeFeedItem', () => {
    it('increments likes for feed item', () => {
      const item = createMockFeedItem('item-1')
      getState().setFeed([item])

      getState().likeFeedItem('item-1')

      expect(getState().feed[0].likes).toBe(item.likes + 1)
    })

    it('does not affect other items', () => {
      const item1 = createMockFeedItem('item-1')
      const item2 = createMockFeedItem('item-2')
      getState().setFeed([item1, item2])

      getState().likeFeedItem('item-1')

      expect(getState().feed[0].likes).toBe(item1.likes + 1)
      expect(getState().feed[1].likes).toBe(item2.likes)
    })

    it('handles non-existent item gracefully', () => {
      const item = createMockFeedItem('item-1')
      getState().setFeed([item])

      getState().likeFeedItem('non-existent')

      expect(getState().feed).toHaveLength(1)
      expect(getState().feed[0].likes).toBe(item.likes)
    })
  })

  describe('addComment', () => {
    it('adds comment to feed item', () => {
      const item = createMockFeedItem('item-1')
      getState().setFeed([item])

      getState().addComment('item-1', 'Great post!')

      expect(getState().feed[0].comments).toHaveLength(item.comments.length + 1)
      expect(getState().feed[0].comments[item.comments.length].text).toBe('Great post!')
    })

    it('preserves existing comments', () => {
      const item = createMockFeedItem('item-1')
      getState().setFeed([item])
      const originalCommentCount = item.comments.length

      getState().addComment('item-1', 'Comment 1')
      getState().addComment('item-1', 'Comment 2')

      expect(getState().feed[0].comments).toHaveLength(originalCommentCount + 2)
    })

    it('does not affect other items', () => {
      const item1 = createMockFeedItem('item-1')
      const item2 = createMockFeedItem('item-2')
      getState().setFeed([item1, item2])

      getState().addComment('item-1', 'Comment')

      expect(getState().feed[0].comments).toHaveLength(item1.comments.length + 1)
      expect(getState().feed[1].comments).toHaveLength(item2.comments.length)
    })
  })

  describe('addNotification', () => {
    it('adds notification to start of array', () => {
      const notif1 = createMockNotification('notif-1')
      const notif2 = createMockNotification('notif-2')

      getState().addNotification(notif1)
      getState().addNotification(notif2)

      expect(getState().notifications).toHaveLength(2)
      expect(getState().notifications[0].id).toBe('notif-2')
    })

    it('increments unread count for unread notification', () => {
      const notif = createMockNotification('notif-1', false)
      getState().addNotification(notif)

      expect(getState().unreadCount).toBe(1)
    })

    it('does not increment unread count for read notification', () => {
      const notif = createMockNotification('notif-1', true)
      getState().addNotification(notif)

      expect(getState().unreadCount).toBe(0)
    })
  })

  describe('markAsRead', () => {
    it('marks notification as read', () => {
      const notif = createMockNotification('notif-1', false)
      getState().setNotifications([notif])

      getState().markAsRead('notif-1')

      expect(getState().notifications[0].read).toBe(true)
    })

    it('decrements unread count', () => {
      const notifications = [
        createMockNotification('notif-1', false),
        createMockNotification('notif-2', false),
      ]
      getState().setNotifications(notifications)
      expect(getState().unreadCount).toBe(2)

      getState().markAsRead('notif-1')

      expect(getState().unreadCount).toBe(1)
    })

    it('does not decrement unread count if already read', () => {
      const notif = createMockNotification('notif-1', true)
      getState().setNotifications([notif])
      expect(getState().unreadCount).toBe(0)

      getState().markAsRead('notif-1')

      expect(getState().unreadCount).toBe(0)
    })
  })

  describe('markAllAsRead', () => {
    it('marks all notifications as read', () => {
      const notifications = [
        createMockNotification('notif-1', false),
        createMockNotification('notif-2', false),
        createMockNotification('notif-3', true),
      ]
      getState().setNotifications(notifications)

      getState().markAllAsRead()

      expect(getState().notifications.every((n) => n.read)).toBe(true)
    })

    it('sets unread count to 0', () => {
      const notifications = [
        createMockNotification('notif-1', false),
        createMockNotification('notif-2', false),
      ]
      getState().setNotifications(notifications)
      expect(getState().unreadCount).toBe(2)

      getState().markAllAsRead()

      expect(getState().unreadCount).toBe(0)
    })
  })

  describe('getUnreadCount', () => {
    it('returns current unread count', () => {
      const notifications = [
        createMockNotification('notif-1', false),
        createMockNotification('notif-2', false),
      ]
      getState().setNotifications(notifications)

      expect(getState().getUnreadCount()).toBe(2)
    })

    it('returns 0 when all read', () => {
      const notifications = [
        createMockNotification('notif-1', true),
        createMockNotification('notif-2', true),
      ]
      getState().setNotifications(notifications)

      expect(getState().getUnreadCount()).toBe(0)
    })
  })

  describe('clearOldNotifications', () => {
    it('removes notifications older than specified days', () => {
      const now = new Date()
      const oldDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
      const recentDate = now.toISOString()

      const oldNotif = createMockNotification('notif-1', true, oldDate.toISOString())
      const recentNotif = createMockNotification('notif-2', true, recentDate)

      getState().setNotifications([oldNotif, recentNotif])

      getState().clearOldNotifications(5)

      expect(getState().notifications).toHaveLength(1)
      expect(getState().notifications[0].id).toBe('notif-2')
    })

    it('keeps recent notifications', () => {
      const now = new Date()
      const notif1 = createMockNotification('notif-1', true, now.toISOString())
      const notif2 = createMockNotification('notif-2', true, now.toISOString())

      getState().setNotifications([notif1, notif2])

      getState().clearOldNotifications(5)

      expect(getState().notifications).toHaveLength(2)
    })
  })

  describe('filterFeed', () => {
    it('returns all feed items when no type specified', () => {
      const items = [
        createMockFeedItem('item-1', 'badge_earned'),
        createMockFeedItem('item-2', 'challenge_completed'),
      ]
      getState().setFeed(items)

      expect(getState().filterFeed()).toEqual(items)
    })

    it('filters feed by type', () => {
      const items = [
        createMockFeedItem('item-1', 'badge_earned'),
        createMockFeedItem('item-2', 'challenge_completed'),
        createMockFeedItem('item-3', 'badge_earned'),
      ]
      getState().setFeed(items)

      const filtered = getState().filterFeed('badge_earned')

      expect(filtered).toHaveLength(2)
      expect(filtered.every((i) => i.type === 'badge_earned')).toBe(true)
    })

    it('returns empty array for non-existent type', () => {
      const items = [
        createMockFeedItem('item-1', 'badge_earned'),
        createMockFeedItem('item-2', 'challenge_completed'),
      ]
      getState().setFeed(items)

      expect(getState().filterFeed('non_existent')).toEqual([])
    })
  })

  describe('filterNotifications', () => {
    it('returns all notifications when no type specified', () => {
      const notifications = [
        createMockNotification('notif-1', true, undefined, 'friend_request'),
        createMockNotification('notif-2', true, undefined, 'challenge_invite'),
      ]
      getState().setNotifications(notifications)

      expect(getState().filterNotifications()).toEqual(notifications)
    })

    it('filters notifications by type', () => {
      const notifications = [
        createMockNotification('notif-1', true, undefined, 'friend_request'),
        createMockNotification('notif-2', true, undefined, 'challenge_invite'),
        createMockNotification('notif-3', true, undefined, 'friend_request'),
      ]
      getState().setNotifications(notifications)

      const filtered = getState().filterNotifications('friend_request')

      expect(filtered).toHaveLength(2)
      expect(filtered.every((n) => n.type === 'friend_request')).toBe(true)
    })

    it('returns empty array for non-existent type', () => {
      const notifications = [
        createMockNotification('notif-1', true, undefined, 'friend_request'),
      ]
      getState().setNotifications(notifications)

      expect(getState().filterNotifications('non_existent')).toEqual([])
    })
  })

  describe('Integration Scenarios', () => {
    it('manages complete social workflow: feed → comments → notifications', () => {
      const item = createMockFeedItem('item-1')
      const notif = createMockNotification('notif-1')

      getState().setFeed([item])
      getState().addComment('item-1', 'Nice workout!')
      getState().addNotification(notif)

      expect(getState().feed[0].comments.length).toBeGreaterThan(0)
      expect(getState().notifications).toHaveLength(1)
    })

    it('tracks unread notifications during feed interaction', () => {
      const item = createMockFeedItem('item-1')
      const notif1 = createMockNotification('notif-1', false)
      const notif2 = createMockNotification('notif-2', false)

      getState().setFeed([item])
      getState().addNotification(notif1)
      getState().addNotification(notif2)

      expect(getState().getUnreadCount()).toBe(2)

      getState().markAsRead('notif-1')
      expect(getState().getUnreadCount()).toBe(1)

      getState().markAllAsRead()
      expect(getState().getUnreadCount()).toBe(0)
    })

    it('maintains separate feed and notification state', () => {
      const feed = [createMockFeedItem('item-1'), createMockFeedItem('item-2')]
      const notif = createMockNotification('notif-1')

      getState().setFeed(feed)
      getState().addNotification(notif)

      expect(getState().feed).toHaveLength(2)
      expect(getState().notifications).toHaveLength(1)

      getState().addComment('item-1', 'Comment')
      expect(getState().feed[0].comments.length).toBeGreaterThan(0)
      expect(getState().notifications).toHaveLength(1)
    })

    it('handles loading and error states during feed operations', () => {
      getState().setLoading(true)
      getState().setError(null)
      expect(getState().loading).toBe(true)

      getState().setLoading(false)
      getState().setError('Network error')
      expect(getState().error).toBe('Network error')

      getState().setError(null)
      expect(getState().error).toBeNull()
    })
  })
})

// Helper functions
function createMockFeedItem(
  id: string,
  type: 'badge_earned' | 'challenge_completed' | 'workout_shared' | 'nutrition_logged' | 'streak_milestone' = 'badge_earned'
): FeedItem {
  return {
    id,
    userId: `user-${id}`,
    type,
    data: { title: `Item ${id}` },
    createdAt: new Date().toISOString(),
    likes: 0,
    comments: [],
  }
}

function createMockNotification(
  id: string,
  read: boolean = false,
  createdAt: string = new Date().toISOString(),
  type: 'friend_request' | 'challenge_invite' | 'friend_achievement' | 'leaderboard_change' | 'daily_summary' = 'friend_request'
): Notification {
  return {
    id,
    userId: 'current-user',
    type,
    read,
    createdAt,
  }
}

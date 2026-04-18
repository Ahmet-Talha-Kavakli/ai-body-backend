import { create } from 'zustand'
import type { FeedItem, Notification } from '@/types/social-social'

interface SocialFeedState {
  feed: FeedItem[]
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null

  setFeed: (feed: FeedItem[]) => void
  setNotifications: (notifications: Notification[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  addFeedItem: (item: FeedItem) => void
  likeFeedItem: (itemId: string) => void
  addComment: (itemId: string, text: string) => void

  addNotification: (notification: Notification) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  getUnreadCount: () => number
  clearOldNotifications: (daysOld: number) => void

  filterFeed: (type?: string) => FeedItem[]
  filterNotifications: (type?: string) => Notification[]
}

export const useSocialFeedStore = create<SocialFeedState>((set, get) => ({
  feed: [],
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  setFeed: (feed) => set({ feed }),

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.read).length
    set({ notifications, unreadCount })
  },

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  addFeedItem: (item) =>
    set((state) => ({
      feed: [item, ...state.feed],
    })),

  likeFeedItem: (itemId) =>
    set((state) => ({
      feed: state.feed.map((item) =>
        item.id === itemId ? { ...item, likes: item.likes + 1 } : item
      ),
    })),

  addComment: (itemId, text) =>
    set((state) => ({
      feed: state.feed.map((item) =>
        item.id === itemId
          ? {
              ...item,
              comments: [
                ...item.comments,
                {
                  id: `comment-${Date.now()}`,
                  userId: 'current-user',
                  text,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : item
      ),
    })),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: !notification.read ? state.unreadCount + 1 : state.unreadCount,
    })),

  markAsRead: (notificationId) =>
    set((state) => {
      const wasUnread = state.notifications.find((n) => n.id === notificationId)?.read === false
      return {
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
      }
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  getUnreadCount: () => get().unreadCount,

  clearOldNotifications: (daysOld) => {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
    set((state) => ({
      notifications: state.notifications.filter((n) => new Date(n.createdAt) > cutoff),
    }))
  },

  filterFeed: (type) => {
    const { feed } = get()
    return type ? feed.filter((item) => item.type === type) : feed
  },

  filterNotifications: (type) => {
    const { notifications } = get()
    return type ? notifications.filter((n) => n.type === type) : notifications
  },
}))

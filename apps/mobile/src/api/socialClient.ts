import { getAuthenticatedClient } from './client'
import type { UserProfile, Friendship } from '../types/social'
import type { Challenge } from '../types/challenge'

export const socialClient = {
  // Friends
  friends: {
    search: async (query: string) => {
      const client = await getAuthenticatedClient()
      return client.get('/api/social/friends/search', { params: { q: query } })
    },
    list: async () => {
      const client = await getAuthenticatedClient()
      return client.get('/api/social/friends/list')
    },
    getProfile: async (userId: string) => {
      const client = await getAuthenticatedClient()
      return client.get(`/api/social/users/${userId}/profile`)
    },
    sendRequest: async (toUserId: string) => {
      const client = await getAuthenticatedClient()
      return client.post('/api/social/friends/request', { toUserId })
    },
    acceptRequest: async (fromUserId: string) => {
      const client = await getAuthenticatedClient()
      return client.post('/api/social/friends/accept', { fromUserId })
    },
    rejectRequest: async (fromUserId: string) => {
      const client = await getAuthenticatedClient()
      return client.post('/api/social/friends/reject', { fromUserId })
    },
    block: async (userId: string) => {
      const client = await getAuthenticatedClient()
      return client.post('/api/social/friends/block', { userId })
    },
  },

  // Challenges
  challenges: {
    list: async () => {
      const client = await getAuthenticatedClient()
      return client.get('/api/social/challenges')
    },
    get: async (challengeId: string) => {
      const client = await getAuthenticatedClient()
      return client.get(`/api/social/challenges/${challengeId}`)
    },
    create: async (data: any) => {
      const client = await getAuthenticatedClient()
      return client.post('/api/social/challenges', data)
    },
    join: async (challengeId: string) => {
      const client = await getAuthenticatedClient()
      return client.post(`/api/social/challenges/${challengeId}/join`)
    },
    getProgress: async (challengeId: string) => {
      const client = await getAuthenticatedClient()
      return client.get(`/api/social/challenges/${challengeId}/progress`)
    },
    updateProgress: async (challengeId: string, value: number) => {
      const client = await getAuthenticatedClient()
      return client.put(`/api/social/challenges/${challengeId}/progress`, { value })
    },
  },

  // Leaderboards
  leaderboards: {
    global: async (period?: string) => {
      const client = await getAuthenticatedClient()
      return client.get('/api/social/leaderboards/global', { params: { period } })
    },
    friends: async (period?: string) => {
      const client = await getAuthenticatedClient()
      return client.get('/api/social/leaderboards/friends', { params: { period } })
    },
    challenge: async (challengeId: string) => {
      const client = await getAuthenticatedClient()
      return client.get(`/api/social/leaderboards/challenges/${challengeId}`)
    },
    myRank: async (period?: string) => {
      const client = await getAuthenticatedClient()
      return client.get('/api/social/leaderboards/my-rank', { params: { period } })
    },
  },

  // Badges
  badges: {
    list: async () => {
      const client = await getAuthenticatedClient()
      return client.get('/api/social/badges')
    },
    getUserBadges: async (userId: string) => {
      const client = await getAuthenticatedClient()
      return client.get(`/api/social/badges/users/${userId}`)
    },
    unlock: async (badgeId: string) => {
      const client = await getAuthenticatedClient()
      return client.post('/api/social/badges/unlock', { badgeId })
    },
  },

  // Feed & Notifications
  feed: {
    get: async () => {
      const client = await getAuthenticatedClient()
      return client.get('/api/social/feed')
    },
    like: async (feedItemId: string) => {
      const client = await getAuthenticatedClient()
      return client.post(`/api/social/feed/${feedItemId}/like`)
    },
    comment: async (feedItemId: string, text: string) => {
      const client = await getAuthenticatedClient()
      return client.post(`/api/social/feed/${feedItemId}/comment`, { text })
    },
  },

  notifications: {
    list: async () => {
      const client = await getAuthenticatedClient()
      return client.get('/api/social/notifications')
    },
    markAsRead: async (notificationId: string) => {
      const client = await getAuthenticatedClient()
      return client.put(`/api/social/notifications/${notificationId}/read`)
    },
  },
}

export default socialClient

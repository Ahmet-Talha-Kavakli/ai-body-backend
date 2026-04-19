import { describe, it, expect, beforeEach, vi } from 'vitest'
import { socialSharingClient } from '../socialSharingClient'
import type { SharedMeal, SocialFeedItem } from '../../types/social'

global.fetch = vi.fn()

describe('socialSharingClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('shareMeal', () => {
    it('should share a meal privately', async () => {
      const mockResponse: SharedMeal = {
        id: 'share-1',
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

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await socialSharingClient.shareMeal('log-1', 'private', {})

      expect(result.id).toBe('share-1')
      expect(result.shareType).toBe('private')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/social/share'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should share a meal with friends', async () => {
      const mockResponse: SharedMeal = {
        id: 'share-2',
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
        sharedWith: { friendIds: ['friend-1', 'friend-2'] },
        createdAt: '2026-04-19T10:00:00Z',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await socialSharingClient.shareMeal('log-1', 'friends', {
        friendIds: ['friend-1', 'friend-2'],
      })

      expect(result.shareType).toBe('friends')
      expect(result.sharedWith.friendIds).toEqual(['friend-1', 'friend-2'])
    })

    it('should share a meal with team', async () => {
      const mockResponse: SharedMeal = {
        id: 'share-3',
        mealLogId: 'log-1',
        userId: 'user-1',
        foodName: 'Chicken',
        photoUrl: 'https://example.com/chicken.jpg',
        nutrition: {
          calories: 280,
          proteinG: 40,
          carbsG: 0,
          fatG: 12,
          fiberG: 0,
        },
        shareType: 'team',
        sharedWith: { teamId: 'team-1' },
        createdAt: '2026-04-19T10:00:00Z',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await socialSharingClient.shareMeal('log-1', 'team', {
        teamId: 'team-1',
      })

      expect(result.shareType).toBe('team')
      expect(result.sharedWith.teamId).toBe('team-1')
    })

    it('should handle share meal errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })

      await expect(socialSharingClient.shareMeal('invalid-log', 'friends', {})).rejects.toThrow()
    })
  })

  describe('getSocialFeed', () => {
    it('should retrieve friends feed', async () => {
      const mockResponse: SocialFeedItem[] = [
        {
          id: 'feed-1',
          userId: 'user-2',
          userName: 'John Doe',
          userAvatar: 'https://example.com/avatar.jpg',
          foodName: 'Pizza',
          photoUrl: 'https://example.com/pizza.jpg',
          nutrition: {
            calories: 285,
            proteinG: 12,
            carbsG: 36,
            fatG: 10,
            fiberG: 2,
          },
          timestamp: '2026-04-19T10:00:00Z',
          shareType: 'friends',
          reactions: [{ type: 'like', count: 3 }],
        },
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await socialSharingClient.getSocialFeed('user-1', {
        shareType: 'friends',
      })

      expect(result).toHaveLength(1)
      expect(result[0].shareType).toBe('friends')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/social/feed'),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('should retrieve team feed', async () => {
      const mockResponse: SocialFeedItem[] = [
        {
          id: 'feed-2',
          userId: 'user-3',
          userName: 'Jane Smith',
          userAvatar: 'https://example.com/avatar2.jpg',
          foodName: 'Salad',
          photoUrl: 'https://example.com/salad.jpg',
          nutrition: {
            calories: 150,
            proteinG: 8,
            carbsG: 18,
            fatG: 5,
            fiberG: 4,
          },
          timestamp: '2026-04-19T09:00:00Z',
          shareType: 'team',
          reactions: [{ type: 'heart', count: 2 }],
        },
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await socialSharingClient.getSocialFeed('user-1', {
        shareType: 'team',
      })

      expect(result).toHaveLength(1)
      expect(result[0].shareType).toBe('team')
    })

    it('should handle feed retrieval with pagination', async () => {
      const mockResponse: SocialFeedItem[] = []

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await socialSharingClient.getSocialFeed('user-1', {
        limit: 10,
        offset: 20,
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/social/feed'),
        expect.anything()
      )
    })

    it('should handle feed retrieval errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await expect(socialSharingClient.getSocialFeed('user-1', {})).rejects.toThrow('Network error')
    })
  })

  describe('addReaction', () => {
    it('should add like reaction', async () => {
      const mockResponse = { success: true, count: 5 }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await socialSharingClient.addReaction('share-1', 'like')

      expect(result.success).toBe(true)
      expect(result.count).toBe(5)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/social/reaction'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should add heart reaction', async () => {
      const mockResponse = { success: true, count: 3 }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await socialSharingClient.addReaction('share-1', 'heart')

      expect(result.success).toBe(true)
      expect(result.count).toBe(3)
    })

    it('should handle reaction errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(socialSharingClient.addReaction('invalid-share', 'like')).rejects.toThrow()
    })
  })
})

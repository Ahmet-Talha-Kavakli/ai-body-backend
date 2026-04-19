import { describe, it, expect, beforeEach, vi } from 'vitest'
import { socialSharingService } from '../socialSharingService'
import type { SharedMeal, SocialFeedItem } from '../../types/social'
import * as socialDb from '../../db/social'
import * as friendsDb from '../../db/friends'
import * as teamsDb from '../../db/teams'

vi.mock('../../db/social')
vi.mock('../../db/friends')
vi.mock('../../db/teams')

describe('socialSharingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('shareMeal', () => {
    it('should create and save a private shared meal', async () => {
      const mealLogId = 'meal-123'
      const userId = 'user-1'

      vi.mocked(socialDb.createSharedMeal).mockResolvedValueOnce({
        id: 'share-1',
        mealLogId,
        userId,
        foodName: 'Grilled Chicken',
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
      } as SharedMeal)

      const result = await socialSharingService.shareMeal({
        mealLogId,
        userId,
        foodName: 'Grilled Chicken',
        photoUrl: 'https://example.com/meal.jpg',
        nutrition: {
          calories: 450,
          proteinG: 35,
          carbsG: 45,
          fatG: 12,
          fiberG: 5,
        },
        shareType: 'private',
      })

      expect(result.shareType).toBe('private')
      expect(result.id).toBeDefined()
      expect(vi.mocked(socialDb.createSharedMeal)).toHaveBeenCalled()
    })

    it('should create and save a friends shared meal', async () => {
      const mealLogId = 'meal-456'
      const userId = 'user-2'
      const friendIds = ['friend-1', 'friend-2']

      vi.mocked(socialDb.createSharedMeal).mockResolvedValueOnce({
        id: 'share-2',
        mealLogId,
        userId,
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
        sharedWith: { friendIds },
        createdAt: '2026-04-19T13:00:00Z',
      } as SharedMeal)

      const result = await socialSharingService.shareMeal({
        mealLogId,
        userId,
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
        friendIds,
      })

      expect(result.shareType).toBe('friends')
      expect(result.sharedWith.friendIds).toEqual(friendIds)
    })

    it('should create and save a team shared meal', async () => {
      const mealLogId = 'meal-789'
      const userId = 'user-3'
      const teamId = 'team-1'

      vi.mocked(socialDb.createSharedMeal).mockResolvedValueOnce({
        id: 'share-3',
        mealLogId,
        userId,
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
        sharedWith: { teamId },
        createdAt: '2026-04-19T14:00:00Z',
      } as SharedMeal)

      const result = await socialSharingService.shareMeal({
        mealLogId,
        userId,
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
        teamId,
      })

      expect(result.shareType).toBe('team')
      expect(result.sharedWith.teamId).toBe(teamId)
    })
  })

  describe('getSocialFeed', () => {
    it('should fetch social feed for friends and team meals', async () => {
      const userId = 'user-1'
      const feedItems: SocialFeedItem[] = [
        {
          id: 'feed-1',
          userId: 'user-2',
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
          reactions: [{ type: 'like', count: 3 }],
        },
      ]

      vi.mocked(socialDb.getSocialFeed).mockResolvedValueOnce(feedItems)

      const result = await socialSharingService.getSocialFeed(userId)

      expect(result).toHaveLength(1)
      expect(result[0].userName).toBe('Alice')
      expect(vi.mocked(socialDb.getSocialFeed)).toHaveBeenCalledWith(userId)
    })

    it('should return empty feed if no meals shared', async () => {
      const userId = 'user-1'

      vi.mocked(socialDb.getSocialFeed).mockResolvedValueOnce([])

      const result = await socialSharingService.getSocialFeed(userId)

      expect(result).toHaveLength(0)
    })

    it('should handle feed retrieval errors', async () => {
      const userId = 'user-1'

      vi.mocked(socialDb.getSocialFeed).mockRejectedValueOnce(
        new Error('Database error')
      )

      await expect(
        socialSharingService.getSocialFeed(userId)
      ).rejects.toThrow('Database error')
    })
  })

  describe('getTeamMeals', () => {
    it('should fetch team shared meals', async () => {
      const teamId = 'team-1'
      const feedItems: SocialFeedItem[] = [
        {
          id: 'feed-2',
          userId: 'user-3',
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
          reactions: [{ type: 'heart', count: 5 }],
        },
      ]

      vi.mocked(socialDb.getTeamMeals).mockResolvedValueOnce(feedItems)

      const result = await socialSharingService.getTeamMeals(teamId)

      expect(result).toHaveLength(1)
      expect(result[0].shareType).toBe('team')
      expect(vi.mocked(socialDb.getTeamMeals)).toHaveBeenCalledWith(teamId)
    })

    it('should return empty team meals if none shared', async () => {
      const teamId = 'team-1'

      vi.mocked(socialDb.getTeamMeals).mockResolvedValueOnce([])

      const result = await socialSharingService.getTeamMeals(teamId)

      expect(result).toHaveLength(0)
    })
  })

  describe('compareMeals', () => {
    it('should compare nutrition between two meals', async () => {
      const mealId1 = 'share-1'
      const mealId2 = 'share-2'

      const meal1: SharedMeal = {
        id: mealId1,
        mealLogId: 'meal-1',
        userId: 'user-1',
        foodName: 'Burger',
        photoUrl: 'https://example.com/burger.jpg',
        nutrition: {
          calories: 600,
          proteinG: 25,
          carbsG: 50,
          fatG: 30,
          fiberG: 2,
        },
        shareType: 'friends',
        sharedWith: { friendIds: [] },
        createdAt: '2026-04-19T12:00:00Z',
      }

      const meal2: SharedMeal = {
        id: mealId2,
        mealLogId: 'meal-2',
        userId: 'user-2',
        foodName: 'Salad',
        photoUrl: 'https://example.com/salad.jpg',
        nutrition: {
          calories: 250,
          proteinG: 15,
          carbsG: 35,
          fatG: 8,
          fiberG: 8,
        },
        shareType: 'friends',
        sharedWith: { friendIds: [] },
        createdAt: '2026-04-19T13:00:00Z',
      }

      vi.mocked(socialDb.getSharedMealById).mockResolvedValueOnce(meal1)
      vi.mocked(socialDb.getSharedMealById).mockResolvedValueOnce(meal2)

      const result = await socialSharingService.compareMeals(mealId1, mealId2)

      expect(result.meal1).toEqual(meal1)
      expect(result.meal2).toEqual(meal2)
      expect(result.difference.calories).toBe(350)
      expect(result.difference.proteinG).toBe(10)
    })

    it('should handle meals not found', async () => {
      const mealId1 = 'share-1'
      const mealId2 = 'share-999'

      vi.mocked(socialDb.getSharedMealById).mockResolvedValueOnce(null)

      await expect(
        socialSharingService.compareMeals(mealId1, mealId2)
      ).rejects.toThrow('Meal not found')
    })
  })

  describe('reactToMeal', () => {
    it('should add a like reaction to a meal', async () => {
      const mealId = 'share-1'
      const userId = 'user-2'

      vi.mocked(socialDb.addReaction).mockResolvedValueOnce(undefined)

      await socialSharingService.reactToMeal(mealId, userId, 'like')

      expect(vi.mocked(socialDb.addReaction)).toHaveBeenCalledWith(
        mealId,
        userId,
        'like'
      )
    })

    it('should add a heart reaction to a meal', async () => {
      const mealId = 'share-2'
      const userId = 'user-3'

      vi.mocked(socialDb.addReaction).mockResolvedValueOnce(undefined)

      await socialSharingService.reactToMeal(mealId, userId, 'heart')

      expect(vi.mocked(socialDb.addReaction)).toHaveBeenCalledWith(
        mealId,
        userId,
        'heart'
      )
    })

    it('should handle reaction errors', async () => {
      const mealId = 'share-1'
      const userId = 'user-2'

      vi.mocked(socialDb.addReaction).mockRejectedValueOnce(
        new Error('Database error')
      )

      await expect(
        socialSharingService.reactToMeal(mealId, userId, 'like')
      ).rejects.toThrow('Database error')
    })
  })

  describe('removeReaction', () => {
    it('should remove a reaction from a meal', async () => {
      const mealId = 'share-1'
      const userId = 'user-2'

      vi.mocked(socialDb.removeReaction).mockResolvedValueOnce(undefined)

      await socialSharingService.removeReaction(mealId, userId)

      expect(vi.mocked(socialDb.removeReaction)).toHaveBeenCalledWith(
        mealId,
        userId
      )
    })
  })

  describe('getUserSharedMeals', () => {
    it('should fetch meals shared by a specific user', async () => {
      const userId = 'user-1'
      const meals: SharedMeal[] = [
        {
          id: 'share-1',
          mealLogId: 'meal-1',
          userId,
          foodName: 'Grilled Chicken',
          photoUrl: 'https://example.com/meal.jpg',
          nutrition: {
            calories: 450,
            proteinG: 35,
            carbsG: 45,
            fatG: 12,
            fiberG: 5,
          },
          shareType: 'friends',
          sharedWith: { friendIds: ['f1', 'f2'] },
          createdAt: '2026-04-19T12:00:00Z',
        },
      ]

      vi.mocked(socialDb.getUserSharedMeals).mockResolvedValueOnce(meals)

      const result = await socialSharingService.getUserSharedMeals(userId)

      expect(result).toHaveLength(1)
      expect(result[0].userId).toBe(userId)
      expect(vi.mocked(socialDb.getUserSharedMeals)).toHaveBeenCalledWith(
        userId
      )
    })

    it('should return empty list if user has no shared meals', async () => {
      const userId = 'user-999'

      vi.mocked(socialDb.getUserSharedMeals).mockResolvedValueOnce([])

      const result = await socialSharingService.getUserSharedMeals(userId)

      expect(result).toHaveLength(0)
    })
  })

  describe('deleteMeal', () => {
    it('should delete a shared meal', async () => {
      const mealId = 'share-1'

      vi.mocked(socialDb.deleteSharedMeal).mockResolvedValueOnce(undefined)

      await socialSharingService.deleteSharedMeal(mealId)

      expect(vi.mocked(socialDb.deleteSharedMeal)).toHaveBeenCalledWith(
        mealId
      )
    })

    it('should handle deletion errors', async () => {
      const mealId = 'share-999'

      vi.mocked(socialDb.deleteSharedMeal).mockRejectedValueOnce(
        new Error('Meal not found')
      )

      await expect(
        socialSharingService.deleteSharedMeal(mealId)
      ).rejects.toThrow('Meal not found')
    })
  })
})

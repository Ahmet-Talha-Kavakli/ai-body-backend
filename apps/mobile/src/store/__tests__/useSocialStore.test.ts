import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSocialStore } from '../useSocialStore'
import type { SocialFeedItem } from '../../types/social'

describe('useSocialStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useSocialStore.getState()
    store.resetStore()
  })

  describe('initial state', () => {
    it('should have empty initial state', () => {
      const store = useSocialStore.getState()
      expect(store.socialFeed).toEqual([])
      expect(store.teamMeals).toEqual([])
      expect(store.userSharedMeals).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('setSocialFeed', () => {
    it('should set social feed items', () => {
      const feedItems: SocialFeedItem[] = [
        {
          id: 'feed-1',
          userId: 'user-1',
          userName: 'Alice',
          userAvatar: 'https://example.com/avatar1.jpg',
          foodName: 'Chicken',
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

      act(() => {
        useSocialStore.getState().setSocialFeed(feedItems)
      })

      const store = useSocialStore.getState()
      expect(store.socialFeed).toHaveLength(1)
      expect(store.socialFeed[0].userName).toBe('Alice')
    })

    it('should replace previous feed when setting new feed', () => {
      const feedItems1: SocialFeedItem[] = [
        {
          id: 'feed-1',
          userId: 'user-1',
          userName: 'Alice',
          userAvatar: 'https://example.com/avatar1.jpg',
          foodName: 'Chicken',
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

      const feedItems2: SocialFeedItem[] = [
        {
          id: 'feed-2',
          userId: 'user-2',
          userName: 'Bob',
          userAvatar: 'https://example.com/avatar2.jpg',
          foodName: 'Salad',
          photoUrl: 'https://example.com/salad.jpg',
          nutrition: {
            calories: 280,
            proteinG: 15,
            carbsG: 35,
            fatG: 8,
            fiberG: 8,
          },
          timestamp: '2026-04-19T13:00:00Z',
          shareType: 'friends',
          reactions: [{ type: 'heart', count: 2 }],
        },
      ]

      act(() => {
        useSocialStore.getState().setSocialFeed(feedItems1)
        useSocialStore.getState().setSocialFeed(feedItems2)
      })

      const store = useSocialStore.getState()
      expect(store.socialFeed).toHaveLength(1)
      expect(store.socialFeed[0].userName).toBe('Bob')
    })
  })

  describe('setTeamMeals', () => {
    it('should set team meals', () => {
      const teamMeals: SocialFeedItem[] = [
        {
          id: 'feed-3',
          userId: 'user-3',
          userName: 'Carol',
          userAvatar: 'https://example.com/avatar3.jpg',
          foodName: 'Protein Smoothie',
          photoUrl: 'https://example.com/smoothie.jpg',
          nutrition: {
            calories: 320,
            proteinG: 25,
            carbsG: 40,
            fatG: 6,
            fiberG: 3,
          },
          timestamp: '2026-04-19T14:00:00Z',
          shareType: 'team',
          reactions: [{ type: 'like', count: 5 }],
        },
      ]

      act(() => {
        useSocialStore.getState().setTeamMeals(teamMeals)
      })

      const store = useSocialStore.getState()
      expect(store.teamMeals).toHaveLength(1)
      expect(store.teamMeals[0].shareType).toBe('team')
    })
  })

  describe('setUserSharedMeals', () => {
    it('should set user shared meals', () => {
      const userMeals: any[] = [
        {
          id: 'share-1',
          mealLogId: 'meal-1',
          userId: 'user-1',
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

      act(() => {
        useSocialStore.getState().setUserSharedMeals(userMeals)
      })

      const store = useSocialStore.getState()
      expect(store.userSharedMeals).toHaveLength(1)
      expect(store.userSharedMeals[0].foodName).toBe('Grilled Chicken')
    })
  })

  describe('addToFeed', () => {
    it('should add an item to social feed', () => {
      const item: SocialFeedItem = {
        id: 'feed-new',
        userId: 'user-new',
        userName: 'NewUser',
        userAvatar: 'https://example.com/avatar-new.jpg',
        foodName: 'New Meal',
        photoUrl: 'https://example.com/new-meal.jpg',
        nutrition: {
          calories: 500,
          proteinG: 30,
          carbsG: 55,
          fatG: 15,
          fiberG: 4,
        },
        timestamp: '2026-04-19T15:00:00Z',
        shareType: 'friends',
        reactions: [],
      }

      act(() => {
        useSocialStore.getState().addToFeed(item)
      })

      const store = useSocialStore.getState()
      expect(store.socialFeed).toHaveLength(1)
      expect(store.socialFeed[0].id).toBe('feed-new')
    })

    it('should add multiple items to feed', () => {
      const item1: SocialFeedItem = {
        id: 'feed-1',
        userId: 'user-1',
        userName: 'User1',
        userAvatar: 'https://example.com/avatar1.jpg',
        foodName: 'Meal1',
        photoUrl: 'https://example.com/meal1.jpg',
        nutrition: {
          calories: 450,
          proteinG: 35,
          carbsG: 45,
          fatG: 12,
          fiberG: 5,
        },
        timestamp: '2026-04-19T12:00:00Z',
        shareType: 'friends',
        reactions: [],
      }

      const item2: SocialFeedItem = {
        id: 'feed-2',
        userId: 'user-2',
        userName: 'User2',
        userAvatar: 'https://example.com/avatar2.jpg',
        foodName: 'Meal2',
        photoUrl: 'https://example.com/meal2.jpg',
        nutrition: {
          calories: 500,
          proteinG: 40,
          carbsG: 50,
          fatG: 15,
          fiberG: 6,
        },
        timestamp: '2026-04-19T13:00:00Z',
        shareType: 'friends',
        reactions: [],
      }

      act(() => {
        useSocialStore.getState().addToFeed(item1)
        useSocialStore.getState().addToFeed(item2)
      })

      const store = useSocialStore.getState()
      expect(store.socialFeed).toHaveLength(2)
    })
  })

  describe('removeFromFeed', () => {
    it('should remove an item from feed', () => {
      const item: SocialFeedItem = {
        id: 'feed-remove',
        userId: 'user-1',
        userName: 'User1',
        userAvatar: 'https://example.com/avatar1.jpg',
        foodName: 'Meal',
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
        reactions: [],
      }

      act(() => {
        useSocialStore.getState().addToFeed(item)
        useSocialStore.getState().removeFromFeed('feed-remove')
      })

      const store = useSocialStore.getState()
      expect(store.socialFeed).toHaveLength(0)
    })

    it('should not error when removing non-existent item', () => {
      act(() => {
        expect(() => {
          useSocialStore.getState().removeFromFeed('non-existent')
        }).not.toThrow()
      })

      const store = useSocialStore.getState()
      expect(store.socialFeed).toHaveLength(0)
    })
  })

  describe('setLoading', () => {
    it('should set loading state', () => {
      act(() => {
        useSocialStore.getState().setLoading(true)
      })

      let store = useSocialStore.getState()
      expect(store.isLoading).toBe(true)

      act(() => {
        useSocialStore.getState().setLoading(false)
      })

      store = useSocialStore.getState()
      expect(store.isLoading).toBe(false)
    })
  })

  describe('setError', () => {
    it('should set error message', () => {
      const errorMsg = 'Network error'

      act(() => {
        useSocialStore.getState().setError(errorMsg)
      })

      let store = useSocialStore.getState()
      expect(store.error).toBe(errorMsg)

      act(() => {
        useSocialStore.getState().setError(null)
      })

      store = useSocialStore.getState()
      expect(store.error).toBeNull()
    })
  })

  describe('resetStore', () => {
    it('should reset all state to initial values', () => {
      const item: SocialFeedItem = {
        id: 'feed-1',
        userId: 'user-1',
        userName: 'User1',
        userAvatar: 'https://example.com/avatar1.jpg',
        foodName: 'Meal',
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
        reactions: [],
      }

      act(() => {
        useSocialStore.getState().addToFeed(item)
        useSocialStore.getState().setLoading(true)
        useSocialStore.getState().setError('Some error')
        useSocialStore.getState().resetStore()
      })

      const store = useSocialStore.getState()
      expect(store.socialFeed).toEqual([])
      expect(store.teamMeals).toEqual([])
      expect(store.userSharedMeals).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })
})

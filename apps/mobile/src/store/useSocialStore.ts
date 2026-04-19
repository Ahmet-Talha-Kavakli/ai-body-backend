import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { socialSharingService } from '../services/socialSharingService'
import type { SharedMeal, SocialFeedItem, SocialFeedFilter } from '../types/social'

interface SocialStoreState {
  sharedMeals: SharedMeal[]
  socialFeed: SocialFeedItem[]
  reactions: Map<string, number>
  loading: boolean
  error: string | null

  shareMeal: (
    mealLogId: string,
    shareType: 'private' | 'friends' | 'team',
    sharedWith?: { friendIds?: string[]; teamId?: string }
  ) => Promise<SharedMeal>
  getSocialFeed: (userId: string, filter: SocialFeedFilter) => Promise<SocialFeedItem[]>
  addReaction: (
    sharedMealId: string,
    reactionType: 'like' | 'heart'
  ) => Promise<{ success: boolean; count: number }>
  syncOfflineData: () => Promise<void>
  clearSocialData: () => void
  loadFromStorage: () => Promise<void>
}

const STORAGE_KEY = 'social_store'

export const useSocialStore = create<SocialStoreState>((set, get) => ({
  sharedMeals: [],
  socialFeed: [],
  reactions: new Map(),
  loading: false,
  error: null,

  shareMeal: async (mealLogId, shareType, sharedWith = {}) => {
    set({ loading: true, error: null })
    try {
      const result = await socialSharingService.shareMeal(mealLogId, shareType, sharedWith)
      set((state) => ({
        sharedMeals: [...state.sharedMeals, result],
        loading: false,
      }))
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ sharedMeals: [...get().sharedMeals, result] })
      )
      return result
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  getSocialFeed: async (userId, filter) => {
    set({ loading: true, error: null })
    try {
      const feed = await socialSharingService.getSocialFeed(userId, filter)
      set({ socialFeed: feed, loading: false })
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ socialFeed: feed }))
      return feed
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  addReaction: async (sharedMealId, reactionType) => {
    try {
      const result = await socialSharingService.addReaction(sharedMealId, reactionType)
      const key = `${sharedMealId}-${reactionType}`
      set((state) => {
        const newReactions = new Map(state.reactions)
        newReactions.set(key, result.count)
        return { reactions: newReactions }
      })
      return result
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  syncOfflineData: async () => {
    try {
      await socialSharingService.syncOfflineData()
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  clearSocialData: () => {
    set({
      sharedMeals: [],
      socialFeed: [],
      reactions: new Map(),
      error: null,
    })
    AsyncStorage.removeItem(STORAGE_KEY)
  },

  loadFromStorage: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY)
      if (data) {
        const parsed = JSON.parse(data)
        set({
          sharedMeals: parsed.sharedMeals || [],
          socialFeed: parsed.socialFeed || [],
        })
      }
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },
}))

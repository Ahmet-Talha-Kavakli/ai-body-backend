import { create } from 'zustand'
import type { SocialFeedItem, SharedMeal } from '../types/social'

interface SocialState {
  socialFeed: SocialFeedItem[]
  teamMeals: SocialFeedItem[]
  userSharedMeals: SharedMeal[]
  isLoading: boolean
  error: string | null

  setSocialFeed: (items: SocialFeedItem[]) => void
  setTeamMeals: (items: SocialFeedItem[]) => void
  setUserSharedMeals: (meals: SharedMeal[]) => void
  addToFeed: (item: SocialFeedItem) => void
  removeFromFeed: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  resetStore: () => void
}

export const useSocialStore = create<SocialState>((set) => ({
  socialFeed: [],
  teamMeals: [],
  userSharedMeals: [],
  isLoading: false,
  error: null,

  setSocialFeed: (items: SocialFeedItem[]) =>
    set({ socialFeed: items }),

  setTeamMeals: (items: SocialFeedItem[]) =>
    set({ teamMeals: items }),

  setUserSharedMeals: (meals: SharedMeal[]) =>
    set({ userSharedMeals: meals }),

  addToFeed: (item: SocialFeedItem) =>
    set((state) => ({
      socialFeed: [item, ...state.socialFeed],
    })),

  removeFromFeed: (id: string) =>
    set((state) => ({
      socialFeed: state.socialFeed.filter((item) => item.id !== id),
    })),

  setLoading: (loading: boolean) =>
    set({ isLoading: loading }),

  setError: (error: string | null) =>
    set({ error }),

  resetStore: () =>
    set({
      socialFeed: [],
      teamMeals: [],
      userSharedMeals: [],
      isLoading: false,
      error: null,
    }),
}))

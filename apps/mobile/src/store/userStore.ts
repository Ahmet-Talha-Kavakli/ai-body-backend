import { create } from 'zustand'
import { UserProfile } from '../types'

interface UserStore {
  profile: UserProfile | null
  isLoading: boolean
  setProfile: (profile: UserProfile) => void
  setLoading: (isLoading: boolean) => void
  updateProfile: (updates: Partial<UserProfile>) => void
  reset: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  profile: null,
  isLoading: false,
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  updateProfile: (updates) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null,
    })),
  reset: () => set({ profile: null, isLoading: false }),
}))

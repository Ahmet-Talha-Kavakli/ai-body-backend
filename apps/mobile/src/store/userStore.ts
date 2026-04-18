import { create } from 'zustand'

interface UserState {
  profile: any | null
  isLoading: boolean
  setProfile(p: any | null): void
  reset(): void
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  isLoading: false,
  setProfile: (p) => set({ profile: p }),
  reset: () => set({ profile: null, isLoading: false }),
}))

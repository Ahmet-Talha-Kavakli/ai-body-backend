import { create } from 'zustand'
import { AuthState, User } from '../types/auth'

type Store = AuthState & {
  setSignedIn(v: boolean): void
  setUser(u: User | null): void
  setToken(t: string | null): void
  setLoading(l: boolean): void
  setError(e: string | null): void
  reset(): void
}

export const useAuthStore = create<Store>((set) => ({
  isSignedIn: false,
  user: null,
  token: null,
  isLoading: false,
  error: null,
  setSignedIn: (v) => set({ isSignedIn: v }),
  setUser: (u) => set({ user: u }),
  setToken: (t) => set({ token: t }),
  setLoading: (l) => set({ isLoading: l }),
  setError: (e) => set({ error: e }),
  reset: () =>
    set({
      isSignedIn: false,
      user: null,
      token: null,
      isLoading: false,
      error: null,
    }),
}))

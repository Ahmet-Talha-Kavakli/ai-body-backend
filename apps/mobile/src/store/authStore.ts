import { create } from 'zustand'
import { AuthState } from '../types'

interface AuthStore extends AuthState {
  setSignedIn: (isSignedIn: boolean) => void
  setInitializing: (isInitializing: boolean) => void
  setUserEmail: (email: string) => void
  setError: (error?: string) => void
  reset: () => void
}

const initialState: AuthState = {
  isSignedIn: false,
  isInitializing: true,
  userEmail: undefined,
  error: undefined,
}

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,
  setSignedIn: (isSignedIn) => set({ isSignedIn }),
  setInitializing: (isInitializing) => set({ isInitializing }),
  setUserEmail: (userEmail) => set({ userEmail }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}))

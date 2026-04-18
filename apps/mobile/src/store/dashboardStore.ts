import { create } from 'zustand'

interface DashboardState {
  stats: any | null
  isLoading: boolean
  setStats(s: any | null): void
  reset(): void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  isLoading: false,
  setStats: (s) => set({ stats: s }),
  reset: () => set({ stats: null, isLoading: false }),
}))

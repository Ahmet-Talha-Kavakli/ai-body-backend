import { create } from 'zustand'
import { DashboardStats } from '../types'

interface DashboardStore {
  stats: DashboardStats | null
  isLoading: boolean
  setStats: (stats: DashboardStats) => void
  setLoading: (isLoading: boolean) => void
  reset: () => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  stats: null,
  isLoading: false,
  setStats: (stats) => set({ stats }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ stats: null, isLoading: false }),
}))

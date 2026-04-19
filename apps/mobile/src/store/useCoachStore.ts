import { create } from 'zustand'
import type { Coach } from '../types/coaching'

interface CoachState {
  coaches: Coach[]
  filteredCoaches: Coach[]
  selectedCoach: Coach | null
  filters: {
    specialization?: string
    maxRate?: number
  }

  setCoaches: (coaches: Coach[]) => void
  setSelectedCoach: (coach: Coach | null) => void
  applyFilter: (filters: Partial<CoachState['filters']>) => void
  clearFilters: () => void
}

export const useCoachStore = create<CoachState>((set, get) => ({
  coaches: [],
  filteredCoaches: [],
  selectedCoach: null,
  filters: {},

  setCoaches: (coaches) => {
    set({ coaches, filteredCoaches: coaches })
  },

  setSelectedCoach: (coach) => {
    set({ selectedCoach: coach })
  },

  applyFilter: (newFilters) => {
    const { coaches } = get()
    const filters = { ...get().filters, ...newFilters }

    const filtered = coaches.filter((coach) => {
      if (filters.specialization) {
        const hasSpecialization = coach.specializations.includes(
          filters.specialization as any
        )
        if (!hasSpecialization) return false
      }

      if (filters.maxRate !== undefined) {
        if (coach.hourlyRate > filters.maxRate) return false
      }

      return true
    })

    set({ filters, filteredCoaches: filtered })
  },

  clearFilters: () => {
    const { coaches } = get()
    set({ filters: {}, filteredCoaches: coaches })
  },
}))

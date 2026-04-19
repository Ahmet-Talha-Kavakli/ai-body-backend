import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { PortionEstimation } from '../types/portion'

interface PortionStoreState {
  estimations: PortionEstimation[]
  currentPortion: PortionEstimation | null
  addEstimation: (estimation: PortionEstimation) => void
  updateEstimation: (id: string, estimation: PortionEstimation) => void
  removeEstimation: (id: string) => void
  getEstimation: (id: string) => PortionEstimation | undefined
  getRecentEstimations: (limit: number) => PortionEstimation[]
  setCurrentPortion: (estimation: PortionEstimation | null) => void
  savePortion: (estimation: PortionEstimation) => void
  clearEstimations: () => void
}

/**
 * Zustand store for portion estimations
 * Persists to AsyncStorage
 */
export const usePortionStore = create<PortionStoreState>()(
  persist(
    (set, get) => ({
      estimations: [],
      currentPortion: null,

      addEstimation: (estimation: PortionEstimation) => {
        set((state) => ({
          estimations: [...state.estimations, estimation],
        }))
      },

      updateEstimation: (id: string, estimation: PortionEstimation) => {
        set((state) => ({
          estimations: state.estimations.map((est) => (est.id === id ? estimation : est)),
        }))
      },

      removeEstimation: (id: string) => {
        set((state) => ({
          estimations: state.estimations.filter((est) => est.id !== id),
        }))
      },

      getEstimation: (id: string) => {
        const state = get()
        return state.estimations.find((est) => est.id === id)
      },

      getRecentEstimations: (limit: number) => {
        const state = get()
        return state.estimations.slice(0, limit)
      },

      setCurrentPortion: (estimation: PortionEstimation | null) => {
        set({ currentPortion: estimation })
      },

      savePortion: (estimation: PortionEstimation) => {
        set((state) => ({
          estimations: [...state.estimations, estimation],
          currentPortion: estimation,
        }))
      },

      clearEstimations: () => {
        set({ estimations: [], currentPortion: null })
      },
    }),
    {
      name: 'portion-store',
      storage: AsyncStorage,
    }
  )
)

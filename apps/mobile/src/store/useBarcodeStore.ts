import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { BarcodeResult } from '../types/barcode'

interface BarcodeStoreState {
  results: BarcodeResult[]
  addResult: (result: BarcodeResult) => void
  removeResult: (id: string) => void
  getResult: (id: string) => BarcodeResult | undefined
  getByBarcode: (barcode: string) => BarcodeResult | undefined
  clearResults: () => void
}

/**
 * Zustand store for barcode scan results
 * Persists to AsyncStorage
 */
export const useBarcodeStore = create<BarcodeStoreState>()(
  persist(
    (set, get) => ({
      results: [],

      addResult: (result: BarcodeResult) => {
        set((state) => ({
          results: [...state.results, result],
        }))
      },

      removeResult: (id: string) => {
        set((state) => ({
          results: state.results.filter((r) => r.id !== id),
        }))
      },

      getResult: (id: string) => {
        const state = get()
        return state.results.find((r) => r.id === id)
      },

      getByBarcode: (barcode: string) => {
        const state = get()
        return state.results.find((r) => r.barcode === barcode)
      },

      clearResults: () => {
        set({ results: [] })
      },
    }),
    {
      name: 'barcode-store',
      storage: AsyncStorage,
    }
  )
)

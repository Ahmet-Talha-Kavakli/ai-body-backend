import { create } from 'zustand'
import * as portionDb from '../db/portions'
import type { PortionEstimation } from '../types/portion'

interface PortionStoreState {
  currentPortion: PortionEstimation | null
  portions: PortionEstimation[]
  isLoading: boolean
  error: string | null

  // Actions
  setCurrentPortion: (portion: PortionEstimation | null) => void
  loadPortions: () => Promise<void>
  savePortion: (portion: PortionEstimation) => Promise<void>
  updatePortion: (portionId: string, userAdjustedPortionG: number) => Promise<void>
  deletePortion: (portionId: string) => Promise<void>
  clearError: () => void
}

export const usePortionStore = create<PortionStoreState>((set) => ({
  currentPortion: null,
  portions: [],
  isLoading: false,
  error: null,

  setCurrentPortion: (portion) => {
    set({ currentPortion: portion, error: null })
  },

  loadPortions: async () => {
    set({ isLoading: true })
    try {
      const portions = await portionDb.getRecentEstimations(100)
      set({ portions, error: null })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load portions',
      })
    } finally {
      set({ isLoading: false })
    }
  },

  savePortion: async (portion) => {
    set({ isLoading: true })
    try {
      // Update if exists, create if not
      if (portion.id.startsWith('portion-') || portion.id.startsWith('temp-')) {
        // New portion
        const saved = await portionDb.createEstimation({
          photoPath: portion.photoPath,
          foodName: portion.foodName,
          estimatedPortionG: portion.estimatedPortionG,
          estimatedPortionDescription: portion.estimatedPortionDescription,
          confidence: portion.confidence,
        })

        set((state) => ({
          portions: [saved, ...state.portions],
          currentPortion: saved,
          error: null,
        }))
      } else {
        // Existing portion
        if (portion.userAdjustedPortionG) {
          await portionDb.updateEstimation(portion.id, {
            userAdjustedPortionG: portion.userAdjustedPortionG,
          })
        }

        set((state) => ({
          portions: state.portions.map((p) => (p.id === portion.id ? portion : p)),
          currentPortion: portion,
          error: null,
        }))
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to save portion',
      })
    } finally {
      set({ isLoading: false })
    }
  },

  updatePortion: async (portionId, userAdjustedPortionG) => {
    set({ isLoading: true })
    try {
      await portionDb.updateEstimation(portionId, { userAdjustedPortionG })

      set((state) => ({
        portions: state.portions.map((p) =>
          p.id === portionId ? { ...p, userAdjustedPortionG } : p
        ),
        currentPortion:
          state.currentPortion?.id === portionId
            ? { ...state.currentPortion, userAdjustedPortionG }
            : state.currentPortion,
        error: null,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update portion',
      })
    } finally {
      set({ isLoading: false })
    }
  },

  deletePortion: async (portionId) => {
    set({ isLoading: true })
    try {
      await portionDb.deleteEstimation(portionId)

      set((state) => ({
        portions: state.portions.filter((p) => p.id !== portionId),
        currentPortion: state.currentPortion?.id === portionId ? null : state.currentPortion,
        error: null,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete portion',
      })
    } finally {
      set({ isLoading: false })
    }
  },

  clearError: () => {
    set({ error: null })
  },
}))

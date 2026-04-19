import { create } from 'zustand'
import type { FoodDetectionResult } from '../types/ar'

interface ARState {
  // State
  currentDetection: FoodDetectionResult | null
  detectionHistory: FoodDetectionResult[]
  isDetecting: boolean
  confidence: number // Last detection confidence

  // Actions
  setCurrentDetection: (detection: FoodDetectionResult | null) => void
  addToHistory: (detection: FoodDetectionResult) => void
  removeFromHistory: (id: string) => void
  clearHistory: () => void
  setIsDetecting: (isDetecting: boolean) => void
  setConfidence: (confidence: number) => void
}

const initialState: Omit<ARState, 'setCurrentDetection' | 'addToHistory' | 'removeFromHistory' | 'clearHistory' | 'setIsDetecting' | 'setConfidence'> = {
  currentDetection: null,
  detectionHistory: [],
  isDetecting: false,
  confidence: 0,
}

export const useARStore = create<ARState>((set) => ({
  ...initialState,

  setCurrentDetection: (detection) => set({ currentDetection: detection }),

  addToHistory: (detection) =>
    set((state) => ({
      detectionHistory: [...state.detectionHistory, detection],
    })),

  removeFromHistory: (id) =>
    set((state) => ({
      detectionHistory: state.detectionHistory.filter((d) => d.id !== id),
    })),

  clearHistory: () => set({ detectionHistory: [] }),

  setIsDetecting: (isDetecting) => set({ isDetecting }),

  setConfidence: (confidence) => set({ confidence }),
}))

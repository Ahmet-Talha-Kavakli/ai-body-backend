import { describe, it, expect, beforeEach } from 'vitest'
import { useARStore } from '../useARStore'
import type { FoodDetectionResult } from '../../types/ar'

describe('useARStore', () => {
  beforeEach(() => {
    useARStore.getState().clearHistory()
    useARStore.getState().setCurrentDetection(null)
    useARStore.getState().setIsDetecting(false)
    useARStore.getState().setConfidence(0)
  })

  describe('initial state', () => {
    it('should have initial state with null detection', () => {
      const state = useARStore.getState()
      expect(state.currentDetection).toBeNull()
      expect(state.detectionHistory).toEqual([])
      expect(state.isDetecting).toBe(false)
      expect(state.confidence).toBe(0)
    })
  })

  describe('setCurrentDetection', () => {
    it('should set current detection', () => {
      const detection: FoodDetectionResult = {
        id: '1',
        detectedFoodName: 'Apple',
        confidence: 95,
        nutrition: {
          calories: 52,
          proteinG: 0.3,
          carbsG: 14,
          fatG: 0.2,
          fiberG: 2.4,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      useARStore.getState().setCurrentDetection(detection)
      expect(useARStore.getState().currentDetection).toEqual(detection)
    })

    it('should replace previous detection', () => {
      const detection1: FoodDetectionResult = {
        id: '1',
        detectedFoodName: 'Apple',
        confidence: 95,
        nutrition: {
          calories: 52,
          proteinG: 0.3,
          carbsG: 14,
          fatG: 0.2,
          fiberG: 2.4,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      const detection2: FoodDetectionResult = {
        id: '2',
        detectedFoodName: 'Banana',
        confidence: 88,
        nutrition: {
          calories: 89,
          proteinG: 1.1,
          carbsG: 23,
          fatG: 0.3,
          fiberG: 2.6,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      useARStore.getState().setCurrentDetection(detection1)
      useARStore.getState().setCurrentDetection(detection2)
      expect(useARStore.getState().currentDetection?.id).toBe('2')
      expect(useARStore.getState().currentDetection?.detectedFoodName).toBe('Banana')
    })

    it('should clear detection when set to null', () => {
      const detection: FoodDetectionResult = {
        id: '1',
        detectedFoodName: 'Apple',
        confidence: 95,
        nutrition: {
          calories: 52,
          proteinG: 0.3,
          carbsG: 14,
          fatG: 0.2,
          fiberG: 2.4,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      useARStore.getState().setCurrentDetection(detection)
      useARStore.getState().setCurrentDetection(null)
      expect(useARStore.getState().currentDetection).toBeNull()
    })
  })

  describe('addToHistory', () => {
    it('should add detection to history', () => {
      const detection: FoodDetectionResult = {
        id: '1',
        detectedFoodName: 'Apple',
        confidence: 95,
        nutrition: {
          calories: 52,
          proteinG: 0.3,
          carbsG: 14,
          fatG: 0.2,
          fiberG: 2.4,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      useARStore.getState().addToHistory(detection)
      expect(useARStore.getState().detectionHistory).toHaveLength(1)
      expect(useARStore.getState().detectionHistory[0]).toEqual(detection)
    })

    it('should add multiple detections to history', () => {
      const detection1: FoodDetectionResult = {
        id: '1',
        detectedFoodName: 'Apple',
        confidence: 95,
        nutrition: {
          calories: 52,
          proteinG: 0.3,
          carbsG: 14,
          fatG: 0.2,
          fiberG: 2.4,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      const detection2: FoodDetectionResult = {
        id: '2',
        detectedFoodName: 'Banana',
        confidence: 88,
        nutrition: {
          calories: 89,
          proteinG: 1.1,
          carbsG: 23,
          fatG: 0.3,
          fiberG: 2.6,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      useARStore.getState().addToHistory(detection1)
      useARStore.getState().addToHistory(detection2)
      expect(useARStore.getState().detectionHistory).toHaveLength(2)
      expect(useARStore.getState().detectionHistory[0].id).toBe('1')
      expect(useARStore.getState().detectionHistory[1].id).toBe('2')
    })
  })

  describe('removeFromHistory', () => {
    it('should remove detection from history by id', () => {
      const detection1: FoodDetectionResult = {
        id: '1',
        detectedFoodName: 'Apple',
        confidence: 95,
        nutrition: {
          calories: 52,
          proteinG: 0.3,
          carbsG: 14,
          fatG: 0.2,
          fiberG: 2.4,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      const detection2: FoodDetectionResult = {
        id: '2',
        detectedFoodName: 'Banana',
        confidence: 88,
        nutrition: {
          calories: 89,
          proteinG: 1.1,
          carbsG: 23,
          fatG: 0.3,
          fiberG: 2.6,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      useARStore.getState().addToHistory(detection1)
      useARStore.getState().addToHistory(detection2)
      useARStore.getState().removeFromHistory('1')

      expect(useARStore.getState().detectionHistory).toHaveLength(1)
      expect(useARStore.getState().detectionHistory[0].id).toBe('2')
    })

    it('should not error when removing non-existent id', () => {
      const detection: FoodDetectionResult = {
        id: '1',
        detectedFoodName: 'Apple',
        confidence: 95,
        nutrition: {
          calories: 52,
          proteinG: 0.3,
          carbsG: 14,
          fatG: 0.2,
          fiberG: 2.4,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      useARStore.getState().addToHistory(detection)
      useARStore.getState().removeFromHistory('nonexistent')
      expect(useARStore.getState().detectionHistory).toHaveLength(1)
    })
  })

  describe('clearHistory', () => {
    it('should clear all history', () => {
      const detection: FoodDetectionResult = {
        id: '1',
        detectedFoodName: 'Apple',
        confidence: 95,
        nutrition: {
          calories: 52,
          proteinG: 0.3,
          carbsG: 14,
          fatG: 0.2,
          fiberG: 2.4,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      useARStore.getState().addToHistory(detection)
      useARStore.getState().addToHistory(detection)
      expect(useARStore.getState().detectionHistory).toHaveLength(2)

      useARStore.getState().clearHistory()
      expect(useARStore.getState().detectionHistory).toEqual([])
    })
  })

  describe('setIsDetecting', () => {
    it('should set detecting state', () => {
      useARStore.getState().setIsDetecting(true)
      expect(useARStore.getState().isDetecting).toBe(true)

      useARStore.getState().setIsDetecting(false)
      expect(useARStore.getState().isDetecting).toBe(false)
    })
  })

  describe('setConfidence', () => {
    it('should set confidence score', () => {
      useARStore.getState().setConfidence(85)
      expect(useARStore.getState().confidence).toBe(85)

      useARStore.getState().setConfidence(0)
      expect(useARStore.getState().confidence).toBe(0)

      useARStore.getState().setConfidence(100)
      expect(useARStore.getState().confidence).toBe(100)
    })
  })

  describe('complex scenarios', () => {
    it('should track detection while detecting is in progress', () => {
      const detection: FoodDetectionResult = {
        id: '1',
        detectedFoodName: 'Apple',
        confidence: 95,
        nutrition: {
          calories: 52,
          proteinG: 0.3,
          carbsG: 14,
          fatG: 0.2,
          fiberG: 2.4,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      useARStore.getState().setIsDetecting(true)
      useARStore.getState().setConfidence(50)
      useARStore.getState().setCurrentDetection(detection)

      const state = useARStore.getState()
      expect(state.isDetecting).toBe(true)
      expect(state.confidence).toBe(50)
      expect(state.currentDetection?.id).toBe('1')
    })

    it('should maintain history and current detection independently', () => {
      const detection1: FoodDetectionResult = {
        id: '1',
        detectedFoodName: 'Apple',
        confidence: 95,
        nutrition: {
          calories: 52,
          proteinG: 0.3,
          carbsG: 14,
          fatG: 0.2,
          fiberG: 2.4,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      const detection2: FoodDetectionResult = {
        id: '2',
        detectedFoodName: 'Banana',
        confidence: 88,
        nutrition: {
          calories: 89,
          proteinG: 1.1,
          carbsG: 23,
          fatG: 0.3,
          fiberG: 2.6,
        },
        source: 'usda',
        portionSize: 100,
        portionUnit: 'g',
        detectedAt: new Date().toISOString(),
        synced: false,
      }

      useARStore.getState().addToHistory(detection1)
      useARStore.getState().setCurrentDetection(detection2)

      const state = useARStore.getState()
      expect(state.currentDetection?.id).toBe('2')
      expect(state.detectionHistory).toHaveLength(1)
      expect(state.detectionHistory[0].id).toBe('1')
    })
  })
})

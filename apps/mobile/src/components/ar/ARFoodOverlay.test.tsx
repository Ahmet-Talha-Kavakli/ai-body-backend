import { describe, it, expect, vi } from 'vitest'
import { ARFoodOverlay } from './ARFoodOverlay'
import type { FoodDetectionResult } from '../../types/ar'

describe('ARFoodOverlay', () => {
  const mockDetection: FoodDetectionResult = {
    id: 'test-1',
    detectedFoodName: 'Apple',
    confidence: 95,
    nutrition: {
      calories: 52,
      proteinG: 0.3,
      carbsG: 14,
      fatG: 0.2,
      fiberG: 2.4,
      glycemicIndex: 36,
    },
    source: 'gpt4_vision',
    portionSize: 100,
    portionUnit: 'g',
    photoPath: '/path/to/photo.jpg',
    detectedAt: '2026-04-19T12:00:00Z',
    synced: false,
  }

  it('should render with detection result', () => {
    const component = <ARFoodOverlay detection={mockDetection} isLoading={false} />
    expect(component).toBeDefined()
    expect(component.props.detection).toBe(mockDetection)
  })

  it('should accept isLoading prop', () => {
    const component = <ARFoodOverlay detection={mockDetection} isLoading={true} />
    expect(component.props.isLoading).toBe(true)
  })

  it('should pass detection data to render', () => {
    const component = <ARFoodOverlay detection={mockDetection} isLoading={false} />
    expect(component.props.detection.detectedFoodName).toBe('Apple')
    expect(component.props.detection.confidence).toBe(95)
  })

  it('should display nutrition information from detection', () => {
    const component = <ARFoodOverlay detection={mockDetection} isLoading={false} />
    expect(component.props.detection.nutrition.calories).toBe(52)
    expect(component.props.detection.nutrition.proteinG).toBe(0.3)
  })

  it('should handle different food types', () => {
    const burgerDetection: FoodDetectionResult = {
      ...mockDetection,
      detectedFoodName: 'Hamburger',
      confidence: 87,
      nutrition: {
        calories: 354,
        proteinG: 17,
        carbsG: 36,
        fatG: 18,
        fiberG: 1,
      },
    }
    const component = <ARFoodOverlay detection={burgerDetection} isLoading={false} />
    expect(component.props.detection.detectedFoodName).toBe('Hamburger')
  })

  it('should handle loading state', () => {
    const component = <ARFoodOverlay detection={mockDetection} isLoading={true} />
    expect(component.props.isLoading).toBe(true)
  })

  it('should accept optional modelUrl', () => {
    const detectionWithModel: FoodDetectionResult = {
      ...mockDetection,
      modelUrl: 'https://cdn.example.com/models/apple.glb',
    }
    const component = (
      <ARFoodOverlay detection={detectionWithModel} isLoading={false} />
    )
    expect(component.props.detection.modelUrl).toBe(
      'https://cdn.example.com/models/apple.glb'
    )
  })

  it('should handle confidence variations', () => {
    const lowConfidence: FoodDetectionResult = {
      ...mockDetection,
      confidence: 42,
    }
    const component = <ARFoodOverlay detection={lowConfidence} isLoading={false} />
    expect(component.props.detection.confidence).toBe(42)
  })

  it('should handle different portion sizes', () => {
    const largerPortion: FoodDetectionResult = {
      ...mockDetection,
      portionSize: 250,
      portionUnit: 'g',
    }
    const component = (
      <ARFoodOverlay detection={largerPortion} isLoading={false} />
    )
    expect(component.props.detection.portionSize).toBe(250)
  })

  it('should handle synced and unsynced states', () => {
    const syncedDetection: FoodDetectionResult = {
      ...mockDetection,
      synced: true,
    }
    const component = (
      <ARFoodOverlay detection={syncedDetection} isLoading={false} />
    )
    expect(component.props.detection.synced).toBe(true)
  })
})

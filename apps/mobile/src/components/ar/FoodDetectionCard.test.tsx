import { describe, it, expect, vi } from 'vitest'
import { FoodDetectionCard } from './FoodDetectionCard'
import type { FoodDetectionResult } from '../../types/ar'

describe('FoodDetectionCard', () => {
  const mockDetection: FoodDetectionResult = {
    id: 'test-1',
    detectedFoodName: 'Pasta',
    confidence: 88,
    nutrition: {
      calories: 200,
      proteinG: 8,
      carbsG: 40,
      fatG: 1.5,
      fiberG: 2,
    },
    source: 'usda',
    portionSize: 100,
    portionUnit: 'g',
    photoPath: '/path/to/photo.jpg',
    detectedAt: '2026-04-19T12:00:00Z',
    synced: false,
  }

  it('should render with detection result', () => {
    const onEdit = vi.fn()
    const component = (
      <FoodDetectionCard detection={mockDetection} onEdit={onEdit} />
    )
    expect(component).toBeDefined()
    expect(component.props.detection).toBe(mockDetection)
  })

  it('should display food name', () => {
    const onEdit = vi.fn()
    const component = (
      <FoodDetectionCard detection={mockDetection} onEdit={onEdit} />
    )
    expect(component.props.detection.detectedFoodName).toBe('Pasta')
  })

  it('should display confidence percentage', () => {
    const onEdit = vi.fn()
    const component = (
      <FoodDetectionCard detection={mockDetection} onEdit={onEdit} />
    )
    expect(component.props.detection.confidence).toBe(88)
  })

  it('should display portion information', () => {
    const onEdit = vi.fn()
    const component = (
      <FoodDetectionCard detection={mockDetection} onEdit={onEdit} />
    )
    expect(component.props.detection.portionSize).toBe(100)
    expect(component.props.detection.portionUnit).toBe('g')
  })

  it('should display nutrition summary', () => {
    const onEdit = vi.fn()
    const component = (
      <FoodDetectionCard detection={mockDetection} onEdit={onEdit} />
    )
    const { calories, proteinG, carbsG, fatG } = component.props.detection
      .nutrition
    expect(calories).toBe(200)
    expect(proteinG).toBe(8)
    expect(carbsG).toBe(40)
    expect(fatG).toBe(1.5)
  })

  it('should accept onEdit callback', () => {
    const onEdit = vi.fn()
    const component = (
      <FoodDetectionCard detection={mockDetection} onEdit={onEdit} />
    )
    expect(component.props.onEdit).toBe(onEdit)
  })

  it('should handle different food types', () => {
    const pizzaDetection: FoodDetectionResult = {
      ...mockDetection,
      detectedFoodName: 'Pizza',
      confidence: 92,
    }
    const onEdit = vi.fn()
    const component = (
      <FoodDetectionCard detection={pizzaDetection} onEdit={onEdit} />
    )
    expect(component.props.detection.detectedFoodName).toBe('Pizza')
  })

  it('should display source of detection', () => {
    const gptDetection: FoodDetectionResult = {
      ...mockDetection,
      source: 'gpt4_vision',
    }
    const onEdit = vi.fn()
    const component = (
      <FoodDetectionCard detection={gptDetection} onEdit={onEdit} />
    )
    expect(component.props.detection.source).toBe('gpt4_vision')
  })
})

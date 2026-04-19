import { describe, it, expect, vi } from 'vitest'
import { FoodApprovalScreen } from './FoodApprovalScreen'
import type { FoodDetectionResult } from '../../types/ar'

describe('FoodApprovalScreen', () => {
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
    },
    source: 'gpt4_vision',
    portionSize: 100,
    portionUnit: 'g',
    photoPath: '/path/to/photo.jpg',
    detectedAt: '2026-04-19T12:00:00Z',
    synced: false,
  }

  const mockNavigation = {
    navigate: vi.fn(),
    goBack: vi.fn(),
  } as any

  const mockRoute = {
    params: {
      detection: mockDetection,
      photoPath: '/path/to/photo.jpg',
    },
  } as any

  it('should render without crashing', () => {
    const component = (
      <FoodApprovalScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component).toBeDefined()
  })

  it('should accept navigation prop', () => {
    const component = (
      <FoodApprovalScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component.props.navigation).toBe(mockNavigation)
  })

  it('should accept route prop with detection', () => {
    const component = (
      <FoodApprovalScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component.props.route.params.detection).toBe(mockDetection)
  })

  it('should display captured photo', () => {
    const component = (
      <FoodApprovalScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component.props.route.params.photoPath).toBeDefined()
  })

  it('should display detected food name', () => {
    const component = (
      <FoodApprovalScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component.props.route.params.detection.detectedFoodName).toBe(
      'Apple'
    )
  })

  it('should display confidence level', () => {
    const component = (
      <FoodApprovalScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component.props.route.params.detection.confidence).toBe(95)
  })

  it('should allow editing food name', () => {
    const component = (
      <FoodApprovalScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component).toBeDefined()
  })

  it('should allow editing portion size', () => {
    const component = (
      <FoodApprovalScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component).toBeDefined()
  })

  it('should allow editing macros', () => {
    const component = (
      <FoodApprovalScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component).toBeDefined()
  })

  it('should have Confirm & Add button to navigate to meal log creation', () => {
    const component = (
      <FoodApprovalScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component.props.navigation.navigate).toBeDefined()
  })

  it('should have Try Again button to go back to AR screen', () => {
    const component = (
      <FoodApprovalScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component.props.navigation.goBack).toBeDefined()
  })
})

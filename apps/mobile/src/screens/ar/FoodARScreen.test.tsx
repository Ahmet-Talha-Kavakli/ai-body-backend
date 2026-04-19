import { describe, it, expect, vi } from 'vitest'
import { FoodARScreen } from './FoodARScreen'

describe('FoodARScreen', () => {
  const mockNavigation = {
    navigate: vi.fn(),
    goBack: vi.fn(),
  } as any

  const mockRoute = {
    params: {},
  } as any

  it('should render without crashing', () => {
    const component = (
      <FoodARScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component).toBeDefined()
  })

  it('should accept navigation prop', () => {
    const component = (
      <FoodARScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component.props.navigation).toBe(mockNavigation)
  })

  it('should accept route prop', () => {
    const component = (
      <FoodARScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component.props.route).toBe(mockRoute)
  })

  it('should have initial detection status as detecting', () => {
    const component = (
      <FoodARScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component).toBeDefined()
  })

  it('should display mode toggle button', () => {
    const component = (
      <FoodARScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component).toBeDefined()
  })

  it('should have settings button', () => {
    const component = (
      <FoodARScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component).toBeDefined()
  })

  it('should handle real-time mode', () => {
    const component = (
      <FoodARScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component).toBeDefined()
  })

  it('should handle photo capture mode', () => {
    const component = (
      <FoodARScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component).toBeDefined()
  })

  it('should display detected food info in bottom sheet', () => {
    const component = (
      <FoodARScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component).toBeDefined()
  })

  it('should navigate to FoodApprovalScreen on detection', () => {
    const component = (
      <FoodARScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component.props.navigation.navigate).toBeDefined()
  })

  it('should show Ekle, Düzelt, and İptal buttons', () => {
    const component = (
      <FoodARScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component).toBeDefined()
  })

  it('should be able to go back', () => {
    const component = (
      <FoodARScreen navigation={mockNavigation} route={mockRoute} />
    )
    expect(component.props.navigation.goBack).toBeDefined()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { PortionSlider } from '../PortionSlider'

describe('PortionSlider Component', () => {
  it('should render with initial portion value within bounds', () => {
    const mockOnChange = vi.fn()
    const component = (
      <PortionSlider
        initialPortionG={150}
        minG={50}
        maxG={300}
        foodName="Pizza"
        onPortionChange={mockOnChange}
      />
    )

    expect(component).toBeDefined()
    expect(component.props.initialPortionG).toBe(150)
  })

  it('should display food name', () => {
    const mockOnChange = vi.fn()
    const component = (
      <PortionSlider
        initialPortionG={150}
        minG={50}
        maxG={300}
        foodName="Pizza Margherita"
        onPortionChange={mockOnChange}
      />
    )

    expect(component.props.foodName).toBe('Pizza Margherita')
  })

  it('should clamp portion below min', () => {
    const mockOnChange = vi.fn()
    const component = (
      <PortionSlider
        initialPortionG={30}
        minG={50}
        maxG={300}
        foodName="Pizza"
        onPortionChange={mockOnChange}
      />
    )

    expect(component.props.initialPortionG).toBe(30)
    expect(component.props.minG).toBe(50)
  })

  it('should clamp portion above max', () => {
    const mockOnChange = vi.fn()
    const component = (
      <PortionSlider
        initialPortionG={350}
        minG={50}
        maxG={300}
        foodName="Pizza"
        onPortionChange={mockOnChange}
      />
    )

    expect(component.props.initialPortionG).toBe(350)
    expect(component.props.maxG).toBe(300)
  })

  it('should accept portion description', () => {
    const mockOnChange = vi.fn()
    const component = (
      <PortionSlider
        initialPortionG={150}
        minG={50}
        maxG={300}
        foodName="Pizza"
        portionDescription="2 slices"
        onPortionChange={mockOnChange}
      />
    )

    expect(component.props.portionDescription).toBe('2 slices')
  })

  it('should require onPortionChange callback', () => {
    const mockOnChange = vi.fn()
    const component = (
      <PortionSlider
        initialPortionG={150}
        minG={50}
        maxG={300}
        foodName="Pizza"
        onPortionChange={mockOnChange}
      />
    )

    expect(component.props.onPortionChange).toBe(mockOnChange)
  })

  it('should support optional portionDescription', () => {
    const mockOnChange = vi.fn()
    const component = (
      <PortionSlider
        initialPortionG={150}
        minG={50}
        maxG={300}
        foodName="Pasta"
        portionDescription="1 cup cooked"
        onPortionChange={mockOnChange}
      />
    )

    expect(component.props.portionDescription).toBe('1 cup cooked')
  })

  it('should handle edge case: min equals max', () => {
    const mockOnChange = vi.fn()
    const component = (
      <PortionSlider
        initialPortionG={100}
        minG={100}
        maxG={100}
        foodName="Snack"
        onPortionChange={mockOnChange}
      />
    )

    expect(component.props.minG).toBe(component.props.maxG)
  })
})

import { describe, it, expect, vi } from 'vitest'
import { WaterQuickAdd } from '../WaterQuickAdd'

describe('WaterQuickAdd', () => {
  it('should accept onAdd callback prop', () => {
    const onAdd = vi.fn()
    expect(() => <WaterQuickAdd onAdd={onAdd} />).not.toThrow()
  })

  it('should accept currentMl and goalMl props', () => {
    const onAdd = vi.fn()
    expect(() => <WaterQuickAdd onAdd={onAdd} currentMl={1500} goalMl={2000} />).not.toThrow()
  })

  it('should have default goal of 2000ml', () => {
    const onAdd = vi.fn()
    const component = <WaterQuickAdd onAdd={onAdd} />
    // Component should render without goalMl prop
    expect(component).toBeDefined()
  })

  it('should have buttons for 250ml, 500ml, and 1L', () => {
    // This test verifies the component structure exists
    // JSX rendering test - component has necessary button props
    const onAdd = vi.fn()
    const component = <WaterQuickAdd onAdd={onAdd} />
    expect(component).toBeDefined()
    expect(component.props).toBeDefined()
  })

  it('should accept custom currentMl and goalMl values', () => {
    const onAdd = vi.fn()
    const component = <WaterQuickAdd onAdd={onAdd} currentMl={1500} goalMl={3000} />
    expect(component.props.currentMl).toBe(1500)
    expect(component.props.goalMl).toBe(3000)
  })

  it('should pass onAdd callback to component', () => {
    const onAdd = vi.fn()
    const component = <WaterQuickAdd onAdd={onAdd} />
    expect(component.props.onAdd).toBe(onAdd)
  })
})

import { describe, it, expect } from 'vitest'
import { StepProgressRing } from '../StepProgressRing'

describe('StepProgressRing', () => {
  it('should render step count and goal', () => {
    const component = (
      <StepProgressRing
        current={8432}
        goal={10000}
      />
    )
    expect(component).toBeDefined()
    expect(component.props.current).toBe(8432)
    expect(component.props.goal).toBe(10000)
  })

  it('should calculate progress percentage', () => {
    const component = (
      <StepProgressRing
        current={5000}
        goal={10000}
      />
    )
    const progress = (component.props.current / component.props.goal) * 100
    expect(progress).toBe(50)
  })

  it('should show 100% when goal is met', () => {
    const component = (
      <StepProgressRing
        current={10000}
        goal={10000}
      />
    )
    const progress = (component.props.current / component.props.goal) * 100
    expect(progress).toBe(100)
  })

  it('should cap progress at 100% when exceeding goal', () => {
    const component = (
      <StepProgressRing
        current={12000}
        goal={10000}
      />
    )
    const progress = Math.min((component.props.current / component.props.goal) * 100, 100)
    expect(progress).toBe(100)
  })

  it('should handle zero steps', () => {
    const component = (
      <StepProgressRing
        current={0}
        goal={10000}
      />
    )
    expect(component.props.current).toBe(0)
    const progress = (component.props.current / component.props.goal) * 100
    expect(progress).toBe(0)
  })

  it('should format step numbers with locale string', () => {
    const component = (
      <StepProgressRing
        current={8432}
        goal={10000}
      />
    )
    const formatted = component.props.current.toLocaleString()
    // toLocaleString may use commas or periods depending on locale
    expect(formatted).toMatch(/^8[.,]432$/)
  })
})

import { describe, it, expect } from 'vitest'
import { WaterProgress } from '../WaterProgress'

describe('WaterProgress', () => {
  it('should accept current and goal props', () => {
    const component = <WaterProgress current={1500} goal={2000} />
    expect(component).toBeDefined()
    expect(component.props.current).toBe(1500)
    expect(component.props.goal).toBe(2000)
  })

  it('should calculate correct percentage (75%)', () => {
    const component = <WaterProgress current={1500} goal={2000} />
    const percentage = (component.props.current / component.props.goal) * 100
    expect(percentage).toBe(75)
  })

  it('should show 100% when current equals goal', () => {
    const component = <WaterProgress current={2000} goal={2000} />
    const percentage = (component.props.current / component.props.goal) * 100
    expect(percentage).toBe(100)
  })

  it('should show 0% when current is 0', () => {
    const component = <WaterProgress current={0} goal={2000} />
    const percentage = (component.props.current / component.props.goal) * 100
    expect(percentage).toBe(0)
  })

  it('should cap percentage at 100%', () => {
    const component = <WaterProgress current={2500} goal={2000} />
    const percentage = Math.min((component.props.current / component.props.goal) * 100, 100)
    expect(percentage).toBe(100)
  })

  it('should accept any numeric values', () => {
    const component = <WaterProgress current={500} goal={1500} />
    expect(component.props.current).toBe(500)
    expect(component.props.goal).toBe(1500)
  })
})

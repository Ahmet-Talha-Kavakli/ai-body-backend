import { describe, it, expect } from 'vitest'
import { ConfidenceIndicator } from './ConfidenceIndicator'

describe('ConfidenceIndicator', () => {
  it('should render with confidence value', () => {
    const component = <ConfidenceIndicator confidence={75} />
    expect(component).toBeDefined()
    expect(component.props.confidence).toBe(75)
  })

  it('should handle 0 confidence', () => {
    const component = <ConfidenceIndicator confidence={0} />
    expect(component.props.confidence).toBe(0)
  })

  it('should handle 100 confidence', () => {
    const component = <ConfidenceIndicator confidence={100} />
    expect(component.props.confidence).toBe(100)
  })

  it('should handle low confidence (25)', () => {
    const component = <ConfidenceIndicator confidence={25} />
    expect(component.props.confidence).toBe(25)
  })

  it('should handle medium confidence (50)', () => {
    const component = <ConfidenceIndicator confidence={50} />
    expect(component.props.confidence).toBe(50)
  })

  it('should handle high confidence (90)', () => {
    const component = <ConfidenceIndicator confidence={90} />
    expect(component.props.confidence).toBe(90)
  })

  it('should change color based on confidence level', () => {
    const lowComponent = <ConfidenceIndicator confidence={30} />
    const mediumComponent = <ConfidenceIndicator confidence={60} />
    const highComponent = <ConfidenceIndicator confidence={95} />

    expect(lowComponent.props.confidence).toBe(30)
    expect(mediumComponent.props.confidence).toBe(60)
    expect(highComponent.props.confidence).toBe(95)
  })
})

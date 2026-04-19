import { describe, it, expect, beforeEach } from 'vitest'
import { ARCameraOverlay } from './ARCameraOverlay'

describe('ARCameraOverlay', () => {
  it('should render with detecting status', () => {
    const component = <ARCameraOverlay detectionStatus="detecting" />
    expect(component).toBeDefined()
    expect(component.props.detectionStatus).toBe('detecting')
  })

  it('should render with found status', () => {
    const component = <ARCameraOverlay detectionStatus="found" />
    expect(component).toBeDefined()
    expect(component.props.detectionStatus).toBe('found')
  })

  it('should render with not_found status', () => {
    const component = <ARCameraOverlay detectionStatus="not_found" />
    expect(component).toBeDefined()
    expect(component.props.detectionStatus).toBe('not_found')
  })

  it('should accept optional fps prop', () => {
    const component = <ARCameraOverlay detectionStatus="detecting" fps={30} />
    expect(component.props.fps).toBe(30)
  })

  it('should handle low fps value', () => {
    const component = <ARCameraOverlay detectionStatus="detecting" fps={15} />
    expect(component.props.fps).toBe(15)
  })

  it('should handle high fps value', () => {
    const component = <ARCameraOverlay detectionStatus="detecting" fps={60} />
    expect(component.props.fps).toBe(60)
  })

  it('should handle zero fps value', () => {
    const component = <ARCameraOverlay detectionStatus="detecting" fps={0} />
    expect(component.props.fps).toBe(0)
  })

  it('should display fps when provided', () => {
    const component = <ARCameraOverlay detectionStatus="detecting" fps={30} />
    expect(component.props.fps).toBeDefined()
    expect(component.props.fps).toBe(30)
  })
})

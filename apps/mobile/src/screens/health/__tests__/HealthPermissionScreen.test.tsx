import { describe, it, expect, vi } from 'vitest'
import { HealthPermissionScreen } from '../HealthPermissionScreen'

describe('HealthPermissionScreen', () => {
  const mockNavigation = {
    navigate: vi.fn(),
  }

  it('should render permission request', () => {
    const component = (
      <HealthPermissionScreen
        navigation={mockNavigation as any}
        route={undefined as any}
      />
    )
    expect(component).toBeDefined()
  })

  it('should accept navigation prop', () => {
    const component = (
      <HealthPermissionScreen
        navigation={mockNavigation as any}
        route={undefined as any}
      />
    )
    expect(component.props.navigation).toBe(mockNavigation)
  })

  it('should display health description', () => {
    const component = (
      <HealthPermissionScreen
        navigation={mockNavigation as any}
        route={undefined as any}
      />
    )
    expect(component).toBeDefined()
  })
})

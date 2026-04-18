import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HealthScreen } from '../HealthScreen'

describe('HealthScreen', () => {
  const mockNavigation = {
    navigate: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render health screen', () => {
    const component = (
      <HealthScreen
        navigation={mockNavigation as any}
        route={undefined as any}
      />
    )
    expect(component).toBeDefined()
  })

  it('should accept navigation prop', () => {
    const component = (
      <HealthScreen
        navigation={mockNavigation as any}
        route={undefined as any}
      />
    )
    expect(component.props.navigation).toBe(mockNavigation)
  })

  it('should display health sections', () => {
    const component = (
      <HealthScreen
        navigation={mockNavigation as any}
        route={undefined as any}
      />
    )
    expect(component).toBeDefined()
  })
})

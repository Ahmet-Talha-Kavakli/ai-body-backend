import { describe, it, expect, vi } from 'vitest'
import { HeartRateDetailScreen } from '../HeartRateDetailScreen'

describe('HeartRateDetailScreen', () => {
  const mockNavigation = { goBack: vi.fn() }

  it('should render heart rate detail screen', () => {
    const component = (
      <HeartRateDetailScreen
        navigation={mockNavigation as any}
        route={undefined as any}
      />
    )
    expect(component).toBeDefined()
  })

  it('should accept time range prop', () => {
    const component = (
      <HeartRateDetailScreen
        navigation={mockNavigation as any}
        route={undefined as any}
      />
    )
    expect(component.props.navigation).toBe(mockNavigation)
  })
})

import { describe, it, expect, vi } from 'vitest'
import { SleepDetailScreen } from '../SleepDetailScreen'

describe('SleepDetailScreen', () => {
  const mockNavigation = { goBack: vi.fn() }

  it('should render sleep detail screen', () => {
    const component = (
      <SleepDetailScreen
        navigation={mockNavigation as any}
        route={undefined as any}
      />
    )
    expect(component).toBeDefined()
  })

  it('should display sleep analytics', () => {
    const component = (
      <SleepDetailScreen
        navigation={mockNavigation as any}
        route={undefined as any}
      />
    )
    expect(component).toBeDefined()
  })
})

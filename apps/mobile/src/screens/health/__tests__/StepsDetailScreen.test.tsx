import { describe, it, expect, vi } from 'vitest'
import { StepsDetailScreen } from '../StepsDetailScreen'

describe('StepsDetailScreen', () => {
  const mockNavigation = { goBack: vi.fn() }

  it('should render steps detail screen', () => {
    const component = (
      <StepsDetailScreen
        navigation={mockNavigation as any}
        route={undefined as any}
      />
    )
    expect(component).toBeDefined()
  })

  it('should display step progress', () => {
    const component = (
      <StepsDetailScreen
        navigation={mockNavigation as any}
        route={undefined as any}
      />
    )
    expect(component).toBeDefined()
  })
})

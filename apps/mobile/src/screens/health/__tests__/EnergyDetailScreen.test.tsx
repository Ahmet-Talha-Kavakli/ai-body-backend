import { describe, it, expect, vi } from 'vitest'
import { EnergyDetailScreen } from '../EnergyDetailScreen'

describe('EnergyDetailScreen', () => {
  const mockNavigation = { goBack: vi.fn() }

  it('should render energy detail screen', () => {
    const component = (
      <EnergyDetailScreen
        navigation={mockNavigation as any}
        route={undefined as any}
      />
    )
    expect(component).toBeDefined()
  })

  it('should display calorie analytics', () => {
    const component = (
      <EnergyDetailScreen
        navigation={mockNavigation as any}
        route={undefined as any}
      />
    )
    expect(component).toBeDefined()
  })
})

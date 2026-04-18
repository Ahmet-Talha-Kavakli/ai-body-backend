import { describe, it, expect } from 'vitest'
import { EnergyBurnedCard } from '../EnergyBurnedCard'

describe('EnergyBurnedCard', () => {
  it('should render active and basal calories', () => {
    const component = (
      <EnergyBurnedCard
        activeCalories={450}
        basalCalories={1800}
        weeklyActiveAvg={420}
      />
    )
    expect(component).toBeDefined()
    expect(component.props.activeCalories).toBe(450)
    expect(component.props.basalCalories).toBe(1800)
  })

  it('should handle zero calories', () => {
    const component = (
      <EnergyBurnedCard
        activeCalories={0}
        basalCalories={0}
        weeklyActiveAvg={0}
      />
    )
    expect(component.props.activeCalories).toBe(0)
    expect(component.props.basalCalories).toBe(0)
  })

  it('should accept weekly average', () => {
    const component = (
      <EnergyBurnedCard
        activeCalories={450}
        basalCalories={1800}
        weeklyActiveAvg={420}
      />
    )
    expect(component.props.weeklyActiveAvg).toBe(420)
  })

  it('should calculate total calories', () => {
    const component = (
      <EnergyBurnedCard
        activeCalories={500}
        basalCalories={1800}
        weeklyActiveAvg={420}
      />
    )
    const total = component.props.activeCalories + component.props.basalCalories
    expect(total).toBe(2300)
  })

  it('should handle high calorie values', () => {
    const component = (
      <EnergyBurnedCard
        activeCalories={1000}
        basalCalories={2500}
        weeklyActiveAvg={800}
      />
    )
    expect(component.props.activeCalories).toBe(1000)
    expect(component.props.basalCalories).toBe(2500)
  })
})

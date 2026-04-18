import { describe, it, expect, vi } from 'vitest'
import { HealthDashboardWidget } from '../HealthDashboardWidget'

describe('HealthDashboardWidget', () => {
  it('should render today health summary', () => {
    const component = (
      <HealthDashboardWidget
        avgHeartRate={72}
        sleepDuration={480}
        totalSteps={8432}
        activeCalories={450}
        onTap={() => {}}
      />
    )
    expect(component).toBeDefined()
    expect(component.props.avgHeartRate).toBe(72)
    expect(component.props.totalSteps).toBe(8432)
  })

  it('should handle zero values gracefully', () => {
    const component = (
      <HealthDashboardWidget
        avgHeartRate={0}
        sleepDuration={0}
        totalSteps={0}
        activeCalories={0}
        onTap={() => {}}
      />
    )
    expect(component.props.avgHeartRate).toBe(0)
    expect(component.props.totalSteps).toBe(0)
  })

  it('should call onTap callback', () => {
    const onTap = vi.fn()
    const component = (
      <HealthDashboardWidget
        avgHeartRate={72}
        sleepDuration={480}
        totalSteps={8432}
        activeCalories={450}
        onTap={onTap}
      />
    )
    expect(component.props.onTap).toBe(onTap)
  })

  it('should accept all metric values', () => {
    const component = (
      <HealthDashboardWidget
        avgHeartRate={75}
        sleepDuration={500}
        totalSteps={10000}
        activeCalories={600}
        onTap={() => {}}
      />
    )
    expect(component.props.activeCalories).toBe(600)
    expect(component.props.sleepDuration).toBe(500)
  })
})

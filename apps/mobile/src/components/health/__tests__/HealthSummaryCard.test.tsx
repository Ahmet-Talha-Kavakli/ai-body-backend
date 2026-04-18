import { describe, it, expect, vi } from 'vitest'
import { HealthSummaryCard } from '../HealthSummaryCard'

describe('HealthSummaryCard', () => {
  it('should render with icon, label, and value', () => {
    const component = (
      <HealthSummaryCard
        icon="heart"
        label="Avg Heart Rate"
        value="72"
        unit="bpm"
      />
    )
    expect(component).toBeDefined()
    expect(component.props.label).toBe('Avg Heart Rate')
    expect(component.props.value).toBe('72')
  })

  it('should accept optional tap handler', () => {
    const onTap = vi.fn()
    const component = (
      <HealthSummaryCard
        icon="heart"
        label="Heart Rate"
        value="72"
        unit="bpm"
        onTap={onTap}
      />
    )
    expect(component.props.onTap).toBe(onTap)
  })

  it('should render without unit if not provided', () => {
    const component = (
      <HealthSummaryCard
        icon="heart"
        label="Heart Rate"
        value="72"
      />
    )
    expect(component.props.unit).toBeUndefined()
  })

  it('should support different icon types', () => {
    const icons = ['heart', 'moon', 'activity', 'flame']
    icons.forEach(icon => {
      const component = (
        <HealthSummaryCard
          icon={icon}
          label="Metric"
          value="100"
        />
      )
      expect(component.props.icon).toBe(icon)
    })
  })
})

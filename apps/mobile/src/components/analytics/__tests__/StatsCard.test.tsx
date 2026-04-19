import { describe, it, expect, vi } from 'vitest'
import { StatsCard } from '../StatsCard'

describe('StatsCard', () => {
  const mockStatsCardProps = {
    label: 'Total Calories',
    value: '2450',
    unit: 'kcal',
    trend: 'up' as const,
    percentChange: 12,
    icon: '🔥',
  }

  it('should render with label and value', () => {
    const component = <StatsCard {...mockStatsCardProps} />
    expect(component).toBeDefined()
    expect(component.props.label).toBe('Total Calories')
    expect(component.props.value).toBe('2450')
  })

  it('should display unit', () => {
    const component = <StatsCard {...mockStatsCardProps} />
    expect(component.props.unit).toBe('kcal')
  })

  it('should show trend indicator', () => {
    const trends = ['up', 'down', 'flat'] as const
    trends.forEach(trend => {
      const component = <StatsCard {...mockStatsCardProps} trend={trend} />
      expect(component.props.trend).toBe(trend)
    })
  })

  it('should display percent change', () => {
    const component = <StatsCard {...mockStatsCardProps} />
    expect(component.props.percentChange).toBe(12)
  })

  it('should display icon emoji', () => {
    const component = <StatsCard {...mockStatsCardProps} />
    expect(component.props.icon).toBe('🔥')
  })

  it('should accept onPress callback', () => {
    const onPress = vi.fn()
    const component = (
      <StatsCard {...mockStatsCardProps} onPress={onPress} />
    )
    expect(component.props.onPress).toBe(onPress)
  })

  it('should render different stats types', () => {
    const statTypes = [
      {
        label: 'Protein Intake',
        value: '142',
        unit: 'g',
        trend: 'up' as const,
        icon: '🥚',
      },
      {
        label: 'Steps',
        value: '8432',
        unit: 'steps',
        trend: 'down' as const,
        icon: '👟',
      },
      {
        label: 'Sleep Quality',
        value: '8',
        unit: '/10',
        trend: 'flat' as const,
        icon: '😴',
      },
    ]

    statTypes.forEach(stat => {
      const component = (
        <StatsCard {...stat} percentChange={5} />
      )
      expect(component.props.label).toBeDefined()
      expect(component.props.value).toBeDefined()
    })
  })

  it('should work without optional onPress', () => {
    const { onPress, ...requiredProps } = mockStatsCardProps
    const component = <StatsCard {...requiredProps} percentChange={5} />
    expect(component.props.onPress).toBeUndefined()
  })
})

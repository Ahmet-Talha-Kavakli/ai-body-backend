import { describe, it, expect } from 'vitest'
import { HeartRateChart } from '../HeartRateChart'

describe('HeartRateChart', () => {
  const mockData = [
    { timestamp: '2024-01-15T08:00:00Z', bpm: 70 },
    { timestamp: '2024-01-15T09:00:00Z', bpm: 75 },
    { timestamp: '2024-01-15T10:00:00Z', bpm: 72 },
  ]

  it('should render with heart rate readings', () => {
    const component = (
      <HeartRateChart
        readings={mockData}
        timeRange="today"
      />
    )
    expect(component).toBeDefined()
    expect(component.props.readings).toEqual(mockData)
  })

  it('should handle empty readings', () => {
    const component = (
      <HeartRateChart
        readings={[]}
        timeRange="today"
      />
    )
    expect(component.props.readings).toEqual([])
  })

  it('should support different time ranges', () => {
    const ranges = ['today', 'week', 'month'] as const
    ranges.forEach(range => {
      const component = (
        <HeartRateChart
          readings={mockData}
          timeRange={range}
        />
      )
      expect(component.props.timeRange).toBe(range)
    })
  })

  it('should accept highlight reading', () => {
    const highlight = mockData[0]
    const component = (
      <HeartRateChart
        readings={mockData}
        timeRange="today"
        highlightReading={highlight}
      />
    )
    expect(component.props.highlightReading).toEqual(highlight)
  })

  it('should display reading count', () => {
    const component = (
      <HeartRateChart
        readings={mockData}
        timeRange="today"
      />
    )
    expect(component.props.readings.length).toBe(3)
  })
})

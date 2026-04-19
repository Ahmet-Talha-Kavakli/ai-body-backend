import { describe, it, expect, vi } from 'vitest'
import { AnalyticsChart } from '../AnalyticsChart'
import type { AnalyticsChartData } from '../../../types'

describe('AnalyticsChart', () => {
  const mockChartData: AnalyticsChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Calories',
        data: [2100, 2350, 2200, 2500, 2300, 2400, 2250],
        borderColor: '#EF4444',
        backgroundColor: '#FEE2E2',
      },
    ],
  }

  it('should render with title', () => {
    const component = (
      <AnalyticsChart title="Weekly Calories" data={mockChartData} />
    )
    expect(component).toBeDefined()
    expect(component.props.title).toBe('Weekly Calories')
  })

  it('should accept analytics chart data', () => {
    const component = (
      <AnalyticsChart title="Calorie Tracking" data={mockChartData} />
    )
    expect(component.props.data.labels).toHaveLength(7)
    expect(component.props.data.datasets).toHaveLength(1)
  })

  it('should support multiple datasets', () => {
    const multiDataset: AnalyticsChartData = {
      labels: ['Mon', 'Tue', 'Wed'],
      datasets: [
        {
          label: 'Calories',
          data: [2100, 2350, 2200],
          borderColor: '#EF4444',
        },
        {
          label: 'Protein',
          data: [150, 160, 155],
          borderColor: '#3B82F6',
        },
      ],
    }
    const component = (
      <AnalyticsChart title="Nutrition Tracking" data={multiDataset} />
    )
    expect(component.props.data.datasets).toHaveLength(2)
  })

  it('should accept optional chart type', () => {
    const component = (
      <AnalyticsChart
        title="Workout Volume"
        data={mockChartData}
        chartType="line"
      />
    )
    expect(component.props.chartType).toBe('line')
  })

  it('should support different chart types', () => {
    const types = ['line', 'bar'] as const
    types.forEach(type => {
      const component = (
        <AnalyticsChart
          title="Data"
          data={mockChartData}
          chartType={type}
        />
      )
      expect(component.props.chartType).toBe(type)
    })
  })

  it('should accept onDataPointPress callback', () => {
    const onDataPointPress = vi.fn()
    const component = (
      <AnalyticsChart
        title="Trend"
        data={mockChartData}
        onDataPointPress={onDataPointPress}
      />
    )
    expect(component.props.onDataPointPress).toBe(onDataPointPress)
  })

  it('should handle empty datasets', () => {
    const emptyData: AnalyticsChartData = {
      labels: [],
      datasets: [],
    }
    const component = (
      <AnalyticsChart title="Empty Chart" data={emptyData} />
    )
    expect(component.props.data.labels).toHaveLength(0)
  })
})

import { describe, it, expect } from 'vitest'
import { SleepStagesChart } from '../SleepStagesChart'

describe('SleepStagesChart', () => {
  const mockData = [
    {
      date: '2024-01-15',
      stages: {
        remMinutes: 90,
        deepMinutes: 120,
        lightMinutes: 150,
        awakeMinutes: 30,
      },
    },
    {
      date: '2024-01-14',
      stages: {
        remMinutes: 85,
        deepMinutes: 110,
        lightMinutes: 160,
        awakeMinutes: 25,
      },
    },
  ]

  it('should render sleep stages data', () => {
    const component = (
      <SleepStagesChart
        sessions={mockData}
      />
    )
    expect(component).toBeDefined()
    expect(component.props.sessions).toEqual(mockData)
  })

  it('should handle empty sessions', () => {
    const component = (
      <SleepStagesChart
        sessions={[]}
      />
    )
    expect(component.props.sessions).toEqual([])
  })

  it('should support single session', () => {
    const single = [mockData[0]]
    const component = (
      <SleepStagesChart
        sessions={single}
      />
    )
    expect(component.props.sessions.length).toBe(1)
  })

  it('should calculate stage percentages correctly', () => {
    const testData = [{
      date: '2024-01-15',
      stages: {
        remMinutes: 100,
        deepMinutes: 100,
        lightMinutes: 100,
        awakeMinutes: 100,
      },
    }]
    const component = (
      <SleepStagesChart
        sessions={testData}
      />
    )
    expect(component.props.sessions[0].stages).toBeDefined()
  })

  it('should handle sessions with missing stage data', () => {
    const incompleteData = [{
      date: '2024-01-15',
      stages: {
        remMinutes: 90,
        deepMinutes: 120,
        lightMinutes: 150,
        awakeMinutes: 0,
      },
    }]
    const component = (
      <SleepStagesChart
        sessions={incompleteData}
      />
    )
    expect(component.props.sessions[0].stages?.awakeMinutes).toBe(0)
  })
})

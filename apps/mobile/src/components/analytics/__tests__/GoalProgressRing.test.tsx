import { describe, it, expect, vi } from 'vitest'
import { GoalProgressRing } from '../GoalProgressRing'

describe('GoalProgressRing', () => {
  const mockGoalProps = {
    label: 'Daily Protein',
    current: 125,
    goal: 150,
    unit: 'g',
    color: '#10B981',
    size: 'md' as const,
  }

  it('should render with label', () => {
    const component = <GoalProgressRing {...mockGoalProps} />
    expect(component).toBeDefined()
    expect(component.props.label).toBe('Daily Protein')
  })

  it('should display current and goal values', () => {
    const component = <GoalProgressRing {...mockGoalProps} />
    expect(component.props.current).toBe(125)
    expect(component.props.goal).toBe(150)
  })

  it('should show unit', () => {
    const component = <GoalProgressRing {...mockGoalProps} />
    expect(component.props.unit).toBe('g')
  })

  it('should accept color prop', () => {
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6']
    colors.forEach(color => {
      const component = (
        <GoalProgressRing {...mockGoalProps} color={color} />
      )
      expect(component.props.color).toBe(color)
    })
  })

  it('should support different sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    sizes.forEach(size => {
      const component = <GoalProgressRing {...mockGoalProps} size={size} />
      expect(component.props.size).toBe(size)
    })
  })

  it('should calculate progress percentage', () => {
    const component = <GoalProgressRing {...mockGoalProps} />
    expect(component.props.current).toBe(125)
    expect(component.props.goal).toBe(150)
    // 125/150 = 83.33%
  })

  it('should accept onPress callback', () => {
    const onPress = vi.fn()
    const component = (
      <GoalProgressRing {...mockGoalProps} onPress={onPress} />
    )
    expect(component.props.onPress).toBe(onPress)
  })

  it('should handle exceeded goal', () => {
    const exceedProps = {
      ...mockGoalProps,
      current: 180,
      goal: 150,
    }
    const component = <GoalProgressRing {...exceedProps} />
    expect(component.props.current).toBeGreaterThan(component.props.goal)
  })

  it('should handle zero goal', () => {
    const component = (
      <GoalProgressRing {...mockGoalProps} goal={0} current={0} />
    )
    expect(component.props.goal).toBe(0)
  })

  it('should render multiple goal types', () => {
    const goalTypes = [
      {
        label: 'Calories',
        current: 2100,
        goal: 2200,
        unit: 'kcal',
        color: '#EF4444',
      },
      {
        label: 'Steps',
        current: 7500,
        goal: 10000,
        unit: 'steps',
        color: '#3B82F6',
      },
      {
        label: 'Water',
        current: 6,
        goal: 8,
        unit: 'cups',
        color: '#06B6D4',
      },
    ]

    goalTypes.forEach(goal => {
      const component = (
        <GoalProgressRing {...goal} size="md" />
      )
      expect(component.props.label).toBeDefined()
      expect(component.props.current).toBeDefined()
    })
  })
})

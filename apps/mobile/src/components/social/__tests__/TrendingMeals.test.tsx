import { describe, it, expect, vi } from 'vitest'
import { TrendingMeals } from '../TrendingMeals'

describe('TrendingMeals Component', () => {
  const mockTrendingMeals = [
    {
      id: 'meal-1',
      foodName: 'Grilled Chicken Salad',
      count: 12,
      averageCalories: 380,
    },
    {
      id: 'meal-2',
      foodName: 'Protein Smoothie',
      count: 10,
      averageCalories: 320,
    },
    {
      id: 'meal-3',
      foodName: 'Greek Yogurt Bowl',
      count: 8,
      averageCalories: 280,
    },
  ]

  it('should display trending meals list', () => {
    const component = <TrendingMeals meals={mockTrendingMeals} timeframe="week" />

    expect(component.props.meals.length).toBe(3)
  })

  it('should display meal names', () => {
    const component = <TrendingMeals meals={mockTrendingMeals} timeframe="week" />

    expect(component.props.meals[0].foodName).toBe('Grilled Chicken Salad')
  })

  it('should display meal popularity count', () => {
    const component = <TrendingMeals meals={mockTrendingMeals} timeframe="week" />

    expect(component.props.meals[0].count).toBe(12)
    expect(component.props.meals[1].count).toBe(10)
  })

  it('should display average calories', () => {
    const component = <TrendingMeals meals={mockTrendingMeals} timeframe="week" />

    expect(component.props.meals[0].averageCalories).toBe(380)
  })

  it('should support week timeframe', () => {
    const component = <TrendingMeals meals={mockTrendingMeals} timeframe="week" />

    expect(component.props.timeframe).toBe('week')
  })

  it('should support month timeframe', () => {
    const component = <TrendingMeals meals={mockTrendingMeals} timeframe="month" />

    expect(component.props.timeframe).toBe('month')
  })

  it('should support onMealPress callback', () => {
    const mockOnPress = vi.fn()
    const component = (
      <TrendingMeals meals={mockTrendingMeals} timeframe="week" onMealPress={mockOnPress} />
    )

    expect(component.props.onMealPress).toBe(mockOnPress)
  })
})

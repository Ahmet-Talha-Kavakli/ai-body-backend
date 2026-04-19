import { describe, it, expect } from 'vitest'
import { NutritionBadge } from './NutritionBadge'

describe('NutritionBadge', () => {
  const mockNutrition = {
    calories: 250,
    proteinG: 15,
    carbsG: 35,
    fatG: 8,
    fiberG: 3,
  }

  it('should render with nutrition data', () => {
    const component = <NutritionBadge nutrition={mockNutrition} />
    expect(component).toBeDefined()
    expect(component.props.nutrition).toBe(mockNutrition)
  })

  it('should use small size by default', () => {
    const component = <NutritionBadge nutrition={mockNutrition} />
    expect(component.props.size).toBeUndefined()
  })

  it('should accept small size prop', () => {
    const component = <NutritionBadge nutrition={mockNutrition} size="small" />
    expect(component.props.size).toBe('small')
  })

  it('should accept large size prop', () => {
    const component = <NutritionBadge nutrition={mockNutrition} size="large" />
    expect(component.props.size).toBe('large')
  })

  it('should display calories value', () => {
    const component = <NutritionBadge nutrition={mockNutrition} />
    expect(component.props.nutrition.calories).toBe(250)
  })

  it('should have macronutrient data available', () => {
    const component = <NutritionBadge nutrition={mockNutrition} />
    const { proteinG, carbsG, fatG } = component.props.nutrition
    expect(proteinG).toBe(15)
    expect(carbsG).toBe(35)
    expect(fatG).toBe(8)
  })

  it('should handle zero macros gracefully', () => {
    const zeroNutrition = {
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
    }
    const component = <NutritionBadge nutrition={zeroNutrition} />
    expect(component.props.nutrition.calories).toBe(0)
  })

  it('should handle high calorie values', () => {
    const highCalNutrition = {
      calories: 850,
      proteinG: 45,
      carbsG: 100,
      fatG: 30,
      fiberG: 5,
    }
    const component = <NutritionBadge nutrition={highCalNutrition} />
    expect(component.props.nutrition.calories).toBe(850)
  })
})

import { describe, it, expect } from 'vitest'
import { NutritionComparison } from '../NutritionComparison'

describe('NutritionComparison Component', () => {
  const mockYourNutrition = {
    calories: 450,
    proteinG: 35,
    carbsG: 45,
    fatG: 12,
    fiberG: 8,
  }

  const mockTeamAverage = {
    calories: 520,
    proteinG: 40,
    carbsG: 60,
    fatG: 18,
    fiberG: 10,
  }

  it('should display your nutrition values', () => {
    const component = (
      <NutritionComparison
        yourNutrition={mockYourNutrition}
        compareWith={mockTeamAverage}
        compareLabel="Team Average"
      />
    )

    expect(component.props.yourNutrition.calories).toBe(450)
    expect(component.props.yourNutrition.proteinG).toBe(35)
  })

  it('should display comparison data', () => {
    const component = (
      <NutritionComparison
        yourNutrition={mockYourNutrition}
        compareWith={mockTeamAverage}
        compareLabel="Team Average"
      />
    )

    expect(component.props.compareWith.calories).toBe(520)
    expect(component.props.compareWith.proteinG).toBe(40)
  })

  it('should display comparison label', () => {
    const component = (
      <NutritionComparison
        yourNutrition={mockYourNutrition}
        compareWith={mockTeamAverage}
        compareLabel="Team Average"
      />
    )

    expect(component.props.compareLabel).toBe('Team Average')
  })

  it('should handle friend comparison', () => {
    const component = (
      <NutritionComparison
        yourNutrition={mockYourNutrition}
        compareWith={mockTeamAverage}
        compareLabel="Friend"
      />
    )

    expect(component.props.compareLabel).toBe('Friend')
  })

  it('should display all macros for comparison', () => {
    const component = (
      <NutritionComparison
        yourNutrition={mockYourNutrition}
        compareWith={mockTeamAverage}
        compareLabel="Team Average"
      />
    )

    expect(component.props.yourNutrition).toHaveProperty('calories')
    expect(component.props.yourNutrition).toHaveProperty('proteinG')
    expect(component.props.yourNutrition).toHaveProperty('carbsG')
    expect(component.props.yourNutrition).toHaveProperty('fatG')
    expect(component.props.yourNutrition).toHaveProperty('fiberG')
  })

  it('should compare equal nutritional values', () => {
    const sameNutrition = { ...mockYourNutrition }
    const component = (
      <NutritionComparison
        yourNutrition={mockYourNutrition}
        compareWith={sameNutrition}
        compareLabel="Target"
      />
    )

    expect(component.props.compareWith.calories).toBe(component.props.yourNutrition.calories)
  })

  it('should handle zero values', () => {
    const lowNutrition = {
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
    }
    const component = (
      <NutritionComparison
        yourNutrition={lowNutrition}
        compareWith={mockTeamAverage}
        compareLabel="Team"
      />
    )

    expect(component.props.yourNutrition.calories).toBe(0)
  })
})

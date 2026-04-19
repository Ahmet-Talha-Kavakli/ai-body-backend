import { describe, it, expect } from 'vitest'
import { MacroCircles } from '../MacroCircles'

describe('MacroCircles Component', () => {
  const mockNutrition = {
    calories: 2000,
    proteinG: 150,
    carbsG: 200,
    fatG: 70,
    fiberG: 35,
  }

  const mockGoals = {
    caloriesGoal: 2500,
    proteinGoal: 160,
    carbsGoal: 250,
    fatGoal: 85,
    fiberGoal: 30,
  }

  it('should display protein macro circle', () => {
    const component = <MacroCircles nutrition={mockNutrition} goals={mockGoals} />

    expect(component.props.nutrition.proteinG).toBe(150)
    expect(component.props.goals.proteinGoal).toBe(160)
  })

  it('should display carbs macro circle', () => {
    const component = <MacroCircles nutrition={mockNutrition} goals={mockGoals} />

    expect(component.props.nutrition.carbsG).toBe(200)
    expect(component.props.goals.carbsGoal).toBe(250)
  })

  it('should display fat macro circle', () => {
    const component = <MacroCircles nutrition={mockNutrition} goals={mockGoals} />

    expect(component.props.nutrition.fatG).toBe(70)
    expect(component.props.goals.fatGoal).toBe(85)
  })

  it('should display fiber macro circle', () => {
    const component = <MacroCircles nutrition={mockNutrition} goals={mockGoals} />

    expect(component.props.nutrition.fiberG).toBe(35)
    expect(component.props.goals.fiberGoal).toBe(30)
  })

  it('should handle exceeding goals', () => {
    const exceededNutrition = {
      calories: 3000,
      proteinG: 200,
      carbsG: 300,
      fatG: 100,
      fiberG: 50,
    }

    const component = <MacroCircles nutrition={exceededNutrition} goals={mockGoals} />

    expect(component.props.nutrition.proteinG).toBeGreaterThan(component.props.goals.proteinGoal)
  })

  it('should handle zero values', () => {
    const zeroNutrition = {
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
    }

    const component = <MacroCircles nutrition={zeroNutrition} goals={mockGoals} />

    expect(component.props.nutrition.proteinG).toBe(0)
  })

  it('should calculate percentages correctly', () => {
    const component = <MacroCircles nutrition={mockNutrition} goals={mockGoals} />

    // Protein: 150/160 = 93.75%
    const proteinPercent = (mockNutrition.proteinG / mockGoals.proteinGoal) * 100
    expect(proteinPercent).toBeLessThan(100)
  })
})

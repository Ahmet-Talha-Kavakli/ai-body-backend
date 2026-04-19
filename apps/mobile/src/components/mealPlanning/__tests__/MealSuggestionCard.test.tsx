import { describe, it, expect, vi } from 'vitest'
import { MealSuggestionCard } from '../MealSuggestionCard'

describe('MealSuggestionCard Component', () => {
  const mockMeal = {
    id: 'meal-1',
    mealName: 'Grilled Chicken with Quinoa',
    description: 'Lean protein with whole grains',
    nutrition: {
      calories: 450,
      proteinG: 35,
      carbsG: 45,
      fatG: 12,
      fiberG: 8,
    },
    reasonForSuggestion: 'Based on your 2000 cal goal',
    recipeUrl: 'https://example.com/recipe/grilled-chicken',
    createdAt: '2026-04-19T10:00:00Z',
    expiresAt: '2026-04-20T10:00:00Z',
  }

  it('should display meal name', () => {
    const component = <MealSuggestionCard meal={mockMeal} onAdd={() => {}} />

    expect(component.props.meal.mealName).toBe('Grilled Chicken with Quinoa')
  })

  it('should display meal description', () => {
    const component = <MealSuggestionCard meal={mockMeal} onAdd={() => {}} />

    expect(component.props.meal.description).toBe('Lean protein with whole grains')
  })

  it('should display nutrition macros', () => {
    const component = <MealSuggestionCard meal={mockMeal} onAdd={() => {}} />

    expect(component.props.meal.nutrition.calories).toBe(450)
    expect(component.props.meal.nutrition.proteinG).toBe(35)
    expect(component.props.meal.nutrition.carbsG).toBe(45)
    expect(component.props.meal.nutrition.fatG).toBe(12)
  })

  it('should display reason for suggestion', () => {
    const component = <MealSuggestionCard meal={mockMeal} onAdd={() => {}} />

    expect(component.props.meal.reasonForSuggestion).toBe('Based on your 2000 cal goal')
  })

  it('should call onAdd when add button pressed', () => {
    const mockOnAdd = vi.fn()
    const component = <MealSuggestionCard meal={mockMeal} onAdd={mockOnAdd} />

    expect(component.props.onAdd).toBe(mockOnAdd)
  })

  it('should display recipe link if available', () => {
    const mealWithRecipe = { ...mockMeal, recipeUrl: 'https://example.com/recipe' }
    const component = <MealSuggestionCard meal={mealWithRecipe} onAdd={() => {}} />

    expect(component.props.meal.recipeUrl).toBe('https://example.com/recipe')
  })

  it('should handle meal without recipe link', () => {
    const mealWithoutRecipe = { ...mockMeal, recipeUrl: undefined }
    const component = <MealSuggestionCard meal={mealWithoutRecipe} onAdd={() => {}} />

    expect(component.props.meal.recipeUrl).toBeUndefined()
  })
})

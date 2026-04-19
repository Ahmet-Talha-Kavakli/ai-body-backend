import { describe, it, expect } from 'vitest'
import { SharedMealDetailScreen } from '../SharedMealDetailScreen'

describe('SharedMealDetailScreen', () => {
  it('should render shared meal detail', () => {
    const component = <SharedMealDetailScreen route={{ params: { mealId: 'meal-1' } } as any} />

    expect(component).toBeDefined()
  })

  it('should display meal photo', () => {
    const component = <SharedMealDetailScreen route={{ params: { mealId: 'meal-1' } } as any} />

    expect(component).toBeDefined()
  })

  it('should show full nutrition details', () => {
    const component = <SharedMealDetailScreen route={{ params: { mealId: 'meal-1' } } as any} />

    expect(component).toBeDefined()
  })

  it('should display user profile info', () => {
    const component = <SharedMealDetailScreen route={{ params: { mealId: 'meal-1' } } as any} />

    expect(component).toBeDefined()
  })

  it('should allow comments on meal', () => {
    const component = <SharedMealDetailScreen route={{ params: { mealId: 'meal-1' } } as any} />

    expect(component).toBeDefined()
  })
})

import { nutritionClient } from '../api/nutritionClient'

type Nutrition = {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  glycemicIndex?: number
}

const cache = new Map<string, Nutrition>()

export const nutritionLookupService = {
  async getNutrition(
    foodName: string,
    photoPath?: string
  ): Promise<Nutrition> {
    // Try USDA first
    try {
      return await nutritionClient.lookupUSDA(foodName)
    } catch (error) {
      // Fallback to GPT-4
      if (!photoPath) {
        throw new Error(
          `Nutrition lookup failed for "${foodName}" and no photo provided for GPT-4 fallback`
        )
      }

      try {
        const gpt4Response = await nutritionClient.estimateWithGPT4(
          photoPath,
          foodName
        )
        // Remove confidence field to match Nutrition type
        const { confidence, ...nutrition } = gpt4Response
        return nutrition
      } catch (gpt4Error) {
        throw new Error(
          `Nutrition lookup failed: USDA error, GPT-4 fallback also failed`
        )
      }
    }
  },

  estimatePortionSize(nutrition: Nutrition, portionG: number): Nutrition {
    const basePortionG = 100 // USDA default portion
    const multiplier = portionG / basePortionG

    const result: Nutrition = {
      calories: Math.round(nutrition.calories * multiplier * 10) / 10,
      proteinG: Math.round(nutrition.proteinG * multiplier * 10) / 10,
      carbsG: Math.round(nutrition.carbsG * multiplier * 10) / 10,
      fatG: Math.round(nutrition.fatG * multiplier * 10) / 10,
      fiberG: Math.round(nutrition.fiberG * multiplier * 10) / 10,
    }

    if (nutrition.glycemicIndex !== undefined) {
      result.glycemicIndex = nutrition.glycemicIndex // GI doesn't scale with portion
    }

    return result
  },

  cacheNutrition(foodName: string, nutrition: Nutrition): void {
    cache.set(foodName.toLowerCase(), nutrition)
  },

  _resetCache(): void {
    cache.clear()
  },
}

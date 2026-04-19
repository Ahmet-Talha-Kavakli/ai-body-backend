import { nutritionClient } from '../api/nutritionClient'
import type { FoodDetectionResult } from '../types/ar'
import type { MealLog } from '@fitai/shared-types'

type Nutrition = {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  glycemicIndex?: number
}

const cache = new Map<string, Nutrition>()
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export const nutritionLookupService = {
  async getNutrition(
    foodName: string,
    photoPath?: string
  ): Promise<Nutrition> {
    // Check cache first
    const cached = cache.get(foodName.toLowerCase())
    if (cached) {
      return cached
    }

    // Try USDA first
    try {
      const nutrition = await nutritionClient.lookupUSDA(foodName)
      this.cacheNutrition(foodName, nutrition)
      return nutrition
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
        this.cacheNutrition(foodName, nutrition)
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

  /**
   * Create a Phase 3 MealLog from an AR food detection result
   * Integrates AR detection data with Phase 3 nutrition system
   */
  createMealLogFromDetection(
    detection: FoodDetectionResult,
    userId: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout' = 'snack'
  ): Partial<MealLog> {
    const loggedAt = new Date(detection.detectedAt)

    return {
      userId,
      mealType,
      loggedAt,
      photoUrl: detection.modelUrl,
      aiAnalyzed: true,
      totalCalories: Math.round(detection.nutrition.calories),
      totalProteinG: Math.round(detection.nutrition.proteinG * 100) / 100,
      totalCarbsG: Math.round(detection.nutrition.carbsG * 100) / 100,
      totalFatG: Math.round(detection.nutrition.fatG * 100) / 100,
      notes: `AR detected: ${detection.detectedFoodName} (${detection.confidence}% confidence, ${detection.portionSize}${detection.portionUnit})`,
      items: [
        {
          id: `item-${detection.id}`,
          name: detection.detectedFoodName,
          servingSize: detection.portionSize,
          servingUnit: detection.portionUnit,
          calories: Math.round(detection.nutrition.calories),
          proteinG: Math.round(detection.nutrition.proteinG * 100) / 100,
          carbsG: Math.round(detection.nutrition.carbsG * 100) / 100,
          fatG: Math.round(detection.nutrition.fatG * 100) / 100,
          fiberG: detection.nutrition.fiberG
            ? Math.round(detection.nutrition.fiberG * 100) / 100
            : undefined,
        },
      ],
    }
  },

  _resetCache(): void {
    cache.clear()
  },
}

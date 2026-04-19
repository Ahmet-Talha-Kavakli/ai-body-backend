import * as socialDb from '../db/social'
import type { SharedMeal, SocialFeedItem, Nutrition } from '../types/social'
import { v4 as uuidv4 } from 'uuid'

export interface ShareMealRequest {
  mealLogId: string
  userId: string
  foodName: string
  photoUrl: string
  nutrition: Nutrition
  shareType: 'private' | 'friends' | 'team'
  friendIds?: string[]
  teamId?: string
}

export interface MealComparison {
  meal1: SharedMeal
  meal2: SharedMeal
  difference: {
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG: number
  }
}

export const socialSharingService = {
  async shareMeal(request: ShareMealRequest): Promise<SharedMeal> {
    const meal: SharedMeal = {
      id: uuidv4(),
      mealLogId: request.mealLogId,
      userId: request.userId,
      foodName: request.foodName,
      photoUrl: request.photoUrl,
      nutrition: request.nutrition,
      shareType: request.shareType,
      sharedWith: {
        friendIds: request.friendIds,
        teamId: request.teamId,
      },
      createdAt: new Date().toISOString(),
      reactions: [],
    }

    await socialDb.createSharedMeal(meal)
    return meal
  },

  async getSocialFeed(userId: string): Promise<SocialFeedItem[]> {
    return await socialDb.getSocialFeed(userId)
  },

  async getTeamMeals(teamId: string): Promise<SocialFeedItem[]> {
    return await socialDb.getTeamMeals(teamId)
  },

  async compareMeals(
    mealId1: string,
    mealId2: string
  ): Promise<MealComparison> {
    const meal1 = await socialDb.getSharedMealById(mealId1)
    const meal2 = await socialDb.getSharedMealById(mealId2)

    if (!meal1 || !meal2) {
      throw new Error('Meal not found')
    }

    return {
      meal1,
      meal2,
      difference: {
        calories: meal1.nutrition.calories - meal2.nutrition.calories,
        proteinG: meal1.nutrition.proteinG - meal2.nutrition.proteinG,
        carbsG: meal1.nutrition.carbsG - meal2.nutrition.carbsG,
        fatG: meal1.nutrition.fatG - meal2.nutrition.fatG,
        fiberG: meal1.nutrition.fiberG - meal2.nutrition.fiberG,
      },
    }
  },

  async reactToMeal(
    mealId: string,
    userId: string,
    reactionType: 'like' | 'heart'
  ): Promise<void> {
    await socialDb.addReaction(mealId, userId, reactionType)
  },

  async removeReaction(mealId: string, userId: string): Promise<void> {
    await socialDb.removeReaction(mealId, userId)
  },

  async getUserSharedMeals(userId: string): Promise<SharedMeal[]> {
    return await socialDb.getUserSharedMeals(userId)
  },

  async deleteSharedMeal(mealId: string): Promise<void> {
    await socialDb.deleteSharedMeal(mealId)
  },
}

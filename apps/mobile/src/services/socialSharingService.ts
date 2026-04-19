import type { SharedMeal, SocialFeedItem, SocialFeedFilter } from '../types/social'
import { socialSharingClient } from '../api/socialSharingClient'
import * as socialDb from '../db/social'

export const socialSharingService = {
  async shareMeal(
    mealLogId: string,
    shareType: 'private' | 'friends' | 'team',
    sharedWith: {
      friendIds?: string[]
      teamId?: string
    }
  ): Promise<SharedMeal> {
    try {
      const result = await socialSharingClient.shareMeal(mealLogId, shareType, sharedWith)
      await socialDb.saveSharedMeal(result)
      return result
    } catch (error) {
      await socialDb.queueShare(mealLogId, shareType, sharedWith)
      throw error
    }
  },

  async getSocialFeed(userId: string, filter: SocialFeedFilter): Promise<SocialFeedItem[]> {
    try {
      const feed = await socialSharingClient.getSocialFeed(userId, filter)
      await socialDb.cacheFeed(feed)
      return feed
    } catch (error) {
      const cachedFeed = await socialDb.getCachedFeed()
      return cachedFeed
    }
  },

  async addReaction(
    sharedMealId: string,
    reactionType: 'like' | 'heart'
  ): Promise<{ success: boolean; count: number }> {
    try {
      const result = await socialSharingClient.addReaction(sharedMealId, reactionType)
      await socialDb.addReactionToMeal(sharedMealId, 'user-1', reactionType)
      return result
    } catch (error) {
      await socialDb.queueReaction(sharedMealId, reactionType)
      throw error
    }
  },

  async syncOfflineData(): Promise<void> {
    const pendingShares = await socialDb.getPendingShares()
    for (const share of pendingShares) {
      try {
        const data = JSON.parse(share.data)
        await socialSharingClient.shareMeal(data.mealLogId, data.shareType, data.sharedWith)
        await socialDb.removePendingShare(share.id)
      } catch {
        // Keep in queue for retry
      }
    }

    const pendingReactions = await socialDb.getPendingReactions()
    for (const reaction of pendingReactions) {
      try {
        const data = JSON.parse(reaction.data)
        await socialSharingClient.addReaction(data.sharedMealId, data.reactionType)
        await socialDb.removePendingReaction(reaction.id)
      } catch {
        // Keep in queue for retry
      }
    }
  },
}

import type { SharedMeal, SocialFeedItem, SocialFeedFilter } from '../types/social'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

interface ReactionResponse {
  success: boolean
  count: number
}

export const socialSharingClient = {
  async shareMeal(
    mealLogId: string,
    shareType: 'private' | 'friends' | 'team',
    sharedWith: {
      friendIds?: string[]
      teamId?: string
    }
  ): Promise<SharedMeal> {
    const response = await fetch(`${BASE_URL}/api/social/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealLogId,
        shareType,
        sharedWith,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to share meal: ${response.statusText}`)
    }

    return response.json()
  },

  async getSocialFeed(userId: string, filter: SocialFeedFilter): Promise<SocialFeedItem[]> {
    const params = new URLSearchParams()
    params.append('userId', userId)

    if (filter.shareType) {
      params.append('shareType', filter.shareType)
    }
    if (filter.limit) {
      params.append('limit', filter.limit.toString())
    }
    if (filter.offset) {
      params.append('offset', filter.offset.toString())
    }

    const response = await fetch(`${BASE_URL}/api/social/feed?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch social feed: ${response.statusText}`)
    }

    return response.json()
  },

  async addReaction(
    sharedMealId: string,
    reactionType: 'like' | 'heart'
  ): Promise<ReactionResponse> {
    const response = await fetch(`${BASE_URL}/api/social/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sharedMealId,
        reactionType,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to add reaction: ${response.statusText}`)
    }

    return response.json()
  },
}

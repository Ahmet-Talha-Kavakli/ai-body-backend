import socialClient from '../api/socialClient'
import type { LeaderboardEntry } from '../types/social-social'

export async function getGlobalLeaderboard(
  period: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'weekly'
): Promise<LeaderboardEntry[]> {
  try {
    const response = await socialClient.leaderboards.global(period)
    return response.data
  } catch (error) {
    console.error('Error fetching global leaderboard:', error)
    throw error
  }
}

export async function getFriendLeaderboard(
  period: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'weekly'
): Promise<LeaderboardEntry[]> {
  try {
    const response = await socialClient.leaderboards.friends(period)
    return response.data
  } catch (error) {
    console.error('Error fetching friend leaderboard:', error)
    throw error
  }
}

export async function getChallengeLeaderboard(challengeId: string): Promise<LeaderboardEntry[]> {
  try {
    const response = await socialClient.leaderboards.challenge(challengeId)
    return response.data
  } catch (error) {
    console.error('Error fetching challenge leaderboard:', error)
    throw error
  }
}

export async function getUserLeaderboardPosition(
  period: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'weekly'
): Promise<number> {
  try {
    const response = await socialClient.leaderboards.myRank(period)
    return response.data.rank
  } catch (error) {
    console.error('Error fetching user leaderboard position:', error)
    throw error
  }
}

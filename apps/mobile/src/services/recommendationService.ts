import { Recommendation } from '@/types/analytics'
import { analyticsClient } from './analyticsClient'

// Get meal recommendations based on user embedding
export async function getMealRecommendations(userId: string, limit: number = 5): Promise<Recommendation[]> {
  try {
    const response = await analyticsClient.recommendations.getMeals(userId)
    return response.data.slice(0, limit)
  } catch (error) {
    console.error('Failed to get meal recommendations:', error)
    return []
  }
}

// Get workout recommendations
export async function getWorkoutRecommendations(userId: string, limit: number = 5): Promise<Recommendation[]> {
  try {
    const response = await analyticsClient.recommendations.getWorkouts(userId)
    return response.data.slice(0, limit)
  } catch (error) {
    console.error('Failed to get workout recommendations:', error)
    return []
  }
}

// Get health recommendations
export async function getHealthRecommendations(userId: string, limit: number = 3): Promise<Recommendation[]> {
  try {
    const response = await analyticsClient.recommendations.getHealth(userId)
    return response.data.slice(0, limit)
  } catch (error) {
    console.error('Failed to get health recommendations:', error)
    return []
  }
}

// Get friend recommendations (similar users)
export async function getFriendRecommendations(userId: string, limit: number = 5): Promise<Recommendation[]> {
  try {
    const response = await analyticsClient.recommendations.getFriends(userId)
    return response.data.slice(0, limit)
  } catch (error) {
    console.error('Failed to get friend recommendations:', error)
    return []
  }
}

// Get challenge recommendations
export async function getChallengeRecommendations(userId: string, limit: number = 5): Promise<Recommendation[]> {
  try {
    const response = await analyticsClient.recommendations.getChallenges(userId)
    return response.data.slice(0, limit)
  } catch (error) {
    console.error('Failed to get challenge recommendations:', error)
    return []
  }
}

// Get all recommendations (prioritized)
export async function getAllRecommendations(userId: string): Promise<Recommendation[]> {
  const [meals, workouts, health, friends, challenges] = await Promise.all([
    getMealRecommendations(userId, 3),
    getWorkoutRecommendations(userId, 3),
    getHealthRecommendations(userId, 2),
    getFriendRecommendations(userId, 3),
    getChallengeRecommendations(userId, 3),
  ])

  return [
    ...meals,
    ...workouts,
    ...health,
    ...friends,
    ...challenges,
  ].sort((a, b) => b.confidence - a.confidence).slice(0, 10)
}

// Filter recommendations by type
export function filterByType(recommendations: Recommendation[], type: string): Recommendation[] {
  return recommendations.filter(r => r.type === type)
}

// Filter expired recommendations
export function filterExpired(recommendations: Recommendation[]): Recommendation[] {
  const now = new Date()
  return recommendations.filter(r => new Date(r.expiresAt) > now)
}

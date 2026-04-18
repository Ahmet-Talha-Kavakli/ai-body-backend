import socialClient from '../api/socialClient'
import type { Challenge, ChallengeProgress, ChallengeWithProgress } from '../types/challenge'

export async function getChallenges(): Promise<Challenge[]> {
  try {
    const response = await socialClient.challenges.list()
    return response.data
  } catch (error) {
    console.error('Error fetching challenges:', error)
    throw error
  }
}

export async function getChallengeDetail(challengeId: string): Promise<ChallengeWithProgress> {
  try {
    const response = await socialClient.challenges.get(challengeId)
    return response.data
  } catch (error) {
    console.error('Error fetching challenge detail:', error)
    throw error
  }
}

export async function createChallenge(
  challenge: Omit<Challenge, 'id' | 'createdAt'>
): Promise<Challenge> {
  try {
    const response = await socialClient.challenges.create(challenge)
    return response.data
  } catch (error) {
    console.error('Error creating challenge:', error)
    throw error
  }
}

export async function joinChallenge(challengeId: string): Promise<boolean> {
  try {
    await socialClient.challenges.join(challengeId)
    return true
  } catch (error) {
    console.error('Error joining challenge:', error)
    throw error
  }
}

export async function getChallengeProgress(challengeId: string): Promise<ChallengeProgress> {
  try {
    const response = await socialClient.challenges.getProgress(challengeId)
    return response.data
  } catch (error) {
    console.error('Error fetching challenge progress:', error)
    throw error
  }
}

export async function updateChallengeProgress(
  challengeId: string,
  value: number
): Promise<boolean> {
  try {
    await socialClient.challenges.updateProgress(challengeId, value)
    return true
  } catch (error) {
    console.error('Error updating challenge progress:', error)
    throw error
  }
}

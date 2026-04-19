import teamsClient from '../api/teamsClient'
import type { TeamChallenge } from '../types/teams'

export async function createChallenge(
  teamId: string,
  type: TeamChallenge['type'],
  goal: number,
  deadline: string,
  title?: string,
  description?: string
): Promise<TeamChallenge> {
  try {
    const data: any = {
      type,
      goal,
      deadline,
    }
    if (title) data.title = title
    if (description) data.description = description

    const response = await teamsClient.challenges.create(teamId, data)
    return response.data
  } catch (error) {
    console.error('Error creating challenge:', error)
    throw error
  }
}

export async function getChallenges(teamId: string): Promise<TeamChallenge[]> {
  try {
    const response = await teamsClient.challenges.list(teamId)
    return response.data
  } catch (error) {
    console.error('Error fetching challenges:', error)
    throw error
  }
}

export async function updateChallengeProgress(challengeId: string): Promise<TeamChallenge> {
  try {
    const response = await teamsClient.challenges.updateProgress(challengeId)
    return response.data
  } catch (error) {
    console.error('Error updating challenge progress:', error)
    throw error
  }
}

export async function completeChallenge(challengeId: string): Promise<TeamChallenge> {
  try {
    const response = await teamsClient.challenges.complete(challengeId)
    return response.data
  } catch (error) {
    console.error('Error completing challenge:', error)
    throw error
  }
}

export async function deleteChallenge(challengeId: string): Promise<void> {
  try {
    await teamsClient.challenges.delete(challengeId)
  } catch (error) {
    console.error('Error deleting challenge:', error)
    throw error
  }
}

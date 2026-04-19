import teamsClient from '../api/teamsClient'
import type { TeamStatsSnapshot } from '../types/teams'

export interface MemberContribution {
  workouts: number
  calories: number
  steps: number
  duration: number
}

export interface LeaderboardEntry {
  userId: string
  userName: string
  workouts: number
  calories: number
  steps: number
  duration: number
  rank: number
}

export async function aggregateTeamStats(teamId: string): Promise<TeamStatsSnapshot> {
  try {
    const response = await teamsClient.stats.aggregate(teamId)
    return response.data
  } catch (error) {
    console.error('Error aggregating team stats:', error)
    throw error
  }
}

export async function calculateMemberContribution(
  teamId: string,
  userId: string
): Promise<MemberContribution> {
  try {
    const response = await teamsClient.stats.memberContribution(teamId, userId)
    return response.data
  } catch (error) {
    console.error('Error calculating member contribution:', error)
    throw error
  }
}

export async function getTeamLeaderboard(teamId: string): Promise<LeaderboardEntry[]> {
  try {
    const response = await teamsClient.stats.leaderboard(teamId)
    return response.data
  } catch (error) {
    console.error('Error fetching team leaderboard:', error)
    throw error
  }
}

export async function saveTeamStatsSnapshot(teamId: string): Promise<TeamStatsSnapshot> {
  try {
    const response = await teamsClient.stats.saveSnapshot(teamId)
    return response.data
  } catch (error) {
    console.error('Error saving team stats snapshot:', error)
    throw error
  }
}

import teamsClient from '../api/teamsClient'
import type { TeamChallenge, TeamStatsSnapshot, TeamAchievement, TeamNotification } from '../types/teams'
import { v4 as uuidv4 } from 'uuid'

/**
 * Achievement unlock criteria and triggers
 */
const achievementCriteria = {
  first_team: {
    trigger: 'team_created',
    criteria: () => true,
  },
  ten_workouts: {
    trigger: 'stats_updated',
    criteria: (stats: TeamStatsSnapshot) => stats.totalWorkouts >= 10,
  },
  milestone_calories: {
    trigger: 'stats_updated',
    criteria: (stats: TeamStatsSnapshot) => stats.totalCalories >= 1000000, // 1M calories
  },
  milestone_steps: {
    trigger: 'stats_updated',
    criteria: (stats: TeamStatsSnapshot) => stats.totalSteps >= 100000, // 100k steps
  },
}

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

/**
 * Check for achievement unlocks based on team stats
 * Implements achievement unlock logic that checks criteria and creates notifications
 */
export async function checkAndUnlockAchievements(
  teamId: string,
  teamStats: TeamStatsSnapshot,
  unlockedAchievements: Map<string, TeamAchievement>
): Promise<{
  newAchievements: TeamAchievement[]
  notifications: TeamNotification[]
}> {
  const newAchievements: TeamAchievement[] = []
  const notifications: TeamNotification[] = []

  for (const [achievementType, achievement] of Object.entries(achievementCriteria)) {
    try {
      // Check if already unlocked
      if (unlockedAchievements.has(achievementType)) {
        continue
      }

      // Check if criteria is met
      const isMet = achievement.criteria(teamStats)
      if (!isMet) {
        continue
      }

      // Create achievement
      const newAchievement: TeamAchievement = {
        id: uuidv4(),
        teamId,
        type: achievementType as 'first_team' | 'ten_workouts' | 'milestone_calories' | 'milestone_steps',
        title: getAchievementTitle(achievementType),
        description: getAchievementDescription(achievementType),
        unlockedAt: new Date().toISOString(),
        badge: `badge-${achievementType}`,
      }

      newAchievements.push(newAchievement)
      unlockedAchievements.set(achievementType, newAchievement)

      // Create notification
      const notification: TeamNotification = {
        id: uuidv4(),
        teamId,
        type: 'milestone_reached',
        title: 'Achievement Unlocked!',
        message: `Your team unlocked: ${newAchievement.title}`,
        createdAt: new Date().toISOString(),
        read: false,
      }

      notifications.push(notification)

      console.log(`Achievement unlocked: ${achievementType} for team ${teamId}`)
    } catch (error) {
      console.error(`Error checking achievement ${achievementType}:`, error)
    }
  }

  return { newAchievements, notifications }
}

/**
 * Get human-readable achievement title
 */
function getAchievementTitle(type: string): string {
  const titles: Record<string, string> = {
    first_team: 'First Team Created',
    ten_workouts: '10 Workouts Completed',
    milestone_calories: '1 Million Calories Burned',
    milestone_steps: '100k Steps Milestone',
  }
  return titles[type] || 'Achievement Unlocked'
}

/**
 * Get achievement description
 */
function getAchievementDescription(type: string): string {
  const descriptions: Record<string, string> = {
    first_team: 'You created your first team and started a fitness journey together',
    ten_workouts: 'Your team completed 10 workouts together',
    milestone_calories: 'Your team burned 1 million calories',
    milestone_steps: 'Your team achieved 100,000 steps',
  }
  return descriptions[type] || 'Great achievement!'
}

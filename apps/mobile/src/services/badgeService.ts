import socialClient from '../api/socialClient'
import type { Badge, UserBadge } from '../types/social-social'

export const BADGE_DEFINITIONS: Badge[] = [
  // Nutrition badges (10)
  {
    id: 'nutrition-starter',
    name: 'Nutrition Starter',
    description: 'Log 5 meals',
    icon: '🍎',
    category: 'nutrition',
    criteria: { type: 'meals_logged', target: 5 },
    rarity: 'common',
  },
  {
    id: 'nutrition-enthusiast',
    name: 'Nutrition Enthusiast',
    description: 'Log 25 meals',
    icon: '🥗',
    category: 'nutrition',
    criteria: { type: 'meals_logged', target: 25 },
    rarity: 'rare',
  },
  {
    id: 'nutrition-master',
    name: 'Nutrition Master',
    description: 'Log 100 meals',
    icon: '👨‍🍳',
    category: 'nutrition',
    criteria: { type: 'meals_logged', target: 100 },
    rarity: 'rare',
  },
  {
    id: 'macro-tracker',
    name: 'Macro Tracker',
    description: 'Track macros for 10 meals',
    icon: '📊',
    category: 'nutrition',
    criteria: { type: 'macro_tracked', target: 10 },
    rarity: 'common',
  },
  {
    id: 'water-warrior',
    name: 'Water Warrior',
    description: 'Log water intake for 7 days',
    icon: '💧',
    category: 'nutrition',
    criteria: { type: 'water_days', target: 7 },
    rarity: 'common',
  },
  {
    id: 'calorie-counter',
    name: 'Calorie Counter',
    description: 'Log 50 meals',
    icon: '🔥',
    category: 'nutrition',
    criteria: { type: 'meals_logged', target: 50 },
    rarity: 'rare',
  },
  {
    id: 'balanced-diet',
    name: 'Balanced Diet',
    description: 'Hit macro targets for 5 days',
    icon: '⚖️',
    category: 'nutrition',
    criteria: { type: 'balanced_days', target: 5 },
    rarity: 'rare',
  },
  {
    id: 'superfood-lover',
    name: 'Superfood Lover',
    description: 'Log 25 meals with high nutritional value',
    icon: '💪',
    category: 'nutrition',
    criteria: { type: 'healthy_meals', target: 25 },
    rarity: 'epic',
  },
  {
    id: 'meal-prep-master',
    name: 'Meal Prep Master',
    description: 'Plan 10 meals ahead',
    icon: '📅',
    category: 'nutrition',
    criteria: { type: 'meals_planned', target: 10 },
    rarity: 'epic',
  },
  {
    id: 'nutrition-legend',
    name: 'Nutrition Legend',
    description: 'Log 250 meals',
    icon: '🌟',
    category: 'nutrition',
    criteria: { type: 'meals_logged', target: 250 },
    rarity: 'legendary',
  },

  // Health badges (10)
  {
    id: 'heart-watcher',
    name: 'Heart Watcher',
    description: 'Check heart rate 10 times',
    icon: '❤️',
    category: 'health',
    criteria: { type: 'health_checks', target: 10 },
    rarity: 'common',
  },
  {
    id: 'sleep-champion',
    name: 'Sleep Champion',
    description: 'Sleep 7+ hours for 7 days',
    icon: '😴',
    category: 'health',
    criteria: { type: 'sleep_nights', target: 7 },
    rarity: 'rare',
  },
  {
    id: 'health-monitor',
    name: 'Health Monitor',
    description: 'Track health metrics 50 times',
    icon: '📱',
    category: 'health',
    criteria: { type: 'health_checks', target: 50 },
    rarity: 'common',
  },
  {
    id: 'sleep-master',
    name: 'Sleep Master',
    description: 'Sleep 7+ hours for 30 days',
    icon: '🌙',
    category: 'health',
    criteria: { type: 'sleep_nights', target: 30 },
    rarity: 'epic',
  },
  {
    id: 'stress-reliever',
    name: 'Stress Reliever',
    description: 'Meditate 10 times',
    icon: '🧘',
    category: 'health',
    criteria: { type: 'meditations', target: 10 },
    rarity: 'rare',
  },
  {
    id: 'oxygen-optimizer',
    name: 'Oxygen Optimizer',
    description: 'Track oxygen saturation 20 times',
    icon: '🫁',
    category: 'health',
    criteria: { type: 'o2_checks', target: 20 },
    rarity: 'rare',
  },
  {
    id: 'vitamin-enthusiast',
    name: 'Vitamin Enthusiast',
    description: 'Log 15 vitamin/supplement intakes',
    icon: '💊',
    category: 'health',
    criteria: { type: 'supplements_logged', target: 15 },
    rarity: 'common',
  },
  {
    id: 'hydration-hero',
    name: 'Hydration Hero',
    description: 'Maintain hydration for 14 days',
    icon: '💦',
    category: 'health',
    criteria: { type: 'hydration_days', target: 14 },
    rarity: 'rare',
  },
  {
    id: 'wellness-warrior',
    name: 'Wellness Warrior',
    description: 'Complete 5 health challenges',
    icon: '⚔️',
    category: 'health',
    criteria: { type: 'health_challenges', target: 5 },
    rarity: 'epic',
  },
  {
    id: 'health-legend',
    name: 'Health Legend',
    description: 'Track health metrics 200 times',
    icon: '🏆',
    category: 'health',
    criteria: { type: 'health_checks', target: 200 },
    rarity: 'legendary',
  },

  // Workout badges (10)
  {
    id: 'first-workout',
    name: 'First Workout',
    description: 'Complete 1 workout',
    icon: '💪',
    category: 'workout',
    criteria: { type: 'workouts_completed', target: 1 },
    rarity: 'common',
  },
  {
    id: 'workout-starter',
    name: 'Workout Starter',
    description: 'Complete 5 workouts',
    icon: '🏃',
    category: 'workout',
    criteria: { type: 'workouts_completed', target: 5 },
    rarity: 'common',
  },
  {
    id: 'fit-enthusiast',
    name: 'Fit Enthusiast',
    description: 'Complete 25 workouts',
    icon: '🚴',
    category: 'workout',
    criteria: { type: 'workouts_completed', target: 25 },
    rarity: 'rare',
  },
  {
    id: 'iron-will',
    name: 'Iron Will',
    description: 'Complete 50 workouts',
    icon: '🏋️',
    category: 'workout',
    criteria: { type: 'workouts_completed', target: 50 },
    rarity: 'epic',
  },
  {
    id: 'gym-rat',
    name: 'Gym Rat',
    description: 'Complete 100 workouts',
    icon: '🦾',
    category: 'workout',
    criteria: { type: 'workouts_completed', target: 100 },
    rarity: 'epic',
  },
  {
    id: 'marathon-runner',
    name: 'Marathon Runner',
    description: 'Complete 250 workouts',
    icon: '🏅',
    category: 'workout',
    criteria: { type: 'workouts_completed', target: 250 },
    rarity: 'legendary',
  },
  {
    id: 'cardio-king',
    name: 'Cardio King',
    description: 'Complete 15 cardio workouts',
    icon: '❤️‍🔥',
    category: 'workout',
    criteria: { type: 'cardio_workouts', target: 15 },
    rarity: 'rare',
  },
  {
    id: 'strength-builder',
    name: 'Strength Builder',
    description: 'Complete 20 strength workouts',
    icon: '⚡',
    category: 'workout',
    criteria: { type: 'strength_workouts', target: 20 },
    rarity: 'rare',
  },
  {
    id: 'flexibility-master',
    name: 'Flexibility Master',
    description: 'Complete 10 flexibility workouts',
    icon: '🤸',
    category: 'workout',
    criteria: { type: 'flexibility_workouts', target: 10 },
    rarity: 'rare',
  },
  {
    id: 'fitness-legend',
    name: 'Fitness Legend',
    description: 'Complete 500 workouts',
    icon: '👑',
    category: 'workout',
    criteria: { type: 'workouts_completed', target: 500 },
    rarity: 'legendary',
  },

  // Streak badges (10)
  {
    id: 'week-streak',
    name: 'Week Warrior',
    description: '7-day workout streak',
    icon: '🔥',
    category: 'streak',
    criteria: { type: 'workout_streak', target: 7 },
    rarity: 'rare',
  },
  {
    id: 'month-streak',
    name: 'Monthly Grinder',
    description: '30-day workout streak',
    icon: '🌟',
    category: 'streak',
    criteria: { type: 'workout_streak', target: 30 },
    rarity: 'epic',
  },
  {
    id: 'century-streak',
    name: 'Century Champion',
    description: '100-day workout streak',
    icon: '🏆',
    category: 'streak',
    criteria: { type: 'workout_streak', target: 100 },
    rarity: 'legendary',
  },
  {
    id: 'nutrition-week',
    name: 'Nutrition Week',
    description: '7-day nutrition logging streak',
    icon: '🥗',
    category: 'streak',
    criteria: { type: 'nutrition_streak', target: 7 },
    rarity: 'rare',
  },
  {
    id: 'nutrition-month',
    name: 'Nutrition Month',
    description: '30-day nutrition logging streak',
    icon: '📊',
    category: 'streak',
    criteria: { type: 'nutrition_streak', target: 30 },
    rarity: 'epic',
  },
  {
    id: 'steps-warrior',
    name: 'Steps Warrior',
    description: '7-day 10k steps streak',
    icon: '👣',
    category: 'streak',
    criteria: { type: 'steps_streak', target: 7 },
    rarity: 'rare',
  },
  {
    id: 'consistent-king',
    name: 'Consistent King',
    description: '14-day activity streak',
    icon: '👑',
    category: 'streak',
    criteria: { type: 'activity_streak', target: 14 },
    rarity: 'epic',
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: '365-day activity streak',
    icon: '⚡',
    category: 'streak',
    criteria: { type: 'activity_streak', target: 365 },
    rarity: 'legendary',
  },
  {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    description: 'Workout every weekend for 4 weeks',
    icon: '🌞',
    category: 'streak',
    criteria: { type: 'weekend_streaks', target: 4 },
    rarity: 'rare',
  },
  {
    id: 'daily-dedicated',
    name: 'Daily Dedicated',
    description: '60-day daily activity streak',
    icon: '☀️',
    category: 'streak',
    criteria: { type: 'activity_streak', target: 60 },
    rarity: 'epic',
  },

  // Social badges (10)
  {
    id: 'friend-maker',
    name: 'Friend Maker',
    description: 'Add 5 friends',
    icon: '👥',
    category: 'social',
    criteria: { type: 'friends_added', target: 5 },
    rarity: 'common',
  },
  {
    id: 'social-networker',
    name: 'Social Networker',
    description: 'Add 20 friends',
    icon: '🤝',
    category: 'social',
    criteria: { type: 'friends_added', target: 20 },
    rarity: 'rare',
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Add 50 friends',
    icon: '🦋',
    category: 'social',
    criteria: { type: 'friends_added', target: 50 },
    rarity: 'legendary',
  },
  {
    id: 'challenge-creator',
    name: 'Challenge Creator',
    description: 'Create 3 challenges',
    icon: '🎯',
    category: 'social',
    criteria: { type: 'challenges_created', target: 3 },
    rarity: 'rare',
  },
  {
    id: 'challenge-completionist',
    name: 'Challenge Completionist',
    description: 'Complete 10 challenges',
    icon: '✅',
    category: 'social',
    criteria: { type: 'challenges_completed', target: 10 },
    rarity: 'epic',
  },
  {
    id: 'leaderboard-climber',
    name: 'Leaderboard Climber',
    description: 'Reach top 50 on global leaderboard',
    icon: '📈',
    category: 'social',
    criteria: { type: 'leaderboard_rank', target: 50 },
    rarity: 'epic',
  },
  {
    id: 'top-dog',
    name: 'Top Dog',
    description: 'Reach top 10 on global leaderboard',
    icon: '🐕',
    category: 'social',
    criteria: { type: 'leaderboard_rank', target: 10 },
    rarity: 'legendary',
  },
  {
    id: 'community-champion',
    name: 'Community Champion',
    description: 'Get 100 likes on your activities',
    icon: '👍',
    category: 'social',
    criteria: { type: 'activity_likes', target: 100 },
    rarity: 'epic',
  },
  {
    id: 'group-leader',
    name: 'Group Leader',
    description: 'Lead a group challenge with 5+ members',
    icon: '🎖️',
    category: 'social',
    criteria: { type: 'group_size', target: 5 },
    rarity: 'epic',
  },
  {
    id: 'influencer',
    name: 'Influencer',
    description: 'Get 500 likes on your activities',
    icon: '⭐',
    category: 'social',
    criteria: { type: 'activity_likes', target: 500 },
    rarity: 'legendary',
  },
]

export async function getBadges(): Promise<Badge[]> {
  return BADGE_DEFINITIONS
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  try {
    const response = await socialClient.badges.getUserBadges(userId)
    return response.data
  } catch (error) {
    console.error('Error fetching user badges:', error)
    throw error
  }
}

export async function evaluateBadgeCriteria(
  userId: string,
  criteria: { type: string; target: number }
): Promise<number> {
  // This would typically query various data sources based on criteria type
  // For now, return 0 as a placeholder for backend implementation
  return 0
}

export async function unlockBadge(userId: string, badgeId: string): Promise<UserBadge> {
  try {
    const response = await socialClient.badges.unlock(badgeId)
    return response.data
  } catch (error) {
    console.error('Error unlocking badge:', error)
    throw error
  }
}

export function isBadgeUnlocked(userBadges: UserBadge[], badgeId: string): boolean {
  return userBadges.some((ub) => ub.badgeId === badgeId)
}

export function getBadgeProgress(badgeId: string, current: number, target: number): number {
  return Math.min(100, Math.round((current / target) * 100))
}

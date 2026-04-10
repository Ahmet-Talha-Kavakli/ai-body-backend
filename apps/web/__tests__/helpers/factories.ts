import type { User, UserFriend, UserActivity, Leaderboard, DailyMetrics } from '@prisma/client'

export function makeUser(overrides?: Partial<User>): User {
  return {
    id: 'user_1',
    clerkId: 'clerk_test_user_1',
    email: 'test@example.com',
    username: 'testuser',
    bio: null,
    profilePublic: false,
    friendCount: 0,
    followerCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function makeFriendship(overrides?: Partial<UserFriend>): UserFriend {
  return {
    id: 'friend_1',
    userId: 'user_1',
    friendId: 'user_2',
    status: 'accepted',
    requestedAt: new Date(),
    acceptedAt: new Date(),
    ...overrides,
  }
}

export function makeActivity(overrides?: Partial<UserActivity>): UserActivity {
  return {
    id: 'activity_1',
    userId: 'user_1',
    activityType: 'workout_completed',
    description: 'Completed upper body workout',
    metadata: {},
    createdAt: new Date(),
    visibility: 'friends_only',
    ...overrides,
  }
}

export function makeLeaderboard(overrides?: Partial<Leaderboard>): Leaderboard {
  return {
    id: 'lb_1',
    leaderboardType: 'form_score',
    period: 'weekly',
    entries: JSON.stringify([
      { userId: 'user_1', username: 'alice', score: 85, rank: 1, trend: 'up' },
      { userId: 'user_2', username: 'bob', score: 80, rank: 2, trend: 'stable' },
    ]),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function makeDailyMetrics(overrides?: Partial<DailyMetrics>): DailyMetrics {
  return {
    id: 'metrics_1',
    userId: 'user_1',
    date: new Date(),
    sleepHours: 7.5,
    sleepQuality: 8,
    stressLevel: 4,
    proteinIntake: 150,
    calorieIntake: 2500,
    waterIntake: 2.5,
    mood: 'Good',
    energyLevel: 7,
    soreness: 2,
    injuryPain: 0,
    formScore: 85,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

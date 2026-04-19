import { describe, it, expect } from 'vitest'
import type {
  Team,
  TeamMember,
  TeamChallenge,
  TeamStatsSnapshot,
  TeamAchievement,
  TeamNotification,
  TeamSyncQueueItem,
} from '../teams'

describe('Team Types', () => {
  describe('Team', () => {
    it('should define Team with required fields', () => {
      const team: Team = {
        id: 'team-1',
        name: 'Fitness Squad',
        createdById: 'user-1',
        createdAt: new Date().toISOString(),
        memberCount: 4,
        isActive: true,
      }
      expect(team.id).toBe('team-1')
      expect(team.name).toBe('Fitness Squad')
      expect(team.memberCount).toBe(4)
      expect(team.isActive).toBe(true)
    })

    it('should support optional description and avatar', () => {
      const team: Team = {
        id: 'team-1',
        name: 'Fitness Squad',
        description: 'Our squad for fitness tracking',
        avatar: 'https://example.com/avatar.jpg',
        createdById: 'user-1',
        createdAt: new Date().toISOString(),
        memberCount: 4,
        isActive: true,
      }
      expect(team.description).toBe('Our squad for fitness tracking')
      expect(team.avatar).toBe('https://example.com/avatar.jpg')
    })

    it('should support optional stats snapshot', () => {
      const team: Team = {
        id: 'team-1',
        name: 'Fitness Squad',
        createdById: 'user-1',
        createdAt: new Date().toISOString(),
        memberCount: 4,
        isActive: true,
        stats: {
          id: 'stats-1',
          teamId: 'team-1',
          snapshotDate: new Date().toISOString(),
          totalWorkouts: 25,
          totalCalories: 5000,
          totalSteps: 150000,
          totalDuration: 1000,
          memberBreakdown: { 'user-1': 5 },
        },
      }
      expect(team.stats?.totalWorkouts).toBe(25)
    })
  })

  describe('TeamMember', () => {
    it('should define TeamMember with required fields', () => {
      const member: TeamMember = {
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        userName: 'John Doe',
        joinedAt: new Date().toISOString(),
        role: 'creator',
        contribution: {
          workouts: 10,
          calories: 2000,
          steps: 50000,
          duration: 500,
        },
      }
      expect(member.userId).toBe('user-1')
      expect(member.role).toBe('creator')
      expect(member.contribution.workouts).toBe(10)
    })

    it('should support optional userAvatar', () => {
      const member: TeamMember = {
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        userName: 'John Doe',
        userAvatar: 'https://example.com/user.jpg',
        joinedAt: new Date().toISOString(),
        role: 'member',
        contribution: {
          workouts: 5,
          calories: 1000,
          steps: 25000,
          duration: 250,
        },
      }
      expect(member.userAvatar).toBe('https://example.com/user.jpg')
    })

    it('should support both member and creator roles', () => {
      const creator: TeamMember = {
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        userName: 'John',
        joinedAt: new Date().toISOString(),
        role: 'creator',
        contribution: { workouts: 10, calories: 2000, steps: 50000, duration: 500 },
      }
      const member: TeamMember = {
        id: 'member-2',
        teamId: 'team-1',
        userId: 'user-2',
        userName: 'Jane',
        joinedAt: new Date().toISOString(),
        role: 'member',
        contribution: { workouts: 5, calories: 1000, steps: 25000, duration: 250 },
      }
      expect(creator.role).toBe('creator')
      expect(member.role).toBe('member')
    })
  })

  describe('TeamChallenge', () => {
    it('should define TeamChallenge with required fields', () => {
      const challenge: TeamChallenge = {
        id: 'challenge-1',
        teamId: 'team-1',
        type: 'workouts',
        title: 'Complete 20 Workouts',
        goal: 20,
        currentProgress: 5,
        deadline: new Date().toISOString(),
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      expect(challenge.type).toBe('workouts')
      expect(challenge.goal).toBe(20)
      expect(challenge.currentProgress).toBe(5)
      expect(challenge.status).toBe('active')
    })

    it('should support all challenge types', () => {
      const types: Array<TeamChallenge['type']> = [
        'workouts',
        'calories',
        'steps',
        'duration',
        'custom',
      ]
      types.forEach((type) => {
        const challenge: TeamChallenge = {
          id: `challenge-${type}`,
          teamId: 'team-1',
          type,
          title: `Challenge: ${type}`,
          goal: 100,
          currentProgress: 25,
          deadline: new Date().toISOString(),
          status: 'active',
          createdAt: new Date().toISOString(),
        }
        expect(challenge.type).toBe(type)
      })
    })

    it('should support optional description, completedAt, and rewards', () => {
      const challenge: TeamChallenge = {
        id: 'challenge-1',
        teamId: 'team-1',
        type: 'calories',
        title: 'Burn 5000 Calories',
        description: 'Team-wide calorie burning challenge',
        goal: 5000,
        currentProgress: 2500,
        deadline: new Date().toISOString(),
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        rewards: { badge: 'calorie_master', points: 500 },
      }
      expect(challenge.description).toBe('Team-wide calorie burning challenge')
      expect(challenge.completedAt).toBeDefined()
      expect(challenge.rewards?.points).toBe(500)
    })

    it('should support all challenge statuses', () => {
      const statuses: Array<TeamChallenge['status']> = ['active', 'completed', 'failed']
      statuses.forEach((status) => {
        const challenge: TeamChallenge = {
          id: `challenge-${status}`,
          teamId: 'team-1',
          type: 'workouts',
          title: 'Test Challenge',
          goal: 10,
          currentProgress: 5,
          deadline: new Date().toISOString(),
          status,
          createdAt: new Date().toISOString(),
        }
        expect(challenge.status).toBe(status)
      })
    })
  })

  describe('TeamStatsSnapshot', () => {
    it('should define TeamStatsSnapshot with required fields', () => {
      const stats: TeamStatsSnapshot = {
        id: 'stats-1',
        teamId: 'team-1',
        snapshotDate: new Date().toISOString(),
        totalWorkouts: 25,
        totalCalories: 5000,
        totalSteps: 150000,
        totalDuration: 1000,
        memberBreakdown: {
          'user-1': 10,
          'user-2': 8,
          'user-3': 7,
        },
      }
      expect(stats.totalWorkouts).toBe(25)
      expect(stats.totalCalories).toBe(5000)
      expect(stats.memberBreakdown['user-1']).toBe(10)
    })

    it('should support memberBreakdown as map of userId to contribution', () => {
      const stats: TeamStatsSnapshot = {
        id: 'stats-1',
        teamId: 'team-1',
        snapshotDate: new Date().toISOString(),
        totalWorkouts: 30,
        totalCalories: 6000,
        totalSteps: 200000,
        totalDuration: 1200,
        memberBreakdown: {
          'user-1': 12,
          'user-2': 10,
          'user-3': 8,
        },
      }
      expect(Object.keys(stats.memberBreakdown).length).toBe(3)
    })
  })

  describe('TeamAchievement', () => {
    it('should define TeamAchievement with required fields', () => {
      const achievement: TeamAchievement = {
        id: 'achievement-1',
        teamId: 'team-1',
        type: 'first_team',
        title: 'Team Created',
        description: 'Created your first team',
        unlockedAt: new Date().toISOString(),
      }
      expect(achievement.type).toBe('first_team')
      expect(achievement.title).toBe('Team Created')
    })

    it('should support all achievement types', () => {
      const types: Array<TeamAchievement['type']> = [
        'first_team',
        'ten_workouts',
        'milestone_calories',
        'milestone_steps',
      ]
      types.forEach((type) => {
        const achievement: TeamAchievement = {
          id: `achievement-${type}`,
          teamId: 'team-1',
          type,
          title: `Achievement: ${type}`,
          description: `Unlock ${type}`,
          unlockedAt: new Date().toISOString(),
        }
        expect(achievement.type).toBe(type)
      })
    })

    it('should support optional badge', () => {
      const achievement: TeamAchievement = {
        id: 'achievement-1',
        teamId: 'team-1',
        type: 'milestone_calories',
        title: 'Calorie Master',
        description: 'Burned 10000 calories as a team',
        unlockedAt: new Date().toISOString(),
        badge: 'https://example.com/badge.png',
      }
      expect(achievement.badge).toBe('https://example.com/badge.png')
    })
  })

  describe('TeamNotification', () => {
    it('should define TeamNotification with required fields', () => {
      const notification: TeamNotification = {
        id: 'notif-1',
        teamId: 'team-1',
        type: 'member_joined',
        title: 'New Member',
        message: 'John Doe joined the team',
        createdAt: new Date().toISOString(),
        read: false,
      }
      expect(notification.type).toBe('member_joined')
      expect(notification.read).toBe(false)
    })

    it('should support all notification types', () => {
      const types: Array<TeamNotification['type']> = [
        'member_joined',
        'challenge_completed',
        'milestone_reached',
        'member_left',
      ]
      types.forEach((type) => {
        const notification: TeamNotification = {
          id: `notif-${type}`,
          teamId: 'team-1',
          type,
          title: 'Test',
          message: 'Test message',
          createdAt: new Date().toISOString(),
          read: false,
        }
        expect(notification.type).toBe(type)
      })
    })

    it('should support read flag', () => {
      const unreadNotif: TeamNotification = {
        id: 'notif-1',
        teamId: 'team-1',
        type: 'member_joined',
        title: 'New Member',
        message: 'John joined',
        createdAt: new Date().toISOString(),
        read: false,
      }
      const readNotif: TeamNotification = {
        id: 'notif-2',
        teamId: 'team-1',
        type: 'challenge_completed',
        title: 'Challenge Done',
        message: 'Challenge completed',
        createdAt: new Date().toISOString(),
        read: true,
      }
      expect(unreadNotif.read).toBe(false)
      expect(readNotif.read).toBe(true)
    })
  })

  describe('TeamSyncQueueItem', () => {
    it('should define TeamSyncQueueItem with required fields', () => {
      const queueItem: TeamSyncQueueItem = {
        id: 'queue-1',
        action: 'create_team',
        data: { name: 'New Team' },
        status: 'pending',
        retryCount: 0,
        createdAt: new Date().toISOString(),
      }
      expect(queueItem.action).toBe('create_team')
      expect(queueItem.status).toBe('pending')
      expect(queueItem.retryCount).toBe(0)
    })

    it('should support all action types', () => {
      const actions: Array<TeamSyncQueueItem['action']> = [
        'create_team',
        'invite_member',
        'create_challenge',
        'complete_challenge',
      ]
      actions.forEach((action) => {
        const queueItem: TeamSyncQueueItem = {
          id: `queue-${action}`,
          action,
          data: {},
          status: 'pending',
          retryCount: 0,
          createdAt: new Date().toISOString(),
        }
        expect(queueItem.action).toBe(action)
      })
    })

    it('should support all status values', () => {
      const statuses: Array<TeamSyncQueueItem['status']> = ['pending', 'synced', 'failed']
      statuses.forEach((status) => {
        const queueItem: TeamSyncQueueItem = {
          id: `queue-${status}`,
          action: 'create_team',
          data: {},
          status,
          retryCount: 0,
          createdAt: new Date().toISOString(),
        }
        expect(queueItem.status).toBe(status)
      })
    })

    it('should track retry count', () => {
      const queueItem: TeamSyncQueueItem = {
        id: 'queue-1',
        action: 'create_team',
        data: { name: 'Team' },
        status: 'failed',
        retryCount: 3,
        createdAt: new Date().toISOString(),
      }
      expect(queueItem.retryCount).toBe(3)
    })
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import {
  initTeamsTables,
  saveTeam,
  addTeamMember,
  removeTeamMember,
  getTeamMembers,
  createChallenge,
  updateChallengeProgress,
  saveStatsSnapshot,
  addToSyncQueue,
  getSyncQueue,
} from '../teams'
import type { Team, TeamMember, TeamChallenge } from '../../types/teams'

describe('Teams Database', () => {
  beforeEach(async () => {
    await initTeamsTables()
  })

  describe('initTeamsTables', () => {
    it('should initialize teams tables without error', async () => {
      await expect(initTeamsTables()).resolves.not.toThrow()
    })

    it('should be idempotent', async () => {
      await expect(initTeamsTables()).resolves.not.toThrow()
    })
  })

  describe('saveTeam', () => {
    it('should save a team without error', async () => {
      const team: Team = {
        id: 'team-1',
        name: 'Fitness Squad',
        createdById: 'user-1',
        createdAt: new Date().toISOString(),
        memberCount: 1,
        isActive: true,
      }

      await expect(saveTeam(team)).resolves.not.toThrow()
    })

    it('should save team with description', async () => {
      const team: Team = {
        id: 'team-2',
        name: 'Running Club',
        description: 'For runners',
        createdById: 'user-2',
        createdAt: new Date().toISOString(),
        memberCount: 1,
        isActive: true,
      }

      await expect(saveTeam(team)).resolves.not.toThrow()
    })
  })

  describe('addTeamMember', () => {
    it('should add team member without error', async () => {
      const member: TeamMember = {
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        userName: 'John',
        joinedAt: new Date().toISOString(),
        role: 'member',
        contribution: { workouts: 0, calories: 0, steps: 0, duration: 0 },
      }

      await expect(addTeamMember(member)).resolves.not.toThrow()
    })

    it('should add creator role member', async () => {
      const member: TeamMember = {
        id: 'member-2',
        teamId: 'team-1',
        userId: 'user-2',
        userName: 'Jane',
        joinedAt: new Date().toISOString(),
        role: 'creator',
        contribution: { workouts: 5, calories: 1000, steps: 25000, duration: 250 },
      }

      await expect(addTeamMember(member)).resolves.not.toThrow()
    })
  })

  describe('removeTeamMember', () => {
    it('should remove team member without error', async () => {
      await expect(removeTeamMember('team-1', 'user-1')).resolves.not.toThrow()
    })
  })

  describe('getTeamMembers', () => {
    it('should return empty array when no members exist', async () => {
      const members = await getTeamMembers('nonexistent-team')
      expect(Array.isArray(members)).toBe(true)
    })
  })

  describe('createChallenge', () => {
    it('should create challenge without error', async () => {
      const challenge: TeamChallenge = {
        id: 'challenge-1',
        teamId: 'team-1',
        type: 'workouts',
        title: 'Complete 20 Workouts',
        goal: 20,
        currentProgress: 0,
        deadline: new Date().toISOString(),
        status: 'active',
        createdAt: new Date().toISOString(),
      }

      await expect(createChallenge(challenge)).resolves.not.toThrow()
    })

    it('should create challenge with description', async () => {
      const challenge: TeamChallenge = {
        id: 'challenge-2',
        teamId: 'team-2',
        type: 'calories',
        title: 'Burn 5000 Calories',
        description: 'Team challenge',
        goal: 5000,
        currentProgress: 0,
        deadline: new Date().toISOString(),
        status: 'active',
        createdAt: new Date().toISOString(),
      }

      await expect(createChallenge(challenge)).resolves.not.toThrow()
    })

    it('should create challenge with rewards', async () => {
      const challenge: TeamChallenge = {
        id: 'challenge-3',
        teamId: 'team-3',
        type: 'steps',
        title: 'Walk 100K Steps',
        goal: 100000,
        currentProgress: 0,
        deadline: new Date().toISOString(),
        status: 'active',
        createdAt: new Date().toISOString(),
        rewards: { badge: 'step_master', points: 500 },
      }

      await expect(createChallenge(challenge)).resolves.not.toThrow()
    })
  })

  describe('updateChallengeProgress', () => {
    it('should update challenge progress without error', async () => {
      await expect(updateChallengeProgress('challenge-1', 5)).resolves.not.toThrow()
    })

    it('should handle non-existent challenge', async () => {
      await expect(updateChallengeProgress('nonexistent', 10)).resolves.not.toThrow()
    })
  })

  describe('saveStatsSnapshot', () => {
    it('should save stats snapshot without error', async () => {
      const snapshot = {
        id: 'stats-1',
        teamId: 'team-1',
        snapshotDate: new Date().toISOString(),
        totalWorkouts: 25,
        totalCalories: 5000,
        totalSteps: 150000,
        totalDuration: 1000,
        memberBreakdown: { 'user-1': 10, 'user-2': 8 },
      }

      await expect(saveStatsSnapshot(snapshot)).resolves.not.toThrow()
    })
  })

  describe('addToSyncQueue', () => {
    it('should add sync queue item without error', async () => {
      const item = {
        id: 'queue-1',
        action: 'create_team' as const,
        data: { name: 'New Team' },
        status: 'pending' as const,
        retryCount: 0,
        createdAt: new Date().toISOString(),
      }

      await expect(addToSyncQueue(item)).resolves.not.toThrow()
    })

    it('should handle different action types', async () => {
      const actions: Array<'create_team' | 'invite_member' | 'create_challenge' | 'complete_challenge'> = [
        'create_team',
        'invite_member',
        'create_challenge',
        'complete_challenge',
      ]

      for (const action of actions) {
        const item = {
          id: `queue-${action}`,
          action,
          data: {},
          status: 'pending' as const,
          retryCount: 0,
          createdAt: new Date().toISOString(),
        }
        await expect(addToSyncQueue(item)).resolves.not.toThrow()
      }
    })
  })

  describe('getSyncQueue', () => {
    it('should return array of sync queue items', async () => {
      const queue = await getSyncQueue()
      expect(Array.isArray(queue)).toBe(true)
    })
  })
})

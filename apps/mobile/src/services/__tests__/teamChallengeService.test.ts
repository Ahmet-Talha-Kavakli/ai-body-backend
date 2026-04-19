import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as teamChallengeService from '../teamChallengeService'
import teamsClient from '../../api/teamsClient'
import type { TeamChallenge } from '../../types/teams'

vi.mock('../../api/teamsClient')

describe('teamChallengeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createChallenge', () => {
    it('should create a team challenge', async () => {
      const mockChallenge: TeamChallenge = {
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

      vi.spyOn(teamsClient.challenges, 'create').mockResolvedValueOnce({ data: mockChallenge })

      const result = await teamChallengeService.createChallenge(
        'team-1',
        'workouts',
        20,
        new Date().toISOString()
      )

      expect(result).toEqual(mockChallenge)
      expect(teamsClient.challenges.create).toHaveBeenCalledWith('team-1', {
        type: 'workouts',
        goal: 20,
        deadline: expect.any(String),
      })
    })

    it('should create challenge with optional description', async () => {
      const mockChallenge: TeamChallenge = {
        id: 'challenge-1',
        teamId: 'team-1',
        type: 'calories',
        title: 'Burn 5000 Calories',
        description: 'Team challenge',
        goal: 5000,
        currentProgress: 0,
        deadline: new Date().toISOString(),
        status: 'active',
        createdAt: new Date().toISOString(),
      }

      vi.spyOn(teamsClient.challenges, 'create').mockResolvedValueOnce({ data: mockChallenge })

      const result = await teamChallengeService.createChallenge(
        'team-1',
        'calories',
        5000,
        new Date().toISOString(),
        'Burn 5000 Calories',
        'Team challenge'
      )

      expect(result.description).toBe('Team challenge')
    })
  })

  describe('getChallenges', () => {
    it('should fetch all team challenges', async () => {
      const mockChallenges: TeamChallenge[] = [
        {
          id: 'challenge-1',
          teamId: 'team-1',
          type: 'workouts',
          title: 'Complete 20 Workouts',
          goal: 20,
          currentProgress: 5,
          deadline: new Date().toISOString(),
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'challenge-2',
          teamId: 'team-1',
          type: 'calories',
          title: 'Burn 5000 Calories',
          goal: 5000,
          currentProgress: 1500,
          deadline: new Date().toISOString(),
          status: 'active',
          createdAt: new Date().toISOString(),
        },
      ]

      vi.spyOn(teamsClient.challenges, 'list').mockResolvedValueOnce({ data: mockChallenges })

      const result = await teamChallengeService.getChallenges('team-1')

      expect(result).toEqual(mockChallenges)
      expect(result.length).toBe(2)
      expect(teamsClient.challenges.list).toHaveBeenCalledWith('team-1')
    })

    it('should return empty array when no challenges exist', async () => {
      vi.spyOn(teamsClient.challenges, 'list').mockResolvedValueOnce({ data: [] })

      const result = await teamChallengeService.getChallenges('team-1')

      expect(result).toEqual([])
    })
  })

  describe('updateChallengeProgress', () => {
    it('should update challenge progress', async () => {
      const mockChallenge: TeamChallenge = {
        id: 'challenge-1',
        teamId: 'team-1',
        type: 'workouts',
        title: 'Complete 20 Workouts',
        goal: 20,
        currentProgress: 10,
        deadline: new Date().toISOString(),
        status: 'active',
        createdAt: new Date().toISOString(),
      }

      vi.spyOn(teamsClient.challenges, 'updateProgress').mockResolvedValueOnce({
        data: mockChallenge,
      })

      const result = await teamChallengeService.updateChallengeProgress('challenge-1')

      expect(result).toEqual(mockChallenge)
      expect(teamsClient.challenges.updateProgress).toHaveBeenCalledWith('challenge-1')
    })
  })

  describe('completeChallenge', () => {
    it('should mark challenge as completed', async () => {
      const mockChallenge: TeamChallenge = {
        id: 'challenge-1',
        teamId: 'team-1',
        type: 'workouts',
        title: 'Complete 20 Workouts',
        goal: 20,
        currentProgress: 20,
        deadline: new Date().toISOString(),
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        rewards: { points: 500 },
      }

      vi.spyOn(teamsClient.challenges, 'complete').mockResolvedValueOnce({ data: mockChallenge })

      const result = await teamChallengeService.completeChallenge('challenge-1')

      expect(result.status).toBe('completed')
      expect(result.completedAt).toBeDefined()
      expect(teamsClient.challenges.complete).toHaveBeenCalledWith('challenge-1')
    })
  })

  describe('deleteChallenge', () => {
    it('should delete a challenge', async () => {
      vi.spyOn(teamsClient.challenges, 'delete').mockResolvedValueOnce({})

      await teamChallengeService.deleteChallenge('challenge-1')

      expect(teamsClient.challenges.delete).toHaveBeenCalledWith('challenge-1')
    })
  })

  describe('exported functions', () => {
    it('should export all challenge functions', () => {
      expect(typeof teamChallengeService.createChallenge).toBe('function')
      expect(typeof teamChallengeService.getChallenges).toBe('function')
      expect(typeof teamChallengeService.updateChallengeProgress).toBe('function')
      expect(typeof teamChallengeService.completeChallenge).toBe('function')
      expect(typeof teamChallengeService.deleteChallenge).toBe('function')
    })
  })
})

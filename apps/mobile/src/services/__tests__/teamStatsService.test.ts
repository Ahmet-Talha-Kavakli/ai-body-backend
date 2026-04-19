import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as teamStatsService from '../teamStatsService'
import teamsClient from '../../api/teamsClient'
import type { TeamStatsSnapshot } from '../../types/teams'

vi.mock('../../api/teamsClient')

describe('teamStatsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('aggregateTeamStats', () => {
    it('should aggregate team stats from all members', async () => {
      const mockStats: TeamStatsSnapshot = {
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

      vi.spyOn(teamsClient.stats, 'aggregate').mockResolvedValueOnce({ data: mockStats })

      const result = await teamStatsService.aggregateTeamStats('team-1')

      expect(result).toEqual(mockStats)
      expect(result.totalWorkouts).toBe(25)
      expect(result.totalCalories).toBe(5000)
      expect(teamsClient.stats.aggregate).toHaveBeenCalledWith('team-1')
    })
  })

  describe('calculateMemberContribution', () => {
    it('should calculate individual member contribution', async () => {
      const contribution = {
        workouts: 10,
        calories: 2000,
        steps: 50000,
        duration: 500,
      }

      vi.spyOn(teamsClient.stats, 'memberContribution').mockResolvedValueOnce({
        data: contribution,
      })

      const result = await teamStatsService.calculateMemberContribution('team-1', 'user-1')

      expect(result).toEqual(contribution)
      expect(result.workouts).toBe(10)
      expect(teamsClient.stats.memberContribution).toHaveBeenCalledWith('team-1', 'user-1')
    })
  })

  describe('getTeamLeaderboard', () => {
    it('should get team leaderboard ranked by contribution', async () => {
      const mockLeaderboard = [
        {
          userId: 'user-1',
          userName: 'John',
          workouts: 15,
          calories: 3000,
          steps: 75000,
          duration: 750,
          rank: 1,
        },
        {
          userId: 'user-2',
          userName: 'Jane',
          workouts: 10,
          calories: 2000,
          steps: 50000,
          duration: 500,
          rank: 2,
        },
      ]

      vi.spyOn(teamsClient.stats, 'leaderboard').mockResolvedValueOnce({ data: mockLeaderboard })

      const result = await teamStatsService.getTeamLeaderboard('team-1')

      expect(result).toEqual(mockLeaderboard)
      expect(result.length).toBe(2)
      expect(result[0].rank).toBe(1)
      expect(teamsClient.stats.leaderboard).toHaveBeenCalledWith('team-1')
    })
  })

  describe('saveTeamStatsSnapshot', () => {
    it('should save daily stats snapshot', async () => {
      const mockSnapshot: TeamStatsSnapshot = {
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

      vi.spyOn(teamsClient.stats, 'saveSnapshot').mockResolvedValueOnce({ data: mockSnapshot })

      const result = await teamStatsService.saveTeamStatsSnapshot('team-1')

      expect(result).toEqual(mockSnapshot)
      expect(teamsClient.stats.saveSnapshot).toHaveBeenCalledWith('team-1')
    })
  })

  describe('exported functions', () => {
    it('should export all stats functions', () => {
      expect(typeof teamStatsService.aggregateTeamStats).toBe('function')
      expect(typeof teamStatsService.calculateMemberContribution).toBe('function')
      expect(typeof teamStatsService.getTeamLeaderboard).toBe('function')
      expect(typeof teamStatsService.saveTeamStatsSnapshot).toBe('function')
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as teamService from '../teamService'
import teamsClient from '../../api/teamsClient'
import type { Team, TeamMember } from '../../types/teams'

// Mock the client
vi.mock('../../api/teamsClient')

describe('teamService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createTeam', () => {
    it('should create a team with name and optional description', async () => {
      const mockTeam: Team = {
        id: 'team-1',
        name: 'Fitness Squad',
        description: 'Our fitness team',
        createdById: 'user-1',
        createdAt: new Date().toISOString(),
        memberCount: 1,
        isActive: true,
      }

      vi.spyOn(teamsClient.teams, 'create').mockResolvedValueOnce({ data: mockTeam })

      const result = await teamService.createTeam('Fitness Squad', 'Our fitness team')

      expect(result).toEqual(mockTeam)
      expect(teamsClient.teams.create).toHaveBeenCalledWith({
        name: 'Fitness Squad',
        description: 'Our fitness team',
      })
    })

    it('should create a team with name only', async () => {
      const mockTeam: Team = {
        id: 'team-1',
        name: 'Fitness Squad',
        createdById: 'user-1',
        createdAt: new Date().toISOString(),
        memberCount: 1,
        isActive: true,
      }

      vi.spyOn(teamsClient.teams, 'create').mockResolvedValueOnce({ data: mockTeam })

      const result = await teamService.createTeam('Fitness Squad')

      expect(result).toEqual(mockTeam)
      expect(teamsClient.teams.create).toHaveBeenCalledWith({
        name: 'Fitness Squad',
      })
    })
  })

  describe('getTeams', () => {
    it('should fetch user teams', async () => {
      const mockTeams: Team[] = [
        {
          id: 'team-1',
          name: 'Fitness Squad',
          createdById: 'user-1',
          createdAt: new Date().toISOString(),
          memberCount: 4,
          isActive: true,
        },
        {
          id: 'team-2',
          name: 'Running Club',
          createdById: 'user-2',
          createdAt: new Date().toISOString(),
          memberCount: 8,
          isActive: true,
        },
      ]

      vi.spyOn(teamsClient.teams, 'list').mockResolvedValueOnce({ data: mockTeams })

      const result = await teamService.getTeams()

      expect(result).toEqual(mockTeams)
      expect(result.length).toBe(2)
      expect(teamsClient.teams.list).toHaveBeenCalled()
    })

    it('should return empty array when user has no teams', async () => {
      vi.spyOn(teamsClient.teams, 'list').mockResolvedValueOnce({ data: [] })

      const result = await teamService.getTeams()

      expect(result).toEqual([])
    })
  })

  describe('joinTeam', () => {
    it('should join an existing team', async () => {
      const mockMember: TeamMember = {
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        userName: 'John Doe',
        joinedAt: new Date().toISOString(),
        role: 'member',
        contribution: { workouts: 0, calories: 0, steps: 0, duration: 0 },
      }

      vi.spyOn(teamsClient.teams, 'join').mockResolvedValueOnce({ data: mockMember })

      const result = await teamService.joinTeam('team-1')

      expect(result).toEqual(mockMember)
      expect(teamsClient.teams.join).toHaveBeenCalledWith('team-1')
    })
  })

  describe('leaveTeam', () => {
    it('should leave a team', async () => {
      vi.spyOn(teamsClient.teams, 'leave').mockResolvedValueOnce({})

      await teamService.leaveTeam('team-1')

      expect(teamsClient.teams.leave).toHaveBeenCalledWith('team-1')
    })
  })

  describe('deleteTeam', () => {
    it('should delete a team (creator only)', async () => {
      vi.spyOn(teamsClient.teams, 'delete').mockResolvedValueOnce({})

      await teamService.deleteTeam('team-1')

      expect(teamsClient.teams.delete).toHaveBeenCalledWith('team-1')
    })
  })

  describe('updateTeam', () => {
    it('should update team name and description', async () => {
      const mockTeam: Team = {
        id: 'team-1',
        name: 'Updated Team',
        description: 'Updated description',
        createdById: 'user-1',
        createdAt: new Date().toISOString(),
        memberCount: 4,
        isActive: true,
      }

      vi.spyOn(teamsClient.teams, 'update').mockResolvedValueOnce({ data: mockTeam })

      const result = await teamService.updateTeam('team-1', 'Updated Team', 'Updated description')

      expect(result).toEqual(mockTeam)
      expect(teamsClient.teams.update).toHaveBeenCalledWith('team-1', {
        name: 'Updated Team',
        description: 'Updated description',
      })
    })

    it('should update team with name only', async () => {
      const mockTeam: Team = {
        id: 'team-1',
        name: 'Updated Team',
        createdById: 'user-1',
        createdAt: new Date().toISOString(),
        memberCount: 4,
        isActive: true,
      }

      vi.spyOn(teamsClient.teams, 'update').mockResolvedValueOnce({ data: mockTeam })

      const result = await teamService.updateTeam('team-1', 'Updated Team')

      expect(result).toEqual(mockTeam)
    })
  })

  describe('inviteMember', () => {
    it('should send an invite to a user', async () => {
      vi.spyOn(teamsClient.teams, 'invite').mockResolvedValueOnce({})

      await teamService.inviteMember('team-1', 'user-2')

      expect(teamsClient.teams.invite).toHaveBeenCalledWith('team-1', { userId: 'user-2' })
    })
  })

  describe('acceptInvite', () => {
    it('should accept a team invite', async () => {
      const mockMember: TeamMember = {
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        userName: 'John Doe',
        joinedAt: new Date().toISOString(),
        role: 'member',
        contribution: { workouts: 0, calories: 0, steps: 0, duration: 0 },
      }

      vi.spyOn(teamsClient.invites, 'accept').mockResolvedValueOnce({ data: mockMember })

      const result = await teamService.acceptInvite('invite-1')

      expect(result).toEqual(mockMember)
      expect(teamsClient.invites.accept).toHaveBeenCalledWith('invite-1')
    })
  })

  describe('removeTeamMember', () => {
    it('should remove a team member', async () => {
      vi.spyOn(teamsClient.teams, 'removeMember').mockResolvedValueOnce({})

      await teamService.removeTeamMember('team-1', 'user-2')

      expect(teamsClient.teams.removeMember).toHaveBeenCalledWith('team-1', 'user-2')
    })
  })

  describe('exported functions', () => {
    it('should export all functions', () => {
      expect(typeof teamService.createTeam).toBe('function')
      expect(typeof teamService.getTeams).toBe('function')
      expect(typeof teamService.joinTeam).toBe('function')
      expect(typeof teamService.leaveTeam).toBe('function')
      expect(typeof teamService.deleteTeam).toBe('function')
      expect(typeof teamService.updateTeam).toBe('function')
      expect(typeof teamService.inviteMember).toBe('function')
      expect(typeof teamService.acceptInvite).toBe('function')
      expect(typeof teamService.removeTeamMember).toBe('function')
    })
  })
})

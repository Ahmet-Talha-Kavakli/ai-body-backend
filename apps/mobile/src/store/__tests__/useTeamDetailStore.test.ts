import { describe, it, expect, beforeEach } from 'vitest'
import { useTeamDetailStore } from '../useTeamDetailStore'
import type { Team, TeamMember, TeamStatsSnapshot, TeamChallenge } from '../../types/teams'

describe('useTeamDetailStore', () => {
  beforeEach(() => {
    useTeamDetailStore.setState({
      currentTeam: null,
      members: [],
      stats: null,
      challenges: [],
    })
  })

  describe('initial state', () => {
    it('should initialize with no current team', () => {
      const { currentTeam } = useTeamDetailStore.getState()
      expect(currentTeam).toBeNull()
    })

    it('should initialize with empty members', () => {
      const { members } = useTeamDetailStore.getState()
      expect(members).toEqual([])
    })

    it('should initialize with no stats', () => {
      const { stats } = useTeamDetailStore.getState()
      expect(stats).toBeNull()
    })

    it('should initialize with empty challenges', () => {
      const { challenges } = useTeamDetailStore.getState()
      expect(challenges).toEqual([])
    })
  })

  describe('current team operations', () => {
    const mockTeam: Team = {
      id: 'team1',
      name: 'Fitness Warriors',
      description: 'Team for fitness enthusiasts',
      avatar: 'avatar1.png',
      createdById: 'user1',
      createdAt: '2024-01-01T00:00:00Z',
      memberCount: 5,
      isActive: true,
    }

    it('should set current team', () => {
      useTeamDetailStore.getState().setCurrentTeam(mockTeam)
      expect(useTeamDetailStore.getState().currentTeam).toEqual(mockTeam)
    })

    it('should replace current team when setting new one', () => {
      useTeamDetailStore.getState().setCurrentTeam(mockTeam)
      const team2: Team = { ...mockTeam, id: 'team2', name: 'Running Club' }
      useTeamDetailStore.getState().setCurrentTeam(team2)
      expect(useTeamDetailStore.getState().currentTeam?.id).toBe('team2')
      expect(useTeamDetailStore.getState().currentTeam?.name).toBe('Running Club')
    })
  })

  describe('member operations', () => {
    const mockMember: TeamMember = {
      id: 'member1',
      teamId: 'team1',
      userId: 'user1',
      userName: 'John Doe',
      userAvatar: 'avatar1.png',
      joinedAt: '2024-01-01T00:00:00Z',
      role: 'member',
      contribution: {
        workouts: 10,
        calories: 5000,
        steps: 50000,
        duration: 300,
      },
    }

    it('should set members list', () => {
      useTeamDetailStore.getState().setMembers([mockMember])
      expect(useTeamDetailStore.getState().members).toEqual([mockMember])
    })

    it('should add member to list', () => {
      useTeamDetailStore.getState().addMember(mockMember)
      expect(useTeamDetailStore.getState().members).toHaveLength(1)
      expect(useTeamDetailStore.getState().members[0]).toEqual(mockMember)
    })

    it('should add multiple members', () => {
      const member2: TeamMember = {
        ...mockMember,
        id: 'member2',
        userId: 'user2',
        userName: 'Jane Smith',
      }
      useTeamDetailStore.getState().addMember(mockMember)
      useTeamDetailStore.getState().addMember(member2)
      expect(useTeamDetailStore.getState().members).toHaveLength(2)
    })

    it('should remove member by user id', () => {
      useTeamDetailStore.getState().addMember(mockMember)
      useTeamDetailStore.getState().removeMember('user1')
      expect(useTeamDetailStore.getState().members).toHaveLength(0)
    })

    it('should preserve other members when removing one', () => {
      const member2: TeamMember = {
        ...mockMember,
        id: 'member2',
        userId: 'user2',
        userName: 'Jane Smith',
      }
      useTeamDetailStore.getState().addMember(mockMember)
      useTeamDetailStore.getState().addMember(member2)
      useTeamDetailStore.getState().removeMember('user1')
      expect(useTeamDetailStore.getState().members).toHaveLength(1)
      expect(useTeamDetailStore.getState().members[0].userId).toBe('user2')
    })

    it('should not error when removing non-existent member', () => {
      useTeamDetailStore.getState().addMember(mockMember)
      expect(() => {
        useTeamDetailStore.getState().removeMember('nonexistent')
      }).not.toThrow()
      expect(useTeamDetailStore.getState().members).toHaveLength(1)
    })

    it('should update member contribution', () => {
      useTeamDetailStore.getState().addMember(mockMember)
      useTeamDetailStore.getState().updateMemberContribution('user1', {
        workouts: 15,
        calories: 7000,
      })
      const member = useTeamDetailStore.getState().members[0]
      expect(member.contribution.workouts).toBe(15)
      expect(member.contribution.calories).toBe(7000)
      // Other fields should remain unchanged
      expect(member.contribution.steps).toBe(50000)
      expect(member.contribution.duration).toBe(300)
    })

    it('should handle updating non-existent member contribution', () => {
      useTeamDetailStore.getState().addMember(mockMember)
      expect(() => {
        useTeamDetailStore.getState().updateMemberContribution('nonexistent', {
          workouts: 20,
        })
      }).not.toThrow()
      expect(useTeamDetailStore.getState().members).toHaveLength(1)
    })
  })

  describe('stats operations', () => {
    const mockStats: TeamStatsSnapshot = {
      id: 'stats1',
      teamId: 'team1',
      snapshotDate: '2024-01-01T00:00:00Z',
      totalWorkouts: 50,
      totalCalories: 25000,
      totalSteps: 250000,
      totalDuration: 1500,
      memberBreakdown: {
        user1: 100,
        user2: 120,
      },
    }

    it('should set stats', () => {
      useTeamDetailStore.getState().setStats(mockStats)
      expect(useTeamDetailStore.getState().stats).toEqual(mockStats)
    })

    it('should replace stats when setting new ones', () => {
      useTeamDetailStore.getState().setStats(mockStats)
      const newStats: TeamStatsSnapshot = {
        ...mockStats,
        totalWorkouts: 100,
        totalCalories: 50000,
      }
      useTeamDetailStore.getState().setStats(newStats)
      expect(useTeamDetailStore.getState().stats?.totalWorkouts).toBe(100)
      expect(useTeamDetailStore.getState().stats?.totalCalories).toBe(50000)
    })
  })

  describe('challenges operations', () => {
    const mockChallenge: TeamChallenge = {
      id: 'challenge1',
      teamId: 'team1',
      type: 'workouts',
      title: 'Complete 10 Workouts',
      description: 'Complete 10 workouts as a team',
      goal: 10,
      currentProgress: 5,
      deadline: '2024-02-01T00:00:00Z',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      rewards: {
        badge: 'workout_champion',
        points: 100,
      },
    }

    it('should set challenges list', () => {
      useTeamDetailStore.getState().setChallenges([mockChallenge])
      expect(useTeamDetailStore.getState().challenges).toEqual([mockChallenge])
    })

    it('should replace challenges when setting new list', () => {
      useTeamDetailStore.getState().setChallenges([mockChallenge])
      const challenge2: TeamChallenge = {
        ...mockChallenge,
        id: 'challenge2',
        type: 'calories',
      }
      useTeamDetailStore.getState().setChallenges([challenge2])
      expect(useTeamDetailStore.getState().challenges).toHaveLength(1)
      expect(useTeamDetailStore.getState().challenges[0].id).toBe('challenge2')
    })
  })

  describe('clear operation', () => {
    const mockTeam: Team = {
      id: 'team1',
      name: 'Fitness Warriors',
      description: 'Team for fitness enthusiasts',
      avatar: 'avatar1.png',
      createdById: 'user1',
      createdAt: '2024-01-01T00:00:00Z',
      memberCount: 5,
      isActive: true,
    }

    const mockMember: TeamMember = {
      id: 'member1',
      teamId: 'team1',
      userId: 'user1',
      userName: 'John Doe',
      userAvatar: 'avatar1.png',
      joinedAt: '2024-01-01T00:00:00Z',
      role: 'member',
      contribution: {
        workouts: 10,
        calories: 5000,
        steps: 50000,
        duration: 300,
      },
    }

    const mockStats: TeamStatsSnapshot = {
      id: 'stats1',
      teamId: 'team1',
      snapshotDate: '2024-01-01T00:00:00Z',
      totalWorkouts: 50,
      totalCalories: 25000,
      totalSteps: 250000,
      totalDuration: 1500,
      memberBreakdown: {
        user1: 100,
      },
    }

    const mockChallenge: TeamChallenge = {
      id: 'challenge1',
      teamId: 'team1',
      type: 'workouts',
      title: 'Complete 10 Workouts',
      description: 'Complete 10 workouts as a team',
      goal: 10,
      currentProgress: 5,
      deadline: '2024-02-01T00:00:00Z',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
    }

    it('should clear all team detail data', () => {
      useTeamDetailStore.getState().setCurrentTeam(mockTeam)
      useTeamDetailStore.getState().addMember(mockMember)
      useTeamDetailStore.getState().setStats(mockStats)
      useTeamDetailStore.getState().setChallenges([mockChallenge])

      useTeamDetailStore.getState().clear()

      expect(useTeamDetailStore.getState().currentTeam).toBeNull()
      expect(useTeamDetailStore.getState().members).toHaveLength(0)
      expect(useTeamDetailStore.getState().stats).toBeNull()
      expect(useTeamDetailStore.getState().challenges).toHaveLength(0)
    })

    it('should allow setting data again after clear', () => {
      useTeamDetailStore.getState().setCurrentTeam(mockTeam)
      useTeamDetailStore.getState().clear()
      useTeamDetailStore.getState().setCurrentTeam(mockTeam)
      expect(useTeamDetailStore.getState().currentTeam).toEqual(mockTeam)
    })
  })

  describe('combined operations', () => {
    const mockTeam: Team = {
      id: 'team1',
      name: 'Fitness Warriors',
      description: 'Team for fitness enthusiasts',
      avatar: 'avatar1.png',
      createdById: 'user1',
      createdAt: '2024-01-01T00:00:00Z',
      memberCount: 5,
      isActive: true,
    }

    const mockMember: TeamMember = {
      id: 'member1',
      teamId: 'team1',
      userId: 'user1',
      userName: 'John Doe',
      userAvatar: 'avatar1.png',
      joinedAt: '2024-01-01T00:00:00Z',
      role: 'creator',
      contribution: {
        workouts: 10,
        calories: 5000,
        steps: 50000,
        duration: 300,
      },
    }

    const mockStats: TeamStatsSnapshot = {
      id: 'stats1',
      teamId: 'team1',
      snapshotDate: '2024-01-01T00:00:00Z',
      totalWorkouts: 50,
      totalCalories: 25000,
      totalSteps: 250000,
      totalDuration: 1500,
      memberBreakdown: {
        user1: 100,
      },
    }

    it('should manage all team detail aspects together', () => {
      useTeamDetailStore.getState().setCurrentTeam(mockTeam)
      useTeamDetailStore.getState().addMember(mockMember)
      useTeamDetailStore.getState().setStats(mockStats)

      const state = useTeamDetailStore.getState()
      expect(state.currentTeam?.id).toBe('team1')
      expect(state.members).toHaveLength(1)
      expect(state.stats?.totalWorkouts).toBe(50)
    })

    it('should maintain consistency when updating member', () => {
      const member2: TeamMember = {
        ...mockMember,
        id: 'member2',
        userId: 'user2',
        userName: 'Jane Smith',
        contribution: {
          workouts: 5,
          calories: 2500,
          steps: 25000,
          duration: 150,
        },
      }
      useTeamDetailStore.getState().addMember(mockMember)
      useTeamDetailStore.getState().addMember(member2)
      useTeamDetailStore.getState().updateMemberContribution('user1', { workouts: 20 })

      const members = useTeamDetailStore.getState().members
      expect(members[0].contribution.workouts).toBe(20)
      expect(members[1].contribution.workouts).toBe(5)
    })
  })

  describe('edge cases', () => {
    const mockMember: TeamMember = {
      id: 'member1',
      teamId: 'team1',
      userId: 'user1',
      userName: 'John Doe',
      userAvatar: 'avatar1.png',
      joinedAt: '2024-01-01T00:00:00Z',
      role: 'member',
      contribution: {
        workouts: 10,
        calories: 5000,
        steps: 50000,
        duration: 300,
      },
    }

    it('should handle partial member contribution update', () => {
      useTeamDetailStore.getState().addMember(mockMember)
      useTeamDetailStore.getState().updateMemberContribution('user1', {
        workouts: 25,
      })
      const member = useTeamDetailStore.getState().members[0]
      expect(member.contribution.workouts).toBe(25)
      expect(member.contribution.calories).toBe(5000)
      expect(member.contribution.steps).toBe(50000)
      expect(member.contribution.duration).toBe(300)
    })

    it('should handle empty member list setMembers', () => {
      useTeamDetailStore.getState().addMember(mockMember)
      useTeamDetailStore.getState().setMembers([])
      expect(useTeamDetailStore.getState().members).toHaveLength(0)
    })

    it('should handle replacing members list', () => {
      useTeamDetailStore.getState().addMember(mockMember)
      const member2: TeamMember = {
        ...mockMember,
        id: 'member2',
        userId: 'user2',
        userName: 'Jane Smith',
      }
      useTeamDetailStore.getState().setMembers([member2])
      expect(useTeamDetailStore.getState().members).toHaveLength(1)
      expect(useTeamDetailStore.getState().members[0].userId).toBe('user2')
    })
  })
})

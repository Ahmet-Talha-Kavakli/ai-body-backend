import { describe, it, expect, beforeEach } from 'vitest'
import { useTeamsStore } from '../useTeamsStore'
import type { Team, TeamNotification } from '../../types/teams'

describe('useTeamsStore', () => {
  beforeEach(() => {
    useTeamsStore.setState({
      teams: [],
      notifications: [],
    })
  })

  describe('initial state', () => {
    it('should initialize with empty teams list', () => {
      const { teams } = useTeamsStore.getState()
      expect(teams).toEqual([])
    })

    it('should initialize with empty notifications', () => {
      const { notifications } = useTeamsStore.getState()
      expect(notifications).toEqual([])
    })
  })

  describe('team operations', () => {
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

    it('should set teams list', () => {
      useTeamsStore.getState().setTeams([mockTeam])
      expect(useTeamsStore.getState().teams).toEqual([mockTeam])
    })

    it('should add team to list', () => {
      useTeamsStore.getState().addTeam(mockTeam)
      expect(useTeamsStore.getState().teams).toHaveLength(1)
      expect(useTeamsStore.getState().teams[0]).toEqual(mockTeam)
    })

    it('should add multiple teams', () => {
      const team2: Team = { ...mockTeam, id: 'team2', name: 'Running Club' }
      useTeamsStore.getState().addTeam(mockTeam)
      useTeamsStore.getState().addTeam(team2)
      expect(useTeamsStore.getState().teams).toHaveLength(2)
    })

    it('should update team by id', () => {
      useTeamsStore.getState().addTeam(mockTeam)
      useTeamsStore.getState().updateTeam('team1', { name: 'Updated Fitness Warriors' })
      expect(useTeamsStore.getState().teams[0].name).toBe('Updated Fitness Warriors')
    })

    it('should update team member count', () => {
      useTeamsStore.getState().addTeam(mockTeam)
      useTeamsStore.getState().updateTeam('team1', { memberCount: 8 })
      expect(useTeamsStore.getState().teams[0].memberCount).toBe(8)
    })

    it('should update team active status', () => {
      useTeamsStore.getState().addTeam(mockTeam)
      useTeamsStore.getState().updateTeam('team1', { isActive: false })
      expect(useTeamsStore.getState().teams[0].isActive).toBe(false)
    })

    it('should remove team by id', () => {
      useTeamsStore.getState().addTeam(mockTeam)
      useTeamsStore.getState().removeTeam('team1')
      expect(useTeamsStore.getState().teams).toHaveLength(0)
    })

    it('should not error when removing non-existent team', () => {
      useTeamsStore.getState().addTeam(mockTeam)
      expect(() => {
        useTeamsStore.getState().removeTeam('nonexistent')
      }).not.toThrow()
      expect(useTeamsStore.getState().teams).toHaveLength(1)
    })

    it('should preserve other teams when removing one', () => {
      const team2: Team = { ...mockTeam, id: 'team2', name: 'Running Club' }
      useTeamsStore.getState().addTeam(mockTeam)
      useTeamsStore.getState().addTeam(team2)
      useTeamsStore.getState().removeTeam('team1')
      expect(useTeamsStore.getState().teams).toHaveLength(1)
      expect(useTeamsStore.getState().teams[0].id).toBe('team2')
    })
  })

  describe('notification operations', () => {
    const mockNotification: TeamNotification = {
      id: 'notif1',
      teamId: 'team1',
      type: 'member_joined',
      title: 'New Member',
      message: 'John joined the team',
      createdAt: '2024-01-01T00:00:00Z',
      read: false,
    }

    it('should add notification', () => {
      useTeamsStore.getState().addNotification(mockNotification)
      expect(useTeamsStore.getState().notifications).toHaveLength(1)
      expect(useTeamsStore.getState().notifications[0]).toEqual(mockNotification)
    })

    it('should add multiple notifications', () => {
      const notif2: TeamNotification = {
        ...mockNotification,
        id: 'notif2',
        type: 'challenge_completed',
        title: 'Challenge Completed',
        message: 'Team completed challenge',
      }
      useTeamsStore.getState().addNotification(mockNotification)
      useTeamsStore.getState().addNotification(notif2)
      expect(useTeamsStore.getState().notifications).toHaveLength(2)
    })

    it('should mark notification as read', () => {
      useTeamsStore.getState().addNotification(mockNotification)
      useTeamsStore.getState().markNotificationAsRead('notif1')
      expect(useTeamsStore.getState().notifications[0].read).toBe(true)
    })

    it('should handle marking non-existent notification as read', () => {
      useTeamsStore.getState().addNotification(mockNotification)
      expect(() => {
        useTeamsStore.getState().markNotificationAsRead('nonexistent')
      }).not.toThrow()
      expect(useTeamsStore.getState().notifications).toHaveLength(1)
    })

    it('should clear all notifications', () => {
      const notif2: TeamNotification = { ...mockNotification, id: 'notif2' }
      useTeamsStore.getState().addNotification(mockNotification)
      useTeamsStore.getState().addNotification(notif2)
      useTeamsStore.getState().clearNotifications()
      expect(useTeamsStore.getState().notifications).toHaveLength(0)
    })

    it('should return correct unread count', () => {
      const notif2: TeamNotification = { ...mockNotification, id: 'notif2', read: true }
      useTeamsStore.getState().addNotification(mockNotification)
      useTeamsStore.getState().addNotification(notif2)
      expect(useTeamsStore.getState().getUnreadCount()).toBe(1)
    })

    it('should return zero unread count when all are read', () => {
      const notif2: TeamNotification = { ...mockNotification, id: 'notif2', read: true }
      useTeamsStore.getState().addNotification(mockNotification)
      useTeamsStore.getState().addNotification(notif2)
      useTeamsStore.getState().markNotificationAsRead('notif1')
      expect(useTeamsStore.getState().getUnreadCount()).toBe(0)
    })

    it('should return zero unread count when no notifications', () => {
      expect(useTeamsStore.getState().getUnreadCount()).toBe(0)
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

    const mockNotification: TeamNotification = {
      id: 'notif1',
      teamId: 'team1',
      type: 'member_joined',
      title: 'New Member',
      message: 'John joined the team',
      createdAt: '2024-01-01T00:00:00Z',
      read: false,
    }

    it('should manage teams and notifications independently', () => {
      useTeamsStore.getState().addTeam(mockTeam)
      useTeamsStore.getState().addNotification(mockNotification)
      expect(useTeamsStore.getState().teams).toHaveLength(1)
      expect(useTeamsStore.getState().notifications).toHaveLength(1)
    })

    it('should maintain state consistency across operations', () => {
      useTeamsStore.getState().addTeam(mockTeam)
      useTeamsStore.getState().addNotification(mockNotification)
      useTeamsStore.getState().removeTeam('team1')
      // Notifications should remain
      expect(useTeamsStore.getState().notifications).toHaveLength(1)
      expect(useTeamsStore.getState().teams).toHaveLength(0)
    })
  })

  describe('edge cases', () => {
    it('should handle duplicate team additions', () => {
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
      useTeamsStore.getState().addTeam(mockTeam)
      useTeamsStore.getState().addTeam(mockTeam)
      // Should allow duplicates in store (deduplication is UI concern)
      expect(useTeamsStore.getState().teams).toHaveLength(2)
    })

    it('should update only specified fields', () => {
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
      useTeamsStore.getState().addTeam(mockTeam)
      useTeamsStore.getState().updateTeam('team1', { name: 'New Name' })
      const team = useTeamsStore.getState().teams[0]
      expect(team.name).toBe('New Name')
      expect(team.description).toBe('Team for fitness enthusiasts')
      expect(team.memberCount).toBe(5)
    })

    it('should handle updating non-existent team', () => {
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
      useTeamsStore.getState().addTeam(mockTeam)
      expect(() => {
        useTeamsStore.getState().updateTeam('nonexistent', { name: 'New Name' })
      }).not.toThrow()
      expect(useTeamsStore.getState().teams).toHaveLength(1)
    })
  })
})

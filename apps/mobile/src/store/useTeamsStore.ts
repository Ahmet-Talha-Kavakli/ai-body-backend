import { create } from 'zustand'
import type { Team, TeamNotification } from '../types/teams'

interface TeamsState {
  teams: Team[]
  notifications: TeamNotification[]

  setTeams: (teams: Team[]) => void
  addTeam: (team: Team) => void
  updateTeam: (teamId: string, updates: Partial<Team>) => void
  removeTeam: (teamId: string) => void
  addNotification: (notification: TeamNotification) => void
  markNotificationAsRead: (notificationId: string) => void
  clearNotifications: () => void
  getUnreadCount: () => number
}

export const useTeamsStore = create<TeamsState>((set, get) => ({
  teams: [],
  notifications: [],

  setTeams: (teams) => set({ teams }),

  addTeam: (team) =>
    set((state) => ({
      teams: [...state.teams, team],
    })),

  updateTeam: (teamId, updates) =>
    set((state) => ({
      teams: state.teams.map((team) =>
        team.id === teamId ? { ...team, ...updates } : team
      ),
    })),

  removeTeam: (teamId) =>
    set((state) => ({
      teams: state.teams.filter((team) => team.id !== teamId),
    })),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, notification],
    })),

  markNotificationAsRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      ),
    })),

  clearNotifications: () => set({ notifications: [] }),

  getUnreadCount: () => {
    const { notifications } = get()
    return notifications.filter((notif) => !notif.read).length
  },
}))

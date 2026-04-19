import { getAuthenticatedClient } from './client'
import type { Team, TeamMember } from '../types/teams'

export const teamsClient = {
  teams: {
    create: async (data: { name: string; description?: string }) => {
      const client = await getAuthenticatedClient()
      return client.post('/api/teams', data)
    },
    list: async () => {
      const client = await getAuthenticatedClient()
      return client.get('/api/teams')
    },
    get: async (teamId: string) => {
      const client = await getAuthenticatedClient()
      return client.get(`/api/teams/${teamId}`)
    },
    update: async (teamId: string, data: { name?: string; description?: string }) => {
      const client = await getAuthenticatedClient()
      return client.patch(`/api/teams/${teamId}`, data)
    },
    delete: async (teamId: string) => {
      const client = await getAuthenticatedClient()
      return client.delete(`/api/teams/${teamId}`)
    },
    join: async (teamId: string) => {
      const client = await getAuthenticatedClient()
      return client.post(`/api/teams/${teamId}/join`)
    },
    leave: async (teamId: string) => {
      const client = await getAuthenticatedClient()
      return client.post(`/api/teams/${teamId}/leave`)
    },
    invite: async (teamId: string, data: { userId: string }) => {
      const client = await getAuthenticatedClient()
      return client.post(`/api/teams/${teamId}/invite`, data)
    },
    removeMember: async (teamId: string, userId: string) => {
      const client = await getAuthenticatedClient()
      return client.delete(`/api/teams/${teamId}/members/${userId}`)
    },
  },

  invites: {
    accept: async (inviteId: string) => {
      const client = await getAuthenticatedClient()
      return client.post(`/api/invites/${inviteId}/accept`)
    },
    reject: async (inviteId: string) => {
      const client = await getAuthenticatedClient()
      return client.post(`/api/invites/${inviteId}/reject`)
    },
  },

  stats: {
    aggregate: async (teamId: string) => {
      const client = await getAuthenticatedClient()
      return client.get(`/api/teams/${teamId}/stats`)
    },
    memberContribution: async (teamId: string, userId: string) => {
      const client = await getAuthenticatedClient()
      return client.get(`/api/teams/${teamId}/members/${userId}/contribution`)
    },
    leaderboard: async (teamId: string) => {
      const client = await getAuthenticatedClient()
      return client.get(`/api/teams/${teamId}/leaderboard`)
    },
    saveSnapshot: async (teamId: string) => {
      const client = await getAuthenticatedClient()
      return client.post(`/api/teams/${teamId}/stats/snapshot`)
    },
  },

  challenges: {
    create: async (teamId: string, data: any) => {
      const client = await getAuthenticatedClient()
      return client.post(`/api/teams/${teamId}/challenges`, data)
    },
    list: async (teamId: string) => {
      const client = await getAuthenticatedClient()
      return client.get(`/api/teams/${teamId}/challenges`)
    },
    get: async (teamId: string, challengeId: string) => {
      const client = await getAuthenticatedClient()
      return client.get(`/api/teams/${teamId}/challenges/${challengeId}`)
    },
    updateProgress: async (challengeId: string) => {
      const client = await getAuthenticatedClient()
      return client.put(`/api/challenges/${challengeId}/progress`)
    },
    complete: async (challengeId: string) => {
      const client = await getAuthenticatedClient()
      return client.post(`/api/challenges/${challengeId}/complete`)
    },
    delete: async (challengeId: string) => {
      const client = await getAuthenticatedClient()
      return client.delete(`/api/challenges/${challengeId}`)
    },
  },
}

export default teamsClient

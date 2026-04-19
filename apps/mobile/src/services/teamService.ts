import teamsClient from '../api/teamsClient'
import type { Team, TeamMember } from '../types/teams'

export async function createTeam(name: string, description?: string): Promise<Team> {
  try {
    const response = await teamsClient.teams.create({ name, description })
    return response.data
  } catch (error) {
    console.error('Error creating team:', error)
    throw error
  }
}

export async function getTeams(): Promise<Team[]> {
  try {
    const response = await teamsClient.teams.list()
    return response.data
  } catch (error) {
    console.error('Error fetching teams:', error)
    throw error
  }
}

export async function joinTeam(teamId: string): Promise<TeamMember> {
  try {
    const response = await teamsClient.teams.join(teamId)
    return response.data
  } catch (error) {
    console.error('Error joining team:', error)
    throw error
  }
}

export async function leaveTeam(teamId: string): Promise<void> {
  try {
    await teamsClient.teams.leave(teamId)
  } catch (error) {
    console.error('Error leaving team:', error)
    throw error
  }
}

export async function deleteTeam(teamId: string): Promise<void> {
  try {
    await teamsClient.teams.delete(teamId)
  } catch (error) {
    console.error('Error deleting team:', error)
    throw error
  }
}

export async function updateTeam(teamId: string, name?: string, description?: string): Promise<Team> {
  try {
    const data: { name?: string; description?: string } = {}
    if (name) data.name = name
    if (description !== undefined) data.description = description

    const response = await teamsClient.teams.update(teamId, data)
    return response.data
  } catch (error) {
    console.error('Error updating team:', error)
    throw error
  }
}

export async function inviteMember(teamId: string, userId: string): Promise<void> {
  try {
    await teamsClient.teams.invite(teamId, { userId })
  } catch (error) {
    console.error('Error inviting member:', error)
    throw error
  }
}

export async function acceptInvite(inviteId: string): Promise<TeamMember> {
  try {
    const response = await teamsClient.invites.accept(inviteId)
    return response.data
  } catch (error) {
    console.error('Error accepting invite:', error)
    throw error
  }
}

export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  try {
    await teamsClient.teams.removeMember(teamId, userId)
  } catch (error) {
    console.error('Error removing team member:', error)
    throw error
  }
}

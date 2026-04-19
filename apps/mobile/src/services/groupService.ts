import * as apiClient from './apiClient'
import type { Group } from '../types/messaging'

export async function createGroup(
  createdById: string,
  name: string,
  description: string,
  avatar?: string
): Promise<Group> {
  return apiClient.post('/api/groups', {
    createdById,
    name,
    description,
    avatar,
  })
}

export async function getGroup(groupId: string): Promise<Group> {
  return apiClient.get(`/api/groups/${groupId}`)
}

export async function addMember(groupId: string, userId: string): Promise<Group> {
  return apiClient.patch(`/api/groups/${groupId}/members`, {
    userId,
    action: 'add',
  })
}

export async function removeMember(groupId: string, userId: string): Promise<Group> {
  return apiClient.patch(`/api/groups/${groupId}/members`, {
    userId,
    action: 'remove',
  })
}

export async function updateGroup(
  groupId: string,
  updates: Partial<Omit<Group, 'id' | 'createdAt' | 'createdById'>>
): Promise<Group> {
  return apiClient.patch(`/api/groups/${groupId}`, updates)
}

export async function deleteGroup(groupId: string): Promise<void> {
  await apiClient.delete_(`/api/groups/${groupId}`)
}

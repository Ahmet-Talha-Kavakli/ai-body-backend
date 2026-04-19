import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createGroup, getGroup, addMember, removeMember, updateGroup } from '../groupService'
import * as apiClient from '../apiClient'

vi.mock('../apiClient')

describe('Group Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createGroup', () => {
    it('should create a group', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValue({
        id: 'group-1',
        name: 'Fitness Group',
        description: 'A group for fitness',
        createdById: 'user-1',
        createdAt: '2026-04-19T10:00:00Z',
        members: ['user-1'],
      })

      const group = await createGroup('user-1', 'Fitness Group', 'A group for fitness')

      expect(group.id).toBe('group-1')
      expect(group.name).toBe('Fitness Group')
      expect(group.members).toContain('user-1')
    })
  })

  describe('getGroup', () => {
    it('should fetch group details', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        id: 'group-1',
        name: 'Fitness Group',
        description: 'A group for fitness',
        createdById: 'user-1',
        createdAt: '2026-04-19T10:00:00Z',
        members: ['user-1', 'user-2', 'user-3'],
      })

      const group = await getGroup('group-1')

      expect(group.id).toBe('group-1')
      expect(group.members).toHaveLength(3)
    })
  })

  describe('addMember', () => {
    it('should add member to group', async () => {
      vi.spyOn(apiClient, 'patch').mockResolvedValue({
        id: 'group-1',
        name: 'Fitness Group',
        members: ['user-1', 'user-2'],
      })

      const result = await addMember('group-1', 'user-2')

      expect(result.members).toContain('user-2')
    })
  })

  describe('removeMember', () => {
    it('should remove member from group', async () => {
      vi.spyOn(apiClient, 'patch').mockResolvedValue({
        id: 'group-1',
        name: 'Fitness Group',
        members: ['user-1'],
      })

      const result = await removeMember('group-1', 'user-2')

      expect(result.members).toHaveLength(1)
    })
  })

  describe('updateGroup', () => {
    it('should update group details', async () => {
      vi.spyOn(apiClient, 'patch').mockResolvedValue({
        id: 'group-1',
        name: 'Updated Group',
        description: 'Updated description',
        members: ['user-1'],
      })

      const group = await updateGroup('group-1', {
        name: 'Updated Group',
        description: 'Updated description',
      })

      expect(group.name).toBe('Updated Group')
    })
  })
})

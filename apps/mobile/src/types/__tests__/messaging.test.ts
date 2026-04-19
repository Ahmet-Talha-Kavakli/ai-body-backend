import { describe, it, expect } from 'vitest'
import type {
  Message,
  Conversation,
  Group,
  MessageSyncQueueItem,
} from '../messaging'

describe('Messaging Types', () => {
  describe('Message', () => {
    it('should have required fields for DM', () => {
      const message: Message = {
        id: 'msg-1',
        senderId: 'user-1',
        senderName: 'Alice',
        recipientId: 'user-2',
        content: 'Hello',
        createdAt: '2026-04-19T10:00:00Z',
        updatedAt: '2026-04-19T10:00:00Z',
        read: false,
      }

      expect(message.id).toBe('msg-1')
      expect(message.senderId).toBe('user-1')
      expect(message.recipientId).toBe('user-2')
      expect(message.groupId).toBeUndefined()
    })

    it('should have required fields for group message', () => {
      const message: Message = {
        id: 'msg-2',
        senderId: 'user-1',
        senderName: 'Alice',
        groupId: 'group-1',
        content: 'Hello group',
        createdAt: '2026-04-19T10:00:00Z',
        updatedAt: '2026-04-19T10:00:00Z',
        read: false,
      }

      expect(message.groupId).toBe('group-1')
      expect(message.recipientId).toBeUndefined()
    })

    it('should support optional readAt timestamp', () => {
      const message: Message = {
        id: 'msg-3',
        senderId: 'user-1',
        senderName: 'Alice',
        recipientId: 'user-2',
        content: 'Read message',
        createdAt: '2026-04-19T10:00:00Z',
        updatedAt: '2026-04-19T10:00:00Z',
        read: true,
        readAt: '2026-04-19T10:05:00Z',
      }

      expect(message.read).toBe(true)
      expect(message.readAt).toBe('2026-04-19T10:05:00Z')
    })

    it('should support optional senderAvatar', () => {
      const message: Message = {
        id: 'msg-4',
        senderId: 'user-1',
        senderName: 'Alice',
        senderAvatar: 'https://example.com/avatar.jpg',
        recipientId: 'user-2',
        content: 'Message with avatar',
        createdAt: '2026-04-19T10:00:00Z',
        updatedAt: '2026-04-19T10:00:00Z',
        read: false,
      }

      expect(message.senderAvatar).toBe('https://example.com/avatar.jpg')
    })
  })

  describe('Conversation', () => {
    it('should create DM conversation', () => {
      const conversation: Conversation = {
        id: 'conv-1',
        userId: 'user-1',
        participantId: 'user-2',
        participantName: 'Bob',
        lastMessage: 'Last message',
        lastMessageAt: '2026-04-19T10:00:00Z',
        unreadCount: 3,
        type: 'dm',
      }

      expect(conversation.type).toBe('dm')
      expect(conversation.participantId).toBe('user-2')
      expect(conversation.groupId).toBeUndefined()
    })

    it('should create group conversation', () => {
      const conversation: Conversation = {
        id: 'conv-2',
        userId: 'user-1',
        groupId: 'group-1',
        groupName: 'Fitness Group',
        lastMessage: 'Last group message',
        lastMessageAt: '2026-04-19T10:00:00Z',
        unreadCount: 5,
        type: 'group',
      }

      expect(conversation.type).toBe('group')
      expect(conversation.groupId).toBe('group-1')
      expect(conversation.participantId).toBeUndefined()
    })

    it('should support optional participantAvatar', () => {
      const conversation: Conversation = {
        id: 'conv-3',
        userId: 'user-1',
        participantId: 'user-2',
        participantName: 'Bob',
        participantAvatar: 'https://example.com/avatar.jpg',
        lastMessage: 'Last message',
        lastMessageAt: '2026-04-19T10:00:00Z',
        unreadCount: 0,
        type: 'dm',
      }

      expect(conversation.participantAvatar).toBe('https://example.com/avatar.jpg')
    })

    it('should support optional groupAvatar', () => {
      const conversation: Conversation = {
        id: 'conv-4',
        userId: 'user-1',
        groupId: 'group-1',
        groupName: 'Fitness Group',
        lastMessage: 'Last message',
        lastMessageAt: '2026-04-19T10:00:00Z',
        unreadCount: 0,
        type: 'group',
        groupAvatar: 'https://example.com/group.jpg',
      }

      expect(conversation.groupAvatar).toBe('https://example.com/group.jpg')
    })
  })

  describe('Group', () => {
    it('should create group with all required fields', () => {
      const group: Group = {
        id: 'group-1',
        name: 'Fitness Group',
        description: 'A group for fitness enthusiasts',
        createdById: 'user-1',
        createdAt: '2026-04-19T10:00:00Z',
        members: ['user-1', 'user-2', 'user-3'],
      }

      expect(group.id).toBe('group-1')
      expect(group.name).toBe('Fitness Group')
      expect(group.members).toEqual(['user-1', 'user-2', 'user-3'])
      expect(group.members.length).toBe(3)
    })

    it('should support optional avatar', () => {
      const group: Group = {
        id: 'group-2',
        name: 'Running Club',
        description: 'For runners',
        createdById: 'user-1',
        createdAt: '2026-04-19T10:00:00Z',
        members: ['user-1'],
        avatar: 'https://example.com/group.jpg',
      }

      expect(group.avatar).toBe('https://example.com/group.jpg')
    })

    it('should have members as string array', () => {
      const group: Group = {
        id: 'group-3',
        name: 'Test Group',
        description: 'Test',
        createdById: 'user-1',
        createdAt: '2026-04-19T10:00:00Z',
        members: [],
      }

      expect(Array.isArray(group.members)).toBe(true)
      expect(group.members.length).toBe(0)
    })
  })

  describe('MessageSyncQueueItem', () => {
    it('should create sync queue item with required fields', () => {
      const item: MessageSyncQueueItem = {
        id: 'sync-1',
        messageId: 'msg-1',
        status: 'pending',
        retryCount: 0,
        createdAt: '2026-04-19T10:00:00Z',
      }

      expect(item.status).toBe('pending')
      expect(item.retryCount).toBe(0)
      expect(item.scheduledFor).toBeUndefined()
    })

    it('should support synced status', () => {
      const item: MessageSyncQueueItem = {
        id: 'sync-2',
        messageId: 'msg-2',
        status: 'synced',
        retryCount: 0,
        createdAt: '2026-04-19T10:00:00Z',
      }

      expect(item.status).toBe('synced')
    })

    it('should support failed status with retry count', () => {
      const item: MessageSyncQueueItem = {
        id: 'sync-3',
        messageId: 'msg-3',
        status: 'failed',
        retryCount: 2,
        createdAt: '2026-04-19T10:00:00Z',
      }

      expect(item.status).toBe('failed')
      expect(item.retryCount).toBe(2)
    })

    it('should support optional scheduledFor timestamp', () => {
      const item: MessageSyncQueueItem = {
        id: 'sync-4',
        messageId: 'msg-4',
        status: 'pending',
        retryCount: 1,
        createdAt: '2026-04-19T10:00:00Z',
        scheduledFor: '2026-04-19T11:00:00Z',
      }

      expect(item.scheduledFor).toBe('2026-04-19T11:00:00Z')
    })

    it('should support optional expiresAt timestamp', () => {
      const item: MessageSyncQueueItem = {
        id: 'sync-5',
        messageId: 'msg-5',
        status: 'pending',
        retryCount: 0,
        createdAt: '2026-04-19T10:00:00Z',
        expiresAt: '2026-04-20T10:00:00Z',
      }

      expect(item.expiresAt).toBe('2026-04-20T10:00:00Z')
    })

    it('should support all optional fields together', () => {
      const item: MessageSyncQueueItem = {
        id: 'sync-6',
        messageId: 'msg-6',
        status: 'pending',
        retryCount: 1,
        createdAt: '2026-04-19T10:00:00Z',
        scheduledFor: '2026-04-19T11:00:00Z',
        expiresAt: '2026-04-20T10:00:00Z',
      }

      expect(item.scheduledFor).toBeDefined()
      expect(item.expiresAt).toBeDefined()
    })
  })
})

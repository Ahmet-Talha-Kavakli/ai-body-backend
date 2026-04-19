import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createMessagingTables,
  saveMessage,
  getMessagesForConversation,
  markMessageAsRead,
  saveConversation,
  getConversationsForUser,
  saveGroup,
  getGroup,
  addGroupMember,
  removeGroupMember,
  saveSyncQueueItem,
  getSyncQueueItems,
  updateSyncQueueItem,
} from '../messaging'
import type {
  Message,
  Conversation,
  Group,
  MessageSyncQueueItem,
} from '../../types/messaging'

describe('Messaging Database', () => {
  beforeEach(async () => {
    // Create fresh tables for each test
    await createMessagingTables()
  })

  afterEach(async () => {
    // Clean up is handled by the beforeEach on next test
  })

  describe('Messages', () => {
    it('should save message', async () => {
      const message: Message = {
        id: 'msg-test',
        senderId: 'user-1',
        senderName: 'Alice',
        recipientId: 'user-2',
        content: 'Test',
        createdAt: '2026-04-19T10:00:00Z',
        updatedAt: '2026-04-19T10:00:00Z',
        read: false,
      }

      await expect(saveMessage(message)).resolves.not.toThrow()
    })

    it('should save and retrieve DM message', async () => {
      const message: Message = {
        id: 'msg-1',
        senderId: 'user-1',
        senderName: 'Alice',
        recipientId: 'user-2',
        content: 'Hello Bob',
        createdAt: '2026-04-19T10:00:00Z',
        updatedAt: '2026-04-19T10:00:00Z',
        read: false,
      }

      await saveMessage(message)
      const messages = await getMessagesForConversation('user-1', 'user-2')

      expect(messages).toHaveLength(1)
      expect(messages[0].id).toBe('msg-1')
      expect(messages[0].content).toBe('Hello Bob')
      expect(messages[0].read).toBe(false)
    })

    it('should save and retrieve group message', async () => {
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

      await saveMessage(message)
      const messages = await getMessagesForConversation('user-1', undefined, 'group-1')

      expect(messages).toHaveLength(1)
      expect(messages[0].groupId).toBe('group-1')
    })

    it('should mark message as read', async () => {
      const message: Message = {
        id: 'msg-3',
        senderId: 'user-1',
        senderName: 'Alice',
        recipientId: 'user-2',
        content: 'Test message',
        createdAt: '2026-04-19T10:00:00Z',
        updatedAt: '2026-04-19T10:00:00Z',
        read: false,
      }

      await saveMessage(message)
      await markMessageAsRead('msg-3', '2026-04-19T10:05:00Z')

      const messages = await getMessagesForConversation('user-1', 'user-2')
      expect(messages[0].read).toBe(true)
      expect(messages[0].readAt).toBe('2026-04-19T10:05:00Z')
    })

    it('should retrieve multiple messages in order', async () => {
      await saveMessage({
        id: 'msg-a',
        senderId: 'user-1',
        senderName: 'Alice',
        recipientId: 'user-2',
        content: 'First',
        createdAt: '2026-04-19T10:00:00Z',
        updatedAt: '2026-04-19T10:00:00Z',
        read: false,
      })

      await saveMessage({
        id: 'msg-b',
        senderId: 'user-2',
        senderName: 'Bob',
        recipientId: 'user-1',
        content: 'Second',
        createdAt: '2026-04-19T10:05:00Z',
        updatedAt: '2026-04-19T10:05:00Z',
        read: false,
      })

      const messages = await getMessagesForConversation('user-1', 'user-2')
      expect(messages).toHaveLength(2)
      expect(messages[0].createdAt < messages[1].createdAt).toBe(true)
    })

    it('should support optional fields like senderAvatar', async () => {
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

      await saveMessage(message)
      const messages = await getMessagesForConversation('user-1', 'user-2')

      expect(messages[0].senderAvatar).toBe('https://example.com/avatar.jpg')
    })
  })

  describe('Conversations', () => {
    it('should save and retrieve DM conversation', async () => {
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

      await saveConversation(conversation)
      const conversations = await getConversationsForUser('user-1')

      expect(conversations).toHaveLength(1)
      expect(conversations[0].type).toBe('dm')
      expect(conversations[0].unreadCount).toBe(3)
    })

    it('should save and retrieve group conversation', async () => {
      const conversation: Conversation = {
        id: 'conv-2',
        userId: 'user-1',
        groupId: 'group-1',
        groupName: 'Fitness Group',
        lastMessage: 'Group message',
        lastMessageAt: '2026-04-19T10:00:00Z',
        unreadCount: 5,
        type: 'group',
      }

      await saveConversation(conversation)
      const conversations = await getConversationsForUser('user-1')

      expect(conversations).toHaveLength(1)
      expect(conversations[0].type).toBe('group')
      expect(conversations[0].groupName).toBe('Fitness Group')
    })

    it('should update conversation unread count', async () => {
      const conversation: Conversation = {
        id: 'conv-3',
        userId: 'user-1',
        participantId: 'user-2',
        participantName: 'Bob',
        lastMessage: 'Message',
        lastMessageAt: '2026-04-19T10:00:00Z',
        unreadCount: 2,
        type: 'dm',
      }

      await saveConversation(conversation)
      await saveConversation({
        ...conversation,
        unreadCount: 0,
        lastMessage: 'New message',
      })

      const conversations = await getConversationsForUser('user-1')
      expect(conversations[0].unreadCount).toBe(0)
      expect(conversations[0].lastMessage).toBe('New message')
    })

    it('should retrieve multiple conversations', async () => {
      await saveConversation({
        id: 'conv-a',
        userId: 'user-1',
        participantId: 'user-2',
        participantName: 'Bob',
        lastMessage: 'Message from Bob',
        lastMessageAt: '2026-04-19T10:00:00Z',
        unreadCount: 0,
        type: 'dm',
      })

      await saveConversation({
        id: 'conv-b',
        userId: 'user-1',
        groupId: 'group-1',
        groupName: 'Group',
        lastMessage: 'Message from Group',
        lastMessageAt: '2026-04-19T10:05:00Z',
        unreadCount: 0,
        type: 'group',
      })

      const conversations = await getConversationsForUser('user-1')
      expect(conversations).toHaveLength(2)
    })
  })

  describe('Groups', () => {
    it('should save and retrieve group', async () => {
      const group: Group = {
        id: 'group-1',
        name: 'Fitness Group',
        description: 'A group for fitness',
        createdById: 'user-1',
        createdAt: '2026-04-19T10:00:00Z',
        members: ['user-1', 'user-2', 'user-3'],
      }

      await saveGroup(group)
      const retrieved = await getGroup('group-1')

      expect(retrieved).toBeDefined()
      expect(retrieved?.name).toBe('Fitness Group')
      expect(retrieved?.members).toHaveLength(3)
    })

    it('should support optional avatar field', async () => {
      const group: Group = {
        id: 'group-2',
        name: 'Running Club',
        description: 'For runners',
        createdById: 'user-1',
        createdAt: '2026-04-19T10:00:00Z',
        members: ['user-1'],
        avatar: 'https://example.com/group.jpg',
      }

      await saveGroup(group)
      const retrieved = await getGroup('group-2')

      expect(retrieved?.avatar).toBe('https://example.com/group.jpg')
    })

    it('should add member to group', async () => {
      const group: Group = {
        id: 'group-3',
        name: 'Test Group',
        description: 'Test',
        createdById: 'user-1',
        createdAt: '2026-04-19T10:00:00Z',
        members: ['user-1'],
      }

      await saveGroup(group)
      await addGroupMember('group-3', 'user-2')

      const retrieved = await getGroup('group-3')
      expect(retrieved?.members).toContain('user-2')
      expect(retrieved?.members).toHaveLength(2)
    })

    it('should remove member from group', async () => {
      const group: Group = {
        id: 'group-4',
        name: 'Test Group',
        description: 'Test',
        createdById: 'user-1',
        createdAt: '2026-04-19T10:00:00Z',
        members: ['user-1', 'user-2'],
      }

      await saveGroup(group)
      await removeGroupMember('group-4', 'user-2')

      const retrieved = await getGroup('group-4')
      expect(retrieved?.members).not.toContain('user-2')
      expect(retrieved?.members).toHaveLength(1)
    })
  })

  describe('Message Sync Queue', () => {
    it('should save and retrieve sync queue item', async () => {
      const item: MessageSyncQueueItem = {
        id: 'sync-1',
        messageId: 'msg-1',
        status: 'pending',
        retryCount: 0,
        createdAt: '2026-04-19T10:00:00Z',
      }

      await saveSyncQueueItem(item)
      const items = await getSyncQueueItems('pending')

      expect(items).toHaveLength(1)
      expect(items[0].messageId).toBe('msg-1')
      expect(items[0].status).toBe('pending')
    })

    it('should get queue items by status', async () => {
      await saveSyncQueueItem({
        id: 'sync-a',
        messageId: 'msg-a',
        status: 'pending',
        retryCount: 0,
        createdAt: '2026-04-19T10:00:00Z',
      })

      await saveSyncQueueItem({
        id: 'sync-b',
        messageId: 'msg-b',
        status: 'synced',
        retryCount: 0,
        createdAt: '2026-04-19T10:00:00Z',
      })

      const pending = await getSyncQueueItems('pending')
      const synced = await getSyncQueueItems('synced')

      expect(pending).toHaveLength(1)
      expect(synced).toHaveLength(1)
    })

    it('should update sync queue item status', async () => {
      await saveSyncQueueItem({
        id: 'sync-2',
        messageId: 'msg-2',
        status: 'pending',
        retryCount: 0,
        createdAt: '2026-04-19T10:00:00Z',
      })

      await updateSyncQueueItem('sync-2', { status: 'synced' })
      const items = await getSyncQueueItems('synced')

      expect(items).toHaveLength(1)
      expect(items[0].status).toBe('synced')
    })

    it('should update retry count on failure', async () => {
      await saveSyncQueueItem({
        id: 'sync-3',
        messageId: 'msg-3',
        status: 'pending',
        retryCount: 0,
        createdAt: '2026-04-19T10:00:00Z',
      })

      await updateSyncQueueItem('sync-3', {
        status: 'failed',
        retryCount: 1,
      })

      const items = await getSyncQueueItems('failed')
      expect(items[0].retryCount).toBe(1)
    })

    it('should support optional scheduledFor and expiresAt', async () => {
      const item: MessageSyncQueueItem = {
        id: 'sync-4',
        messageId: 'msg-4',
        status: 'pending',
        retryCount: 0,
        createdAt: '2026-04-19T10:00:00Z',
        scheduledFor: '2026-04-19T11:00:00Z',
        expiresAt: '2026-04-20T10:00:00Z',
      }

      await saveSyncQueueItem(item)
      const items = await getSyncQueueItems('pending')

      expect(items[0].scheduledFor).toBe('2026-04-19T11:00:00Z')
      expect(items[0].expiresAt).toBe('2026-04-20T10:00:00Z')
    })
  })
})

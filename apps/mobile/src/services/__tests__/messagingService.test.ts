import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  sendMessage,
  getMessagesForConversation,
  markMessageAsRead,
  getConversations,
} from '../messagingService'
import * as apiClient from '../apiClient'

vi.mock('../apiClient')

describe('Messaging Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendMessage', () => {
    it('should send DM message', async () => {
      const mockSend = vi.spyOn(apiClient, 'post').mockResolvedValue({
        id: 'msg-1',
        senderId: 'user-1',
        senderName: 'Alice',
        recipientId: 'user-2',
        content: 'Hello',
        createdAt: '2026-04-19T10:00:00Z',
        updatedAt: '2026-04-19T10:00:00Z',
        read: false,
      })

      const result = await sendMessage('user-1', 'Alice', 'user-2', 'Hello')

      expect(mockSend).toHaveBeenCalledWith('/api/messages', {
        senderId: 'user-1',
        senderName: 'Alice',
        recipientId: 'user-2',
        content: 'Hello',
      })
      expect(result.id).toBe('msg-1')
      expect(result.content).toBe('Hello')
    })

    it('should send group message', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValue({
        id: 'msg-2',
        senderId: 'user-1',
        senderName: 'Alice',
        groupId: 'group-1',
        content: 'Group hello',
        createdAt: '2026-04-19T10:00:00Z',
        updatedAt: '2026-04-19T10:00:00Z',
        read: false,
      })

      const result = await sendMessage('user-1', 'Alice', undefined, 'Group hello', 'group-1')

      expect(result.groupId).toBe('group-1')
    })
  })

  describe('getMessagesForConversation', () => {
    it('should fetch messages for DM', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue([
        {
          id: 'msg-1',
          senderId: 'user-1',
          senderName: 'Alice',
          recipientId: 'user-2',
          content: 'Message 1',
          createdAt: '2026-04-19T10:00:00Z',
          updatedAt: '2026-04-19T10:00:00Z',
          read: false,
        },
      ])

      const messages = await getMessagesForConversation('user-1', 'user-2')

      expect(messages).toHaveLength(1)
      expect(messages[0].content).toBe('Message 1')
    })

    it('should fetch messages for group', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue([
        {
          id: 'msg-1',
          senderId: 'user-1',
          senderName: 'Alice',
          groupId: 'group-1',
          content: 'Group message',
          createdAt: '2026-04-19T10:00:00Z',
          updatedAt: '2026-04-19T10:00:00Z',
          read: false,
        },
      ])

      const messages = await getMessagesForConversation('user-1', undefined, 'group-1')

      expect(messages).toHaveLength(1)
    })
  })

  describe('markMessageAsRead', () => {
    it('should mark message as read', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValue({
        id: 'msg-1',
        read: true,
        readAt: '2026-04-19T10:05:00Z',
      })

      const result = await markMessageAsRead('msg-1')

      expect(result.read).toBe(true)
      expect(result.readAt).toBe('2026-04-19T10:05:00Z')
    })
  })

  describe('getConversations', () => {
    it('should fetch all conversations', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue([
        {
          id: 'conv-1',
          userId: 'user-1',
          participantId: 'user-2',
          participantName: 'Bob',
          lastMessage: 'Last message',
          lastMessageAt: '2026-04-19T10:00:00Z',
          unreadCount: 3,
          type: 'dm',
        },
        {
          id: 'conv-2',
          userId: 'user-1',
          groupId: 'group-1',
          groupName: 'Fitness Group',
          lastMessage: 'Group message',
          lastMessageAt: '2026-04-19T10:00:00Z',
          unreadCount: 5,
          type: 'group',
        },
      ])

      const conversations = await getConversations('user-1')

      expect(conversations).toHaveLength(2)
      expect(conversations[0].type).toBe('dm')
      expect(conversations[1].type).toBe('group')
    })
  })
})

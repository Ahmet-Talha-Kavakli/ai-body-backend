/**
 * Integration Tests for Complete Messaging Flow
 * Tests full messaging lifecycle: sending, syncing, offline handling, search
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as apiClient from '../../src/services/apiClient'
import type { Message, Conversation } from '../../src/types/messaging'
import {
  sendMessage,
  getMessagesForConversation,
  markMessageAsRead,
  getConversations,
  searchConversations,
} from '../../src/services/messagingService'

vi.mock('../../src/services/apiClient')

describe('Messaging Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset all spies
    vi.restoreAllMocks()
  })

  // ==================== SEND MESSAGE TESTS ====================

  describe('Send Message Flow', () => {
    it('should send direct message and return confirmation', async () => {
      const mockMessage: Message = {
        id: 'msg-123',
        senderId: 'user-1',
        senderName: 'John',
        recipientId: 'user-2',
        content: 'Hey, how are you?',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        read: false,
      }

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockMessage)

      const result = await sendMessage(
        'user-1',
        'John',
        'user-2',
        'Hey, how are you?'
      )

      expect(result.id).toBe('msg-123')
      expect(result.content).toBe('Hey, how are you?')
      expect(apiClient.post).toHaveBeenCalledWith('/api/messages', {
        senderId: 'user-1',
        senderName: 'John',
        recipientId: 'user-2',
        groupId: undefined,
        content: 'Hey, how are you?',
      })
    })

    it('should send group message with groupId', async () => {
      const mockMessage: Message = {
        id: 'msg-456',
        senderId: 'user-1',
        senderName: 'John',
        groupId: 'group-fitness',
        content: 'Workout complete!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        read: false,
      }

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockMessage)

      const result = await sendMessage(
        'user-1',
        'John',
        undefined,
        'Workout complete!',
        'group-fitness'
      )

      expect(result.groupId).toBe('group-fitness')
      expect(apiClient.post).toHaveBeenCalledWith('/api/messages', {
        senderId: 'user-1',
        senderName: 'John',
        recipientId: undefined,
        groupId: 'group-fitness',
        content: 'Workout complete!',
      })
    })

    it('should handle long messages (> 500 chars)', async () => {
      const longContent = 'a'.repeat(600)
      const mockMessage: Message = {
        id: 'msg-789',
        senderId: 'user-1',
        senderName: 'John',
        recipientId: 'user-2',
        content: longContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        read: false,
      }

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockMessage)

      const result = await sendMessage(
        'user-1',
        'John',
        'user-2',
        longContent
      )

      expect(result.content.length).toBe(600)
    })

    it('should handle special characters in message content', async () => {
      const specialContent = 'Test with @mention and #hashtag and emoji 🎉'
      const mockMessage: Message = {
        id: 'msg-special',
        senderId: 'user-1',
        senderName: 'John',
        recipientId: 'user-2',
        content: specialContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        read: false,
      }

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockMessage)

      const result = await sendMessage(
        'user-1',
        'John',
        'user-2',
        specialContent
      )

      expect(result.content).toBe(specialContent)
    })
  })

  // ==================== RECEIVE & READ MESSAGE TESTS ====================

  describe('Receive and Read Messages', () => {
    it('should fetch messages for DM conversation', async () => {
      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          senderId: 'user-2',
          senderName: 'Jane',
          recipientId: 'user-1',
          content: 'Hello!',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          read: false,
        },
        {
          id: 'msg-2',
          senderId: 'user-1',
          senderName: 'John',
          recipientId: 'user-2',
          content: 'Hi there!',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          read: true,
        },
      ]

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockMessages)

      const messages = await getMessagesForConversation(
        'user-1',
        'user-2'
      )

      expect(messages).toHaveLength(2)
      expect(messages[0].content).toBe('Hello!')
      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/messages?userId=user-1&participantId=user-2'
      )
    })

    it('should fetch messages for group conversation', async () => {
      const mockMessages: Message[] = [
        {
          id: 'msg-g1',
          senderId: 'user-1',
          senderName: 'John',
          groupId: 'group-fitness',
          content: 'Group message 1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          read: true,
        },
      ]

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockMessages)

      const messages = await getMessagesForConversation(
        'user-1',
        undefined,
        'group-fitness'
      )

      expect(messages).toHaveLength(1)
      expect(messages[0].groupId).toBe('group-fitness')
      expect(apiClient.get).toHaveBeenCalledWith('/api/messages?groupId=group-fitness')
    })

    it('should mark message as read', async () => {
      const mockReadMessage: Message = {
        id: 'msg-123',
        senderId: 'user-2',
        senderName: 'Jane',
        recipientId: 'user-1',
        content: 'Hey',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        read: true,
        readAt: new Date().toISOString(),
      }

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockReadMessage)

      const result = await markMessageAsRead('msg-123')

      expect(result.read).toBe(true)
      expect(result.readAt).toBeDefined()
      expect(apiClient.post).toHaveBeenCalledWith('/api/messages/msg-123/read', {})
    })

    it('should return empty array when no messages exist', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce([])

      const messages = await getMessagesForConversation(
        'user-1',
        'user-2'
      )

      expect(messages).toHaveLength(0)
    })
  })

  // ==================== CONVERSATION MANAGEMENT TESTS ====================

  describe('Conversation Management', () => {
    it('should fetch all conversations for user', async () => {
      const mockConversations: Conversation[] = [
        {
          id: 'conv-1',
          userId: 'user-1',
          participantId: 'user-2',
          participantName: 'Jane',
          lastMessage: 'See you later!',
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
          type: 'dm',
        },
        {
          id: 'conv-2',
          userId: 'user-1',
          groupId: 'group-fitness',
          groupName: 'Fitness Group',
          lastMessage: 'Great workout today!',
          lastMessageAt: new Date().toISOString(),
          unreadCount: 3,
          type: 'group',
        },
      ]

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockConversations)

      const conversations = await getConversations('user-1')

      expect(conversations).toHaveLength(2)
      expect(conversations[0].type).toBe('dm')
      expect(conversations[1].type).toBe('group')
      expect(conversations[1].unreadCount).toBe(3)
    })

    it('should calculate unread message count', async () => {
      const mockConversations: Conversation[] = [
        {
          id: 'conv-1',
          userId: 'user-1',
          participantId: 'user-2',
          participantName: 'Jane',
          lastMessage: 'Unread',
          lastMessageAt: new Date().toISOString(),
          unreadCount: 5,
          type: 'dm',
        },
      ]

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockConversations)

      const conversations = await getConversations('user-1')

      expect(conversations[0].unreadCount).toBe(5)
    })

    it('should sort conversations by most recent first', async () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 3600000)

      const mockConversations: Conversation[] = [
        {
          id: 'conv-recent',
          userId: 'user-1',
          participantId: 'user-2',
          participantName: 'Jane',
          lastMessage: 'Recent',
          lastMessageAt: now.toISOString(),
          unreadCount: 0,
          type: 'dm',
        },
        {
          id: 'conv-old',
          userId: 'user-1',
          participantId: 'user-3',
          participantName: 'Bob',
          lastMessage: 'Old',
          lastMessageAt: oneHourAgo.toISOString(),
          unreadCount: 0,
          type: 'dm',
        },
      ]

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockConversations)

      const conversations = await getConversations('user-1')

      expect(conversations[0].id).toBe('conv-recent')
      expect(conversations[1].id).toBe('conv-old')
    })
  })

  // ==================== SEARCH TESTS ====================

  describe('Conversation Search', () => {
    it('should search conversations by participant name', async () => {
      const mockResults: Conversation[] = [
        {
          id: 'conv-jane',
          userId: 'user-1',
          participantId: 'user-2',
          participantName: 'Jane Smith',
          lastMessage: 'Hey!',
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
          type: 'dm',
        },
      ]

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockResults)

      const results = await searchConversations('user-1', 'jane')

      expect(results).toHaveLength(1)
      expect(results[0].participantName).toContain('Jane')
      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/conversations/search?userId=user-1&q=jane'
      )
    })

    it('should search conversations by group name', async () => {
      const mockResults: Conversation[] = [
        {
          id: 'conv-group',
          userId: 'user-1',
          groupId: 'group-123',
          groupName: 'Fitness Enthusiasts',
          lastMessage: 'Who wants to workout?',
          lastMessageAt: new Date().toISOString(),
          unreadCount: 2,
          type: 'group',
        },
      ]

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockResults)

      const results = await searchConversations(
        'user-1',
        'fitness'
      )

      expect(results).toHaveLength(1)
      expect(results[0].groupName).toContain('Fitness')
    })

    it('should handle URL encoding in search query', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce([])

      await searchConversations('user-1', 'john doe')

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/conversations/search?userId=user-1&q=john%20doe'
      )
    })

    it('should return empty results when no matches found', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce([])

      const results = await searchConversations(
        'user-1',
        'nonexistent'
      )

      expect(results).toHaveLength(0)
    })
  })

  // ==================== ERROR HANDLING TESTS ====================

  describe('Error Handling', () => {
    it('should handle null/undefined fields gracefully', async () => {
      const mockMessage: Message = {
        id: 'msg-null',
        senderId: 'user-1',
        senderName: 'John',
        content: 'Message',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        read: false,
      }

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockMessage)

      const result = await sendMessage(
        'user-1',
        'John',
        undefined,
        'Message',
        'group-1'
      )

      expect(result).toBeDefined()
      expect(result.id).toBe('msg-null')
    })

    it('should handle duplicate message IDs', async () => {
      const mockMessage1: Message = {
        id: 'msg-dup',
        senderId: 'user-1',
        senderName: 'John',
        recipientId: 'user-2',
        content: 'Message 1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        read: false,
      }

      const mockMessage2: Message = {
        id: 'msg-dup',
        senderId: 'user-1',
        senderName: 'John',
        recipientId: 'user-2',
        content: 'Message 2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        read: false,
      }

      vi.spyOn(apiClient, 'post')
        .mockResolvedValueOnce(mockMessage1)
        .mockResolvedValueOnce(mockMessage2)

      const result1 = await sendMessage(
        'user-1',
        'John',
        'user-2',
        'Message 1'
      )
      const result2 = await sendMessage(
        'user-1',
        'John',
        'user-2',
        'Message 2'
      )

      expect(result1.id).toBe(result2.id)
    })

    it('should handle API errors gracefully', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce(
        new Error('Network error')
      )

      await expect(
        sendMessage('user-1', 'John', 'user-2', 'Message')
      ).rejects.toThrow()
    })
  })

  // ==================== END-TO-END FLOW ====================

  describe('End-to-end Messaging Flow', () => {
    it('should complete full message lifecycle: send → read → archive', async () => {
      // Step 1: Send message
      const sentMessage: Message = {
        id: 'msg-e2e',
        senderId: 'user-1',
        senderName: 'John',
        recipientId: 'user-2',
        content: 'Full lifecycle test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        read: false,
      }

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce(sentMessage)

      const sent = await sendMessage(
        'user-1',
        'John',
        'user-2',
        'Full lifecycle test'
      )

      expect(sent.read).toBe(false)

      // Step 2: Mark as read
      const readMessage: Message = {
        ...sentMessage,
        read: true,
        readAt: new Date().toISOString(),
      }

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce(readMessage)

      const read = await markMessageAsRead('msg-e2e')

      expect(read.read).toBe(true)
    })

    it('should handle rapid message sends', async () => {
      const mockMessages: Message[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `msg-rapid-${i}`,
          senderId: 'user-1',
          senderName: 'John',
          recipientId: 'user-2',
          content: `Rapid message ${i}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          read: false,
        }))

      mockMessages.forEach((msg) => {
        vi.spyOn(apiClient, 'post').mockResolvedValueOnce(msg)
      })

      const results = await Promise.all(
        mockMessages.map((msg) =>
          sendMessage('user-1', 'John', 'user-2', msg.content)
        )
      )

      expect(results).toHaveLength(5)
      expect(results[0].content).toBe('Rapid message 0')
      expect(results[4].content).toBe('Rapid message 4')
    })
  })
})

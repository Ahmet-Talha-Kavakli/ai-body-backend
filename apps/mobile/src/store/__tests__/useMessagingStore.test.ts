import { describe, it, expect, beforeEach } from 'vitest'
import { useMessagingStore } from '../useMessagingStore'
import type { Conversation, Message } from '../../types/messaging'

describe('useMessagingStore', () => {
  beforeEach(() => {
    useMessagingStore.getState().clear()
  })

  describe('initial state', () => {
    it('should have empty initial state', () => {
      const state = useMessagingStore.getState()
      expect(state.conversations).toEqual([])
      expect(state.currentConversationId).toBeNull()
      expect(state.messages).toEqual([])
      expect(state.unreadCounts).toEqual({})
      expect(state.typingUsers).toEqual({})
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('setConversations', () => {
    it('should set conversations', () => {
      const conversation: Conversation = {
        id: 'conv1',
        userId: 'u1',
        participantId: 'u2',
        participantName: 'Alice',
        lastMessage: 'Hello',
        lastMessageAt: '2026-04-19T10:00:00Z',
        unreadCount: 2,
        type: 'dm',
      }
      useMessagingStore.getState().setConversations([conversation])
      expect(useMessagingStore.getState().conversations).toHaveLength(1)
      expect(useMessagingStore.getState().conversations[0].id).toBe('conv1')
    })

    it('should replace existing conversations', () => {
      const conv1: Conversation = {
        id: 'conv1',
        userId: 'u1',
        type: 'dm',
        lastMessage: 'msg1',
        lastMessageAt: '2026-04-19T10:00:00Z',
        unreadCount: 0,
      }
      const conv2: Conversation = {
        id: 'conv2',
        userId: 'u1',
        type: 'dm',
        lastMessage: 'msg2',
        lastMessageAt: '2026-04-19T11:00:00Z',
        unreadCount: 1,
      }
      useMessagingStore.getState().setConversations([conv1])
      useMessagingStore.getState().setConversations([conv2])
      expect(useMessagingStore.getState().conversations).toHaveLength(1)
      expect(useMessagingStore.getState().conversations[0].id).toBe('conv2')
    })
  })

  describe('addConversation', () => {
    it('should add a new conversation', () => {
      const conversation: Conversation = {
        id: 'conv1',
        userId: 'u1',
        participantId: 'u2',
        participantName: 'Bob',
        lastMessage: 'Hi',
        lastMessageAt: '2026-04-19T10:00:00Z',
        unreadCount: 0,
        type: 'dm',
      }
      useMessagingStore.getState().addConversation(conversation)
      expect(useMessagingStore.getState().conversations).toHaveLength(1)
      expect(useMessagingStore.getState().conversations[0].id).toBe('conv1')
    })

    it('should not duplicate conversations with same ID', () => {
      const conversation: Conversation = {
        id: 'conv1',
        userId: 'u1',
        type: 'dm',
        lastMessage: 'Hi',
        lastMessageAt: '2026-04-19T10:00:00Z',
        unreadCount: 0,
      }
      useMessagingStore.getState().addConversation(conversation)
      useMessagingStore.getState().addConversation(conversation)
      expect(useMessagingStore.getState().conversations).toHaveLength(1)
    })

    it('should add multiple different conversations', () => {
      const conv1: Conversation = {
        id: 'conv1',
        userId: 'u1',
        type: 'dm',
        lastMessage: 'Hi',
        lastMessageAt: '2026-04-19T10:00:00Z',
        unreadCount: 0,
      }
      const conv2: Conversation = {
        id: 'conv2',
        userId: 'u1',
        type: 'dm',
        lastMessage: 'Hello',
        lastMessageAt: '2026-04-19T11:00:00Z',
        unreadCount: 1,
      }
      useMessagingStore.getState().addConversation(conv1)
      useMessagingStore.getState().addConversation(conv2)
      expect(useMessagingStore.getState().conversations).toHaveLength(2)
    })
  })

  describe('setCurrentConversation', () => {
    it('should set current conversation ID', () => {
      useMessagingStore.getState().setCurrentConversation('conv1')
      expect(useMessagingStore.getState().currentConversationId).toBe('conv1')
    })

    it('should clear current conversation when set to null', () => {
      useMessagingStore.getState().setCurrentConversation('conv1')
      useMessagingStore.getState().setCurrentConversation('')
      expect(useMessagingStore.getState().currentConversationId).toBe('')
    })
  })

  describe('addMessage', () => {
    it('should add a message to current conversation messages', () => {
      const message: Message = {
        id: 'msg1',
        senderId: 'u1',
        senderName: 'Alice',
        content: 'Hello',
        createdAt: '2026-04-19T10:00:00Z',
        updatedAt: '2026-04-19T10:00:00Z',
        read: true,
        recipientId: 'u2',
      }
      useMessagingStore.getState().addMessage(message)
      expect(useMessagingStore.getState().messages).toHaveLength(1)
      expect(useMessagingStore.getState().messages[0].content).toBe('Hello')
    })

    it('should append messages to existing messages', () => {
      const msg1: Message = {
        id: 'msg1',
        senderId: 'u1',
        senderName: 'Alice',
        content: 'Hello',
        createdAt: '2026-04-19T10:00:00Z',
        updatedAt: '2026-04-19T10:00:00Z',
        read: true,
        recipientId: 'u2',
      }
      const msg2: Message = {
        id: 'msg2',
        senderId: 'u2',
        senderName: 'Bob',
        content: 'Hi',
        createdAt: '2026-04-19T10:01:00Z',
        updatedAt: '2026-04-19T10:01:00Z',
        read: false,
        recipientId: 'u1',
      }
      useMessagingStore.getState().addMessage(msg1)
      useMessagingStore.getState().addMessage(msg2)
      expect(useMessagingStore.getState().messages).toHaveLength(2)
      expect(useMessagingStore.getState().messages[1].id).toBe('msg2')
    })
  })

  describe('markAsRead', () => {
    it('should mark a message as read', () => {
      const message: Message = {
        id: 'msg1',
        senderId: 'u1',
        senderName: 'Alice',
        content: 'Hello',
        createdAt: '2026-04-19T10:00:00Z',
        updatedAt: '2026-04-19T10:00:00Z',
        read: false,
        recipientId: 'u2',
      }
      useMessagingStore.getState().addMessage(message)
      useMessagingStore.getState().markAsRead('msg1')
      expect(useMessagingStore.getState().messages[0].read).toBe(true)
    })

    it('should not affect other messages', () => {
      const msg1: Message = {
        id: 'msg1',
        senderId: 'u1',
        senderName: 'Alice',
        content: 'Hello',
        createdAt: '2026-04-19T10:00:00Z',
        updatedAt: '2026-04-19T10:00:00Z',
        read: false,
        recipientId: 'u2',
      }
      const msg2: Message = {
        id: 'msg2',
        senderId: 'u2',
        senderName: 'Bob',
        content: 'Hi',
        createdAt: '2026-04-19T10:01:00Z',
        updatedAt: '2026-04-19T10:01:00Z',
        read: false,
        recipientId: 'u1',
      }
      useMessagingStore.getState().addMessage(msg1)
      useMessagingStore.getState().addMessage(msg2)
      useMessagingStore.getState().markAsRead('msg1')
      expect(useMessagingStore.getState().messages[0].read).toBe(true)
      expect(useMessagingStore.getState().messages[1].read).toBe(false)
    })
  })

  describe('setTypingUsers', () => {
    it('should set typing users for a conversation', () => {
      useMessagingStore.getState().setTypingUsers('conv1', ['u2', 'u3'])
      expect(useMessagingStore.getState().typingUsers['conv1']).toEqual(['u2', 'u3'])
    })

    it('should clear typing users when passed empty array', () => {
      useMessagingStore.getState().setTypingUsers('conv1', ['u2'])
      useMessagingStore.getState().setTypingUsers('conv1', [])
      expect(useMessagingStore.getState().typingUsers['conv1']).toEqual([])
    })

    it('should handle multiple conversations independently', () => {
      useMessagingStore.getState().setTypingUsers('conv1', ['u2'])
      useMessagingStore.getState().setTypingUsers('conv2', ['u3'])
      expect(useMessagingStore.getState().typingUsers['conv1']).toEqual(['u2'])
      expect(useMessagingStore.getState().typingUsers['conv2']).toEqual(['u3'])
    })
  })

  describe('incrementUnreadCount', () => {
    it('should increment unread count for a conversation', () => {
      useMessagingStore.getState().incrementUnreadCount('conv1')
      expect(useMessagingStore.getState().unreadCounts['conv1']).toBe(1)
    })

    it('should increment from existing count', () => {
      useMessagingStore.getState().incrementUnreadCount('conv1')
      useMessagingStore.getState().incrementUnreadCount('conv1')
      expect(useMessagingStore.getState().unreadCounts['conv1']).toBe(2)
    })

    it('should handle multiple conversations', () => {
      useMessagingStore.getState().incrementUnreadCount('conv1')
      useMessagingStore.getState().incrementUnreadCount('conv2')
      useMessagingStore.getState().incrementUnreadCount('conv2')
      expect(useMessagingStore.getState().unreadCounts['conv1']).toBe(1)
      expect(useMessagingStore.getState().unreadCounts['conv2']).toBe(2)
    })
  })

  describe('clearUnreadCount', () => {
    it('should clear unread count for a conversation', () => {
      useMessagingStore.getState().incrementUnreadCount('conv1')
      useMessagingStore.getState().clearUnreadCount('conv1')
      expect(useMessagingStore.getState().unreadCounts['conv1']).toBe(0)
    })

    it('should not affect other conversations', () => {
      useMessagingStore.getState().incrementUnreadCount('conv1')
      useMessagingStore.getState().incrementUnreadCount('conv2')
      useMessagingStore.getState().clearUnreadCount('conv1')
      expect(useMessagingStore.getState().unreadCounts['conv1']).toBe(0)
      expect(useMessagingStore.getState().unreadCounts['conv2']).toBe(1)
    })
  })

  describe('clear', () => {
    it('should clear all state', () => {
      const conversation: Conversation = {
        id: 'conv1',
        userId: 'u1',
        type: 'dm',
        lastMessage: 'Hi',
        lastMessageAt: '2026-04-19T10:00:00Z',
        unreadCount: 1,
      }
      useMessagingStore.getState().addConversation(conversation)
      useMessagingStore.getState().setCurrentConversation('conv1')
      useMessagingStore.getState().incrementUnreadCount('conv1')

      useMessagingStore.getState().clear()
      const state = useMessagingStore.getState()
      expect(state.conversations).toEqual([])
      expect(state.currentConversationId).toBeNull()
      expect(state.messages).toEqual([])
      expect(state.unreadCounts).toEqual({})
      expect(state.typingUsers).toEqual({})
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })
})

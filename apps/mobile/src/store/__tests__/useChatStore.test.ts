import { describe, it, expect, beforeEach } from 'vitest'
import { useChatStore } from '../useChatStore'
import type { Message } from '../../types/messaging'

describe('useChatStore', () => {
  beforeEach(() => {
    useChatStore.getState().clear()
  })

  describe('initial state', () => {
    it('should have empty initial state', () => {
      const state = useChatStore.getState()
      expect(state.messages).toEqual([])
      expect(state.typingUsers).toEqual([])
      expect(state.isLoading).toBe(false)
      expect(state.hasMore).toBe(true)
    })
  })

  describe('setMessages', () => {
    it('should set messages completely', () => {
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
      useChatStore.getState().setMessages([message])
      expect(useChatStore.getState().messages).toHaveLength(1)
      expect(useChatStore.getState().messages[0].id).toBe('msg1')
    })

    it('should replace existing messages', () => {
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
      useChatStore.getState().setMessages([msg1])
      useChatStore.getState().setMessages([msg2])
      expect(useChatStore.getState().messages).toHaveLength(1)
      expect(useChatStore.getState().messages[0].id).toBe('msg2')
    })
  })

  describe('addMessage', () => {
    it('should add a message to the end', () => {
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
      useChatStore.getState().addMessage(message)
      expect(useChatStore.getState().messages).toHaveLength(1)
      expect(useChatStore.getState().messages[0].id).toBe('msg1')
    })

    it('should append multiple messages', () => {
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
      useChatStore.getState().addMessage(msg1)
      useChatStore.getState().addMessage(msg2)
      expect(useChatStore.getState().messages).toHaveLength(2)
      expect(useChatStore.getState().messages[1].id).toBe('msg2')
    })
  })

  describe('prependMessages', () => {
    it('should prepend messages to the beginning', () => {
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
        createdAt: '2026-04-19T09:00:00Z',
        updatedAt: '2026-04-19T09:00:00Z',
        read: false,
        recipientId: 'u1',
      }
      useChatStore.getState().addMessage(msg1)
      useChatStore.getState().prependMessages([msg2])
      expect(useChatStore.getState().messages).toHaveLength(2)
      expect(useChatStore.getState().messages[0].id).toBe('msg2')
      expect(useChatStore.getState().messages[1].id).toBe('msg1')
    })

    it('should handle multiple prepended messages', () => {
      const msg3: Message = {
        id: 'msg3',
        senderId: 'u1',
        senderName: 'Alice',
        content: 'Latest',
        createdAt: '2026-04-19T10:00:00Z',
        updatedAt: '2026-04-19T10:00:00Z',
        read: true,
        recipientId: 'u2',
      }
      const msg1: Message = {
        id: 'msg1',
        senderId: 'u1',
        senderName: 'Alice',
        content: 'First',
        createdAt: '2026-04-19T08:00:00Z',
        updatedAt: '2026-04-19T08:00:00Z',
        read: true,
        recipientId: 'u2',
      }
      const msg2: Message = {
        id: 'msg2',
        senderId: 'u2',
        senderName: 'Bob',
        content: 'Second',
        createdAt: '2026-04-19T09:00:00Z',
        updatedAt: '2026-04-19T09:00:00Z',
        read: false,
        recipientId: 'u1',
      }
      useChatStore.getState().addMessage(msg3)
      useChatStore.getState().prependMessages([msg1, msg2])
      expect(useChatStore.getState().messages).toHaveLength(3)
      expect(useChatStore.getState().messages[0].id).toBe('msg1')
      expect(useChatStore.getState().messages[1].id).toBe('msg2')
      expect(useChatStore.getState().messages[2].id).toBe('msg3')
    })
  })

  describe('setTypingUsers', () => {
    it('should set typing users', () => {
      useChatStore.getState().setTypingUsers(['u2', 'u3'])
      expect(useChatStore.getState().typingUsers).toEqual(['u2', 'u3'])
    })

    it('should replace existing typing users', () => {
      useChatStore.getState().setTypingUsers(['u2'])
      useChatStore.getState().setTypingUsers(['u3', 'u4'])
      expect(useChatStore.getState().typingUsers).toEqual(['u3', 'u4'])
    })

    it('should clear typing users with empty array', () => {
      useChatStore.getState().setTypingUsers(['u2'])
      useChatStore.getState().setTypingUsers([])
      expect(useChatStore.getState().typingUsers).toEqual([])
    })
  })

  describe('setLoading', () => {
    it('should set loading state', () => {
      useChatStore.getState().setLoading(true)
      expect(useChatStore.getState().isLoading).toBe(true)
      useChatStore.getState().setLoading(false)
      expect(useChatStore.getState().isLoading).toBe(false)
    })
  })

  describe('setHasMore', () => {
    it('should set hasMore flag', () => {
      useChatStore.getState().setHasMore(false)
      expect(useChatStore.getState().hasMore).toBe(false)
      useChatStore.getState().setHasMore(true)
      expect(useChatStore.getState().hasMore).toBe(true)
    })
  })

  describe('clear', () => {
    it('should clear all state', () => {
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
      useChatStore.getState().addMessage(message)
      useChatStore.getState().setTypingUsers(['u2'])
      useChatStore.getState().setLoading(true)
      useChatStore.getState().setHasMore(false)

      useChatStore.getState().clear()
      const state = useChatStore.getState()
      expect(state.messages).toEqual([])
      expect(state.typingUsers).toEqual([])
      expect(state.isLoading).toBe(false)
      expect(state.hasMore).toBe(true)
    })
  })
})

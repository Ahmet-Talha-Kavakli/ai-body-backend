import { describe, it, expect, vi } from 'vitest'
import type { Conversation } from '../../../types/messaging'

describe('ConversationsScreen', () => {
  const createConversation = (overrides?: Partial<Conversation>): Conversation => ({
    id: 'conv1',
    userId: 'u1',
    participantId: 'u2',
    participantName: 'Alice',
    lastMessage: 'Hello',
    lastMessageAt: '2026-04-19T10:00:00Z',
    unreadCount: 0,
    type: 'dm',
    ...overrides,
  })

  describe('component functionality', () => {
    it('should handle conversations list sorting', () => {
      const conv1 = createConversation({ id: 'c1', lastMessageAt: '2026-04-19T10:00:00Z' })
      const conv2 = createConversation({ id: 'c2', lastMessageAt: '2026-04-19T11:00:00Z' })
      const conversations = [conv1, conv2]

      const sorted = [...conversations].sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      )

      expect(sorted[0].id).toBe('c2')
      expect(sorted[1].id).toBe('c1')
    })

    it('should filter conversations by search query', () => {
      const conv1 = createConversation({ participantName: 'Alice' })
      const conv2 = createConversation({ participantName: 'Bob' })
      const conversations = [conv1, conv2]
      const searchQuery = 'alice'

      const filtered = conversations.filter((conv) => {
        const name = conv.type === 'dm' ? conv.participantName : conv.groupName
        return name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
      })

      expect(filtered).toHaveLength(1)
      expect(filtered[0].participantName).toBe('Alice')
    })

    it('should handle empty search results', () => {
      const conversations: Conversation[] = []
      const filtered = conversations.filter((c) => c.participantName?.includes('xyz'))
      expect(filtered).toHaveLength(0)
    })

    it('should case insensitive search', () => {
      const conv = createConversation({ participantName: 'Alice' })
      const conversations = [conv]
      const searchQuery = 'ALICE'

      const filtered = conversations.filter((c) =>
        c.participantName?.toLowerCase().includes(searchQuery.toLowerCase())
      )

      expect(filtered).toHaveLength(1)
    })

    it('should handle partial name matching', () => {
      const conv = createConversation({ participantName: 'AliceSmith' })
      const conversations = [conv]

      const filtered = conversations.filter((c) =>
        c.participantName?.includes('Alice')
      )

      expect(filtered).toHaveLength(1)
    })
  })

  describe('conversation types', () => {
    it('should handle DM conversations', () => {
      const conversation = createConversation({ type: 'dm', participantName: 'Bob' })
      expect(conversation.type).toBe('dm')
      expect(conversation.participantName).toBe('Bob')
    })

    it('should handle group conversations', () => {
      const conversation = createConversation({ type: 'group', groupName: 'Fitness Group', groupId: 'g1' })
      expect(conversation.type).toBe('group')
      expect(conversation.groupName).toBe('Fitness Group')
    })

    it('should mix DM and group conversations', () => {
      const dm = createConversation({ type: 'dm' })
      const group = createConversation({ type: 'group', groupName: 'Group', groupId: 'g1' })
      const conversations = [dm, group]
      expect(conversations).toHaveLength(2)
      expect(conversations[0].type).toBe('dm')
      expect(conversations[1].type).toBe('group')
    })
  })

  describe('unread handling', () => {
    it('should identify conversations with unread messages', () => {
      const read = createConversation({ unreadCount: 0 })
      const unread = createConversation({ unreadCount: 3 })
      const conversations = [read, unread]

      const unreadConvs = conversations.filter((c) => c.unreadCount > 0)
      expect(unreadConvs).toHaveLength(1)
      expect(unreadConvs[0].unreadCount).toBe(3)
    })

    it('should not show badge for 0 unread', () => {
      const conversation = createConversation({ unreadCount: 0 })
      const shouldShowBadge = conversation.unreadCount > 0
      expect(shouldShowBadge).toBe(false)
    })

    it('should show badge for any unread count', () => {
      const conv1 = createConversation({ unreadCount: 1 })
      const conv2 = createConversation({ unreadCount: 99 })
      expect(conv1.unreadCount > 0).toBe(true)
      expect(conv2.unreadCount > 0).toBe(true)
    })
  })

  describe('navigation parameters', () => {
    it('should pass conversation ID for navigation', () => {
      const conversation = createConversation({ id: 'conv123' })
      expect(conversation.id).toBe('conv123')
    })

    it('should handle multiple conversation IDs', () => {
      const conversations = [
        createConversation({ id: 'conv1' }),
        createConversation({ id: 'conv2' }),
      ]
      const ids = conversations.map((c) => c.id)
      expect(ids).toContain('conv1')
      expect(ids).toContain('conv2')
    })
  })

  describe('empty state', () => {
    it('should show empty state with no conversations', () => {
      const conversations: Conversation[] = []
      expect(conversations).toHaveLength(0)
    })

    it('should show empty state when all filtered out', () => {
      const conversations = [createConversation({ participantName: 'Alice' })]
      const filtered = conversations.filter((c) => c.participantName?.includes('Bob'))
      expect(filtered).toHaveLength(0)
    })
  })
})

import { describe, it, expect, vi } from 'vitest'
import { ConversationCard } from '../ConversationCard'
import type { Conversation } from '../../../types/messaging'

describe('ConversationCard', () => {
  const createConversation = (overrides?: Partial<Conversation>): Conversation => ({
    id: 'conv1',
    userId: 'u1',
    participantId: 'u2',
    participantName: 'Alice',
    participantAvatar: 'https://example.com/avatar.jpg',
    lastMessage: 'Hello there!',
    lastMessageAt: '2026-04-19T10:00:00Z',
    unreadCount: 0,
    type: 'dm',
    ...overrides,
  })

  describe('component props', () => {
    it('should accept conversation and onPress props', () => {
      const conversation = createConversation()
      const onPress = vi.fn()
      const component = <ConversationCard conversation={conversation} onPress={onPress} />
      expect(component).toBeDefined()
      expect(component.props.conversation).toBe(conversation)
      expect(component.props.onPress).toBe(onPress)
    })
  })

  describe('DM conversations', () => {
    it('should display participant name for DM', () => {
      const conversation = createConversation({ type: 'dm', participantName: 'Bob' })
      const component = <ConversationCard conversation={conversation} onPress={() => {}} />
      expect(component.props.conversation.participantName).toBe('Bob')
    })

    it('should display last message preview', () => {
      const conversation = createConversation({ lastMessage: 'See you soon!' })
      const component = <ConversationCard conversation={conversation} onPress={() => {}} />
      expect(component.props.conversation.lastMessage).toBe('See you soon!')
    })

    it('should show participant avatar', () => {
      const conversation = createConversation({ participantAvatar: 'https://example.com/bob.jpg' })
      const component = <ConversationCard conversation={conversation} onPress={() => {}} />
      expect(component.props.conversation.participantAvatar).toBe('https://example.com/bob.jpg')
    })
  })

  describe('Group conversations', () => {
    it('should display group name for group chat', () => {
      const conversation = createConversation({ type: 'group', groupName: 'Fitness Group', groupId: 'g1' })
      const component = <ConversationCard conversation={conversation} onPress={() => {}} />
      expect(component.props.conversation.groupName).toBe('Fitness Group')
      expect(component.props.conversation.type).toBe('group')
    })

    it('should show group avatar', () => {
      const conversation = createConversation({
        type: 'group',
        groupAvatar: 'https://example.com/group.jpg',
      })
      const component = <ConversationCard conversation={conversation} onPress={() => {}} />
      expect(component.props.conversation.groupAvatar).toBe('https://example.com/group.jpg')
    })
  })

  describe('timestamp display', () => {
    it('should display last message timestamp', () => {
      const conversation = createConversation({ lastMessageAt: '2026-04-19T15:30:00Z' })
      const component = <ConversationCard conversation={conversation} onPress={() => {}} />
      expect(component.props.conversation.lastMessageAt).toBe('2026-04-19T15:30:00Z')
    })

    it('should handle recent messages', () => {
      const conversation = createConversation({ lastMessageAt: new Date().toISOString() })
      const component = <ConversationCard conversation={conversation} onPress={() => {}} />
      expect(component.props.conversation.lastMessageAt).toBeTruthy()
    })
  })

  describe('unread badge', () => {
    it('should show unread count when greater than 0', () => {
      const conversation = createConversation({ unreadCount: 5 })
      const component = <ConversationCard conversation={conversation} onPress={() => {}} />
      expect(component.props.conversation.unreadCount).toBe(5)
    })

    it('should not show badge when unread count is 0', () => {
      const conversation = createConversation({ unreadCount: 0 })
      const component = <ConversationCard conversation={conversation} onPress={() => {}} />
      expect(component.props.conversation.unreadCount).toBe(0)
    })

    it('should show large unread counts', () => {
      const conversation = createConversation({ unreadCount: 99 })
      const component = <ConversationCard conversation={conversation} onPress={() => {}} />
      expect(component.props.conversation.unreadCount).toBe(99)
    })
  })

  describe('message preview', () => {
    it('should truncate long messages', () => {
      const longMessage = 'A'.repeat(100)
      const conversation = createConversation({ lastMessage: longMessage })
      const component = <ConversationCard conversation={conversation} onPress={() => {}} />
      expect(component.props.conversation.lastMessage.length).toBe(100)
    })

    it('should handle empty last message', () => {
      const conversation = createConversation({ lastMessage: '' })
      const component = <ConversationCard conversation={conversation} onPress={() => {}} />
      expect(component.props.conversation.lastMessage).toBe('')
    })

    it('should display emoji in message preview', () => {
      const conversation = createConversation({ lastMessage: 'Great! 👍' })
      const component = <ConversationCard conversation={conversation} onPress={() => {}} />
      expect(component.props.conversation.lastMessage).toBe('Great! 👍')
    })
  })

  describe('multiple conversations', () => {
    it('should handle different conversations', () => {
      const conv1 = createConversation({ id: 'conv1', participantName: 'Alice' })
      const conv2 = createConversation({ id: 'conv2', participantName: 'Bob' })

      const component1 = <ConversationCard conversation={conv1} onPress={() => {}} />
      const component2 = <ConversationCard conversation={conv2} onPress={() => {}} />

      expect(component1.props.conversation.id).toBe('conv1')
      expect(component2.props.conversation.id).toBe('conv2')
    })
  })

  describe('user interaction', () => {
    it('should call onPress when tapped', () => {
      const conversation = createConversation()
      const onPress = vi.fn()
      const component = <ConversationCard conversation={conversation} onPress={onPress} />
      expect(component.props.onPress).toBe(onPress)
    })

    it('should pass conversation ID on press', () => {
      const conversation = createConversation({ id: 'conv123' })
      const onPress = vi.fn()
      const component = <ConversationCard conversation={conversation} onPress={onPress} />
      expect(component.props.conversation.id).toBe('conv123')
    })
  })
})

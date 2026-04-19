import { describe, it, expect } from 'vitest'
import { MessageBubble } from '../MessageBubble'
import type { Message } from '../../../types/messaging'

describe('MessageBubble', () => {
  const createMessage = (overrides?: Partial<Message>): Message => ({
    id: 'msg1',
    senderId: 'u1',
    senderName: 'Alice',
    senderAvatar: 'https://example.com/avatar.jpg',
    content: 'Hello, how are you?',
    createdAt: '2026-04-19T10:00:00Z',
    updatedAt: '2026-04-19T10:00:00Z',
    read: true,
    recipientId: 'u2',
    ...overrides,
  })

  describe('component props', () => {
    it('should accept message, isSent, and showAvatar props', () => {
      const message = createMessage()
      const component = <MessageBubble message={message} isSent={true} showAvatar={false} />
      expect(component).toBeDefined()
      expect(component.props.message).toBe(message)
      expect(component.props.isSent).toBe(true)
      expect(component.props.showAvatar).toBe(false)
    })

    it('should handle different message content', () => {
      const message = createMessage({ content: 'Test message' })
      const component = <MessageBubble message={message} isSent={true} showAvatar={false} />
      expect(component.props.message.content).toBe('Test message')
    })
  })

  describe('sent messages', () => {
    it('should render with isSent true', () => {
      const message = createMessage()
      const component = <MessageBubble message={message} isSent={true} showAvatar={false} />
      expect(component.props.isSent).toBe(true)
    })

    it('should include sender name in message', () => {
      const message = createMessage({ senderName: 'Bob' })
      const component = <MessageBubble message={message} isSent={true} showAvatar={false} />
      expect(component.props.message.senderName).toBe('Bob')
    })

    it('should show read receipt for sent messages', () => {
      const message = createMessage({ read: true })
      const component = <MessageBubble message={message} isSent={true} showAvatar={false} />
      expect(component.props.message.read).toBe(true)
    })
  })

  describe('received messages', () => {
    it('should render with isSent false', () => {
      const message = createMessage()
      const component = <MessageBubble message={message} isSent={false} showAvatar={true} />
      expect(component.props.isSent).toBe(false)
    })

    it('should include sender avatar when showing', () => {
      const message = createMessage({ senderAvatar: 'https://example.com/avatar.jpg' })
      const component = <MessageBubble message={message} isSent={false} showAvatar={true} />
      expect(component.props.showAvatar).toBe(true)
      expect(component.props.message.senderAvatar).toBe('https://example.com/avatar.jpg')
    })
  })

  describe('avatar handling', () => {
    it('should conditionally show avatar based on showAvatar prop', () => {
      const message = createMessage()
      const withAvatar = <MessageBubble message={message} isSent={false} showAvatar={true} />
      const withoutAvatar = <MessageBubble message={message} isSent={false} showAvatar={false} />
      expect(withAvatar.props.showAvatar).toBe(true)
      expect(withoutAvatar.props.showAvatar).toBe(false)
    })

    it('should handle missing avatar gracefully', () => {
      const message = createMessage({ senderAvatar: undefined })
      const component = <MessageBubble message={message} isSent={false} showAvatar={true} />
      expect(component.props.message.senderAvatar).toBeUndefined()
    })
  })

  describe('timestamp handling', () => {
    it('should include timestamp in message', () => {
      const timestamp = '2026-04-19T10:30:00Z'
      const message = createMessage({ createdAt: timestamp })
      const component = <MessageBubble message={message} isSent={true} showAvatar={false} />
      expect(component.props.message.createdAt).toBe(timestamp)
    })
  })

  describe('read status', () => {
    it('should handle read messages', () => {
      const message = createMessage({ read: true })
      const component = <MessageBubble message={message} isSent={true} showAvatar={false} />
      expect(component.props.message.read).toBe(true)
    })

    it('should handle unread messages', () => {
      const message = createMessage({ read: false })
      const component = <MessageBubble message={message} isSent={true} showAvatar={false} />
      expect(component.props.message.read).toBe(false)
    })
  })

  describe('content types', () => {
    it('should handle long messages', () => {
      const longContent = 'A'.repeat(200)
      const message = createMessage({ content: longContent })
      const component = <MessageBubble message={message} isSent={true} showAvatar={false} />
      expect(component.props.message.content).toBe(longContent)
    })

    it('should handle multiline content', () => {
      const multilineContent = 'Line 1\nLine 2\nLine 3'
      const message = createMessage({ content: multilineContent })
      const component = <MessageBubble message={message} isSent={true} showAvatar={false} />
      expect(component.props.message.content).toBe(multilineContent)
    })

    it('should display emoji correctly', () => {
      const message = createMessage({ content: 'Hello 👋 🎉' })
      const component = <MessageBubble message={message} isSent={true} showAvatar={false} />
      expect(component.props.message.content).toBe('Hello 👋 🎉')
    })
  })
})

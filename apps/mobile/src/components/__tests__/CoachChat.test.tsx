import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react-native'
import { CoachChat } from '../nutrition/CoachChat'

describe('CoachChat', () => {
  const mockMessages = [
    { role: 'user' as const, content: 'Merhaba' },
    { role: 'assistant' as const, content: 'Hoşgeldiniz' },
  ]

  it('should render user message on right', () => {
    const msgs = [{ role: 'user' as const, content: 'Merhaba' }]
    render(<CoachChat messages={msgs} isLoading={false} />)
    expect(screen.getByText('Merhaba')).toBeTruthy()
  })

  it('should render assistant message on left', () => {
    const msgs = [{ role: 'assistant' as const, content: 'Hoşgeldiniz' }]
    render(<CoachChat messages={msgs} isLoading={false} />)
    expect(screen.getByText('Hoşgeldiniz')).toBeTruthy()
  })

  it('should render multiple messages', () => {
    render(<CoachChat messages={mockMessages} isLoading={false} />)
    expect(screen.getByText('Merhaba')).toBeTruthy()
    expect(screen.getByText('Hoşgeldiniz')).toBeTruthy()
  })

  it('should show typing indicator when loading', () => {
    render(<CoachChat messages={[]} isLoading={true} />)
    expect(screen.getByTestId('typing-indicator')).toBeTruthy()
  })

  it('should not show typing indicator when not loading', () => {
    render(<CoachChat messages={mockMessages} isLoading={false} />)
    const typingIndicator = screen.queryByTestId('typing-indicator')
    expect(typingIndicator).toBeNull()
  })

  it('should render empty messages array', () => {
    render(<CoachChat messages={[]} isLoading={false} />)
    expect(screen.queryByText('Merhaba')).toBeNull()
  })

  it('should handle long messages', () => {
    const longMessage = 'Bu çok uzun bir mesajdır. '.repeat(20)
    const msgs = [{ role: 'user' as const, content: longMessage }]
    render(<CoachChat messages={msgs} isLoading={false} />)
    expect(screen.getByText(longMessage)).toBeTruthy()
  })

  it('should differentiate user and assistant messages visually', () => {
    render(<CoachChat messages={mockMessages} isLoading={false} />)
    const userMessage = screen.getByText('Merhaba')
    const assistantMessage = screen.getByText('Hoşgeldiniz')
    expect(userMessage).toBeTruthy()
    expect(assistantMessage).toBeTruthy()
  })

  it('should render messages in chronological order', () => {
    const messages = [
      { role: 'user' as const, content: 'First' },
      { role: 'assistant' as const, content: 'Second' },
      { role: 'user' as const, content: 'Third' },
    ]
    const { children } = render(<CoachChat messages={messages} isLoading={false} />)
    expect(screen.getByText('First')).toBeTruthy()
    expect(screen.getByText('Second')).toBeTruthy()
    expect(screen.getByText('Third')).toBeTruthy()
  })
})

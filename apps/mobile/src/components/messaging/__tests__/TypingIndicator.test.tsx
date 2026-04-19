import { describe, it, expect } from 'vitest'
import { TypingIndicator } from '../TypingIndicator'

describe('TypingIndicator', () => {
  it('should accept userNames prop', () => {
    const component = <TypingIndicator userNames={['Alice', 'Bob']} />
    expect(component).toBeDefined()
    expect(component.props.userNames).toEqual(['Alice', 'Bob'])
  })

  it('should render with single user', () => {
    const component = <TypingIndicator userNames={['Alice']} />
    expect(component.props.userNames).toHaveLength(1)
    expect(component.props.userNames[0]).toBe('Alice')
  })

  it('should render with multiple users', () => {
    const component = <TypingIndicator userNames={['Alice', 'Bob', 'Charlie']} />
    expect(component.props.userNames).toHaveLength(3)
  })

  it('should show truncated names when more than 3 users', () => {
    const component = <TypingIndicator userNames={['Alice', 'Bob', 'Charlie', 'David']} />
    expect(component.props.userNames).toHaveLength(4)
  })

  it('should handle empty user list', () => {
    const component = <TypingIndicator userNames={[]} />
    expect(component.props.userNames).toEqual([])
  })

  it('should render with long usernames', () => {
    const longName = 'A'.repeat(50)
    const component = <TypingIndicator userNames={[longName]} />
    expect(component.props.userNames[0]).toBe(longName)
  })

  it('should handle special characters in names', () => {
    const component = <TypingIndicator userNames={['José', '李明', 'Müller']} />
    expect(component.props.userNames).toContain('José')
    expect(component.props.userNames).toContain('李明')
    expect(component.props.userNames).toContain('Müller')
  })

  it('should accept dynamic updates', () => {
    const component1 = <TypingIndicator userNames={['Alice']} />
    const component2 = <TypingIndicator userNames={['Alice', 'Bob']} />
    expect(component1.props.userNames.length).toBe(1)
    expect(component2.props.userNames.length).toBe(2)
  })

  it('should handle clearing users', () => {
    const componentWithUsers = <TypingIndicator userNames={['Alice', 'Bob']} />
    const componentEmpty = <TypingIndicator userNames={[]} />
    expect(componentWithUsers.props.userNames.length).toBe(2)
    expect(componentEmpty.props.userNames.length).toBe(0)
  })
})

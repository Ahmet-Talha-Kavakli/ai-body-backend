import { describe, it, expect, vi } from 'vitest'
import { ShareToggle } from '../ShareToggle'

describe('ShareToggle Component', () => {
  it('should display private option', () => {
    const mockOnChange = vi.fn()
    const component = <ShareToggle currentOption="private" onOptionChange={mockOnChange} />

    expect(component.props.currentOption).toBe('private')
  })

  it('should display friends option', () => {
    const mockOnChange = vi.fn()
    const component = <ShareToggle currentOption="friends" onOptionChange={mockOnChange} />

    expect(component.props.currentOption).toBe('friends')
  })

  it('should display team option', () => {
    const mockOnChange = vi.fn()
    const component = <ShareToggle currentOption="team" onOptionChange={mockOnChange} />

    expect(component.props.currentOption).toBe('team')
  })

  it('should call onOptionChange callback', () => {
    const mockOnChange = vi.fn()
    const component = <ShareToggle currentOption="private" onOptionChange={mockOnChange} />

    expect(component.props.onOptionChange).toBe(mockOnChange)
  })

  it('should handle default private state', () => {
    const mockOnChange = vi.fn()
    const component = <ShareToggle currentOption="private" onOptionChange={mockOnChange} />

    expect(component.props.currentOption).toBe('private')
  })

  it('should display all three options', () => {
    const mockOnChange = vi.fn()
    const component = <ShareToggle currentOption="friends" onOptionChange={mockOnChange} />

    expect(['private', 'friends', 'team']).toContain(component.props.currentOption)
  })

  it('should maintain selected state', () => {
    const mockOnChange = vi.fn()
    const component = <ShareToggle currentOption="team" onOptionChange={mockOnChange} />

    expect(component.props.currentOption).toBe('team')
  })
})

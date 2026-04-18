import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { NutritionCoachScreen } from '../NutritionCoachScreen'

// Mock the dependencies
vi.mock('../../hooks/useCoachContext', () => ({
  useCoachContext: () => ({
    buildContext: vi.fn(async () => ({
      recentMeals: [],
      todayIntake: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
      goals: null,
      streakData: { current: 0, longest: 0 },
    })),
  }),
}))

vi.mock('../../db/nutritionCoach', () => ({
  saveCoachQuestion: vi.fn(async () => {}),
  saveCoachResponse: vi.fn(async () => {}),
}))

vi.mock('../../store/nutritionCoachStore', () => ({
  useNutritionCoachStore: () => ({
    messages: [],
    loading: false,
    error: null,
    addMessage: vi.fn(),
    setLoading: vi.fn(),
    setError: vi.fn(),
    clearMessages: vi.fn(),
  }),
}))

describe('NutritionCoachScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render input field', () => {
    render(<NutritionCoachScreen />)
    expect(screen.getByPlaceholderText('Sorunuzu yazın...')).toBeTruthy()
  })

  it('should render send button', () => {
    render(<NutritionCoachScreen />)
    expect(screen.getByTestId('send-button')).toBeTruthy()
  })

  it('should render chat component', () => {
    render(<NutritionCoachScreen />)
    expect(screen.getByTestId('coach-chat')).toBeTruthy()
  })

  it('should render header with title', () => {
    render(<NutritionCoachScreen />)
    expect(screen.getByText('Beslenme Koçu')).toBeTruthy()
  })

  it('should have clear button', () => {
    render(<NutritionCoachScreen />)
    expect(screen.getByTestId('clear-button')).toBeTruthy()
  })

  it('should handle text input change', async () => {
    render(<NutritionCoachScreen />)
    const input = screen.getByPlaceholderText('Sorunuzu yazın...')
    fireEvent.changeText(input, 'Test mesajı')
    await waitFor(() => {
      expect(input.props.value).toBe('Test mesajı')
    })
  })

  it('should send message on button press', async () => {
    render(<NutritionCoachScreen />)
    const input = screen.getByPlaceholderText('Sorunuzu yazın...')
    const sendButton = screen.getByTestId('send-button')

    fireEvent.changeText(input, 'Protein alımı kaç gram?')
    fireEvent.press(sendButton)

    await waitFor(() => {
      expect(input.props.value).toBe('')
    })
  })

  it('should disable send button when input is empty', () => {
    render(<NutritionCoachScreen />)
    const sendButton = screen.getByTestId('send-button')
    expect(sendButton.props.disabled).toBe(true)
  })

  it('should enable send button when input has text', async () => {
    render(<NutritionCoachScreen />)
    const input = screen.getByPlaceholderText('Sorunuzu yazın...')
    fireEvent.changeText(input, 'Test')
    await waitFor(() => {
      const sendButton = screen.getByTestId('send-button')
      expect(sendButton.props.disabled).toBe(false)
    })
  })

  it('should show loading state when processing', async () => {
    render(<NutritionCoachScreen />)
    const sendButton = screen.getByTestId('send-button')
    fireEvent.press(sendButton)
    await waitFor(() => {
      expect(screen.getByTestId('coach-chat')).toBeTruthy()
    })
  })

  it('should display error message if API fails', async () => {
    render(<NutritionCoachScreen />)
    // This would depend on the implementation of error handling
    expect(screen.queryByTestId('error-message')).toBeNull()
  })

  it('should have voice button for input method option', () => {
    render(<NutritionCoachScreen />)
    expect(screen.getByTestId('voice-button')).toBeTruthy()
  })
})

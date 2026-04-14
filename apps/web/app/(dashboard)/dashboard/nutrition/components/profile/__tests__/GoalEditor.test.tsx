// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GoalEditor } from '../GoalEditor'

const mockGoal = {
  dailyCalories: 2000,
  proteinG: 150,
  carbsG: 200,
  fatG: 70,
  waterGoalMl: 2500,
  fiberG: 25,
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ goal: mockGoal }),
    })
  )
})

describe('GoalEditor', () => {
  it('renders all goal fields', async () => {
    render(<GoalEditor initialGoal={mockGoal} />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('2000')).toBeTruthy()
      expect(screen.getByDisplayValue('150')).toBeTruthy()
      expect(screen.getByDisplayValue('200')).toBeTruthy()
      expect(screen.getByDisplayValue('70')).toBeTruthy()
    })
  })

  it('shows save button when a value changes', async () => {
    render(<GoalEditor initialGoal={mockGoal} />)
    await waitFor(() => expect(screen.getByDisplayValue('2000')).toBeTruthy())
    const calorieInput = screen.getByDisplayValue('2000')
    fireEvent.change(calorieInput, { target: { value: '2200' } })
    await waitFor(() => {
      expect(screen.getByText(/Kaydet/i)).toBeTruthy()
    })
  })

  it('calls PUT /api/nutrition/goal on save', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ goal: mockGoal }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ goal: { ...mockGoal, dailyCalories: 2200 } }),
      })
    vi.stubGlobal('fetch', mockFetch)

    render(<GoalEditor initialGoal={mockGoal} />)
    await waitFor(() => expect(screen.getByDisplayValue('2000')).toBeTruthy())
    const calorieInput = screen.getByDisplayValue('2000')
    fireEvent.change(calorieInput, { target: { value: '2200' } })

    const saveBtn = await screen.findByText(/Kaydet/i)
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/nutrition/goal',
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })
})

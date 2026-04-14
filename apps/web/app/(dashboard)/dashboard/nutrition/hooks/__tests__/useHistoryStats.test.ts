// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useHistoryStats } from '../useHistoryStats'

const mockStats = {
  daily: [{ date: '2026-04-01', calories: 2000, protein: 150, carbs: 200, fat: 70 }],
  goal: { dailyCalories: 2000, proteinG: 150, carbsG: 200, fatG: 70 },
  goalHitPercent: 80,
  topFoods: [{ name: 'Apple', count: 3, avgCalories: 80 }],
  mealTiming: { breakfast: 400, lunch: 600, dinner: 800, snack: 200 },
  streakCalendar: { '2026-04-01': true },
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockStats,
    })
  )
})

describe('useHistoryStats', () => {
  it('starts with loading true', () => {
    const { result } = renderHook(() => useHistoryStats())
    expect(result.current.loading).toBe(true)
  })

  it('fetches and returns stats', async () => {
    const { result } = renderHook(() => useHistoryStats())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.stats?.goalHitPercent).toBe(80)
    expect(result.current.stats?.topFoods[0].name).toBe('Apple')
  })

  it('sets error on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const { result } = renderHook(() => useHistoryStats())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeTruthy()
  })
})

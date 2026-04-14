// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useMealTemplates } from '../useMealTemplates'

const mockTemplates = [
  {
    id: 'tpl_1',
    name: 'High Protein',
    mealType: 'breakfast',
    totalCalories: 450,
    totalProteinG: 40,
    totalCarbsG: 30,
    totalFatG: 15,
    items: [],
    createdAt: '2026-04-14',
  },
]

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ templates: mockTemplates }),
    })
  )
})

describe('useMealTemplates', () => {
  it('starts loading', () => {
    const { result } = renderHook(() => useMealTemplates())
    expect(result.current.loading).toBe(true)
  })

  it('loads templates', async () => {
    const { result } = renderHook(() => useMealTemplates())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.templates).toHaveLength(1)
    expect(result.current.templates[0].name).toBe('High Protein')
  })

  it('deleteTemplate removes from list optimistically', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ templates: mockTemplates }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
    )
    const { result } = renderHook(() => useMealTemplates())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deleteTemplate('tpl_1')
    })
    expect(result.current.templates).toHaveLength(0)
  })
})

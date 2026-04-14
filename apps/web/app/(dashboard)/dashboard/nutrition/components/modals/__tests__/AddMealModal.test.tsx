// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AddMealModal } from '../AddMealModal'

const mockTemplates = [
  {
    id: 'tpl_1',
    name: 'Yüksek Proteinli Kahvaltı',
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

describe('AddMealModal — Şablonlar sekmesi', () => {
  it('renders Şablonlar tab button', async () => {
    render(<AddMealModal open={true} onClose={vi.fn()} onSave={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('Şablonlar')).toBeTruthy()
    })
  })

  it('switches to templates tab and shows template list', async () => {
    render(<AddMealModal open={true} onClose={vi.fn()} onSave={vi.fn()} />)
    const tabBtn = await screen.findByText('Şablonlar')
    fireEvent.click(tabBtn)
    await waitFor(() => {
      expect(screen.getByText('Yüksek Proteinli Kahvaltı')).toBeTruthy()
    })
  })

  it('clicking template calls onSave with correct data', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<AddMealModal open={true} onClose={vi.fn()} onSave={onSave} />)
    const tabBtn = await screen.findByText('Şablonlar')
    fireEvent.click(tabBtn)
    const tplBtn = await screen.findByText('Yüksek Proteinli Kahvaltı')
    fireEvent.click(tplBtn)
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Yüksek Proteinli Kahvaltı',
          calories: 450,
          protein: 40,
          carbs: 30,
          fat: 15,
          mealType: 'breakfast',
        })
      )
    })
  })
})

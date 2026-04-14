// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { WaterWave } from '../WaterWave'

// Mock framer-motion useAnimationFrame to avoid RAF issues in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return { ...actual, useAnimationFrame: vi.fn() }
})

describe('WaterWave', () => {
  it('renders without crashing', () => {
    const { container } = render(<WaterWave percentage={50} amountMl={1250} goalMl={2500} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('shows correct amount text', () => {
    const { getByText } = render(<WaterWave percentage={50} amountMl={1250} goalMl={2500} />)
    expect(getByText('1250 ml')).toBeTruthy()
  })

  it('shows 0% fill when empty', () => {
    const { container } = render(<WaterWave percentage={0} amountMl={0} goalMl={2500} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('shows 100% fill when goal met', () => {
    const { getByText } = render(<WaterWave percentage={100} amountMl={2500} goalMl={2500} />)
    expect(getByText('🎉 Hedefe ulaştın!')).toBeTruthy()
  })
})

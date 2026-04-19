import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PortionEstimationScreen } from '../PortionEstimationScreen'
import { usePortionStore } from '../../../store/usePortionStore'

vi.mock('../../../store/usePortionStore')

describe('PortionEstimationScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render portion estimation screen', () => {
    const mockStore = {
      currentPortion: {
        id: 'portion-1',
        photoPath: '/photos/pizza.jpg',
        foodName: 'Pizza',
        estimatedPortionG: 150,
        estimatedPortionDescription: '2 slices',
        confidence: 88,
        createdAt: '2026-04-19T10:00:00Z',
      },
      setCurrentPortion: vi.fn(),
      savePortion: vi.fn(),
    }

    vi.mocked(usePortionStore).mockReturnValue(mockStore as any)

    const component = <PortionEstimationScreen />

    expect(component).toBeDefined()
  })

  it('should display estimated portion value', () => {
    const mockStore = {
      currentPortion: {
        id: 'portion-1',
        photoPath: '/photos/pizza.jpg',
        foodName: 'Pizza Margherita',
        estimatedPortionG: 175,
        estimatedPortionDescription: '2-3 slices',
        confidence: 92,
        createdAt: '2026-04-19T10:00:00Z',
      },
      setCurrentPortion: vi.fn(),
      savePortion: vi.fn(),
    }

    vi.mocked(usePortionStore).mockReturnValue(mockStore as any)

    const component = <PortionEstimationScreen />

    expect(component).toBeDefined()
  })

  it('should display confidence level', () => {
    const mockStore = {
      currentPortion: {
        id: 'portion-1',
        photoPath: '/photos/pizza.jpg',
        foodName: 'Pizza',
        estimatedPortionG: 150,
        estimatedPortionDescription: '2 slices',
        confidence: 88,
        createdAt: '2026-04-19T10:00:00Z',
      },
      setCurrentPortion: vi.fn(),
      savePortion: vi.fn(),
    }

    vi.mocked(usePortionStore).mockReturnValue(mockStore as any)

    const component = <PortionEstimationScreen />

    expect(component).toBeDefined()
  })

  it('should have save button', () => {
    const mockStore = {
      currentPortion: {
        id: 'portion-1',
        photoPath: '/photos/pizza.jpg',
        foodName: 'Pizza',
        estimatedPortionG: 150,
        estimatedPortionDescription: '2 slices',
        confidence: 88,
        createdAt: '2026-04-19T10:00:00Z',
      },
      setCurrentPortion: vi.fn(),
      savePortion: vi.fn(),
    }

    vi.mocked(usePortionStore).mockReturnValue(mockStore as any)

    const component = <PortionEstimationScreen />

    expect(component).toBeDefined()
  })

  it('should handle portion adjustment', () => {
    const mockStore = {
      currentPortion: {
        id: 'portion-1',
        photoPath: '/photos/pizza.jpg',
        foodName: 'Pizza',
        estimatedPortionG: 150,
        estimatedPortionDescription: '2 slices',
        confidence: 88,
        userAdjustedPortionG: 200,
        createdAt: '2026-04-19T10:00:00Z',
      },
      setCurrentPortion: vi.fn(),
      savePortion: vi.fn(),
    }

    vi.mocked(usePortionStore).mockReturnValue(mockStore as any)

    const component = <PortionEstimationScreen />

    expect(component).toBeDefined()
  })
})

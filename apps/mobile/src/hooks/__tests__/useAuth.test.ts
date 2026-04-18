import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { useAuth } from '../useAuth'

// Mock the dependencies
vi.mock('../../store/authStore')
vi.mock('../../store/userStore')
vi.mock('../../api/client')
vi.mock('../../utils/tokenStorage')

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with loading state', async () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.isInitializing).toBe(true)
  })

  it('should have sign in and sign out methods', () => {
    const { result } = renderHook(() => useAuth())

    expect(typeof result.current.signIn).toBe('function')
    expect(typeof result.current.signOut).toBe('function')
  })

  it('should spread auth store properties', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current).toHaveProperty('isSignedIn')
    expect(result.current).toHaveProperty('token')
    expect(result.current).toHaveProperty('user')
  })
})

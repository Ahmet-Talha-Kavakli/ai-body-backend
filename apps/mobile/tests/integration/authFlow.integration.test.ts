import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useAuth } from '../../src/hooks/useAuth'
import { useUserProfile } from '../../src/hooks/useUserProfile'

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with signed out state', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.isSignedIn).toBe(false)
    expect(result.current.isInitializing).toBe(true)
  })

  it('should have signIn function defined', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.signIn).toBeDefined()
    expect(typeof result.current.signIn).toBe('function')
  })

  it('should have signOut function defined', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.signOut).toBeDefined()
    expect(typeof result.current.signOut).toBe('function')
  })

  it('should fetch user profile when requested', async () => {
    const { result } = renderHook(() => useUserProfile('user_123'))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.refetch).toBeDefined()
  })

  it('should have updateProfile function', () => {
    const { result } = renderHook(() => useUserProfile('user_123'))

    expect(result.current.updateProfile).toBeDefined()
    expect(typeof result.current.updateProfile).toBe('function')
  })
})

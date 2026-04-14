// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useNotifications } from '../useNotifications'

describe('useNotifications', () => {
  it('returns supported=false when Notification API unavailable', () => {
    Object.defineProperty(global, 'Notification', { value: undefined, configurable: true })
    const { result } = renderHook(() => useNotifications())
    expect(result.current.supported).toBe(false)
  })

  it('returns supported=true when Notification API available', () => {
    Object.defineProperty(global, 'Notification', {
      value: { permission: 'default', requestPermission: vi.fn() },
      configurable: true,
    })
    Object.defineProperty(global.navigator, 'serviceWorker', { value: {}, configurable: true })
    const { result } = renderHook(() => useNotifications())
    expect(result.current.supported).toBe(true)
  })
})

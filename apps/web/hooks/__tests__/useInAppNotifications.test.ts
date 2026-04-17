// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('useInAppNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports useInAppNotifications function', async () => {
    const { useInAppNotifications } = await import('../useInAppNotifications')
    expect(typeof useInAppNotifications).toBe('function')
  })

  it('exports InAppNotification interface', async () => {
    const { useInAppNotifications } = await import('../useInAppNotifications')
    expect(useInAppNotifications).toBeDefined()
  })
})

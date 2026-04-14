import { describe, it, expect, vi } from 'vitest'

// fetch'i mock'la
global.fetch = vi.fn()

describe('getTempBonusMl', () => {
  it('returns 0 for cold weather (<15°C)', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ results: [{ latitude: 41.01, longitude: 28.97 }] }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ current: { temperature_2m: 10 } }),
      })

    const { getTempBonusMl } = await import('../weather')
    const result = await getTempBonusMl('Istanbul')
    expect(result).toBe(0)
  })

  it('returns 200 for moderate weather (15-25°C)', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ results: [{ latitude: 41.01, longitude: 28.97 }] }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ current: { temperature_2m: 20 } }),
      })

    const { getTempBonusMl } = await import('../weather')
    const result = await getTempBonusMl('Istanbul')
    expect(result).toBe(200)
  })

  it('returns 400 for hot weather (25-35°C)', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ results: [{ latitude: 41.01, longitude: 28.97 }] }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ current: { temperature_2m: 30 } }),
      })

    const { getTempBonusMl } = await import('../weather')
    const result = await getTempBonusMl('Istanbul')
    expect(result).toBe(400)
  })

  it('returns 600 for very hot weather (>35°C)', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ results: [{ latitude: 41.01, longitude: 28.97 }] }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ current: { temperature_2m: 38 } }),
      })

    const { getTempBonusMl } = await import('../weather')
    const result = await getTempBonusMl('Istanbul')
    expect(result).toBe(600)
  })

  it('returns null when city not found', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve({ results: [] }),
    })

    const { getTempBonusMl } = await import('../weather')
    const result = await getTempBonusMl('XYZUnknownCity')
    expect(result).toBeNull()
  })
})

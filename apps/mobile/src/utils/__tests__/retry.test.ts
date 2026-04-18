import { describe, it, expect, vi } from 'vitest'
import { retryWithExponentialBackoff } from '../retry'

describe('retry', () => {
  describe('retryWithExponentialBackoff', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success')

      const result = await retryWithExponentialBackoff(fn, 3)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const fn = vi.fn()
      fn.mockRejectedValueOnce(new Error('fail'))
      fn.mockRejectedValueOnce(new Error('fail'))
      fn.mockResolvedValueOnce('success')

      const result = await retryWithExponentialBackoff(fn, 3)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should throw error after max attempts', async () => {
      const error = new Error('persistent failure')
      const fn = vi.fn().mockRejectedValue(error)

      await expect(retryWithExponentialBackoff(fn, 2)).rejects.toThrow('persistent failure')

      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should use default max attempts of 3', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'))

      await expect(retryWithExponentialBackoff(fn)).rejects.toThrow()

      expect(fn).toHaveBeenCalledTimes(3)
    })
  })
})

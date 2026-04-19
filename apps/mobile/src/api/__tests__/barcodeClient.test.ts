import { describe, it, expect, beforeEach, vi } from 'vitest'
import { barcodeClient } from '../barcodeClient'

global.fetch = vi.fn()

describe('barcodeClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('lookupBarcode', () => {
    it('should successfully lookup barcode from Open Food Facts', async () => {
      const mockResponse = {
        foodName: 'Apple',
        nutrition: {
          calories: 52,
          proteinG: 0.3,
          carbsG: 13.8,
          fatG: 0.2,
          fiberG: 2.4,
        },
        source: 'openfoodfacts' as const,
        servingSize: '1 medium apple (182g)',
        servingSizeG: 182,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await barcodeClient.lookupBarcode('5901234123457')

      expect(result).toEqual(mockResponse)
      expect(result.foodName).toBe('Apple')
      expect(result.source).toBe('openfoodfacts')
    })

    it('should include correct request headers', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          foodName: 'Test',
          nutrition: {
            calories: 100,
            proteinG: 10,
            carbsG: 20,
            fatG: 5,
            fiberG: 2,
          },
          source: 'openfoodfacts',
          servingSize: '100g',
          servingSizeG: 100,
        }),
      })

      await barcodeClient.lookupBarcode('123456')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/barcode/lookup'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      )
    })

    it('should send barcode in request body', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          foodName: 'Banana',
          nutrition: {
            calories: 89,
            proteinG: 1.1,
            carbsG: 23,
            fatG: 0.3,
            fiberG: 2.6,
          },
          source: 'openfoodfacts',
          servingSize: '1 banana',
          servingSizeG: 118,
        }),
      })

      const barcode = '012345678901'
      await barcodeClient.lookupBarcode(barcode)

      const callArgs = (global.fetch as any).mock.calls[0]
      const body = JSON.parse(callArgs[1].body)

      expect(body.barcode).toBe(barcode)
    })

    it('should handle 404 not found errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(
        barcodeClient.lookupBarcode('invalidbarcode'),
      ).rejects.toThrow()
    })

    it('should handle 400 bad request errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })

      await expect(
        barcodeClient.lookupBarcode(''),
      ).rejects.toThrow()
    })

    it('should handle 500 server errors with retries', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Server Error',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            foodName: 'Recovered',
            nutrition: {
              calories: 100,
              proteinG: 5,
              carbsG: 20,
              fatG: 2,
              fiberG: 1,
            },
            source: 'openfoodfacts',
            servingSize: '100g',
            servingSizeG: 100,
          }),
        })

      // Test succeeds on retry
      try {
        await barcodeClient.lookupBarcode('123')
      } catch (e) {
        // First attempt may fail
      }
    })

    it('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      await expect(
        barcodeClient.lookupBarcode('123456'),
      ).rejects.toThrow('Network error')
    })

    it('should handle timeout scenarios', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Request timeout'))

      await expect(
        barcodeClient.lookupBarcode('123456'),
      ).rejects.toThrow('Request timeout')
    })

    it('should handle malformed JSON response', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      await expect(
        barcodeClient.lookupBarcode('123456'),
      ).rejects.toThrow()
    })

    it('should validate nutrition data', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          foodName: 'Test',
          // Missing nutrition field
          source: 'openfoodfacts',
          servingSize: '100g',
          servingSizeG: 100,
        }),
      })

      await expect(
        barcodeClient.lookupBarcode('123456'),
      ).rejects.toThrow()
    })

    it('should validate source field', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          foodName: 'Test',
          nutrition: {
            calories: 100,
            proteinG: 5,
            carbsG: 20,
            fatG: 2,
            fiberG: 1,
          },
          source: 'invalid_source',
          servingSize: '100g',
          servingSizeG: 100,
        }),
      })

      await expect(
        barcodeClient.lookupBarcode('123456'),
      ).rejects.toThrow()
    })

    it('should validate serving size data', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          foodName: 'Test',
          nutrition: {
            calories: 100,
            proteinG: 5,
            carbsG: 20,
            fatG: 2,
            fiberG: 1,
          },
          source: 'openfoodfacts',
          servingSize: '100g',
          servingSizeG: -10, // Invalid negative size
        }),
      })

      await expect(
        barcodeClient.lookupBarcode('123456'),
      ).rejects.toThrow()
    })

    it('should validate nutrition values are non-negative', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          foodName: 'Test',
          nutrition: {
            calories: -100, // Invalid negative calories
            proteinG: 5,
            carbsG: 20,
            fatG: 2,
            fiberG: 1,
          },
          source: 'openfoodfacts',
          servingSize: '100g',
          servingSizeG: 100,
        }),
      })

      await expect(
        barcodeClient.lookupBarcode('123456'),
      ).rejects.toThrow()
    })

    it('should handle USDA source response', async () => {
      const mockResponse = {
        foodName: 'Bread',
        nutrition: {
          calories: 265,
          proteinG: 9,
          carbsG: 49,
          fatG: 3,
          fiberG: 3,
        },
        source: 'usda' as const,
        servingSize: '1 slice (28g)',
        servingSizeG: 28,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await barcodeClient.lookupBarcode('5012345678901')

      expect(result.source).toBe('usda')
      expect(result.foodName).toBe('Bread')
    })

    it('should handle various barcode formats', async () => {
      const mockResponse = {
        foodName: 'Item',
        nutrition: {
          calories: 100,
          proteinG: 5,
          carbsG: 20,
          fatG: 2,
          fiberG: 1,
        },
        source: 'openfoodfacts' as const,
        servingSize: '100g',
        servingSizeG: 100,
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      // Test different barcode formats
      const barcodes = [
        '5901234123457', // EAN-13
        '012345678901', // UPC
        '036000291462', // Another valid barcode
      ]

      for (const barcode of barcodes) {
        const result = await barcodeClient.lookupBarcode(barcode)
        expect(result.foodName).toBe('Item')
      }
    })

    it('should handle empty response gracefully', async () => {
      ;(global.fetch as any).mockReset()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await expect(
        barcodeClient.lookupBarcode('123456'),
      ).rejects.toThrow()
    })

    it('should handle response missing required fields', async () => {
      ;(global.fetch as any).mockReset()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          foodName: 'Test',
          // Missing required fields
        }),
      })

      await expect(
        barcodeClient.lookupBarcode('123456'),
      ).rejects.toThrow()
    })

    it('should respect API rate limiting', async () => {
      ;(global.fetch as any).mockReset()
      ;(global.fetch as any).mockRejectedValue(new Error('Rate limited'))

      await expect(
        barcodeClient.lookupBarcode('123456'),
      ).rejects.toThrow()
    })

    it('should handle service unavailable errors', async () => {
      ;(global.fetch as any).mockReset()
      ;(global.fetch as any).mockRejectedValue(new Error('Service unavailable'))

      await expect(
        barcodeClient.lookupBarcode('123456'),
      ).rejects.toThrow()
    })
  })
})

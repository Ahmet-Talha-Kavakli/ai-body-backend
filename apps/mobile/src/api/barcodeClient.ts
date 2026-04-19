/**
 * Barcode Lookup API Client
 *
 * Handles barcode lookups against Open Food Facts and USDA databases.
 * Includes fallback, error handling, and response validation.
 */

import type { BarcodeLookupRequest, BarcodeLookupResponse, Nutrition } from '../types/barcode'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
const MAX_RETRIES = 3
const INITIAL_DELAY = 1000

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  return INITIAL_DELAY * Math.pow(2, attempt - 1)
}

/**
 * Barcode Lookup API Client
 */
export const barcodeClient = {
  /**
   * Lookup a barcode against Open Food Facts and USDA databases
   * @param barcode - The barcode to lookup
   * @returns Promise with barcode lookup results
   * @throws Error if lookup fails or validation fails
   */
  async lookupBarcode(barcode: string): Promise<BarcodeLookupResponse> {
    const request: BarcodeLookupRequest = { barcode }

    let lastError: Error | null = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/barcode/lookup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })

        if (!response.ok) {
          const errorMessage = `HTTP ${response.status}: ${response.statusText}`
          throw new Error(errorMessage)
        }

        const data = await response.json()
        return this.validateResponse(data)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // If this is the last attempt, throw the error
        if (attempt === MAX_RETRIES - 1) {
          throw lastError
        }

        // Wait before retrying
        const delay = getRetryDelay(attempt + 1)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    // Should never reach here
    throw lastError || new Error('Failed to lookup barcode')
  },

  /**
   * Validate API response data
   */
  validateResponse(data: unknown): BarcodeLookupResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response: expected object')
    }

    const response = data as Record<string, unknown>

    // Validate foodName
    if (typeof response.foodName !== 'string' || !response.foodName.trim()) {
      throw new Error('Invalid response: foodName must be a non-empty string')
    }

    // Validate nutrition
    if (!response.nutrition || typeof response.nutrition !== 'object') {
      throw new Error('Invalid response: nutrition object required')
    }

    const nutrition = response.nutrition as Record<string, unknown>

    if (
      typeof nutrition.calories !== 'number' ||
      typeof nutrition.proteinG !== 'number' ||
      typeof nutrition.carbsG !== 'number' ||
      typeof nutrition.fatG !== 'number' ||
      typeof nutrition.fiberG !== 'number'
    ) {
      throw new Error('Invalid response: nutrition values must be numbers')
    }

    // Validate nutrition values are non-negative
    if (
      nutrition.calories < 0 ||
      nutrition.proteinG < 0 ||
      nutrition.carbsG < 0 ||
      nutrition.fatG < 0 ||
      nutrition.fiberG < 0
    ) {
      throw new Error('Invalid response: nutrition values cannot be negative')
    }

    // Validate source
    if (response.source !== 'openfoodfacts' && response.source !== 'usda') {
      throw new Error('Invalid response: source must be openfoodfacts or usda')
    }

    // Validate servingSize
    if (typeof response.servingSize !== 'string' || !response.servingSize.trim()) {
      throw new Error('Invalid response: servingSize must be a non-empty string')
    }

    // Validate servingSizeG
    if (typeof response.servingSizeG !== 'number' || response.servingSizeG <= 0) {
      throw new Error('Invalid response: servingSizeG must be greater than 0')
    }

    return {
      foodName: response.foodName as string,
      nutrition: response.nutrition as Nutrition,
      source: response.source as 'openfoodfacts' | 'usda',
      servingSize: response.servingSize as string,
      servingSizeG: response.servingSizeG as number,
    }
  },
}

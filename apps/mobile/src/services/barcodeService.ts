import { BarcodeResult, BarcodeLookupResponse } from '../types/barcode'
import { barcodeClient } from '../api/barcodeClient'
import * as barcodeDb from '../db/barcodes'

/**
 * Barcode Service
 *
 * Handles barcode scanning, caching, and expiration logic
 * Supports Open Food Facts and USDA databases
 */

/**
 * Scan a barcode and lookup nutritional information
 * Returns cached result if available and not expired
 * Otherwise queries Open Food Facts or USDA API
 */
async function scanBarcode(barcode: string): Promise<BarcodeResult> {
  // Try to get from cache first
  const cached = await getBarcodeFromCache(barcode)
  if (cached) {
    return cached
  }

  // Query API
  const apiResponse = await barcodeClient.lookupBarcode(barcode)

  // Cache the result
  const result = await barcodeDb.createOrUpdateBarcode({
    barcode,
    foodName: apiResponse.foodName,
    nutrition: apiResponse.nutrition,
    source: apiResponse.source,
    servingSize: apiResponse.servingSize,
    servingSizeG: apiResponse.servingSizeG,
  })

  return result
}

/**
 * Get barcode from cache if available and not expired
 * Returns null if not found or expired
 */
async function getBarcodeFromCache(barcode: string): Promise<BarcodeResult | null> {
  const cached = await barcodeDb.getBarcode(barcode)

  if (!cached) {
    return null
  }

  // Check if cache is still valid (30 days)
  const expiresAt = new Date(cached.expiresAt)
  const now = new Date()

  if (now > expiresAt) {
    return null
  }

  return cached
}

/**
 * Delete all expired barcode cache entries
 * Returns count of deleted entries
 */
async function deleteExpiredBarcodes(): Promise<number> {
  return barcodeDb.deleteExpiredBarcodes()
}

/**
 * Clear all barcode cache
 * Returns count of deleted entries
 */
async function clearBarcodeCache(): Promise<number> {
  return barcodeDb.deleteAllBarcodes()
}

export const barcodeService = {
  scanBarcode,
  getBarcodeFromCache,
  deleteExpiredBarcodes,
  clearBarcodeCache,
}

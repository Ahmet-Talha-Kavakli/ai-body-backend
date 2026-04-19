/**
 * Barcode Scanning Types
 *
 * Handles barcode lookup and food database integration
 * Supports Open Food Facts and USDA databases
 */

/**
 * Nutrition information from barcode lookup
 */
export interface Nutrition {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
}

/**
 * Result from barcode lookup
 */
export interface BarcodeResult {
  /** Unique identifier for the barcode record */
  id: string

  /** Barcode value (EAN-13, UPC, etc.) */
  barcode: string

  /** Food name from barcode database */
  foodName: string

  /** Nutrition information per serving */
  nutrition: Nutrition

  /** Data source (openfoodfacts or usda) */
  source: 'openfoodfacts' | 'usda'

  /** Serving size description */
  servingSize: string

  /** Serving size in grams */
  servingSizeG: number

  /** ISO timestamp when cached */
  cachedAt: string

  /** ISO timestamp when cache expires (30 days) */
  expiresAt: string
}

/**
 * Request payload for barcode lookup
 */
export interface BarcodeLookupRequest {
  barcode: string
}

/**
 * Response from barcode lookup API
 */
export interface BarcodeLookupResponse {
  foodName: string
  nutrition: Nutrition
  source: 'openfoodfacts' | 'usda'
  servingSize: string
  servingSizeG: number
}

/**
 * Meal suggestion based on scanned barcodes
 */
export interface MealSuggestion {
  id: string
  userId: string
  mealName: string
  nutrition: Nutrition
  reasonForSuggestion: string
  createdAt: string
  expiresAt: string
}

/**
 * Shared meal record
 */
export interface SharedMeal {
  id: string
  mealLogId: string
  userId: string
  shareType: 'friend' | 'group' | 'public'
  sharedWith: string[] // Array of user IDs or group IDs
  createdAt: string
}

/**
 * Database row for barcode results
 */
export interface BarcodeResultRow {
  id: string
  barcode: string
  foodName: string
  nutrition: string // JSON stringified
  source: 'openfoodfacts' | 'usda'
  servingSize: string
  servingSizeG: number
  cachedAt: string
  expiresAt: string
}

/**
 * Database row for meal suggestions
 */
export interface MealSuggestionRow {
  id: string
  userId: string
  mealName: string
  nutrition: string // JSON stringified
  reasonForSuggestion: string
  createdAt: string
  expiresAt: string
}

/**
 * Database row for shared meals
 */
export interface SharedMealRow {
  id: string
  mealLogId: string
  userId: string
  shareType: 'friend' | 'group' | 'public'
  sharedWith: string // JSON stringified array
  createdAt: string
}

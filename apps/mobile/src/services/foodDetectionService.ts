import { foodDetectionClient } from '../api/foodDetectionClient'
import type { FoodDetectionResult } from '../types/ar'

const CONFIDENCE_THRESHOLD = 0.7 // 70%

// Export for testing purposes
export let _lastDetection: FoodDetectionResult | null = null
let realTimeCallback: ((detection: FoodDetectionResult) => void) | null = null

export const foodDetectionService = {
  // Test utility function
  _resetState(): void {
    _lastDetection = null
    realTimeCallback = null
  },

  async detectFromPhoto(
    photoPath: string
  ): Promise<FoodDetectionResult | null> {
    // Read image file and convert to Uint8Array
    const imageData = await this._readImageFile(photoPath)

    // Call detection API
    const detections = await foodDetectionClient.detectFood(imageData)

    if (!detections || detections.length === 0) {
      return null
    }

    // Filter by confidence threshold and select highest confidence
    const filtered = detections.filter(
      (d) => d.confidence / 100 > CONFIDENCE_THRESHOLD
    )

    if (filtered.length === 0) {
      return null
    }

    // Sort by confidence descending and return highest
    const best = filtered.sort((a, b) => b.confidence - a.confidence)[0]

    // Store as last detection
    _lastDetection = best

    return best
  },

  startRealTimeDetection(
    callback: (detection: FoodDetectionResult) => void
  ): () => void {
    realTimeCallback = callback

    // Return unsubscribe function
    return () => {
      realTimeCallback = null
    }
  },

  getLastDetection(): FoodDetectionResult | null {
    return _lastDetection
  },

  async _readImageFile(filePath: string): Promise<Uint8Array> {
    // In React Native, use appropriate file reading based on platform
    // For now, return minimal implementation
    // Real implementation would use:
    // - FileSystem.readAsStringAsync + base64 decode on Expo
    // - fs module on Node
    const dummyData = new Uint8Array([0, 0, 0, 0])
    return dummyData
  },
}

/**
 * Pose Detection Service
 * High-level API for pose detection and form analysis
 */

import { MediaPipeProcessor, MediaPipeResult, ProcessedPoseFrame } from '../ml/mediapipe-processor'
import { Keypoint } from '../types/form-analysis'

export class PoseDetectionService {
  private processor: MediaPipeProcessor

  constructor(frameWidth: number = 640, frameHeight: number = 480) {
    this.processor = new MediaPipeProcessor(frameWidth, frameHeight)
  }

  /**
   * Process a pose detection result
   *
   * @param result - Raw MediaPipe pose result
   * @returns Processed frame with angles and analysis
   */
  public processPoseFrame(result: MediaPipeResult): ProcessedPoseFrame {
    return this.processor.processPose(result)
  }

  /**
   * Detect pose from frame data
   *
   * @param frameData - Image frame data
   * @returns Detected keypoints
   */
  public async detectPose(frameData: unknown): Promise<Keypoint[]> {
    return this.processor.detectPose(frameData)
  }

  /**
   * Set confidence threshold
   *
   * @param threshold - Confidence threshold (0-1)
   */
  public setConfidenceThreshold(threshold: number): void {
    this.processor.setMinConfidence(threshold)
  }

  /**
   * Get processor instance for advanced usage
   *
   * @returns The underlying MediaPipeProcessor
   */
  public getProcessor(): MediaPipeProcessor {
    return this.processor
  }

  /**
   * Reset service state
   */
  public reset(): void {
    this.processor.resetFrameCount()
  }
}

// Export singleton instance for module-wide usage
export const poseDetectionService = new PoseDetectionService()

/**
 * Camera Hook
 * Handles camera setup and frame capture at 30 FPS
 * Integrates with Expo Camera for real-time pose detection
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { Camera } from 'expo-camera'
import { Keypoint } from '../types/form-analysis'

export interface CameraFrame {
  uri: string
  width: number
  height: number
  timestamp: number
  base64?: string
}

export interface UseCameraOptions {
  targetFps?: number
  facing?: 'front' | 'back'
  autoStart?: boolean
  quality?: number // 0-1
}

export interface UseCameraReturn {
  isActive: boolean
  isCameraReady: boolean
  currentFrame: CameraFrame | null
  permissionStatus: Camera.PermissionStatus | null
  startCamera: () => Promise<void>
  stopCamera: () => Promise<void>
  captureFrame: () => Promise<CameraFrame | null>
  permissionRequested: boolean
}

const DEFAULT_FPS = 30
const FRAME_INTERVAL = 1000 / DEFAULT_FPS

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const targetFps = options.targetFps ?? DEFAULT_FPS
  const facing = options.facing ?? 'front'
  const autoStart = options.autoStart ?? false
  const quality = options.quality ?? 0.7

  const [isActive, setIsActive] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [currentFrame, setCurrentFrame] = useState<CameraFrame | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<Camera.PermissionStatus | null>(null)
  const [permissionRequested, setPermissionRequested] = useState(false)

  const cameraRef = useRef<Camera | null>(null)
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastFrameTimeRef = useRef<number>(0)

  /**
   * Request camera permissions
   */
  const requestCameraPermission = useCallback(async () => {
    try {
      setPermissionRequested(true)
      const { status } = await Camera.requestCameraPermissionsAsync()
      setPermissionStatus(status)
      return status === 'granted'
    } catch (error) {
      console.error('Failed to request camera permission:', error)
      return false
    }
  }, [])

  /**
   * Check camera permissions
   */
  const checkCameraPermission = useCallback(async () => {
    try {
      const { status } = await Camera.getCameraPermissionsAsync()
      setPermissionStatus(status)
      return status === 'granted'
    } catch (error) {
      console.error('Failed to check camera permission:', error)
      return false
    }
  }, [])

  /**
   * Start camera and frame capture
   */
  const startCamera = useCallback(async () => {
    try {
      // Check permission
      let hasPermission = await checkCameraPermission()

      if (!hasPermission) {
        hasPermission = await requestCameraPermission()
      }

      if (!hasPermission) {
        console.error('Camera permission denied')
        return
      }

      setIsActive(true)

      // Start frame capture interval
      lastFrameTimeRef.current = Date.now()
      captureIntervalRef.current = setInterval(async () => {
        if (cameraRef.current) {
          try {
            const photo = await cameraRef.current.takePictureAsync({
              quality: quality,
              base64: false,
              skipProcessing: false,
            })

            const frame: CameraFrame = {
              uri: photo.uri,
              width: photo.width,
              height: photo.height,
              timestamp: Date.now(),
            }

            setCurrentFrame(frame)
            lastFrameTimeRef.current = Date.now()
          } catch (error) {
            console.error('Failed to capture frame:', error)
          }
        }
      }, FRAME_INTERVAL)
    } catch (error) {
      console.error('Failed to start camera:', error)
    }
  }, [checkCameraPermission, requestCameraPermission, quality])

  /**
   * Stop camera
   */
  const stopCamera = useCallback(async () => {
    try {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current)
        captureIntervalRef.current = null
      }

      setIsActive(false)
      setCurrentFrame(null)
    } catch (error) {
      console.error('Failed to stop camera:', error)
    }
  }, [])

  /**
   * Manually capture a single frame
   */
  const captureFrame = useCallback(async (): Promise<CameraFrame | null> => {
    try {
      if (!cameraRef.current) {
        return null
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: quality,
        base64: true,
        skipProcessing: false,
      })

      const frame: CameraFrame = {
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        timestamp: Date.now(),
        base64: photo.base64,
      }

      return frame
    } catch (error) {
      console.error('Failed to capture frame:', error)
      return null
    }
  }, [quality])

  /**
   * Auto-start camera if enabled
   */
  useEffect(() => {
    if (autoStart) {
      startCamera()
    }

    return () => {
      stopCamera()
    }
  }, [autoStart, startCamera, stopCamera])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current)
      }
    }
  }, [])

  return {
    isActive,
    isCameraReady,
    currentFrame,
    permissionStatus,
    startCamera,
    stopCamera,
    captureFrame,
    permissionRequested,
  }
}

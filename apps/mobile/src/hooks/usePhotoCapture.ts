import { useRef, useState, useCallback } from 'react'
import { Camera, CameraType } from 'expo-camera'
import * as FileSystem from 'expo-file-system'
import * as ImageManipulator from 'expo-image-manipulator'
import { generateIdFromDate } from '@fitai/shared-utils'

export interface PhotoCaptureResult {
  filePath: string
  uri: string
  width: number
  height: number
}

interface UsePhotoCaptureReturn {
  cameraRef: React.RefObject<Camera>
  hasPermission: boolean
  isReady: boolean
  photoUri: string | null
  takePhoto: () => Promise<PhotoCaptureResult | null>
  discardPhoto: () => void
  permissionError: string | null
}

/**
 * Hook for capturing photos from camera
 * Handles permissions and photo storage
 */
export function usePhotoCapture(): UsePhotoCaptureReturn {
  const cameraRef = useRef<Camera>(null)
  const [hasPermission, setHasPermission] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [permissionError, setPermissionError] = useState<string | null>(null)

  // Request camera permission
  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync()
      if (status === 'granted') {
        setHasPermission(true)
        setPermissionError(null)
      } else {
        setHasPermission(false)
        setPermissionError('Camera permission denied')
      }
    } catch (error) {
      setPermissionError('Failed to request camera permission')
      console.error('Error requesting camera permission:', error)
    }
  }, [])

  // Take photo and save to app filesystem
  const takePhoto = useCallback(async (): Promise<PhotoCaptureResult | null> => {
    if (!cameraRef.current || !hasPermission) {
      console.warn('Camera not ready or no permission')
      return null
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
        skipProcessing: false,
      })

      if (!photo) return null

      // Compress and optimize image
      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1024, height: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      )

      // Save to app's document directory
      const photoDir = `${FileSystem.documentDirectory}photos`
      await FileSystem.makeDirectoryAsync(photoDir, { intermediates: true }).catch(() => {})

      const fileName = `meal_${generateIdFromDate()}.jpg`
      const targetUri = `${photoDir}/${fileName}`

      await FileSystem.moveAsync({
        from: manipulated.uri,
        to: targetUri,
      })

      setPhotoUri(targetUri)

      return {
        filePath: targetUri,
        uri: targetUri,
        width: manipulated.width,
        height: manipulated.height,
      }
    } catch (error) {
      console.error('Error taking photo:', error)
      return null
    }
  }, [hasPermission])

  // Discard current photo
  const discardPhoto = useCallback(async () => {
    if (photoUri) {
      try {
        await FileSystem.deleteAsync(photoUri)
      } catch (error) {
        console.warn('Error deleting photo file:', error)
      }
      setPhotoUri(null)
    }
  }, [photoUri])

  // Initialize permissions on first render
  useState(() => {
    requestPermission().then(() => setIsReady(true))
  })[1]

  return {
    cameraRef,
    hasPermission,
    isReady,
    photoUri,
    takePhoto,
    discardPhoto,
    permissionError,
  }
}

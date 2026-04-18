/**
 * Camera Feed Component
 * Displays live camera feed with pose overlay
 * Integrates with pose detection for real-time form analysis
 */

import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native'
import { Camera } from 'expo-camera'
import { useCamera } from '../../hooks/useCamera'
import { Keypoint } from '../../types/form-analysis'

interface CameraFeedProps {
  isActive: boolean
  onFrame?: (uri: string, width: number, height: number) => void
  onKeypoints?: (keypoints: Keypoint[]) => void
  style?: ViewStyle
  facing?: 'front' | 'back'
  quality?: number
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
})

export const CameraFeed: React.FC<CameraFeedProps> = ({
  isActive,
  onFrame,
  onKeypoints,
  style,
  facing = 'front',
  quality = 0.7,
}) => {
  const cameraRef = useRef<Camera | null>(null)

  const {
    isActive: cameraActive,
    isCameraReady,
    currentFrame,
    permissionStatus,
    startCamera,
    stopCamera,
  } = useCamera({
    facing,
    quality,
    autoStart: isActive,
    targetFps: 30,
  })

  /**
   * Handle frame updates
   */
  useEffect(() => {
    if (currentFrame && onFrame) {
      onFrame(currentFrame.uri, currentFrame.width, currentFrame.height)
    }
  }, [currentFrame, onFrame])

  /**
   * Start/stop camera based on isActive
   */
  useEffect(() => {
    if (isActive && !cameraActive) {
      startCamera()
    } else if (!isActive && cameraActive) {
      stopCamera()
    }
  }, [isActive, cameraActive, startCamera, stopCamera])

  if (permissionStatus !== 'granted') {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#00ff00" />
      </View>
    )
  }

  return (
    <View style={[styles.container, style]}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={facing === 'front' ? Camera.Constants.Type.front : Camera.Constants.Type.back}
        onCameraReady={() => {
          // Camera is ready
        }}
        ratio="16:9"
        useNativeDriver={true}
      />
    </View>
  )
}

export default CameraFeed

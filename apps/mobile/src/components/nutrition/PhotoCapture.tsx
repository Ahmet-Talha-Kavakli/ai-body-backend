import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native'
import { Camera } from 'expo-camera'
import { Text } from 'react-native'
import { usePhotoCapture, type PhotoCaptureResult } from '../../hooks/usePhotoCapture'

interface PhotoCaptureProps {
  onPhotoCapture: (photo: PhotoCaptureResult) => void
  mealLogId?: string
}

export function PhotoCapture({ onPhotoCapture, mealLogId }: PhotoCaptureProps) {
  const { cameraRef, hasPermission, isReady, photoUri, takePhoto, discardPhoto, permissionError } =
    usePhotoCapture()
  const [isCapturing, setIsCapturing] = useState(false)

  const handleTakePhoto = async () => {
    if (isCapturing) return

    setIsCapturing(true)
    try {
      const result = await takePhoto()
      if (result) {
        onPhotoCapture(result)
      } else {
        Alert.alert('Error', 'Failed to capture photo')
      }
    } catch (error) {
      console.error('Error capturing photo:', error)
      Alert.alert('Error', 'Failed to capture photo')
    } finally {
      setIsCapturing(false)
    }
  }

  const handleDiscardPhoto = async () => {
    Alert.alert('Discard Photo', 'Are you sure you want to discard this photo?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Discard',
        onPress: async () => {
          await discardPhoto()
        },
        style: 'destructive',
      },
    ])
  }

  // Show permission error
  if (permissionError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{permissionError}</Text>
          <Text style={styles.errorSubtext}>Camera access is required to capture meal photos</Text>
        </View>
      </View>
    )
  }

  // Show loading state
  if (!isReady) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing camera...</Text>
        </View>
      </View>
    )
  }

  // Show photo preview
  if (photoUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photoUri }} style={styles.photoPreview} />
        <View style={styles.previewActions}>
          <TouchableOpacity
            style={[styles.button, styles.discardButton]}
            onPress={handleDiscardPhoto}
          >
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.confirmButton]}
            onPress={() => {
              const photo = {
                filePath: photoUri,
                uri: photoUri,
                width: 1024,
                height: 1024,
              }
              onPhotoCapture(photo)
            }}
          >
            <Text style={styles.buttonText}>Use Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // Show camera preview
  return (
    <View style={styles.container}>
      {hasPermission ? (
        <>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={CameraType.back}
            ratio="1:1"
            flashMode={Camera.Constants.FlashMode.auto}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.focusFrame} />
            </View>
          </Camera>
          <View style={styles.captureContainer}>
            <TouchableOpacity
              style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
              onPress={handleTakePhoto}
              disabled={isCapturing}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <Text style={styles.captureHint}>Tap to capture meal photo</Text>
          </View>
        </>
      ) : (
        <View style={styles.noPermissionContainer}>
          <Text style={styles.noPermissionText}>Camera permission required</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusFrame: {
    width: 280,
    height: 280,
    borderWidth: 2,
    borderColor: '#00ff00',
    borderRadius: 8,
    opacity: 0.5,
  },
  captureContainer: {
    paddingBottom: 40,
    paddingTop: 20,
    alignItems: 'center',
    gap: 12,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#00ff00',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#fff',
  },
  captureHint: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  photoPreview: {
    flex: 1,
    width: '100%',
  },
  previewActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardButton: {
    backgroundColor: '#666',
  },
  confirmButton: {
    backgroundColor: '#00ff00',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPermissionText: {
    color: '#fff',
    fontSize: 16,
  },
})

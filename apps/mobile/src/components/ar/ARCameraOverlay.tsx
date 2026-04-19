import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export interface ARCameraOverlayProps {
  detectionStatus: 'detecting' | 'found' | 'not_found'
  fps?: number
}

export function ARCameraOverlay({
  detectionStatus,
  fps,
}: ARCameraOverlayProps) {
  const getStatusColor = () => {
    switch (detectionStatus) {
      case 'found':
        return '#4CAF50'
      case 'not_found':
        return '#f44336'
      case 'detecting':
      default:
        return '#FF9800'
    }
  }

  const getStatusText = () => {
    switch (detectionStatus) {
      case 'found':
        return 'Food Detected'
      case 'not_found':
        return 'No Food Found'
      case 'detecting':
      default:
        return 'Detecting...'
    }
  }

  const statusColor = getStatusColor()
  const statusText = getStatusText()

  return (
    <View style={styles.container}>
      {/* Crosshair */}
      <View style={styles.crosshairContainer}>
        {/* Horizontal line */}
        <View
          style={[styles.crosshairLine, styles.horizontal, { borderColor: statusColor }]}
        />
        {/* Vertical line */}
        <View
          style={[styles.crosshairLine, styles.vertical, { borderColor: statusColor }]}
        />
        {/* Center circle */}
        <View
          style={[
            styles.centerCircle,
            { backgroundColor: statusColor, borderColor: statusColor },
          ]}
        />
      </View>

      {/* Status text - top center */}
      <View style={styles.statusContainer}>
        <View
          style={[styles.statusBadge, { backgroundColor: statusColor }]}
        >
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </View>

      {/* FPS indicator - bottom right (dev mode) */}
      {fps !== undefined && (
        <View style={styles.fpsContainer}>
          <View style={styles.fpsBadge}>
            <Text style={styles.fpsText}>{fps} FPS</Text>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairLine: {
    position: 'absolute',
  },
  horizontal: {
    width: 60,
    height: 1,
  },
  vertical: {
    width: 1,
    height: 60,
  },
  centerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusContainer: {
    position: 'absolute',
    top: 40,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  fpsContainer: {
    position: 'absolute',
    bottom: 40,
    right: 20,
  },
  fpsBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  fpsText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
})

import React from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'

interface BarcodeDetection {
  barcode: string
  foodName: string
  timestamp: string
}

interface BarcodeIndicatorProps {
  isScanning: boolean
  lastDetection: BarcodeDetection | null
  error?: string
  onRescan?: () => void
}

export function BarcodeIndicator({
  isScanning,
  lastDetection,
  error,
  onRescan,
}: BarcodeIndicatorProps) {
  if (isScanning) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.scanningText}>Scanning barcode...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  if (lastDetection) {
    return (
      <View style={[styles.container, styles.successContainer]}>
        <Text style={styles.barcodeText}>{lastDetection.barcode}</Text>
        <Text style={styles.foodName}>{lastDetection.foodName}</Text>
        <Text style={styles.timestamp}>
          Detected: {new Date(lastDetection.timestamp).toLocaleTimeString()}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.placeholderText}>Ready to scan barcode</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  scanningText: {
    marginTop: 12,
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
  },
  errorContainer: {
    backgroundColor: '#ffe8e8',
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    fontWeight: '500',
  },
  successContainer: {
    backgroundColor: '#e8f5e9',
  },
  barcodeText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
})

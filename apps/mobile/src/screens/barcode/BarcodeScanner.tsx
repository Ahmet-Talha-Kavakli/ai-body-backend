import React, { useState, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

type RootStackParamList = {
  BarcodeScanner: undefined
  [key: string]: any
}

type Props = NativeStackScreenProps<RootStackParamList, 'BarcodeScanner'>

export function BarcodeScanner({ navigation }: Props) {
  const [isScanning, setIsScanning] = useState(false)
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleScanBarcode = async () => {
    setIsScanning(true)
    setError(null)

    try {
      // Simulate barcode scanning
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock detection
      setDetectedBarcode('5901234123457')
      setIsScanning(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan barcode')
      setIsScanning(false)
    }
  }

  const handleRetry = () => {
    setDetectedBarcode(null)
    setError(null)
    handleScanBarcode()
  }

  return (
    <View style={styles.container}>
      {/* Camera Viewfinder Area */}
      <View style={styles.viewfinder}>
        {isScanning ? (
          <View style={styles.scanningContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.scanningText}>Scanning...</Text>
          </View>
        ) : (
          <View style={styles.scanGuide}>
            <Text style={styles.guideText}>Position barcode in frame</Text>
          </View>
        )}
      </View>

      {/* Result or Error Display */}
      {detectedBarcode && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Barcode Detected</Text>
          <Text style={styles.barcodeValue}>{detectedBarcode}</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {detectedBarcode && !isScanning ? (
          <>
            <TouchableOpacity style={styles.button} onPress={handleRetry}>
              <Text style={styles.buttonText}>Scan Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => {
                navigation.goBack()
              }}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>Use This Barcode</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, isScanning && styles.buttonDisabled]}
            onPress={handleScanBarcode}
            disabled={isScanning}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              {isScanning ? 'Scanning...' : 'Start Scan'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewfinder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  scanningContainer: {
    alignItems: 'center',
  },
  scanningText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
  },
  scanGuide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideText: {
    color: '#999',
    fontSize: 16,
  },
  resultContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  resultLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
  },
  barcodeValue: {
    color: '#4caf50',
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#4d3535',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#d32f2f',
  },
  errorText: {
    color: '#ff8a80',
    fontSize: 13,
  },
  controls: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#fff',
  },
})

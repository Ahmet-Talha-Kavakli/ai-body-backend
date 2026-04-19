import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export interface ConfidenceIndicatorProps {
  confidence: number // 0-100
}

export function ConfidenceIndicator({
  confidence,
}: ConfidenceIndicatorProps) {
  // Clamp confidence between 0 and 100
  const normalizedConfidence = Math.max(0, Math.min(100, confidence))

  // Determine color based on confidence level
  // Red (< 50%) -> Yellow (50-75%) -> Green (>= 75%)
  let backgroundColor: string
  if (normalizedConfidence < 50) {
    // Red gradient
    backgroundColor = `rgba(255, ${Math.round(
      (normalizedConfidence / 50) * 100
    )}, 0, 0.7)`
  } else if (normalizedConfidence < 75) {
    // Yellow (red-green transition)
    const yellowFactor = (normalizedConfidence - 50) / 25
    backgroundColor = `rgba(${255 - Math.round(
      yellowFactor * 100
    )}, 255, 0, 0.7)`
  } else {
    // Green
    backgroundColor = 'rgba(76, 175, 80, 0.7)'
  }

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${normalizedConfidence}%`,
              backgroundColor,
            },
          ]}
        />
      </View>
      <Text style={styles.confidenceText}>
        {Math.round(normalizedConfidence)}%
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  barContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
})

import React from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import type { FoodDetectionResult } from '../../types/ar'

export interface ARFoodOverlayProps {
  detection: FoodDetectionResult
  isLoading: boolean
}

export function ARFoodOverlay({ detection, isLoading }: ARFoodOverlayProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.foodName}>{detection.detectedFoodName}</Text>
        <Text style={styles.confidence}>
          {Math.round(detection.confidence)}% confidence
        </Text>
      </View>

      <View style={styles.nutritionContainer}>
        <Text style={styles.caloriesLabel}>Calories</Text>
        <Text style={styles.caloriesValue}>
          {Math.round(detection.nutrition.calories)}
        </Text>
        <Text style={styles.macrosLabel}>
          P: {detection.nutrition.proteinG.toFixed(1)}g | C:{' '}
          {detection.nutrition.carbsG.toFixed(1)}g | F:{' '}
          {detection.nutrition.fatG.toFixed(1)}g
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    marginHorizontal: 16,
  },
  labelContainer: {
    marginBottom: 12,
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  confidence: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
  },
  nutritionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  caloriesLabel: {
    fontSize: 12,
    color: '#aaa',
    textTransform: 'uppercase',
  },
  caloriesValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginVertical: 4,
  },
  macrosLabel: {
    fontSize: 12,
    color: '#ccc',
  },
})

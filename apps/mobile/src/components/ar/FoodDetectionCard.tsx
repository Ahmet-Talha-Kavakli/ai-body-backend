import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import type { FoodDetectionResult } from '../../types/ar'

export interface FoodDetectionCardProps {
  detection: FoodDetectionResult
  onEdit: (detection: FoodDetectionResult) => void
}

export function FoodDetectionCard({
  detection,
  onEdit,
}: FoodDetectionCardProps) {
  const sourceLabel = {
    usda: 'USDA',
    gpt4_vision: 'AI Vision',
    user_correction: 'Manual',
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.foodName}>{detection.detectedFoodName}</Text>
          <Text style={styles.source}>
            {sourceLabel[detection.source]}
          </Text>
        </View>
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidence}>
            {Math.round(detection.confidence)}%
          </Text>
        </View>
      </View>

      <View style={styles.portionSection}>
        <Text style={styles.portionText}>
          {detection.portionSize} {detection.portionUnit}
        </Text>
      </View>

      <View style={styles.nutritionGrid}>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>
            {Math.round(detection.nutrition.calories)}
          </Text>
          <Text style={styles.nutritionLabel}>Calories</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>
            {detection.nutrition.proteinG.toFixed(1)}g
          </Text>
          <Text style={styles.nutritionLabel}>Protein</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>
            {detection.nutrition.carbsG.toFixed(1)}g
          </Text>
          <Text style={styles.nutritionLabel}>Carbs</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>
            {detection.nutrition.fatG.toFixed(1)}g
          </Text>
          <Text style={styles.nutritionLabel}>Fat</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => onEdit(detection)}
      >
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  source: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  confidenceContainer: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  confidence: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  portionSection: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  portionText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  editButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
})

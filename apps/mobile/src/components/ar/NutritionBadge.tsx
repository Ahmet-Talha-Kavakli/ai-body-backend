import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export interface Nutrition {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number
  glycemicIndex?: number
}

export interface NutritionBadgeProps {
  nutrition: Nutrition
  size?: 'small' | 'large'
}

export function NutritionBadge({
  nutrition,
  size = 'small',
}: NutritionBadgeProps) {
  const isLarge = size === 'large'
  const containerSize = isLarge ? 160 : 120
  const fontSize = isLarge ? 24 : 18
  const macroSize = isLarge ? 12 : 10
  const centerFontSize = isLarge ? 32 : 24

  const proteinPercent = (nutrition.proteinG / (nutrition.calories / 4)) * 100
  const carbPercent = (nutrition.carbsG / (nutrition.calories / 4)) * 100
  const fatPercent = (nutrition.fatG / (nutrition.calories / 9)) * 100

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
        },
      ]}
    >
      {/* Center: Calories */}
      <View style={styles.centerContent}>
        <Text style={[styles.caloriesValue, { fontSize: centerFontSize }]}>
          {Math.round(nutrition.calories)}
        </Text>
        <Text style={[styles.caloriesLabel, { fontSize: macroSize }]}>
          kcal
        </Text>
      </View>

      {/* Protein - Top Right (Red) */}
      <View style={[styles.macroPosition, styles.topRight]}>
        <Text style={[styles.macroValue, styles.proteinColor, { fontSize }]}>
          {nutrition.proteinG.toFixed(0)}
        </Text>
        <Text style={[styles.macroLabel, { fontSize: macroSize }]}>P</Text>
      </View>

      {/* Carbs - Bottom Right (Blue) */}
      <View style={[styles.macroPosition, styles.bottomRight]}>
        <Text style={[styles.macroValue, styles.carbColor, { fontSize }]}>
          {nutrition.carbsG.toFixed(0)}
        </Text>
        <Text style={[styles.macroLabel, { fontSize: macroSize }]}>C</Text>
      </View>

      {/* Fat - Bottom Left (Yellow) */}
      <View style={[styles.macroPosition, styles.bottomLeft]}>
        <Text style={[styles.macroValue, styles.fatColor, { fontSize }]}>
          {nutrition.fatG.toFixed(0)}
        </Text>
        <Text style={[styles.macroLabel, { fontSize: macroSize }]}>F</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#ddd',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  caloriesValue: {
    fontWeight: 'bold',
    color: '#333',
  },
  caloriesLabel: {
    color: '#666',
    fontWeight: '500',
  },
  macroPosition: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRight: {
    top: 8,
    right: 8,
  },
  bottomRight: {
    bottom: 8,
    right: 8,
  },
  bottomLeft: {
    bottom: 8,
    left: 8,
  },
  macroValue: {
    fontWeight: 'bold',
  },
  macroLabel: {
    fontWeight: '600',
    color: '#333',
  },
  proteinColor: {
    color: '#ff4444', // Red
  },
  carbColor: {
    color: '#4444ff', // Blue
  },
  fatColor: {
    color: '#ffaa00', // Yellow/Orange
  },
})

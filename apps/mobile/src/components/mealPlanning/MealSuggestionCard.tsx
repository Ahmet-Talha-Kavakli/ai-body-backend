import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'

interface Nutrition {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
}

interface MealSuggestion {
  id: string
  mealName: string
  description: string
  nutrition: Nutrition
  reasonForSuggestion: string
  recipeUrl?: string
  createdAt: string
  expiresAt: string
}

interface MealSuggestionCardProps {
  meal: MealSuggestion
  onAdd: (mealId: string) => void
}

export function MealSuggestionCard({ meal, onAdd }: MealSuggestionCardProps) {
  const handleRecipePress = () => {
    if (meal.recipeUrl) {
      Linking.openURL(meal.recipeUrl)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mealName}>{meal.mealName}</Text>
        <Text style={styles.calories}>{meal.nutrition.calories} cal</Text>
      </View>

      <Text style={styles.description}>{meal.description}</Text>

      <View style={styles.nutritionGrid}>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{meal.nutrition.proteinG}g</Text>
          <Text style={styles.macroLabel}>Protein</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{meal.nutrition.carbsG}g</Text>
          <Text style={styles.macroLabel}>Carbs</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{meal.nutrition.fatG}g</Text>
          <Text style={styles.macroLabel}>Fat</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{meal.nutrition.fiberG}g</Text>
          <Text style={styles.macroLabel}>Fiber</Text>
        </View>
      </View>

      <Text style={styles.reason}>{meal.reasonForSuggestion}</Text>

      <View style={styles.actions}>
        {meal.recipeUrl && (
          <TouchableOpacity style={styles.recipeButton} onPress={handleRecipePress}>
            <Text style={styles.recipeButtonText}>View Recipe</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.addButton} onPress={() => onAdd(meal.id)}>
          <Text style={styles.addButtonText}>+ Add Meal</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  calories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
    marginLeft: 8,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  macroLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  reason: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  recipeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0066cc',
    alignItems: 'center',
  },
  recipeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066cc',
  },
  addButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#0066cc',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
})

import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, FlatList } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { MealSuggestionCard } from '../../components/mealPlanning/MealSuggestionCard'

type RootStackParamList = {
  MealPlanningScreen: undefined
  [key: string]: any
}

type Props = NativeStackScreenProps<RootStackParamList, 'MealPlanningScreen'>

interface MealSuggestion {
  id: string
  mealName: string
  description: string
  nutrition: {
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG: number
  }
  reasonForSuggestion: string
  recipeUrl?: string
  createdAt: string
  expiresAt: string
}

export function MealPlanningScreen({ navigation }: Props) {
  const [meals, setMeals] = useState<MealSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [goals, setGoals] = useState({
    caloriesGoal: 2500,
    proteinGoal: 160,
    carbsGoal: 250,
    fatGoal: 85,
  })

  useEffect(() => {
    loadMealSuggestions()
  }, [])

  const loadMealSuggestions = async () => {
    setIsLoading(true)
    try {
      // Mock meal suggestions
      const mockMeals: MealSuggestion[] = [
        {
          id: 'meal-1',
          mealName: 'Grilled Chicken with Quinoa',
          description: 'Lean protein with whole grains',
          nutrition: {
            calories: 450,
            proteinG: 35,
            carbsG: 45,
            fatG: 12,
            fiberG: 8,
          },
          reasonForSuggestion: 'Based on your 2500 cal goal',
          recipeUrl: 'https://example.com/recipe/grilled-chicken',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        },
        {
          id: 'meal-2',
          mealName: 'Salmon with Sweet Potato',
          description: 'Omega-3 rich with complex carbs',
          nutrition: {
            calories: 520,
            proteinG: 42,
            carbsG: 48,
            fatG: 16,
            fiberG: 6,
          },
          reasonForSuggestion: 'You love fish and need omega-3s',
          recipeUrl: 'https://example.com/recipe/salmon',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        },
      ]

      setMeals(mockMeals)
    } catch (error) {
      console.error('Failed to load meal suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddMeal = (mealId: string) => {
    console.log('Adding meal:', mealId)
    // Handle adding meal to plan
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading suggestions...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Goals Overview */}
      <View style={styles.goalsSection}>
        <Text style={styles.goalsTitle}>Your Daily Goals</Text>
        <View style={styles.goalsGrid}>
          <View style={styles.goalItem}>
            <Text style={styles.goalValue}>{goals.caloriesGoal}</Text>
            <Text style={styles.goalLabel}>Calories</Text>
          </View>
          <View style={styles.goalItem}>
            <Text style={styles.goalValue}>{goals.proteinGoal}g</Text>
            <Text style={styles.goalLabel}>Protein</Text>
          </View>
          <View style={styles.goalItem}>
            <Text style={styles.goalValue}>{goals.carbsGoal}g</Text>
            <Text style={styles.goalLabel}>Carbs</Text>
          </View>
          <View style={styles.goalItem}>
            <Text style={styles.goalValue}>{goals.fatGoal}g</Text>
            <Text style={styles.goalLabel}>Fat</Text>
          </View>
        </View>
      </View>

      {/* Meal Suggestions */}
      <View style={styles.suggestionsSection}>
        <Text style={styles.suggestionsTitle}>Personalized Suggestions</Text>
        {meals.map((meal) => (
          <MealSuggestionCard key={meal.id} meal={meal} onAdd={handleAddMeal} />
        ))}
      </View>

      {/* Weekly Plan Preview */}
      <View style={styles.planSection}>
        <Text style={styles.planTitle}>Weekly Plan</Text>
        <View style={styles.planPreview}>
          <Text style={styles.planPreviewText}>
            Add meals to create your personalized weekly meal plan.
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  goalsSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  goalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  goalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  goalItem: {
    alignItems: 'center',
  },
  goalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0066cc',
    marginBottom: 4,
  },
  goalLabel: {
    fontSize: 12,
    color: '#999',
  },
  suggestionsSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  planSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  planPreview: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  planPreviewText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
})

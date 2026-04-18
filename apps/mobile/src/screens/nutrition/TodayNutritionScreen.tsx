import React, { useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MacroProgressBar } from '../../components/nutrition/MacroProgressBar'
import { getMealsForDate } from '../../db/mealLog'
import { getNutritionGoal } from '../../db/nutritionGoal'
import type { MealLog, NutritionGoal } from '@fitai/shared-types'

interface TodayNutritionScreenProps {
  userId: string
  onLogMeal?: () => void
}

export function TodayNutritionScreen({ userId, onLogMeal }: TodayNutritionScreenProps) {
  const insets = useSafeAreaInsets()
  const [meals, setMeals] = useState<MealLog[]>([])
  const [goal, setGoal] = useState<NutritionGoal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [totalCalories, setTotalCalories] = useState(0)
  const [totalProtein, setTotalProtein] = useState(0)
  const [totalCarbs, setTotalCarbs] = useState(0)
  const [totalFat, setTotalFat] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const today = new Date()
      const dateString = today.toISOString().split('T')[0]

      const [mealsData, goalData] = await Promise.all([
        getMealsForDate(userId, dateString),
        getNutritionGoal(userId),
      ])

      setMeals(mealsData)
      setGoal(goalData)

      // Calculate totals
      const cals = mealsData.reduce((sum, meal) => sum + meal.totalCalories, 0)
      const protein = mealsData.reduce((sum, meal) => sum + meal.totalProteinG, 0)
      const carbs = mealsData.reduce((sum, meal) => sum + meal.totalCarbsG, 0)
      const fat = mealsData.reduce((sum, meal) => sum + meal.totalFatG, 0)

      setTotalCalories(cals)
      setTotalProtein(protein)
      setTotalCarbs(carbs)
      setTotalFat(fat)
    } catch (error) {
      console.error('Error loading nutrition data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    )
  }

  const goalCalories = goal?.dailyCalories || 2000
  const goalProtein = goal?.proteinG || 150
  const goalCarbs = goal?.carbsG || 200
  const goalFat = goal?.fatG || 65

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Summary Cards */}
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Today's Nutrition</Text>

        <MacroProgressBar
          current={totalCalories}
          goal={goalCalories}
          label="Calories"
          unit="cal"
          color="#FF6B6B"
        />

        <MacroProgressBar
          current={Math.round(totalProtein)}
          goal={Math.round(goalProtein)}
          label="Protein"
          unit="g"
          color="#4CAF50"
        />

        <MacroProgressBar
          current={Math.round(totalCarbs)}
          goal={Math.round(goalCarbs)}
          label="Carbs"
          unit="g"
          color="#2196F3"
        />

        <MacroProgressBar
          current={Math.round(totalFat)}
          goal={Math.round(goalFat)}
          label="Fat"
          unit="g"
          color="#FF9800"
        />
      </View>

      {/* Meals List */}
      <View style={styles.mealsSection}>
        <Text style={styles.sectionTitle}>Logged Meals</Text>

        {meals.length > 0 ? (
          meals.map((meal) => (
            <View key={meal.id} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealType}>{meal.mealType.replace('_', ' ').toUpperCase()}</Text>
                <Text style={styles.mealCalories}>{meal.totalCalories} cal</Text>
              </View>
              <View style={styles.mealMacros}>
                <Text style={styles.macroText}>P: {meal.totalProteinG.toFixed(1)}g</Text>
                <Text style={styles.macroText}>C: {meal.totalCarbsG.toFixed(1)}g</Text>
                <Text style={styles.macroText}>F: {meal.totalFatG.toFixed(1)}g</Text>
              </View>
              {meal.notes && <Text style={styles.mealNotes}>{meal.notes}</Text>}
            </View>
          ))
        ) : (
          <Text style={styles.noMealsText}>No meals logged yet</Text>
        )}
      </View>

      {/* Log Meal Button */}
      {onLogMeal && (
        <TouchableOpacity style={styles.logMealButton} onPress={onLogMeal}>
          <Text style={styles.logMealButtonText}>+ Log Meal</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  summarySection: {
    backgroundColor: '#fff',
    marginBottom: 16,
    paddingVertical: 16,
  },
  mealsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginHorizontal: 16,
    color: '#000',
  },
  mealCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mealType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  mealMacros: {
    flexDirection: 'row',
    gap: 12,
  },
  macroText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  mealNotes: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    fontStyle: 'italic',
  },
  noMealsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  logMealButton: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logMealButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
})

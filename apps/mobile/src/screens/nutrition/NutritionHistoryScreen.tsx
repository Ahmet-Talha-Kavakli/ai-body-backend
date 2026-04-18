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
import { getMealsInRange } from '../../db/mealLog'
import type { MealLog } from '@fitai/shared-types'

interface NutritionHistoryScreenProps {
  userId: string
}

interface DayGrouped {
  date: string
  meals: MealLog[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
}

export function NutritionHistoryScreen({ userId }: NutritionHistoryScreenProps) {
  const insets = useSafeAreaInsets()
  const [days, setDays] = useState<DayGrouped[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setIsLoading(true)
    try {
      // Get last 30 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 29)

      const startStr = startDate.toISOString().split('T')[0]
      const endStr = endDate.toISOString().split('T')[0]

      const meals = await getMealsInRange(userId, startStr, endStr)

      // Group by date
      const grouped = new Map<string, MealLog[]>()
      meals.forEach((meal) => {
        const date = meal.loggedAt.toISOString().split('T')[0]
        if (!grouped.has(date)) {
          grouped.set(date, [])
        }
        grouped.get(date)!.push(meal)
      })

      // Convert to array and calculate totals
      const daysArray: DayGrouped[] = Array.from(grouped.entries())
        .map(([date, dayMeals]) => ({
          date,
          meals: dayMeals,
          totalCalories: dayMeals.reduce((sum, m) => sum + m.totalCalories, 0),
          totalProtein: dayMeals.reduce((sum, m) => sum + m.totalProteinG, 0),
          totalCarbs: dayMeals.reduce((sum, m) => sum + m.totalCarbsG, 0),
          totalFat: dayMeals.reduce((sum, m) => sum + m.totalFatG, 0),
        }))
        .sort((a, b) => b.date.localeCompare(a.date)) // Most recent first

      setDays(daysArray)
    } catch (error) {
      console.error('Error loading nutrition history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleExpanded = (date: string) => {
    const newExpanded = new Set(expandedDates)
    if (newExpanded.has(date)) {
      newExpanded.delete(date)
    } else {
      newExpanded.add(date)
    }
    setExpandedDates(newExpanded)
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    )
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.title}>Nutrition History</Text>

      {days.length > 0 ? (
        days.map((day) => {
          const isExpanded = expandedDates.has(day.date)

          return (
            <View key={day.date}>
              <TouchableOpacity style={styles.dayCard} onPress={() => toggleExpanded(day.date)}>
                <View style={styles.dayHeader}>
                  <View>
                    <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
                    <Text style={styles.dayMealCount}>{day.meals.length} meals</Text>
                  </View>
                  <View style={styles.dayCalories}>
                    <Text style={styles.dayCaloriesValue}>{day.totalCalories}</Text>
                    <Text style={styles.dayCaloriesLabel}>calories</Text>
                  </View>
                  <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
                </View>

                {isExpanded && (
                  <View style={styles.dayDetails}>
                    <View style={styles.macroRow}>
                      <Text style={styles.macroLabel}>Protein:</Text>
                      <Text style={styles.macroValue}>{day.totalProtein.toFixed(1)}g</Text>
                    </View>
                    <View style={styles.macroRow}>
                      <Text style={styles.macroLabel}>Carbs:</Text>
                      <Text style={styles.macroValue}>{day.totalCarbs.toFixed(1)}g</Text>
                    </View>
                    <View style={styles.macroRow}>
                      <Text style={styles.macroLabel}>Fat:</Text>
                      <Text style={styles.macroValue}>{day.totalFat.toFixed(1)}g</Text>
                    </View>

                    <View style={styles.mealsDiv}>
                      <Text style={styles.mealsTitle}>Meals:</Text>
                      {day.meals.map((meal) => (
                        <View key={meal.id} style={styles.mealItem}>
                          <Text style={styles.mealItemType}>
                            {meal.mealType.replace('_', ' ').toUpperCase()}
                          </Text>
                          <Text style={styles.mealItemCals}>{meal.totalCalories} cal</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )
        })
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No nutrition data available</Text>
        </View>
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
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 12,
    color: '#000',
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dayMealCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  dayCalories: {
    alignItems: 'center',
  },
  dayCaloriesValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  dayCaloriesLabel: {
    fontSize: 11,
    color: '#999',
  },
  expandIcon: {
    fontSize: 12,
    color: '#999',
  },
  dayDetails: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  macroLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  macroValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  mealsDiv: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  mealsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  mealItemType: {
    fontSize: 12,
    color: '#666',
  },
  mealItemCals: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
})

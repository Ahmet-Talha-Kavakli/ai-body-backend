import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'

interface TrendingMeal {
  id: string
  foodName: string
  count: number
  averageCalories: number
}

interface TrendingMealsProps {
  meals: TrendingMeal[]
  timeframe: 'week' | 'month'
  onMealPress?: (mealId: string) => void
}

export function TrendingMeals({ meals, timeframe, onMealPress }: TrendingMealsProps) {
  const maxCount = Math.max(...meals.map((m) => m.count), 1)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trending Meals</Text>
        <Text style={styles.timeframe}>{timeframe === 'week' ? 'This Week' : 'This Month'}</Text>
      </View>

      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {meals.map((meal, index) => {
          const barWidth = (meal.count / maxCount) * 100
          const isPopular = index === 0

          return (
            <TouchableOpacity
              key={meal.id}
              style={styles.mealItem}
              onPress={() => onMealPress?.(meal.id)}
            >
              <View style={styles.mealHeader}>
                <Text
                  style={[styles.mealName, isPopular && styles.mealNamePopular]}
                  numberOfLines={1}
                >
                  {isPopular ? '🔥 ' : ''}
                  {meal.foodName}
                </Text>
                <Text style={styles.mealCount}>{meal.count}x</Text>
              </View>

              <View style={styles.barContainer}>
                <View
                  style={[styles.bar, { width: `${barWidth}%` }, isPopular && styles.barPopular]}
                />
              </View>

              <Text style={styles.mealCalories}>Avg: {meal.averageCalories} kcal</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  timeframe: {
    fontSize: 12,
    color: '#999',
  },
  listContainer: {
    maxHeight: 300,
  },
  mealItem: {
    marginBottom: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    flex: 1,
  },
  mealNamePopular: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  mealCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066cc',
    marginLeft: 8,
  },
  barContainer: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  bar: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 3,
  },
  barPopular: {
    backgroundColor: '#ff9800',
  },
  mealCalories: {
    fontSize: 11,
    color: '#999',
  },
})

import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { NutritionComparison } from '../../components/social/NutritionComparison'
import { TrendingMeals } from '../../components/social/TrendingMeals'
import { MacroCircles } from '../../components/social/MacroCircles'

type RootStackParamList = {
  NutritionComparisonScreen: undefined
  [key: string]: any
}

type Props = NativeStackScreenProps<RootStackParamList, 'NutritionComparisonScreen'>

interface Nutrition {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
}

interface Goals {
  caloriesGoal: number
  proteinGoal: number
  carbsGoal: number
  fatGoal: number
  fiberGoal: number
}

interface TrendingMeal {
  id: string
  foodName: string
  count: number
  averageCalories: number
}

export function NutritionComparisonScreen({ navigation }: Props) {
  const [yourNutrition, setYourNutrition] = useState<Nutrition>({
    calories: 1850,
    proteinG: 125,
    carbsG: 180,
    fatG: 60,
    fiberG: 28,
  })

  const [teamAverage, setTeamAverage] = useState<Nutrition>({
    calories: 2100,
    proteinG: 140,
    carbsG: 210,
    fatG: 70,
    fiberG: 32,
  })

  const [goals, setGoals] = useState<Goals>({
    caloriesGoal: 2500,
    proteinGoal: 160,
    carbsGoal: 250,
    fatGoal: 85,
    fiberGoal: 30,
  })

  const [trendingMeals, setTrendingMeals] = useState<TrendingMeal[]>([
    {
      id: 'meal-1',
      foodName: 'Grilled Chicken Salad',
      count: 12,
      averageCalories: 380,
    },
    {
      id: 'meal-2',
      foodName: 'Protein Smoothie',
      count: 10,
      averageCalories: 320,
    },
    {
      id: 'meal-3',
      foodName: 'Greek Yogurt Bowl',
      count: 8,
      averageCalories: 280,
    },
  ])

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadComparisonData()
  }, [])

  const loadComparisonData = async () => {
    setIsLoading(true)
    try {
      // Data is already mocked above
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Failed to load comparison data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading comparison...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Your Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Daily Progress</Text>
        <MacroCircles nutrition={yourNutrition} goals={goals} />
      </View>

      {/* Comparison */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Comparison</Text>
        <NutritionComparison
          yourNutrition={yourNutrition}
          compareWith={teamAverage}
          compareLabel="Team Avg"
        />
      </View>

      {/* Team Trending */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What Your Team Is Eating</Text>
        <TrendingMeals
          meals={trendingMeals}
          timeframe="week"
          onMealPress={(mealId) => console.log('Meal pressed:', mealId)}
        />
      </View>

      {/* Insights */}
      <View style={styles.insightSection}>
        <Text style={styles.insightTitle}>💡 Insights</Text>

        <View style={styles.insightItem}>
          <Text style={styles.insightText}>
            • You're {Math.round((yourNutrition.proteinG / goals.proteinGoal) * 100)}% of your
            protein goal
          </Text>
        </View>

        <View style={styles.insightItem}>
          <Text style={styles.insightText}>
            • Team average is{' '}
            {Math.round(((teamAverage.calories - yourNutrition.calories) / 100) * 100)}% higher in
            calories
          </Text>
        </View>

        <View style={styles.insightItem}>
          <Text style={styles.insightText}>
            • You're {Math.round((yourNutrition.fiberG / goals.fiberGoal) * 100)}% of your fiber
            goal
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
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  insightSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  insightItem: {
    paddingVertical: 8,
  },
  insightText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
})

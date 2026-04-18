import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable, FlatList, Alert } from 'react-native'
import { useNutritionStore } from '../../store/nutritionStore'
import { saveMealLog } from '../../db/nutrition'
import type { MealLog } from '../../types/nutrition'

interface MealReviewScreenProps {
  meal: MealLog
  onConfirm: (meal: MealLog) => void
  onEdit: () => void
}

export function MealReviewScreen({ meal, onConfirm, onEdit }: MealReviewScreenProps) {
  const [saving, setSaving] = useState(false)
  const addMeal = useNutritionStore((state) => state.addMeal)

  const handleConfirm = async () => {
    try {
      setSaving(true)
      // Save to store
      addMeal(meal)
      // Save to database
      await saveMealLog(meal)
      onConfirm(meal)
      Alert.alert('Success', 'Meal logged successfully')
    } catch (error) {
      Alert.alert('Error', 'Failed to save meal')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const proteinCalories = meal.totalProteinG * 4
  const carbCalories = meal.totalCarbsG * 4
  const fatCalories = meal.totalFatG * 9

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 p-4">
        <Text className="mb-4 text-2xl font-bold capitalize">{meal.mealType}</Text>

        {/* Macro Summary Card */}
        <View className="mb-6 rounded-lg bg-gray-50 p-4">
          <Text className="mb-4 text-lg font-bold">Macro Summary</Text>

          <View className="mb-3">
            <View className="mb-1 flex-row justify-between">
              <Text className="font-semibold">Calories</Text>
              <Text className="font-bold">{meal.totalCalories} kcal</Text>
            </View>
          </View>

          <View className="mb-3">
            <View className="mb-1 flex-row justify-between">
              <Text className="font-semibold">Protein</Text>
              <Text>{meal.totalProteinG}g</Text>
            </View>
            <View className="h-2 overflow-hidden rounded bg-gray-200">
              <View
                className="h-full bg-red-500"
                style={{ width: `${(proteinCalories / meal.totalCalories) * 100}%` }}
              />
            </View>
          </View>

          <View className="mb-3">
            <View className="mb-1 flex-row justify-between">
              <Text className="font-semibold">Carbs</Text>
              <Text>{meal.totalCarbsG}g</Text>
            </View>
            <View className="h-2 overflow-hidden rounded bg-gray-200">
              <View
                className="h-full bg-yellow-500"
                style={{ width: `${(carbCalories / meal.totalCalories) * 100}%` }}
              />
            </View>
          </View>

          <View className="mb-3">
            <View className="mb-1 flex-row justify-between">
              <Text className="font-semibold">Fat</Text>
              <Text>{meal.totalFatG}g</Text>
            </View>
            <View className="h-2 overflow-hidden rounded bg-gray-200">
              <View
                className="h-full bg-blue-500"
                style={{ width: `${(fatCalories / meal.totalCalories) * 100}%` }}
              />
            </View>
          </View>

          <View>
            <View className="flex-row justify-between">
              <Text className="font-semibold">Fiber</Text>
              <Text>{meal.totalFiberG}g</Text>
            </View>
          </View>
        </View>

        {/* Foods List */}
        <View>
          <Text className="mb-3 text-lg font-bold">Foods Included</Text>
          <FlatList
            scrollEnabled={false}
            data={meal.items}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <View className="mb-2 rounded border border-gray-200 bg-gray-50 p-3">
                <Text className="mb-1 font-semibold">{item.name}</Text>
                <View className="flex-row flex-wrap gap-2">
                  <Text className="text-xs text-gray-600">{item.calories} kcal</Text>
                  <Text className="text-xs text-gray-600">{item.proteinG}g P</Text>
                  <Text className="text-xs text-gray-600">{item.carbsG}g C</Text>
                  <Text className="text-xs text-gray-600">{item.fatG}g F</Text>
                </View>
              </View>
            )}
          />
        </View>

        {/* Timestamp */}
        <View className="mt-6 rounded bg-gray-100 p-3">
          <Text className="text-xs text-gray-600">
            Logged at {new Date(meal.loggedAt).toLocaleTimeString()}
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="flex-row gap-2 border-t border-gray-200 p-4">
        <Pressable onPress={onEdit} className="flex-1 rounded bg-gray-300 p-3" disabled={saving}>
          <Text className="text-center font-bold">Edit</Text>
        </Pressable>

        <Pressable
          onPress={handleConfirm}
          className="flex-1 rounded bg-green-500 p-3"
          disabled={saving}
        >
          <Text className="text-center font-bold text-white">
            {saving ? 'Saving...' : 'Confirm'}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

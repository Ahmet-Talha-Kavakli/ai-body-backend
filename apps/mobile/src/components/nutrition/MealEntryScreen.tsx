import React, { useState } from 'react'
import { View, Text, TextInput, ScrollView, Pressable, FlatList } from 'react-native'
import { useNutritionStore } from '../../store/nutritionStore'
import { saveMealLog } from '../../db/nutrition'
import type { MealLog, FoodItem } from '../../types/nutrition'

interface MealEntryScreenProps {
  mealType: MealLog['mealType']
  onComplete: (meal: MealLog) => void
}

export function MealEntryScreen({ mealType, onComplete }: MealEntryScreenProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'voice' | 'photo'>('manual')
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [currentFood, setCurrentFood] = useState({
    name: '',
    calories: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
    fiberG: '',
  })
  const addMeal = useNutritionStore((state) => state.addMeal)

  const addFoodItem = () => {
    if (!currentFood.name) return

    const foodItem: FoodItem = {
      name: currentFood.name,
      calories: parseFloat(currentFood.calories) || 0,
      proteinG: parseFloat(currentFood.proteinG) || 0,
      carbsG: parseFloat(currentFood.carbsG) || 0,
      fatG: parseFloat(currentFood.fatG) || 0,
      fiberG: parseFloat(currentFood.fiberG) || 0,
    }

    setFoodItems([...foodItems, foodItem])
    setCurrentFood({
      name: '',
      calories: '',
      proteinG: '',
      carbsG: '',
      fatG: '',
      fiberG: '',
    })
  }

  const calculateTotals = () => {
    return {
      totalCalories: foodItems.reduce((sum, item) => sum + item.calories, 0),
      totalProteinG: foodItems.reduce((sum, item) => sum + item.proteinG, 0),
      totalCarbsG: foodItems.reduce((sum, item) => sum + item.carbsG, 0),
      totalFatG: foodItems.reduce((sum, item) => sum + item.fatG, 0),
      totalFiberG: foodItems.reduce((sum, item) => sum + item.fiberG, 0),
    }
  }

  const handleReview = () => {
    const totals = calculateTotals()
    const meal: MealLog = {
      id: `meal-${Date.now()}`,
      userId: 'current-user',
      mealType,
      items: foodItems,
      totalCalories: totals.totalCalories,
      totalProteinG: totals.totalProteinG,
      totalCarbsG: totals.totalCarbsG,
      totalFatG: totals.totalFatG,
      totalFiberG: totals.totalFiberG,
      loggedAt: new Date().toISOString(),
      aiAnalyzed: false,
      synced: false,
    }

    onComplete(meal)
  }

  return (
    <View className="flex-1 bg-white">
      {/* Tab Navigation */}
      <View className="flex-row border-b border-gray-200">
        {(['manual', 'voice', 'photo'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-3 ${activeTab === tab ? 'border-b-2 border-blue-500' : ''}`}
          >
            <Text className="text-center capitalize">{tab}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView className="flex-1 p-4">
        {activeTab === 'manual' && (
          <View>
            <Text className="mb-4 text-lg font-bold">Add Food Item</Text>

            <TextInput
              placeholder="Food name"
              value={currentFood.name}
              onChangeText={(text) => setCurrentFood({ ...currentFood, name: text })}
              className="mb-2 rounded border border-gray-300 p-2"
            />

            <TextInput
              placeholder="Calories"
              value={currentFood.calories}
              onChangeText={(text) => setCurrentFood({ ...currentFood, calories: text })}
              keyboardType="decimal-pad"
              className="mb-2 rounded border border-gray-300 p-2"
            />

            <TextInput
              placeholder="Protein (g)"
              value={currentFood.proteinG}
              onChangeText={(text) => setCurrentFood({ ...currentFood, proteinG: text })}
              keyboardType="decimal-pad"
              className="mb-2 rounded border border-gray-300 p-2"
            />

            <TextInput
              placeholder="Carbs (g)"
              value={currentFood.carbsG}
              onChangeText={(text) => setCurrentFood({ ...currentFood, carbsG: text })}
              keyboardType="decimal-pad"
              className="mb-2 rounded border border-gray-300 p-2"
            />

            <TextInput
              placeholder="Fat (g)"
              value={currentFood.fatG}
              onChangeText={(text) => setCurrentFood({ ...currentFood, fatG: text })}
              keyboardType="decimal-pad"
              className="mb-2 rounded border border-gray-300 p-2"
            />

            <TextInput
              placeholder="Fiber (g)"
              value={currentFood.fiberG}
              onChangeText={(text) => setCurrentFood({ ...currentFood, fiberG: text })}
              keyboardType="decimal-pad"
              className="mb-4 rounded border border-gray-300 p-2"
            />

            <Pressable onPress={addFoodItem} className="mb-4 rounded bg-blue-500 p-3">
              <Text className="text-center font-bold text-white">Add Food</Text>
            </Pressable>

            {foodItems.length > 0 && (
              <View>
                <Text className="mb-2 text-lg font-bold">Foods Added</Text>
                <FlatList
                  scrollEnabled={false}
                  data={foodItems}
                  keyExtractor={(_, index) => index.toString()}
                  renderItem={({ item }) => (
                    <View className="mb-2 rounded border border-gray-200 p-2">
                      <Text className="font-semibold">{item.name}</Text>
                      <Text className="text-sm text-gray-600">
                        {item.calories} kcal | {item.proteinG}g P | {item.carbsG}g C | {item.fatG}g
                        F
                      </Text>
                    </View>
                  )}
                />
              </View>
            )}
          </View>
        )}

        {activeTab === 'voice' && (
          <View className="py-8">
            <Text className="text-center text-gray-500">Voice input coming soon</Text>
          </View>
        )}

        {activeTab === 'photo' && (
          <View className="py-8">
            <Text className="text-center text-gray-500">Photo input coming soon</Text>
          </View>
        )}
      </ScrollView>

      {foodItems.length > 0 && (
        <Pressable onPress={handleReview} className="m-4 rounded bg-green-500 p-4">
          <Text className="text-center font-bold text-white">Review & Save</Text>
        </Pressable>
      )}
    </View>
  )
}

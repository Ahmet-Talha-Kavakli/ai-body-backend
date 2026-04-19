import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { NutritionBadge } from '../../components/ar/NutritionBadge'
import type { FoodDetectionResult } from '../../types/ar'

type RootStackParamList = {
  FoodApprovalScreen: { detection: FoodDetectionResult; photoPath: string }
  FoodARScreen: undefined
  MealLogScreen: { detection: FoodDetectionResult }
}

type Props = NativeStackScreenProps<
  RootStackParamList,
  'FoodApprovalScreen'
>

export function FoodApprovalScreen({ navigation, route }: Props) {
  const { detection, photoPath } = route.params

  const [foodName, setFoodName] = useState(detection.detectedFoodName)
  const [portionSize, setPortionSize] = useState(
    detection.portionSize.toString()
  )
  const [portionUnit, setPortionUnit] = useState(detection.portionUnit)
  const [protein, setProtein] = useState(detection.nutrition.proteinG.toString())
  const [carbs, setCarbs] = useState(detection.nutrition.carbsG.toString())
  const [fat, setFat] = useState(detection.nutrition.fatG.toString())
  const [isLoading, setIsLoading] = useState(false)

  const calculateCalories = (): number => {
    const proteinCals = parseFloat(protein) * 4
    const carbsCals = parseFloat(carbs) * 4
    const fatCals = parseFloat(fat) * 9

    return Math.round(proteinCals + carbsCals + fatCals)
  }

  const calories = calculateCalories()

  const handleConfirmAndAdd = async () => {
    setIsLoading(true)

    // Create updated detection with new values
    const updatedDetection: FoodDetectionResult = {
      ...detection,
      detectedFoodName: foodName,
      portionSize: parseFloat(portionSize),
      portionUnit,
      nutrition: {
        ...detection.nutrition,
        calories,
        proteinG: parseFloat(protein),
        carbsG: parseFloat(carbs),
        fatG: parseFloat(fat),
      },
    }

    // Navigate to meal log creation
    setTimeout(() => {
      setIsLoading(false)
      navigation.navigate('MealLogScreen', { detection: updatedDetection })
    }, 500)
  }

  const handleTryAgain = () => {
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        {/* Photo Section */}
        {photoPath && (
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: `file://${photoPath}` }}
              style={styles.photo}
            />
          </View>
        )}

        {/* Detection Info */}
        <View style={styles.detectionSection}>
          <Text style={styles.sectionTitle}>Food Detection</Text>
          <View style={styles.confidenceRow}>
            <Text style={styles.label}>Detected:</Text>
            <Text style={styles.value}>{detection.detectedFoodName}</Text>
          </View>
          <View style={styles.confidenceRow}>
            <Text style={styles.label}>Confidence:</Text>
            <Text style={styles.value}>
              {Math.round(detection.confidence)}%
            </Text>
          </View>
        </View>

        {/* Nutrition Badge */}
        <View style={styles.badgeContainer}>
          <NutritionBadge
            nutrition={{
              calories,
              proteinG: parseFloat(protein),
              carbsG: parseFloat(carbs),
              fatG: parseFloat(fat),
              fiberG: detection.nutrition.fiberG,
            }}
            size="large"
          />
        </View>

        {/* Edit Section */}
        <View style={styles.editSection}>
          <Text style={styles.sectionTitle}>Edit Details</Text>

          {/* Food Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Food Name</Text>
            <TextInput
              style={styles.input}
              value={foodName}
              onChangeText={setFoodName}
              placeholder="Enter food name"
            />
          </View>

          {/* Portion Size */}
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Portion Size</Text>
              <TextInput
                style={styles.input}
                value={portionSize}
                onChangeText={setPortionSize}
                placeholder="0"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 0.8, marginLeft: 12 }]}>
              <Text style={styles.inputLabel}>Unit</Text>
              <TextInput
                style={styles.input}
                value={portionUnit}
                onChangeText={setPortionUnit}
                placeholder="g"
                maxLength={5}
              />
            </View>
          </View>

          {/* Macros */}
          <Text style={styles.macrosTitle}>Macronutrients</Text>
          <View style={styles.macrosRow}>
            <View style={styles.macroInput}>
              <Text style={styles.inputLabel}>Protein (g)</Text>
              <TextInput
                style={styles.input}
                value={protein}
                onChangeText={setProtein}
                placeholder="0"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.macroInput}>
              <Text style={styles.inputLabel}>Carbs (g)</Text>
              <TextInput
                style={styles.input}
                value={carbs}
                onChangeText={setCarbs}
                placeholder="0"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.macroInput}>
              <Text style={styles.inputLabel}>Fat (g)</Text>
              <TextInput
                style={styles.input}
                value={fat}
                onChangeText={setFat}
                placeholder="0"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Calculated Calories */}
          <View style={styles.caloriesDisplay}>
            <Text style={styles.caloriesLabel}>Total Calories:</Text>
            <Text style={styles.caloriesValue}>{calories} kcal</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.tryAgainButton]}
          onPress={handleTryAgain}
        >
          <Text style={styles.tryAgainButtonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.confirmButton]}
          onPress={handleConfirmAndAdd}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm & Add</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flex: 1,
    paddingBottom: 20,
  },
  photoContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  detectionSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  badgeContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  editSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  macrosTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  macroInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  caloriesDisplay: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  caloriesLabel: {
    fontSize: 13,
    color: '#666',
  },
  caloriesValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryAgainButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tryAgainButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
})

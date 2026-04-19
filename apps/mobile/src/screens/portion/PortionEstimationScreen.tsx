import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { PortionSlider } from '../../components/portion/PortionSlider'
import { usePortionStore } from '../../store/usePortionStore'

type RootStackParamList = {
  PortionEstimationScreen: { portionId: string }
  [key: string]: any
}

type Props = NativeStackScreenProps<RootStackParamList, 'PortionEstimationScreen'>

export function PortionEstimationScreen({ navigation, route }: Props) {
  const { currentPortion, savePortion } = usePortionStore()
  const [adjustedPortion, setAdjustedPortion] = useState(currentPortion?.estimatedPortionG ?? 150)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!currentPortion) return

    setIsSaving(true)
    try {
      await savePortion({
        ...currentPortion,
        userAdjustedPortionG: adjustedPortion,
      })

      navigation.goBack()
    } catch (error) {
      console.error('Failed to save portion:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!currentPortion) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>No portion data available</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Photo */}
      {currentPortion.photoPath && (
        <Image source={{ uri: currentPortion.photoPath }} style={styles.photo} />
      )}

      {/* Food Info */}
      <View style={styles.infoSection}>
        <Text style={styles.foodName}>{currentPortion.foodName}</Text>

        <View style={styles.confidenceRow}>
          <Text style={styles.label}>Confidence</Text>
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceFill,
                {
                  width: `${currentPortion.confidence}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.confidenceText}>{currentPortion.confidence}%</Text>
        </View>

        <Text style={styles.estimateDescription}>{currentPortion.estimatedPortionDescription}</Text>
      </View>

      {/* Portion Slider */}
      <View style={styles.sliderSection}>
        <PortionSlider
          initialPortionG={adjustedPortion}
          minG={50}
          maxG={500}
          foodName={currentPortion.foodName}
          portionDescription={currentPortion.estimatedPortionDescription}
          onPortionChange={setAdjustedPortion}
        />
      </View>

      {/* Nutritional Info */}
      <View style={styles.nutritionSection}>
        <Text style={styles.sectionTitle}>Estimated Nutrition (100g)</Text>
        <View style={styles.nutritionNote}>
          <Text style={styles.nutritionNoteText}>
            These values are estimates. Adjust portion to see updated nutrition.
          </Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isSaving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Portion</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  photo: {
    width: '100%',
    height: 250,
    backgroundColor: '#e0e0e0',
  },
  infoSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  foodName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    minWidth: 80,
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4caf50',
    minWidth: 40,
    textAlign: 'right',
  },
  estimateDescription: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  sliderSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  nutritionSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  nutritionNote: {
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  nutritionNoteText: {
    fontSize: 12,
    color: '#0066cc',
    lineHeight: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0066cc',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0066cc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  error: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    padding: 16,
  },
})

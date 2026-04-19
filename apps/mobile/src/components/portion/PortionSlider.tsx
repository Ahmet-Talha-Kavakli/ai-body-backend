import React, { useState, useEffect } from 'react'
import { View, Text, Slider, StyleSheet } from 'react-native'

interface PortionSliderProps {
  initialPortionG: number
  minG: number
  maxG: number
  foodName: string
  portionDescription?: string
  onPortionChange: (portionG: number) => void
}

export function PortionSlider({
  initialPortionG,
  minG,
  maxG,
  foodName,
  portionDescription,
  onPortionChange,
}: PortionSliderProps) {
  const [portion, setPortion] = useState(() => {
    if (initialPortionG < minG) return minG
    if (initialPortionG > maxG) return maxG
    return initialPortionG
  })

  useEffect(() => {
    onPortionChange(portion)
  }, [portion, onPortionChange])

  const handleSliderChange = (value: number) => {
    const rounded = Math.round(value)
    setPortion(rounded)
  }

  return (
    <View style={styles.container} testID="portion-slider">
      <Text style={styles.foodName}>{foodName}</Text>

      {portionDescription && <Text style={styles.description}>{portionDescription}</Text>}

      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={minG}
          maximumValue={maxG}
          value={portion}
          onValueChange={handleSliderChange}
          step={1}
        />
      </View>

      <Text style={styles.portionText}>{portion}g</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  foodName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  sliderContainer: {
    marginVertical: 16,
  },
  slider: {
    height: 40,
  },
  portionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0066cc',
    textAlign: 'center',
  },
})

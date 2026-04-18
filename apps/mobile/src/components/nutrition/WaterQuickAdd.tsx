import React, { useState } from 'react'
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native'

interface WaterQuickAddProps {
  onAdd: (ml: number) => void
  currentMl?: number
  goalMl?: number
}

export function WaterQuickAdd({ onAdd, currentMl = 0, goalMl = 2000 }: WaterQuickAddProps) {
  const [manualInput, setManualInput] = useState('')

  const handleQuickAdd = (ml: number) => {
    onAdd(ml)
  }

  const handleManualAdd = () => {
    const ml = parseInt(manualInput, 10)
    if (!isNaN(ml) && ml > 0) {
      onAdd(ml)
      setManualInput('')
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.progressText}>
          {currentMl} / {goalMl} ml
        </Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={() => handleQuickAdd(250)}>
          <Text style={styles.buttonText}>+250ml</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => handleQuickAdd(500)}>
          <Text style={styles.buttonText}>+500ml</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => handleQuickAdd(1000)}>
          <Text style={styles.buttonText}>+1L</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.manualContainer}>
        <TextInput
          style={styles.input}
          placeholder="ml cinsinden girin"
          value={manualInput}
          onChangeText={setManualInput}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleManualAdd}>
          <Text style={styles.addButtonText}>Ekle</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    gap: 16,
  },
  header: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  manualContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
})

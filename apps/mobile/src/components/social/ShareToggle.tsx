import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

type ShareOption = 'private' | 'friends' | 'team'

interface ShareToggleProps {
  currentOption: ShareOption
  onOptionChange: (option: ShareOption) => void
}

export function ShareToggle({ currentOption, onOptionChange }: ShareToggleProps) {
  const options: Array<{ value: ShareOption; label: string; icon: string }> = [
    { value: 'private', label: 'Private', icon: '🔒' },
    { value: 'friends', label: 'Friends', icon: '👥' },
    { value: 'team', label: 'Team', icon: '👨‍👩‍👧‍👦' },
  ]

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Share with</Text>
      <View style={styles.toggleGroup}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.option, currentOption === option.value && styles.optionActive]}
            onPress={() => onOptionChange(option.value)}
          >
            <Text style={styles.icon}>{option.icon}</Text>
            <Text
              style={[
                styles.optionLabel,
                currentOption === option.value && styles.optionLabelActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  optionActive: {
    borderColor: '#0066cc',
    backgroundColor: '#e8f0ff',
  },
  icon: {
    fontSize: 20,
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  optionLabelActive: {
    color: '#0066cc',
  },
})

import React from 'react'
import { View, StyleSheet, Text } from 'react-native'

interface MacroProgressBarProps {
  current: number
  goal: number
  label: string
  unit?: string
  color?: string
}

export function MacroProgressBar({
  current,
  goal,
  label,
  unit = '',
  color = '#4CAF50',
}: MacroProgressBarProps) {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0
  const isLow = percentage < 60
  const isWarning = percentage >= 60 && percentage < 80
  const isGood = percentage >= 80

  let barColor = color
  if (isLow) barColor = '#FF6B6B' // Red
  if (isWarning) barColor = '#FFA500' // Orange
  if (isGood) barColor = '#4CAF50' // Green

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {current} / {goal} {unit}
        </Text>
      </View>
      <View style={styles.barContainer}>
        <View
          style={[
            styles.bar,
            {
              width: `${percentage}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
      <View style={styles.footer}>
        <Text style={styles.percentage}>{percentage.toFixed(0)}%</Text>
        <Text style={[styles.status, { color: barColor }]}>
          {isLow && 'Low'}
          {isWarning && 'Getting there'}
          {isGood && 'On track'}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  barContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
})

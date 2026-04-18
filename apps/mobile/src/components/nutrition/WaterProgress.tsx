import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

interface WaterProgressProps {
  current: number
  goal: number
}

export function WaterProgress({ current, goal }: WaterProgressProps) {
  const percentage = Math.min((current / goal) * 100, 100)
  const circumference = 2 * Math.PI * 45

  // Calculate the stroke dash offset based on progress
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <View style={styles.container}>
      <View style={styles.ringContainer}>
        <Svg width={120} height={120} viewBox="0 0 120 120">
          {/* Background circle */}
          <Circle cx="60" cy="60" r="45" stroke="#e5e7eb" strokeWidth="8" fill="none" />
          {/* Progress circle */}
          <Circle
            cx="60"
            cy="60"
            r="45"
            stroke="#3b82f6"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation={-90}
            originX="60"
            originY="60"
            testID="progress-ring"
            aria-valuenow={Math.round(percentage)}
          />
        </Svg>

        {/* Center text */}
        <View style={styles.centerText}>
          <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
        </View>
      </View>

      {/* Water amount text */}
      <Text style={styles.waterText}>
        {current} / {goal} ml
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  ringContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: 120,
    height: 120,
  },
  percentageText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
  },
  waterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
})

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface FormScoreGaugeProps {
  score: number // 0-100
  size?: 'small' | 'large'
}

const getStylesForSize = (size: 'small' | 'large' = 'large') => {
  const isLarge = size === 'large'
  return StyleSheet.create({
    container: {
      width: isLarge ? 128 : 80,
      height: isLarge ? 128 : 80,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    textContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreText: {
      fontSize: isLarge ? 36 : 24,
      fontWeight: '700',
      color: '#111827',
    },
    label: {
      fontSize: 12,
      color: '#4b5563',
    },
  })
}

/**
 * FormScoreGauge - displays form score as circular progress
 * Shows percentage in center with visual indication of quality
 */
export const FormScoreGauge: React.FC<FormScoreGaugeProps> = ({
  score,
  size = 'large',
}) => {
  const styles = getStylesForSize(size)

  // Determine color based on score
  let bgColor = '#ef4444' // 0-50
  if (score >= 50 && score < 75) {
    bgColor = '#eab308'
  } else if (score >= 75) {
    bgColor = '#10b981'
  }

  const isLarge = size === 'large'
  const containerSize = isLarge ? 128 : 80
  const radius = isLarge ? 50 : 35
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <View style={styles.container}>
      <svg
        width={containerSize}
        height={containerSize}
        style={{ position: 'absolute' }}
      >
        <circle
          cx={containerSize / 2}
          cy={containerSize / 2}
          r={radius - 4}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="4"
        />
        <circle
          cx={containerSize / 2}
          cy={containerSize / 2}
          r={radius - 4}
          fill="none"
          stroke={bgColor}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${containerSize / 2} ${containerSize / 2})`}
        />
      </svg>
      <View style={styles.textContainer}>
        <Text style={styles.scoreText}>
          {Math.round(score)}%
        </Text>
        <Text style={styles.label}>Form Score</Text>
      </View>
    </View>
  )
}

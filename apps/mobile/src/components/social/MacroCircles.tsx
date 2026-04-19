import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface Nutrition {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
}

interface Goals {
  caloriesGoal: number
  proteinGoal: number
  carbsGoal: number
  fatGoal: number
  fiberGoal: number
}

interface MacroCirclesProps {
  nutrition: Nutrition
  goals: Goals
}

const Circle = ({
  label,
  current,
  goal,
  unit,
}: {
  label: string
  current: number
  goal: number
  unit: string
}) => {
  const percentage = Math.min((current / goal) * 100, 100)
  const isExceeded = current > goal
  const displayPercent = Math.round(percentage)

  return (
    <View style={styles.circleContainer}>
      <View
        style={[
          styles.circle,
          {
            borderColor: isExceeded ? '#d32f2f' : '#4caf50',
            borderWidth: 3,
          },
        ]}
      >
        <View style={styles.circleContent}>
          <Text style={styles.circlePercentage}>{displayPercent}%</Text>
          <Text style={styles.circleLabel}>{label}</Text>
        </View>
      </View>
      <Text style={styles.circleValues}>
        {current.toFixed(0)}
        {unit} / {goal}
        {unit}
      </Text>
    </View>
  )
}

export function MacroCircles({ nutrition, goals }: MacroCirclesProps) {
  const macros = [
    { label: 'Protein', current: nutrition.proteinG, goal: goals.proteinGoal, unit: 'g' },
    { label: 'Carbs', current: nutrition.carbsG, goal: goals.carbsGoal, unit: 'g' },
    { label: 'Fat', current: nutrition.fatG, goal: goals.fatGoal, unit: 'g' },
    { label: 'Fiber', current: nutrition.fiberG, goal: goals.fiberGoal, unit: 'g' },
  ]

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Macros Progress</Text>
      <View style={styles.circlesGrid}>
        {macros.map((macro) => (
          <Circle
            key={macro.label}
            label={macro.label}
            current={macro.current}
            goal={macro.goal}
            unit={macro.unit}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  circlesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  circleContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '48%',
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  circleContent: {
    alignItems: 'center',
  },
  circlePercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  circleLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  circleValues: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
})

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface Nutrition {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
}

interface NutritionComparisonProps {
  yourNutrition: Nutrition
  compareWith: Nutrition
  compareLabel: string
}

export function NutritionComparison({
  yourNutrition,
  compareWith,
  compareLabel,
}: NutritionComparisonProps) {
  const macros = [
    { label: 'Calories', key: 'calories', unit: 'kcal' },
    { label: 'Protein', key: 'proteinG', unit: 'g' },
    { label: 'Carbs', key: 'carbsG', unit: 'g' },
    { label: 'Fat', key: 'fatG', unit: 'g' },
    { label: 'Fiber', key: 'fiberG', unit: 'g' },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nutrition Comparison</Text>
      </View>

      <View style={styles.comparisonTable}>
        {/* Header row */}
        <View style={styles.tableRow}>
          <Text style={[styles.cell, styles.macroCell]}>Macro</Text>
          <Text style={[styles.cell, styles.headerCell]}>You</Text>
          <Text style={[styles.cell, styles.headerCell]}>{compareLabel}</Text>
          <Text style={[styles.cell, styles.diffCell]}>Diff</Text>
        </View>

        {/* Data rows */}
        {macros.map((macro) => {
          const yourValue = yourNutrition[macro.key as keyof Nutrition]
          const compareValue = compareWith[macro.key as keyof Nutrition]
          const diff = compareValue - yourValue
          const isHigher = diff > 0

          return (
            <View key={macro.key} style={styles.tableRow}>
              <Text style={[styles.cell, styles.macroCell]}>{macro.label}</Text>
              <Text style={[styles.cell, styles.valueCell]}>
                {yourValue.toFixed(0)}
                {macro.unit}
              </Text>
              <Text style={[styles.cell, styles.valueCell]}>
                {compareValue.toFixed(0)}
                {macro.unit}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.diffCell,
                  isHigher ? styles.diffHigher : styles.diffLower,
                ]}
              >
                {isHigher ? '+' : ''}
                {diff.toFixed(0)}
                {macro.unit}
              </Text>
            </View>
          )
        })}
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
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  comparisonTable: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  cell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroCell: {
    alignItems: 'flex-start',
    flex: 1.2,
  },
  headerCell: {
    fontWeight: '600',
    color: '#1a1a1a',
    backgroundColor: '#f5f5f5',
  },
  valueCell: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  diffCell: {
    fontSize: 12,
    fontWeight: '600',
  },
  diffHigher: {
    color: '#d32f2f',
  },
  diffLower: {
    color: '#388e3c',
  },
})

import React from 'react'
import { Text, View, ScrollView } from 'react-native'
import type { AnalyticsChartData } from '../../types'

interface AnalyticsChartProps {
  title: string
  data: AnalyticsChartData
  chartType?: 'line' | 'bar'
  onDataPointPress?: (index: number, label: string) => void
}

export function AnalyticsChart({
  title,
  data,
  chartType = 'line',
  onDataPointPress,
}: AnalyticsChartProps) {
  const maxValue = Math.max(
    ...data.datasets.flatMap(d => d.data as number[])
  ) || 100
  const minValue = Math.min(
    ...data.datasets.flatMap(d => d.data as number[])
  ) || 0
  const range = maxValue - minValue || 1

  return (
    <View
      className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      testID="analytics-chart"
    >
      <Text className="mb-3 text-sm font-bold text-gray-900">{title}</Text>

      {data.datasets.length === 0 ? (
        <View className="h-40 items-center justify-center">
          <Text className="text-xs text-gray-500">No data available</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row items-end space-x-2 pr-4">
            {data.labels.map((label, index) => {
              const values = data.datasets.map(d => (d.data[index] as number) || 0)
              const maxDataValue = Math.max(...values)
              const height = ((maxDataValue - minValue) / range) * 100 + 40

              return (
                <View key={`${label}-${index}`} className="items-center">
                  <View className="mb-2 flex-row space-x-1">
                    {data.datasets.map((dataset, dIdx) => {
                      const dataValue = (dataset.data[index] as number) || 0
                      const barHeight = ((dataValue - minValue) / range) * 100

                      return (
                        <View
                          key={`bar-${dIdx}`}
                          className="rounded-t"
                          style={{
                            width: 8,
                            height: Math.max(barHeight, 2),
                            backgroundColor: dataset.borderColor,
                          }}
                          onTouchEnd={() =>
                            onDataPointPress?.(index, label)
                          }
                        />
                      )
                    })}
                  </View>
                  <Text className="text-xs text-gray-500">{label}</Text>
                </View>
              )
            })}
          </View>
        </ScrollView>
      )}

      {data.datasets.length > 0 && (
        <View className="mt-4 border-t border-gray-200 pt-3">
          {data.datasets.map((dataset, idx) => (
            <View key={idx} className="flex-row items-center mb-2">
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  backgroundColor: dataset.borderColor,
                  marginRight: 8,
                }}
              />
              <Text className="text-xs text-gray-600">{dataset.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import type { HeartRateReading } from '../../types/health'

interface HeartRateChartProps {
  readings: HeartRateReading[]
  timeRange: 'today' | 'week' | 'month'
  highlightReading?: HeartRateReading
}

export function HeartRateChart({
  readings,
  timeRange,
  highlightReading,
}: HeartRateChartProps) {
  const minBpm = Math.min(60, ...readings.map(r => r.bpm), 60)
  const maxBpm = Math.max(180, ...readings.map(r => r.bpm), 180)
  const range = maxBpm - minBpm
  const chartHeight = 200

  return (
    <View className="rounded-lg border border-gray-200 bg-white p-4">
      <View className="mb-4 flex flex-row justify-between">
        <Text className="text-sm font-semibold text-gray-900">Heart Rate ({timeRange})</Text>
        {readings.length > 0 && (
          <Text className="text-xs text-gray-500">{readings.length} readings</Text>
        )}
      </View>

      {readings.length === 0 ? (
        <View className="flex h-48 items-center justify-center">
          <Text className="text-sm text-gray-500">No heart rate data available</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ height: chartHeight }} className="flex flex-row items-end gap-2 pr-4">
            {readings.map((reading, index) => {
              const height = ((reading.bpm - minBpm) / range) * chartHeight
              const isHighlight = highlightReading?.id === reading.id

              return (
                <View key={reading.id || index} className="flex flex-col items-center gap-1">
                  <View
                    style={{
                      height: Math.max(height, 4),
                      width: 8,
                    }}
                    className={`rounded-sm ${isHighlight ? 'bg-red-500' : 'bg-blue-400'}`}
                  />
                  <Text className="text-xs text-gray-500">{reading.bpm}</Text>
                </View>
              )
            })}
          </View>
        </ScrollView>
      )}

      {readings.length > 0 && (
        <View className="mt-4 flex flex-row justify-between">
          <View>
            <Text className="text-xs text-gray-600">Min</Text>
            <Text className="font-semibold text-gray-900">
              {Math.min(...readings.map(r => r.bpm))}
            </Text>
          </View>
          <View>
            <Text className="text-xs text-gray-600">Avg</Text>
            <Text className="font-semibold text-gray-900">
              {Math.round(readings.reduce((sum, r) => sum + r.bpm, 0) / readings.length)}
            </Text>
          </View>
          <View>
            <Text className="text-xs text-gray-600">Max</Text>
            <Text className="font-semibold text-gray-900">
              {Math.max(...readings.map(r => r.bpm))}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}

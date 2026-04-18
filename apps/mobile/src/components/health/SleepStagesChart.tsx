import React from 'react'
import { View, Text } from 'react-native'
import type { SleepSession } from '../../types/health'

interface SleepStagesChartProps {
  sessions: SleepSession[]
}

export function SleepStagesChart({ sessions }: SleepStagesChartProps) {
  const getStagePercentage = (minutes: number, total: number) => {
    if (total === 0) return 0
    return Math.round((minutes / total) * 100)
  }

  return (
    <View className="rounded-lg border border-gray-200 bg-white p-4">
      <Text className="mb-4 text-sm font-semibold text-gray-900">Sleep Stages (Weekly)</Text>

      {sessions.length === 0 ? (
        <View className="flex h-32 items-center justify-center">
          <Text className="text-sm text-gray-500">No sleep data available</Text>
        </View>
      ) : (
        <View className="flex flex-col gap-4">
          {sessions.slice(0, 7).map((session, index) => {
            const total =
              (session.stages?.remMinutes || 0) +
              (session.stages?.deepMinutes || 0) +
              (session.stages?.lightMinutes || 0) +
              (session.stages?.awakeMinutes || 0)

            if (total === 0) return null

            const remPct = getStagePercentage(session.stages?.remMinutes || 0, total)
            const deepPct = getStagePercentage(session.stages?.deepMinutes || 0, total)
            const lightPct = getStagePercentage(session.stages?.lightMinutes || 0, total)
            const awakePct = getStagePercentage(session.stages?.awakeMinutes || 0, total)

            return (
              <View key={session.id || index} className="flex flex-col gap-2">
                <Text className="text-xs font-medium text-gray-600">{session.startTime.split('T')[0]}</Text>

                <View className="flex flex-row overflow-hidden rounded-full bg-gray-100 height-2">
                  {remPct > 0 && (
                    <View style={{ width: `${remPct}%` }} className="bg-blue-500" />
                  )}
                  {deepPct > 0 && (
                    <View style={{ width: `${deepPct}%` }} className="bg-indigo-700" />
                  )}
                  {lightPct > 0 && (
                    <View style={{ width: `${lightPct}%` }} className="bg-cyan-300" />
                  )}
                  {awakePct > 0 && (
                    <View style={{ width: `${awakePct}%` }} className="bg-gray-400" />
                  )}
                </View>

                <View className="flex flex-row justify-between text-xs text-gray-600">
                  <Text>{remPct}% REM</Text>
                  <Text>{deepPct}% Deep</Text>
                  <Text>{lightPct}% Light</Text>
                  <Text>{awakePct}% Awake</Text>
                </View>
              </View>
            )
          })}
        </View>
      )}

      {sessions.length > 0 && (
        <View className="mt-4 flex flex-row gap-4 border-t border-gray-200 pt-4">
          <View className="flex flex-row items-center gap-2">
            <View className="h-2 w-4 rounded-sm bg-blue-500" />
            <Text className="text-xs text-gray-600">REM</Text>
          </View>
          <View className="flex flex-row items-center gap-2">
            <View className="h-2 w-4 rounded-sm bg-indigo-700" />
            <Text className="text-xs text-gray-600">Deep</Text>
          </View>
          <View className="flex flex-row items-center gap-2">
            <View className="h-2 w-4 rounded-sm bg-cyan-300" />
            <Text className="text-xs text-gray-600">Light</Text>
          </View>
          <View className="flex flex-row items-center gap-2">
            <View className="h-2 w-4 rounded-sm bg-gray-400" />
            <Text className="text-xs text-gray-600">Awake</Text>
          </View>
        </View>
      )}
    </View>
  )
}

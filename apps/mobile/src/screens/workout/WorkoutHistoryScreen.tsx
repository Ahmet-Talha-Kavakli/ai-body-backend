/**
 * Workout History Screen
 * View past workout sessions with stats and analytics
 */

import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, Pressable } from 'react-native'
import type { SessionRecord } from '@/src/lib/session/types'

interface WorkoutStats {
  totalSessions: number
  totalReps: number
  avgFormScore: number
  longestSession: number
  lastSessionDate: Date | null
}

interface WorkoutHistoryScreenProps {
  sessions?: SessionRecord[]
}

export function WorkoutHistoryScreen({ sessions = [] }: WorkoutHistoryScreenProps) {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null)
  const [stats, setStats] = useState<WorkoutStats>({
    totalSessions: 0,
    totalReps: 0,
    avgFormScore: 0,
    longestSession: 0,
    lastSessionDate: null,
  })

  // Calculate statistics
  useEffect(() => {
    if (sessions.length === 0) {
      setStats({
        totalSessions: 0,
        totalReps: 0,
        avgFormScore: 0,
        longestSession: 0,
        lastSessionDate: null,
      })
      return
    }

    const totalReps = sessions.reduce((sum, s) => sum + (s.totalReps || 0), 0)
    const avgFormScore =
      sessions.reduce((sum, s) => sum + (s.avgFormScore || 0), 0) / sessions.length
    const sessionDurations = sessions.map((s) => {
      const start = new Date(s.startTime).getTime()
      const end = new Date(s.endTime).getTime()
      return (end - start) / 1000 / 60 // minutes
    })
    const longestSession = Math.max(...sessionDurations)
    const lastSessionDate = sessions.length > 0 ? new Date(sessions[0].startTime) : null

    setStats({
      totalSessions: sessions.length,
      totalReps,
      avgFormScore: Math.round(avgFormScore * 10) / 10,
      longestSession: Math.round(longestSession),
      lastSessionDate,
    })
  }, [sessions])

  const renderSessionItem = ({ item }: { item: SessionRecord }) => {
    const isExpanded = expandedSessionId === item.id
    const duration = Math.round(
      (new Date(item.endTime).getTime() - new Date(item.startTime).getTime()) / 1000 / 60
    )

    return (
      <Pressable
        onPress={() => setExpandedSessionId(isExpanded ? null : item.id)}
        className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
      >
        {/* Session Header */}
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-lg font-semibold capitalize text-slate-900">{item.exercise}</Text>
            <Text className="mt-1 text-sm text-slate-600">
              {new Date(item.startTime).toLocaleDateString()}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-2xl font-bold text-blue-600">{item.avgFormScore}</Text>
            <Text className="text-xs text-slate-600">Form Score</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="mt-3 flex-row gap-4 border-t border-slate-200 pt-3">
          <View>
            <Text className="text-xs text-slate-600">Reps</Text>
            <Text className="text-lg font-semibold text-slate-900">{item.totalReps}</Text>
          </View>
          <View>
            <Text className="text-xs text-slate-600">Duration</Text>
            <Text className="text-lg font-semibold text-slate-900">{duration}m</Text>
          </View>
          <View>
            <Text className="text-xs text-slate-600">Frames</Text>
            <Text className="text-lg font-semibold text-slate-900">{item.frames.length}</Text>
          </View>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View className="mt-4 border-t border-slate-200 pt-4">
            {/* Feedback */}
            {item.voiceFeedback && item.voiceFeedback.length > 0 && (
              <View className="mb-4">
                <Text className="mb-2 text-sm font-semibold text-slate-900">Feedback</Text>
                {item.voiceFeedback.map((feedback, idx) => (
                  <Text key={idx} className="mb-1 text-sm text-slate-700">
                    • {feedback}
                  </Text>
                ))}
              </View>
            )}

            {/* Muscle Engagement */}
            {item.frames.length > 0 && item.frames[0].muscleEngagement && (
              <View className="mb-4">
                <Text className="mb-2 text-sm font-semibold text-slate-900">Muscle Engagement</Text>
                <View className="rounded-lg bg-slate-100 p-3">
                  {Object.entries(item.frames[0].muscleEngagement).map(([muscle, engagement]) => (
                    <View key={muscle} className="mb-2 flex-row justify-between">
                      <Text className="text-xs capitalize text-slate-700">{muscle}</Text>
                      <Text className="text-xs font-semibold text-slate-900">
                        {Math.round(engagement * 100)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Rep Breakdown */}
            {item.frames.length > 0 && (
              <View>
                <Text className="mb-2 text-sm font-semibold text-slate-900">Rep Details</Text>
                {item.frames.slice(0, 3).map((frame, idx) => (
                  <View key={idx} className="mb-1 flex-row justify-between">
                    <Text className="text-xs text-slate-700">Rep {frame.repNumber}</Text>
                    <Text className="text-xs text-slate-700">Form: {frame.formScore}</Text>
                  </View>
                ))}
                {item.frames.length > 3 && (
                  <Text className="mt-2 text-xs text-slate-600">
                    +{item.frames.length - 3} more reps
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </Pressable>
    )
  }

  return (
    <View className="flex-1 bg-white">
      {/* Stats Overview */}
      <View className="border-b border-slate-200 bg-blue-50 p-4">
        <Text className="mb-3 text-lg font-semibold text-slate-900">Your Stats</Text>

        <View className="flex-row justify-between gap-3">
          <View className="flex-1 rounded-lg border border-slate-200 bg-white p-3">
            <Text className="text-2xl font-bold text-blue-600">{stats.totalSessions}</Text>
            <Text className="mt-1 text-xs text-slate-600">Total Sessions</Text>
          </View>

          <View className="flex-1 rounded-lg border border-slate-200 bg-white p-3">
            <Text className="text-2xl font-bold text-green-600">{stats.totalReps}</Text>
            <Text className="mt-1 text-xs text-slate-600">Total Reps</Text>
          </View>

          <View className="flex-1 rounded-lg border border-slate-200 bg-white p-3">
            <Text className="text-2xl font-bold text-purple-600">{stats.avgFormScore}</Text>
            <Text className="mt-1 text-xs text-slate-600">Avg Form</Text>
          </View>
        </View>

        {stats.lastSessionDate && (
          <Text className="mt-3 text-xs text-slate-600">
            Last session: {stats.lastSessionDate.toLocaleDateString()}
          </Text>
        )}
      </View>

      {/* Session List */}
      {sessions.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-600">No workout sessions yet</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSessionItem}
          keyExtractor={(item) => item.id}
          className="flex-1 px-4 py-4"
          ListHeaderComponent={
            <Text className="mb-3 text-sm text-slate-500">{sessions.length} sessions recorded</Text>
          }
        />
      )}
    </View>
  )
}

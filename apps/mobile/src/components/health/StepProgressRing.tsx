import React from 'react'
import { View, Text } from 'react-native'

interface StepProgressRingProps {
  current: number
  goal: number
}

export function StepProgressRing({ current, goal }: StepProgressRingProps) {
  const progress = Math.min((current / goal) * 100, 100)
  const isGoalMet = current >= goal
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <View className="flex flex-col items-center gap-6 rounded-lg border border-gray-200 bg-white p-6">
      <View className="relative flex h-40 w-40 items-center justify-center">
        <svg height="160" width="160" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="80"
            cy="80"
            r="45"
            fill="none"
            stroke={isGoalMet ? '#10b981' : '#3b82f6'}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }}
          />
        </svg>

        <View className="absolute flex flex-col items-center justify-center gap-1">
          <Text className="text-3xl font-bold text-gray-900">{current.toLocaleString()}</Text>
          <View className="flex flex-row items-baseline gap-1">
            <Text className="text-xs text-gray-600">/</Text>
            <Text className="text-sm font-medium text-gray-600">{goal.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <View className="flex flex-col items-center gap-1">
        <Text className="text-2xl font-bold text-gray-900">{Math.round(progress)}%</Text>
        <Text className={`text-sm font-medium ${isGoalMet ? 'text-green-600' : 'text-blue-600'}`}>
          {isGoalMet ? 'Goal Met!' : 'In Progress'}
        </Text>
      </View>
    </View>
  )
}

import React, { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'

interface GoalProgressRingProps {
  label: string
  current: number
  goal: number
  unit: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  onPress?: () => void
}

const SizeConfig = {
  sm: { radius: 35, strokeWidth: 4, fontSize: 'text-xs' },
  md: { radius: 50, strokeWidth: 5, fontSize: 'text-sm' },
  lg: { radius: 65, strokeWidth: 6, fontSize: 'text-base' },
}

export function GoalProgressRing({
  label,
  current,
  goal,
  unit,
  color,
  size = 'md',
  onPress,
}: GoalProgressRingProps) {
  const config = SizeConfig[size]
  const progress = goal > 0 ? Math.min((current / goal) * 100, 100) : 0
  const exceeded = current > goal
  const displayProgress = Math.min(progress, 100)

  const circumference = 2 * Math.PI * config.radius

  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      testID="goal-progress-ring"
    >
      <View className="mb-2 items-center justify-center">
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: config.radius * 2 + 20,
            height: config.radius * 2 + 20,
            backgroundColor: '#F9FAFB',
            borderWidth: config.strokeWidth,
            borderColor: '#E5E7EB',
            borderRadius: (config.radius + 10) * 2,
          }}
        >
          <View
            className="absolute items-center justify-center"
            style={{
              width: config.radius * 2,
              height: config.radius * 2,
              borderRadius: config.radius,
            }}
          >
            <View
              style={{
                position: 'absolute',
                width: config.radius * 2,
                height: config.radius * 2,
                borderRadius: config.radius,
                borderWidth: config.strokeWidth,
                borderColor: color,
                opacity: displayProgress / 100,
                borderTopColor: color,
                borderRightColor: color,
                borderBottomColor: 'transparent',
                borderLeftColor: 'transparent',
                transform: [
                  {
                    rotate: `${(displayProgress / 100) * 360}deg`,
                  },
                ],
              }}
            />
          </View>

          <View className="items-center justify-center">
            <Text className={`font-bold text-gray-900 ${config.fontSize}`}>
              {current}
            </Text>
            <Text className="text-xs text-gray-500">
              of {goal} {unit}
            </Text>
            {exceeded && (
              <Text className="mt-1 text-xs font-semibold text-green-600">
                +{current - goal} over
              </Text>
            )}
          </View>
        </View>
      </View>

      <Text className="text-center text-xs font-medium text-gray-700">
        {label}
      </Text>
      <Text className="mt-1 text-center text-xs text-gray-500">
        {Math.round(displayProgress)}% complete
      </Text>
    </Pressable>
  )
}

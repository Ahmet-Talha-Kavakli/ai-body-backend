import React, { useMemo } from 'react'
import { View, Text, ScrollView } from 'react-native'

interface StreakCalendarProps {
  currentStreak: number
  loggingDates: string[]
}

export function StreakCalendar({ currentStreak, loggingDates }: StreakCalendarProps) {
  // Generate 7 weeks (49 days) of calendar
  const calendarDays = useMemo(() => {
    const days = []
    const MS_PER_DAY = 86400000
    const today = new Date()
    const startDate = new Date(today.getTime() - 42 * MS_PER_DAY)
    const loggedSet = new Set(loggingDates) // O(1) lookup instead of O(n)

    for (let i = 0; i < 49; i++) {
      const date = new Date(startDate.getTime() + i * MS_PER_DAY)
      const dateStr = date.toISOString().split('T')[0]

      days.push({
        date,
        dateStr,
        dayOfMonth: date.getDate(),
        isLogged: loggedSet.has(dateStr),
      })
    }

    return days
  }, [loggingDates])

  return (
    <ScrollView className="flex-1 bg-white p-4">
      {/* Header with streak info */}
      <View className="mb-6">
        <Text className="text-center text-2xl font-bold">{currentStreak} gün 🔥</Text>
      </View>

      {/* Calendar grid */}
      <View testID="calendar-grid" className="gap-2">
        {/* Render in rows of 7 */}
        {Array.from({ length: 7 }).map((_, weekIndex) => (
          <View key={`week-${weekIndex}`} className="flex-row justify-between gap-2">
            {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day) => {
              const backgroundColor = day.isLogged ? 'rgb(34, 197, 94)' : 'rgb(209, 213, 219)'
              const textColor = day.isLogged ? 'white' : 'rgb(107, 114, 128)'

              return (
                <View
                  key={day.dateStr}
                  testID={`day-${day.dateStr}`}
                  className="flex aspect-square flex-1 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor,
                  }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{
                      color: textColor,
                    }}
                  >
                    {day.dayOfMonth}
                  </Text>
                </View>
              )
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View className="mt-6 flex-row justify-center gap-4">
        <View className="flex-row items-center gap-2">
          <View className="h-4 w-4 rounded bg-green-500" />
          <Text className="text-sm text-gray-600">Logging yapıldı</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="h-4 w-4 rounded bg-gray-300" />
          <Text className="text-sm text-gray-600">Yapılmadı</Text>
        </View>
      </View>
    </ScrollView>
  )
}

import React, { useState, useMemo } from 'react'
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native'
import type { Coach } from '../../types/coaching'

interface AvailabilityCalendarProps {
  availability: Coach['availability']
  onSelectTime: (slot: { dayOfWeek: number; startTime: string }) => void
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  dayContainer: {
    marginBottom: 16,
  },
  dayName: {
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  slotButtonActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  slotButtonInactive: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  slotText: {
    fontSize: 14,
    fontWeight: '500',
  },
  slotTextActive: {
    color: '#15803d',
  },
  slotTextInactive: {
    color: '#374151',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
})

/**
 * AvailabilityCalendar - displays weekly availability with time slots
 * Shows available slots with green dots and allows selection
 */
export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  availability,
  onSelectTime,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<{
    dayOfWeek: number
    startTime: string
  } | null>(null)

  const weekSlots = useMemo(() => {
    const slots: Record<
      number,
      { startTime: string; endTime: string }[]
    > = {}

    for (let i = 0; i < 7; i++) {
      slots[i] = []
    }

    availability.forEach((slot) => {
      if (!slots[slot.dayOfWeek]) {
        slots[slot.dayOfWeek] = []
      }
      slots[slot.dayOfWeek].push({
        startTime: slot.startTime,
        endTime: slot.endTime,
      })
    })

    return slots
  }, [availability])

  const handleSelectSlot = (dayOfWeek: number, startTime: string) => {
    setSelectedSlot({ dayOfWeek, startTime })
    onSelectTime({ dayOfWeek, startTime })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Availability
      </Text>

      <FlatList
        scrollEnabled={false}
        data={Array.from({ length: 7 }, (_, i) => i)}
        renderItem={({ item: dayOfWeek }) => (
          <View key={dayOfWeek} style={styles.dayContainer}>
            <Text style={styles.dayName}>
              {DAY_NAMES[dayOfWeek]}
            </Text>
            {weekSlots[dayOfWeek] && weekSlots[dayOfWeek].length > 0 ? (
              <View style={styles.slotsRow}>
                {weekSlots[dayOfWeek].map((slot) => {
                  const isSelected =
                    selectedSlot?.dayOfWeek === dayOfWeek &&
                    selectedSlot?.startTime === slot.startTime

                  return (
                    <Pressable
                      key={`${dayOfWeek}-${slot.startTime}`}
                      onPress={() =>
                        handleSelectSlot(dayOfWeek, slot.startTime)
                      }
                      style={[
                        styles.slotButton,
                        isSelected
                          ? styles.slotButtonActive
                          : styles.slotButtonInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.slotText,
                          isSelected
                            ? styles.slotTextActive
                            : styles.slotTextInactive,
                        ]}
                      >
                        {slot.startTime} - {slot.endTime}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            ) : (
              <Text style={styles.emptyText}>Not available</Text>
            )}
          </View>
        )}
        keyExtractor={(item) => item.toString()}
      />
    </View>
  )
}

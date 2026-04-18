import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { StreakData } from '@/types/social-social'

interface StreakCounterProps {
  streak: StreakData
  size?: 'small' | 'medium' | 'large'
  variant?: 'compact' | 'expanded'
  animate?: boolean
  showMilestone?: boolean
  onPress?: () => void
}

export function StreakCounter({
  streak,
  size = 'medium',
  variant = 'compact',
  animate = false,
  showMilestone = false,
  onPress,
}: StreakCounterProps) {
  const sizeMap = useMemo(() => {
    const baseMap = {
      small: { container: 60, icon: 24, text: 14, label: 10 },
      medium: { container: 80, icon: 32, text: 18, label: 12 },
      large: { container: 120, icon: 48, text: 24, label: 14 },
    }
    return baseMap[size]
  }, [size])

  const isActive = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const lastActivity = streak.lastActivityDate.split('T')[0]
    return lastActivity === today
  }, [streak.lastActivityDate])

  const isMilestone = useMemo(() => {
    return streak.currentStreak > 0 && streak.currentStreak % 10 === 0
  }, [streak.currentStreak])

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        width: sizeMap.container,
        height: sizeMap.container,
        backgroundColor: isActive ? '#FFE8B6' : '#F5F5F5',
      },
    ],
    [sizeMap.container, isActive]
  )

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={containerStyle}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {variant === 'expanded' ? (
        <View style={styles.expandedContent}>
          <View style={styles.expandedRow}>
            <Text style={[styles.label, { fontSize: sizeMap.label }]}>
              Current Streak
            </Text>
            <View style={styles.expandedStreakContainer}>
              <Text style={{ fontSize: sizeMap.icon }}>
                {isActive ? '🔥' : '✨'}
              </Text>
              <Text
                style={[
                  styles.streakValue,
                  { fontSize: sizeMap.text, marginLeft: 4 },
                ]}
              >
                {streak.currentStreak}
              </Text>
            </View>
          </View>

          <View style={styles.expandedRow}>
            <Text style={[styles.label, { fontSize: sizeMap.label }]}>
              Longest Streak
            </Text>
            <View style={styles.expandedStreakContainer}>
              <Text style={{ fontSize: sizeMap.icon }}>🏆</Text>
              <Text
                style={[
                  styles.streakValue,
                  { fontSize: sizeMap.text, marginLeft: 4 },
                ]}
              >
                {streak.longestStreak}
              </Text>
            </View>
          </View>

          {showMilestone && isMilestone && (
            <View style={styles.milestoneIndicator}>
              <Text style={styles.milestoneText}>🎉 Milestone!</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.compactContent}>
          <Text
            style={[
              styles.icon,
              {
                fontSize: sizeMap.icon,
              },
            ]}
          >
            {isActive ? '🔥' : '✨'}
          </Text>
          <Text
            style={[
              styles.streakValue,
              {
                fontSize: sizeMap.text,
              },
            ]}
          >
            {streak.currentStreak}
          </Text>

          {showMilestone && isMilestone && (
            <View style={styles.compactMilestone}>
              <Text style={{ fontSize: 10 }}>🎉</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  compactContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 4,
  },
  streakValue: {
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  expandedContent: {
    width: '100%',
    paddingHorizontal: 8,
    gap: 8,
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandedStreakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: '#666',
    fontWeight: '500',
  },
  milestoneIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FFD700',
    alignItems: 'center',
  },
  milestoneText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF8000',
  },
  compactMilestone: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

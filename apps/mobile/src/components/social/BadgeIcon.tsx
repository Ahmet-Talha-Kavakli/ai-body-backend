import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { Badge } from '@/types/social-social'

interface BadgeIconProps {
  badge: Badge
  size?: 'small' | 'medium' | 'large'
  locked?: boolean
  progress?: number
  showProgress?: boolean
  onPress?: () => void
}

const RARITY_COLORS = {
  common: '#8B8680',
  rare: '#2B82F7',
  epic: '#A335EE',
  legendary: '#FF8000',
}

export function BadgeIcon({
  badge,
  size = 'medium',
  locked = false,
  progress = 0,
  showProgress = false,
  onPress,
}: BadgeIconProps) {
  const sizeMap = useMemo(() => {
    const baseMap = {
      small: { container: 60, icon: 32, badge: 12 },
      medium: { container: 80, icon: 44, badge: 14 },
      large: { container: 120, icon: 64, badge: 18 },
    }
    return baseMap[size]
  }, [size])

  const rarityColor = useMemo(() => {
    return RARITY_COLORS[badge.rarity]
  }, [badge.rarity])

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        width: sizeMap.container,
        height: sizeMap.container,
        borderColor: rarityColor,
        opacity: locked ? 0.5 : 1,
      },
    ],
    [sizeMap.container, rarityColor, locked]
  )

  const progressPercentage = useMemo(() => {
    return Math.round((progress || 0) / 100 * 360)
  }, [progress])

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={containerStyle}
    >
      <View
        style={[
          styles.iconContainer,
          { width: sizeMap.icon, height: sizeMap.icon },
        ]}
      >
        <Text style={{ fontSize: sizeMap.icon * 0.6 }}>{badge.icon}</Text>
      </View>

      {locked && (
        <View
          style={[
            styles.lockOverlay,
            {
              width: sizeMap.icon,
              height: sizeMap.icon,
            },
          ]}
        >
          <Text style={{ fontSize: sizeMap.icon * 0.5 }}>🔒</Text>
        </View>
      )}

      {showProgress && (
        <View
          style={[
            styles.progressRing,
            {
              width: sizeMap.container,
              height: sizeMap.container,
              borderColor: rarityColor,
            },
          ]}
        />
      )}

      <Text
        style={[
          styles.rarityBadge,
          {
            fontSize: sizeMap.badge,
            backgroundColor: rarityColor,
          },
        ]}
      >
        {badge.rarity.charAt(0).toUpperCase()}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
  },
  progressRing: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  rarityBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    color: '#fff',
    fontWeight: 'bold',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
})

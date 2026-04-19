import React from 'react'
import { Pressable, View, Text, Image, StyleSheet } from 'react-native'
import type { Coach } from '../../types/coaching'

interface CoachCardProps {
  coach: Coach
  onPress: () => void
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  verified: {
    color: '#2563eb',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  rating: {
    color: '#374151',
    fontWeight: '500',
  },
  reviewCount: {
    color: '#9ca3af',
    fontSize: 14,
    marginLeft: 4,
  },
  rate: {
    color: '#4b5563',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#dbeafe',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
})

/**
 * CoachCard - displays coach information in a card format
 * Shows avatar, name, rating, hourly rate, and specializations
 */
export const CoachCard: React.FC<CoachCardProps> = ({ coach, onPress }) => {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        {coach.avatar && (
          <Image
            source={{ uri: coach.avatar }}
            style={styles.avatar}
          />
        )}
        <View style={styles.flex1}>
          <View style={styles.header}>
            <Text style={styles.name}>{coach.name}</Text>
            {coach.verified && <Text style={styles.verified}>✓</Text>}
          </View>

          <View style={styles.ratingRow}>
            <Text>⭐</Text>
            <Text style={styles.rating}>
              {coach.rating.toFixed(1)}
            </Text>
            <Text style={styles.reviewCount}>
              ({coach.reviewCount} reviews)
            </Text>
          </View>

          <Text style={styles.rate}>${coach.hourlyRate}/hr</Text>

          <View style={styles.badges}>
            {coach.specializations.map((spec) => (
              <View
                key={spec}
                style={styles.badge}
              >
                <Text style={styles.badgeText}>
                  {spec}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Pressable>
  )
}

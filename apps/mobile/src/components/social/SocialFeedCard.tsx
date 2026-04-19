import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'

interface SharedMeal {
  id: string
  mealLogId: string
  userId: string
  foodName: string
  photoUrl: string
  nutrition: {
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG: number
  }
  shareType: 'private' | 'friends' | 'team'
  sharedWith: string[]
  userName: string
  userAvatar: string
  createdAt: string
  likes: number
  comments: number
}

interface SocialFeedCardProps {
  sharedMeal: SharedMeal
  onPress?: () => void
}

export function SocialFeedCard({ sharedMeal, onPress }: SocialFeedCardProps) {
  const timeAgo = getTimeAgo(sharedMeal.createdAt)

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Image source={{ uri: sharedMeal.userAvatar }} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{sharedMeal.userName}</Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
      </View>

      {sharedMeal.photoUrl && (
        <Image source={{ uri: sharedMeal.photoUrl }} style={styles.foodImage} />
      )}

      <View style={styles.content}>
        <Text style={styles.foodName}>{sharedMeal.foodName}</Text>

        <View style={styles.nutritionRow}>
          <View style={styles.macroBox}>
            <Text style={styles.macroValue}>{sharedMeal.nutrition.calories}</Text>
            <Text style={styles.macroLabel}>kcal</Text>
          </View>
          <View style={styles.macroBox}>
            <Text style={styles.macroValue}>{sharedMeal.nutrition.proteinG}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroBox}>
            <Text style={styles.macroValue}>{sharedMeal.nutrition.carbsG}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroBox}>
            <Text style={styles.macroValue}>{sharedMeal.nutrition.fatG}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>👍 {sharedMeal.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>💬 {sharedMeal.comments}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

function getTimeAgo(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  return `${Math.floor(diffMins / 1440)}d ago`
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  foodImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 12,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  macroValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  macroLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
})

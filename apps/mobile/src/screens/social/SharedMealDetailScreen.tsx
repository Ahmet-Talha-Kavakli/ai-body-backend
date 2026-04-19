import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

type RootStackParamList = {
  SharedMealDetailScreen: { mealId: string }
  [key: string]: any
}

type Props = NativeStackScreenProps<RootStackParamList, 'SharedMealDetailScreen'>

interface SharedMeal {
  id: string
  foodName: string
  photoUrl: string
  nutrition: {
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG: number
  }
  userName: string
  userAvatar: string
  createdAt: string
  likes: number
  comments: number
}

interface Comment {
  id: string
  userName: string
  text: string
  timestamp: string
}

export function SharedMealDetailScreen({ route, navigation }: Props) {
  const { mealId } = route.params

  const [meal, setMeal] = useState<SharedMeal | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadMealDetail()
  }, [mealId])

  const loadMealDetail = async () => {
    setIsLoading(true)
    try {
      // Mock meal detail
      const mockMeal: SharedMeal = {
        id: mealId,
        foodName: 'Grilled Salmon with Vegetables',
        photoUrl: 'https://via.placeholder.com/400',
        nutrition: {
          calories: 520,
          proteinG: 42,
          carbsG: 28,
          fatG: 18,
          fiberG: 4,
        },
        userName: 'John Fitness',
        userAvatar: 'https://via.placeholder.com/50',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        likes: 8,
        comments: 3,
      }

      const mockComments: Comment[] = [
        {
          id: 'comment-1',
          userName: 'Sarah',
          text: 'Looks delicious!',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          id: 'comment-2',
          userName: 'Mike',
          text: 'Great macro balance!',
          timestamp: new Date(Date.now() - 900000).toISOString(),
        },
      ]

      setMeal(mockMeal)
      setComments(mockComments)
    } catch (error) {
      console.error('Failed to load meal detail:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddComment = () => {
    if (!commentText.trim()) return

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      userName: 'You',
      text: commentText,
      timestamp: new Date().toISOString(),
    }

    setComments([...comments, newComment])
    setCommentText('')
  }

  if (!meal) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Loading meal details...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Meal Photo */}
      <Image source={{ uri: meal.photoUrl }} style={styles.mealPhoto} />

      {/* User Info */}
      <View style={styles.userSection}>
        <Image source={{ uri: meal.userAvatar }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{meal.userName}</Text>
          <Text style={styles.timestamp}>{new Date(meal.createdAt).toLocaleString()}</Text>
        </View>
      </View>

      {/* Meal Info */}
      <View style={styles.mealSection}>
        <Text style={styles.mealName}>{meal.foodName}</Text>

        {/* Nutrition Grid */}
        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{meal.nutrition.calories}</Text>
            <Text style={styles.nutritionLabel}>kcal</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{meal.nutrition.proteinG}g</Text>
            <Text style={styles.nutritionLabel}>Protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{meal.nutrition.carbsG}g</Text>
            <Text style={styles.nutritionLabel}>Carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{meal.nutrition.fatG}g</Text>
            <Text style={styles.nutritionLabel}>Fat</Text>
          </View>
        </View>
      </View>

      {/* Interactions */}
      <View style={styles.interactionSection}>
        <TouchableOpacity style={styles.interactionButton}>
          <Text style={styles.interactionText}>👍 {meal.likes} Likes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.interactionButton}>
          <Text style={styles.interactionText}>💬 {comments.length} Comments</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      <View style={styles.commentsSection}>
        <Text style={styles.commentsTitle}>Comments</Text>

        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.comment}>
              <Text style={styles.commentUser}>{item.userName}</Text>
              <Text style={styles.commentText}>{item.text}</Text>
              <Text style={styles.commentTime}>
                {new Date(item.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          )}
          scrollEnabled={false}
        />

        {/* Comment Input */}
        <View style={styles.commentInput}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor="#999"
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
            onPress={handleAddComment}
            disabled={!commentText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealPhoto: {
    width: '100%',
    height: 300,
    backgroundColor: '#e0e0e0',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  mealSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#999',
  },
  interactionSection: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
    gap: 8,
  },
  interactionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  interactionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  commentsSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  commentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  comment: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentUser: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 11,
    color: '#999',
  },
  commentInput: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  sendButton: {
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
})

import { View, Text, TouchableOpacity, FlatList } from 'react-native'
import { useSocialFeedStore } from '@/store/socialFeedStore'
import type { FeedItem as FeedItemType } from '@/types/social-social'

interface Props {
  item: FeedItemType
  onPress?: () => void
}

export function FeedItem({ item, onPress }: Props) {
  const { likeFeedItem, addComment } = useSocialFeedStore()

  const handleLike = () => {
    likeFeedItem(item.id)
  }

  const getTypeLabel = (): string => {
    const labels: Record<FeedItemType['type'], string> = {
      badge_earned: 'Earned a Badge',
      challenge_completed: 'Completed Challenge',
      workout_shared: 'Shared Workout',
      nutrition_logged: 'Logged Nutrition',
      streak_milestone: 'Streak Milestone',
    }
    return labels[item.type]
  }

  const getItemTitle = (): string => {
    switch (item.type) {
      case 'badge_earned':
        return item.data.badgeName || 'Achievement Unlocked'
      case 'challenge_completed':
        return item.data.challengeName || 'Challenge Completed'
      case 'workout_shared':
        return item.data.exerciseType || 'Workout Completed'
      case 'nutrition_logged':
        return item.data.mealType || 'Meal Logged'
      case 'streak_milestone':
        return `${item.data.streakCount}-Day ${item.data.streakType} Streak!`
      default:
        return 'Activity'
    }
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 border border-gray-200 dark:border-gray-700"
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-2">
        <View>
          <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {getTypeLabel()}
          </Text>
          <Text className="text-base font-semibold text-gray-900 dark:text-white mt-1">
            {getItemTitle()}
          </Text>
        </View>
        {item.data.icon && (
          <Text className="text-2xl">{item.data.icon}</Text>
        )}
      </View>

      {/* Timestamp */}
      <Text className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>

      {/* Interaction Footer */}
      <View className="flex-row items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <TouchableOpacity
          onPress={handleLike}
          className="flex-row items-center gap-1"
        >
          <Text className="text-lg">👍</Text>
          <Text className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {item.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center gap-1">
          <Text className="text-lg">💬</Text>
          <Text className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {item.comments.length}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Comments Preview */}
      {item.comments.length > 0 && (
        <View className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Recent Comments
          </Text>
          <FlatList
            data={item.comments.slice(0, 2)}
            keyExtractor={(comment) => comment.id}
            scrollEnabled={false}
            renderItem={({ item: comment }) => (
              <View className="mb-2">
                <Text className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {comment.userId}
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-400">
                  {comment.text}
                </Text>
              </View>
            )}
          />
          {item.comments.length > 2 && (
            <Text className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              +{item.comments.length - 2} more
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  )
}

import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useFriendStore } from '../../store/friendStore'

export function MyProfileScreen() {
  const { myProfile, setMyProfile } = useFriendStore()
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState(myProfile?.bio || '')
  const [uploading, setUploading] = useState(false)

  const handlePickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && myProfile) {
        setUploading(true)
        // In a real app, upload to server here
        // For now, just update local profile
        const updatedProfile = {
          ...myProfile,
          avatar: result.assets[0].uri,
        }
        setMyProfile(updatedProfile)
        Alert.alert('Success', 'Avatar updated')
        setUploading(false)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image')
    }
  }, [myProfile, setMyProfile])

  const handleSaveBio = useCallback(() => {
    if (myProfile) {
      const updatedProfile = {
        ...myProfile,
        bio,
      }
      setMyProfile(updatedProfile)
      setEditing(false)
      Alert.alert('Success', 'Bio updated')
    }
  }, [myProfile, bio, setMyProfile])

  if (!myProfile) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading profile...</Text>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Profile Header */}
      <View className="bg-blue-500 p-6 items-center">
        <TouchableOpacity onPress={handlePickImage} disabled={uploading}>
          <Image
            source={{ uri: myProfile.avatar }}
            className="w-24 h-24 rounded-full mb-4"
          />
          {uploading && (
            <ActivityIndicator
              size="small"
              color="white"
              style={{ position: 'absolute', bottom: 4, right: 4 }}
            />
          )}
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-white">{myProfile.username}</Text>
        <Text className="text-blue-100 text-sm mt-1">Tap to change avatar</Text>
      </View>

      {/* Bio Section */}
      <View className="px-4 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-bold text-gray-900">Bio</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text className="text-blue-500 font-semibold">{editing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>
        {editing ? (
          <View>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              className="border border-gray-300 rounded-lg p-3 text-base h-24"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSaveBio}
              className="bg-blue-500 mt-3 py-2 rounded-lg"
            >
              <Text className="text-white text-center font-semibold">Save Bio</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text className="text-gray-700">{myProfile.bio || 'No bio yet'}</Text>
        )}
      </View>

      {/* Stats Grid */}
      <View className="px-4 py-4">
        <Text className="text-xl font-bold text-gray-900 mb-4">Your Stats</Text>
        <View className="grid grid-cols-2 gap-4">
          <View className="bg-blue-50 p-4 rounded-lg">
            <Text className="text-gray-600 text-sm">Workouts</Text>
            <Text className="text-2xl font-bold text-blue-600">{myProfile.stats.totalWorkouts}</Text>
          </View>
          <View className="bg-green-50 p-4 rounded-lg">
            <Text className="text-gray-600 text-sm">Steps</Text>
            <Text className="text-2xl font-bold text-green-600">
              {(myProfile.stats.totalSteps / 1000).toFixed(1)}K
            </Text>
          </View>
          <View className="bg-orange-50 p-4 rounded-lg">
            <Text className="text-gray-600 text-sm">Calories</Text>
            <Text className="text-2xl font-bold text-orange-600">
              {(myProfile.stats.totalCalories / 1000).toFixed(1)}K
            </Text>
          </View>
          <View className="bg-purple-50 p-4 rounded-lg">
            <Text className="text-gray-600 text-sm">Streak</Text>
            <Text className="text-2xl font-bold text-purple-600">
              {myProfile.stats.longestStreak} days
            </Text>
          </View>
        </View>
      </View>

      {/* Badges */}
      {myProfile.badges.length > 0 && (
        <View className="px-4 py-4 border-t border-gray-200">
          <Text className="text-xl font-bold text-gray-900 mb-4">Your Badges</Text>
          <View className="flex-row flex-wrap gap-2">
            {myProfile.badges.map((badge) => (
              <View key={badge} className="bg-yellow-100 px-4 py-2 rounded-full">
                <Text className="text-yellow-700 font-semibold">{badge}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Member Since */}
      <View className="px-4 py-6 border-t border-gray-200">
        <Text className="text-sm text-gray-600">
          Member since {new Date(myProfile.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </ScrollView>
  )
}

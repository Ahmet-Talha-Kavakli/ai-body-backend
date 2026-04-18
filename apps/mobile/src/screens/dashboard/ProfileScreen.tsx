import React, { useState } from 'react'
import { View, ScrollView, Text, Alert } from 'react-native'
import { useUserProfile } from '../../hooks/useUserProfile'
import { Card } from '../../components/shared/Card'
import { Avatar } from '../../components/shared/Avatar'
import { Button } from '../../components/shared/Button'
import { Input } from '../../components/shared/Input'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'

export function ProfileScreen({ navigation }: any) {
  const userProfile = useUserProfile(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: userProfile.profile?.name || '',
    phone: userProfile.profile?.phone || '',
  })

  const handleSaveProfile = async () => {
    try {
      await userProfile.updateProfile(editData)
      setIsEditing(false)
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile')
    }
  }

  if (userProfile.isLoading) return <LoadingSpinner />

  const profile = userProfile.profile

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Profile Header */}
      <View className="items-center bg-blue-600 px-6 py-8 pt-12">
        <Avatar
          initials={(profile?.name || 'U').slice(0, 2).toUpperCase()}
          url={profile?.avatarUrl}
          size="lg"
        />
        {!isEditing && <Text className="mt-4 text-2xl font-bold text-white">{profile?.name}</Text>}
      </View>

      <View className="p-6">
        {isEditing ? (
          <>
            <Input
              label="Full Name"
              value={editData.name}
              onChangeText={(v) => setEditData({ ...editData, name: v })}
            />
            <Input
              label="Phone (optional)"
              value={editData.phone}
              onChangeText={(v) => setEditData({ ...editData, phone: v })}
            />
            <View className="flex-row gap-2">
              <Button label="Cancel" onPress={() => setIsEditing(false)} variant="secondary" />
              <Button label="Save" onPress={handleSaveProfile} />
            </View>
          </>
        ) : (
          <>
            <Card className="mb-4">
              <View className="mb-4">
                <Text className="mb-1 text-xs text-gray-600">Email</Text>
                <Text className="text-lg font-semibold">{profile?.email}</Text>
              </View>
              {profile?.phone && (
                <View>
                  <Text className="mb-1 text-xs text-gray-600">Phone</Text>
                  <Text className="text-lg font-semibold">{profile.phone}</Text>
                </View>
              )}
            </Card>

            <Button label="Edit Profile" onPress={() => setIsEditing(true)} />
          </>
        )}

        {/* Stats Section */}
        <Text className="mb-4 mt-8 text-lg font-bold">Statistics</Text>
        <Card className="mb-4">
          <View className="flex-row justify-between">
            <View>
              <Text className="text-xs text-gray-600">Total Workouts</Text>
              <Text className="text-2xl font-bold">24</Text>
            </View>
            <View>
              <Text className="text-xs text-gray-600">Total Calories</Text>
              <Text className="text-2xl font-bold">12.5K</Text>
            </View>
            <View>
              <Text className="text-xs text-gray-600">Current Streak</Text>
              <Text className="text-2xl font-bold">7 days</Text>
            </View>
          </View>
        </Card>

        {/* Member Since */}
        <Card className="mb-6">
          <Text className="mb-1 text-xs text-gray-600">Member Since</Text>
          <Text className="text-lg font-semibold">
            {new Date(profile?.createdAt || '').toLocaleDateString()}
          </Text>
        </Card>

        <Button
          label="View Settings"
          onPress={() => navigation?.navigate('Settings')}
          variant="secondary"
        />
      </View>
    </ScrollView>
  )
}

import React, { useState } from 'react'
import { View, ScrollView, Text, Switch, Alert, Pressable } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { getAuthenticatedClient } from '../../api/client'
import { Card } from '../../components/shared/Card'
import { Button } from '../../components/shared/Button'

export function SettingsScreen({ navigation }: any) {
  const auth = useAuth()
  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: true,
    waterReminders: true,
    mealReminders: true,
    workoutReminders: true,
    analytics: true,
  })

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await auth.signOut()
          navigation?.navigate('SignIn')
        },
      },
    ])
  }

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'This cannot be undone', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const client = await getAuthenticatedClient()
            await client.delete('/api/user/account')
            await auth.signOut()
            navigation?.navigate('SignIn')
          } catch (error) {
            Alert.alert('Error', 'Failed to delete account')
          }
        },
      },
    ])
  }

  const handleExportData = async () => {
    try {
      const client = await getAuthenticatedClient()
      await client.get('/api/user/export')
      Alert.alert('Success', 'Your data has been exported')
    } catch (error) {
      Alert.alert('Error', 'Failed to export data')
    }
  }

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        {/* Account Section */}
        <Text className="mb-4 text-lg font-bold">Account</Text>
        <Card className="mb-4">
          <Pressable className="border-b border-gray-200 py-3">
            <Text className="text-base">Change Email</Text>
          </Pressable>
          <Pressable className="py-3">
            <Text className="text-base">Change Password</Text>
          </Pressable>
        </Card>

        {/* Preferences Section */}
        <Text className="mb-4 text-lg font-bold">Preferences</Text>
        <Card className="mb-4">
          <View className="flex-row items-center justify-between border-b border-gray-200 py-3">
            <Text>Theme</Text>
            <Text className="capitalize text-gray-600">{settings.theme}</Text>
          </View>
          <View className="flex-row items-center justify-between py-3">
            <Text>Language</Text>
            <Text className="text-gray-600">English</Text>
          </View>
        </Card>

        {/* Notifications Section */}
        <Text className="mb-4 text-lg font-bold">Notifications</Text>
        <Card className="mb-4">
          <View className="flex-row items-center justify-between border-b border-gray-200 py-3">
            <Text>Master Toggle</Text>
            <Switch
              value={settings.notifications}
              onValueChange={() => toggleSetting('notifications')}
            />
          </View>

          {settings.notifications && (
            <>
              <View className="flex-row items-center justify-between border-b border-gray-200 py-3">
                <Text>Water Reminders</Text>
                <Switch
                  value={settings.waterReminders}
                  onValueChange={() => toggleSetting('waterReminders')}
                />
              </View>
              <View className="flex-row items-center justify-between border-b border-gray-200 py-3">
                <Text>Meal Reminders</Text>
                <Switch
                  value={settings.mealReminders}
                  onValueChange={() => toggleSetting('mealReminders')}
                />
              </View>
              <View className="flex-row items-center justify-between py-3">
                <Text>Workout Reminders</Text>
                <Switch
                  value={settings.workoutReminders}
                  onValueChange={() => toggleSetting('workoutReminders')}
                />
              </View>
            </>
          )}
        </Card>

        {/* Data & Privacy Section */}
        <Text className="mb-4 text-lg font-bold">Data & Privacy</Text>
        <Card className="mb-6">
          <Pressable className="border-b border-gray-200 py-3">
            <View className="flex-row items-center justify-between">
              <Text>Analytics</Text>
              <Switch value={settings.analytics} onValueChange={() => toggleSetting('analytics')} />
            </View>
          </Pressable>
          <Pressable className="border-b border-gray-200 py-3" onPress={handleExportData}>
            <Text className="text-blue-600">Export Your Data</Text>
          </Pressable>
          <Pressable className="py-3" onPress={handleDeleteAccount}>
            <Text className="text-red-600">Delete Account</Text>
          </Pressable>
        </Card>

        {/* About Section */}
        <Text className="mb-4 text-lg font-bold">About</Text>
        <Card className="mb-4">
          <View className="border-b border-gray-200 py-3">
            <Text className="mb-1 text-xs text-gray-600">Version</Text>
            <Text className="text-base font-semibold">1.0.0</Text>
          </View>
          <Pressable className="border-b border-gray-200 py-3">
            <Text className="text-blue-600">Terms of Service</Text>
          </Pressable>
          <Pressable className="py-3">
            <Text className="text-blue-600">Privacy Policy</Text>
          </Pressable>
        </Card>

        {/* Logout Button */}
        <Button label="Sign Out" onPress={handleLogout} variant="danger" size="lg" />
      </View>
    </ScrollView>
  )
}

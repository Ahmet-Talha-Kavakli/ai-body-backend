import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native'
import { PermissionRequestCard } from '../../components/health/PermissionRequestCard'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

type HealthPermissionScreenNavigationProp = NativeStackNavigationProp<any, 'HealthPermission'>

interface HealthPermissionScreenProps {
  navigation: HealthPermissionScreenNavigationProp
  route: any
}

export function HealthPermissionScreen({ navigation }: HealthPermissionScreenProps) {
  const [denied, setDenied] = useState(false)

  const handleAllow = () => {
    // In production, this would open system settings
    Linking.openSettings()
    navigation.navigate('Health')
  }

  const handleMaybeLater = () => {
    navigation.navigate('Health')
  }

  const handleRetry = () => {
    setDenied(false)
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="flex flex-col gap-6 px-4 py-8">
        {/* Hero Section */}
        <View className="flex flex-col items-center gap-4 rounded-lg bg-blue-50 px-6 py-12">
          <Text className="text-4xl">❤️</Text>
          <Text className="text-center text-2xl font-bold text-gray-900">
            Access Your Health Data
          </Text>
          <Text className="text-center text-sm text-gray-600">
            Connect with Apple Health to track your heart rate, sleep, steps, and more.
          </Text>
        </View>

        {/* Permission Card */}
        {!denied ? (
          <PermissionRequestCard
            icon="heart"
            title="Health Data Access"
            description="We'll read your HealthKit data securely to provide personalized health insights."
            onAllow={handleAllow}
            onMaybeLater={handleMaybeLater}
          />
        ) : (
          <View className="flex flex-col gap-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <Text className="font-semibold text-red-900">Permission Denied</Text>
            <Text className="text-sm text-red-700">
              Go to Settings {'>>'} Health {'>>'} Data Access & Devices to grant permission.
            </Text>
            <TouchableOpacity
              onPress={handleRetry}
              className="rounded-lg border border-red-400 bg-white px-4 py-2"
            >
              <Text className="text-center font-medium text-red-600">Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info Section */}
        <View className="flex flex-col gap-3 rounded-lg bg-white p-4">
          <Text className="font-semibold text-gray-900">What we can access:</Text>
          <View className="flex flex-col gap-2">
            <Text className="text-sm text-gray-600">• Heart Rate readings</Text>
            <Text className="text-sm text-gray-600">• Sleep data and stages</Text>
            <Text className="text-sm text-gray-600">• Daily step count</Text>
            <Text className="text-sm text-gray-600">• Active & basal calories</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

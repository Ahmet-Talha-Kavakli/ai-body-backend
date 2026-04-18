import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, View } from 'react-native'
import { AuthNavigator } from './AuthNavigator'
import { DashboardNavigator } from './DashboardNavigator'
import { useAuth } from '../hooks/useAuth'

const Stack = createNativeStackNavigator()

export function RootNavigator() {
  const { isSignedIn, isInitializing } = useAuth()

  if (isInitializing) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isSignedIn ? (
        <Stack.Screen name="Auth" component={AuthNavigator} options={{ animationEnabled: false }} />
      ) : (
        <Stack.Screen
          name="Dashboard"
          component={DashboardNavigator}
          options={{ animationEnabled: false }}
        />
      )}
    </Stack.Navigator>
  )
}

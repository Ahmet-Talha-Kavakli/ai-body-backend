import React, { useState, useEffect } from 'react'
import { View, Text } from 'react-native'
import NetInfo from '@react-native-community/netinfo'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true)
    })

    return unsubscribe
  }, [])

  if (isOnline) return null

  return (
    <View className="border-b border-yellow-300 bg-yellow-100 px-4 py-2">
      <Text className="text-center text-xs font-semibold text-yellow-800">
        No internet connection - changes will sync when online
      </Text>
    </View>
  )
}

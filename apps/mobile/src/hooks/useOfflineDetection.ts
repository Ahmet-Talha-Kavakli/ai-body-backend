import { useState, useEffect } from 'react'
import NetInfo from '@react-native-community/netinfo'

export function useOfflineDetection() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected === true && state.isInternetReachable !== false)
    })

    // Get initial state
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected === true && state.isInternetReachable !== false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return { isOnline }
}

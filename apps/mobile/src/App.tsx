import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AppProvider } from './context/AppContext'
import { RootNavigator } from './navigation/RootNavigator'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { OfflineIndicator } from './components/shared/OfflineIndicator'

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView className="flex-1">
        <AppProvider>
          <NavigationContainer>
            <OfflineIndicator />
            <RootNavigator />
          </NavigationContainer>
        </AppProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  )
}

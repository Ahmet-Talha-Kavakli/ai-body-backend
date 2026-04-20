import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClerkProvider } from '@clerk/expo/legacy';
import * as SecureStore from 'expo-secure-store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './ThemeProvider';
import { I18nProvider } from './I18nProvider';
import { SecurityProvider } from './SecurityProvider';

// Clerk session tokens → iOS Keychain / Android Keystore
const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
  async clearToken(key: string) {
    return SecureStore.deleteItemAsync(key);
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 3 },
    mutations: { retry: 0 },
  },
});

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SecurityProvider>
        <ClerkProvider
          publishableKey={process.env['EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'] ?? ''}
          tokenCache={tokenCache}
        >
          <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultMode="system">
              <I18nProvider>{children}</I18nProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </ClerkProvider>
      </SecurityProvider>
    </GestureHandlerRootView>
  );
}

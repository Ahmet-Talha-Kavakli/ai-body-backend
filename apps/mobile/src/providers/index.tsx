import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './ThemeProvider';
import { I18nProvider } from './I18nProvider';
import { SecurityProvider } from './SecurityProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 3 },
    mutations: { retry: 0 },
  },
});

const CLERK_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
console.log('[Clerk] publishableKey:', CLERK_KEY ? CLERK_KEY.slice(0, 20) + '...' : 'EMPTY!');

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SecurityProvider>
        <ClerkProvider publishableKey={CLERK_KEY} tokenCache={tokenCache}>
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

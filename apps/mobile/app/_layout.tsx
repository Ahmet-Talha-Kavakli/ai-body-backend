import { ClerkProvider, useAuth } from '@clerk/expo';
import * as SecureStore from 'expo-secure-store';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import '../global.css';
import { useNotifications } from '@/hooks/useNotifications';

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

// Redirects unauthenticated users away from protected routes
function AuthGuard() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { scheduleWaterReminders, scheduleMealReminders } = useNotifications();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isLoaded) return;
    if (segments.length === 0) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inPublicRoute = segments[0] === 'index';

    if (!isSignedIn && !inAuthGroup && !inPublicRoute) {
      router.replace('/(auth)/sign-in');
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/(app)/home');
    }
  }, [mounted, isSignedIn, isLoaded, segments]);

  // Schedule local notifications when user is signed in
  useEffect(() => {
    if (isSignedIn) {
      scheduleWaterReminders();
      scheduleMealReminders();
    }
  }, [isSignedIn]);

  return null;
}

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0A0A0F' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <AuthGuard />
    </ClerkProvider>
  );
}

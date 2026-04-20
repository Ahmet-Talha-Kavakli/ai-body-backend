import 'react-native-reanimated';
import '../global.css';
import React from 'react';
import { Stack } from 'expo-router';
import { RootProviders } from '../src/providers';
import { initSentry } from '../src/lib/sentry';

initSentry();

export default function RootLayout() {
  return (
    <RootProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(showcase)" />
      </Stack>
    </RootProviders>
  );
}

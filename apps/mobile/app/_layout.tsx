import 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';
import '../src/lib/tracking/backgroundTask';
import React from 'react';
import { Stack } from 'expo-router';
import { RootProviders } from '../src/providers';
import { initSentry } from '../src/lib/sentry';
import Mapbox from '@rnmapbox/maps';
import { MAPBOX_PUBLIC_TOKEN } from '../lib/mapsConfig';

initSentry();

try {
  if (MAPBOX_PUBLIC_TOKEN) {
    Mapbox.setAccessToken(MAPBOX_PUBLIC_TOKEN);
  }
} catch (e) {
  console.warn('Mapbox init failed:', e);
}

export default function RootLayout() {
  // RootProviders zaten GestureHandlerRootView içeriyor — burada ikinci kat sarmalama yok.
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

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
import {
  useFonts,
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
} from '@expo-google-fonts/sora';
import { View } from 'react-native';

initSentry();

try {
  if (MAPBOX_PUBLIC_TOKEN) {
    Mapbox.setAccessToken(MAPBOX_PUBLIC_TOKEN);
  }
} catch (e) {
  console.warn('Mapbox init failed:', e);
}

export default function RootLayout() {
  // CLAUDE.md zorunlu: Sora font tüm ekranlarda. Root'ta global yüklendi —
  // sayfa-spesifik useFonts artık gerekli değil.
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });

  if (!fontsLoaded) {
    // Splash gibi boş beyaz ekran — sora yüklenir yüklenmez kaldırılır
    return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
  }

  return (
    <RootProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(showcase)" />
        <Stack.Screen name="more" />
        <Stack.Screen name="health" />
        <Stack.Screen name="nutrition" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="session" />
        <Stack.Screen name="milestones" />
      </Stack>
    </RootProviders>
  );
}

import { useAuth } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function SplashScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!__DEV__ && isLoaded) {
      if (isSignedIn) {
        router.replace('/(app)/home');
      } else {
        router.replace('/(auth)/sign-in');
      }
    }
  }, [isLoaded, isSignedIn, router]);

  // Dev launcher — shows quick links to test Foundation
  if (__DEV__) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <Text style={{ color: '#2DD4BF', fontSize: 32, fontWeight: '700' }}>FitAI Dev</Text>
        <Text style={{ color: '#64748B', fontSize: 13 }}>Foundation M1–M5</Text>
        <Link href="/(showcase)" asChild>
          <TouchableOpacity
            style={{
              backgroundColor: '#2DD4BF',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#000', fontWeight: '700', fontSize: 16 }}>
              🎨 Component Showcase
            </Text>
          </TouchableOpacity>
        </Link>
        <Link href="/(tabs)" asChild>
          <TouchableOpacity
            style={{
              backgroundColor: '#1A1A26',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#2DD4BF',
            }}
          >
            <Text style={{ color: '#2DD4BF', fontWeight: '700', fontSize: 16 }}>
              📱 5-Tab Navigation
            </Text>
          </TouchableOpacity>
        </Link>
        <Link href="/(auth)/sign-in" asChild>
          <TouchableOpacity
            style={{
              backgroundColor: '#1A1A26',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#94A3B8', fontWeight: '600', fontSize: 16 }}>
              🔐 Sign In Flow
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: '#fff', fontSize: 36, fontWeight: '700' }}>FitAI</Text>
    </View>
  );
}

import { useAuth, useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(80, [
      Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 13 }),
      Animated.spring(statsAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 13 }),
      Animated.spring(menuAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 13 }),
    ]).start();
  }, []);

  const slideUp = (anim: Animated.Value, offset = 24) => ({
    opacity: anim,
    transform: [
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) },
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
    ],
  });

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <ScrollView className="flex-1 bg-bg-primary" decelerationRate="normal" scrollEventThrottle={16}>
      <View className="p-6">
        {/* Profile Header */}
        <Animated.View style={slideUp(headerAnim, 20)}>
          <View className="bg-bg-surface rounded-2xl p-6 mb-6 border border-border-default items-center">
            <View
              className="w-20 h-20 rounded-full bg-accent-primary items-center justify-center mb-4"
              style={{
                backgroundColor: '#6366F1',
                shadowColor: '#6366F1',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <Text className="text-white text-4xl">👤</Text>
            </View>
            <Text className="text-text-primary text-2xl font-bold mb-1">
              {user?.firstName} {user?.lastName}
            </Text>
            <Text className="text-text-secondary text-sm">
              {user?.emailAddresses[0]?.emailAddress}
            </Text>
            <View className="mt-4 pt-4 border-t border-border-default w-full">
              <Text className="text-text-secondary text-xs text-center">Üye Olma Tarihi</Text>
              <Text className="text-text-primary text-sm text-center font-bold mt-1">
                {user?.createdAt?.toLocaleDateString('tr-TR')}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View style={slideUp(statsAnim, 28)}>
          <Text className="text-text-primary text-lg font-bold mb-4">İstatistikler</Text>
          <View className="gap-4 mb-6">
            <View className="flex-row gap-4">
              <View className="flex-1 bg-bg-surface rounded-xl p-4 border border-border-default">
                <Text className="text-text-secondary text-xs mb-2">Toplam Seanslar</Text>
                <Text className="text-text-primary text-3xl font-bold">47</Text>
              </View>
              <View className="flex-1 bg-bg-surface rounded-xl p-4 border border-border-default">
                <Text className="text-text-secondary text-xs mb-2">Toplam Hacim</Text>
                <Text className="text-text-primary text-3xl font-bold">582k</Text>
              </View>
            </View>
            <View className="flex-row gap-4">
              <View className="flex-1 bg-bg-surface rounded-xl p-4 border border-border-default">
                <Text className="text-text-secondary text-xs mb-2">Ort. Form</Text>
                <Text className="text-text-primary text-3xl font-bold">76</Text>
              </View>
              <View className="flex-1 bg-bg-surface rounded-xl p-4 border border-border-default">
                <Text className="text-text-secondary text-xs mb-2">Streak</Text>
                <Text className="text-text-primary text-3xl font-bold">12</Text>
                <Text className="text-accent-energy text-xs mt-1">🔥 Harika!</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Menu */}
        <Animated.View style={slideUp(menuAnim, 32)}>
          <Text className="text-text-primary text-lg font-bold mb-4">Seçenekler</Text>

          {[
            { label: '⚙️ Ayarlar', route: '/profile/settings' },
            { label: '🎯 Hedefler', route: '/profile/goals' },
            { label: '📊 Biyomechanical Passport', route: '/profile/passport' },
            { label: '🏆 Başarılar', route: '/profile/achievements' },
            { label: '⚠️ Alerji & Hassasiyetler', route: '/(app)/profile/allergies' },
          ].map(({ label, route }, i) => (
            <MenuRow key={i} label={label} onPress={() => router.push(route as never)} />
          ))}

          <View style={{ height: 12 }} />

          <AnimatedPressButton onPress={handleSignOut} className="bg-accent-danger rounded-xl p-4">
            <Text className="text-white text-center font-bold text-base">Çıkış Yap</Text>
          </AnimatedPressButton>
        </Animated.View>

        <View style={{ height: 20 }} />
      </View>
    </ScrollView>
  );
}

function MenuRow({ label, onPress }: { label: string; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: 12 }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={1}
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.97,
            useNativeDriver: true,
            tension: 200,
            friction: 20,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 80,
            friction: 14,
          }).start()
        }
        className="bg-bg-surface rounded-xl p-4 border border-border-default flex-row items-center justify-between"
      >
        <Text className="text-text-primary font-bold">{label}</Text>
        <Text className="text-text-secondary text-xl">›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function AnimatedPressButton({
  children,
  onPress,
  className,
}: {
  children: React.ReactNode;
  onPress: () => void;
  className?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={1}
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.96,
            useNativeDriver: true,
            tension: 200,
            friction: 20,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 80,
            friction: 14,
          }).start()
        }
        className={className}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

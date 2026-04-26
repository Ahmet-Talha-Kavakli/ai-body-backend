import { useUser } from '@clerk/expo';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { RecordingBanner } from '../../components/tracking/RecordingBanner';

export default function HomeScreen() {
  const { user } = useUser();
  const [readiness, setReadiness] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Mount animations
  const greetAnim = useRef(new Animated.Value(0)).current;
  const readinessAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.spring(greetAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 13 }),
      Animated.spring(readinessAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 13,
      }),
      Animated.spring(statsAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 13 }),
      Animated.spring(actionsAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 13,
      }),
    ]).start();
    fetchReadiness();
  }, []);

  const fetchReadiness = async () => {
    try {
      const base = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
      const res = await fetch(`${base}/api/readiness`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReadiness(data.score);
    } catch (err) {
      console.log('[home] readiness fetch failed, using fallback', err);
      setReadiness(75);
    } finally {
      setLoading(false);
    }
  };

  const getReadinessColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getReadinessMessage = (score: number) => {
    if (score >= 80) return '💪 Tam gaz antrenman zamanı!';
    if (score >= 60) return '✅ Normal antrenman yapabilirsin';
    return '⚠️ Hafif antrenman önerilir';
  };

  const slideUp = (anim: Animated.Value, offset = 20) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) }],
  });

  return (
    <View className="flex-1 bg-bg-primary">
      <RecordingBanner />
      <ScrollView
        className="flex-1 bg-bg-primary"
        decelerationRate="normal"
        scrollEventThrottle={16}
      >
        <View className="p-6">
          {/* Greeting */}
          <Animated.View style={slideUp(greetAnim, -14)}>
            <Text className="text-text-primary text-3xl font-bold mb-2">
              Merhaba, {user?.firstName || 'Sporcu'}! 👋
            </Text>
            <Text className="text-text-secondary mb-8">
              {new Date().toLocaleDateString('tr-TR', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </Animated.View>

          {/* Readiness Card */}
          <Animated.View style={[slideUp(readinessAnim, 24), { marginBottom: 24 }]}>
            <View className="bg-bg-surface rounded-2xl p-6 border border-border-default">
              <Text className="text-text-secondary text-sm mb-4">Bugünün Hazırlığı</Text>
              {loading ? (
                <ActivityIndicator color="#6366F1" size="large" />
              ) : (
                <View>
                  <Text
                    className="text-text-primary text-5xl font-bold"
                    style={{ color: getReadinessColor(readiness || 0) }}
                  >
                    {readiness?.toFixed(0)}
                  </Text>
                  <Text className="text-text-secondary text-sm mt-3">
                    {getReadinessMessage(readiness || 0)}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Quick Stats */}
          <Animated.View style={slideUp(statsAnim, 28)}>
            <Text className="text-text-primary text-lg font-bold mb-4">Bu Haftanız</Text>
            <View className="gap-4 mb-6">
              <View className="flex-row gap-4">
                <View className="flex-1 bg-bg-surface rounded-xl p-4 border border-border-default">
                  <Text className="text-text-secondary text-xs mb-2">Seanslar</Text>
                  <Text className="text-text-primary text-2xl font-bold">3</Text>
                </View>
                <View className="flex-1 bg-bg-surface rounded-xl p-4 border border-border-default">
                  <Text className="text-text-secondary text-xs mb-2">Ort. Form</Text>
                  <Text className="text-text-primary text-2xl font-bold">78</Text>
                </View>
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1 bg-bg-surface rounded-xl p-4 border border-border-default">
                  <Text className="text-text-secondary text-xs mb-2">Ort. Hazırlık</Text>
                  <Text className="text-text-primary text-2xl font-bold">72</Text>
                </View>
                <View className="flex-1 bg-bg-surface rounded-xl p-4 border border-border-default">
                  <Text className="text-text-secondary text-xs mb-2">Toplam Hacim</Text>
                  <Text className="text-text-primary text-2xl font-bold">12.5k</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View style={slideUp(actionsAnim, 32)}>
            <Text className="text-text-primary text-lg font-bold mb-4">Hızlı Erişim</Text>

            <AnimatedPressCard
              style={{
                backgroundColor: '#6366F1',
                borderBottomWidth: 1,
                borderBottomColor: '#F59E0B',
                borderRadius: 12,
                padding: 24,
                marginBottom: 16,
              }}
            >
              <Text className="text-white text-lg font-bold">🎬 Bu Ay Progress Videonuz</Text>
              <Text className="text-white text-sm opacity-90 mt-1">Milestone Cinema'ya Git</Text>
            </AnimatedPressCard>

            <AnimatedPressCard
              style={{ backgroundColor: 'transparent' }}
              className="bg-bg-surface rounded-xl p-6 border border-border-default mb-4 flex-row items-center justify-between"
            >
              <View>
                <Text className="text-text-primary font-bold">📊 Haftalık Özet</Text>
                <Text className="text-text-secondary text-sm">Performansını incele</Text>
              </View>
              <Text className="text-text-secondary text-xl">›</Text>
            </AnimatedPressCard>

            <AnimatedPressCard
              style={{ backgroundColor: 'transparent' }}
              className="bg-bg-surface rounded-xl p-6 border border-border-default mb-6 flex-row items-center justify-between"
            >
              <View>
                <Text className="text-text-primary font-bold">⚡ Başlı Egzersiz</Text>
                <Text className="text-text-secondary text-sm">
                  Yarıda kaldığın seansı devam ettir
                </Text>
              </View>
              <Text className="text-text-secondary text-xl">›</Text>
            </AnimatedPressCard>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

function AnimatedPressCard({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: object;
  className?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[style, { transform: [{ scale }] }]} className={className}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.96,
            useNativeDriver: true,
            tension: 180,
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
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

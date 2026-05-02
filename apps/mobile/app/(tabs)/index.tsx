/**
 * FitAI — Ana Sayfa
 *
 * Tasarım kararları:
 * - Renk: #0A0A0A zemin, #30D158 Apple system green accent
 * - Stat kartları: yatay scroll, her kart tam görünür
 * - Pet: Animated bounce loop
 * - CTA: "Seans Başlat" sayfanın dominant elemanı, yeşil glow
 * - Tüm touch target'lar ≥ 44pt
 * - Primary CTA thumb zone'da (ekranın altına yakın)
 */

import { useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ─── 3D Icons (thiings.co) ─────────────────────────────────────────────────────
const ICONS = {
  su: require('../../assets/icons/su.png'),
  kalori: require('../../assets/icons/kalori.png'),
  uyku: require('../../assets/icons/uyku.png'),
  antrenman: require('../../assets/icons/antrenman.png'),
  roadmap: require('../../assets/icons/roadmap.png'),
  flash: require('../../assets/icons/flash.png'),
} as const;
type IconKey = keyof typeof ICONS;
import { useQueryClient } from '@tanstack/react-query';
import {
  useDashboardStats,
  useHomeGreeting,
  usePet,
  useReadiness,
  useSleepDashboard,
  useWaterDashboard,
} from '../../src/hooks/useHomeData';

// ─── Layout ────────────────────────────────────────────────────────────────────
const { width: SW } = Dimensions.get('window');
const H_PAD = 20;
const STAT_CARD_W = 148;
const STAT_CARD_H = 156;

// ─── Design tokens (Apple-inspired light + system green) ─────────────────────
const G = {
  // Backgrounds
  bg: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceHigh: '#F2F2F7',
  // Green family
  green: '#30D158',
  greenDim: 'rgba(48,209,88,0.12)',
  greenBorder: 'rgba(48,209,88,0.25)',
  // Text
  label: '#1C1C1E',
  label2: '#636366',
  label3: '#AEAEB2',
  // Stat accent colors
  blue: '#0A84FF',
  orange: '#FF9F0A',
  purple: '#BF5AF2',
  // Semantic
  red: '#FF453A',
  separator: 'rgba(60,60,67,0.12)',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const toL = (ml: number) => (ml / 1000).toFixed(1);
const toHrs = (min: number) => (min / 60).toFixed(1);

function petEmoji(mood: string) {
  return (
    (
      { happy: '😸', energetic: '😸', tired: '😿', sad: '🙀', angry: '😾', sick: '🤒' } as Record<
        string,
        string
      >
    )[mood] ?? '😺'
  );
}
function petMood(mood: string) {
  return (
    (
      {
        happy: 'Mutlu',
        energetic: 'Enerjik',
        tired: 'Yorgun',
        sad: 'Üzgün',
        angry: 'Sinirli',
        sick: 'Hasta',
      } as Record<string, string>
    )[mood] ?? 'Mutlu'
  );
}

// ─── Skeleton pulse ────────────────────────────────────────────────────────────
function Skeleton({
  width,
  height,
  radius = 10,
}: {
  width: number;
  height: number;
  radius?: number;
}) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View
      style={{ width, height, borderRadius: radius, backgroundColor: G.surfaceHigh, opacity }}
    />
  );
}

// ─── Scroll hint ───────────────────────────────────────────────────────────────
function ScrollHint() {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(x, {
          toValue: 6,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(x, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 3, transform: [{ translateX: x }] }}
    >
      <Text style={{ color: 'rgba(48,209,88,0.6)', fontSize: 11, fontWeight: '600' }}>kaydır</Text>
      <Ionicons name="chevron-forward" size={11} color="rgba(48,209,88,0.6)" />
    </Animated.View>
  );
}

// ─── Stat card (horizontal scroll) ────────────────────────────────────────────
interface StatCardProps {
  icon: IconKey;
  label: string;
  value: string;
  unit: string;
  subtitle: string;
  color: string;
  progress: number; // 0–1
  loading: boolean;
  onPress: () => void;
}

function StatCard({
  icon,
  label,
  value,
  unit,
  subtitle,
  color,
  progress,
  loading,
  onPress,
}: StatCardProps) {
  const pct = Math.min(Math.max(progress, 0), 1);
  const barW = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (loading) return;
    Animated.timing(barW, {
      toValue: pct,
      duration: 900,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct, loading]);

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[st.statCard, { transform: [{ scale }] }]}>
        {/* Icon chip */}
        <View style={[st.statChip, { backgroundColor: color + '22' }]}>
          <Image source={ICONS[icon]} style={{ width: 38, height: 38 }} resizeMode="contain" />
        </View>

        {/* Value */}
        {loading ? (
          <View style={{ marginTop: 10, gap: 6 }}>
            <Skeleton width={70} height={28} radius={8} />
            <Skeleton width={50} height={12} radius={6} />
          </View>
        ) : (
          <View style={{ marginTop: 10 }}>
            <View style={st.statValRow}>
              <Text style={[st.statVal, { color }]}>{value}</Text>
              <Text style={st.statUnit}>{unit}</Text>
            </View>
            <Text style={st.statLabel}>{label}</Text>
          </View>
        )}

        {/* Progress bar */}
        <View style={st.barBg}>
          <Animated.View
            style={[
              st.barFill,
              {
                backgroundColor: color,
                width: barW.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              },
            ]}
          />
        </View>

        {/* Subtitle */}
        <Text style={st.statSub} numberOfLines={1}>
          {loading ? '' : subtitle}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Pet widget ────────────────────────────────────────────────────────────────
function PetWidget({ onPress }: { onPress: () => void }) {
  const { data: pet, isLoading } = usePet();
  const bounce = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Continuous bounce
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -8,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  const mood = pet?.mood ?? 'happy';

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[st.petCard, { transform: [{ scale }] }]}>
        {/* Subtle green tint top-right */}
        <View style={st.petGlow} pointerEvents="none" />

        <View style={st.petInner}>
          {/* Bouncing emoji */}
          <Animated.Text style={[st.petEmoji, { transform: [{ translateY: bounce }] }]}>
            {isLoading ? '🐱' : petEmoji(mood)}
          </Animated.Text>

          {/* Info */}
          <View style={{ flex: 1 }}>
            {isLoading ? (
              <View style={{ gap: 8 }}>
                <Skeleton width={80} height={16} radius={6} />
                <Skeleton width={55} height={12} radius={5} />
              </View>
            ) : (
              <>
                <Text style={st.petName}>{pet?.name ?? 'Pamuk'}</Text>
                <Text style={st.petMoodTxt}>Bugün {petMood(mood)} hissediyor</Text>
              </>
            )}
          </View>

          {/* Level badge */}
          {!isLoading && (
            <View style={st.lvBadge}>
              <Text style={st.lvTxt}>Lv {pet?.level ?? 1}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={14} color={G.label3} />
        </View>

        {/* Mood bar */}
        <View style={st.moodBarBg}>
          <View
            style={[
              st.moodBarFill,
              {
                width: `${mood === 'happy' || mood === 'energetic' ? 80 : mood === 'tired' ? 30 : 50}%`,
                backgroundColor:
                  mood === 'happy' || mood === 'energetic'
                    ? G.green
                    : mood === 'angry' || mood === 'sick'
                      ? G.red
                      : G.orange,
              },
            ]}
          />
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Readiness ring ────────────────────────────────────────────────────────────
function ReadinessBadge({ score, loading }: { score: number; loading: boolean }) {
  if (loading) return <Skeleton width={48} height={48} radius={24} />;
  const color = score >= 75 ? G.green : score >= 50 ? G.orange : G.red;
  return (
    <View style={[st.readRing, { borderColor: color + '60' }]}>
      <Text style={[st.readScore, { color }]}>{score}</Text>
      <Text style={st.readLbl}>HAZIR</Text>
    </View>
  );
}

// ─── AI message card ────────────────────────────────────────────────────────────
function AICard({ message, loading }: { message: string; loading: boolean }) {
  const [shown, setShown] = useState('');

  useEffect(() => {
    if (!message) return;
    setShown('');
    let i = 0;
    const id = setInterval(() => {
      setShown(message.slice(0, ++i));
      if (i >= message.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [message]);

  return (
    <View style={st.aiCard}>
      <View style={st.aiIconWrap}>
        <Ionicons name="sparkles" size={14} color={G.green} />
      </View>
      {loading ? (
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width={SW - H_PAD * 2 - 60} height={13} radius={5} />
          <Skeleton width={(SW - H_PAD * 2 - 60) * 0.65} height={13} radius={5} />
        </View>
      ) : (
        <Text style={st.aiText}>{shown || ' '}</Text>
      )}
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);

  // Progress bar animation
  const barX = useRef(new Animated.Value(-SW)).current;
  const barOp = useRef(new Animated.Value(0)).current;
  const barLoop = useRef<Animated.CompositeAnimation | null>(null);

  const startBar = () => {
    barX.setValue(-SW);
    barOp.setValue(1);
    barLoop.current = Animated.loop(
      Animated.timing(barX, {
        toValue: SW,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    barLoop.current.start();
  };

  const stopBar = () => {
    barLoop.current?.stop();
    Animated.timing(barOp, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  };

  // Entrance + refresh animation
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  const playEntrance = () => {
    fade.setValue(0);
    slide.setValue(16);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    playEntrance();
  }, []);

  // Data
  const { data: greeting, isLoading: gL, error: gErr } = useHomeGreeting();
  if (gErr) console.error('[home] greeting error:', gErr);
  const { data: water, isLoading: wL } = useWaterDashboard();
  const { data: dash, isLoading: dL } = useDashboardStats();
  const { data: sleep, isLoading: sL } = useSleepDashboard();
  const { data: readiness, isLoading: rL } = useReadiness();

  const onRefresh = async () => {
    setRefreshing(true);
    startBar();
    fade.setValue(0);
    slide.setValue(12);
    await qc.invalidateQueries();
    setRefreshing(false);
    stopBar();
    playEntrance();
  };

  const firstName = greeting?.firstName ?? user?.firstName ?? user?.username ?? 'Sporcu';
  const greetWord = greeting?.greeting ?? 'Merhaba';
  const waterMl = water?.todayMl ?? 0;
  const waterGoal = water?.goalMl ?? 2500;
  const cals = dash?.todayNutrition?.calories ?? 0;
  const calGoal = dash?.todayNutrition?.goal?.dailyCalories ?? 2200;
  const sleepMin = sleep?.latest?.duration ?? 0;
  const workouts = greeting?.stats?.workoutCount ?? 0;

  const stats: Array<{
    icon: IconKey;
    label: string;
    value: string;
    unit: string;
    subtitle: string;
    color: string;
    progress: number;
    loading: boolean;
    route: string;
  }> = [
    {
      icon: 'su',
      label: 'Su',
      value: toL(waterMl),
      unit: 'L',
      subtitle: `Hedef ${toL(waterGoal)}L`,
      color: G.blue,
      progress: waterMl / waterGoal,
      loading: wL,
      route: '/(tabs)/tracking',
    },
    {
      icon: 'kalori',
      label: 'Kalori',
      value: String(cals),
      unit: 'kcal',
      subtitle: `Hedef ${calGoal} kcal`,
      color: G.orange,
      progress: cals / calGoal,
      loading: dL,
      route: '/(tabs)/tracking',
    },
    {
      icon: 'uyku',
      label: 'Uyku',
      value: toHrs(sleepMin),
      unit: 'sa',
      subtitle: 'Hedef 8 saat',
      color: G.purple,
      progress: sleepMin / 480,
      loading: sL,
      route: '/(tabs)/tracking',
    },
    {
      icon: 'antrenman',
      label: 'Antrenman',
      value: String(workouts),
      unit: 'seans',
      subtitle: 'Bugün',
      color: G.green,
      progress: Math.min(workouts, 1),
      loading: gL,
      route: '/(tabs)/sessions',
    },
  ];

  // CTA press animation
  const ctaScale = useRef(new Animated.Value(1)).current;
  const ctaOnIn = () =>
    Animated.spring(ctaScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  const ctaOnOut = () =>
    Animated.spring(ctaScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 6,
    }).start();

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      {/* ── Progress bar (YouTube-style) ── */}
      <Animated.View style={[st.progressBar, { opacity: barOp }]} pointerEvents="none">
        <Animated.View style={[st.progressFill, { transform: [{ translateX: barX }] }]} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="transparent" />
        }
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <Animated.View style={[st.header, { opacity: fade, transform: [{ translateY: slide }] }]}>
          <View style={{ flex: 1 }}>
            <Text style={st.greetSmall}>{greetWord},</Text>
            <Text style={st.greetName}>{firstName} 👋</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ReadinessBadge score={readiness?.score ?? 0} loading={rL} />
            <Pressable
              style={st.notifBtn}
              onPress={() => router.push('/(app)/notifications' as never)}
              hitSlop={12}
            >
              <Ionicons name="notifications-outline" size={19} color={G.label2} />
              <View style={st.notifDot} />
            </Pressable>
          </View>
        </Animated.View>

        {/* ── AI mesajı ──────────────────────────────────────────────────────── */}
        <Animated.View style={{ opacity: fade }}>
          <AICard message={greeting?.message ?? ''} loading={gL} />
        </Animated.View>

        {/* ── Pet widget ─────────────────────────────────────────────────────── */}
        <PetWidget onPress={() => router.push('/(app)/pet' as never)} />

        {/* ── Stat kartları (yatay scroll) ────────────────────────────────────── */}
        <View style={st.sectionHeader}>
          <Text style={st.sectionTitle}>Bugün</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {!!water?.streak && (
              <View style={st.streakChip}>
                <Text style={st.streakTxt}>🔥 {water.streak} gün</Text>
              </View>
            )}
            <ScrollHint />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.statScroll}
          decelerationRate="fast"
          snapToInterval={STAT_CARD_W + 14}
          snapToAlignment="start"
        >
          {stats.map((s) => (
            <StatCard
              key={s.label}
              icon={s.icon}
              label={s.label}
              value={s.value}
              unit={s.unit}
              subtitle={s.subtitle}
              color={s.color}
              progress={s.progress}
              loading={s.loading}
              onPress={() => router.push(s.route as never)}
            />
          ))}
        </ScrollView>

        {/* ── Seans Başlat — dominant CTA ─────────────────────────────────────── */}
        <Pressable
          onPressIn={ctaOnIn}
          onPressOut={ctaOnOut}
          onPress={() => router.push('/(tabs)/sessions' as never)}
        >
          <Animated.View style={[st.ctaCard, { transform: [{ scale: ctaScale }] }]}>
            {/* Glow layer */}
            <View style={st.ctaGlow} pointerEvents="none" />
            <View style={st.ctaInner}>
              <Image source={ICONS.flash} style={{ width: 52, height: 52 }} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={st.ctaTitle}>Seans Başlat</Text>
                <Text style={st.ctaSub}>AI koçunla antrenman yap</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(0,0,0,0.5)" />
            </View>
          </Animated.View>
        </Pressable>

        {/* ── Yol Haritam ──────────────────────────────────────────────────────── */}
        <Pressable onPress={() => router.push('/(tabs)/roadmap' as never)}>
          {({ pressed }) => (
            <View style={[st.roadmapCard, pressed && { opacity: 0.7 }]}>
              <View style={st.roadmapIcon}>
                <Image
                  source={ICONS.roadmap}
                  style={{ width: 40, height: 40 }}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.roadmapTitle}>Yol Haritam</Text>
                <Text style={st.roadmapSub}>Bu haftanın görevlerine bak</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={G.label3} />
            </View>
          )}
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── StyleSheet ────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: G.bg },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 999,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SW * 0.5,
    height: 2,
    borderRadius: 1,
    backgroundColor: G.green,
  },
  scroll: { paddingHorizontal: H_PAD, paddingBottom: 40 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 28, marginBottom: 20 },
  greetSmall: { color: G.label2, fontSize: 13, fontWeight: '500', letterSpacing: 0.1 },
  greetName: {
    color: G.label,
    fontSize: 28,
    fontWeight: Platform.OS === 'ios' ? '800' : 'bold',
    letterSpacing: -0.8,
    marginTop: 1,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: G.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: G.separator,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: G.red,
    borderWidth: 1.5,
    borderColor: G.bg,
  },

  // Readiness ring
  readRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: G.surface,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readScore: { fontSize: 15, fontWeight: '800', letterSpacing: -0.5, lineHeight: 17 },
  readLbl: { color: G.label3, fontSize: 7, fontWeight: '700', letterSpacing: 0.5, lineHeight: 9 },

  // AI card
  aiCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: G.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: G.greenBorder,
  },
  aiIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: G.greenDim,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  aiText: { flex: 1, color: G.label, fontSize: 14, lineHeight: 21, fontWeight: '500' },

  // Pet card
  petCard: {
    backgroundColor: G.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: G.separator,
    overflow: 'hidden',
  },
  petGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: G.greenDim,
  },
  petInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  petEmoji: { fontSize: 42 },
  petName: { color: G.label, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  petMoodTxt: { color: G.label2, fontSize: 13 },
  lvBadge: {
    backgroundColor: G.greenDim,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: G.greenBorder,
  },
  lvTxt: { color: G.green, fontSize: 12, fontWeight: '700' },
  moodBarBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 14,
  },
  moodBarFill: { height: 3, borderRadius: 2 },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: { color: G.label, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  streakChip: {
    backgroundColor: 'rgba(255,159,10,0.15)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,159,10,0.3)',
  },
  streakTxt: { color: G.orange, fontSize: 12, fontWeight: '700' },

  // Stat scroll
  statScroll: { paddingHorizontal: H_PAD, gap: 14, marginBottom: 24 },

  // Stat card
  statCard: {
    width: STAT_CARD_W,
    height: STAT_CARD_H,
    backgroundColor: G.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: G.separator,
    justifyContent: 'space-between',
  },
  statChip: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  statVal: { fontSize: 26, fontWeight: '800', letterSpacing: -1 },
  statUnit: { color: G.label3, fontSize: 12, fontWeight: '500' },
  statLabel: { color: G.label2, fontSize: 12, fontWeight: '600', marginTop: 2 },
  barBg: { height: 3, backgroundColor: 'rgba(0,0,0,0.07)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 3, borderRadius: 2 },
  statSub: { color: G.label3, fontSize: 11, fontWeight: '500' },

  // CTA — Seans Başlat
  ctaCard: {
    backgroundColor: G.green,
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    // iOS shadow (glow effect)
    shadowColor: G.green,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  ctaGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  ctaInner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  ctaIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: { color: '#000', fontSize: 17, fontWeight: '800', letterSpacing: -0.4 },
  ctaSub: { color: 'rgba(0,0,0,0.55)', fontSize: 13, fontWeight: '500', marginTop: 1 },

  // Roadmap card
  roadmapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: G.surface,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: G.separator,
  },
  roadmapIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: G.greenDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: G.greenBorder,
    flexShrink: 0,
  },
  roadmapTitle: { color: G.label, fontSize: 16, fontWeight: '700' },
  roadmapSub: { color: G.label2, fontSize: 13, marginTop: 1 },
});

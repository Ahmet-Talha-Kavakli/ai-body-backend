/**
 * Rota Takip — Live GPS tracking + cinematic flyover
 *
 * Two modes:
 *   - Planned-route (`?id=<routeId>`):       loads saved route, shows it as
 *                                            target polyline, off-route warnings,
 *                                            distance-remaining + progress bar.
 *   - Free-run     (`?mode=free&activityType=running|walking|cycling`):
 *                                            no planned route, no off-route UI,
 *                                            distance is purely from GPS samples.
 *
 * Flow:
 *   loading → countdown(3..2..1) → tracking → (Bitir) → flyover → back
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapboxRouteView, { MapboxRouteViewRef } from '../../../components/maps/MapboxRouteView';
import { useTrackingSession } from '../../../src/hooks/useTrackingSession';
import { usePedometer } from '../../../src/hooks/usePedometer';

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCENT = '#FF6B35';
const ROUTES_KEY = 'fitai_routes_v1';
const SESSIONS_KEY = 'fitai_route_sessions_v1';

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);

// ─── Types ────────────────────────────────────────────────────────────────────
interface LatLng {
  latitude: number;
  longitude: number;
}

interface GpsRoute {
  id: string;
  name: string;
  activityType: string;
  distanceKm: number;
  elevationGain: number;
  durationSec: number;
  coordinates: LatLng[];
  difficulty: string;
  surface: string;
}

interface RouteSession {
  id: string;
  routeId: string;
  routeName: string;
  startedAt: string;
  endedAt: string;
  trace: LatLng[];
  distanceKm: number;
  durationSec: number;
  avgPaceSecPerKm: number;
}

type ActivityKind = 'running' | 'walking' | 'cycling';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatPace(sec: number, km: number): string {
  if (km < 0.05) return '—';
  const secPerKm = sec / km;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}'${s.toString().padStart(2, '0')}"`;
}

function distanceFromRoute(p: LatLng, route: LatLng[]): number {
  let min = Infinity;
  for (const c of route) {
    const d = haversineKm(p, c);
    if (d < min) min = d;
  }
  return min * 1000; // m
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
type ScreenPhase = 'loading' | 'countdown' | 'tracking' | 'paused' | 'finished' | 'flyover';

export default function RotaTakip() {
  const params = useLocalSearchParams<{ id?: string; mode?: string; activityType?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapboxRouteViewRef>(null);

  const isFreeRun = params.mode === 'free' || !params.id;
  const activityType: ActivityKind =
    params.activityType === 'walking'
      ? 'walking'
      : params.activityType === 'cycling'
        ? 'cycling'
        : 'running';

  const [route, setRoute] = useState<GpsRoute | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showFlyover, setShowFlyover] = useState(false);
  const [offRoute, setOffRoute] = useState(false);
  const offRouteHapticTime = useRef(0);

  const {
    phase,
    setPhase,
    samples,
    elapsed,
    lastCoord,
    distanceKm,
    avgSpeedKmh,
    maxSpeedKmh,
    startedAt,
    finish,
    pause,
    resume,
  } = useTrackingSession({
    activityType: isFreeRun ? activityType : (mapStravaToKind(route?.activityType) ?? activityType),
    routeId: isFreeRun ? undefined : (params.id as string | undefined),
  });

  const resolvedActivity: ActivityKind = isFreeRun
    ? activityType
    : (mapStravaToKind(route?.activityType) ?? activityType);
  const isFootActivity = resolvedActivity === 'running' || resolvedActivity === 'walking';
  const steps = usePedometer(phase === 'tracking' && isFootActivity, startedAt || null);

  // Load planned route (skipped in free-run mode)
  useEffect(() => {
    if (isFreeRun) {
      setRoute(null);
      setBootstrapped(true);
      setPhase('countdown');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ROUTES_KEY);
        const list: GpsRoute[] = raw ? JSON.parse(raw) : [];
        const found = list.find((r) => r.id === params.id);
        if (cancelled) return;
        if (!found) {
          Alert.alert('Hata', 'Rota bulunamadı.');
          router.back();
          return;
        }
        setRoute(found);
        setBootstrapped(true);
        setPhase('countdown');
      } catch {
        if (!cancelled) router.back();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id, isFreeRun]);

  // Countdown 3..2..1 → tracking
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setPhase('tracking');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, setPhase]);

  // Map follow + heading rotation while tracking
  useEffect(() => {
    if (phase !== 'tracking' || !lastCoord) return;
    mapRef.current?.flyTo(
      { latitude: lastCoord.latitude, longitude: lastCoord.longitude },
      17,
      800,
    );
    if (lastCoord.heading != null) {
      mapRef.current?.setHeading(lastCoord.heading, 600);
    }
  }, [phase, lastCoord]);

  // Off-route detection (planned-route mode only)
  useEffect(() => {
    if (isFreeRun || phase !== 'tracking' || !route || !lastCoord) return;
    const d = distanceFromRoute(lastCoord, route.coordinates);
    const off = d > 30; // 30 m threshold
    setOffRoute((prev) => (prev !== off ? off : prev));
    if (off && Date.now() - offRouteHapticTime.current > 8000) {
      offRouteHapticTime.current = Date.now();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
  }, [phase, lastCoord, route, isFreeRun]);

  const remainingKm = route ? Math.max(0, route.distanceKm - distanceKm) : 0;
  const progress = route && route.distanceKm > 0 ? Math.min(1, distanceKm / route.distanceKm) : 0;

  const handleFinish = useCallback(() => {
    if (samples.length < 5) {
      Alert.alert('Çok kısa', 'Henüz yeterli mesafe yok. Devam et veya iptal et.');
      return;
    }
    Alert.alert('Antrenman bitsin mi?', 'Bitir ve özetle.', [
      { text: 'Devam et', style: 'cancel' },
      {
        text: 'Bitir',
        style: 'destructive',
        onPress: async () => {
          await finish();
          // Persist legacy route session (back-compat — Chunk 4 will replace).
          if (route) {
            const trace: LatLng[] = samples.map((s) => ({
              latitude: s.latitude,
              longitude: s.longitude,
            }));
            const session: RouteSession = {
              id: Date.now().toString(),
              routeId: route.id,
              routeName: route.name,
              startedAt: new Date(Date.now() - elapsed * 1000).toISOString(),
              endedAt: new Date().toISOString(),
              trace,
              distanceKm,
              durationSec: elapsed,
              avgPaceSecPerKm: distanceKm > 0 ? elapsed / distanceKm : 0,
            };
            try {
              const raw = await AsyncStorage.getItem(SESSIONS_KEY);
              const list: RouteSession[] = raw ? JSON.parse(raw) : [];
              await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify([session, ...list]));
            } catch {}
          }
          setShowFlyover(true);
        },
      },
    ]);
  }, [samples, route, distanceKm, elapsed, finish]);

  const handleCancel = () => {
    Alert.alert('İptal et', 'Bu kayıt silinecek.', [
      { text: 'Devam et', style: 'cancel' },
      {
        text: 'İptal',
        style: 'destructive',
        onPress: () => {
          router.back();
        },
      },
    ]);
  };

  // ─── Cinematic Flyover ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!showFlyover || samples.length < 2) return;
    let cancelled = false;
    const trace: LatLng[] = samples.map((s) => ({
      latitude: s.latitude,
      longitude: s.longitude,
    }));
    (async () => {
      mapRef.current?.fitToCoords(trace, 80);
      mapRef.current?.setPitch(0, 800);
      await new Promise<void>((r) => setTimeout(r, 1200));
      if (cancelled) return;

      mapRef.current?.setPitch(60, 1200);
      await new Promise<void>((r) => setTimeout(r, 1200));
      if (cancelled) return;
      const sampled = sampleEvenly(trace, 30);
      await mapRef.current?.flyAlong(sampled, 14000, 60);
      if (cancelled) return;

      mapRef.current?.setPitch(0, 800);
      mapRef.current?.fitToCoords(trace, 80);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
  }, [showFlyover, samples]);

  // Loading guard: planned mode waits on route + bootstrap
  if (!bootstrapped || (!isFreeRun && !route)) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={ACCENT} size="large" />
      </View>
    );
  }

  const initialCenter: LatLng =
    route?.coordinates[0] ??
    (lastCoord
      ? { latitude: lastCoord.latitude, longitude: lastCoord.longitude }
      : { latitude: 41.0082, longitude: 28.9784 });

  const screenPhase: ScreenPhase = showFlyover ? 'flyover' : (phase as ScreenPhase);
  const headerTitle = route?.name ?? activityLabel(activityType);

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Map */}
      <MapboxRouteView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        styleKey="standard"
        initialCenter={initialCenter}
        initialZoom={16}
        routeCoords={route?.coordinates}
        showStartEnd={!isFreeRun}
        showsUserLocation
        scrollEnabled={screenPhase !== 'tracking'}
        rotateEnabled={screenPhase !== 'tracking'}
        pitchEnabled
      />

      {/* Countdown overlay */}
      {screenPhase === 'countdown' && (
        <View style={s.countdownWrap} pointerEvents="none">
          <View style={s.countdownPill}>
            <Text style={s.countdownTxt}>{countdown === 0 ? 'BAŞLA!' : countdown}</Text>
          </View>
        </View>
      )}

      {/* Off-route warning (planned-route only) */}
      {!isFreeRun && screenPhase === 'tracking' && offRoute && (
        <View style={[s.offRoutePill, { top: insets.top + 12 }]}>
          <Ionicons name="warning" size={14} color="#FF9500" />
          <Text style={s.offRouteTxt}>Rotadan saptın</Text>
        </View>
      )}

      {/* Top bar */}
      {screenPhase === 'tracking' && (
        <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={handleCancel} style={s.cancelBtn} hitSlop={10}>
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
          <View style={s.recDot} />
          <Text style={s.recTxt}>KAYIT</Text>
        </View>
      )}

      {/* Stats panel */}
      {screenPhase === 'tracking' && (
        <View style={[s.statsPanel, { paddingBottom: insets.bottom + 14 }]}>
          {!isFreeRun && (
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          )}

          <View style={s.statsRow}>
            <View style={s.statSlot}>
              <Text style={s.statVal}>
                {distanceKm.toFixed(2)}
                <Text style={s.statUnit}>km</Text>
              </Text>
              <Text style={s.statLbl}>GİDİLEN</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.statSlot}>
              <Text style={s.statVal}>{formatTime(elapsed)}</Text>
              <Text style={s.statLbl}>SÜRE</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.statSlot}>
              <Text style={s.statVal}>
                {formatPace(elapsed, distanceKm)}
                <Text style={s.statUnit}>/km</Text>
              </Text>
              <Text style={s.statLbl}>TEMPO</Text>
            </View>
          </View>

          <View style={s.subStatsRow}>
            {!isFreeRun ? (
              <Text style={s.subStat}>
                <Ionicons name="flag-outline" size={12} color="rgba(255,255,255,0.5)" />{' '}
                <Text style={{ fontWeight: '700', color: '#fff' }}>
                  {remainingKm.toFixed(2)} km
                </Text>{' '}
                kaldı
              </Text>
            ) : (
              <Text style={s.subStat}>
                <Ionicons name="map-outline" size={12} color="rgba(255,255,255,0.5)" />{' '}
                <Text style={{ fontWeight: '700', color: '#fff' }}>
                  {activityLabel(resolvedActivity)}
                </Text>
              </Text>
            )}
            {isFootActivity ? (
              <Text style={s.subStat}>
                <Ionicons name="footsteps-outline" size={12} color="rgba(255,255,255,0.5)" />{' '}
                <Text style={{ fontWeight: '700', color: '#fff' }}>{steps}</Text> adım
              </Text>
            ) : (
              <>
                <Text style={s.subStat}>
                  <Ionicons name="speedometer-outline" size={12} color="rgba(255,255,255,0.5)" />{' '}
                  <Text style={{ fontWeight: '700', color: '#fff' }}>{avgSpeedKmh.toFixed(1)}</Text>{' '}
                  km/h ort.
                </Text>
                <Text style={s.subStat}>
                  <Ionicons name="flash-outline" size={12} color="rgba(255,255,255,0.5)" />{' '}
                  <Text style={{ fontWeight: '700', color: '#fff' }}>{maxSpeedKmh.toFixed(1)}</Text>{' '}
                  km/h maks.
                </Text>
              </>
            )}
          </View>

          <Pressable onPress={handleFinish} style={s.finishBtn}>
            <Ionicons name="stop-circle" size={22} color="#fff" />
            <Text style={s.finishBtnTxt}>Bitir</Text>
          </Pressable>
        </View>
      )}

      {/* Flyover overlay */}
      {screenPhase === 'flyover' && (
        <FlyoverOverlay
          insets={insets}
          distKm={distanceKm}
          duration={elapsed}
          routeName={headerTitle}
          onClose={() => router.back()}
        />
      )}
    </View>
  );
}

// ─── Flyover Overlay ─────────────────────────────────────────────────────────
function FlyoverOverlay({
  insets,
  distKm,
  duration,
  routeName,
  onClose,
}: {
  insets: { top: number; bottom: number };
  distKm: number;
  duration: number;
  routeName: string;
  onClose: () => void;
}) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: EASE_SPRING,
        delay: 600,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: EASE_SPRING,
        delay: 600,
      }),
    ]).start();
  }, []);

  return (
    <View style={s.flyoverWrap} pointerEvents="box-none">
      <Animated.View
        style={[
          s.flyoverTop,
          {
            paddingTop: insets.top + 14,
            opacity: fadeIn,
            transform: [
              {
                translateY: slide.interpolate({
                  inputRange: [0, 40],
                  outputRange: [0, -40],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={s.flyoverBrand}>FİTAİ</Text>
        <Text style={s.flyoverRoute}>{routeName}</Text>
        <View style={s.flyoverStatsRow}>
          <View style={s.flyoverStat}>
            <Text style={s.flyoverStatLbl}>Süre</Text>
            <Text style={s.flyoverStatVal}>{formatTime(duration)}</Text>
          </View>
          <View style={s.flyoverStatDiv} />
          <View style={s.flyoverStat}>
            <Text style={s.flyoverStatLbl}>Mesafe</Text>
            <Text style={s.flyoverStatVal}>
              {distKm.toFixed(2)}
              <Text style={{ fontSize: 18 }}>km</Text>
            </Text>
          </View>
          <View style={s.flyoverStatDiv} />
          <View style={s.flyoverStat}>
            <Text style={s.flyoverStatLbl}>Tempo</Text>
            <Text style={s.flyoverStatVal}>
              {formatPace(duration, distKm)}
              <Text style={{ fontSize: 14 }}>/km</Text>
            </Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[s.flyoverClose, { top: insets.top + 12, opacity: fadeIn }]}>
        <Pressable onPress={onClose} hitSlop={10} style={s.flyoverCloseBtn}>
          <Ionicons name="close" size={20} color="#fff" />
        </Pressable>
      </Animated.View>

      <Animated.View
        style={[
          s.flyoverBottom,
          {
            paddingBottom: insets.bottom + 18,
            opacity: fadeIn,
            transform: [{ translateY: slide }],
          },
        ]}
      >
        <Pressable onPress={onClose} style={s.flyoverDoneBtn}>
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
          <Text style={s.flyoverDoneTxt}>Tamamlandı</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// Sample N points evenly along the trace
function sampleEvenly(coords: LatLng[], n: number): LatLng[] {
  if (coords.length <= n) return coords;
  const step = (coords.length - 1) / (n - 1);
  const out: LatLng[] = [];
  for (let i = 0; i < n; i++) {
    out.push(coords[Math.round(i * step)]!);
  }
  return out;
}

function activityLabel(k: ActivityKind): string {
  return k === 'cycling' ? 'Bisiklet' : k === 'walking' ? 'Yürüyüş' : 'Koşu';
}

function mapStravaToKind(act?: string): ActivityKind | null {
  if (!act) return null;
  if (act === 'run') return 'running';
  if (act === 'ride') return 'cycling';
  if (act === 'walk' || act === 'hike') return 'walking';
  return null;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  // Countdown
  countdownWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  countdownPill: {
    backgroundColor: ACCENT,
    paddingHorizontal: 56,
    paddingVertical: 36,
    borderRadius: 999,
    shadowColor: ACCENT,
    shadowOpacity: 0.6,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
  },
  countdownTxt: {
    fontSize: 64,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -2,
    textAlign: 'center',
  },

  // Top bar (recording)
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 10,
    zIndex: 5,
  },
  cancelBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(10,10,20,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  recDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#FF3B30', marginLeft: 4 },
  recTxt: { fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 1.5 },

  // Off-route pill
  offRoutePill: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(40,30,0,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: '#FF950055',
    zIndex: 6,
  },
  offRouteTxt: { fontSize: 12.5, fontWeight: '700', color: '#FF9500' },

  // Stats panel (live)
  statsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10,10,20,0.94)',
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 2 },
  statsRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  statSlot: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.6 },
  statUnit: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.55)' },
  statLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  statDiv: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)' },
  subStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 14,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  subStat: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  finishBtnTxt: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },

  // Flyover
  flyoverWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', zIndex: 10 },
  flyoverTop: {
    paddingHorizontal: 22,
    alignItems: 'center',
    backgroundColor: 'rgba(10,10,20,0.55)',
  },
  flyoverBrand: { fontSize: 11, fontWeight: '900', color: ACCENT, letterSpacing: 4 },
  flyoverRoute: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  flyoverStatsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  flyoverStat: { flex: 1, alignItems: 'center' },
  flyoverStatLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.6,
  },
  flyoverStatVal: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  flyoverStatDiv: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.18)' },
  flyoverClose: { position: 'absolute', right: 14, zIndex: 11 },
  flyoverCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  flyoverBottom: { paddingHorizontal: 22 },
  flyoverDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ACCENT,
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  flyoverDoneTxt: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
});

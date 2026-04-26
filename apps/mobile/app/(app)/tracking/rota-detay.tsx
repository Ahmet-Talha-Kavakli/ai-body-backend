import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Easing,
  ActivityIndicator,
  Alert,
  Share,
  ActionSheetIOS,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapboxRouteView, {
  MapboxRouteViewRef,
  MapStyleKey,
} from '../../../components/maps/MapboxRouteView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const ACCENT = '#FF6B35';
const ROUTES_KEY = 'fitai_routes_v1';

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
  elevationLoss?: number;
  durationSec: number;
  difficulty: 'Kolay' | 'Orta' | 'Zor';
  surface: 'Asfalt' | 'Patika' | 'Karma';
  coordinates: LatLng[];
  elevationProfile?: number[];
  waypoints?: LatLng[];
  createdAt: string;
  completionCount?: number;
}

interface WeatherDay {
  time: string;
  tMax: number;
  tMin: number;
  precip: number;
  weatherCode: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
}

function formatPace(sec: number, km: number, type: string): string {
  if (km === 0) return '—';
  if (type === 'ride') return `${(km / (sec / 3600)).toFixed(1)} km/sa`;
  const secPerKm = sec / km;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}'${s.toString().padStart(2, '0')}"/km`;
}

function climbCategory(km: number, gainM: number): string {
  if (km === 0 || gainM < 50) return '—';
  const grad = (gainM / (km * 1000)) * 100;
  const score = km * grad * grad;
  if (score > 80) return 'HC';
  if (score > 64) return '1.';
  if (score > 32) return '2.';
  if (score > 16) return '3.';
  if (score > 8) return '4.';
  return '—';
}

function buildGPX(route: GpsRoute): string {
  const pts = route.coordinates
    .map((c, i) => {
      const ele = route.elevationProfile?.[i] ?? 0;
      return `    <trkpt lat="${c.latitude}" lon="${c.longitude}"><ele>${ele.toFixed(1)}</ele></trkpt>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="FitAI" xmlns="http://www.topografix.com/GPX/1/1">\n  <metadata><name>${route.name}</name><time>${route.createdAt}</time></metadata>\n  <trk><name>${route.name}</name><type>${route.activityType}</type><trkseg>\n${pts}\n  </trkseg></trk>\n</gpx>`;
}

const SPORT_LABELS: Record<string, string> = {
  run: 'Koşu',
  ride: 'Bisiklet',
  walk: 'Yürüyüş',
  hike: 'Doğa Yürüyüşü',
};
const SPORT_ICONS: Record<string, string> = { run: '🏃', ride: '🚴', walk: '🚶', hike: '🥾' };
const WEATHER_ICON: Record<number, string> = {
  0: '☀️',
  1: '🌤',
  2: '⛅',
  3: '☁️',
  45: '🌫',
  48: '🌫',
  51: '🌦',
  53: '🌦',
  55: '🌦',
  61: '🌧',
  63: '🌧',
  65: '🌧',
  71: '🌨',
  73: '🌨',
  75: '🌨',
  77: '❄️',
  80: '🌦',
  81: '🌧',
  82: '⛈',
  85: '🌨',
  86: '🌨',
  95: '⛈',
  96: '⛈',
  99: '⛈',
};

// ─── Elevation Profile ────────────────────────────────────────────────────────
function ElevationProfile({ profile, distanceKm }: { profile: number[]; distanceKm: number }) {
  if (profile.length < 2) return null;
  const W = 320,
    H = 80;
  const min = Math.min(...profile);
  const max = Math.max(...profile);
  const range = max - min || 1;
  const step = W / (profile.length - 1);
  const linePts = profile
    .map((p, i) => {
      const x = i * step;
      const y = H - ((p - min) / range) * (H - 12) - 6;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const fillPath = `${linePts} L${W},${H} L0,${H} Z`;

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>Yükseklik Profili</Text>
        <Text style={s.cardMeta}>
          ↑ {Math.round(max)}m · ↓ {Math.round(min)}m
        </Text>
      </View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="elvGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={ACCENT} stopOpacity="0.25" />
            <Stop offset="1" stopColor={ACCENT} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        <Path d={fillPath} fill="url(#elvGrad)" />
        <Path
          d={linePts}
          fill="none"
          stroke={ACCENT}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={s.elevLabel}>{distanceKm < 1 ? '0 m' : '0 km'}</Text>
        <Text style={s.elevLabel}>
          {distanceKm < 1
            ? `${Math.round((distanceKm * 1000) / 2)} m`
            : `${(distanceKm / 2).toFixed(1)} km`}
        </Text>
        <Text style={s.elevLabel}>
          {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
        </Text>
      </View>
    </View>
  );
}

// ─── Weather ──────────────────────────────────────────────────────────────────
function WeatherForecast({ coord }: { coord: LatLng }) {
  const [days, setDays] = useState<WeatherDay[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coord.latitude}&longitude=${coord.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=5`;
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;
        setDays(
          (data.daily.time as string[]).map((t, i) => ({
            time: t,
            tMax: data.daily.temperature_2m_max[i],
            tMin: data.daily.temperature_2m_min[i],
            precip: data.daily.precipitation_sum[i],
            weatherCode: data.daily.weather_code[i],
          })),
        );
      } catch {
        if (!cancelled) setDays(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []); // coord sabit — dependency yok, re-fetch önlenir

  const dayName = (t: string) => {
    const d = new Date(t);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) return 'Bugün';
    return d.toLocaleDateString('tr-TR', { weekday: 'short' });
  };

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>5 Günlük Hava</Text>
      </View>
      {loading ? (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={ACCENT} />
        </View>
      ) : !days ? null : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingTop: 4 }}
        >
          {days.map((d) => (
            <View key={d.time} style={s.weatherDay}>
              <Text style={s.weatherDayName}>{dayName(d.time)}</Text>
              <Text style={s.weatherIcon}>{WEATHER_ICON[d.weatherCode] ?? '☁️'}</Text>
              <Text style={s.weatherTempHigh}>{Math.round(d.tMax)}°</Text>
              <Text style={s.weatherTempLow}>{Math.round(d.tMin)}°</Text>
              {d.precip > 0.5 && <Text style={s.weatherPrecip}>💧{d.precip.toFixed(0)}</Text>}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RotaDetayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [route, setRoute] = useState<GpsRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapStyle, setMapStyle] = useState<MapStyleKey>('standard');
  const [exporting, setExporting] = useState(false);

  const heroMapRef = useRef<MapboxRouteViewRef>(null);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(20)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ROUTES_KEY);
        const list: GpsRoute[] = raw ? JSON.parse(raw) : [];
        if (!cancelled) setRoute(list.find((r) => r.id === id) ?? null);
      } catch {
        if (!cancelled) setRoute(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!loading && route) {
      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 480,
          useNativeDriver: true,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        Animated.timing(slideY, {
          toValue: 0,
          duration: 480,
          useNativeDriver: true,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      ]).start();
    }
  }, [loading, route]);

  useEffect(() => {
    if (route && route.coordinates.length >= 2) {
      const t = setTimeout(() => heroMapRef.current?.fitToCoords(route.coordinates, 50), 500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [route]);

  const handleDelete = useCallback(() => {
    if (!route) return;
    Alert.alert('Rotayı Sil', `"${route.name}" silinecek. Geri alınamaz.`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const raw = await AsyncStorage.getItem(ROUTES_KEY);
          const list: GpsRoute[] = raw ? JSON.parse(raw) : [];
          await AsyncStorage.setItem(
            ROUTES_KEY,
            JSON.stringify(list.filter((r) => r.id !== route.id)),
          );
          router.back();
        },
      },
    ]);
  }, [route, router]);

  const handleExportGPX = useCallback(async () => {
    if (!route) return;
    setExporting(true);
    try {
      const gpx = buildGPX(route);
      const safeName = route.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'rota';
      const fileUri = `${FileSystem.cacheDirectory}${safeName}.gpx`;
      await FileSystem.writeAsStringAsync(fileUri, gpx, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/gpx+xml',
          dialogTitle: 'GPX Paylaş',
        });
      } else {
        await Share.share({ message: gpx });
      }
    } catch {
      Alert.alert('Hata', 'Dışa aktarılamadı.');
    } finally {
      setExporting(false);
    }
  }, [route]);

  const handleShare = useCallback(async () => {
    if (!route) return;
    await Share.share({
      title: route.name,
      message: `${route.name}\n${route.distanceKm.toFixed(1)} km · ↑${Math.round(route.elevationGain)}m · ${route.difficulty}`,
    });
  }, [route]);

  const openMenu = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: 'Seçenekler',
        options: ['GPX Dışa Aktar', 'Paylaş', 'Sil', 'İptal'],
        destructiveButtonIndex: 2,
        cancelButtonIndex: 3,
        userInterfaceStyle: 'light',
      },
      (i) => {
        if (i === 3) return;
        Haptics.selectionAsync().catch(() => {});
        if (i === 0) handleExportGPX();
        else if (i === 1) handleShare();
        else if (i === 2) handleDelete();
      },
    );
  }, [handleDelete, handleExportGPX, handleShare]);

  const cycleMapType = useCallback(() => {
    setMapStyle((t) =>
      t === 'standard'
        ? 'satellite'
        : t === 'satellite'
          ? 'hybrid'
          : t === 'hybrid'
            ? 'outdoors'
            : 'standard',
    );
  }, []);

  if (loading) {
    return (
      <View style={s.loadingRoot}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={ACCENT} size="large" />
      </View>
    );
  }

  if (!route) {
    return (
      <View style={[s.loadingRoot, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{ fontSize: 52, marginBottom: 16 }}>🗺️</Text>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1C1C1E', marginBottom: 6 }}>
          Rota bulunamadı
        </Text>
        <Text style={{ fontSize: 14, color: '#8E8E93', marginBottom: 24 }}>
          Bu rota silinmiş olabilir.
        </Text>
        <Pressable style={s.notFoundBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Geri Dön</Text>
        </Pressable>
      </View>
    );
  }

  const elevLoss = route.elevationLoss ?? 0;
  const elevProfile = route.elevationProfile ?? [];
  const startCoord = route.coordinates[0];
  const endCoord = route.coordinates[route.coordinates.length - 1];
  const isLoop =
    route.coordinates.length > 0 &&
    Math.abs(startCoord.latitude - endCoord.latitude) < 0.0005 &&
    Math.abs(startCoord.longitude - endCoord.longitude) < 0.0005;

  const diffColor =
    route.difficulty === 'Kolay' ? '#34C759' : route.difficulty === 'Orta' ? '#FF9500' : '#FF3B30';
  const diffBg =
    route.difficulty === 'Kolay'
      ? 'rgba(52,199,89,0.12)'
      : route.difficulty === 'Orta'
        ? 'rgba(255,149,0,0.12)'
        : 'rgba(255,59,48,0.12)';

  const climbCat = climbCategory(route.distanceKm, route.elevationGain);
  const pace = formatPace(route.durationSec, route.distanceKm, route.activityType);

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeIn, transform: [{ translateY: slideY }] }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {/* ── Hero Map ── */}
        <View style={s.heroMap}>
          <MapboxRouteView
            ref={heroMapRef}
            style={StyleSheet.absoluteFill}
            styleKey={mapStyle}
            initialCenter={startCoord}
            initialZoom={14}
            initialPitch={45}
            routeCoords={route.coordinates}
            showStartEnd={!isLoop}
            attributionEnabled={false}
            logoEnabled={false}
          />

          {/* Floating header */}
          <View style={[s.heroHeader, { paddingTop: insets.top + 4 }]}>
            <Pressable onPress={() => router.back()} style={s.heroBtn} hitSlop={12}>
              <Ionicons name="chevron-back" size={20} color="#1C1C1E" />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable style={s.heroBtn} onPress={cycleMapType}>
              <Ionicons name="layers-outline" size={18} color="#1C1C1E" />
            </Pressable>
            <Pressable onPress={openMenu} style={s.heroBtn}>
              {exporting ? (
                <ActivityIndicator size="small" color="#1C1C1E" />
              ) : (
                <Ionicons name="ellipsis-horizontal" size={18} color="#1C1C1E" />
              )}
            </Pressable>
          </View>
        </View>

        {/* ── Başlık bölümü (Apple Health stili) ── */}
        <View style={s.titleBlock}>
          <View style={s.titleSportTag}>
            <Text style={{ fontSize: 12 }}>{SPORT_ICONS[route.activityType] ?? '🏃'}</Text>
            <Text style={s.titleSportTxt}>
              {SPORT_LABELS[route.activityType] ?? route.activityType}
            </Text>
          </View>
          <Text style={s.titleMain} numberOfLines={2}>
            {route.name}
          </Text>
          <View style={s.titleBadgeRow}>
            <View
              style={[s.titleBadge, { backgroundColor: diffBg, borderColor: diffColor + '40' }]}
            >
              <Text style={[s.titleBadgeTxt, { color: diffColor }]}>{route.difficulty}</Text>
            </View>
            <View
              style={[
                s.titleBadge,
                { backgroundColor: 'rgba(0,122,255,0.08)', borderColor: 'rgba(0,122,255,0.25)' },
              ]}
            >
              <Text style={[s.titleBadgeTxt, { color: '#007AFF' }]}>{route.surface}</Text>
            </View>
            {isLoop && (
              <View
                style={[
                  s.titleBadge,
                  { backgroundColor: 'rgba(52,199,89,0.08)', borderColor: 'rgba(52,199,89,0.25)' },
                ]}
              >
                <Text style={[s.titleBadgeTxt, { color: '#34C759' }]}>Loop</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Stats kart (haritanın altına yapışık) ── */}
        <View style={s.statsCard}>
          {/* Ana 3 stat */}
          <View style={s.statsMainRow}>
            <View style={s.statCell}>
              <Text style={s.statBig}>
                {route.distanceKm.toFixed(1)}
                <Text style={s.statUnit}> km</Text>
              </Text>
              <Text style={s.statLbl}>MESAFE</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statCell}>
              <Text style={s.statBig}>
                {Math.round(route.elevationGain)}
                <Text style={s.statUnit}> m</Text>
              </Text>
              <Text style={s.statLbl}>TIRMANIŞ</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statCell}>
              <Text style={s.statBig}>{formatDuration(route.durationSec)}</Text>
              <Text style={s.statLbl}>SÜRE</Text>
            </View>
          </View>

          {/* İkincil stat satırı */}
          <View style={s.statsSecRow}>
            <View style={s.secStat}>
              <Ionicons name="trending-down" size={13} color="#FF3B30" />
              <Text style={s.secStatTxt}>
                <Text style={s.secStatVal}>{Math.round(elevLoss)}m</Text> iniş
              </Text>
            </View>
            <View style={s.secStatDot} />
            <View style={s.secStat}>
              <Ionicons name="speedometer-outline" size={13} color={ACCENT} />
              <Text style={s.secStatTxt}>
                <Text style={s.secStatVal}>{pace}</Text> tempo
              </Text>
            </View>
            {climbCat !== '—' && (
              <>
                <View style={s.secStatDot} />
                <View style={s.secStat}>
                  <Ionicons name="trail-sign-outline" size={13} color={ACCENT} />
                  <Text style={s.secStatTxt}>
                    kat. <Text style={s.secStatVal}>{climbCat}</Text>
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* ── Aksiyonlar ── */}
        <View style={s.actionRow}>
          <Pressable style={s.actionBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color="#1C1C1E" />
            <Text style={s.actionTxt}>Paylaş</Text>
          </Pressable>
          <Pressable style={s.actionBtn} onPress={handleExportGPX}>
            <Ionicons name="download-outline" size={18} color="#1C1C1E" />
            <Text style={s.actionTxt}>GPX</Text>
          </Pressable>
          <Pressable style={[s.actionBtn, s.actionBtnDanger]} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={17} color="#FF3B30" />
            <Text style={[s.actionTxt, { color: '#FF3B30' }]}>Sil</Text>
          </Pressable>
        </View>

        {/* ── Yükseklik profili ── */}
        {elevProfile.length >= 2 && (
          <ElevationProfile profile={elevProfile} distanceKm={route.distanceKm} />
        )}

        {/* ── Hava durumu ── */}
        <WeatherForecast coord={startCoord} />

        {/* ── Meta ── */}
        <View style={s.metaRow}>
          <Ionicons name="calendar-outline" size={13} color="#C7C7CC" />
          <Text style={s.metaTxt}>
            {new Date(route.createdAt).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            {'  ·  '}
            {route.coordinates.length} nokta
          </Text>
        </View>
      </Animated.ScrollView>

      {/* ── Sticky CTA ── */}
      <View style={[s.stickyWrap, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPressIn={() =>
            Animated.spring(btnScale, {
              toValue: 0.96,
              useNativeDriver: true,
              tension: 300,
              friction: 12,
            }).start()
          }
          onPressOut={() =>
            Animated.spring(btnScale, {
              toValue: 1,
              useNativeDriver: true,
              tension: 300,
              friction: 12,
            }).start()
          }
          onPress={() =>
            router.push({
              pathname: '/(app)/tracking/rota-takip',
              params: { id: route.id },
            } as never)
          }
        >
          <Animated.View style={[s.ctaBtn, { transform: [{ scale: btnScale }] }]}>
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={s.ctaTxt}>Rotayı Kullan</Text>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  loadingRoot: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero
  heroMap: { height: 320, position: 'relative', backgroundColor: '#D1D1D6' },
  heroHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    zIndex: 5,
  },
  heroBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },

  // Title block (haritanın altında, beyaz alanda)
  titleBlock: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  titleSportTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(118,118,128,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  titleSportTxt: { fontSize: 11, fontWeight: '700', color: '#1C1C1E', letterSpacing: 0.2 },
  titleMain: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.7,
    marginBottom: 12,
  },
  titleBadgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  titleBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  titleBadgeTxt: { fontSize: 11.5, fontWeight: '700', letterSpacing: -0.1 },

  // Stats card
  statsCard: {
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    marginBottom: 16,
  },
  statsMainRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statCell: { flex: 1, alignItems: 'center' },
  statBig: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  statUnit: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  statLbl: { fontSize: 10, color: '#8E8E93', marginTop: 4, fontWeight: '700', letterSpacing: 0.4 },
  statDivider: { width: 1, height: 32, backgroundColor: '#E5E5EA' },
  statsSecRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  secStat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  secStatTxt: { fontSize: 12, color: '#8E8E93', fontWeight: '500' },
  secStatVal: { fontWeight: '700', color: '#1C1C1E' },
  secStatDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#D1D1D6' },

  // Actions
  actionRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 16 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  actionBtnDanger: {},
  actionTxt: { fontSize: 13, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.2 },

  // Card (elevation, weather)
  card: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.3 },
  cardMeta: { fontSize: 12, color: '#8E8E93', fontWeight: '500' },
  elevLabel: { fontSize: 10, color: '#8E8E93' },

  // Weather
  weatherDay: {
    width: 62,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  weatherDayName: { fontSize: 11, fontWeight: '600', color: '#8E8E93', marginBottom: 6 },
  weatherIcon: { fontSize: 20, marginBottom: 6 },
  weatherTempHigh: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  weatherTempLow: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  weatherPrecip: { fontSize: 10, color: '#007AFF', marginTop: 4, fontWeight: '600' },

  // Meta
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  metaTxt: { fontSize: 12, color: '#C7C7CC' },

  // Sticky CTA
  stickyWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'rgba(242,242,247,0.96)',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  ctaBtn: {
    backgroundColor: ACCENT,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
  ctaTxt: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },

  // Not found
  notFoundBtn: {
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: ACCENT,
  },
});

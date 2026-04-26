import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  ActionSheetIOS,
  Alert,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapboxRouteView, {
  MapboxRouteViewRef,
  MapStyleKey,
} from '../../../components/maps/MapboxRouteView';
type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};
type MapType = 'standard' | 'satellite' | 'hybrid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { searchPlacesHybrid, reverseGeocode, PlaceResult } from '../../../lib/placeSearch';

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCENT = '#FF6B35';
const CARD = '#16162A';
const ROUTES_KEY = 'fitai_routes_v1';

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);
const EASE_SMOOTH = Easing.bezier(0.22, 1, 0.36, 1);

// BRouter profiles (free, no API key)
const BROUTER_PROFILE: Record<ActivityType, string> = {
  run: 'trekking',
  ride: 'trekking',
  walk: 'hiking-mountain',
};

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Overpass: classify path types — pedestrian first, then cycle, then mixed track
const PATH_HIGHWAY_RE = '^(footway|path|pedestrian|steps|bridleway|cycleway|track)$';

interface Pathway {
  id: number;
  coords: LatLng[];
  category: 'foot' | 'bike' | 'mixed';
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface LatLng {
  latitude: number;
  longitude: number;
}
interface ElevPoint extends LatLng {
  ele: number;
}

interface Segment {
  to: LatLng; // waypoint at end of this segment
  coords: ElevPoint[]; // snapped polyline
  distKm: number;
  gain: number;
  loss: number;
}

interface GpsRoute {
  id: string;
  name: string;
  activityType: string;
  distanceKm: number;
  elevationGain: number;
  elevationLoss: number;
  durationSec: number;
  difficulty: 'Kolay' | 'Orta' | 'Zor';
  surface: 'Asfalt' | 'Patika' | 'Karma';
  coordinates: LatLng[];
  elevationProfile: number[];
  waypoints: LatLng[];
  createdAt: string;
}

type SearchResult = PlaceResult;

type ActivityType = 'run' | 'ride' | 'walk';
type Difficulty = 'Kolay' | 'Orta' | 'Zor';
type Surface = 'Asfalt' | 'Patika' | 'Karma';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function totalDistanceKm(pts: LatLng[]): number {
  if (pts.length < 2) return 0;
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += haversineKm(pts[i - 1], pts[i]);
  return d;
}

function estimateDuration(km: number, type: ActivityType, gain: number): number {
  const base = type === 'run' ? 360 : type === 'ride' ? 180 : 720;
  const climbBonus = (gain / 100) * 30; // +30s/100m climb
  return Math.round(km * base + climbBonus);
}

function autoDifficulty(km: number, gain: number): Difficulty {
  const score = km + gain / 100;
  if (score < 4) return 'Kolay';
  if (score < 10) return 'Orta';
  return 'Zor';
}

function formatDist(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(2)}km`;
}

// Pulsing overlay color — discrete 4-step cycle (low render cost)
const PULSE_ALPHAS = [0.32, 0.5, 0.68, 0.5];
function overlayColor(category: 'foot' | 'bike' | 'mixed', phase: number, onSat: boolean): string {
  const a = PULSE_ALPHAS[phase % 4] + (onSat ? 0.2 : 0);
  if (category === 'bike') return `rgba(82,156,255,${a.toFixed(3)})`;
  return onSat ? `rgba(255,165,80,${a.toFixed(3)})` : `rgba(255,107,53,${a.toFixed(3)})`;
}

// Compute distance markers (every km) along a polyline
function computeKmMarkers(coords: LatLng[]): { coord: LatLng; km: number }[] {
  if (coords.length < 2) return [];
  const markers: { coord: LatLng; km: number }[] = [];
  let cumDist = 0;
  let nextKm = 1;
  for (let i = 1; i < coords.length; i++) {
    const segLen = haversineKm(coords[i - 1], coords[i]);
    while (cumDist + segLen >= nextKm) {
      const t = (nextKm - cumDist) / segLen;
      markers.push({
        coord: {
          latitude: coords[i - 1].latitude + (coords[i].latitude - coords[i - 1].latitude) * t,
          longitude: coords[i - 1].longitude + (coords[i].longitude - coords[i - 1].longitude) * t,
        },
        km: nextKm,
      });
      nextKm += 1;
      if (nextKm > 200) break;
    }
    cumDist += segLen;
  }
  return markers;
}

// ─── BRouter routing (free, snap-to-path + elevation) ────────────────────────
const BROUTER_TIMEOUT_MS = 8000;

async function fetchSnappedRoute(
  from: LatLng,
  to: LatLng,
  profile: string,
  signal?: AbortSignal,
): Promise<{ coords: ElevPoint[]; distKm: number; gain: number; loss: number } | null> {
  // Hard timeout: combine external abort + 8s deadline
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), BROUTER_TIMEOUT_MS);
  const onExternalAbort = () => ctl.abort();
  signal?.addEventListener('abort', onExternalAbort);

  try {
    const url = `https://brouter.de/brouter?lonlats=${from.longitude},${from.latitude}|${to.longitude},${to.latitude}&profile=${profile}&alternativeidx=0&format=geojson`;
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error('routing failed');
    const data = await res.json();
    const feat = data?.features?.[0];
    if (!feat) throw new Error('no route');

    const rawCoords: number[][] = feat.geometry.coordinates;
    const coords: ElevPoint[] = rawCoords.map((c) => ({
      longitude: c[0],
      latitude: c[1],
      ele: c[2] ?? 0,
    }));

    let distKm = 0,
      gain = 0,
      loss = 0;
    for (let i = 1; i < coords.length; i++) {
      distKm += haversineKm(coords[i - 1], coords[i]);
      const dEle = coords[i].ele - coords[i - 1].ele;
      if (dEle > 0) gain += dEle;
      else loss -= dEle;
    }
    return { coords, distKm, gain, loss };
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}

// Fallback: straight line with no elevation
function straightSegment(
  from: LatLng,
  to: LatLng,
): { coords: ElevPoint[]; distKm: number; gain: number; loss: number } {
  return {
    coords: [
      { ...from, ele: 0 },
      { ...to, ele: 0 },
    ],
    distKm: haversineKm(from, to),
    gain: 0,
    loss: 0,
  };
}

// ─── Overpass: pedestrian/cycle path overlay ──────────────────────────────────
const pathCache = new Map<string, Pathway[]>();

function bboxKey(s: number, w: number, n: number, e: number): string {
  return `${s.toFixed(3)}_${w.toFixed(3)}_${n.toFixed(3)}_${e.toFixed(3)}`;
}

async function fetchPathways(
  s: number,
  w: number,
  n: number,
  e: number,
  signal?: AbortSignal,
): Promise<Pathway[]> {
  const key = bboxKey(s, w, n, e);
  const cached = pathCache.get(key);
  if (cached) return cached;

  const query = `[out:json][timeout:20];(way["highway"~"${PATH_HIGHWAY_RE}"](${s},${w},${n},${e}););out geom;`;
  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    const ways: Pathway[] = (data.elements || [])
      .filter((el: any) => el.type === 'way' && Array.isArray(el.geometry))
      .map((el: any): Pathway => {
        const hw = el.tags?.highway as string;
        const category: Pathway['category'] =
          hw === 'cycleway' ? 'bike' : hw === 'track' ? 'mixed' : 'foot';
        return {
          id: el.id,
          coords: el.geometry.map((g: any) => ({ latitude: g.lat, longitude: g.lon })),
          category,
        };
      });
    pathCache.set(key, ways);
    if (pathCache.size > 30) {
      const firstKey = pathCache.keys().next().value;
      if (firstKey) pathCache.delete(firstKey);
    }
    return ways;
  } catch {
    return [];
  }
}

// ─── Reverse geocoding (for auto-name) ────────────────────────────────────────
const ACT_NAME_SUFFIX: Record<ActivityType, string> = {
  run: 'Koşusu',
  ride: 'Bisikleti',
  walk: 'Yürüyüşü',
};

async function reverseSuggestName(
  coord: LatLng,
  actType: ActivityType,
  signal?: AbortSignal,
): Promise<string | null> {
  const r = await reverseGeocode(coord.latitude, coord.longitude, signal);
  if (!r) return null;
  return `${r.name} ${ACT_NAME_SUFFIX[actType]}`;
}

// ─── Storage ──────────────────────────────────────────────────────────────────
async function persistRoute(route: GpsRoute) {
  const raw = await AsyncStorage.getItem(ROUTES_KEY);
  const existing: GpsRoute[] = raw ? JSON.parse(raw) : [];
  await AsyncStorage.setItem(ROUTES_KEY, JSON.stringify([route, ...existing]));
}

// ─── Activity Options ────────────────────────────────────────────────────────
const ACT_OPTS: {
  type: ActivityType;
  label: string;
  mci: keyof typeof MaterialCommunityIcons.glyphMap;
  emoji: string;
}[] = [
  { type: 'run', label: 'Koşu', mci: 'run', emoji: '🏃' },
  { type: 'ride', label: 'Bisiklet', mci: 'bike', emoji: '🚴' },
  { type: 'walk', label: 'Yürüyüş', mci: 'walk', emoji: '🚶' },
];

// ─── Search Bar Component ────────────────────────────────────────────────────
// SearchBar removed — now inlined into top bar. See main render.

// ─── Save Modal ───────────────────────────────────────────────────────────────
function SaveModal({
  visible,
  onClose,
  onSave,
  distKm,
  actType,
  gain,
  coords,
  startCoord,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, difficulty: Difficulty, surface: Surface) => void;
  distKm: number;
  actType: ActivityType;
  gain: number;
  coords: LatLng[];
  startCoord: LatLng | null;
}) {
  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>(autoDifficulty(distKm, gain));
  const [surface, setSurface] = useState<Surface>('Karma');
  const slideY = useRef(new Animated.Value(500)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const previewMapRef = useRef<MapboxRouteViewRef>(null);

  // Auto-suggest name when modal opens (only if user hasn't typed)
  useEffect(() => {
    if (!visible || !startCoord || nameTouched) return;
    const ctl = new AbortController();
    reverseSuggestName(startCoord, actType, ctl.signal).then((suggestion) => {
      if (suggestion && !nameTouched) setName(suggestion);
    });
    return () => ctl.abort();
  }, [visible, startCoord, actType]);

  // Fit preview map to route after modal animates in
  useEffect(() => {
    if (visible && coords.length >= 2) {
      setTimeout(() => previewMapRef.current?.fitToCoords(coords, 40), 600);
    }
  }, [visible, coords]);

  useEffect(() => {
    if (visible) {
      setDifficulty(autoDifficulty(distKm, gain));
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
          easing: EASE_SPRING,
        }),
        Animated.timing(slideY, {
          toValue: 0,
          duration: 520,
          useNativeDriver: true,
          easing: EASE_SPRING,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
          easing: EASE_CLOSE,
        }),
        Animated.timing(slideY, {
          toValue: 500,
          duration: 320,
          useNativeDriver: true,
          easing: EASE_CLOSE,
        }),
      ]).start();
    }
  }, [visible]);

  const canSave = name.trim().length > 0;
  const DIFF_OPTS: Difficulty[] = ['Kolay', 'Orta', 'Zor'];
  const SURF_OPTS: Surface[] = ['Asfalt', 'Patika', 'Karma'];
  const diffColor: Record<Difficulty, string> = {
    Kolay: '#30D158',
    Orta: '#FF9500',
    Zor: '#FF3B30',
  };

  return (
    <Animated.View style={[s.modalBg, { opacity }]} pointerEvents={visible ? 'auto' : 'none'}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.modalKAV}
      >
        <Animated.View style={[s.modalSheet, { transform: [{ translateY: slideY }] }]}>
          <View style={s.modalHandle} />

          {/* Hero: mini map preview */}
          <View style={s.previewMap}>
            <MapboxRouteView
              ref={previewMapRef}
              style={StyleSheet.absoluteFill}
              styleKey="standard"
              initialCenter={startCoord ?? { latitude: 41.0082, longitude: 28.9784 }}
              initialZoom={13}
              initialPitch={40}
              routeCoords={coords.length >= 2 ? coords : undefined}
              showStartEnd={coords.length >= 2}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              attributionEnabled={false}
              logoEnabled={false}
            />
            {/* Stats overlay */}
            <View style={s.previewStatsOv}>
              <View style={s.previewStat}>
                <Text style={s.previewStatVal}>{formatDist(distKm)}</Text>
                <Text style={s.previewStatLbl}>MESAFE</Text>
              </View>
              <View style={s.previewStat}>
                <Text style={s.previewStatVal}>↑{Math.round(gain)}m</Text>
                <Text style={s.previewStatLbl}>TIRMANIŞ</Text>
              </View>
              <View style={s.previewStat}>
                <Text style={s.previewStatVal}>
                  {ACT_OPTS.find((a) => a.type === actType)?.label}
                </Text>
                <Text style={s.previewStatLbl}>AKTİVİTE</Text>
              </View>
            </View>
          </View>

          <Text style={s.modalTitle}>Rotayı Kaydet</Text>

          <View style={s.nameInputWrap}>
            <TextInput
              style={s.nameInput}
              placeholder="Rota adı..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={name}
              onChangeText={(t) => {
                setName(t);
                setNameTouched(true);
              }}
              maxLength={50}
              returnKeyType="done"
              selectionColor={ACCENT}
            />
            {!nameTouched && name.length > 0 && (
              <View style={s.suggestPill}>
                <Ionicons name="sparkles" size={11} color={ACCENT} />
                <Text style={s.suggestTxt}>Öneri</Text>
              </View>
            )}
          </View>

          <Text style={s.sectionLbl}>Zorluk</Text>
          <View style={s.chipRow}>
            {DIFF_OPTS.map((d) => (
              <Pressable
                key={d}
                style={[
                  s.optChip,
                  difficulty === d && {
                    backgroundColor: `${diffColor[d]}22`,
                    borderColor: `${diffColor[d]}66`,
                  },
                ]}
                onPress={() => setDifficulty(d)}
              >
                <Text
                  style={[
                    s.optChipTxt,
                    difficulty === d && { color: diffColor[d], fontWeight: '700' },
                  ]}
                >
                  {d}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.sectionLbl}>Zemin</Text>
          <View style={s.chipRow}>
            {SURF_OPTS.map((sf) => (
              <Pressable
                key={sf}
                style={[
                  s.optChip,
                  surface === sf && { backgroundColor: `${ACCENT}22`, borderColor: `${ACCENT}66` },
                ]}
                onPress={() => setSurface(sf)}
              >
                <Text
                  style={[s.optChipTxt, surface === sf && { color: ACCENT, fontWeight: '700' }]}
                >
                  {sf}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[s.saveBtn, !canSave && { opacity: 0.4 }]}
            disabled={!canSave}
            onPress={() => onSave(name.trim(), difficulty, surface)}
          >
            <Text style={s.saveBtnTxt}>Rotayı Kaydet</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RotaOlustur() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapboxRouteViewRef>(null);

  // History stack of segments
  const [segments, setSegments] = useState<Segment[]>([]);
  const [start, setStart] = useState<LatLng | null>(null);
  const [redoStack, setRedoStack] = useState<{ segments: Segment[]; start: LatLng | null }[]>([]);

  const [actType, setActType] = useState<ActivityType>('run');
  const [snapToPath, setSnapToPath] = useState(true);
  const [mapType, setMapType] = useState<MapType>('standard');
  const [headingFollow, setHeadingFollow] = useState(false);
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [routing, setRouting] = useState(false);
  const [modalVis, setModalVis] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pathOverlay, setPathOverlay] = useState(true);
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [pathLoading, setPathLoading] = useState(false);
  const [region, setRegion] = useState<Region | null>(null);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [locWaiting, setLocWaiting] = useState(true);
  const headingSubRef = useRef<Location.LocationSubscription | null>(null);
  const locSubRef = useRef<Location.LocationSubscription | null>(null);
  const routingAbort = useRef<AbortController | null>(null);
  const overpassAbort = useRef<AbortController | null>(null);
  const overpassTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pulsePhase, setPulsePhase] = useState(0); // 0..3, smooth steps

  // Search state (lifted into main component for top-bar integration)
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchBusy, setSearchBusy] = useState(false);
  const searchAbort = useRef<AbortController | null>(null);

  // Animations
  const bottomSlide = useRef(new Animated.Value(160)).current;
  const topSlide = useRef(new Animated.Value(-100)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const finishScale = useRef(new Animated.Value(1)).current;
  const segIndicator = useRef(new Animated.Value(0)).current;
  const [segWidth, setSegWidth] = useState(0);

  // Animated stat counters
  const distAnim = useRef(new Animated.Value(0)).current;
  const gainAnim = useRef(new Animated.Value(0)).current;
  const [shownDistM, setShownDistM] = useState(0);
  const [shownGain, setShownGain] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(17.2);
  const lastCenterRef = useRef<LatLng | null>(null);

  // Hint pill animation (fade in on mount, fade out on first waypoint)
  const hintOp = useRef(new Animated.Value(0)).current;
  const hintScale = useRef(new Animated.Value(0.92)).current;

  // Entrance
  useEffect(() => {
    Animated.parallel([
      Animated.timing(topSlide, {
        toValue: 0,
        duration: 480,
        useNativeDriver: true,
        easing: EASE_SPRING,
      }),
      Animated.timing(bottomSlide, {
        toValue: 0,
        duration: 520,
        useNativeDriver: true,
        easing: EASE_SPRING,
      }),
    ]).start();
  }, []);

  // Get user location BEFORE rendering map — center map on user
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Permission denied — fall back to default
          setInitialRegion({
            latitude: 41.0082,
            longitude: 28.9784,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          });
          setLocWaiting(false);
          return;
        }

        // Try last known first (instant), use as initial region if available
        const last = await Location.getLastKnownPositionAsync().catch(() => null);
        if (last) {
          const ll = { latitude: last.coords.latitude, longitude: last.coords.longitude };
          setUserLoc(ll);
          setInitialRegion({ ...ll, latitudeDelta: 0.012, longitudeDelta: 0.012 });
          setLocWaiting(false);
        }

        // Fresh GPS in parallel — refine if we got something better (high accuracy for routing)
        const fresh = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        const ll = { latitude: fresh.coords.latitude, longitude: fresh.coords.longitude };
        setUserLoc(ll);
        if (!last) {
          setInitialRegion({ ...ll, latitudeDelta: 0.012, longitudeDelta: 0.012 });
          setLocWaiting(false);
        } else {
          mapRef.current?.flyTo(ll, 17.2, 500);
        }

        // Live tracking — keep userLoc fresh as user moves
        locSubRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 2,
          },
          (pos) => {
            setUserLoc({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          },
        );
      } catch {
        setInitialRegion({
          latitude: 41.0082,
          longitude: 28.9784,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        });
        setLocWaiting(false);
      }
    })();
    return () => {
      headingSubRef.current?.remove();
      locSubRef.current?.remove();
    };
  }, []);

  // Hint pill: fade in after map shows, fade out when first waypoint added
  useEffect(() => {
    if (initialRegion && !start) {
      Animated.parallel([
        Animated.timing(hintOp, {
          toValue: 1,
          duration: 480,
          useNativeDriver: true,
          easing: EASE_SPRING,
          delay: 360,
        }),
        Animated.timing(hintScale, {
          toValue: 1,
          duration: 520,
          useNativeDriver: true,
          easing: EASE_SPRING,
          delay: 360,
        }),
      ]).start();
    } else if (start) {
      Animated.parallel([
        Animated.timing(hintOp, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
          easing: EASE_CLOSE,
        }),
        Animated.timing(hintScale, {
          toValue: 0.92,
          duration: 280,
          useNativeDriver: true,
          easing: EASE_CLOSE,
        }),
      ]).start();
    }
  }, [initialRegion, start]);

  // Listeners for animated counters
  useEffect(() => {
    const id1 = distAnim.addListener(({ value }) => setShownDistM(value));
    const id2 = gainAnim.addListener(({ value }) => setShownGain(value));
    return () => {
      distAnim.removeListener(id1);
      gainAnim.removeListener(id2);
    };
  }, []);

  // Drive distance animation
  useEffect(() => {
    Animated.timing(distAnim, {
      toValue: distKm * 1000,
      duration: 1100,
      useNativeDriver: false,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    }).start();
  }, [distKm]);

  // Drive gain animation
  useEffect(() => {
    Animated.timing(gainAnim, {
      toValue: gain,
      duration: 1100,
      useNativeDriver: false,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    }).start();
  }, [gain]);

  // Animate segmented indicator
  useEffect(() => {
    const idx = ACT_OPTS.findIndex((a) => a.type === actType);
    Animated.spring(segIndicator, {
      toValue: idx,
      useNativeDriver: true,
      tension: 220,
      friction: 22,
    }).start();
  }, [actType]);

  // Search debounce
  useEffect(() => {
    if (searchQ.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    searchAbort.current?.abort();
    const ctl = new AbortController();
    searchAbort.current = ctl;
    const t = setTimeout(async () => {
      setSearchBusy(true);
      const r = await searchPlacesHybrid(searchQ, userLoc ?? undefined, ctl.signal);
      if (!ctl.signal.aborted) {
        setSearchResults(r);
        setSearchBusy(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [searchQ]);

  const onSearchSelect = useCallback((r: SearchResult) => {
    const lat = parseFloat(r.lat),
      lon = parseFloat(r.lon);
    mapRef.current?.flyTo({ latitude: lat, longitude: lon }, 15, 500);
    setSearchQ('');
    setSearchResults([]);
    setSearchFocused(false);
    Keyboard.dismiss();
  }, []);

  // Pulsing fade for path overlay — 4-step cycle, low render cost
  useEffect(() => {
    if (!pathOverlay) return;
    const id = setInterval(() => {
      setPulsePhase((p) => (p + 1) % 4);
    }, 700);
    return () => clearInterval(id);
  }, [pathOverlay]);

  // Heading follow
  useEffect(() => {
    if (!headingFollow) {
      headingSubRef.current?.remove();
      headingSubRef.current = null;
      mapRef.current?.setHeading(0, 320);
      return;
    }
    let cancelled = false;
    (async () => {
      const sub = await Location.watchHeadingAsync((h) => {
        if (cancelled) return;
        const heading = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
        mapRef.current?.setHeading(heading, 100);
      });
      headingSubRef.current = sub;
    })();
    return () => {
      cancelled = true;
      headingSubRef.current?.remove();
    };
  }, [headingFollow]);

  // Derived
  const allCoords: LatLng[] = useMemo(() => {
    if (!start) return [];
    const out: LatLng[] = [start];
    for (const s of segments) {
      for (let i = 1; i < s.coords.length; i++) out.push(s.coords[i]);
    }
    return out;
  }, [start, segments]);

  const elevProfile: number[] = useMemo(() => {
    if (!start) return [];
    const out: number[] = [];
    for (const s of segments) {
      for (let i = 1; i < s.coords.length; i++) out.push(s.coords[i].ele);
    }
    return out;
  }, [start, segments]);

  const waypoints: LatLng[] = useMemo(() => {
    if (!start) return [];
    return [start, ...segments.map((s) => s.to)];
  }, [start, segments]);

  const distKm = useMemo(() => segments.reduce((a, s) => a + s.distKm, 0), [segments]);
  const gain = useMemo(() => segments.reduce((a, s) => a + s.gain, 0), [segments]);
  const loss = useMemo(() => segments.reduce((a, s) => a + s.loss, 0), [segments]);

  const kmMarkers = useMemo(() => computeKmMarkers(allCoords), [allCoords]);

  const filteredPathways = useMemo(() => {
    return pathways.filter((pw) => {
      if (actType === 'walk') return pw.category === 'foot' || pw.category === 'mixed';
      if (actType === 'ride') return pw.category === 'bike' || pw.category === 'mixed';
      return true; // run: hepsi
    });
  }, [pathways, actType]);

  // Add a waypoint
  const addWaypoint = useCallback(
    async (coord: LatLng) => {
      if (!start) {
        setStart(coord);
        setRedoStack([]);
        return;
      }
      const lastWp = segments.length ? segments[segments.length - 1].to : start;

      routingAbort.current?.abort();
      const ctl = new AbortController();
      routingAbort.current = ctl;
      setRouting(true);

      try {
        let seg: Segment;
        if (snapToPath) {
          const r = await fetchSnappedRoute(lastWp, coord, BROUTER_PROFILE[actType], ctl.signal);
          if (ctl.signal.aborted) return; // newer request will replace
          if (r) {
            seg = { to: coord, coords: r.coords, distKm: r.distKm, gain: r.gain, loss: r.loss };
          } else {
            // BRouter failed/timed out — straight line fallback
            const fb = straightSegment(lastWp, coord);
            seg = { to: coord, ...fb };
          }
        } else {
          const fb = straightSegment(lastWp, coord);
          seg = { to: coord, ...fb };
        }
        setSegments((prev) => [...prev, seg]);
        setRedoStack([]);
      } finally {
        // Only reset routing flag if THIS request is still the active one
        if (routingAbort.current === ctl) setRouting(false);
      }
    },
    [start, segments, snapToPath, actType],
  );

  const handleMapPressLatLng = useCallback(
    (c: LatLng) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      addWaypoint(c);
    },
    [addWaypoint],
  );

  // Region change → fetch pathways for visible bbox
  const handleRegionChange = useCallback(
    (r: Region) => {
      setRegion(r);
      if (!pathOverlay) return;
      if (r.latitudeDelta > 0.04) {
        // too zoomed out — skip
        setPathways([]);
        return;
      }
      if (overpassTimer.current) clearTimeout(overpassTimer.current);
      overpassTimer.current = setTimeout(async () => {
        overpassAbort.current?.abort();
        const ctl = new AbortController();
        overpassAbort.current = ctl;
        setPathLoading(true);
        const s = r.latitude - r.latitudeDelta / 2;
        const n = r.latitude + r.latitudeDelta / 2;
        const w = r.longitude - r.longitudeDelta / 2;
        const e = r.longitude + r.longitudeDelta / 2;
        const ways = await fetchPathways(s, w, n, e, ctl.signal);
        if (!ctl.signal.aborted) {
          setPathways(ways);
          setPathLoading(false);
        }
      }, 600);
    },
    [pathOverlay],
  );

  // Toggle path overlay
  const togglePathOverlay = useCallback(() => {
    setPathOverlay((v) => {
      const next = !v;
      if (!next) setPathways([]);
      else if (region) handleRegionChange(region);
      return next;
    });
  }, [region, handleRegionChange]);

  const handleUndo = useCallback(() => {
    if (segments.length === 0 && start) {
      setRedoStack((r) => [{ segments: [], start }, ...r]);
      setStart(null);
      return;
    }
    if (segments.length === 0) return;
    const last = segments[segments.length - 1];
    setRedoStack((r) => [{ segments: [last], start: null }, ...r]);
    setSegments((prev) => prev.slice(0, -1));
  }, [segments, start]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const [next, ...rest] = redoStack;
    if (next.start) setStart(next.start);
    if (next.segments.length) setSegments((prev) => [...prev, ...next.segments]);
    setRedoStack(rest);
  }, [redoStack]);

  const handleClear = useCallback(() => {
    if (!start && segments.length === 0) return;
    Alert.alert('Rotayı temizle', 'Tüm noktalar silinecek.', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Temizle',
        style: 'destructive',
        onPress: () => {
          setSegments([]);
          setStart(null);
          setRedoStack([]);
        },
      },
    ]);
  }, [start, segments]);

  // Reverse the route
  const handleReverse = useCallback(() => {
    if (!start || segments.length === 0) return;
    const newStart = segments[segments.length - 1].to;
    const reversed: Segment[] = [];
    let prevTo: LatLng = newStart;
    for (let i = segments.length - 1; i >= 0; i--) {
      const orig = segments[i];
      const to = i === 0 ? start : segments[i - 1].to;
      reversed.push({
        to,
        coords: [...orig.coords].reverse(),
        distKm: orig.distKm,
        gain: orig.loss,
        loss: orig.gain,
      });
      prevTo = to;
    }
    setStart(newStart);
    setSegments(reversed);
    setRedoStack([]);
  }, [start, segments]);

  // Out-and-back: append reversed to current
  const handleOutAndBack = useCallback(() => {
    if (!start || segments.length === 0) return;
    const reversed: Segment[] = [];
    for (let i = segments.length - 1; i >= 0; i--) {
      const orig = segments[i];
      const to = i === 0 ? start : segments[i - 1].to;
      reversed.push({
        to,
        coords: [...orig.coords].reverse(),
        distKm: orig.distKm,
        gain: orig.loss,
        loss: orig.gain,
      });
    }
    setSegments((prev) => [...prev, ...reversed]);
    setRedoStack([]);
  }, [start, segments]);

  // Close loop: add segment from end back to start
  const handleCloseLoop = useCallback(async () => {
    if (!start || segments.length === 0) return;
    const lastWp = segments[segments.length - 1].to;
    if (haversineKm(lastWp, start) < 0.02) return;
    setRouting(true);
    let seg: Segment;
    if (snapToPath) {
      const r = await fetchSnappedRoute(lastWp, start, BROUTER_PROFILE[actType]);
      seg = r
        ? { to: start, coords: r.coords, distKm: r.distKm, gain: r.gain, loss: r.loss }
        : { to: start, ...straightSegment(lastWp, start) };
    } else {
      seg = { to: start, ...straightSegment(lastWp, start) };
    }
    setSegments((prev) => [...prev, seg]);
    setRedoStack([]);
    setRouting(false);
  }, [start, segments, snapToPath, actType]);

  // Drag waypoint — reroute adjacent segments
  const handleWaypointDrag = useCallback(
    async (idx: number, coord: LatLng) => {
      setRouting(true);
      if (idx === 0) {
        setStart(coord);
        if (segments.length > 0) {
          const next = segments[0].to;
          const r = snapToPath
            ? await fetchSnappedRoute(coord, next, BROUTER_PROFILE[actType])
            : null;
          const newSeg = r
            ? { to: next, coords: r.coords, distKm: r.distKm, gain: r.gain, loss: r.loss }
            : { to: next, ...straightSegment(coord, next) };
          setSegments((prev) => [newSeg, ...prev.slice(1)]);
        }
      } else {
        const segIdx = idx - 1;
        const prevWp = segIdx === 0 ? (start as LatLng) : segments[segIdx - 1].to;
        const r1 = snapToPath
          ? await fetchSnappedRoute(prevWp, coord, BROUTER_PROFILE[actType])
          : null;
        const newSeg1 = r1
          ? { to: coord, coords: r1.coords, distKm: r1.distKm, gain: r1.gain, loss: r1.loss }
          : { to: coord, ...straightSegment(prevWp, coord) };

        const next = segments[segIdx + 1];
        let newSeg2: Segment | null = null;
        if (next) {
          const r2 = snapToPath
            ? await fetchSnappedRoute(coord, next.to, BROUTER_PROFILE[actType])
            : null;
          newSeg2 = r2
            ? { to: next.to, coords: r2.coords, distKm: r2.distKm, gain: r2.gain, loss: r2.loss }
            : { to: next.to, ...straightSegment(coord, next.to) };
        }
        setSegments((prev) => {
          const out = [...prev];
          out[segIdx] = newSeg1;
          if (newSeg2) out[segIdx + 1] = newSeg2;
          return out;
        });
      }
      setRouting(false);
    },
    [segments, start, snapToPath, actType],
  );

  const handleFinish = useCallback(() => {
    if (waypoints.length < 2) {
      Alert.alert('Yetersiz nokta', 'En az 2 nokta gerekli.');
      return;
    }
    Animated.sequence([
      Animated.timing(finishScale, {
        toValue: 0.93,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
      Animated.timing(finishScale, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
        easing: EASE_SPRING,
      }),
    ]).start();
    setModalVis(true);
  }, [waypoints.length]);

  const handleSave = useCallback(
    async (name: string, difficulty: Difficulty, surface: Surface) => {
      setSaving(true);
      setModalVis(false);
      try {
        const route: GpsRoute = {
          id: Date.now().toString(),
          name,
          activityType: actType,
          distanceKm: Math.round(distKm * 100) / 100,
          elevationGain: Math.round(gain),
          elevationLoss: Math.round(loss),
          durationSec: estimateDuration(distKm, actType, gain),
          difficulty,
          surface,
          coordinates: allCoords.map((c) => ({ latitude: c.latitude, longitude: c.longitude })),
          elevationProfile: elevProfile,
          waypoints,
          createdAt: new Date().toISOString(),
        };
        await persistRoute(route);
        router.back();
      } catch {
        setSaving(false);
        Alert.alert('Hata', 'Rota kaydedilemedi.');
      }
    },
    [actType, distKm, gain, loss, allCoords, elevProfile, waypoints, router],
  );

  const goToMyLocation = useCallback(async () => {
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
        easing: EASE_SPRING,
      }),
    ]).start();
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      const ll = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLoc(ll);
      mapRef.current?.flyTo(ll, 16, 500);
    } catch {
      Alert.alert('Konum', 'Konum alınamadı. İzin verdiğinden emin ol.');
    }
  }, []);

  const openMapTypeSheet = useCallback(() => {
    const labels: Record<typeof mapType, string> = {
      standard: 'Standart',
      satellite: 'Uydu',
      hybrid: 'Hibrit',
    };
    const opts: { key: typeof mapType; label: string; sub: string }[] = [
      { key: 'standard', label: 'Standart', sub: 'Sokak haritası, açık tema' },
      { key: 'satellite', label: 'Uydu', sub: 'Gerçek uydu görüntüsü' },
      { key: 'hybrid', label: 'Hibrit', sub: 'Uydu + sokak isimleri' },
    ];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: 'Harita Stili',
        message: `Şu an: ${labels[mapType]}`,
        options: [...opts.map((o) => `${o.label}  —  ${o.sub}`), 'İptal'],
        cancelButtonIndex: opts.length,
        userInterfaceStyle: 'dark',
      },
      (i) => {
        if (i === undefined || i === opts.length) return;
        Haptics.selectionAsync().catch(() => {});
        setMapType(opts[i]!.key);
      },
    );
  }, [mapType]);

  const openMenu = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    const mapTypeLabel =
      mapType === 'standard' ? 'Standart' : mapType === 'satellite' ? 'Uydu' : 'Hibrit';
    const items: { label: string; onPress: () => void; destructive?: boolean }[] = [
      {
        label: `Harita Stili  ›  ${mapTypeLabel}`,
        onPress: () => setTimeout(openMapTypeSheet, 350),
      },
      {
        label: `Yol Vurgusu  ·  ${pathOverlay ? 'Açık' : 'Kapalı'}`,
        onPress: togglePathOverlay,
      },
      {
        label: `Pusula Takibi  ·  ${headingFollow ? 'Açık' : 'Kapalı'}`,
        onPress: () => setHeadingFollow((v) => !v),
      },
      {
        label: `Yola Otur  ·  ${snapToPath ? 'Açık' : 'Kapalı'}`,
        onPress: () => setSnapToPath((v) => !v),
      },
      { label: 'Rotayı Temizle', onPress: handleClear, destructive: true },
    ];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: 'Seçenekler',
        message: 'Harita ve rota tercihleri',
        options: [...items.map((it) => it.label), 'İptal'],
        destructiveButtonIndex: items.findIndex((it) => it.destructive),
        cancelButtonIndex: items.length,
        userInterfaceStyle: 'dark',
      },
      (i) => {
        if (i === undefined || i === items.length) return;
        Haptics.selectionAsync().catch(() => {});
        items[i]?.onPress();
      },
    );
  }, [
    handleClear,
    snapToPath,
    pathOverlay,
    togglePathOverlay,
    mapType,
    headingFollow,
    openMapTypeSheet,
  ]);

  const fitToRoute = useCallback(() => {
    if (allCoords.length < 2) return;
    mapRef.current?.fitToCoords(allCoords, 60);
  }, [allCoords]);

  // Auto-fit when route grows
  useEffect(() => {
    if (allCoords.length >= 2 && !headingFollow) {
      const t = setTimeout(fitToRoute, 200);
      return () => clearTimeout(t);
    }
  }, [allCoords.length]);

  const canFinish = waypoints.length >= 2;

  // Loading splash before map is ready
  if (!initialRegion) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={ACCENT} size="large" />
        <Text style={s.locWaitTxt}>Konumun bulunuyor...</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <MapboxRouteView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        styleKey={
          mapType === 'satellite' ? 'satellite' : mapType === 'hybrid' ? 'hybrid' : 'standard'
        }
        initialCenter={initialRegion}
        initialZoom={17.2}
        initialPitch={50}
        routeCoords={allCoords}
        waypoints={waypoints}
        showStartEnd={false}
        draggableWaypoints
        kmMarkers={kmMarkers}
        pathways={pathOverlay ? filteredPathways : undefined}
        pathOverlayOpacity={PULSE_ALPHAS[pulsePhase % 4] + (mapType !== 'standard' ? 0.2 : 0)}
        showsUserLocation
        onPress={handleMapPressLatLng}
        onWaypointDragEnd={(idx, c) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          handleWaypointDrag(idx, c);
        }}
        onCameraChanged={(c) => {
          setCurrentZoom(c.zoom);
          lastCenterRef.current = { latitude: c.center.latitude, longitude: c.center.longitude };
          const delta = 360 / Math.pow(2, c.zoom);
          handleRegionChange({
            latitude: c.center.latitude,
            longitude: c.center.longitude,
            latitudeDelta: delta,
            longitudeDelta: delta,
          });
        }}
      />

      {/* Top bar with blur — integrated search */}
      <Animated.View style={[s.topBarWrap, { transform: [{ translateY: topSlide }] }]}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
          <View style={s.topRowIntegrated}>
            <Pressable style={s.iconBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>

            {/* Inline search */}
            <View style={[s.searchInline, searchFocused && s.searchInlineFocused]}>
              <Ionicons
                name="search"
                size={15}
                color={searchFocused ? ACCENT : 'rgba(255,255,255,0.55)'}
              />
              <TextInput
                style={s.searchInput}
                placeholder="Yer ara..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={searchQ}
                onChangeText={setSearchQ}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                selectionColor={ACCENT}
                returnKeyType="search"
              />
              {searchBusy && <ActivityIndicator size="small" color={ACCENT} />}
              {searchQ.length > 0 && !searchBusy && (
                <Pressable
                  onPress={() => {
                    setSearchQ('');
                    setSearchResults([]);
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.5)" />
                </Pressable>
              )}
            </View>

            <Pressable style={s.iconBtn} onPress={openMenu}>
              <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Segmented control */}
          <View style={s.segWrap} onLayout={(e) => setSegWidth(e.nativeEvent.layout.width)}>
            {segWidth > 0 && (
              <Animated.View
                style={[
                  s.segIndicator,
                  {
                    width: (segWidth - 6) / 3,
                    transform: [
                      {
                        translateX: segIndicator.interpolate({
                          inputRange: [0, 2],
                          outputRange: [0, ((segWidth - 6) / 3) * 2],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}
            {ACT_OPTS.map(({ type, label, mci }) => {
              const active = actType === type;
              return (
                <Pressable
                  key={type}
                  style={s.segItem}
                  onPress={() => {
                    if (active) return;
                    Haptics.selectionAsync().catch(() => {});
                    setActType(type);
                  }}
                >
                  <MaterialCommunityIcons
                    name={mci}
                    size={16}
                    color={active ? '#fff' : 'rgba(255,255,255,0.6)'}
                  />
                  <Text style={[s.segItemTxt, active && s.segItemTxtActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Animated.View>

      {/* Search results dropdown — floating below top bar */}
      {searchFocused && searchResults.length > 0 && (
        <View style={[s.searchDropdown, { top: insets.top + 116 }]}>
          {searchResults.map((r, i) => (
            <Pressable
              key={i}
              style={[
                s.searchItem,
                i > 0 && { borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.06)' },
              ]}
              onPress={() => onSearchSelect(r)}
            >
              <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={s.searchItemTxt} numberOfLines={2}>
                {r.display_name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Hint pill — floating center when no waypoints */}
      {!start && (
        <Animated.View
          pointerEvents="none"
          style={[
            s.hintPill,
            {
              opacity: hintOp,
              transform: [{ scale: hintScale }],
            },
          ]}
        >
          <Ionicons name="hand-left" size={16} color={ACCENT} />
          <Text style={s.hintTitle}>Haritaya dokun</Text>
          <Text style={s.hintSub}>Başlangıç noktanı ekle</Text>
        </Animated.View>
      )}

      {/* Right side controls — locate + fit + zoom +/- */}
      <View style={[s.rightControls, { top: insets.top + 130 }]}>
        <Animated.View style={{ transform: [{ scale: fabScale }] }}>
          <Pressable style={s.ctrlBtn} onPress={goToMyLocation}>
            <Ionicons name="locate" size={19} color={ACCENT} />
          </Pressable>
        </Animated.View>
        {allCoords.length >= 2 && (
          <Pressable style={s.ctrlBtn} onPress={fitToRoute}>
            <Ionicons name="scan" size={18} color="#fff" />
          </Pressable>
        )}
        <View style={s.zoomGroup}>
          <Pressable
            style={s.zoomBtn}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              const c = lastCenterRef.current ?? userLoc;
              if (!c) return;
              const z = Math.min(21, currentZoom + 1);
              mapRef.current?.flyTo(c, z, 280);
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
          <View style={s.zoomDiv} />
          <Pressable
            style={s.zoomBtn}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              const c = lastCenterRef.current ?? userLoc;
              if (!c) return;
              const z = Math.max(3, currentZoom - 1);
              mapRef.current?.flyTo(c, z, 280);
            }}
          >
            <Ionicons name="remove" size={20} color="#fff" />
          </Pressable>
        </View>
        {/* Loading indicator when path overlay fetches */}
        {pathOverlay && pathLoading && (
          <View style={s.pathLoadingPill}>
            <ActivityIndicator size="small" color={ACCENT} />
          </View>
        )}
      </View>

      {/* Routing indicator */}
      {routing && (
        <View style={[s.routingPill, { top: insets.top + 130 }]}>
          <ActivityIndicator size="small" color={ACCENT} />
          <Text style={s.routingTxt}>Rota hesaplanıyor...</Text>
        </View>
      )}

      {/* Bottom panel with blur */}
      <Animated.View style={[s.bottomPanelWrap, { transform: [{ translateY: bottomSlide }] }]}>
        <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[s.bottomPanel, { paddingBottom: insets.bottom + 16 }]}>
          {/* Grabber */}
          <View style={s.grabber} />

          <View style={s.statsRow}>
            <View style={s.statItem}>
              {waypoints.length < 2 ? (
                <Text style={s.statVal}>—</Text>
              ) : routing && distKm === 0 ? (
                <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
              ) : shownDistM < 1000 ? (
                <Text style={s.statVal}>
                  {Math.round(shownDistM)}
                  <Text style={s.statUnit}>m</Text>
                </Text>
              ) : (
                <Text style={s.statVal}>
                  {(shownDistM / 1000).toFixed(2)}
                  <Text style={s.statUnit}>km</Text>
                </Text>
              )}
              <Text style={s.statLbl}>MESAFE</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              {waypoints.length < 2 ? (
                <Text style={s.statVal}>—</Text>
              ) : routing && distKm === 0 ? (
                <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
              ) : (
                <Text style={s.statVal}>
                  {Math.round(shownGain)}
                  <Text style={s.statUnit}>m</Text>
                </Text>
              )}
              <Text style={s.statLbl}>TIRMANIŞ</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              {waypoints.length < 2 ? (
                <Text style={s.statVal}>—</Text>
              ) : routing && distKm === 0 ? (
                <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
              ) : (
                <Text style={s.statVal}>
                  {Math.round(estimateDuration(shownDistM / 1000, actType, shownGain) / 60)}
                  <Text style={s.statUnit}>dk</Text>
                </Text>
              )}
              <Text style={s.statLbl}>SÜRE</Text>
            </View>
          </View>

          {/* Inline toolbar — Tersi / Git-Dön / Loop Kapat */}
          {waypoints.length >= 2 && (
            <View style={s.inlineToolbar}>
              <Pressable
                style={s.inlineTool}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  handleReverse();
                }}
              >
                <Ionicons name="swap-horizontal" size={15} color="rgba(255,255,255,0.85)" />
                <Text style={s.inlineToolTxt}>Tersi</Text>
              </Pressable>
              <View style={s.inlineToolDiv} />
              <Pressable
                style={s.inlineTool}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  handleOutAndBack();
                }}
              >
                <Ionicons name="git-compare" size={15} color="rgba(255,255,255,0.85)" />
                <Text style={s.inlineToolTxt}>Git-Dön</Text>
              </Pressable>
              <View style={s.inlineToolDiv} />
              <Pressable
                style={s.inlineTool}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  handleCloseLoop();
                }}
              >
                <Ionicons name="reload" size={14} color="rgba(255,255,255,0.85)" />
                <Text style={s.inlineToolTxt}>Loop</Text>
              </Pressable>
            </View>
          )}

          <View style={s.btnRow}>
            <Pressable
              style={[s.smBtn, segments.length === 0 && !start && { opacity: 0.35 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                handleUndo();
              }}
              disabled={segments.length === 0 && !start}
            >
              <Ionicons name="arrow-undo" size={18} color="#fff" />
            </Pressable>
            <Pressable
              style={[s.smBtn, redoStack.length === 0 && { opacity: 0.35 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                handleRedo();
              }}
              disabled={redoStack.length === 0}
            >
              <Ionicons name="arrow-redo" size={18} color="#fff" />
            </Pressable>

            <Animated.View style={[{ flex: 1 }, { transform: [{ scale: finishScale }] }]}>
              <Pressable
                style={[s.finishBtn, !canFinish && { opacity: 0.4 }]}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
                    () => {},
                  );
                  handleFinish();
                }}
                disabled={!canFinish || saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={s.finishBtnTxt}>Rotayı Tamamla</Text>
                  </>
                )}
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </Animated.View>

      <SaveModal
        visible={modalVis}
        onClose={() => setModalVis(false)}
        onSave={handleSave}
        distKm={distKm}
        actType={actType}
        gain={gain}
        coords={allCoords}
        startCoord={start}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0F' },
  locWaitTxt: { marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },

  // Top bar with blur
  topBarWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    zIndex: 5,
    backgroundColor: 'rgba(10,10,20,0.55)',
  },
  topBar: { paddingHorizontal: 12, paddingBottom: 10 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  topRowIntegrated: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  topTitle: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Inline search (in top bar)
  searchInline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 13,
    paddingHorizontal: 12,
    height: 38,
  },
  searchInlineFocused: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: `${ACCENT}99`,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, padding: 0, height: '100%' },

  // Floating dropdown
  searchDropdown: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15,15,25,0.96)',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  // Segmented control (Strava-style)
  segWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 3,
    height: 40,
    position: 'relative',
  },
  segIndicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    backgroundColor: ACCENT,
    borderRadius: 10,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  segItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: '100%',
  },
  segItemTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: -0.2,
  },
  segItemTxtActive: { color: '#fff', fontWeight: '800' },
  // Search results dropdown items
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchItemTxt: { flex: 1, fontSize: 13, color: '#fff', lineHeight: 18 },

  // Right controls
  rightControls: { position: 'absolute', right: 14, gap: 8, zIndex: 3 },
  ctrlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10,10,20,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  ctrlBtnActive: { backgroundColor: 'rgba(20,20,30,0.96)', borderColor: `${ACCENT}88` },
  zoomGroup: {
    width: 44,
    backgroundColor: 'rgba(10,10,20,0.94)',
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  zoomBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  zoomDiv: { height: 0.5, backgroundColor: 'rgba(255,255,255,0.14)' },
  pathLoadingPill: {
    width: 44,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(10,10,20,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: `${ACCENT}55`,
  },

  // Hint pill (empty state)
  hintPill: {
    position: 'absolute',
    alignSelf: 'center',
    top: '38%',
    backgroundColor: 'rgba(10,10,20,0.92)',
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
    borderWidth: 0.5,
    borderColor: `${ACCENT}55`,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    zIndex: 4,
  },
  hintTitle: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: -0.3, marginTop: 4 },
  hintSub: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.55)' },

  // Routing indicator
  routingPill: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(10,10,20,0.94)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: `${ACCENT}66`,
    zIndex: 6,
  },
  routingTxt: { fontSize: 12, fontWeight: '600', color: '#fff' },

  // Waypoint markers (Strava style: lettered/numbered)
  wpMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  wpMarkerTxt: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },

  // KM markers (Strava style: white pill with orange border)
  kmMarker: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 9,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: ACCENT,
    minWidth: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  kmMarkerTxt: { fontSize: 10.5, fontWeight: '900', color: ACCENT, letterSpacing: -0.2 },

  // Inline toolbar (in bottom panel)
  inlineToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 13,
    paddingVertical: 9,
    marginBottom: 10,
  },
  inlineTool: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  inlineToolTxt: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  inlineToolDiv: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.1)' },

  // Bottom panel with blur
  bottomPanelWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    zIndex: 4,
    backgroundColor: 'rgba(10,10,20,0.6)',
  },
  bottomPanel: { paddingHorizontal: 14, paddingTop: 8 },
  grabber: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.6 },
  statUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: -0.2,
  },
  statLbl: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 4,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 18 },
  btnRow: { flexDirection: 'row', gap: 8 },
  smBtn: {
    width: 50,
    height: 52,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtn: {
    height: 52,
    borderRadius: 15,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
  },
  finishBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },

  // Modal
  modalBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  modalKAV: { width: '100%' },
  modalSheet: {
    backgroundColor: CARD,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.4,
    marginBottom: 12,
  },

  // Preview map (hero)
  previewMap: {
    height: 170,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#1a2a1a',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  previewStatsOv: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(10,10,20,0.78)',
  },
  previewStat: { alignItems: 'center', flex: 1 },
  previewStatVal: { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  previewStatLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // Name input + suggestion pill
  nameInputWrap: { position: 'relative', marginBottom: 18 },
  nameInput: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    paddingRight: 78,
    fontSize: 15,
    color: '#fff',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  suggestPill: {
    position: 'absolute',
    right: 10,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: `${ACCENT}1A`,
    borderWidth: 0.5,
    borderColor: `${ACCENT}55`,
  },
  suggestTxt: { fontSize: 10, fontWeight: '700', color: ACCENT, letterSpacing: 0.2 },
  sectionLbl: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  optChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optChipTxt: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.5)' },
  saveBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  saveBtnTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

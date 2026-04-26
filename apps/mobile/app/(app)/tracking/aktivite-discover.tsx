import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useSession } from '@clerk/expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import { getMainActivityIcon } from '../../../lib/activity-icons';

const ACCENT = '#FF6B35';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const { height: SCREEN_H, width: SW } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
type AiScore = 'green' | 'yellow' | 'red';

interface FitnessExercise {
  id: string;
  name: string;
  nametr: string | null;
  slug: string;
  muscleGroups: string[];
  equipment: string[];
  bodyPart: string | null;
  target: string | null;
  secondaryMuscles: string[];
  gifUrl: string | null;
  fitnessCategory: string | null;
}

interface CatalogItem {
  id: string;
  activityType: string;
  nametr: string;
  nameen: string;
  category: string;
  metValue: number;
  hasDistance: boolean;
  iconName: string;
  color: string;
  subtypes: { key: string; nametr: string }[];
  descriptiontr?: string | null;
  userScore?: {
    score: AiScore;
    aiNote: string;
    benefits: string | null;
    cautions: string | null;
    frequency: string | null;
    bestTime: string | null;
  } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SCORE_CONFIG: Record<
  AiScore,
  { bg: string; border: string; dot: string; label: string; tag: string }
> = {
  green: { bg: '#F0FDF4', border: '#86EFAC', dot: '#22C55E', label: 'Önerilir', tag: '#DCFCE7' },
  yellow: { bg: '#FEFCE8', border: '#FDE047', dot: '#EAB308', label: 'Dikkatli', tag: '#FEF9C3' },
  red: { bg: '#FFF1F2', border: '#FECDD3', dot: '#F43F5E', label: 'Riskli', tag: '#FFE4E6' },
};
const DEFAULT_SCORE_CFG = {
  bg: '#F9F9FB',
  border: '#E5E5EA',
  dot: '#8E8E93',
  label: 'Skorlanıyor',
  tag: '#F2F2F7',
};

const CATEGORY_LABELS: Record<string, string> = {
  cardio: 'Kardiyo',
  water: 'Su Sporları',
  recovery: 'Toparlanma',
  sport: 'Spor',
  mind_body: 'Zihin & Beden',
  other: 'Diğer',
};

// ─── Pexels Video ─────────────────────────────────────────────────────────────
const PEXELS_KEY = 'XGaHQRQrzYDhL6Z2bIDDhAHP8TsSHJshrEFjTwliro96om3mym7joLAg';

const ACTIVITY_SEARCH: Record<string, string> = {
  // Kardiyo
  orbitrek: 'elliptical machine workout',
  elliptical: 'elliptical machine workout',
  jump_rope: 'jump rope exercise',
  stepper: 'stair stepper workout',
  // Yürüyüş
  walking_brisk: 'brisk walking exercise',
  walking_urban: 'urban walking fitness',
  walking_nature: 'nature hiking walk',
  walking_nordic: 'nordic walking poles',
  // Koşu
  running_road: 'road running fitness',
  running_trail: 'trail running outdoors',
  running_treadmill: 'treadmill running gym',
  running_interval: 'interval running sprint',
  running_marathon: 'marathon running race',
  // Bisiklet
  cycling_road: 'road cycling outdoor',
  cycling_mountain: 'mountain biking trail',
  cycling_city: 'city cycling commute',
  cycling_stationary: 'stationary bike gym',
  // Yüzme
  swimming_pool: 'swimming pool laps',
  swimming_laps: 'swimming laps technique',
  swimming_sea: 'open water swimming',
  swimming_therapy: 'water therapy pool',
  // Kürek
  rowing_machine: 'rowing machine gym',
  rowing_boat: 'rowing boat water',
  rowing_canoe: 'canoe kayak paddling',
  // Tenis
  tennis_match: 'tennis match game',
  tennis_doubles: 'tennis doubles match',
  tennis_training: 'tennis training drill',
  // Padel
  padel_match: 'padel tennis match',
  padel_training: 'padel training court',
  // Futbol
  football_match: 'football soccer match',
  football_training: 'football soccer training',
  football_halisaha: 'indoor soccer futsal',
  football_beach: 'beach soccer game',
  // Basketbol
  basketball_match: 'basketball game match',
  basketball_street: 'street basketball game',
  basketball_training: 'basketball training drill',
  // Voleybol
  volleyball_match: 'volleyball match game',
  volleyball_training: 'volleyball training drill',
  volleyball_beach: 'beach volleyball game',
  // Golf
  golf_18holes: 'golf course swing',
  golf_9holes: 'golf course short',
  golf_range: 'golf driving range',
  // Boks
  boxing_bag: 'boxing punching bag',
  boxing_shadow: 'shadow boxing workout',
  boxing_kickbox: 'kickboxing workout',
  boxing_sparring: 'boxing sparring training',
  // Dans
  dance_zumba: 'zumba dance fitness',
  dance_salsa: 'salsa dancing lesson',
  dance_hiphop: 'hip hop dance workout',
  dance_ballet: 'ballet dance training',
  dance_free: 'freestyle dance workout',
  // Yoga
  yoga_hatha: 'hatha yoga practice',
  yoga_vinyasa: 'vinyasa yoga flow',
  yoga_power: 'power yoga workout',
  yoga_yin: 'yin yoga stretch',
  yoga_hot: 'hot yoga studio',
  // Pilates
  pilates_mat: 'pilates mat workout',
  pilates_reformer: 'pilates reformer machine',
  pilates_clinical: 'clinical pilates therapy',
  // Meditasyon
  meditation_breathing: 'meditation breathing mindfulness',
  meditation_mindfulness: 'mindfulness meditation calm',
  meditation_guided: 'guided meditation relax',
  // Esneme
  stretching_static: 'static stretching flexibility',
  stretching_dynamic: 'dynamic stretching warmup',
  stretching_foam: 'foam roller stretching',
  // Yüzme / Su
  waterpolo_match: 'water polo match game',
  waterpolo_training: 'water polo training',
  // Hiking
  hiking_easy: 'easy hiking trail nature',
  hiking_moderate: 'moderate hiking mountain',
  hiking_hard: 'hard mountain climbing hike',
  // Soğuk
  cold_shower: 'cold shower ice water',
  cold_icebath: 'ice bath cold plunge',
  cold_contrast: 'contrast therapy hot cold',
  // Sauna
  sauna_dry: 'dry sauna wellness',
  sauna_steam: 'steam sauna room',
  sauna_infrared: 'infrared sauna health',
  sauna_hamam: 'hammam turkish bath',
  // Masaj
  massage_relax: 'relaxing massage therapy',
  massage_sports: 'sports massage therapy',
  massage_deeptissue: 'deep tissue massage',
};

async function fetchPexelsVideos(
  activityType: string,
  overrideQuery?: string,
): Promise<{ videoUrl: string; thumbUrl: string }[]> {
  const query =
    overrideQuery ?? ACTIVITY_SEARCH[activityType] ?? activityType.replace(/_/g, ' ') + ' exercise';
  try {
    const res = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=8&size=medium`,
      { headers: { Authorization: PEXELS_KEY } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    const videos: any[] = json.videos ?? [];
    const results: { videoUrl: string; thumbUrl: string }[] = [];
    for (const v of videos) {
      const files: any[] = v.video_files ?? [];
      const hd =
        files.find((f) => f.quality === 'hd' && f.file_type === 'video/mp4') ??
        files.find((f) => f.file_type === 'video/mp4');
      if (hd?.link) results.push({ videoUrl: hd.link as string, thumbUrl: v.image as string });
      if (results.length >= 3) break;
    }
    return results;
  } catch {
    return [];
  }
}

const FILTER_TABS = [
  { val: 'all' as const, label: 'Tümü', color: '#FF6B35' },
  { val: 'green' as const, label: 'Önerilir', color: '#30D158' },
  { val: 'yellow' as const, label: 'Dikkatli', color: '#EAB308' },
  { val: 'red' as const, label: 'Riskli', color: '#FF3B30' },
];

const CAT_FILTERS = [
  { val: 'all' as const, label: 'Tümü', color: '#FF6B35' },
  { val: 'fitness' as const, label: 'Fitness', color: '#FF6B35' },
  { val: 'cardio' as const, label: 'Kardiyo', color: '#FF3B30' },
  { val: 'sport' as const, label: 'Spor', color: '#0A84FF' },
  { val: 'water' as const, label: 'Su Sporları', color: '#32ADE6' },
  { val: 'mind_body' as const, label: 'Zihin & Beden', color: '#5E5CE6' },
  { val: 'recovery' as const, label: 'Toparlanma', color: '#30D158' },
];

const FITNESS_SUB_FILTERS = [
  { val: 'all' as const, label: 'Tümü', color: '#FF6B35' },
  { val: 'salonda' as const, label: 'Salonda', color: '#0A84FF' },
  { val: 'evde' as const, label: 'Evde', color: '#30D158' },
  { val: 'outdoor' as const, label: 'Outdoor', color: '#FF9500' },
];
const FIT_CAT_COLORS: Record<string, string> = {
  evde: '#30D158',
  salonda: '#0A84FF',
  outdoor: '#FF9500',
};

// ─── API Hook ─────────────────────────────────────────────────────────────────
function useDiscoverApi() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { session } = useSession();

  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = (await getToken()) ?? null;
      return fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...((options.headers as Record<string, string>) ?? {}),
        },
      });
    },
    [getToken],
  );

  const fetchCatalog = useCallback(
    async (q?: string): Promise<CatalogItem[]> => {
      const params = q ? `?q=${encodeURIComponent(q)}` : '';
      const res = await authFetch(`/api/activities/catalog${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<CatalogItem[]>;
    },
    [authFetch],
  );

  const fetchScores = useCallback(async (): Promise<
    Record<
      string,
      {
        score: AiScore;
        aiNote: string;
        benefits: string | null;
        cautions: string | null;
        frequency: string | null;
        bestTime: string | null;
      }
    >
  > => {
    const res = await authFetch('/api/activities/score-catalog');
    if (!res.ok) return {};
    const data = (await res.json()) as { scores: Record<string, any> };
    return data.scores ?? {};
  }, [authFetch]);

  const triggerScoring = useCallback(async () => {
    // Her zaman POST ile eksik skorları tetikle (backend zaten skorlananları atlar)
    authFetch('/api/activities/score-catalog', { method: 'POST' }).catch(() => null);
    // İlk GET — mevcut skorlar varsa hemen dön
    const cached = await fetchScores().catch(() => ({}));
    if (Object.keys(cached).length > 0) return cached;
    // Yoksa polling ile bekle
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const polled = await fetchScores().catch(() => ({}));
      if (Object.keys(polled).length > 0) return polled;
    }
    return {};
  }, [authFetch, fetchScores]);

  const fetchFitnessExercises = useCallback(
    async (category?: string, q?: string): Promise<FitnessExercise[]> => {
      const params = new URLSearchParams();
      if (category && category !== 'all') params.set('category', category);
      if (q) params.set('q', q);
      const res = await authFetch(`/api/fitness/exercises?${params}`);
      if (!res.ok) return [];
      return res.json() as Promise<FitnessExercise[]>;
    },
    [authFetch],
  );

  return {
    fetchCatalog,
    triggerScoring,
    fetchScores,
    fetchFitnessExercises,
    isLoaded,
    isSignedIn,
    getToken,
  };
}

// ─── Filter Chips (sliding pill) ──────────────────────────────────────────────
function FilterChips<T extends string>({
  tabs,
  filter,
  onSelect,
  onBeforeChange,
}: {
  tabs: { val: T; label: string; color: string }[];
  filter: T;
  onSelect: (v: T) => void;
  onBeforeChange: (cb: () => void) => void;
}) {
  const chipWidth = useRef(0);
  const [chipW, setChipW] = useState(0);
  const pillTx = useRef(new Animated.Value(0)).current;
  const pillOp = useRef(new Animated.Value(0)).current;
  const initialized = useRef(false);
  const activeIdx = tabs.findIndex((t) => t.val === filter);

  const movePill = (idx: number, animate: boolean) => {
    const toValue = idx * chipWidth.current;
    if (!animate) {
      pillTx.setValue(toValue);
      pillOp.setValue(1);
      return;
    }
    Animated.spring(pillTx, { toValue, useNativeDriver: true, tension: 380, friction: 30 }).start();
  };

  const handleSelect = (val: T, idx: number) => {
    if (val === filter) return;
    movePill(idx, true);
    onBeforeChange(() => onSelect(val));
  };

  return (
    <View
      style={sc.chipRow}
      onLayout={(e) => {
        const cw = (e.nativeEvent.layout.width - 4) / tabs.length;
        chipWidth.current = cw;
        if (!initialized.current) {
          initialized.current = true;
          setChipW(cw);
          movePill(activeIdx, false);
        }
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 2,
          bottom: 2,
          left: 2,
          width: chipW > 0 ? chipW : `${100 / tabs.length}%`,
          opacity: pillOp,
          backgroundColor: '#fff',
          borderRadius: 18,
          transform: [{ translateX: pillTx }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.12,
          shadowRadius: 4,
        }}
      />
      {tabs.map(({ val, label, color }, idx) => {
        const active = filter === val;
        return (
          <Pressable key={val} onPress={() => handleSelect(val, idx)} style={{ flex: 1 }}>
            {({ pressed }) => (
              <View style={[sc.chip, { opacity: pressed ? 0.6 : 1 }]}>
                <Text style={[sc.chipTxt, active && { color, fontWeight: '700' }]}>{label}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

function VideoLightbox({
  url,
  index,
  total,
  onPrev,
  onNext,
  onClose,
}: {
  url: string;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const opAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  }, []);

  const close = () => {
    Animated.parallel([
      Animated.timing(opAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
    ]).start(onClose);
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.92)',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: opAnim,
        }}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <Animated.View
          style={{ width: SW, paddingHorizontal: 16, transform: [{ scale: scaleAnim }] }}
        >
          <VideoView
            player={player}
            style={{ width: SW - 32, height: ((SW - 32) * 9) / 16, borderRadius: 20 }}
            contentFit="cover"
            nativeControls={false}
          />
          {/* Ses toggle */}
        </Animated.View>
        {/* Kapat */}
        <Pressable
          onPress={close}
          style={{
            position: 'absolute',
            top: 56,
            right: 20,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>

        {/* İleri / Geri okları */}
        {total > 1 && (
          <>
            <Pressable
              onPress={onPrev}
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                marginTop: -24,
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </Pressable>
            <Pressable
              onPress={onNext}
              style={{
                position: 'absolute',
                right: 16,
                top: '50%',
                marginTop: -24,
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="chevron-forward" size={26} color="#fff" />
            </Pressable>
          </>
        )}

        {/* Alt bilgi + dots */}
        <View style={{ position: 'absolute', bottom: 48, alignItems: 'center', gap: 10 }}>
          {total > 1 && (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {Array.from({ length: total }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === index ? 16 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.3)',
                  }}
                />
              ))}
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="volume-mute" size={14} color="rgba(255,255,255,0.5)" />
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>
              Sessiz · Otomatik oynatılıyor
            </Text>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

function DetailSheet({
  item,
  visible,
  onClose,
}: {
  item: CatalogItem | null;
  visible: boolean;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;
  const [snapshot, setSnapshot] = useState<CatalogItem | null>(null);
  const prevId = useRef<string | null>(null);
  const [videos, setVideos] = useState<{ videoUrl: string; thumbUrl: string }[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{ url: string; index: number } | null>(null);

  useEffect(() => {
    if (visible && item) {
      const isSwap = prevId.current !== null && prevId.current !== item.id;
      prevId.current = item.id;

      const loadVideo = (activityType: string) => {
        setVideos([]);
        setVideoLoading(true);
        fetchPexelsVideos(activityType).then((results) => {
          setVideos(results);
          setVideoLoading(false);
        });
      };

      if (isSwap) {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: SCREEN_H,
            duration: 280,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 1, 1),
          }),
          Animated.timing(opAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]).start(() => {
          setSnapshot(item);
          loadVideo(item.activityType);
          requestAnimationFrame(() =>
            Animated.parallel([
              Animated.timing(slideAnim, {
                toValue: 0,
                duration: 420,
                useNativeDriver: true,
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              Animated.timing(opAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
            ]).start(),
          );
        });
        return;
      }
      setSnapshot(item);
      loadVideo(item.activityType);
      requestAnimationFrame(() =>
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 520,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          Animated.timing(opAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
        ]).start(),
      );
    } else {
      prevId.current = null;
      setActiveVideo(null);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_H,
          duration: 460,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 1, 1),
        }),
        Animated.timing(opAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setSnapshot(null);
      });
    }
  }, [visible, item?.id]);

  if (!snapshot) return null;

  const data = snapshot;
  const score = data.userScore?.score;
  const cfg = score ? SCORE_CONFIG[score] : DEFAULT_SCORE_CFG;
  const icon = getMainActivityIcon(data.activityType);
  const catLbl = CATEGORY_LABELS[data.category] ?? data.category;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: opAnim }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[ds.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={ds.handle} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{ paddingBottom: 12 }}
        >
          {/* Hero */}
          <View style={[ds.hero, { backgroundColor: data.color + '12' }]}>
            <View style={[ds.heroIcon, { backgroundColor: data.color + '20' }]}>
              {icon ? (
                <Image source={icon} style={{ width: 56, height: 56 }} resizeMode="contain" />
              ) : (
                <Ionicons name={data.iconName as any} size={36} color={data.color} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              {score && (
                <View style={[ds.badge, { backgroundColor: cfg.tag }]}>
                  <View style={[ds.dot, { backgroundColor: cfg.dot }]} />
                  <Text style={[ds.badgeTxt, { color: cfg.dot }]}>{cfg.label}</Text>
                </View>
              )}
              <Text style={ds.name}>{data.nametr}</Text>
              <Text style={ds.catTxt}>{catLbl}</Text>
            </View>
          </View>

          {/* Demo Video */}
          <View style={ds.videoSection}>
            <View style={ds.videoSectionHeader}>
              <Ionicons name="play-circle" size={14} color={data.color} />
              <Text style={[ds.videoSectionLabel, { color: data.color }]}>Nasıl Yapılır?</Text>
            </View>
            {videoLoading ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={[
                      ds.videoThumb,
                      {
                        backgroundColor: data.color + '12',
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                    ]}
                  >
                    {i === 0 && <ActivityIndicator size="small" color={data.color} />}
                  </View>
                ))}
              </View>
            ) : videos.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {videos.map((v, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => setActiveVideo({ url: v.videoUrl, index: idx })}
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                  >
                    <View style={ds.videoThumb}>
                      <Image
                        source={{ uri: v.thumbUrl }}
                        style={ds.videoThumbImg}
                        resizeMode="cover"
                      />
                      <View style={ds.videoPlayOverlay}>
                        <View style={[ds.videoPlayBtn, { backgroundColor: data.color }]}>
                          <Ionicons name="play" size={18} color="#fff" />
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View
                style={[
                  ds.videoThumb,
                  {
                    backgroundColor: '#F2F2F7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  },
                ]}
              >
                <Ionicons name="videocam-off-outline" size={22} color="#C7C7CC" />
                <Text style={ds.videoThumbLabel}>Mevcut değil</Text>
              </View>
            )}
          </View>

          {/* Kısa tanım */}
          {data.descriptiontr && <Text style={ds.descTxt}>{data.descriptiontr}</Text>}

          {/* Stat row */}
          <View style={ds.statRow}>
            <View style={ds.statCell}>
              <Ionicons
                name="flame-outline"
                size={18}
                color="#8E8E93"
                style={{ marginBottom: 4 }}
              />
              <Text style={ds.statLabel}>Yoğunluk</Text>
              <Text style={ds.statVal}>{data.metValue}</Text>
            </View>
            <View style={ds.statDivider} />
            <View style={ds.statCell}>
              <Ionicons
                name="location-outline"
                size={18}
                color="#8E8E93"
                style={{ marginBottom: 4 }}
              />
              <Text style={ds.statLabel}>Mesafe</Text>
              <Text style={ds.statVal}>{data.hasDistance ? 'Var' : 'Yok'}</Text>
            </View>
            {data.userScore?.bestTime && (
              <>
                <View style={ds.statDivider} />
                <View style={ds.statCell}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color="#8E8E93"
                    style={{ marginBottom: 4 }}
                  />
                  <Text style={ds.statLabel}>En İyi Zaman</Text>
                  <Text style={ds.statVal}>{data.userScore.bestTime}</Text>
                </View>
              </>
            )}
          </View>

          {/* Faydalar */}
          {data.userScore?.benefits && (
            <View style={ds.section}>
              <View style={ds.sectionHeader}>
                <Ionicons name="flash-outline" size={14} color="#6366F1" />
                <Text style={[ds.sectionLabel, { color: '#6366F1' }]}>Faydaları</Text>
              </View>
              <Text style={ds.sectionTxt}>{data.userScore.benefits}</Text>
            </View>
          )}

          {/* AI Değerlendirmesi */}
          {data.userScore?.aiNote && (
            <View style={[ds.aiBox, { borderColor: cfg.border, backgroundColor: cfg.bg }]}>
              <View style={ds.sectionHeader}>
                <Ionicons name="sparkles" size={14} color={cfg.dot} />
                <Text style={[ds.sectionLabel, { color: cfg.dot }]}>AI Değerlendirmesi</Text>
              </View>
              <Text style={ds.sectionTxt}>{data.userScore.aiNote}</Text>
            </View>
          )}

          {/* Dikkat */}
          {data.userScore?.cautions && (
            <View style={ds.cautionBox}>
              <View style={ds.sectionHeader}>
                <Ionicons name="warning-outline" size={14} color="#F59E0B" />
                <Text style={[ds.sectionLabel, { color: '#F59E0B' }]}>
                  Dikkat Edilmesi Gerekenler
                </Text>
              </View>
              <Text style={ds.sectionTxt}>{data.userScore.cautions}</Text>
            </View>
          )}

          {/* Frekans */}
          {data.userScore?.frequency && (
            <View style={ds.infoRow}>
              <Ionicons name="calendar-outline" size={14} color="#0A84FF" />
              <Text style={ds.infoTxt}>{data.userScore.frequency}</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {activeVideo && (
        <VideoLightbox
          url={activeVideo.url}
          index={activeVideo.index}
          total={videos.length}
          onPrev={() => {
            const i = (activeVideo.index - 1 + videos.length) % videos.length;
            setActiveVideo({ url: videos[i]!.videoUrl, index: i });
          }}
          onNext={() => {
            const i = (activeVideo.index + 1) % videos.length;
            setActiveVideo({ url: videos[i]!.videoUrl, index: i });
          }}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </View>
  );
}

const ds = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34,
    maxHeight: '88%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  badgeTxt: { fontSize: 12, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.4 },
  catTxt: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  statRow: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(60,60,67,0.1)', marginHorizontal: 4 },
  statLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 3,
    textAlign: 'center',
  },
  statVal: { fontSize: 13, color: '#1C1C1E', fontWeight: '700', textAlign: 'center' },
  section: {
    backgroundColor: 'rgba(99,102,241,0.06)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.18)',
  },
  aiBox: { borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1 },
  cautionBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '700' },
  sectionTxt: { fontSize: 14, color: '#3C3C43', lineHeight: 21 },
  descTxt: {
    fontSize: 15,
    color: '#3C3C43',
    lineHeight: 22,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  infoTxt: { flex: 1, fontSize: 13, color: '#636366', lineHeight: 18 },
  subtypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subtypeChip: {
    backgroundColor: 'rgba(99,102,241,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  subtypeTxt: { fontSize: 13, fontWeight: '600', color: '#6366F1' },
  videoSection: { marginBottom: 22 },
  videoSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  videoSectionLabel: { fontSize: 13, fontWeight: '700' },
  videoThumb: { width: 100, height: 100, borderRadius: 14, overflow: 'hidden' },
  videoThumbWide: { width: 160, height: 110, borderRadius: 14, overflow: 'hidden' },
  videoThumbImg: { width: 100, height: 100, borderRadius: 14 },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
  },
  videoPlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  videoThumbLabel: { fontSize: 11, fontWeight: '600', color: '#C7C7CC' },
  videoArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Shared card entry hook ────────────────────────────────────────────────────
function useCardEntry(index: number) {
  const press = useRef(new Animated.Value(1)).current;
  const entryOp = useRef(new Animated.Value(0)).current;
  const entryTy = useRef(new Animated.Value(28)).current;
  const entryS = useRef(new Animated.Value(0.96)).current;
  useEffect(() => {
    const t = setTimeout(
      () =>
        Animated.parallel([
          Animated.timing(entryOp, {
            toValue: 1,
            duration: 340,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          Animated.timing(entryTy, {
            toValue: 0,
            duration: 340,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          Animated.timing(entryS, {
            toValue: 1,
            duration: 340,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        ]).start(),
      Math.min(index, 12) * 40,
    );
    return () => clearTimeout(t);
  }, []);
  const pressIn = () =>
    Animated.timing(press, {
      toValue: 0.96,
      duration: 100,
      useNativeDriver: true,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }).start();
  const pressOut = () =>
    Animated.spring(press, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 12,
    }).start();
  return { press, entryOp, entryTy, entryS, pressIn, pressOut };
}

// ─── Fitness Discover Card ────────────────────────────────────────────────────
function FitnessDiscoverCard({
  item,
  onPress,
  index = 0,
}: {
  item: FitnessExercise;
  onPress: () => void;
  index?: number;
}) {
  const catColor = FIT_CAT_COLORS[item.fitnessCategory ?? ''] ?? ACCENT;
  const { press, entryOp, entryTy, entryS, pressIn, pressOut } = useCardEntry(index);
  const name = item.nametr ?? item.name;
  const muscle = item.muscleGroups[0] ?? item.target ?? item.bodyPart ?? '';

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View
        style={[
          dc.card,
          {
            backgroundColor: '#fff',
            borderColor: '#F2F2F7',
            opacity: entryOp,
            transform: [{ translateY: entryTy }, { scale: entryS }, { scale: press }],
          },
        ]}
      >
        <View style={dc.top}>
          <View style={[dc.iconBox, { overflow: 'hidden', borderRadius: 16 }]}>
            {item.gifUrl ? (
              <Image
                source={{ uri: item.gifUrl }}
                style={{ width: 100, height: 100, borderRadius: 16 }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 16,
                  backgroundColor: catColor + '18',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="barbell-outline" size={40} color={catColor} />
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View style={[dc.badge, { backgroundColor: catColor + '18' }]}>
              <View style={[dc.dot, { backgroundColor: catColor }]} />
              <Text style={[dc.scoreLbl, { color: catColor }]}>
                {FITNESS_SUB_FILTERS.find((f) => f.val === item.fitnessCategory)?.label ??
                  item.fitnessCategory}
              </Text>
            </View>
            <Text style={dc.name}>{name}</Text>
            <Text style={dc.cat}>{muscle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        </View>
        {item.secondaryMuscles?.length > 0 && (
          <View style={dc.aiRow}>
            <Ionicons name="body-outline" size={12} color="#8E8E93" />
            <Text style={dc.aiNote} numberOfLines={1}>
              Yardımcı: {item.secondaryMuscles.join(', ')}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─── Fitness Detail Sheet ─────────────────────────────────────────────────────
function FitnessDetailSheet({
  item,
  visible,
  onClose,
}: {
  item: FitnessExercise | null;
  visible: boolean;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;
  const [snapshot, setSnapshot] = useState<FitnessExercise | null>(null);
  const prevId = useRef<string | null>(null);
  const [videos, setVideos] = useState<{ videoUrl: string; thumbUrl: string }[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{ url: string; index: number } | null>(null);

  useEffect(() => {
    if (visible && item) {
      const isSwap = prevId.current !== null && prevId.current !== item.id;
      prevId.current = item.id;

      const loadVideo = (ex: FitnessExercise) => {
        setVideos([]);
        setVideoLoading(true);
        const query = `${ex.nametr ?? ex.name} exercise tutorial`;
        fetchPexelsVideos(ex.id, query).then((results) => {
          setVideos(results);
          setVideoLoading(false);
        });
      };

      if (isSwap) {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: SCREEN_H,
            duration: 280,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 1, 1),
          }),
          Animated.timing(opAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]).start(() => {
          setSnapshot(item);
          loadVideo(item);
          requestAnimationFrame(() =>
            Animated.parallel([
              Animated.timing(slideAnim, {
                toValue: 0,
                duration: 420,
                useNativeDriver: true,
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              Animated.timing(opAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
            ]).start(),
          );
        });
        return;
      }
      setSnapshot(item);
      loadVideo(item);
      requestAnimationFrame(() =>
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 520,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          Animated.timing(opAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
        ]).start(),
      );
    } else {
      prevId.current = null;
      setActiveVideo(null);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_H,
          duration: 460,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 1, 1),
        }),
        Animated.timing(opAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setSnapshot(null);
      });
    }
  }, [visible, item?.id]);

  if (!snapshot) return null;

  const catColor = FIT_CAT_COLORS[snapshot.fitnessCategory ?? ''] ?? ACCENT;
  const name = snapshot.nametr ?? snapshot.name;
  const catLabel =
    FITNESS_SUB_FILTERS.find((f) => f.val === snapshot.fitnessCategory)?.label ??
    snapshot.fitnessCategory ??
    '';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: opAnim }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[ds.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={ds.handle} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{ paddingBottom: 12 }}
        >
          {/* Hero */}
          <View style={[ds.hero, { backgroundColor: catColor + '10' }]}>
            <View style={[ds.heroIcon, { backgroundColor: catColor + '20', overflow: 'hidden' }]}>
              {snapshot.gifUrl ? (
                <Image
                  source={{ uri: snapshot.gifUrl }}
                  style={{ width: 80, height: 80, borderRadius: 18 }}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="barbell-outline" size={40} color={catColor} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={[ds.badge, { backgroundColor: catColor + '18' }]}>
                <View style={[ds.dot, { backgroundColor: catColor }]} />
                <Text style={[ds.badgeTxt, { color: catColor }]}>{catLabel}</Text>
              </View>
              <Text style={ds.name}>{name}</Text>
              <Text style={ds.catTxt}>{snapshot.muscleGroups[0] ?? snapshot.target ?? ''}</Text>
            </View>
          </View>

          {/* Kas Grupları */}
          {snapshot.muscleGroups.length > 0 && (
            <View style={ds.statRow}>
              <View style={ds.statCell}>
                <Text style={ds.statLabel}>Ana Kas</Text>
                <Text style={ds.statVal}>{snapshot.muscleGroups[0]}</Text>
              </View>
              {snapshot.secondaryMuscles.length > 0 && (
                <>
                  <View style={ds.statDivider} />
                  <View style={ds.statCell}>
                    <Text style={ds.statLabel}>Yardımcı</Text>
                    <Text style={ds.statVal} numberOfLines={1}>
                      {snapshot.secondaryMuscles.slice(0, 2).join(', ')}
                    </Text>
                  </View>
                </>
              )}
              {snapshot.equipment.length > 0 && (
                <>
                  <View style={ds.statDivider} />
                  <View style={ds.statCell}>
                    <Text style={ds.statLabel}>Ekipman</Text>
                    <Text style={ds.statVal} numberOfLines={1}>
                      {snapshot.equipment[0]}
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Nasıl Yapılır? Video */}
          <View style={ds.videoSection}>
            <View style={ds.videoSectionHeader}>
              <Ionicons name="play-circle" size={14} color={catColor} />
              <Text style={[ds.videoSectionLabel, { color: catColor }]}>Nasıl Yapılır?</Text>
            </View>
            {videoLoading ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={[
                      ds.videoThumb,
                      {
                        backgroundColor: catColor + '12',
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                    ]}
                  >
                    {i === 0 && <ActivityIndicator size="small" color={catColor} />}
                  </View>
                ))}
              </View>
            ) : videos.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {videos.map((v, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setActiveVideo({ url: v.videoUrl, index: i })}
                    style={ds.videoThumb}
                  >
                    <Image
                      source={{ uri: v.thumbUrl }}
                      style={ds.videoThumbImg}
                      resizeMode="cover"
                    />
                    <View style={ds.videoPlayOverlay}>
                      <View style={[ds.videoPlayBtn, { backgroundColor: catColor }]}>
                        <Ionicons name="play" size={16} color="#fff" />
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <Text style={{ fontSize: 13, color: '#C7C7CC' }}>Video bulunamadı</Text>
            )}
          </View>

          {/* Talimatlar */}
          {snapshot.muscleGroups.length > 0 && (
            <View style={ds.section}>
              <View style={ds.sectionHeader}>
                <Ionicons name="list-outline" size={14} color="#6366F1" />
                <Text style={[ds.sectionLabel, { color: '#6366F1' }]}>Nasıl Yapılır?</Text>
              </View>
              {snapshot.muscleGroups.map((m, i) => (
                <Text key={i} style={[ds.sectionTxt, { marginBottom: 4 }]}>
                  • {m}
                </Text>
              ))}
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {activeVideo && (
        <VideoLightbox
          url={activeVideo.url}
          index={activeVideo.index}
          total={videos.length}
          onPrev={() => {
            const i = (activeVideo.index - 1 + videos.length) % videos.length;
            setActiveVideo({ url: videos[i]!.videoUrl, index: i });
          }}
          onNext={() => {
            const i = (activeVideo.index + 1) % videos.length;
            setActiveVideo({ url: videos[i]!.videoUrl, index: i });
          }}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </View>
  );
}

// ─── Discover Card (alt türü olmayan aktiviteler) ─────────────────────────────
function DiscoverCard({
  item,
  onPress,
  index = 0,
}: {
  item: CatalogItem;
  onPress: () => void;
  index?: number;
}) {
  const score = item.userScore?.score;
  const cfg = score ? SCORE_CONFIG[score] : DEFAULT_SCORE_CFG;
  const icon = getMainActivityIcon(item.activityType);
  const { press, entryOp, entryTy, entryS, pressIn, pressOut } = useCardEntry(index);

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View
        style={[
          dc.card,
          {
            backgroundColor: cfg.bg,
            borderColor: cfg.border,
            opacity: entryOp,
            transform: [{ translateY: entryTy }, { scale: entryS }, { scale: press }],
          },
        ]}
      >
        <View style={dc.top}>
          <View style={dc.iconBox}>
            {icon ? (
              <Image source={icon} style={{ width: 92, height: 92 }} resizeMode="contain" />
            ) : (
              <Ionicons name={item.iconName as any} size={36} color={item.color} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            {score && (
              <View style={[dc.badge, { backgroundColor: cfg.tag }]}>
                <View style={[dc.dot, { backgroundColor: cfg.dot }]} />
                <Text style={[dc.scoreLbl, { color: cfg.dot }]}>{cfg.label}</Text>
              </View>
            )}
            <Text style={dc.name}>{item.nametr}</Text>
            <Text style={dc.cat}>
              {CATEGORY_LABELS[item.category] ?? item.category} · MET {item.metValue}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        </View>
        {item.descriptiontr && (
          <Text style={dc.description} numberOfLines={2}>
            {item.descriptiontr}
          </Text>
        )}
        {item.userScore?.aiNote && (
          <View style={dc.aiRow}>
            <Ionicons name="sparkles" size={12} color={ACCENT} />
            <Text style={dc.aiNote} numberOfLines={2}>
              {item.userScore.aiNote}
            </Text>
          </View>
        )}
        {!score && (
          <View style={dc.scoringRow}>
            <ActivityIndicator size={10} color={ACCENT} />
            <Text style={dc.scoringTxt}>AI skorlanıyor...</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─── Subtype Card ──────────────────────────────────────────────────────────────
function SubtypeCard({
  subtype,
  parent,
  onPress,
  index = 0,
}: {
  subtype: { key: string; nametr: string };
  parent: CatalogItem;
  onPress: () => void;
  index?: number;
}) {
  const score = parent.userScore?.score;
  const cfg = score ? SCORE_CONFIG[score] : DEFAULT_SCORE_CFG;
  const icon = getMainActivityIcon(parent.activityType);
  const { press, entryOp, entryTy, entryS, pressIn, pressOut } = useCardEntry(index);

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View
        style={[
          dc.card,
          {
            backgroundColor: cfg.bg,
            borderColor: cfg.border,
            opacity: entryOp,
            transform: [{ translateY: entryTy }, { scale: entryS }, { scale: press }],
          },
        ]}
      >
        <View style={dc.top}>
          <View style={dc.iconBox}>
            {icon ? (
              <Image source={icon} style={{ width: 92, height: 92 }} resizeMode="contain" />
            ) : (
              <Ionicons name={parent.iconName as any} size={36} color={parent.color} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            {score && (
              <View style={[dc.badge, { backgroundColor: cfg.tag }]}>
                <View style={[dc.dot, { backgroundColor: cfg.dot }]} />
                <Text style={[dc.scoreLbl, { color: cfg.dot }]}>{cfg.label}</Text>
              </View>
            )}
            <Text style={dc.name}>{subtype.nametr}</Text>
            <Text style={dc.cat}>
              {parent.nametr} · {CATEGORY_LABELS[parent.category] ?? parent.category}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        </View>
        {parent.userScore?.aiNote && (
          <View style={dc.aiRow}>
            <Ionicons name="sparkles" size={12} color={ACCENT} />
            <Text style={dc.aiNote} numberOfLines={2}>
              {parent.userScore.aiNote}
            </Text>
          </View>
        )}
        {!score && (
          <View style={dc.scoringRow}>
            <ActivityIndicator size={10} color={ACCENT} />
            <Text style={dc.scoringTxt}>AI skorlanıyor...</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const dc = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 10 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  iconBox: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginBottom: 4,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  scoreLbl: { fontSize: 11, fontWeight: '700' },
  name: { fontSize: 17, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.3 },
  cat: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  description: { fontSize: 13, color: '#636366', lineHeight: 19, marginBottom: 10 },
  benefit: { fontSize: 14, color: '#3C3C43', lineHeight: 20, marginBottom: 10 },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 10,
    padding: 10,
  },
  aiNote: { flex: 1, fontSize: 12, color: '#636366', lineHeight: 17 },
  scoringRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  scoringTxt: { fontSize: 12, color: '#8E8E93' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AktiviteDiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    fetchCatalog,
    triggerScoring,
    fetchScores,
    fetchFitnessExercises,
    isLoaded,
    isSignedIn,
    getToken,
  } = useDiscoverApi();

  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState<AiScore | 'all'>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [detailItem, setDetailItem] = useState<CatalogItem | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fitness state ──
  const [fitSubFilter, setFitSubFilter] = useState<string>('all');
  const [fitItems, setFitItems] = useState<FitnessExercise[]>([]);
  const [fitLoading, setFitLoading] = useState(false);
  const [fitDetailItem, setFitDetailItem] = useState<FitnessExercise | null>(null);
  const isFitness = catFilter === 'fitness';

  const listAnim = useRef(new Animated.Value(1)).current;
  const [listKey, setListKey] = useState(0);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const chipsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(70, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 340,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(chipsAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  }, []);

  const scoreCache = useRef<Record<string, any>>({});
  const scoringStarted = useRef(false);

  const applyScores = useCallback((catalog: CatalogItem[]) => {
    if (Object.keys(scoreCache.current).length === 0) return catalog;
    return catalog.map((i) =>
      scoreCache.current[i.id] ? { ...i, userScore: scoreCache.current[i.id] } : i,
    );
  }, []);

  const loadCatalog = useCallback(
    async (q?: string) => {
      setLoading(true);
      setError(null);
      try {
        const catalog = await fetchCatalog(q || undefined);
        setItems(applyScores(catalog));
      } catch {
        setError('Katalog yüklenemedi');
      } finally {
        setLoading(false);
      }
    },
    [fetchCatalog, applyScores],
  );

  const loadScores = useCallback(async () => {
    if (scoringStarted.current) return;
    scoringStarted.current = true;
    setScoring(true);
    try {
      let token: string | null = null;
      for (let t = 0; t < 20; t++) {
        token = (await getToken()) ?? null;
        if (token) break;
        await new Promise((r) => setTimeout(r, 300));
      }
      if (!token) {
        scoringStarted.current = false;
        setScoring(false);
        return;
      }
      const scoreMap = (await triggerScoring()) as Record<string, any>;
      scoreCache.current = scoreMap;
      setItems((prev) =>
        prev.map((i) => (scoreMap[i.id] ? { ...i, userScore: scoreMap[i.id] } : i)),
      );
    } catch {
      scoringStarted.current = false;
    } finally {
      setScoring(false);
    }
  }, [triggerScoring, getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    if (search.length === 0) {
      loadCatalog();
      return;
    }
    if (search.length < 2) return;
    const t = setTimeout(() => loadCatalog(search), 400);
    return () => clearTimeout(t);
  }, [search, isLoaded]);

  // Fitness exercises
  useEffect(() => {
    if (!isFitness || !isLoaded) return;
    setFitLoading(true);
    fetchFitnessExercises(fitSubFilter === 'all' ? undefined : fitSubFilter, search || undefined)
      .then(setFitItems)
      .catch(() => setFitItems([]))
      .finally(() => setFitLoading(false));
  }, [isFitness, fitSubFilter, search, isLoaded]);

  useEffect(() => {
    if (isSignedIn && items.length > 0 && !scoringStarted.current) loadScores();
  }, [isSignedIn, items.length > 0]);

  const ORDER: Record<AiScore, number> = { green: 0, yellow: 1, red: 2 };
  const filtered = items
    .filter((i) => catFilter === 'all' || i.category === catFilter)
    .filter((i) => scoreFilter === 'all' || i.userScore?.score === scoreFilter)
    .sort((a, b) => {
      const sa = a.userScore?.score,
        sb = b.userScore?.score;
      if (sa && sb) return ORDER[sa] - ORDER[sb];
      if (sa) return -1;
      if (sb) return 1;
      return 0;
    });

  const handleFilterChange = (commit: () => void) => {
    Animated.timing(listAnim, {
      toValue: 0,
      duration: 90,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start(() => {
      commit();
      setListKey((k) => k + 1);
      requestAnimationFrame(() =>
        Animated.timing(listAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }).start(),
      );
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[sc.root, { paddingTop: insets.top }]} collapsable={false}>
        {/* Header */}
        <Animated.View
          style={[
            sc.header,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }),
                },
              ],
            },
          ]}
        >
          <Pressable onPress={() => router.back()} hitSlop={12} style={sc.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#1C1C1E" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={sc.title}>Aktivite Keşfet</Text>
            <Text style={sc.sub}>{scoring ? 'AI skorlanıyor...' : 'Sana özel AI skorlaması'}</Text>
          </View>
          {scoring && <ActivityIndicator size="small" color={ACCENT} style={{ marginRight: 4 }} />}
        </Animated.View>

        {/* Search */}
        <Animated.View
          style={[
            sc.searchWrap,
            {
              opacity: searchAnim,
              transform: [
                {
                  translateY: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="search" size={16} color="#8E8E93" style={{ marginLeft: 12 }} />
          <TextInput
            style={sc.searchInput}
            placeholder="Aktivite ara..."
            placeholderTextColor="#C7C7CC"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8} style={{ marginRight: 12 }}>
              <Ionicons name="close-circle" size={16} color="#C7C7CC" />
            </Pressable>
          )}
        </Animated.View>

        {/* Skor Filtresi — sadece fitness değilken */}
        {!isFitness && (
          <Animated.View
            style={{
              opacity: chipsAnim,
              transform: [
                { translateY: chipsAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
              ],
            }}
          >
            <FilterChips
              tabs={FILTER_TABS}
              filter={scoreFilter}
              onSelect={setScoreFilter}
              onBeforeChange={handleFilterChange}
            />
          </Animated.View>
        )}

        {/* Fitness Sub Filter — sadece fitness seçilince */}
        {isFitness && (
          <Animated.View style={{ opacity: chipsAnim }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={sc.catScroll}
            >
              {FITNESS_SUB_FILTERS.map(({ val, label, color }) => (
                <AnimCatChip
                  key={val}
                  label={label}
                  color={color}
                  active={fitSubFilter === val}
                  onPress={() => handleFilterChange(() => setFitSubFilter(val))}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Kategori filtresi */}
        <Animated.View style={{ opacity: chipsAnim }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={sc.catScroll}
          >
            {CAT_FILTERS.map(({ val, label, color }) => (
              <AnimCatChip
                key={val}
                label={label}
                color={color}
                active={catFilter === val}
                onPress={() => handleFilterChange(() => setCatFilter(val))}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Content */}
        {isFitness ? (
          fitLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={ACCENT} size="large" />
              <Text style={{ color: '#8E8E93', marginTop: 12, fontSize: 14 }}>Yükleniyor...</Text>
            </View>
          ) : (
            <Animated.View
              key={listKey}
              style={{
                flex: 1,
                opacity: listAnim,
                transform: [
                  { scale: listAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
                ],
              }}
            >
              <ScrollView contentContainerStyle={sc.scroll} showsVerticalScrollIndicator={false}>
                {fitItems.length === 0 ? (
                  <View style={sc.empty}>
                    <Ionicons name="barbell-outline" size={40} color="#C7C7CC" />
                    <Text style={sc.emptyTxt}>Egzersiz bulunamadı</Text>
                  </View>
                ) : (
                  fitItems.map((ex, idx) => (
                    <FitnessDiscoverCard
                      key={ex.id}
                      item={ex}
                      onPress={() => setFitDetailItem(ex)}
                      index={idx}
                    />
                  ))
                )}
              </ScrollView>
            </Animated.View>
          )
        ) : loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={ACCENT} size="large" />
            <Text style={{ color: '#8E8E93', marginTop: 12, fontSize: 14 }}>Yükleniyor...</Text>
          </View>
        ) : error ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Ionicons name="alert-circle-outline" size={40} color="#FF453A" />
            <Text style={{ color: '#FF453A', fontSize: 15 }}>{error}</Text>
            <Pressable onPress={() => loadCatalog()}>
              <View
                style={{
                  backgroundColor: ACCENT,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Tekrar Dene</Text>
              </View>
            </Pressable>
          </View>
        ) : (
          <Animated.View
            key={listKey}
            style={{
              flex: 1,
              opacity: listAnim,
              transform: [
                { scale: listAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
              ],
            }}
          >
            <ScrollView contentContainerStyle={sc.scroll} showsVerticalScrollIndicator={false}>
              {filtered.length === 0 ? (
                <View style={sc.empty}>
                  <Ionicons name="search-outline" size={40} color="#C7C7CC" />
                  <Text style={sc.emptyTxt}>Sonuç bulunamadı</Text>
                </View>
              ) : (
                filtered.flatMap((item, idx) =>
                  item.subtypes && item.subtypes.length > 0
                    ? item.subtypes.map((s, si) => (
                        <SubtypeCard
                          key={`${item.id}-${s.key}`}
                          subtype={s}
                          parent={item}
                          onPress={() =>
                            setDetailItem({ ...item, id: `${item.id}-${s.key}`, nametr: s.nametr })
                          }
                          index={idx * 8 + si}
                        />
                      ))
                    : [
                        <DiscoverCard
                          key={item.id}
                          item={item}
                          onPress={() => setDetailItem(item)}
                          index={idx}
                        />,
                      ],
                )
              )}
            </ScrollView>
          </Animated.View>
        )}

        <DetailSheet item={detailItem} visible={!!detailItem} onClose={() => setDetailItem(null)} />
        <FitnessDetailSheet
          item={fitDetailItem}
          visible={!!fitDetailItem}
          onClose={() => setFitDetailItem(null)}
        />
      </View>
    </>
  );
}

function AnimCatChip({
  label,
  color,
  active,
  onPress,
}: {
  label: string;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(active ? 1 : 0)).current;
  const prevActive = useRef(active);

  useEffect(() => {
    if (prevActive.current === active) return;
    prevActive.current = active;
    Animated.timing(bgAnim, {
      toValue: active ? 1 : 0,
      duration: active ? 260 : 220,
      useNativeDriver: false,
      easing: active ? Easing.bezier(0.16, 1, 0.3, 1) : Easing.bezier(0.4, 0, 1, 1),
    }).start();
  }, [active]);

  const onPressIn = () =>
    Animated.timing(scaleAnim, {
      toValue: 0.93,
      duration: 120,
      useNativeDriver: true,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }).start();
  const onPressOut = () =>
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }).start();

  const bgColor = bgAnim.interpolate({ inputRange: [0, 1], outputRange: ['#fff', color] });
  const borderClr = bgAnim.interpolate({ inputRange: [0, 1], outputRange: ['#E5E5EA', color] });
  const textColor = bgAnim.interpolate({ inputRange: [0, 1], outputRange: ['#636366', '#fff'] });

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Animated.View style={[sc.catChip, { backgroundColor: bgColor, borderColor: borderClr }]}>
          <Animated.Text
            style={[sc.catChipTxt, { color: textColor, fontWeight: active ? '700' : '500' }]}
          >
            {label}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const sc = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  sub: { fontSize: 13, color: '#8E8E93', marginTop: 1 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(60,60,67,0.1)',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 15,
    color: '#1C1C1E',
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: '#E5E5EA',
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 2,
    position: 'relative',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipTxt: { fontSize: 13, color: '#636366', fontWeight: '500' },
  catScroll: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
  },
  catChipTxt: { fontSize: 13, fontWeight: '500', color: '#636366' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTxt: { fontSize: 15, color: '#8E8E93' },
});

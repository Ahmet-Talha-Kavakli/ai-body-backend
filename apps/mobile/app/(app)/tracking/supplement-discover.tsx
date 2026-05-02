import React, { useRef, useState, useEffect, useCallback } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: SCREEN_H } = Dimensions.get('window');
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useSession } from '@clerk/expo';
import { getSupplementIcon } from '../../../lib/supplement-icons';

const GREEN = '#30D158';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// ─── Types ────────────────────────────────────────────────────────────────────
type SuppType =
  | 'Protein'
  | 'Performans'
  | 'Vitamin'
  | 'Mineral'
  | 'Yağ Asidi'
  | 'Bitki'
  | 'Probiyotik'
  | 'Yağ Yakıcı'
  | 'Eklem & Kemik'
  | 'Uyku & Rahatlama'
  | 'Antioksidan'
  | 'genel';
type AiScore = 'green' | 'yellow' | 'red';
type ScoreData = {
  score: AiScore;
  aiNote: string;
  timing?: string | null;
  interactions?: string | null;
  allergens?: string | null;
  alternatives?: string | null;
  evidenceLevel?: string | null;
};

interface CatalogItem {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  type: string;
  doseInfo: string | null;
  benefit: string | null;
  score?: AiScore;
  aiNote?: string;
  timing?: string | null;
  interactions?: string | null;
  allergens?: string | null;
  alternatives?: string | null;
  evidenceLevel?: string | null;
}

const SUPP_ICONS: Record<SuppType, ReturnType<typeof require>> = {
  Protein: require('../../../assets/icons/cat-protein.png'),
  Performans: require('../../../assets/icons/cat-performans.png'),
  Vitamin: require('../../../assets/icons/cat-vitamin.png'),
  Mineral: require('../../../assets/icons/cat-mineral.png'),
  'Yağ Asidi': require('../../../assets/icons/cat-yagasidi.png'),
  Bitki: require('../../../assets/icons/cat-bitki.png'),
  Probiyotik: require('../../../assets/icons/cat-probiyotik.png'),
  'Yağ Yakıcı': require('../../../assets/icons/cat-yakyakici.png'),
  'Eklem & Kemik': require('../../../assets/icons/cat-eklem.png'),
  'Uyku & Rahatlama': require('../../../assets/icons/cat-uyku.png'),
  Antioksidan: require('../../../assets/icons/cat-antioksidan.png'),
  genel: require('../../../assets/icons/supp-genel.png'),
};

const VALID_CATS = [
  'Protein',
  'Performans',
  'Vitamin',
  'Mineral',
  'Yağ Asidi',
  'Bitki',
  'Probiyotik',
  'Yağ Yakıcı',
  'Eklem & Kemik',
  'Uyku & Rahatlama',
  'Antioksidan',
];

function getSuppIcon(category: string) {
  return SUPP_ICONS[VALID_CATS.includes(category) ? (category as SuppType) : 'genel'];
}

const SCORE_CONFIG: Record<
  AiScore,
  { bg: string; border: string; dot: string; label: string; tag: string }
> = {
  green: { bg: '#F0FDF4', border: '#86EFAC', dot: '#22C55E', label: 'Önerilir', tag: '#DCFCE7' },
  yellow: { bg: '#FEFCE8', border: '#FDE047', dot: '#EAB308', label: 'Dikkatli', tag: '#FEF9C3' },
  red: { bg: '#FFF1F2', border: '#FECDD3', dot: '#F43F5E', label: 'Riskli', tag: '#FFE4E6' },
};

const DEFAULT_SCORE_CFG = {
  bg: '#F2F2F7',
  border: '#E5E5EA',
  dot: '#8E8E93',
  label: '...',
  tag: '#F2F2F7',
};

const COUNTRY_OPTIONS = [
  { code: 'global', label: '🌍 Global' },
  { code: 'TR', label: '🇹🇷 Türkiye' },
  { code: 'US', label: '🇺🇸 ABD' },
  { code: 'GB', label: '🇬🇧 İngiltere' },
  { code: 'DE', label: '🇩🇪 Almanya' },
  { code: 'JP', label: '🇯🇵 Japonya' },
];

// ─── API Hook ─────────────────────────────────────────────────────────────────
function useDiscoverApi() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { session } = useSession();

  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      // useAuth().getToken() daha güvenilir — session bağımsız çalışır
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

  const fetchCatalog = useCallback(async (country: string, q?: string): Promise<CatalogItem[]> => {
    const params = new URLSearchParams({ country });
    if (q) params.set('q', q);
    const res = await fetch(`${API_URL}/api/supplements/catalog?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<CatalogItem[]>;
  }, []);

  const fetchCachedScores = useCallback(async (): Promise<Record<string, ScoreData>> => {
    const res = await authFetch('/api/supplements/score-catalog');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { scores: Record<string, ScoreData>; count: number };
    return data.scores ?? {};
  }, [authFetch]);

  const triggerScoring = useCallback(async (): Promise<Record<string, ScoreData>> => {
    // Mevcut skorları çek (token loadAiScores'ta doğrulandı)
    const cached = await fetchCachedScores().catch(() => ({}));
    if (Object.keys(cached).length > 0) return cached;

    // DB'de skor yok — POST at, arka planda hesaplansın
    authFetch('/api/supplements/score-catalog', { method: 'POST' }).catch(() => null);

    // Poll: her 5 saniyede bir, max 5 dakika (60 deneme)
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const polled = await fetchCachedScores().catch(() => ({}));
      if (Object.keys(polled).length > 0) return polled;
    }

    return {};
  }, [authFetch, fetchCachedScores]);

  const fetchUserAllergies = useCallback(async (): Promise<string[]> => {
    const res = await authFetch('/api/user/allergies');
    if (!res.ok) return [];
    const data = (await res.json()) as { allergies: string[] };
    return data.allergies ?? [];
  }, [authFetch]);

  const addToMyList = useCallback(
    async (item: CatalogItem & { score?: AiScore; aiNote?: string }) => {
      const res = await authFetch('/api/tracking/supplements', {
        method: 'POST',
        body: JSON.stringify({
          name: item.name,
          brand: item.brand,
          category: item.category,
          type: item.type,
          dosage: item.doseInfo ?? '1',
          unit: 'adet',
          timing: 'morning',
          aiScore: item.score,
          aiNote: item.aiNote,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    [authFetch],
  );

  return {
    fetchCatalog,
    triggerScoring,
    addToMyList,
    fetchUserAllergies,
    isLoaded,
    isSignedIn,
    session,
    getToken,
  };
}

// ─── Country Picker ───────────────────────────────────────────────────────────
function CountryPicker({
  visible,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current: string;
  onSelect: (c: string) => void;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const opAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 180,
          friction: 22,
          velocity: 2,
        }),
        Animated.timing(opAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 400,
          useNativeDriver: true,
          tension: 200,
          friction: 28,
        }),
        Animated.timing(opAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[cp.overlay, { opacity: opAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[cp.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={cp.handle} />
          <Text style={cp.title}>Ülke Seç</Text>
          <Text style={cp.sub}>Ülkeye göre mevcut supplementler değişir</Text>
          <View style={{ gap: 8, marginTop: 16 }}>
            {COUNTRY_OPTIONS.map((c) => {
              const active = c.code === current;
              return (
                <Pressable
                  key={c.code}
                  onPress={() => {
                    onSelect(c.code);
                    onClose();
                  }}
                >
                  {({ pressed }) => (
                    <View style={[cp.row, active && cp.rowActive, pressed && { opacity: 0.7 }]}>
                      <Text style={[cp.rowTxt, active && { color: GREEN, fontWeight: '700' }]}>
                        {c.label}
                      </Text>
                      {active && <Ionicons name="checkmark-circle" size={20} color={GREEN} />}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const cp = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 44,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#1C1C1E' },
  sub: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowActive: {
    backgroundColor: 'rgba(48,209,88,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(48,209,88,0.3)',
  },
  rowTxt: { fontSize: 15, color: '#1C1C1E', fontWeight: '500' },
});

// ─── Detail Sheet ─────────────────────────────────────────────────────────────
const EVIDENCE_CONFIG: Record<
  string,
  { color: string; bg: string; icon: 'checkmark-circle' | 'remove-circle' | 'alert-circle' }
> = {
  Kuvvetli: { color: '#22C55E', bg: '#F0FDF4', icon: 'checkmark-circle' },
  Orta: { color: '#EAB308', bg: '#FEFCE8', icon: 'alert-circle' },
  Zayıf: { color: '#F43F5E', bg: '#FFF1F2', icon: 'remove-circle' },
};

function InteractionSection({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Ionicons name="flash" size={14} color="#F59E0B" />
        <Text style={[ds.sectionLabel, { color: '#F59E0B' }]}>Etkileşim Uyarıları</Text>
      </View>
      <View style={{ gap: 8 }}>
        {items.map((item, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: '#FFFBEB',
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: '#FDE68A',
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: '#FEF3C7',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="alert-circle" size={18} color="#F59E0B" />
            </View>
            <Text
              style={{ flex: 1, fontSize: 13, fontWeight: '600', color: '#92400E', lineHeight: 18 }}
            >
              {item.trim()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function DividerLine() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.delay(800),
      ]),
    ).start();
  }, []);
  const color = shimmer.interpolate({ inputRange: [0, 1], outputRange: ['#AEAEB2', '#6366F1'] });
  return <Animated.View style={{ height: 1, backgroundColor: color, marginBottom: 16 }} />;
}

const CAT_COLORS: Record<string, string> = {
  Protein: '#FF6B35',
  Performans: '#5AC8FA',
  Vitamin: '#FF9F0A',
  Mineral: '#BF5AF2',
  'Yağ Asidi': '#0A84FF',
  Bitki: '#34C759',
  Probiyotik: '#30D158',
  'Yağ Yakıcı': '#FF3B30',
  'Eklem & Kemik': '#A2845E',
  'Uyku & Rahatlama': '#5E5CE6',
  Antioksidan: '#FF2D55',
};

function AlternativesSection({
  items,
  allItems,
  onPress,
}: {
  items: string[];
  allItems: CatalogItem[];
  onPress: (item: CatalogItem) => void;
}) {
  if (items.length === 0) return null;

  const findItem = (name: string): CatalogItem => {
    const n = name.trim().toLowerCase();
    const exact = allItems.find((c) => c.name.toLowerCase() === n);
    if (exact) return exact;
    const partial = allItems.find(
      (c) => c.name.toLowerCase().includes(n) || n.includes(c.name.toLowerCase()),
    );
    if (partial) return partial;
    // Token overlap — "Magnezyum Glisinat" → tokens ["magnezyum","glisinat"]
    const tokens = n.split(/\s+/);
    const overlap = allItems
      .map((c) => ({ c, score: tokens.filter((t) => c.name.toLowerCase().includes(t)).length }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)[0];
    if (overlap) return overlap.c;
    // Fallback: synthetic item so the sheet still opens
    return {
      id: `alt-${n}`,
      name: name.trim(),
      brand: null,
      category: 'genel',
      type: 'genel',
      doseInfo: null,
      benefit: null,
    };
  };

  return (
    <View style={{ marginBottom: 14 }}>
      <DividerLine />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Ionicons name="swap-horizontal" size={14} color="#6366F1" />
        <Text style={[ds.sectionLabel, { color: '#6366F1' }]}>Alternatifler</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {items.map((name, i) => {
          const found = findItem(name);
          const color = CAT_COLORS[found.category] ?? '#6366F1';
          const icon = getSupplementIcon(found.name, found.category);
          return (
            <Pressable key={i} style={{ flex: 1 }} onPress={() => onPress(found)}>
              {({ pressed }) => (
                <View
                  style={{
                    backgroundColor: color + '12',
                    borderRadius: 14,
                    padding: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: color + '30',
                    height: 120,
                    opacity: pressed ? 0.7 : 1,
                  }}
                >
                  <Image
                    source={icon}
                    style={{ width: 70, height: 70, marginBottom: 10 }}
                    resizeMode="contain"
                  />
                  <Text style={{ fontSize: 12, fontWeight: '700', color, textAlign: 'center' }}>
                    {name.trim()}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DetailSheet({
  item,
  visible,
  onClose,
  onAdd,
  userAllergies,
  allItems,
  onPressAlternative,
}: {
  item: CatalogItem | null;
  visible: boolean;
  onClose: () => void;
  onAdd: () => void;
  userAllergies: string[];
  allItems: CatalogItem[];
  onPressAlternative: (item: CatalogItem) => void;
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;
  const [snapshot, setSnapshot] = useState<CatalogItem | null>(null);

  const prevIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (visible && item) {
      const isSwap = prevIdRef.current !== null && prevIdRef.current !== item.id;
      prevIdRef.current = item.id;
      if (isSwap) {
        // Kapat, içeriği değiştir, tekrar aç
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: SCREEN_H,
            duration: 280,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 1, 1),
          }),
          Animated.timing(opAnim, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
            easing: Easing.in(Easing.ease),
          }),
        ]).start(() => {
          setSnapshot(item);
          requestAnimationFrame(() => {
            Animated.parallel([
              Animated.timing(slideAnim, {
                toValue: 0,
                duration: 420,
                useNativeDriver: true,
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              Animated.timing(opAnim, {
                toValue: 1,
                duration: 320,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
              }),
            ]).start();
          });
        });
        return;
      }
      setSnapshot(item);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 520,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          Animated.timing(opAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
        ]).start();
      });
    } else {
      prevIdRef.current = null;
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_H,
          duration: 480,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 1, 1),
        }),
        Animated.timing(opAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ]).start(({ finished }) => {
        if (finished) setSnapshot(null);
      });
    }
  }, [visible, item?.id]);

  if (!snapshot) return null;

  const data = snapshot;
  const cfg = data?.score ? SCORE_CONFIG[data.score] : DEFAULT_SCORE_CFG;
  const evCfg = data?.evidenceLevel ? EVIDENCE_CONFIG[data.evidenceLevel] : null;
  const interList =
    data?.interactions
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const allerList =
    data?.allergens
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const altList =
    data?.alternatives
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const myAllergens = allerList.filter((a) =>
    userAllergies.some(
      (u) =>
        u.toLowerCase() === a.toLowerCase() ||
        a.toLowerCase().includes(u.toLowerCase()) ||
        u.toLowerCase().includes(a.toLowerCase()),
    ),
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: opAnim }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[ds.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={ds.handle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          {/* Header */}
          <View style={ds.top}>
            <View style={[ds.iconWrap, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
              <Image
                source={getSupplementIcon(data?.name ?? '', data?.category)}
                style={ds.icon}
                resizeMode="contain"
              />
            </View>
            <View style={{ flex: 1 }}>
              {data?.score && (
                <View style={[ds.badge, { backgroundColor: cfg.tag }]}>
                  <View style={[ds.dot, { backgroundColor: cfg.dot }]} />
                  <Text style={[ds.badgeTxt, { color: cfg.dot }]}>{cfg.label}</Text>
                </View>
              )}
              <Text style={ds.name}>{data?.name ?? ''}</Text>
              <Text style={ds.brand}>
                {data?.brand ? `${data.brand} · ` : ''}
                {data?.category ?? ''}
              </Text>
            </View>
          </View>

          {/* Stat row */}
          <View style={ds.statRow}>
            <View style={ds.statCell}>
              <Ionicons
                name="eyedrop-outline"
                size={16}
                color="#8E8E93"
                style={{ marginBottom: 4 }}
              />
              <Text style={ds.statLabel}>Önerilen Doz</Text>
              <Text style={ds.statVal}>{data?.doseInfo ?? '—'}</Text>
            </View>
            <View style={ds.statDivider} />
            <View style={ds.statCell}>
              <Ionicons name="time-outline" size={16} color="#8E8E93" style={{ marginBottom: 4 }} />
              <Text style={ds.statLabel}>Ne Zaman</Text>
              <Text style={ds.statVal}>{data?.timing ?? '—'}</Text>
            </View>
            {evCfg && (
              <>
                <View style={ds.statDivider} />
                <View style={ds.statCell}>
                  <Ionicons
                    name={evCfg.icon}
                    size={16}
                    color={evCfg.color}
                    style={{ marginBottom: 4 }}
                  />
                  <Text style={ds.statLabel}>Kanıt</Text>
                  <Text style={[ds.statVal, { color: evCfg.color }]}>{data?.evidenceLevel}</Text>
                </View>
              </>
            )}
          </View>

          {/* Fayda */}
          {data?.benefit && (
            <View style={ds.benefitBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="flash-outline" size={14} color="#6366F1" />
                <Text style={[ds.sectionLabel, { color: '#6366F1' }]}>Faydası</Text>
              </View>
              <Text style={ds.benefitTxt}>{data.benefit}</Text>
            </View>
          )}

          {/* AI Değerlendirmesi */}
          {data?.aiNote && (
            <View style={[ds.aiBox, { borderColor: cfg.border, backgroundColor: cfg.bg }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="sparkles" size={14} color={cfg.dot} />
                <Text style={[ds.sectionLabel, { color: cfg.dot }]}>AI Değerlendirmesi</Text>
              </View>
              <Text style={ds.aiNote}>{data.aiNote}</Text>
            </View>
          )}

          {myAllergens.length > 0 && (
            <View style={ds.myAllergenBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ionicons name="warning" size={16} color="#FF3B30" />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#FF3B30' }}>
                  Kişisel Alerjen Uyarısı
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: '#3C3C43', lineHeight: 19, marginBottom: 10 }}>
                Profilinde kayıtlı hassasiyetlerinle eşleşen maddeler:
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {myAllergens.map((a, i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: '#FF3B3020',
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#FF3B3050',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#FF3B30' }}>
                      ⚠️ {a}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <InteractionSection items={interList} />
          {allerList.length > 0 && (
            <View style={{ marginBottom: 14 }}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}
              >
                <Ionicons name="warning" size={14} color="#F43F5E" />
                <Text style={[ds.sectionLabel, { color: '#F43F5E' }]}>Alerjen Uyarıları</Text>
              </View>
              <View style={{ gap: 8 }}>
                {allerList.map((item, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      backgroundColor: '#FFF1F2',
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: '#FECDD3',
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: '#FFE4E6',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="shield-outline" size={18} color="#F43F5E" />
                    </View>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: '600',
                        color: '#9F1239',
                        lineHeight: 18,
                      }}
                    >
                      {item.trim()}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <AlternativesSection items={altList} allItems={allItems} onPress={onPressAlternative} />

          <View style={{ height: 8 }} />
        </ScrollView>

        <Pressable onPress={onAdd}>
          {({ pressed }) => (
            <Animated.View
              style={[ds.addBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={ds.addBtnTxt}>Listeme Ekle</Text>
            </Animated.View>
          )}
        </Pressable>
      </Animated.View>
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
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 60, height: 60 },
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
  name: { fontSize: 20, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.4 },
  brand: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
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
  benefitBox: {
    backgroundColor: 'rgba(99,102,241,0.06)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.18)',
  },
  benefitTxt: { fontSize: 14, color: '#3C3C43', lineHeight: 21 },
  aiBox: { borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1 },
  sectionLabel: { fontSize: 13, fontWeight: '700' },
  aiNote: { fontSize: 14, color: '#3C3C43', lineHeight: 21 },
  chip: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 6 },
  chipTxt: { fontSize: 13, fontWeight: '600' },
  myAllergenBox: {
    backgroundColor: '#FFF1F2',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#FF3B3040',
  },
  addBtn: {
    backgroundColor: GREEN,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    marginTop: 16,
  },
  addBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
});

// ─── Filter Chips (sliding pill) ──────────────────────────────────────────────
const FILTER_TABS = [
  { val: 'all' as const, label: 'Tümü', color: '#1C1C1E' },
  { val: 'green' as const, label: 'Önerilir', color: '#22C55E' },
  { val: 'yellow' as const, label: 'Dikkatli', color: '#EAB308' },
  { val: 'red' as const, label: 'Riskli', color: '#F43F5E' },
];

function FilterChips({
  filter,
  onSelect,
  onBeforeChange,
}: {
  filter: AiScore | 'all';
  onSelect: (v: AiScore | 'all') => void;
  onBeforeChange: (cb: () => void) => void;
}) {
  const [chipW, setChipW] = useState(0);
  const chipWidth = useRef(0);
  const pillTx = useRef(new Animated.Value(0)).current;
  const pillOp = useRef(new Animated.Value(0)).current;
  const initialized = useRef(false);

  const activeIdx = FILTER_TABS.findIndex((t) => t.val === filter);
  const activeColor = FILTER_TABS[activeIdx]?.color ?? '#1C1C1E';

  // Move pill to index using translateX — native driver eligible
  const movePill = (idx: number, animate: boolean) => {
    const toValue = idx * chipWidth.current;
    if (!animate) {
      pillTx.setValue(toValue);
      pillOp.setValue(1);
      return;
    }
    Animated.spring(pillTx, { toValue, useNativeDriver: true, tension: 380, friction: 30 }).start();
  };

  const handleSelect = (val: AiScore | 'all', idx: number) => {
    if (val === filter) return;
    movePill(idx, true);
    onBeforeChange(() => onSelect(val));
  };

  return (
    <View
      style={[sc.chipRow, { position: 'relative' }]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        const cw = (w - 4) / FILTER_TABS.length; // w - (2px padding × 2) / tab sayısı
        chipWidth.current = cw;
        if (!initialized.current) {
          initialized.current = true;
          setChipW(cw);
          movePill(activeIdx, false);
        }
      }}
    >
      {/* Sliding pill — translateX on native thread, buttery smooth */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 2,
          bottom: 2,
          left: 2,
          width: chipW > 0 ? chipW : '24%',
          opacity: pillOp,
          backgroundColor: '#fff',
          borderRadius: 18,
          transform: [{ translateX: pillTx }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.12,
          shadowRadius: 4,
          elevation: 2,
        }}
      />

      {FILTER_TABS.map(({ val, label, color }, idx) => {
        const active = filter === val;
        return (
          <Pressable key={val} onPress={() => handleSelect(val, idx)} style={{ flex: 1 }}>
            {({ pressed }) => (
              <View style={[sc.chip, { justifyContent: 'center', opacity: pressed ? 0.6 : 1 }]}>
                <Text style={[sc.chipTxt, active && { color, fontWeight: '700' }]}>{label}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Discover Card ─────────────────────────────────────────────────────────────
function DiscoverCard({
  item,
  onPress,
  index = 0,
}: {
  item: CatalogItem & { score?: AiScore; aiNote?: string };
  onPress: () => void;
  index?: number;
}) {
  const cfg = item.score ? SCORE_CONFIG[item.score] : DEFAULT_SCORE_CFG;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(32)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    const delay = Math.min(index, 10) * 55;
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(opacity, { toValue: 1, useNativeDriver: true, tension: 60, friction: 12 }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 12,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 12,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.95,
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
      <Animated.View
        style={[
          dc.card,
          {
            backgroundColor: cfg.bg,
            borderColor: cfg.border,
            transform: [{ scale }, { translateY }, { scale: cardScale }],
            opacity,
          },
        ]}
      >
        <View style={dc.cardTop}>
          <Image
            source={getSupplementIcon(item.name, item.category)}
            style={dc.icon}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            {item.score && (
              <View style={[dc.badge, { backgroundColor: cfg.tag }]}>
                <View style={[dc.dot, { backgroundColor: cfg.dot }]} />
                <Text style={[dc.scoreLbl, { color: cfg.dot }]}>{cfg.label}</Text>
              </View>
            )}
            <Text style={dc.name}>{item.name}</Text>
            <Text style={dc.brand}>
              {item.brand ? `${item.brand} · ` : ''}
              {item.category}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        </View>
        {item.benefit && <Text style={dc.benefit}>{item.benefit}</Text>}
        {item.aiNote && (
          <View style={dc.aiRow}>
            <Ionicons name="sparkles" size={12} color={GREEN} />
            <Text style={dc.aiNote} numberOfLines={2}>
              {item.aiNote}
            </Text>
          </View>
        )}
        {!item.score && (
          <View style={dc.scoringRow}>
            <ActivityIndicator size={10} color={GREEN} />
            <Text style={dc.scoringTxt}>AI skorlanıyor...</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const dc = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  icon: { width: 56, height: 56 },
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
  name: { fontSize: 16, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.3 },
  brand: { fontSize: 13, color: '#8E8E93', marginTop: 1 },
  benefit: { fontSize: 14, color: '#3C3C43', marginBottom: 10 },
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

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function SupplementDiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    fetchCatalog,
    triggerScoring,
    addToMyList,
    fetchUserAllergies,
    isLoaded,
    isSignedIn,
    session,
    getToken,
  } = useDiscoverApi();

  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('global');
  const [countryOpen, setCountryOpen] = useState(false);
  const [filter, setFilter] = useState<AiScore | 'all'>('all');
  const [detailItem, setDetailItem] = useState<
    (CatalogItem & { score?: AiScore; aiNote?: string }) | null
  >(null);
  const [userAllergies, setUserAllergies] = useState<string[]>([]);

  const [items, setItems] = useState<(CatalogItem & { score?: AiScore; aiNote?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const listAnim = useRef(new Animated.Value(1)).current;
  const [listKey, setListKey] = useState(0);

  // Sayfa mount animasyonu
  const headerAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const chipsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(80, [
      Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 70, friction: 13 }),
      Animated.spring(searchAnim, { toValue: 1, useNativeDriver: true, tension: 70, friction: 13 }),
      Animated.spring(chipsAnim, { toValue: 1, useNativeDriver: true, tension: 70, friction: 13 }),
    ]).start();
  }, []);

  // Skorlar bir kez çekildikten sonra hafızada tutulur — catalog reload'da kaybolmaz
  const scoreCache = useRef<Record<string, ScoreData>>({});
  const scoringStarted = useRef(false);

  const applyScores = useCallback((catalog: CatalogItem[]) => {
    if (Object.keys(scoreCache.current).length === 0) return catalog;
    return catalog.map((i) =>
      scoreCache.current[i.id] ? { ...i, ...scoreCache.current[i.id] } : i,
    );
  }, []);

  const loadCatalog = useCallback(
    async (c: string, q?: string) => {
      setLoading(true);
      setError(null);
      try {
        const catalog = await fetchCatalog(c, q || undefined);
        setItems(applyScores(catalog));
      } catch (e) {
        console.error('[discover] catalog fetch failed', e);
        setError('Katalog yüklenemedi');
      } finally {
        setLoading(false);
      }
    },
    [fetchCatalog, applyScores],
  );

  const loadAiScores = useCallback(async () => {
    if (scoringStarted.current) return;
    scoringStarted.current = true;
    setScoring(true);

    const hidden = await AsyncStorage.getItem('ai_scoring_alert_hidden');
    if (!hidden) {
      Alert.alert(
        'AI Analizi Başladı',
        'Takviyeler profiline göre analiz ediliyor. Bu işlem 1-2 dakika sürebilir. Sayfayı açık tutabilirsin, arka planda devam eder.',
        [
          {
            text: 'Bir Daha Gösterme',
            style: 'cancel',
            onPress: () => AsyncStorage.setItem('ai_scoring_alert_hidden', '1'),
          },
          { text: 'Tamam', style: 'default' },
        ],
      );
    }

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

      const scoreMap = await triggerScoring();
      scoreCache.current = scoreMap;
      setItems((prev) => prev.map((i) => (scoreMap[i.id] ? { ...i, ...scoreMap[i.id] } : i)));
    } catch (e) {
      console.warn('[SCORE] hata:', e);
      scoringStarted.current = false;
    } finally {
      setScoring(false);
    }
  }, [triggerScoring, getToken]);

  // Catalog yükle: country değişince veya search değişince
  useEffect(() => {
    if (!isLoaded) return;
    if (search.length === 0) {
      loadCatalog(country);
      return;
    }
    if (search.length < 2) return;
    const t = setTimeout(() => loadCatalog(country, search), 400);
    return () => clearTimeout(t);
  }, [country, search, isLoaded]);

  // AI skorları: isSignedIn ve items hazır olunca tetikle
  useEffect(() => {
    if (isSignedIn && items.length > 0 && !scoringStarted.current) {
      loadAiScores();
    }
  }, [isSignedIn, items.length > 0]);

  // Kullanıcı alerjilerini yükle
  useEffect(() => {
    if (isSignedIn) {
      fetchUserAllergies()
        .then(setUserAllergies)
        .catch(() => {});
    }
  }, [isSignedIn]);

  const ORDER: Record<AiScore, number> = { green: 0, yellow: 1, red: 2 };
  const filtered = items
    .filter((i) => filter === 'all' || i.score === filter)
    .sort((a, b) => {
      if (a.score && b.score) return ORDER[a.score] - ORDER[b.score];
      if (a.score) return -1;
      if (b.score) return 1;
      return 0;
    });

  const handleAdd = useCallback(
    async (item: CatalogItem & { score?: AiScore; aiNote?: string }) => {
      setAddingId(item.id);
      try {
        await addToMyList(item);
        setDetailItem(null);
        Alert.alert('Eklendi!', `"${item.name}" supplement listenize eklendi.`);
      } catch {
        Alert.alert('Hata', 'Supplement eklenemedi. Tekrar deneyin.');
      } finally {
        setAddingId(null);
      }
    },
    [addToMyList],
  );

  const countryLabel = COUNTRY_OPTIONS.find((c) => c.code === country)?.label ?? country;

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
            <Text style={sc.title}>Keşfet</Text>
            <Text style={sc.sub}>{scoring ? 'AI skorlanıyor...' : 'Sana özel AI skorlaması'}</Text>
          </View>
          <Pressable onPress={() => setCountryOpen(true)} style={sc.countryBtn}>
            {({ pressed }) => (
              <View style={[sc.countryInner, pressed && { opacity: 0.7 }]}>
                <Text style={sc.countryTxt}>{countryLabel}</Text>
                <Ionicons name="chevron-down" size={12} color="#8E8E93" />
              </View>
            )}
          </Pressable>
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
            placeholder="Supplement veya marka ara..."
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

        {/* Filter chips */}
        <Animated.View
          style={{
            opacity: chipsAnim,
            transform: [
              { translateY: chipsAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
            ],
          }}
        >
          <FilterChips
            filter={filter}
            onSelect={setFilter}
            onBeforeChange={(commit) => {
              Animated.timing(listAnim, {
                toValue: 0,
                duration: 90,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
              }).start(() => {
                commit();
                setListKey((k) => k + 1); // kartları remount ederek stagger'ı yeniden tetikle
                requestAnimationFrame(() => {
                  Animated.spring(listAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 220,
                    friction: 18,
                  }).start();
                });
              });
            }}
          />
        </Animated.View>

        {/* Content */}
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={GREEN} size="large" />
            <Text style={{ color: '#8E8E93', marginTop: 12, fontSize: 14 }}>
              Katalog yükleniyor...
            </Text>
          </View>
        ) : error ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Ionicons name="alert-circle-outline" size={40} color="#FF453A" />
            <Text style={{ color: '#FF453A', fontSize: 15 }}>{error}</Text>
            <Pressable onPress={() => loadCatalog(country)}>
              <View
                style={{
                  backgroundColor: GREEN,
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
            <ScrollView
              contentContainerStyle={sc.scroll}
              showsVerticalScrollIndicator={false}
              decelerationRate="normal"
              scrollEventThrottle={16}
            >
              {filtered.length === 0 ? (
                <View style={sc.empty}>
                  <Ionicons name="search-outline" size={40} color="#C7C7CC" />
                  <Text style={sc.emptyTxt}>Sonuç bulunamadı</Text>
                </View>
              ) : (
                filtered.map((item, idx) => (
                  <DiscoverCard
                    key={item.id}
                    item={item}
                    onPress={() => setDetailItem(item)}
                    index={idx}
                  />
                ))
              )}
            </ScrollView>
          </Animated.View>
        )}

        {/* Detail sheet — inside root View so absolute positioning covers exactly this screen */}
        <DetailSheet
          item={detailItem}
          visible={!!detailItem}
          onClose={() => setDetailItem(null)}
          onAdd={() => detailItem && handleAdd(detailItem)}
          userAllergies={userAllergies}
          allItems={items}
          onPressAlternative={(alt) => setDetailItem(alt)}
        />

        {addingId && (
          <View style={sc.addingOverlay}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={{ color: '#fff', marginTop: 8 }}>Ekleniyor...</Text>
          </View>
        )}
      </View>

      <CountryPicker
        visible={countryOpen}
        current={country}
        onSelect={setCountry}
        onClose={() => setCountryOpen(false)}
      />
    </>
  );
}

const sc = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  sub: { fontSize: 13, color: '#8E8E93', marginTop: 1 },
  countryBtn: { alignSelf: 'center' },
  countryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(60,60,67,0.15)',
  },
  countryTxt: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(60,60,67,0.1)',
    gap: 8,
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
    marginBottom: 12,
    backgroundColor: '#E5E5EA',
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chipTxt: { fontSize: 13, color: '#636366', fontWeight: '500' },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  legend: { flexDirection: 'row', gap: 16, paddingHorizontal: 20, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendTxt: { fontSize: 12, color: '#636366', fontWeight: '600' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTxt: { fontSize: 15, color: '#8E8E93' },
  addingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

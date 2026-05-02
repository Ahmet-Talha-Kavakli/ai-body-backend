import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useSession } from '@clerk/expo';

const ACCENT = '#32ADE6';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const { height: SCREEN_H, width: SW } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
type AiScore = 'green' | 'yellow' | 'red';

interface DrinkItem {
  id: string;
  drinkType: string;
  nametr: string;
  nameen: string;
  category: string;
  hydrationValue: number; // ml başına hidrasyon katkısı (0-1 arası, kahve < 0 olabilir)
  caffeinePerServing: number | null;
  sugarPerServing: number | null;
  defaultServingMl: number;
  iconName: string;
  color: string;
  descriptiontr?: string | null;
  userScore?: {
    score: AiScore;
    aiNote: string;
    benefits: string | null;
    cautions: string | null;
    bestTime: string | null;
    dailyLimit: string | null;
  } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SCORE_CONFIG: Record<
  AiScore,
  { bg: string; border: string; dot: string; label: string; tag: string }
> = {
  green: { bg: '#F0FDF4', border: '#86EFAC', dot: '#22C55E', label: 'Önerilir', tag: '#DCFCE7' },
  yellow: { bg: '#FEFCE8', border: '#FDE047', dot: '#EAB308', label: 'Dikkatli', tag: '#FEF9C3' },
  red: { bg: '#FFF1F2', border: '#FECDD3', dot: '#F43F5E', label: 'Kaçın', tag: '#FFE4E6' },
};
const DEFAULT_SCORE_CFG = {
  bg: '#F9F9FB',
  border: '#E5E5EA',
  dot: '#8E8E93',
  label: 'Skorlanıyor',
  tag: '#F2F2F7',
};

const CATEGORY_LABELS: Record<string, string> = {
  water: 'Su',
  tea: 'Çay',
  coffee: 'Kahve',
  juice: 'Meyve Suyu',
  sports: 'Spor İçeceği',
  herbal: 'Bitki Çayı',
  soda: 'Gazlı İçecek',
  other: 'Diğer',
};

const FILTER_TABS = [
  { val: 'all' as const, label: 'Tümü', color: ACCENT },
  { val: 'green' as const, label: 'Önerilir', color: '#30D158' },
  { val: 'yellow' as const, label: 'Dikkatli', color: '#FF9500' },
  { val: 'red' as const, label: 'Kaçın', color: '#FF3B30' },
];

const CAT_FILTERS = [
  { val: 'all' as const, label: 'Tümü', color: ACCENT },
  { val: 'water' as const, label: 'Su', color: '#32ADE6' },
  { val: 'tea' as const, label: 'Çay', color: '#34C759' },
  { val: 'coffee' as const, label: 'Kahve', color: '#A2845E' },
  { val: 'herbal' as const, label: 'Bitki Çayı', color: '#30D158' },
  { val: 'juice' as const, label: 'Meyve Suyu', color: '#FF9F0A' },
  { val: 'sports' as const, label: 'Spor', color: '#5E5CE6' },
  { val: 'dairy' as const, label: 'Süt & Protein', color: '#C4A882' },
  { val: 'smoothie' as const, label: 'Smoothie', color: '#30D158' },
  { val: 'soda' as const, label: 'Gazlı', color: '#FF6B35' },
  { val: 'alcohol' as const, label: 'Alkol', color: '#8B0000' },
];

// ─── API Hook ─────────────────────────────────────────────────────────────────
function useDiscoverApi() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { session } = useSession();

  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = (await session?.getToken()) ?? null;
      return fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...((options.headers as Record<string, string>) ?? {}),
        },
      });
    },
    [session],
  );

  const fetchCatalog = useCallback(
    async (q?: string): Promise<DrinkItem[]> => {
      const params = q ? `?q=${encodeURIComponent(q)}` : '';
      const res = await authFetch(`/api/drinks/catalog${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<DrinkItem[]>;
    },
    [authFetch],
  );

  const fetchScores = useCallback(async (): Promise<Record<string, DrinkItem['userScore']>> => {
    const res = await authFetch('/api/drinks/scores');
    if (!res.ok) return {};
    const data = (await res.json()) as { scores: Record<string, any> };
    return data.scores ?? {};
  }, [authFetch]);

  const triggerScoring = useCallback(async () => {
    const cached = await fetchScores().catch(() => ({}));
    if (Object.keys(cached).length > 0) return cached;
    authFetch('/api/drinks/scores', { method: 'POST' }).catch(() => null);
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const polled = await fetchScores().catch(() => ({}));
      if (Object.keys(polled).length > 0) return polled;
    }
    return {};
  }, [authFetch, fetchScores]);

  return { fetchCatalog, triggerScoring, fetchScores, isLoaded, isSignedIn, session };
}

// ─── Filter Chips (sliding pill) ─────────────────────────────────────────────
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

// ─── AnimCatChip ─────────────────────────────────────────────────────────────
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

  const bgColor = bgAnim.interpolate({ inputRange: [0, 1], outputRange: ['#fff', color] });
  const borderClr = bgAnim.interpolate({ inputRange: [0, 1], outputRange: ['#E5E5EA', color] });
  const textColor = bgAnim.interpolate({ inputRange: [0, 1], outputRange: ['#636366', '#fff'] });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.timing(scaleAnim, {
          toValue: 0.93,
          duration: 120,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }).start()
      }
      onPressOut={() =>
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }).start()
      }
    >
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

// ─── Detail Sheet ─────────────────────────────────────────────────────────────
function DetailSheet({
  item,
  visible,
  onClose,
}: {
  item: DrinkItem | null;
  visible: boolean;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;
  const [snapshot, setSnapshot] = useState<DrinkItem | null>(null);
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (visible && item) {
      const isSwap = prevId.current !== null && prevId.current !== item.id;
      prevId.current = item.id;
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

  const hydPct = Math.round(data.hydrationValue * 100);
  const hydColor =
    data.hydrationValue >= 0.9
      ? '#30D158'
      : data.hydrationValue >= 0.5
        ? ACCENT
        : data.hydrationValue >= 0
          ? '#FF9F0A'
          : '#FF3B30';

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
              <Ionicons name={data.iconName as any} size={42} color={data.color} />
            </View>
            <View style={{ flex: 1 }}>
              {score && (
                <View style={[ds.badge, { backgroundColor: cfg.tag }]}>
                  <View style={[ds.dot, { backgroundColor: cfg.dot }]} />
                  <Text style={[ds.badgeTxt, { color: cfg.dot }]}>{cfg.label}</Text>
                </View>
              )}
              <Text style={ds.name}>{data.nametr}</Text>
              <Text style={ds.catTxt}>
                {CATEGORY_LABELS[data.category] ?? data.category} · {data.defaultServingMl}ml
              </Text>
            </View>
          </View>

          {/* Kısa tanım */}
          {data.descriptiontr && <Text style={ds.descTxt}>{data.descriptiontr}</Text>}

          {/* Stat row */}
          <View style={ds.statRow}>
            <View style={ds.statCell}>
              <Ionicons
                name="water-outline"
                size={18}
                color="#8E8E93"
                style={{ marginBottom: 4 }}
              />
              <Text style={ds.statLabel}>Hidrasyon</Text>
              <Text style={[ds.statVal, { color: hydColor }]}>%{hydPct}</Text>
            </View>
            <View style={ds.statDivider} />
            <View style={ds.statCell}>
              <Ionicons name="cafe-outline" size={18} color="#8E8E93" style={{ marginBottom: 4 }} />
              <Text style={ds.statLabel}>Kafein</Text>
              <Text style={ds.statVal}>
                {data.caffeinePerServing != null ? `${data.caffeinePerServing}mg` : '—'}
              </Text>
            </View>
            <View style={ds.statDivider} />
            <View style={ds.statCell}>
              <Ionicons
                name="nutrition-outline"
                size={18}
                color="#8E8E93"
                style={{ marginBottom: 4 }}
              />
              <Text style={ds.statLabel}>Şeker</Text>
              <Text style={ds.statVal}>
                {data.sugarPerServing != null ? `${data.sugarPerServing}g` : '—'}
              </Text>
            </View>
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

          {/* Günlük limit */}
          {data.userScore?.dailyLimit && (
            <View style={ds.infoRow}>
              <Ionicons name="alert-circle-outline" size={14} color="#0A84FF" />
              <Text style={ds.infoTxt}>{data.userScore.dailyLimit}</Text>
            </View>
          )}

          {/* En iyi zaman */}
          {data.userScore?.bestTime && (
            <View style={ds.infoRow}>
              <Ionicons name="time-outline" size={14} color="#0A84FF" />
              <Text style={ds.infoTxt}>{data.userScore.bestTime}</Text>
            </View>
          )}
        </ScrollView>
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
});

// ─── Card entry hook ──────────────────────────────────────────────────────────
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

// ─── Drink Card ───────────────────────────────────────────────────────────────
function DrinkCard({
  item,
  onPress,
  index = 0,
}: {
  item: DrinkItem;
  onPress: () => void;
  index?: number;
}) {
  const score = item.userScore?.score;
  const cfg = score ? SCORE_CONFIG[score] : DEFAULT_SCORE_CFG;
  const { press, entryOp, entryTy, entryS, pressIn, pressOut } = useCardEntry(index);

  const hydPct = Math.round(item.hydrationValue * 100);
  const hydColor =
    item.hydrationValue >= 0.9
      ? '#30D158'
      : item.hydrationValue >= 0.5
        ? ACCENT
        : item.hydrationValue >= 0
          ? '#FF9F0A'
          : '#FF3B30';

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
          <View style={[dc.iconBox, { backgroundColor: item.color + '18' }]}>
            <Ionicons name={item.iconName as any} size={36} color={item.color} />
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
              {CATEGORY_LABELS[item.category] ?? item.category} · {item.defaultServingMl}ml
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={[dc.hydPct, { color: hydColor }]}>%{hydPct}</Text>
            <Text style={dc.hydLabel}>hidrasyon</Text>
          </View>
        </View>

        {item.descriptiontr && (
          <Text style={dc.description} numberOfLines={2}>
            {item.descriptiontr}
          </Text>
        )}

        {/* Kafein / Şeker etiketleri */}
        <View style={dc.tagRow}>
          {item.caffeinePerServing != null && item.caffeinePerServing > 0 && (
            <View style={dc.tag}>
              <Ionicons name="cafe-outline" size={11} color="#A2845E" />
              <Text style={[dc.tagTxt, { color: '#A2845E' }]}>
                {item.caffeinePerServing}mg kafein
              </Text>
            </View>
          )}
          {item.sugarPerServing != null && item.sugarPerServing > 0 && (
            <View style={dc.tag}>
              <Ionicons name="nutrition-outline" size={11} color="#FF9F0A" />
              <Text style={[dc.tagTxt, { color: '#FF9F0A' }]}>{item.sugarPerServing}g şeker</Text>
            </View>
          )}
          {item.caffeinePerServing === 0 && item.sugarPerServing === 0 && (
            <View style={dc.tag}>
              <Ionicons name="checkmark-circle-outline" size={11} color="#30D158" />
              <Text style={[dc.tagTxt, { color: '#30D158' }]}>Saf</Text>
            </View>
          )}
        </View>

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

const dc = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 10 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  hydPct: { fontSize: 18, fontWeight: '800' },
  hydLabel: { fontSize: 10, color: '#8E8E93', fontWeight: '500' },
  description: { fontSize: 13, color: '#636366', lineHeight: 19, marginBottom: 8 },
  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagTxt: { fontSize: 11, fontWeight: '600' },
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
export default function SuDiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { fetchCatalog, triggerScoring, isLoaded, isSignedIn, session } = useDiscoverApi();

  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState<AiScore | 'all'>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [detailItem, setDetailItem] = useState<DrinkItem | null>(null);
  const [items, setItems] = useState<DrinkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const applyScores = useCallback((catalog: DrinkItem[]) => {
    if (Object.keys(scoreCache.current).length === 0) return catalog;
    return catalog.map((i) =>
      scoreCache.current[i.drinkType] ? { ...i, userScore: scoreCache.current[i.drinkType] } : i,
    );
  }, []);

  const loadCatalog = useCallback(
    async (q?: string) => {
      setLoading(true);
      setError(null);
      try {
        const catalog = await fetchCatalog(q || undefined);
        setItems(applyScores(catalog));
      } catch (e) {
        console.error('[su-discover] fetchCatalog error:', e);
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
        token = (await session?.getToken()) ?? null;
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
        prev.map((i) => (scoreMap[i.drinkType] ? { ...i, userScore: scoreMap[i.drinkType] } : i)),
      );
    } catch (e) {
      console.error('[su-discover] scoring error:', e);
      scoringStarted.current = false;
    } finally {
      setScoring(false);
    }
  }, [triggerScoring, session]);

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
            <Text style={sc.title}>İçecek Keşfet</Text>
            <Text style={sc.sub}>
              {scoring ? 'AI skorlanıyor...' : 'Sana özel hidrasyon skorlaması'}
            </Text>
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
            placeholder="İçecek ara..."
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

        {/* Skor Filtresi */}
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
        {loading ? (
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
                filtered.map((item, idx) => (
                  <DrinkCard
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

        <DetailSheet item={detailItem} visible={!!detailItem} onClose={() => setDetailItem(null)} />
      </View>
    </>
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

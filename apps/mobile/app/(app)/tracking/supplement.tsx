import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useSession } from '@clerk/expo';
import { getSupplementIcon } from '../../../lib/supplement-icons';

// ─── Constants ────────────────────────────────────────────────────────────────
const GREEN = '#30D158';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// ─── Types ────────────────────────────────────────────────────────────────────
type SuppType =
  | 'protein'
  | 'vitamin'
  | 'omega'
  | 'kreatin'
  | 'magnezyum'
  | 'probiyotik'
  | 'genel'
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
  | 'Antioksidan';

interface Supplement {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  type: string;
  dosage: string;
  unit: string;
  scheduleTimes: string[];
  scheduleDays: number[];
  aiScore: 'green' | 'yellow' | 'red' | null;
  aiNote: string | null;
  reminderAt: string | null;
  takenTimes: string[];
  takenLogs: { scheduledTime: string | null; takenAt: string }[];
  taken: boolean;
  logId: string | null;
}

const SUPP_ICONS: Record<SuppType, ReturnType<typeof require>> = {
  // legacy type-based
  protein: require('../../../assets/icons/supp-protein.png'),
  vitamin: require('../../../assets/icons/supp-vitamin.png'),
  omega: require('../../../assets/icons/supp-omega.png'),
  kreatin: require('../../../assets/icons/supp-kreatin.png'),
  magnezyum: require('../../../assets/icons/supp-magnezyum.png'),
  probiyotik: require('../../../assets/icons/supp-probiyotik.png'),
  genel: require('../../../assets/icons/supp-genel.png'),
  // category-based (from catalog)
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
};

const ALL_VALID = [
  'protein',
  'vitamin',
  'omega',
  'kreatin',
  'magnezyum',
  'probiyotik',
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

function getSuppIcon(type: string) {
  return SUPP_ICONS[ALL_VALID.includes(type) ? (type as SuppType) : 'genel'];
}

const SUPP_COLORS: Record<string, string> = {
  vitamin: '#FF9F0A',
  omega: '#0A84FF',
  magnezyum: '#BF5AF2',
  protein: '#FF6B35',
  kreatin: '#5AC8FA',
  probiyotik: '#34C759',
  genel: GREEN,
};

const { width: SW, height: SCREEN_H } = Dimensions.get('window');
const CARD_W = SW - 40;

// ─── Date Helpers ─────────────────────────────────────────────────────────────
const MONTHS_TR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];
const DAYS_TR = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const DAYS_S = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

function formatDate(d: Date) {
  return `${DAYS_TR[(d.getDay() + 6) % 7]}, ${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function toDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function getFirstDayOfMonth(y: number, m: number) {
  return (new Date(y, m, 1).getDay() + 6) % 7;
}

// ─── API Hook ─────────────────────────────────────────────────────────────────
function useSupplementApi() {
  const { session } = useSession();

  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = (await session?.getToken()) ?? null;
      console.log('[authFetch] token_full:', token);
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

  const fetchSupplements = useCallback(
    async (date: string): Promise<Supplement[]> => {
      const res = await authFetch(`/api/tracking/supplements?date=${date}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<Supplement[]>;
    },
    [authFetch],
  );

  const toggleTaken = useCallback(
    async (id: string, taken: boolean, date: string) => {
      const res = await authFetch(`/api/tracking/supplements/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ taken, date }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    },
    [authFetch],
  );

  const addSupplement = useCallback(
    async (data: {
      name: string;
      brand?: string;
      category?: string;
      type?: string;
      dosage: string;
      unit?: string;
      scheduleTimes?: string[];
      scheduleDays?: number[];
      reminderAt?: string;
    }) => {
      const res = await authFetch('/api/tracking/supplements', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<Supplement>;
    },
    [authFetch],
  );

  const updateSupplement = useCallback(
    async (
      id: string,
      data: {
        scheduleTimes?: string[];
        scheduleDays?: number[];
        reminderAt?: string | null;
        dosage?: string;
        unit?: string;
      },
    ) => {
      const res = await authFetch(`/api/tracking/supplements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<Supplement>;
    },
    [authFetch],
  );

  const toggleTakenAt = useCallback(
    async (id: string, taken: boolean, date: string, scheduledTime?: string) => {
      const res = await authFetch(`/api/tracking/supplements/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ taken, date, scheduledTime }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    },
    [authFetch],
  );

  const deleteSupplement = useCallback(
    async (id: string) => {
      const res = await authFetch(`/api/tracking/supplements/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    },
    [authFetch],
  );

  const fetchMonthly = useCallback(
    async (
      year: number,
      month: number,
    ): Promise<{
      days: Record<string, { total: number; taken: number }>;
      userCreatedAt: string;
    }> => {
      const res = await authFetch(`/api/tracking/supplements/monthly?year=${year}&month=${month}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    [authFetch],
  );

  const fetchRatings = useCallback(async (): Promise<
    Record<string, { rating: number; note: string | null; ratedAt: string }>
  > => {
    const res = await authFetch('/api/tracking/supplements/rating');
    if (!res.ok) return {};
    const data = await res.json();
    return data.ratings ?? {};
  }, [authFetch]);

  const submitRating = useCallback(
    async (supplementId: string, rating: number, note?: string) => {
      const res = await authFetch('/api/tracking/supplements/rating', {
        method: 'POST',
        body: JSON.stringify({ supplementId, rating, note }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    [authFetch],
  );

  return {
    fetchSupplements,
    toggleTaken,
    toggleTakenAt,
    addSupplement,
    updateSupplement,
    deleteSupplement,
    fetchMonthly,
    fetchRatings,
    submitRating,
  };
}

// ─── Discover Button ──────────────────────────────────────────────────────────
function DiscoverButton({ onPress }: { onPress: () => void }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(shimmer, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(2200),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    ).start();
  }, []);

  const shimmerX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-CARD_W, CARD_W * 1.2],
  });
  const borderColor = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(48,209,88,0.15)', 'rgba(48,209,88,0.55)'],
  });
  const shadowOp = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.22] });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.97,
          useNativeDriver: true,
          tension: 300,
          friction: 15,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 12,
        }).start()
      }
    >
      {/* native driver: scale transform only */}
      <Animated.View style={{ transform: [{ scale }], borderRadius: 22, marginTop: 12 }}>
        {/* JS driver: border + shadow color interpolation */}
        <Animated.View
          style={{
            borderRadius: 22,
            borderWidth: 1.5,
            borderColor,
            shadowColor: GREEN,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: shadowOp,
            shadowRadius: 16,
          }}
        >
          <View style={db.card}>
            <Animated.View
              pointerEvents="none"
              style={[db.shimmerGreen, { transform: [{ translateX: shimmerX }] }]}
            />
            <Animated.View
              pointerEvents="none"
              style={[db.shimmerWhite, { transform: [{ translateX: shimmerX }] }]}
            />
            <View style={db.top}>
              <Image
                source={require('../../../assets/icons/discover.png')}
                style={db.img}
                resizeMode="contain"
              />
              <View style={db.badge}>
                <Ionicons name="sparkles" size={11} color="#fff" />
                <Text style={db.badgeTxt}>AI Skorlaması</Text>
              </View>
            </View>
            <Text style={db.title}>Supplement Keşfet</Text>
            <Text style={db.sub}>Profiline göre AI'ın önerdiği takviyeler</Text>
            <View style={db.arrow}>
              <Text style={db.arrowTxt}>Keşfet</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const db = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  shimmerGreen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: CARD_W * 0.5,
    backgroundColor: 'rgba(48,209,88,0.13)',
    transform: [{ skewX: '-18deg' }],
  },
  shimmerWhite: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 28,
    backgroundColor: 'rgba(255,255,255,0.55)',
    transform: [{ skewX: '-18deg' }],
    left: CARD_W * 0.18,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  img: { width: 52, height: 52 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(48,209,88,0.1)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(48,209,88,0.2)',
  },
  badgeTxt: { fontSize: 12, fontWeight: '700', color: GREEN },
  title: { fontSize: 20, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  sub: { fontSize: 14, color: '#636366', marginTop: 4, lineHeight: 19 },
  arrow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 16 },
  arrowTxt: { fontSize: 14, fontWeight: '700', color: GREEN },
});

// ─── Arrow Button ─────────────────────────────────────────────────────────────
function ArrowBtn({
  name,
  onPress,
  disabled,
}: {
  name: 'chevron-back' | 'chevron-forward';
  onPress: () => void;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={
        disabled
          ? undefined
          : () =>
              Animated.spring(scale, {
                toValue: 0.75,
                useNativeDriver: true,
                tension: 400,
                friction: 15,
              }).start()
      }
      onPressOut={
        disabled
          ? undefined
          : () =>
              Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 300,
                friction: 12,
              }).start()
      }
      hitSlop={16}
      style={dh.arrow}
    >
      <Animated.View style={{ transform: [{ scale }], opacity: disabled ? 0.2 : 1 }}>
        <Ionicons name={name} size={22} color="#1C1C1E" />
      </Animated.View>
    </Pressable>
  );
}

// ─── Date Header ─────────────────────────────────────────────────────────────
function AddBtn({ onPress }: { onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      hitSlop={12}
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.85,
          useNativeDriver: true,
          tension: 400,
          friction: 14,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 12,
        }).start()
      }
      onPress={onPress}
    >
      <Animated.View style={[dh.addBtn, { transform: [{ scale }] }]}>
        <Ionicons name="add" size={28} color="#fff" />
      </Animated.View>
    </Pressable>
  );
}

function DateHeader({
  date,
  onPrev,
  onNext,
  onOpenCal,
  onBack,
  onAdd,
}: {
  date: Date;
  onPrev: () => void;
  onNext: () => void;
  onOpenCal: () => void;
  onBack: () => void;
  onAdd: () => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cur = new Date(date);
  cur.setHours(0, 0, 0, 0);
  const pillScale = useRef(new Animated.Value(1)).current;

  return (
    <View style={dh.wrap}>
      {/* Back */}
      <Pressable onPress={onBack} hitSlop={12} style={dh.sideBtn}>
        <Ionicons name="chevron-back" size={22} color="#1C1C1E" />
      </Pressable>

      {/* Date nav — center */}
      <View style={dh.center}>
        <ArrowBtn name="chevron-back" onPress={onPrev} />
        <Pressable
          onPress={onOpenCal}
          onPressIn={() =>
            Animated.spring(pillScale, {
              toValue: 0.95,
              useNativeDriver: true,
              tension: 400,
              friction: 15,
            }).start()
          }
          onPressOut={() =>
            Animated.spring(pillScale, {
              toValue: 1,
              useNativeDriver: true,
              tension: 300,
              friction: 12,
            }).start()
          }
          hitSlop={8}
        >
          <Animated.View style={[dh.datePill, { transform: [{ scale: pillScale }] }]}>
            <Text style={dh.dateTxt}>{formatDate(date)}</Text>
            <Ionicons name="calendar-outline" size={14} color="#8E8E93" style={{ marginLeft: 6 }} />
          </Animated.View>
        </Pressable>
        <ArrowBtn name="chevron-forward" onPress={onNext} disabled={cur >= today} />
      </View>

      {/* Add */}
      <AddBtn onPress={onAdd} />
    </View>
  );
}

const dh = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20 },
  sideBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  center: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  arrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  dateTxt: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
});

function getAdherenceColor(total: number, taken: number): string {
  if (total === 0) return '#C7C7CC';
  const ratio = taken / total;
  if (ratio >= 1.0) return '#30D158'; // tam yeşil
  if (ratio >= 0.6) return '#86C46A'; // açık yeşil
  if (ratio >= 0.4) return '#FFD60A'; // sarı
  if (ratio >= 0.2) return '#FF9F0A'; // koyu sarı
  if (ratio > 0) return '#FF6B35'; // açık kırmızı
  return '#FF3B30'; // hiç alınmadı
}

// ─── Calendar Modal ───────────────────────────────────────────────────────────
function CalendarModal({
  visible,
  current,
  onSelect,
  onClose,
  fetchMonthly,
}: {
  visible: boolean;
  current: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
  fetchMonthly: (
    year: number,
    month: number,
  ) => Promise<{ days: Record<string, { total: number; taken: number }>; userCreatedAt: string }>;
}) {
  const [viewYear, setViewYear] = useState(current.getFullYear());
  const [viewMonth, setViewMonth] = useState(current.getMonth());
  const [mounted, setMounted] = useState(false);
  const [monthData, setMonthData] = useState<Record<string, { total: number; taken: number }>>({});
  const [userCreatedAt, setUserCreatedAt] = useState<Date | null>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setViewYear(current.getFullYear());
      setViewMonth(current.getMonth());
      slideAnim.setValue(SCREEN_H);
      opAnim.setValue(0);
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
    } else if (mounted) {
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
        if (finished) setMounted(false);
      });
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    fetchMonthly(viewYear, viewMonth + 1)
      .then((data) => {
        setMonthData(data.days);
        setUserCreatedAt(new Date(data.userCreatedAt));
      })
      .catch(() => {});
  }, [visible, viewYear, viewMonth]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yearLock = current.getFullYear();
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfMonth = getFirstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isPrevDisabled = viewMonth === 0 && viewYear <= yearLock;
  const isNextDisabled = viewMonth === 11 && viewYear >= yearLock;
  const CELL_W = Math.floor((SW - 80) / 7);

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[cm.overlay, { opacity: opAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[cm.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={cm.handle} />
          <View style={cm.monthRow}>
            <Pressable
              onPress={() => {
                if (!isPrevDisabled) {
                  if (viewMonth === 0) {
                    setViewMonth(11);
                    setViewYear((y) => y - 1);
                  } else setViewMonth((m) => m - 1);
                }
              }}
              hitSlop={12}
              style={[cm.monthBtn, isPrevDisabled && { opacity: 0.2 }]}
            >
              <Ionicons name="chevron-back" size={20} color="#1C1C1E" />
            </Pressable>
            <Text style={cm.monthTxt}>
              {MONTHS_TR[viewMonth]} {viewYear}
            </Text>
            <Pressable
              onPress={() => {
                if (!isNextDisabled) {
                  if (viewMonth === 11) {
                    setViewMonth(0);
                    setViewYear((y) => y + 1);
                  } else setViewMonth((m) => m + 1);
                }
              }}
              hitSlop={12}
              style={[cm.monthBtn, isNextDisabled && { opacity: 0.2 }]}
            >
              <Ionicons name="chevron-forward" size={20} color="#1C1C1E" />
            </Pressable>
          </View>
          <View style={cm.daysRow}>
            {DAYS_S.map((d) => (
              <Text key={d} style={[cm.dayLabel, { width: CELL_W }]}>
                {d}
              </Text>
            ))}
          </View>
          <View style={cm.grid}>
            {cells.map((day, i) => {
              if (!day) return <View key={i} style={{ width: CELL_W, height: CELL_W }} />;
              const d = new Date(viewYear, viewMonth, day);
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = isSameDay(d, current);
              const isTod = isSameDay(d, today);
              const fut = d > today;
              const beforeReg = userCreatedAt
                ? d <
                  new Date(
                    userCreatedAt.getFullYear(),
                    userCreatedAt.getMonth(),
                    userCreatedAt.getDate(),
                  )
                : false;
              const dayStats = monthData[dateStr];
              const adherenceColor =
                !fut && !beforeReg && dayStats
                  ? getAdherenceColor(dayStats.total, dayStats.taken)
                  : null;

              return (
                <Pressable
                  key={i}
                  style={{
                    width: CELL_W,
                    height: CELL_W,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => {
                    onSelect(d);
                    onClose();
                  }}
                >
                  {({ pressed }) => (
                    <View
                      style={[
                        {
                          width: CELL_W - 6,
                          height: CELL_W - 6,
                          borderRadius: (CELL_W - 6) / 2,
                          alignItems: 'center',
                          justifyContent: 'center',
                        },
                        isSelected && { backgroundColor: adherenceColor ?? GREEN },
                        isTod &&
                          !isSelected && { borderWidth: 1.5, borderColor: adherenceColor ?? GREEN },
                        pressed && { opacity: 0.6 },
                      ]}
                    >
                      <Text
                        style={[
                          { fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
                          isSelected && { color: '#fff' },
                          isTod &&
                            !isSelected && { color: adherenceColor ?? GREEN, fontWeight: '700' },
                          fut && { color: '#C7C7CC' },
                          beforeReg && { color: '#D1D1D6' },
                          !isSelected &&
                            !isTod &&
                            !fut &&
                            !beforeReg &&
                            adherenceColor && { color: adherenceColor, fontWeight: '600' },
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
          <Pressable
            style={cm.todayBtn}
            onPress={() => {
              onSelect(new Date());
              onClose();
            }}
          >
            <Text style={cm.todayTxt}>Bugüne Git</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const cm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  monthBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  monthTxt: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
  daysRow: { flexDirection: 'row', marginBottom: 8 },
  dayLabel: { textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  todayBtn: {
    marginTop: 16,
    backgroundColor: 'rgba(48,209,88,0.1)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(48,209,88,0.2)',
  },
  todayTxt: { color: GREEN, fontSize: 15, fontWeight: '700' },
});

// ─── Add Modal ─────────────────────────────────────────────────────────────────
type AddMode = 'choose' | 'manual';

// ─── Manuel Form Sub-Components ───────────────────────────────────────────────

const CATEGORIES = [
  {
    key: 'Protein',
    label: 'Protein',
    icon: require('../../../assets/icons/cat-protein.png'),
    color: '#FF6B35',
  },
  {
    key: 'Vitamin',
    label: 'Vitamin',
    icon: require('../../../assets/icons/cat-vitamin.png'),
    color: '#FF9F0A',
  },
  {
    key: 'Mineral',
    label: 'Mineral',
    icon: require('../../../assets/icons/cat-mineral.png'),
    color: '#BF5AF2',
  },
  {
    key: 'Yağ Asidi',
    label: 'Yağ Asidi',
    icon: require('../../../assets/icons/cat-yagasidi.png'),
    color: '#0A84FF',
  },
  {
    key: 'Performans',
    label: 'Performans',
    icon: require('../../../assets/icons/cat-performans.png'),
    color: '#5AC8FA',
  },
  {
    key: 'Bitki',
    label: 'Bitki',
    icon: require('../../../assets/icons/cat-bitki.png'),
    color: '#34C759',
  },
  {
    key: 'Probiyotik',
    label: 'Probiyotik',
    icon: require('../../../assets/icons/cat-probiyotik.png'),
    color: '#30D158',
  },
  {
    key: 'Yağ Yakıcı',
    label: 'Yağ Yakıcı',
    icon: require('../../../assets/icons/cat-yakyakici.png'),
    color: '#FF3B30',
  },
  {
    key: 'Eklem & Kemik',
    label: 'Eklem',
    icon: require('../../../assets/icons/cat-eklem.png'),
    color: '#A2845E',
  },
  {
    key: 'Uyku & Rahatlama',
    label: 'Uyku',
    icon: require('../../../assets/icons/cat-uyku.png'),
    color: '#5E5CE6',
  },
  {
    key: 'Antioksidan',
    label: 'Antioksidan',
    icon: require('../../../assets/icons/cat-antioksidan.png'),
    color: '#FF2D55',
  },
];

const UNITS = ['mg', 'g', 'IU', 'mcg', 'ml', 'kapsül', 'tablet', 'damla'];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

const ROW_H = 40;
const PAD = 1;

// ─── PickerWheel ─────────────────────────────────────────────────────────────
// Sadece native ScrollView snap kullanılıyor. Seçili index ayrı state'te.
// onScroll yok — yani gereksiz re-render yok, tam smooth.
function PickerWheel({
  items,
  value,
  onChange,
  width,
  pad = PAD,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
  width: number;
  pad?: number;
}) {
  const ref = useRef<ScrollView>(null);
  const [selectedIdx, setSelectedIdx] = useState(() => Math.max(0, items.indexOf(value)));
  const isDragging = useRef(false);

  useEffect(() => {
    const i = Math.max(0, items.indexOf(value));
    setTimeout(() => ref.current?.scrollTo({ y: i * ROW_H, animated: false }), 30);
  }, []);

  return (
    <View style={{ width, height: ROW_H * (pad * 2 + 1), overflow: 'hidden' }}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ROW_H * pad }}
        onScrollBeginDrag={() => {
          isDragging.current = true;
        }}
        onMomentumScrollEnd={(e) => {
          isDragging.current = false;
          const i = Math.max(
            0,
            Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.y / ROW_H)),
          );
          setSelectedIdx(i);
          if (items[i] !== value) onChange(items[i]!);
        }}
        onScrollEndDrag={(e) => {
          if (!isDragging.current) return;
          isDragging.current = false;
          const i = Math.max(
            0,
            Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.y / ROW_H)),
          );
          ref.current?.scrollTo({ y: i * ROW_H, animated: true });
          setSelectedIdx(i);
          if (items[i] !== value) onChange(items[i]!);
        }}
      >
        {items.map((item, i) => {
          const diff = Math.abs(i - selectedIdx);
          const opacity = diff === 0 ? 1 : diff === 1 ? 0.45 : 0.18;
          const fontSize = diff === 0 ? 20 : 16;
          const fontWeight: '700' | '400' = diff === 0 ? '700' : '400';
          return (
            <View
              key={item}
              style={{ height: ROW_H, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize, fontWeight, color: '#1C1C1E', opacity }}>{item}</Text>
            </View>
          );
        })}
      </ScrollView>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: ROW_H * pad,
          height: ROW_H,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: '#3C3C4360',
        }}
      />
    </View>
  );
}

// ─── UnitPicker ───────────────────────────────────────────────────────────────
function UnitPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
    >
      {UNITS.map((u) => {
        const sel = u === value;
        return (
          <Pressable key={u} onPress={() => onChange(u)}>
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 9,
                borderRadius: 20,
                backgroundColor: sel ? '#1C1C1E' : '#F2F2F7',
                borderWidth: 1,
                borderColor: sel ? '#1C1C1E' : '#E5E5EA',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: sel ? '#fff' : '#636366' }}>
                {u}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ─── TimePicker ───────────────────────────────────────────────────────────────
function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [h, m] = (value || '08:30').split(':') as [string, string];
  return (
    <View
      style={{
        backgroundColor: '#F2F2F7',
        borderRadius: 14,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <PickerWheel
        items={HOURS}
        value={h}
        onChange={(v) => onChange(`${v}:${m}`)}
        width={(SW - 40) / 2 - 12}
        pad={2}
      />
      <Text
        style={{
          fontSize: 28,
          fontWeight: '600',
          color: '#1C1C1E',
          width: 24,
          textAlign: 'center',
        }}
      >
        :
      </Text>
      <PickerWheel
        items={MINUTES}
        value={m}
        onChange={(v) => onChange(`${h}:${v}`)}
        width={(SW - 40) / 2 - 12}
        pad={2}
      />
    </View>
  );
}

function ManualForm({
  onBack,
  onSave,
  saving,
}: {
  onBack: () => void;
  onSave: (data: {
    name: string;
    dosage: string;
    unit: string;
    type: string;
    reminderAt?: string;
    scheduleDays: number[];
  }) => void;
  saving: boolean;
}) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('mg');
  const [category, setCategory] = useState('Vitamin');
  const [reminder, setReminder] = useState('');
  const [showTime, setShowTime] = useState(false);
  const [timeVal, setTimeVal] = useState('08:30');
  const [selDays, setSelDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // varsayılan: her gün

  const toggleDay = (d: number) =>
    setSelDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));

  const catObj = CATEGORIES.find((c) => c.key === category) ?? CATEGORIES[0];

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={am.modalHeader}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="#1C1C1E" />
        </Pressable>
        <Text style={am.modalTitle}>Manuel Ekle</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Supplement Adı */}
      <View style={{ marginBottom: 14 }}>
        <Text style={am.fieldLabel}>Supplement Adı *</Text>
        <TextInput
          style={am.input}
          placeholder="Vitamin D3"
          placeholderTextColor="#C7C7CC"
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* Kategori */}
      <View style={{ marginBottom: 14 }}>
        <Text style={am.fieldLabel}>Kategori</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
        >
          {CATEGORIES.map((cat) => {
            const selected = category === cat.key;
            return (
              <Pressable key={cat.key} onPress={() => setCategory(cat.key)}>
                <View
                  style={[
                    mf.catChip,
                    selected && { borderColor: cat.color, backgroundColor: cat.color + '15' },
                  ]}
                >
                  <Image source={cat.icon} style={{ width: 22, height: 22 }} resizeMode="contain" />
                  <Text style={[mf.catLabel, selected && { color: cat.color, fontWeight: '700' }]}>
                    {cat.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Doz */}
      <View style={{ marginBottom: 14 }}>
        <Text style={am.fieldLabel}>Doz *</Text>
        <TextInput
          style={am.input}
          placeholder="5000"
          placeholderTextColor="#C7C7CC"
          value={dosage}
          onChangeText={setDosage}
          keyboardType="decimal-pad"
        />
      </View>

      {/* Birim */}
      <View style={{ marginBottom: 14 }}>
        <Text style={am.fieldLabel}>Birim</Text>
        <UnitPicker value={unit} onChange={setUnit} />
      </View>

      {/* Alınacak Günler */}
      <View style={{ marginBottom: 14 }}>
        <Text style={am.fieldLabel}>Alınacak Günler</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
          {DAYS_S.map((label, i) => {
            const sel = selDays.includes(i);
            return (
              <Pressable key={i} onPress={() => toggleDay(i)} style={{ flex: 1 }}>
                <View
                  style={{
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: sel ? '#1C1C1E' : '#F2F2F7',
                    borderWidth: 1,
                    borderColor: sel ? '#1C1C1E' : '#E5E5EA',
                  }}
                >
                  <Text
                    style={{ fontSize: 13, fontWeight: '600', color: sel ? '#fff' : '#8E8E93' }}
                  >
                    {label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Hatırlatıcı */}
      <View style={{ marginBottom: 20 }}>
        <Text style={am.fieldLabel}>Hatırlatıcı</Text>
        <Pressable onPress={() => setShowTime((v) => !v)}>
          <View style={[am.reminderRow, showTime && { borderColor: GREEN }]}>
            <Ionicons name="alarm-outline" size={20} color={showTime ? GREEN : '#8E8E93'} />
            <Text
              style={{
                flex: 1,
                fontSize: 15,
                color: reminder ? '#1C1C1E' : '#C7C7CC',
                marginLeft: 10,
              }}
            >
              {reminder || 'Saat seç'}
            </Text>
            {reminder ? (
              <Pressable
                hitSlop={8}
                onPress={(e) => {
                  e.stopPropagation();
                  setReminder('');
                  setShowTime(false);
                }}
              >
                <Ionicons name="close-circle" size={18} color="#C7C7CC" />
              </Pressable>
            ) : (
              <Ionicons name={showTime ? 'chevron-up' : 'chevron-down'} size={16} color="#C7C7CC" />
            )}
          </View>
        </Pressable>
        {showTime && (
          <TimePicker
            value={timeVal}
            onChange={(v) => {
              setTimeVal(v);
              setReminder(v);
            }}
          />
        )}
      </View>

      <Pressable
        onPress={
          saving
            ? undefined
            : () => {
                if (!name.trim() || !dosage.trim()) {
                  Alert.alert('Eksik Alan', 'Supplement adı ve doz zorunludur.');
                  return;
                }
                onSave({
                  name: name.trim(),
                  dosage: dosage.trim(),
                  unit,
                  type: category,
                  reminderAt: reminder || undefined,
                  scheduleDays: selDays,
                });
              }
        }
      >
        {({ pressed }) => (
          <View style={[am.saveBtnInner, (pressed || saving) && { opacity: 0.8 }]}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={am.saveBtnTxt}>Kaydet</Text>
            )}
          </View>
        )}
      </Pressable>
    </ScrollView>
  );
}

const mf = StyleSheet.create({
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9F9F9',
  },
  catLabel: { fontSize: 13, fontWeight: '500', color: '#636366' },
});

interface AddModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    brand?: string;
    dosage: string;
    unit?: string;
    scheduleTimes?: string[];
    scheduleDays?: number[];
    type?: string;
    reminderAt?: string;
  }) => Promise<void>;
  onOpenBarcode: () => void;
  onOpenPhoto: () => void;
}

function AddModal({ visible, onClose, onAdd, onOpenBarcode, onOpenPhoto }: AddModalProps) {
  const [mode, setMode] = useState<AddMode>('choose');
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setMode('choose');
      slideAnim.setValue(SCREEN_H);
      opAnim.setValue(0);
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
    } else if (mounted) {
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
        if (finished) setMounted(false);
      });
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[am.overlay, { opacity: opAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View style={[am.sheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={am.handle} />

            {mode === 'choose' && (
              <>
                <Text style={am.title}>Supplement Ekle</Text>
                <Text style={am.sub}>Nasıl eklemek istersin?</Text>
                <View style={{ gap: 10, marginTop: 20 }}>
                  {[
                    {
                      img: require('../../../assets/icons/add-barcode.png'),
                      label: 'Barkod Tara',
                      sub: 'Ürün barkodunu okut',
                      onPress: () => {
                        onClose();
                        onOpenBarcode();
                      },
                    },
                    {
                      img: require('../../../assets/icons/add-camera.png'),
                      label: 'Fotoğraf Çek',
                      sub: 'AI ile görsel analiz',
                      onPress: () => {
                        onClose();
                        onOpenPhoto();
                      },
                    },
                    {
                      img: require('../../../assets/icons/add-manuel.png'),
                      label: 'Manuel Ekle',
                      sub: 'Bilgileri kendin gir',
                      onPress: () => setMode('manual'),
                    },
                  ].map((opt) => (
                    <Pressable key={opt.label} onPress={opt.onPress}>
                      {({ pressed }) => (
                        <View style={[am.optRow, pressed && { opacity: 0.7 }]}>
                          <View style={am.optIcon}>
                            <Image
                              source={opt.img}
                              style={{ width: 56, height: 56 }}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={am.optLabel}>{opt.label}</Text>
                            <Text style={am.optSub}>{opt.sub}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {mode === 'manual' && (
              <ManualForm
                onBack={() => setMode('choose')}
                onSave={async (data) => {
                  setSaving(true);
                  try {
                    await onAdd(data);
                    onClose();
                  } catch {
                    Alert.alert('Hata', 'Supplement eklenemedi.');
                  } finally {
                    setSaving(false);
                  }
                }}
                saving={saving}
              />
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const am = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', marginBottom: 4 },
  sub: { fontSize: 14, color: '#8E8E93' },
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
  },
  optIcon: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  optLabel: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  optSub: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#636366', marginBottom: 6 },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1C1C1E',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  reminderHint: { fontSize: 12, color: '#C7C7CC', marginTop: 6 },
  saveBtnInner: {
    backgroundColor: GREEN,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
    marginTop: 8,
  },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

// ─── Swipeable Card ───────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 50;
const DELETE_W = 90;
const BTN_SIZE = 54;
const SNAP_X = -DELETE_W;

const MAX_PILLS = 3;

function isScheduledTimeFuture(scheduledTime: string): boolean {
  const now = new Date();
  const [h, m] = scheduledTime.split(':').map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const schedMin = (h ?? 0) * 60 + (m ?? 0);
  return schedMin > nowMin;
}

// ─── Time of day icon ─────────────────────────────────────────────────────────
function getTimeIcon(timeStr: string) {
  const h = parseInt(timeStr.split(':')[0] ?? '0', 10);
  if (h >= 5 && h < 12) return require('../../../assets/icons/time-sabah.png');
  if (h >= 12 && h < 17) return require('../../../assets/icons/time-ogle.png');
  if (h >= 17 && h < 21) return require('../../../assets/icons/time-aksam.png');
  return require('../../../assets/icons/time-gece.png');
}

// ─── Taken color (delay-based) ────────────────────────────────────────────────
// Returns color based on how late the supplement was taken vs scheduled time.
// delayMin < 30  → green, 30–120 → yellow gradient, 120+ → red gradient, not taken → null
function getTakenColor(scheduledTime: string, takenAt: string): string {
  const [sh, sm] = scheduledTime.split(':').map(Number);
  const takenDate = new Date(takenAt);
  const takenMin = takenDate.getHours() * 60 + takenDate.getMinutes();
  const schedMin = (sh ?? 0) * 60 + (sm ?? 0);
  const delayMin = takenMin - schedMin; // negative = early (treat as on time)

  if (delayMin < 30) return '#30D158'; // green

  if (delayMin < 120) {
    // 30→120 min: yellow #FFD60A → orange-yellow #FF9F0A
    const t = (delayMin - 30) / 90; // 0..1
    const r = Math.round(255);
    const g = Math.round(214 - t * (214 - 159)); // 214→159
    const b = Math.round(10);
    return `rgb(${r},${g},${b})`;
  }

  // 120+ min: red gradient, caps at 4hr
  const t = Math.min((delayMin - 120) / 120, 1); // 0..1
  const r = 255;
  const g = Math.round(59 - t * 59); // 59→0
  const b = Math.round(48 - t * 48); // 48→0
  return `rgb(${r},${g},${b})`;
}

function OverdueText({ time }: { time: string }) {
  const glow = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(glow, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.delay(400),
      ]),
    ).start();
    return () => glow.stopAnimation();
  }, []);
  return (
    <Animated.Text
      style={{ flex: 1, fontSize: 15, fontWeight: '600', color: '#FF3B30', opacity: glow }}
    >
      {time}
    </Animated.Text>
  );
}

// ─── ExpandCard ───────────────────────────────────────────────────────────────
// Ana kartın hemen altına yapışık açılan ayrı kart
function ExpandCard({
  supp,
  visible,
  onToggleTime,
  togglingId,
  readOnly,
}: {
  supp: Supplement;
  visible: boolean;
  onToggleTime: (id: string, taken: boolean, scheduledTime?: string) => void;
  togglingId: string | null;
  readOnly?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const translateY = useRef(new Animated.Value(-8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 160,
            friction: 18,
          }),
          Animated.spring(opacity, {
            toValue: 1,
            useNativeDriver: true,
            tension: 200,
            friction: 20,
          }),
        ]).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -6,
          duration: 160,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 130,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setMounted(false);
          translateY.setValue(-8);
        }
      });
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], marginTop: 4, marginBottom: 10 }}>
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          overflow: 'hidden',
        }}
      >
        {supp.scheduleTimes.map((t, idx) => {
          const log = supp.takenLogs.find((l) => l.scheduledTime === t);
          const isTaken = !!log;
          const isFuture = !isTaken && isScheduledTimeFuture(t);
          const isOverdue = !isTaken && !isFuture;
          const takenColor = isTaken ? getTakenColor(t, log!.takenAt) : null;
          const isLast = idx === supp.scheduleTimes.length - 1;
          return (
            <View key={t}>
              <Pressable
                onPress={() => {
                  if (readOnly || isFuture) return;
                  if (isTaken) {
                    Alert.alert(
                      'Takviyeyi geri al?',
                      'Bu takviyeyi alınmadı olarak işaretlemek istediğine emin misin?',
                      [
                        { text: 'İptal', style: 'cancel' },
                        {
                          text: 'Devam Et',
                          style: 'destructive',
                          onPress: () => onToggleTime(supp.id, false, t),
                        },
                      ],
                    );
                    return;
                  }
                  onToggleTime(supp.id, true, t);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 13,
                }}
              >
                {/* Dikey bağlantı çizgisi + vakit ikonu */}
                <View style={{ width: 36, alignItems: 'center', marginRight: 10 }}>
                  {idx > 0 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -13,
                        left: 17,
                        width: 1.5,
                        height: 13,
                        backgroundColor: '#E5E5EA',
                      }}
                    />
                  )}
                  <Image
                    source={getTimeIcon(t)}
                    style={{ width: 34, height: 34, opacity: isFuture ? 0.2 : isTaken ? 1 : 0.4 }}
                    resizeMode="contain"
                  />
                  {!isLast && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 34,
                        left: 17,
                        width: 1.5,
                        height: 13,
                        backgroundColor: '#E5E5EA',
                      }}
                    />
                  )}
                </View>
                {isOverdue ? (
                  <OverdueText time={t} />
                ) : (
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      fontWeight: '600',
                      color: isFuture ? '#C7C7CC' : (takenColor ?? '#1C1C1E'),
                    }}
                  >
                    {t}
                  </Text>
                )}
                {togglingId === `${supp.id}_${t}` ? (
                  <ActivityIndicator
                    size={16}
                    color={takenColor ?? (isOverdue ? '#FF3B30' : isFuture ? '#C7C7CC' : GREEN)}
                  />
                ) : isTaken ? (
                  <Ionicons name="checkmark-circle" size={22} color={takenColor!} />
                ) : (
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 1.5,
                      borderColor: isFuture ? '#E5E5EA' : '#D1D1D6',
                    }}
                  />
                )}
              </Pressable>
              {!isLast && (
                <View
                  style={{
                    height: StyleSheet.hairlineWidth,
                    backgroundColor: '#F2F2F7',
                    marginLeft: 50,
                  }}
                />
              )}
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

// ─── PillItem ─────────────────────────────────────────────────────────────────
function PillItem({
  t,
  supp,
  onToggleTime,
  togglingId,
  readOnly,
}: {
  t: string;
  supp: Supplement;
  onToggleTime: (id: string, taken: boolean, scheduledTime?: string) => void;
  togglingId: string | null;
  readOnly?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const log = supp.takenLogs.find((l) => l.scheduledTime === t);
  const isTaken = !!log;
  const isFuture = !isTaken && isScheduledTimeFuture(t);
  const takenColor = isTaken ? getTakenColor(t, log!.takenAt) : null;

  const handlePress = () => {
    if (readOnly || isFuture) return;
    if (isTaken) {
      Alert.alert(
        'Takviyeyi geri al?',
        'Bu takviyeyi alınmadı olarak işaretlemek istediğine emin misin?',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Devam Et',
            style: 'destructive',
            onPress: () => onToggleTime(supp.id, false, t),
          },
        ],
      );
      return;
    }
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.85, useNativeDriver: true, tension: 400, friction: 8 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();
    onToggleTime(supp.id, true, t);
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        style={[
          sw.timePill,
          isTaken && { backgroundColor: takenColor!, borderColor: takenColor! },
          isFuture && { backgroundColor: '#F2F2F7', borderColor: '#E5E5EA', opacity: 0.5 },
          readOnly && !isTaken && { opacity: 0.4 },
        ]}
      >
        {togglingId === `${supp.id}_${t}` ? (
          <ActivityIndicator
            size={10}
            color={isTaken ? '#fff' : isFuture ? '#C7C7CC' : '#FF3B30'}
          />
        ) : (
          <>
            {isTaken && <Ionicons name="checkmark" size={11} color="#fff" />}
            <Text
              style={[sw.timeTxt, isTaken && { color: '#fff' }, isFuture && { color: '#C7C7CC' }]}
            >
              {t}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── RateChip ────────────────────────────────────────────────────────────────
function RateChip({
  existingRating,
  onRate,
}: {
  existingRating?: number | null;
  onRate: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePress = (e: any) => {
    e.stopPropagation?.();
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, tension: 500, friction: 8 }),
        Animated.timing(opacity, { toValue: 0.6, useNativeDriver: true, duration: 80 }),
      ]),
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }),
        Animated.timing(opacity, { toValue: 1, useNativeDriver: true, duration: 120 }),
      ]),
    ]).start();
    onRate();
  };

  return (
    <Pressable onPress={handlePress} hitSlop={6}>
      <Animated.View style={[sw.rateChip, { transform: [{ scale }], opacity }]}>
        {existingRating ? (
          <>
            <Text style={sw.rateEmoji}>{['😞', '😐', '🙂', '😊', '🤩'][existingRating - 1]}</Text>
            <Text style={sw.rateTxt}>Etki değerlendirmem</Text>
          </>
        ) : (
          <>
            <Ionicons name="star-outline" size={11} color="#AF52DE" />
            <Text style={[sw.rateTxt, { color: '#AF52DE' }]}>Etkisini değerlendir</Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─── SwipeableCard ────────────────────────────────────────────────────────────
function SwipeableCard({
  supp,
  onPress,
  onDelete,
  onToggleTime,
  togglingId,
  index = 0,
  existingRating,
  onRate,
  readOnly,
}: {
  supp: Supplement;
  onPress: () => void;
  onDelete: () => void;
  onToggleTime: (id: string, taken: boolean, scheduledTime?: string) => void;
  togglingId: string | null;
  index?: number;
  existingRating?: number | null;
  onRate: () => void;
  readOnly?: boolean;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const swipedRef = useRef(false);

  // Entrance animation
  const entryOp = useRef(new Animated.Value(0)).current;
  const entryTy = useRef(new Animated.Value(28)).current;
  const entryScale = useRef(new Animated.Value(0.96)).current;
  useEffect(() => {
    const delay = Math.min(index, 10) * 55;
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.spring(entryOp, { toValue: 1, useNativeDriver: true, tension: 60, friction: 12 }),
        Animated.spring(entryTy, { toValue: 0, useNativeDriver: true, tension: 60, friction: 12 }),
        Animated.spring(entryScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 12,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);
  const [cardH, setCardH] = useState(0);
  const animHeight = useRef(new Animated.Value(1)).current;
  const prevTimesLen = useRef(supp.scheduleTimes.length);
  useEffect(() => {
    if (prevTimesLen.current !== supp.scheduleTimes.length) {
      prevTimesLen.current = supp.scheduleTimes.length;
      setCardH(0); // yeniden ölç
    }
  }, [supp.scheduleTimes.length]);
  const [expanded, setExpanded] = useState(false);

  const btnWidth = useRef(new Animated.Value(BTN_SIZE)).current;
  const btnRadius = useRef(new Animated.Value(BTN_SIZE / 2)).current;
  const btnBg = useRef(new Animated.Value(0)).current;
  const iconY = useRef(new Animated.Value(0)).current;
  const labelOp = useRef(new Animated.Value(0)).current;
  const labelY = useRef(new Animated.Value(-12)).current;

  const resetBtn = useCallback(() => {
    btnWidth.setValue(BTN_SIZE);
    btnRadius.setValue(BTN_SIZE / 2);
    btnBg.setValue(0);
    iconY.setValue(0);
    labelOp.setValue(0);
    labelY.setValue(-12);
  }, []);

  const openDelete = useCallback(() => {
    swipedRef.current = true;
    Animated.spring(translateX, {
      toValue: SNAP_X,
      useNativeDriver: false,
      tension: 180,
      friction: 20,
    }).start(() => {
      Animated.parallel([
        Animated.timing(btnWidth, {
          toValue: DELETE_W,
          duration: 280,
          useNativeDriver: false,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(btnRadius, { toValue: 16, duration: 280, useNativeDriver: false }),
        Animated.timing(btnBg, { toValue: 1, duration: 280, useNativeDriver: false }),
        Animated.timing(iconY, {
          toValue: 6,
          duration: 260,
          useNativeDriver: false,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(labelOp, { toValue: 1, duration: 200, delay: 100, useNativeDriver: false }),
        Animated.timing(labelY, {
          toValue: 0,
          duration: 240,
          delay: 60,
          useNativeDriver: false,
          easing: Easing.out(Easing.ease),
        }),
      ]).start();
    });
  }, []);

  const closeDelete = useCallback(() => {
    swipedRef.current = false;
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: false,
        tension: 200,
        friction: 22,
      }),
      Animated.timing(btnWidth, { toValue: BTN_SIZE, duration: 180, useNativeDriver: false }),
      Animated.timing(btnRadius, { toValue: BTN_SIZE / 2, duration: 180, useNativeDriver: false }),
      Animated.timing(btnBg, { toValue: 0, duration: 180, useNativeDriver: false }),
      Animated.timing(iconY, { toValue: 0, duration: 150, useNativeDriver: false }),
      Animated.timing(labelOp, { toValue: 0, duration: 100, useNativeDriver: false }),
      Animated.timing(labelY, { toValue: -12, duration: 100, useNativeDriver: false }),
    ]).start();
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -400,
        duration: 320,
        useNativeDriver: false,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
      Animated.timing(btnWidth, {
        toValue: 500,
        duration: 320,
        useNativeDriver: false,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
    ]).start(() => {
      Animated.timing(animHeight, {
        toValue: 0,
        duration: 260,
        useNativeDriver: false,
        easing: Easing.inOut(Easing.ease),
      }).start(() => {
        resetBtn();
        onDelete();
      });
    });
  }, [onDelete, resetBtn]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 6 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.8,
      onPanResponderGrant: () => {
        if (swipedRef.current) closeDelete();
      },
      onPanResponderMove: (_, gs) => {
        if (!swipedRef.current && gs.dx < 0) translateX.setValue(Math.max(gs.dx, SNAP_X - 5));
      },
      onPanResponderRelease: (_, gs) => {
        if (!swipedRef.current && gs.dx < -SWIPE_THRESHOLD) openDelete();
        else if (!swipedRef.current)
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
            tension: 200,
            friction: 22,
          }).start();
      },
    }),
  ).current;

  const hasTimes = supp.scheduleTimes.length > 0;
  const hasOverflow = supp.scheduleTimes.length > MAX_PILLS;
  const isAllTaken = hasTimes
    ? supp.scheduleTimes.every((t) => supp.takenLogs.some((l) => l.scheduledTime === t))
    : supp.taken;
  const bgColor = btnBg.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgb(28,28,30)', 'rgb(255,59,48)'],
  });

  return (
    <Animated.View
      style={{
        marginBottom: expanded ? 0 : 10,
        zIndex: expanded ? 10 : 1,
        opacity: entryOp,
        transform: [{ translateY: entryTy }, { scale: entryScale }],
      }}
    >
      <Animated.View
        style={{
          height:
            cardH > 0
              ? animHeight.interpolate({ inputRange: [0, 1], outputRange: [0, cardH] })
              : undefined,
          overflow: 'hidden',
        }}
        onLayout={(e) => {
          if (cardH === 0) setCardH(e.nativeEvent.layout.height);
        }}
      >
        <View style={{ position: 'relative' }}>
          {/* Sil butonu */}
          <View style={sw.deleteArea}>
            <Animated.View
              style={[
                sw.deleteCircle,
                { width: btnWidth, borderRadius: btnRadius, backgroundColor: bgColor },
              ]}
            >
              <Pressable onPress={handleDeleteConfirm} style={sw.deletePressable}>
                <Animated.Text
                  style={[sw.deleteLbl, { opacity: labelOp, transform: [{ translateY: labelY }] }]}
                >
                  Sil
                </Animated.Text>
                <Animated.View style={{ transform: [{ translateY: iconY }] }}>
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                </Animated.View>
              </Pressable>
            </Animated.View>
          </View>

          {/* Ana kart */}
          <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
            <Pressable onPress={() => (swipedRef.current ? closeDelete() : onPress())}>
              <View style={sw.card}>
                <View
                  style={[
                    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
                    isAllTaken && { opacity: 0.4 },
                  ]}
                >
                  <View
                    style={[
                      sw.iconWrap,
                      { backgroundColor: (SUPP_COLORS[supp.type] ?? GREEN) + '15' },
                    ]}
                  >
                    <Image
                      source={getSupplementIcon(supp.name, supp.category ?? supp.type)}
                      style={sw.icon}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        sw.name,
                        isAllTaken && { textDecorationLine: 'line-through', color: '#8E8E93' },
                      ]}
                    >
                      {supp.name}
                    </Text>
                    <Text style={sw.meta}>
                      {supp.dosage}
                      {supp.unit}
                    </Text>
                    {hasTimes ? (
                      <View
                        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}
                      >
                        {!expanded &&
                          supp.scheduleTimes
                            .slice(0, MAX_PILLS)
                            .map((t) => (
                              <PillItem
                                key={t}
                                t={t}
                                supp={supp}
                                onToggleTime={onToggleTime}
                                togglingId={togglingId}
                                readOnly={readOnly}
                              />
                            ))}
                        {hasOverflow && (
                          <Pressable
                            onPress={() => setExpanded((v) => !v)}
                            style={[
                              sw.timePill,
                              {
                                borderColor: expanded ? GREEN : '#D1D1D6',
                                backgroundColor: expanded ? GREEN + '18' : '#F2F2F7',
                              },
                            ]}
                          >
                            <Text style={[sw.timeTxt, { color: expanded ? GREEN : '#8E8E93' }]}>
                              {expanded ? '▲' : `+${supp.scheduleTimes.length - MAX_PILLS}`}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    ) : (
                      <Text style={[sw.meta, { marginTop: 2, color: '#C7C7CC', fontSize: 12 }]}>
                        Saat ayarlanmadı · detaya dokun
                      </Text>
                    )}
                    {supp.aiNote && (
                      <View style={sw.aiRow}>
                        <Ionicons name="sparkles" size={11} color={GREEN} />
                        <Text style={sw.aiNote} numberOfLines={1}>
                          {supp.aiNote}
                        </Text>
                      </View>
                    )}
                    {/* Rating chip */}
                    <RateChip existingRating={existingRating} onRate={onRate} />
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Expand kart — animHeight'ın dışında, ayrı kart olarak açılıyor */}
      {hasOverflow && (
        <ExpandCard
          supp={supp}
          visible={expanded}
          onToggleTime={onToggleTime}
          togglingId={togglingId}
          readOnly={readOnly}
        />
      )}
    </Animated.View>
  );
}

const sw = StyleSheet.create({
  deleteArea: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 4,
  },
  deleteCircle: {
    height: BTN_SIZE,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePressable: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  deleteLbl: { color: '#fff', fontSize: 12, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 38, height: 38 },
  name: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  meta: { fontSize: 13, color: '#8E8E93', marginTop: 1 },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#D1D1D6',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timeTxt: { fontSize: 12, fontWeight: '700', color: '#636366' },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  aiNote: { flex: 1, fontSize: 11, color: '#636366' },
  rateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#F5E8FF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rateEmoji: { fontSize: 11 },
  rateTxt: { fontSize: 11, fontWeight: '600', color: '#636366' },
});

// ─── AnimatedTimeRow ─────────────────────────────────────────────────────────
function AnimatedTimeRow({
  t,
  isTaken,
  isToggling,
  onToggle,
  onRemove,
}: {
  t: string;
  isTaken: boolean;
  isToggling: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const checkScale = useRef(new Animated.Value(1)).current;
  const rowScale = useRef(new Animated.Value(0.92)).current;
  const rowOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(rowScale, { toValue: 1, useNativeDriver: true, tension: 180, friction: 14 }),
      Animated.timing(rowOp, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleToggle = () => {
    Animated.sequence([
      Animated.spring(checkScale, {
        toValue: 0.75,
        useNativeDriver: true,
        tension: 400,
        friction: 8,
      }),
      Animated.spring(checkScale, {
        toValue: 1.2,
        useNativeDriver: true,
        tension: 200,
        friction: 6,
      }),
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={[sds.timeRow, { opacity: rowOp, transform: [{ scale: rowScale }] }]}>
      <Animated.View style={{ transform: [{ scale: checkScale }] }}>
        <Pressable
          style={[sds.timeCheck, isTaken && { backgroundColor: GREEN, borderColor: GREEN }]}
          onPress={handleToggle}
        >
          {isToggling ? (
            <ActivityIndicator size={12} color={isTaken ? '#fff' : GREEN} />
          ) : (
            isTaken && <Ionicons name="checkmark" size={14} color="#fff" />
          )}
        </Pressable>
      </Animated.View>
      <Text style={[sds.timeTxt, isTaken && { color: GREEN, fontWeight: '700' }]}>{t}</Text>
      <Pressable onPress={onRemove} hitSlop={8} style={{ marginLeft: 'auto' }}>
        <Ionicons name="close-circle" size={20} color="#C7C7CC" />
      </Pressable>
    </Animated.View>
  );
}

// ─── AnimatedSaveButton ───────────────────────────────────────────────────────
function AnimatedSaveButton({ onPress, saving }: { onPress?: () => void; saving: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 8,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], marginTop: 20 }}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View style={[sds.saveBtn, saving && { opacity: 0.8 }]}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={sds.saveBtnTxt}>Kaydet</Text>}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Supplement Detail Sheet ──────────────────────────────────────────────────
const { height: SCREEN_H2 } = Dimensions.get('window');

function SupplementDetailSheet({
  supp,
  visible,
  date,
  onClose,
  onDelete,
  onUpdate,
  onToggleTime,
  togglingId,
}: {
  supp: Supplement | null;
  visible: boolean;
  date: string;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: { scheduleTimes?: string[]; reminderAt?: string | null }) => void;
  onToggleTime: (id: string, taken: boolean, scheduledTime?: string) => void;
  togglingId: string | null;
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H2)).current;
  const opAnim = useRef(new Animated.Value(0)).current;
  const [snapshot, setSnapshot] = useState<Supplement | null>(null);
  const [newTime, setNewTime] = useState('08:00');
  const [localTimes, setLocalTimes] = useState<string[]>([]);
  const [localReminder, setLocalReminder] = useState('');
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && supp) {
      setSnapshot(supp);
      setLocalTimes(supp.scheduleTimes ?? []);
      setLocalReminder(supp.reminderAt ?? '');
      setNewTime('');
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
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_H2,
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
  }, [visible]);

  if (!snapshot) return null;

  const data = snapshot;
  const scoreColors: Record<string, { dot: string; bg: string; label: string }> = {
    green: { dot: '#22C55E', bg: '#F0FDF4', label: 'Önerilir' },
    yellow: { dot: '#EAB308', bg: '#FEFCE8', label: 'Dikkatli' },
    red: { dot: '#F43F5E', bg: '#FFF1F2', label: 'Riskli' },
  };
  const sc = data.aiScore ? scoreColors[data.aiScore] : null;

  const addTime = () => {
    const t = newTime.trim();
    if (!t.match(/^\d{2}:\d{2}$/)) return;
    if (localTimes.includes(t)) return;
    setLocalTimes((prev) => [...prev, t].sort());
    setNewTime('');
  };

  const removeTime = (t: string) => setLocalTimes((prev) => prev.filter((x) => x !== t));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(data.id, {
        scheduleTimes: localTimes,
        reminderAt: localReminder || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Takviyeyi Sil', `"${data.name}" silinsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          onDelete(data.id);
          onClose();
        },
      },
    ]);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: opAnim }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[sds.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle + kapat butonu */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Pressable onPress={onClose} hitSlop={12} style={{ padding: 4 }}>
            <Ionicons name="chevron-down" size={24} color="#8E8E93" />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={sds.handle} />
          </View>
          <View style={{ width: 32 }} />
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={sds.header}>
            <View
              style={[sds.iconWrap, { backgroundColor: (SUPP_COLORS[data.type] ?? GREEN) + '15' }]}
            >
              <Image
                source={getSupplementIcon(data.name, data.category ?? data.type)}
                style={sds.icon}
                resizeMode="contain"
              />
            </View>
            <View style={{ flex: 1 }}>
              {sc && (
                <View style={[sds.badge, { backgroundColor: sc.bg }]}>
                  <View style={[sds.dot, { backgroundColor: sc.dot }]} />
                  <Text style={[sds.badgeTxt, { color: sc.dot }]}>{sc.label}</Text>
                </View>
              )}
              <Text style={sds.name}>{data.name}</Text>
              <Text style={sds.sub}>
                {data.brand ? `${data.brand} · ` : ''}
                {data.dosage}
                {data.unit}
              </Text>
            </View>
          </View>

          {/* AI Note */}
          {data.aiNote && (
            <View
              style={[
                sds.aiBox,
                {
                  borderColor: sc?.dot ? sc.dot + '40' : '#E5E5EA',
                  backgroundColor: sc?.bg ?? '#F2F2F7',
                },
              ]}
            >
              <Ionicons
                name="sparkles"
                size={13}
                color={sc?.dot ?? GREEN}
                style={{ marginBottom: 4 }}
              />
              <Text style={[sds.aiNote, { color: '#3C3C43' }]}>{data.aiNote}</Text>
            </View>
          )}

          {/* Alınacak Saatler */}
          <Text style={sds.sectionTitle}>Alınacak Saatler</Text>
          <Text style={sds.sectionSub}>Her saat için ayrı takip yapılır</Text>

          <View style={{ gap: 8, marginTop: 10, marginBottom: 14 }}>
            {localTimes.map((t) => (
              <AnimatedTimeRow
                key={t}
                t={t}
                isTaken={(supp?.takenTimes ?? []).includes(t)}
                isToggling={togglingId === `${data.id}_${t}`}
                onToggle={() => onToggleTime(data.id, !(supp?.takenTimes ?? []).includes(t), t)}
                onRemove={() => removeTime(t)}
              />
            ))}
          </View>

          {/* Saat ekle — picker */}
          <TimePicker value={newTime} onChange={setNewTime} />
          <Pressable
            onPress={addTime}
            style={[
              sds.addTimeBtn,
              { marginTop: 10, alignSelf: 'stretch', justifyContent: 'center' },
            ]}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={sds.addTimeTxt}>Ekle</Text>
          </Pressable>

          {/* Bildirim */}
          <Text style={[sds.sectionTitle, { marginTop: 24 }]}>Bildirim</Text>
          <Text style={sds.sectionSub}>Her alım saatinde ayrı bildirim alırsın</Text>
          <Pressable
            onPress={() => {
              if (!localReminder) setLocalReminder('08:00');
              setShowReminderPicker((v) => !v);
            }}
            style={{ marginTop: 10 }}
          >
            <View style={[am.reminderRow, showReminderPicker && { borderColor: GREEN }]}>
              <Ionicons
                name="alarm-outline"
                size={20}
                color={showReminderPicker ? GREEN : '#8E8E93'}
              />
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: localReminder ? '#1C1C1E' : '#C7C7CC',
                  marginLeft: 10,
                }}
              >
                {localReminder || 'Saat seç'}
              </Text>
              {localReminder ? (
                <Pressable
                  hitSlop={8}
                  onPress={(e) => {
                    e.stopPropagation();
                    setLocalReminder('');
                    setShowReminderPicker(false);
                  }}
                >
                  <Ionicons name="close-circle" size={18} color="#C7C7CC" />
                </Pressable>
              ) : (
                <Ionicons
                  name={showReminderPicker ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#C7C7CC"
                />
              )}
            </View>
          </Pressable>
          {showReminderPicker && (
            <TimePicker value={localReminder || '08:00'} onChange={(v) => setLocalReminder(v)} />
          )}

          {/* Kaydet */}
          <AnimatedSaveButton onPress={saving ? undefined : handleSave} saving={saving} />

          {/* Sil */}
          <Pressable onPress={handleDelete} style={{ marginTop: 10 }}>
            {({ pressed }) => (
              <View style={[sds.deleteBtn, pressed && { opacity: 0.7 }]}>
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                <Text style={sds.deleteBtnTxt}>Takviyeyi Sil</Text>
              </View>
            )}
          </Pressable>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const sds = StyleSheet.create({
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
    maxHeight: '92%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    alignSelf: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 52, height: 52 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  badgeTxt: { fontSize: 12, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.4 },
  sub: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  aiBox: { borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1 },
  aiNote: { fontSize: 14, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.3 },
  sectionSub: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timeCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeTxt: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  addTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addTimeInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GREEN,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addTimeTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  saveBtn: { backgroundColor: GREEN, paddingVertical: 16, alignItems: 'center', borderRadius: 16 },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
  },
  deleteBtnTxt: { color: '#FF3B30', fontSize: 15, fontWeight: '700' },
});

// ─── Date Content ─────────────────────────────────────────────────────────────
interface DateContentProps {
  date: Date;
  direction: number;
  supplements: Supplement[];
  loading: boolean;
  error: string | null;
  onDelete: (id: string) => void;
  onOpenDetail: (s: Supplement) => void;
  onToggleTime: (id: string, taken: boolean, scheduledTime?: string) => void;
  togglingId: string | null;
  ratings: Record<string, { rating: number; note: string | null; ratedAt: string }>;
  onRate: (s: Supplement) => void;
}

function DateContent({
  date,
  direction,
  supplements,
  loading,
  error,
  onDelete,
  onOpenDetail,
  onToggleTime,
  togglingId,
  ratings,
  onRate,
}: DateContentProps) {
  const slideX = useRef(new Animated.Value(direction * 60)).current;
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    slideX.setValue(direction * 60);
    op.setValue(0);
    Animated.parallel([
      Animated.spring(slideX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 220,
        friction: 24,
        velocity: 8,
      }),
      Animated.timing(op, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [date.toDateString()]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selDate = new Date(date);
  selDate.setHours(0, 0, 0, 0);
  const readOnly = selDate.getTime() !== today.getTime();

  // Her supplement için scheduleTimes varsa her saat ayrı sayılır, yoksa supplement başına 1
  const totalDoses = supplements.reduce(
    (acc, s) => acc + (s.scheduleTimes.length > 0 ? s.scheduleTimes.length : 1),
    0,
  );
  const takenDoses = supplements.reduce((acc, s) => {
    if (s.scheduleTimes.length > 0) {
      // Sadece scheduleTimes içindeki saatleri say, fazlasını ignore et
      const validTaken = s.takenTimes.filter((t) => s.scheduleTimes.includes(t));
      return acc + Math.min(validTaken.length, s.scheduleTimes.length);
    }
    return acc + (s.taken ? 1 : 0);
  }, 0);
  const takenCount = takenDoses;
  const total = totalDoses;
  const pct = total > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  const progressAnim = useRef(new Animated.Value(pct / 100)).current;
  const countAnim = useRef(new Animated.Value(pct)).current;
  const prevPct = useRef(pct);
  const [shownPct, setShownPct] = useState(pct);

  useEffect(() => {
    const listener = countAnim.addListener(({ value }) => setShownPct(Math.round(value)));
    return () => countAnim.removeListener(listener);
  }, []);

  useEffect(() => {
    if (prevPct.current === pct) return;
    prevPct.current = pct;
    Animated.timing(progressAnim, {
      toValue: pct / 100,
      duration: 1100,
      useNativeDriver: false,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    }).start();
    Animated.timing(countAnim, {
      toValue: pct,
      duration: 1100,
      useNativeDriver: false,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    }).start();
  }, [pct]);

  return (
    <Animated.View style={{ opacity: op, transform: [{ translateX: slideX }] }}>
      {readOnly && (
        <View style={ct.readOnlyBanner}>
          <Ionicons name="lock-closed-outline" size={14} color="#8E8E93" />
          <Text style={ct.readOnlyTxt}>Geçmiş ve gelecek tarihlerde değişiklik yapılamaz</Text>
        </View>
      )}

      <View style={ct.summaryCard}>
        <View style={{ flex: 1 }}>
          <Text style={ct.summaryLabel}>Günlük ilerleme</Text>
          <Text style={ct.summaryVal}>
            {takenCount}/{total} alındı
          </Text>
          <View style={ct.progressBg}>
            <Animated.View
              style={[
                ct.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: progressAnim.interpolate({
                    inputRange: [0, 0.25, 0.5, 0.75, 1],
                    outputRange: ['#FF3B30', '#FF6914', '#FFCC00', '#8CD64A', '#30D158'],
                  }),
                },
              ]}
            />
          </View>
        </View>
        <View style={ct.pctWrap}>
          <Animated.Text
            style={[
              ct.pctTxt,
              {
                color: progressAnim.interpolate({
                  inputRange: [0, 0.25, 0.5, 0.75, 1],
                  outputRange: ['#FF3B30', '#FF6914', '#FFCC00', '#8CD64A', '#30D158'],
                }),
              },
            ]}
          >
            {shownPct}%
          </Animated.Text>
          <Text style={ct.pctLabel}>tamamlandı</Text>
        </View>
      </View>

      <Text style={ct.listTitle}>Takviyelerim</Text>

      {loading && (
        <View style={{ alignItems: 'center', padding: 32 }}>
          <ActivityIndicator color={GREEN} size="large" />
        </View>
      )}

      {!loading && error && (
        <View style={ct.errorBox}>
          <Ionicons name="alert-circle-outline" size={20} color="#FF453A" />
          <Text style={ct.errorTxt}>{error}</Text>
        </View>
      )}

      {!loading && !error && supplements.length === 0 && (
        <View style={ct.emptyBox}>
          <Ionicons name="fitness-outline" size={40} color="#C7C7CC" />
          <Text style={ct.emptyTitle}>Takviye yok</Text>
          <Text style={ct.emptyTxt}>Sağ üstteki + ile takviye ekle</Text>
        </View>
      )}

      {!loading &&
        supplements.map((s, idx) => (
          <SwipeableCard
            key={s.id}
            index={idx}
            supp={s}
            onPress={() => onOpenDetail(s)}
            onDelete={() => onDelete(s.id)}
            onToggleTime={onToggleTime}
            togglingId={togglingId}
            existingRating={ratings[s.id]?.rating ?? null}
            onRate={() => onRate(s)}
            readOnly={readOnly}
          />
        ))}
    </Animated.View>
  );
}

const ct = StyleSheet.create({
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  readOnlyTxt: { color: '#8E8E93', fontSize: 13 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  summaryLabel: { color: '#8E8E93', fontSize: 13 },
  summaryVal: { color: '#1C1C1E', fontSize: 22, fontWeight: '800', marginVertical: 6 },
  progressBg: { height: 6, backgroundColor: '#F2F2F7', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: GREEN, borderRadius: 3 },
  pctWrap: { alignItems: 'center', marginLeft: 20 },
  pctTxt: { color: GREEN, fontSize: 28, fontWeight: '800' },
  pctLabel: { color: '#8E8E93', fontSize: 11, marginTop: 2 },
  listTitle: { fontSize: 18, fontWeight: '800', color: '#1C1C1E', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIcon: { width: 38, height: 38 },
  suppName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  suppMeta: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reminderTxt: { fontSize: 11, fontWeight: '600', color: '#6366F1' },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  aiNote: { flex: 1, fontSize: 11, color: '#636366' },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  errorTxt: { color: '#FF453A', fontSize: 13 },
  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  emptyTxt: { fontSize: 13, color: '#8E8E93' },
});

// ─── Rating Modal ──────────────────────────────────────────────────────────────
const RATING_EMOJIS = ['😞', '😐', '🙂', '😊', '🤩'];
const RATING_LABELS = [
  'Hiç etki yok',
  'Çok az',
  'Biraz hissettim',
  'İyi hissettim',
  'Harika etki!',
];

function RatingModal({
  supp,
  existingRating,
  onClose,
  onSubmit,
}: {
  supp: Supplement;
  existingRating?: number | null;
  onClose: () => void;
  onSubmit: (rating: number, note?: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState<number | null>(existingRating ?? null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const sheetY = useRef(new Animated.Value(600)).current;
  const overlayOp = useRef(new Animated.Value(0)).current;
  const emojiScales = useRef(RATING_EMOJIS.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(sheetY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 120,
        friction: 18,
        velocity: 2,
      }),
      Animated.timing(overlayOp, {
        toValue: 1,
        useNativeDriver: true,
        duration: 250,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(sheetY, {
        toValue: 600,
        useNativeDriver: true,
        duration: 280,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
      Animated.timing(overlayOp, {
        toValue: 0,
        useNativeDriver: true,
        duration: 240,
        easing: Easing.out(Easing.quad),
      }),
    ]).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  const handleSelectEmoji = (val: number) => {
    setSelected(val);
    const idx = val - 1;
    Animated.sequence([
      Animated.spring(emojiScales[idx], {
        toValue: 1.35,
        useNativeDriver: true,
        tension: 500,
        friction: 7,
      }),
      Animated.spring(emojiScales[idx], {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }),
    ]).start();
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await onSubmit(selected, note.trim() || undefined);
      dismiss();
    } catch {
      Alert.alert('Hata', 'Değerlendirme kaydedilemedi.');
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={dismiss}>
      <Pressable onPress={dismiss} style={{ flex: 1 }}>
        <Animated.View style={[rm.overlay, { opacity: overlayOp }]} pointerEvents="none" />
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable onPress={(e) => e.stopPropagation?.()}>
            <Animated.View style={[rm.sheet, { transform: [{ translateY: sheetY }] }]}>
              <Text style={rm.title}>Etkisini değerlendir</Text>
              <Text style={rm.suppName}>{supp.name}</Text>

              <View style={rm.emojiRow}>
                {RATING_EMOJIS.map((emoji, i) => {
                  const val = i + 1;
                  const active = selected === val;
                  return (
                    <Pressable
                      key={val}
                      style={[rm.emojiBtn, active && rm.emojiBtnActive]}
                      onPress={() => handleSelectEmoji(val)}
                    >
                      <Animated.View style={{ transform: [{ scale: emojiScales[i] }] }}>
                        <Text style={rm.emoji}>{emoji}</Text>
                      </Animated.View>
                      <Text style={[rm.emojiLabel, active && rm.emojiLabelActive]}>{val}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {selected && <Text style={rm.selectedLabel}>{RATING_LABELS[selected - 1]}</Text>}

              <TextInput
                style={rm.noteInput}
                placeholder="Not ekle (isteğe bağlı)"
                placeholderTextColor="#AEAEB2"
                value={note}
                onChangeText={setNote}
                multiline
                maxLength={200}
              />

              <Pressable
                style={[rm.submitBtn, !selected && rm.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!selected || saving}
              >
                <Text style={rm.submitTxt}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</Text>
              </Pressable>
            </Animated.View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function SupplementScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const api = useSupplementApi();
  const { isLoaded, isSignedIn } = useAuth();

  const [date, setDate] = useState(new Date());
  const [direction, setDir] = useState(0);
  const [calOpen, setCalOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [detailSupp, setDetailSupp] = useState<Supplement | null>(null);

  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<
    Record<string, { rating: number; note: string | null; ratedAt: string }>
  >({});
  const [ratingTarget, setRatingTarget] = useState<Supplement | null>(null);

  const loadSupplements = useCallback(
    async (d: Date) => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.fetchSupplements(toDateString(d));
        // 0=Pzt 1=Sal 2=Çar 3=Per 4=Cum 5=Cmt 6=Paz — JS getDay() 0=Paz
        const dayOfWeek = (d.getDay() + 6) % 7; // convert to Mon=0 basis
        const filtered = data.filter(
          (s) => s.scheduleDays.length === 0 || s.scheduleDays.includes(dayOfWeek),
        );
        setSupplements(filtered);
      } catch (e) {
        console.error('[supplement] fetch failed', e);
        setError('Takviyeler yüklenemedi');
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadSupplements(date);
      api
        .fetchRatings()
        .then(setRatings)
        .catch(() => {});
    }
  }, [date.toDateString(), isLoaded, isSignedIn]);

  const goDay = useCallback((delta: number) => {
    setDir(delta);
    setDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + delta);
      const jan1 = new Date(d.getFullYear(), 0, 1);
      const dec31 = new Date(d.getFullYear(), 11, 31);
      if (next < jan1 || next > dec31) return d;
      return next;
    });
  }, []);

  const handleToggleTime = useCallback(
    async (id: string, taken: boolean, scheduledTime?: string) => {
      setTogglingId(scheduledTime ? `${id}_${scheduledTime}` : id);
      // Optimistic
      const nowIso = new Date().toISOString();
      setSupplements((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          const takenTimes = taken
            ? ([...s.takenTimes, scheduledTime].filter(Boolean) as string[])
            : s.takenTimes.filter((t) => t !== scheduledTime);
          const takenLogs = taken
            ? [...s.takenLogs, { scheduledTime: scheduledTime ?? null, takenAt: nowIso }]
            : s.takenLogs.filter((l) => l.scheduledTime !== scheduledTime);
          return {
            ...s,
            takenTimes,
            takenLogs,
            taken: takenTimes.length > 0 || (!scheduledTime && taken),
          };
        }),
      );
      try {
        await api.toggleTakenAt(id, taken, toDateString(date), scheduledTime);
      } catch {
        await loadSupplements(date);
        Alert.alert('Hata', 'Durum güncellenemedi.');
      } finally {
        setTogglingId(null);
      }
    },
    [api, date],
  );

  const handleAdd = useCallback(
    async (data: Parameters<typeof api.addSupplement>[0]) => {
      const newSupp = await api.addSupplement(data);
      setSupplements((prev) => [
        ...prev,
        { ...newSupp, taken: false, takenTimes: [], takenLogs: [], logId: null },
      ]);
    },
    [api],
  );

  const handleUpdate = useCallback(
    async (id: string, data: { scheduleTimes?: string[]; reminderAt?: string | null }) => {
      const updated = await api.updateSupplement(id, data);
      setSupplements((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
      // detailSupp'u da güncelle
      setDetailSupp((prev) => (prev?.id === id ? { ...prev, ...updated } : prev));
    },
    [api],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await api.deleteSupplement(id);
        setSupplements((prev) => prev.filter((s) => s.id !== id));
      } catch {
        Alert.alert('Hata', 'Takviye silinemedi.');
      }
    },
    [api],
  );

  const handleRate = useCallback(
    async (rating: number, note?: string) => {
      if (!ratingTarget) return;
      const result = await api.submitRating(ratingTarget.id, rating, note);
      setRatings((prev) => ({
        ...prev,
        [ratingTarget.id]: {
          rating: result.rating,
          note: note ?? null,
          ratedAt: new Date().toISOString(),
        },
      }));
    },
    [api, ratingTarget],
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[s.root, { paddingTop: insets.top }]} collapsable={false}>
        <DateHeader
          date={date}
          onPrev={() => goDay(-1)}
          onNext={() => goDay(+1)}
          onOpenCal={() => setCalOpen(true)}
          onBack={() => router.back()}
          onAdd={() => setAddOpen(true)}
        />

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          decelerationRate="normal"
          scrollEventThrottle={16}
        >
          <DateContent
            key={date.toDateString()}
            date={date}
            direction={direction}
            supplements={supplements}
            loading={loading}
            error={error}
            onDelete={handleDelete}
            onOpenDetail={setDetailSupp}
            onToggleTime={handleToggleTime}
            togglingId={togglingId}
            ratings={ratings}
            onRate={setRatingTarget}
          />
          <DiscoverButton
            onPress={() => router.push('/(app)/tracking/supplement-discover' as never)}
          />
        </ScrollView>

        <SupplementDetailSheet
          supp={detailSupp}
          visible={!!detailSupp}
          date={toDateString(date)}
          onClose={() => setDetailSupp(null)}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onToggleTime={handleToggleTime}
          togglingId={togglingId}
        />
      </View>

      {ratingTarget && (
        <RatingModal
          supp={ratingTarget}
          existingRating={ratings[ratingTarget.id]?.rating}
          onClose={() => setRatingTarget(null)}
          onSubmit={handleRate}
        />
      )}

      <CalendarModal
        visible={calOpen}
        current={date}
        onSelect={(d) => {
          setDir(0);
          setDate(d);
        }}
        onClose={() => setCalOpen(false)}
        fetchMonthly={api.fetchMonthly}
      />
      <AddModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
        onOpenBarcode={() => router.push('/(app)/tracking/supplement-barcode' as never)}
        onOpenPhoto={() => router.push('/(app)/tracking/supplement-photo' as never)}
      />
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
});

const rm = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 40,
  },
  title: { fontSize: 18, fontWeight: '800', color: '#1C1C1E', textAlign: 'center' },
  suppName: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginTop: 4, marginBottom: 24 },
  emojiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  emojiBtn: {
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  emojiBtnActive: { backgroundColor: '#F5E8FF', borderWidth: 2, borderColor: '#AF52DE' },
  emoji: { fontSize: 28 },
  emojiLabel: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  emojiLabelActive: { color: '#AF52DE' },
  selectedLabel: {
    textAlign: 'center',
    fontSize: 14,
    color: '#AF52DE',
    fontWeight: '700',
    marginBottom: 16,
  },
  noteInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: '#1C1C1E',
    minHeight: 72,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#AF52DE',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

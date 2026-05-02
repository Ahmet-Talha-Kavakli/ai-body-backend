import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession, useUser } from '@clerk/expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  VendingMachine,
  type BottomSlot,
  categoryToBottle,
  categoryToColor,
} from '../../../../components/tracking/water/VendingMachine';
import {
  AddModal,
  GoalModal,
  type DrinkCatalogItem,
} from '../../../../components/tracking/water/WaterModals';
import { AddDrinkSheet } from '../../../../components/tracking/water/AddDrinkSheet';
import { useDrinksApi, type UserDrink } from '../../../../components/tracking/water/drinksApi';
import {
  DrinkDetailSheet,
  type DrinkLogDetail,
} from '../../../../components/tracking/water/DrinkDetailSheet';
import {
  WaterLogsList,
  type WaterLogItem,
} from '../../../../components/tracking/water/WaterLogsList';
import { WelcomeOverlay } from '../../../../components/tracking/water/WelcomeOverlay';

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCENT = '#32ADE6';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const { height: SCREEN_H, width: SW } = Dimensions.get('window');

const DRINK_CAT_LABELS: Record<string, string> = {
  water: 'Su',
  tea: 'Çay',
  coffee: 'Kahve',
  herbal: 'Bitki Çayı',
  juice: 'Meyve Suyu',
  sports: 'Spor',
  dairy: 'Süt & Protein',
  smoothie: 'Smoothie',
  soda: 'Gazlı',
  alcohol: 'Alkol',
  other: 'Diğer',
};

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
function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function getFirstDayOfMonth(y: number, m: number) {
  return (new Date(y, m, 1).getDay() + 6) % 7;
}

// ─── API Hook ─────────────────────────────────────────────────────────────────
function useWaterApi() {
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

  const fetchMonthly = useCallback(
    async (year: number, month: number) => {
      const r = await authFetch(`/api/tracking/water/monthly?year=${year}&month=${month}`);
      if (!r.ok) return { days: {} as Record<string, { total: number; goal: number }> };
      return r.json() as Promise<{ days: Record<string, { total: number; goal: number }> }>;
    },
    [authFetch],
  );

  const fetchDashboard = useCallback(async () => {
    const r = await authFetch('/api/water/dashboard');
    if (!r.ok) return null;
    return r.json() as Promise<{ todayMl: number; goalMl: number; streak: number }>;
  }, [authFetch]);

  const fetchGoal = useCallback(async () => {
    const r = await authFetch('/api/water/goal');
    if (!r.ok) return 2500;
    const d = (await r.json()) as { dailyGoalMl: number };
    return d.dailyGoalMl;
  }, [authFetch]);

  const saveGoal = useCallback(
    async (dailyGoalMl: number) => {
      await authFetch('/api/water/goal', { method: 'POST', body: JSON.stringify({ dailyGoalMl }) });
    },
    [authFetch],
  );

  const logDrink = useCallback(
    async (amountMl: number, catalogId?: string, category?: string, date?: string) => {
      const r = await authFetch('/api/water/logs', {
        method: 'POST',
        body: JSON.stringify({ amountMl, catalogId, category, date }),
      });
      if (!r.ok) return null;
      return r.json() as Promise<{
        success: boolean;
        log: {
          id: string;
          drinkType: string;
          amountMl: number;
          catalogId: string | null;
          createdAt: string;
        };
        totalMl: number;
      }>;
    },
    [authFetch],
  );

  const fetchDayLogs = useCallback(
    async (date: string) => {
      const r = await authFetch(`/api/water/logs?date=${date}`);
      if (!r.ok) return { logs: [], totalMl: 0 };
      return r.json() as Promise<{
        logs: Array<DrinkLogDetail>;
        totalMl: number;
      }>;
    },
    [authFetch],
  );

  const updateLog = useCallback(
    async (id: string, amountMl: number) => {
      await authFetch('/api/water/logs', {
        method: 'PATCH',
        body: JSON.stringify({ id, amountMl }),
      });
    },
    [authFetch],
  );

  const deleteLog = useCallback(
    async (id: string) => {
      await authFetch(`/api/water/logs?id=${id}`, { method: 'DELETE' });
    },
    [authFetch],
  );

  const fetchCatalog = useCallback(
    async (q?: string): Promise<DrinkCatalogItem[]> => {
      // Yeni endpoint: kullanıcının görünür içeceklerini sortOrder'a göre dön
      const path = '/api/water/drinks';
      const cacheKey = `drinks_v2${q ? `_${q.toLowerCase()}` : ''}`;

      type DrinkApiItem = {
        id: string;
        type: 'catalog' | 'custom';
        nametr: string;
        nameen: string | null;
        category: string;
        hydrationValue: number;
        caffeinePerServing: number | null;
        defaultServingMl: number;
        iconName: string;
        color: string;
        isVisible: boolean;
        sortOrder: number;
      };

      const mapToCatalog = (items: DrinkApiItem[]): DrinkCatalogItem[] => {
        const visible = items.filter((it) => it.isVisible);
        const filtered = q
          ? visible.filter(
              (it) =>
                it.nametr.toLowerCase().includes(q.toLowerCase()) ||
                (it.nameen ?? '').toLowerCase().includes(q.toLowerCase()),
            )
          : visible;
        return filtered.map((it) => ({
          id: it.id,
          nametr: it.nametr,
          nameen: it.nameen ?? '',
          category: it.category,
          defaultServingMl: it.defaultServingMl,
          iconName: it.iconName,
          color: it.color,
        }));
      };

      let cached: DrinkApiItem[] | null = null;
      try {
        const raw = await AsyncStorage.getItem(cacheKey);
        if (raw) cached = JSON.parse(raw);
      } catch {}

      if (cached && cached.length > 0) {
        authFetch(path)
          .then(async (r) => {
            if (!r.ok) return;
            const fresh = (await r.json()) as { drinks: DrinkApiItem[] };
            AsyncStorage.setItem(cacheKey, JSON.stringify(fresh.drinks)).catch(() => {});
          })
          .catch(() => {});
        return mapToCatalog(cached);
      }

      try {
        const r = await authFetch(path);
        if (!r.ok) return [];
        const data = (await r.json()) as { drinks: DrinkApiItem[] };
        AsyncStorage.setItem(cacheKey, JSON.stringify(data.drinks)).catch(() => {});
        return mapToCatalog(data.drinks);
      } catch {
        return [];
      }
    },
    [authFetch],
  );

  return {
    fetchMonthly,
    fetchDashboard,
    fetchGoal,
    saveGoal,
    logDrink,
    fetchCatalog,
    fetchDayLogs,
    deleteLog,
    updateLog,
  };
}

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

// ─── Date Header ──────────────────────────────────────────────────────────────
function DateHeader({
  date,
  onPrev,
  onNext,
  onOpenCal,
  onBack,
}: {
  date: Date;
  onPrev: () => void;
  onNext: () => void;
  onOpenCal: () => void;
  onBack: () => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cur = new Date(date);
  cur.setHours(0, 0, 0, 0);
  const pill = useRef(new Animated.Value(1)).current;

  return (
    <View style={dh.wrap}>
      <Pressable onPress={onBack} hitSlop={12} style={dh.sideBtn}>
        <Ionicons name="chevron-back" size={22} color="#1C1C1E" />
      </Pressable>
      <View style={dh.center}>
        <ArrowBtn name="chevron-back" onPress={onPrev} />
        <Pressable
          onPress={onOpenCal}
          onPressIn={() =>
            Animated.spring(pill, {
              toValue: 0.95,
              useNativeDriver: true,
              tension: 400,
              friction: 15,
            }).start()
          }
          onPressOut={() =>
            Animated.spring(pill, {
              toValue: 1,
              useNativeDriver: true,
              tension: 300,
              friction: 12,
            }).start()
          }
          hitSlop={8}
        >
          <Animated.View style={[dh.datePill, { transform: [{ scale: pill }] }]}>
            <Text style={dh.dateTxt}>{formatDate(date)}</Text>
            <Ionicons name="calendar-outline" size={14} color="#8E8E93" style={{ marginLeft: 6 }} />
          </Animated.View>
        </Pressable>
        <ArrowBtn name="chevron-forward" onPress={onNext} disabled={cur >= today} />
      </View>
      <View style={dh.sideBtn} />
    </View>
  );
}

const dh = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
  sideBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
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
    y: number,
    m: number,
  ) => Promise<{ days: Record<string, { total: number; goal: number }> }>;
}) {
  const [viewYear, setViewYear] = useState(current.getFullYear());
  const [viewMonth, setViewMonth] = useState(current.getMonth());
  const [mounted, setMounted] = useState(false);
  const [monthData, setMonthData] = useState<Record<string, { total: number; goal: number }>>({});
  const [prevLastHas, setPrevLastHas] = useState(false);
  const [nextFirstHas, setNextFirstHas] = useState(false);
  const streakRingAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setViewYear(current.getFullYear());
      setViewMonth(current.getMonth());
      slideAnim.setValue(SCREEN_H);
      opAnim.setValue(0);
      requestAnimationFrame(() =>
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 520,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          Animated.timing(opAnim, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        ]).start(),
      );
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_H,
          duration: 460,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 1, 1),
        }),
        Animated.timing(opAnim, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 1, 1),
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    streakRingAnim.setValue(0);
    const prevM = viewMonth === 0 ? 12 : viewMonth;
    const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
    const nextM = viewMonth === 11 ? 1 : viewMonth + 2;
    const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
    Promise.all([
      fetchMonthly(viewYear, viewMonth + 1),
      fetchMonthly(prevY, prevM),
      fetchMonthly(nextY, nextM),
    ])
      .then(([cur, prev, next]) => {
        setMonthData(cur.days);
        const prevLastDay = getDaysInMonth(prevY, prevM - 1);
        const prevLastStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(prevLastDay).padStart(2, '0')}`;
        setPrevLastHas((prev.days[prevLastStr]?.total ?? 0) > 0);
        const nextFirstStr = `${nextY}-${String(nextM).padStart(2, '0')}-01`;
        setNextFirstHas((next.days[nextFirstStr]?.total ?? 0) > 0);
        Animated.timing(streakRingAnim, {
          toValue: 1,
          duration: 340,
          useNativeDriver: true,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }).start();
      })
      .catch(() => {});
  }, [visible, viewYear, viewMonth]);

  function goalColor(total: number, goal: number): string | null {
    if (total <= 0) return null;
    const ratio = total / (goal || 2000);
    if (ratio >= 1) return '#30D158';
    if (ratio >= 0.7) return '#FF9F0A';
    return ACCENT;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const CELL_W = Math.floor((SW - 80) / 7);
  const prevDis = viewMonth === 0 && viewYear <= current.getFullYear();
  const nextDis = viewMonth === 11 && viewYear >= current.getFullYear();
  const STREAK_COLOR = '#FF9500';

  function dayStr(d: number) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  function hasLog(d: number) {
    if (d < 1 || d > daysInMonth) return false;
    return (monthData[dayStr(d)]?.total ?? 0) > 0;
  }
  function isStreak(day: number): boolean {
    if (!hasLog(day)) return false;
    const prevHas = day === 1 ? prevLastHas : hasLog(day - 1);
    const nextHas = day === daysInMonth ? nextFirstHas : hasLog(day + 1);
    return prevHas || nextHas;
  }
  function streakPos(day: number): 'start' | 'mid' | 'end' | 'solo' {
    if (!isStreak(day)) return 'solo';
    const prevHas = day === 1 ? prevLastHas : hasLog(day - 1);
    const nextHas = day === daysInMonth ? nextFirstHas : hasLog(day + 1);
    if (prevHas && nextHas) return 'mid';
    if (prevHas) return 'end';
    if (nextHas) return 'start';
    return 'solo';
  }

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
                if (prevDis) return;
                if (viewMonth === 0) {
                  setViewMonth(11);
                  setViewYear((y) => y - 1);
                } else setViewMonth((m) => m - 1);
              }}
              hitSlop={12}
              style={[cm.monthBtn, prevDis && { opacity: 0.2 }]}
            >
              <Ionicons name="chevron-back" size={20} color="#1C1C1E" />
            </Pressable>
            <Text style={cm.monthTxt}>
              {MONTHS_TR[viewMonth]} {viewYear}
            </Text>
            <Pressable
              onPress={() => {
                if (nextDis) return;
                if (viewMonth === 11) {
                  setViewMonth(0);
                  setViewYear((y) => y + 1);
                } else setViewMonth((m) => m + 1);
              }}
              hitSlop={12}
              style={[cm.monthBtn, nextDis && { opacity: 0.2 }]}
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
              const str = dayStr(day);
              const sel = isSameDay(d, current);
              const tod = isSameDay(d, today);
              const fut = d > today;
              const data = !fut ? monthData[str] : undefined;
              const col = data ? goalColor(data.total, data.goal) : null;
              const cellSize = CELL_W - 6;
              const inStreak = !fut && isStreak(day);
              const pos = inStreak ? streakPos(day) : 'solo';
              const showLeft = inStreak && (pos === 'mid' || pos === 'end');
              const showRight = inStreak && (pos === 'mid' || pos === 'start');

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
                    <Animated.View
                      style={{
                        width: CELL_W,
                        height: CELL_W,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.7 : 1,
                      }}
                    >
                      {showLeft && (
                        <Animated.View
                          style={{
                            position: 'absolute',
                            left: 0,
                            width: CELL_W / 2,
                            height: 3,
                            backgroundColor: STREAK_COLOR + '40',
                            opacity: streakRingAnim,
                          }}
                        />
                      )}
                      {showRight && (
                        <Animated.View
                          style={{
                            position: 'absolute',
                            right: 0,
                            width: CELL_W / 2,
                            height: 3,
                            backgroundColor: STREAK_COLOR + '40',
                            opacity: streakRingAnim,
                          }}
                        />
                      )}
                      {inStreak && !sel && (
                        <Animated.View
                          style={{
                            position: 'absolute',
                            width: cellSize + 6,
                            height: cellSize + 6,
                            borderRadius: (cellSize + 6) / 2,
                            borderWidth: 2.5,
                            borderColor: STREAK_COLOR,
                            opacity: streakRingAnim,
                            shadowColor: STREAK_COLOR,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.5,
                            shadowRadius: 5,
                          }}
                        />
                      )}
                      <View
                        style={[
                          {
                            width: cellSize,
                            height: cellSize,
                            borderRadius: cellSize / 2,
                            alignItems: 'center',
                            justifyContent: 'center',
                          },
                          sel && { backgroundColor: col ?? ACCENT },
                          tod && !sel && { borderWidth: 1.5, borderColor: col ?? ACCENT },
                        ]}
                      >
                        <Text
                          style={[
                            { fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
                            sel && { color: '#fff', fontWeight: '700' },
                            tod && !sel && { color: col ?? ACCENT, fontWeight: '700' },
                            fut && { color: '#C7C7CC' },
                            col && !sel && !tod && { color: col, fontWeight: '600' },
                            inStreak && !sel && { fontWeight: '700' },
                          ]}
                        >
                          {day}
                        </Text>
                        {col && !sel && (
                          <View
                            style={{
                              position: 'absolute',
                              bottom: 3,
                              width: 4,
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: col,
                            }}
                          />
                        )}
                      </View>
                      {inStreak && !sel && (
                        <Animated.View
                          style={{
                            position: 'absolute',
                            top: 1,
                            right: 1,
                            opacity: streakRingAnim,
                          }}
                        >
                          <Text style={{ fontSize: 9 }}>🔥</Text>
                        </Animated.View>
                      )}
                    </Animated.View>
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
    backgroundColor: `${ACCENT}1A`,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${ACCENT}33`,
  },
  todayTxt: { color: ACCENT, fontSize: 15, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
function toDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TakipRoute() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    fetchMonthly,
    fetchDashboard,
    saveGoal,
    logDrink,
    fetchCatalog,
    fetchDayLogs,
    deleteLog,
    updateLog,
  } = useWaterApi();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [selDate, setSelDate] = useState(today);
  const [showCal, setShowCal] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showGoal, setShowGoal] = useState(false);

  const [goalMl, setGoalMl] = useState(2500);
  const [waterMl, setWaterMl] = useState(0);
  const [bottomDrinks, setBottomDrinks] = useState<BottomSlot[]>([]);
  const [newSlotId, setNewSlotId] = useState<string | null>(null);

  // Kullanıcının "İçeceklerim"i — Waterllama-tarzı AddDrinkSheet'in veri kaynağı.
  // Sadece visible (toggle on) olanlar gösterilir.
  const [userDrinks, setUserDrinks] = useState<UserDrink[]>([]);
  const [activeDrinkId, setActiveDrinkId] = useState<string | null>(null);
  const drinksApi = useDrinksApi();

  // Tüm logların orijinali (detay sheet için)
  const [allLogs, setAllLogs] = useState<DrinkLogDetail[]>([]);
  const [detailLog, setDetailLog] = useState<DrinkLogDetail | null>(null);
  const [showWaterList, setShowWaterList] = useState(false);

  // Loader + welcome state — initial (ilk açılış 6sn) + date-change (kısa 1.8sn)
  const [showLoader, setShowLoader] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeTitle, setWelcomeTitle] = useState('');
  const [welcomeSubtitle, setWelcomeSubtitle] = useState('Hoş geldin,');
  const [loaderMinMs, setLoaderMinMs] = useState(6000); // ilk açılış 6sn, sonra 1.8sn
  const [dataReady, setDataReady] = useState(false);
  const loaderStartRef = useRef(Date.now());
  const { user } = useUser();
  const firstName = user?.firstName ?? user?.username ?? 'Sporcu';
  const isFirstLoadRef = useRef(true);
  const prevDateRef = useRef(selDate);

  // Loader bitince welcome'ı tetikle
  useEffect(() => {
    if (!showLoader || !dataReady) return;
    const elapsed = Date.now() - loaderStartRef.current;
    const remaining = Math.max(0, loaderMinMs - elapsed);
    const t = setTimeout(() => {
      // Welcome içeriğini ayarla
      if (isFirstLoadRef.current) {
        setWelcomeTitle(firstName);
        setWelcomeSubtitle('Hoş geldin,');
        isFirstLoadRef.current = false;
      } else {
        setWelcomeTitle(formatDate(selDate));
        setWelcomeSubtitle(isSameDay(selDate, today) ? 'Bugün' : 'Tarihe gidiliyor');
      }
      setShowLoader(false);
      setShowWelcome(true);
    }, remaining);
    return () => clearTimeout(t);
  }, [showLoader, dataReady, loaderMinMs, firstName, selDate]);

  // Welcome ekranı 1.6sn sonra kaybolur
  useEffect(() => {
    if (!showWelcome) return;
    const t = setTimeout(() => setShowWelcome(false), 1600);
    return () => clearTimeout(t);
  }, [showWelcome]);

  // Tarih değişince loader'ı yeniden tetikle (ilk açılış değilse)
  useEffect(() => {
    if (isFirstLoadRef.current) {
      // İlk açılış — zaten loader gösteriliyor
      prevDateRef.current = selDate;
      return;
    }
    if (isSameDay(prevDateRef.current, selDate)) return;
    prevDateRef.current = selDate;

    // Yeni gün seçildi — kısa loader + tarih welcome
    setShowWelcome(false);
    setDataReady(false);
    setShowLoader(true);
    setLoaderMinMs(2000); // tarih değişiminde 2sn yeterli
    loaderStartRef.current = Date.now();
  }, [selDate]);

  // Varsayılan su şişesi boyutu (kaplar bölümünden gelecek; şimdilik sabit)
  const defaultBottleMl = 250;

  // Hedef her zaman dashboard'dan
  useEffect(() => {
    fetchDashboard().then((d) => {
      if (!d) return;
      setGoalMl(d.goalMl);
    });
  }, []);

  // İçeceklerim listesini yükle — Waterllama AddDrinkSheet için.
  // Sadece visible olanlar; sortOrder asc.
  useEffect(() => {
    drinksApi.listDrinks().then((list) => {
      const visibles = list.filter((d) => d.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);
      setUserDrinks(visibles);
      // Default: ilk drink (genelde Su) seçili açılır
      if (visibles.length > 0 && !activeDrinkId) setActiveDrinkId(visibles[0]!.id);
    });
  }, []);

  // Gün değişince logları yükle
  const reloadDay = useCallback(async () => {
    const dateStr = toDateString(selDate);
    try {
      const { logs, totalMl } = await fetchDayLogs(dateStr);
      setWaterMl(totalMl);
      setAllLogs(logs);
      const bottoms: BottomSlot[] = logs
        .filter((l) => l.drinkType !== 'water')
        .map((l) => ({
          id: l.id,
          category: l.drinkType,
          amountMl: l.amountMl,
          kind: categoryToBottle(l.drinkType),
          color: categoryToColor(l.drinkType),
        }));
      setBottomDrinks(bottoms);
      setNewSlotId(null);
    } finally {
      setDataReady(true);
    }
  }, [selDate, fetchDayLogs]);

  useEffect(() => {
    reloadDay();
  }, [reloadDay]);

  function goDay(delta: number) {
    const next = new Date(selDate);
    next.setDate(next.getDate() + delta);
    if (next <= today) setSelDate(next);
  }

  const handleSaveGoal = async (ml: number) => {
    setGoalMl(ml);
    await saveGoal(ml);
  };

  const handleLog = async (ml: number, catalogId?: string, category?: string) => {
    const dateStr = toDateString(selDate);
    const cat = category ?? 'water';
    const tempId = `tmp_${Date.now()}`;
    const kind = categoryToBottle(cat);
    const color = categoryToColor(cat);

    // 1) Optimistic — slot ekle, splash trigger'ı modal kapanışıyla aynı anda set et.
    // Pour efekti DrinkBottle WavyLiquid içinde (fillLevel 0→1 + splash ile).
    if (cat === 'water') {
      setWaterMl((prev) => prev + ml);
      setNewSlotId('water');
      setTimeout(() => setNewSlotId(null), 3200);
    } else {
      setBottomDrinks((prev) => [
        ...prev,
        { id: tempId, category: cat, amountMl: ml, kind, color },
      ]);
      setNewSlotId(tempId);
      setTimeout(() => setNewSlotId(null), 3200);
    }

    // 2) Backend'e arka planda gönder
    try {
      const result = await logDrink(ml, catalogId, category, dateStr);
      if (!result) return;

      // Backend'den gelen toplam ile senkronize et
      if (cat === 'water' && typeof result.totalMl === 'number') {
        setWaterMl(result.totalMl);
      }
      // Geçici id'yi gerçek id ile değiştir
      if (cat !== 'water' && result.log?.id) {
        setBottomDrinks((prev) =>
          prev.map((s) => (s.id === tempId ? { ...s, id: result.log.id } : s)),
        );
      }
      // allLogs'a ekle (detay sheet için)
      if (result.log) {
        setAllLogs((prev) => [
          ...prev,
          {
            id: result.log.id,
            drinkType: result.log.drinkType,
            amountMl: result.log.amountMl,
            catalogId: result.log.catalogId,
            createdAt: result.log.createdAt,
          },
        ]);
        // Tam catalog enriched veriyi almak için arkada sessizce reload
        reloadDay().catch(() => {});
      }
    } catch {
      // Backend başarısız oldu — optimistic state'i geri al
      if (cat === 'water') {
        setWaterMl((prev) => Math.max(0, prev - ml));
      } else {
        setBottomDrinks((prev) => prev.filter((s) => s.id !== tempId));
      }
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[s.root, { paddingTop: insets.top + 12 }]}>
        <DateHeader
          date={selDate}
          onPrev={() => goDay(-1)}
          onNext={() => goDay(1)}
          onOpenCal={() => setShowCal(true)}
          onBack={() => router.back()}
        />

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <VendingMachine
            goalMl={goalMl}
            defaultBottleMl={defaultBottleMl}
            waterMl={waterMl}
            bottomDrinks={bottomDrinks}
            newSlotId={newSlotId}
            loading={showLoader}
            onLedPress={() => setShowGoal(true)}
            onAddPress={() => setShowAdd(true)}
            onWaterShelfPress={() => setShowWaterList(true)}
            onBottomDrinkPress={(slotId) => {
              const found = allLogs.find((l) => l.id === slotId);
              if (found) setDetailLog(found);
            }}
          />
          <View style={{ height: 24 }} />
        </ScrollView>
      </View>

      <CalendarModal
        visible={showCal}
        current={selDate}
        onSelect={(d) => setSelDate(d)}
        onClose={() => setShowCal(false)}
        fetchMonthly={fetchMonthly}
      />
      <GoalModal
        visible={showGoal}
        currentGoal={goalMl}
        onClose={() => setShowGoal(false)}
        onSave={handleSaveGoal}
      />
      {/* Waterllama-tarzı içecek ekleme sheet'i — büyük bardak + drag handle + tek tıklama kayıt */}
      {userDrinks.length > 0 && activeDrinkId && (
        <AddDrinkSheet
          visible={showAdd}
          drinks={userDrinks}
          currentDrinkId={activeDrinkId}
          onClose={() => setShowAdd(false)}
          onSubmit={async (drinkId, type, amountMl) => {
            const drink = userDrinks.find((d) => d.id === drinkId);
            if (!drink) return;
            // Bir sonraki açılışta seçili kalsın
            setActiveDrinkId(drinkId);
            // handleLog: ml + catalogId? + category?
            await handleLog(amountMl, type === 'catalog' ? drinkId : undefined, drink.category);
          }}
        />
      )}

      {/* Detay sheet — alt raf içecekler */}
      <DrinkDetailSheet
        visible={!!detailLog}
        log={detailLog}
        onClose={() => setDetailLog(null)}
        onDelete={async (id) => {
          // Optimistic — listeden çıkar
          setBottomDrinks((prev) => prev.filter((s) => s.id !== id));
          setAllLogs((prev) => prev.filter((l) => l.id !== id));
          try {
            await deleteLog(id);
            await reloadDay();
          } catch {}
        }}
        onEdit={async (id, newMl) => {
          // Optimistic
          setBottomDrinks((prev) => prev.map((s) => (s.id === id ? { ...s, amountMl: newMl } : s)));
          setAllLogs((prev) => prev.map((l) => (l.id === id ? { ...l, amountMl: newMl } : l)));
          setDetailLog((prev) => (prev && prev.id === id ? { ...prev, amountMl: newMl } : prev));
          try {
            await updateLog(id, newMl);
            await reloadDay();
          } catch {}
        }}
        onReadd={async (log) => {
          await handleLog(log.amountMl, log.catalogId ?? undefined, log.drinkType);
        }}
      />

      {/* Welcome overlay (loading sonrası ~1.6sn) */}
      <WelcomeOverlay visible={showWelcome} title={welcomeTitle} subtitle={welcomeSubtitle} />

      {/* Su logları listesi — üst raf */}
      <WaterLogsList
        visible={showWaterList}
        logs={allLogs
          .filter((l) => l.drinkType === 'water')
          .map<WaterLogItem>((l) => ({
            id: l.id,
            amountMl: l.amountMl,
            createdAt: l.createdAt,
          }))}
        totalMl={waterMl}
        goalMl={goalMl}
        onClose={() => setShowWaterList(false)}
        onDelete={async (id) => {
          const log = allLogs.find((l) => l.id === id);
          if (log) {
            setAllLogs((prev) => prev.filter((l) => l.id !== id));
            setWaterMl((prev) => Math.max(0, prev - log.amountMl));
          }
          try {
            await deleteLog(id);
            await reloadDay();
          } catch {}
        }}
      />
    </>
  );
}

// ─── Floating Action Button ────────────────────────────────────────────────────
function FAB({ onPress, bottomInset }: { onPress: () => void; bottomInset: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <View style={[fab.wrap, { bottom: bottomInset + 24 }]}>
      <Pressable
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.88,
            useNativeDriver: true,
            tension: 300,
            friction: 12,
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
        <Animated.View style={[fab.btn, { transform: [{ scale }] }]}>
          <Ionicons name="add" size={32} color="#fff" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const fab = StyleSheet.create({
  wrap: { position: 'absolute', right: 20 },
  btn: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { paddingHorizontal: 16, paddingBottom: 16 },
});

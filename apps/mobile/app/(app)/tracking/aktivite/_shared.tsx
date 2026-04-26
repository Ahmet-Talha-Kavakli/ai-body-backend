import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
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
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@clerk/expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { detectCombos, type ActivityCombo } from '../../../../lib/activity-combos';
import {
  getActivitySubIcon,
  getMainActivityIcon,
  ACTIVITY_TYPES_WITH_SUBTYPES,
  ALL_ACTIVITY_ICONS,
} from '../../../../lib/activity-icons';
import Pamuk, { type PamukMood } from '../../../../components/shared/Pamuk';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import MapboxRouteView, { MapboxRouteViewRef } from '../../../../components/maps/MapboxRouteView';

// ─── Constants ────────────────────────────────────────────────────────────────
export const ACCENT = '#FF6B35';
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
export const { width: SW, height: SCREEN_H } = Dimensions.get('window');

export const FAV_KEY = 'activity_favorites_v1';
export const GOAL_TYPE_KEY = 'activity_goal_type_v1';
export const GOAL_CAL_KEY = 'activity_goal_cal_v1';
export const ROUTES_KEY = 'fitai_routes_v1';

export type GoalType = 'minutes' | 'calories';

// ─── Types ────────────────────────────────────────────────────────────────────
export type Intensity = 'low' | 'medium' | 'high';
export type AiScore = 'green' | 'yellow' | 'red';

export interface FavoriteEntry {
  id: string; // activityType + ':' + (subType ?? '')
  activityType: string;
  subType: string | null;
  nametr: string;
  subTypeNametr: string | null;
  color: string;
  iconName: string;
}

export interface ActivityLog {
  id: string;
  activityType: string;
  subType: string | null;
  subTypeNametr: string | null;
  date: string;
  startTime: string | null;
  duration: number;
  distance: number | null;
  intensity: Intensity;
  calories: number | null;
  note: string | null;
  imageUrls: string[];
  comboTag: string | null;
  completed: boolean;
}

export interface CatalogItem {
  id: string;
  activityType: string;
  nametr: string;
  nameen: string;
  category: string;
  metValue: number;
  hasDistance: boolean;
  iconName: string;
  color: string;
  estimatedKcalPer30?: number;
  userScore?: {
    score: AiScore;
    aiNote: string;
    benefits: string | null;
    cautions: string | null;
    frequency: string | null;
    bestTime: string | null;
  } | null;
}

export interface ActivitySubType {
  key: string;
  activityType: string;
  nametr: string;
  nameen: string;
  metValue: number;
  iconName: string;
  intensity: string;
}

export interface AllRecord {
  activityType: string;
  totalCount: number;
  thisMonthCount: number;
  longestDuration: number;
  longestDurationDate: string | null;
  prevLongestDuration: number;
  mostCalories: number;
  mostCaloriesDate: string | null;
  prevMostCalories: number;
  avgDuration: number;
  lastDone: string | null;
  daysSinceDurationRecord: number | null;
  daysSinceCaloriesRecord: number | null;
  last5Durations: number[];
}

export interface PersonalRecord {
  longestDuration: number;
  mostCalories: number;
  thisMonthCount: number;
  totalCount: number;
  lastDone: string | null;
  avgDuration: number;
}

export interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  city: string;
  humidity: number;
  feelsLike: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const CATEGORY_ORDER = ['cardio', 'water', 'sport', 'mind_body', 'recovery', 'other'];

const CATEGORY_LABELS: Record<string, string> = {
  cardio: 'Kardiyo',
  water: 'Su Sporları',
  recovery: 'Toparlanma',
  sport: 'Spor',
  mind_body: 'Zihin & Beden',
  other: 'Diğer',
};

const INTENSITY_CONFIG: Record<Intensity, { label: string; color: string; bg: string }> = {
  low: { label: 'Düşük', color: '#0A84FF', bg: '#E8F4FF' },
  medium: { label: 'Orta', color: '#FF9F0A', bg: '#FFF3E0' },
  high: { label: 'Yüksek', color: '#FF3B30', bg: '#FFE8E7' },
};

const SCORE_CONFIG: Record<AiScore, { bg: string; border: string; dot: string; label: string }> = {
  green: { bg: '#F0FDF4', border: '#86EFAC', dot: '#22C55E', label: 'Önerilir' },
  yellow: { bg: '#FEFCE8', border: '#FDE047', dot: '#EAB308', label: 'Dikkatli' },
  red: { bg: '#FFF1F2', border: '#FECDD3', dot: '#F43F5E', label: 'Riskli' },
};

export function IntensityBar({ intensity }: { intensity: Intensity }) {
  const cfg = INTENSITY_CONFIG[intensity];
  const filled = intensity === 'low' ? 1 : intensity === 'medium' ? 2 : 3;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              width: 6,
              height: i <= filled ? 14 : 10,
              borderRadius: 3,
              backgroundColor: i <= filled ? cfg.color : '#E5E5EA',
              alignSelf: 'flex-end',
            }}
          />
        ))}
      </View>
      <Text style={{ fontSize: 12, fontWeight: '600', color: cfg.color }}>{cfg.label}</Text>
    </View>
  );
}

export function getCatalogItem(catalog: CatalogItem[], type: string) {
  return catalog.find((c) => c.activityType === type);
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min}dk`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}s` : `${h}s ${m}dk`;
}

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

export function formatDate(d: Date) {
  return `${DAYS_TR[(d.getDay() + 6) % 7]}, ${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;
}
export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
export function toDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
export function getFirstDayOfMonth(y: number, m: number) {
  return (new Date(y, m, 1).getDay() + 6) % 7;
}

// ─── Arrow / Add Buttons ──────────────────────────────────────────────────────
export function ArrowBtn({
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

export function AddBtn({ onPress }: { onPress: () => void }) {
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

// ─── Date Header ──────────────────────────────────────────────────────────────
export function DateHeader({
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
  wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20 },
  sideBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
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

// ─── Calendar Modal ───────────────────────────────────────────────────────────
export function CalendarModal({
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
  ) => Promise<{
    days: Record<
      string,
      { count: number; totalMinutes: number; imageUrl: string | null; imageCount: number }
    >;
    userCreatedAt: string;
  }>;
}) {
  const [viewYear, setViewYear] = useState(current.getFullYear());
  const [viewMonth, setViewMonth] = useState(current.getMonth());
  const [mounted, setMounted] = useState(false);
  const [monthData, setMonthData] = useState<
    Record<
      string,
      { count: number; totalMinutes: number; imageUrl: string | null; imageCount: number }
    >
  >({});
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
        setPrevLastHas((prev.days[prevLastStr]?.count ?? 0) > 0);
        const nextFirstStr = `${nextY}-${String(nextM).padStart(2, '0')}-01`;
        setNextFirstHas((next.days[nextFirstStr]?.count ?? 0) > 0);
        Animated.timing(streakRingAnim, {
          toValue: 1,
          duration: 340,
          useNativeDriver: true,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }).start();
      })
      .catch(() => {});
  }, [visible, viewYear, viewMonth]);

  function actColor(min: number) {
    if (min >= 60) return ACCENT;
    if (min >= 30) return '#FF9F0A';
    if (min > 0) return '#FFD60A';
    return null;
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
  function hasAct(d: number) {
    if (d < 1 || d > daysInMonth) return false;
    return (monthData[dayStr(d)]?.count ?? 0) > 0;
  }
  function isStreak(day: number): boolean {
    if (!hasAct(day)) return false;
    const prevHas = day === 1 ? prevLastHas : hasAct(day - 1);
    const nextHas = day === daysInMonth ? nextFirstHas : hasAct(day + 1);
    return prevHas || nextHas;
  }
  // For ring position: is this day the start, middle, or end of a streak?
  function streakPos(day: number): 'start' | 'mid' | 'end' | 'solo' {
    if (!isStreak(day)) return 'solo';
    const prevHas = day === 1 ? prevLastHas : hasAct(day - 1);
    const nextHas = day === daysInMonth ? nextFirstHas : hasAct(day + 1);
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
              const col = !fut && monthData[str] ? actColor(monthData[str]!.totalMinutes) : null;
              const imgUrl = !fut && monthData[str]?.imageUrl ? monthData[str]!.imageUrl! : null;
              const imgCount = !fut && monthData[str]?.imageCount ? monthData[str]!.imageCount : 0;
              const cellSize = CELL_W - 6;
              const inStreak = !fut && isStreak(day);
              const pos = inStreak ? streakPos(day) : 'solo';

              // Streak connector bar (horizontal pill connecting consecutive days)
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
                      {/* Streak connector bars */}
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
                      {/* Streak ring */}
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
                            overflow: 'hidden',
                          },
                          sel && { backgroundColor: col ?? ACCENT },
                          tod && !sel && { borderWidth: 1.5, borderColor: col ?? ACCENT },
                        ]}
                      >
                        {imgUrl && !sel && (
                          <Image
                            source={{ uri: imgUrl }}
                            style={{
                              position: 'absolute',
                              width: cellSize,
                              height: cellSize,
                              borderRadius: cellSize / 2,
                            }}
                            resizeMode="cover"
                          />
                        )}
                        {imgUrl && !sel && (
                          <View
                            style={{
                              position: 'absolute',
                              width: cellSize,
                              height: cellSize,
                              borderRadius: cellSize / 2,
                              backgroundColor: 'rgba(0,0,0,0.28)',
                            }}
                          />
                        )}
                        <Text
                          style={[
                            { fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
                            sel && { color: '#fff', fontWeight: '700' },
                            tod && !sel && { color: col ?? ACCENT, fontWeight: '700' },
                            fut && { color: '#C7C7CC' },
                            !sel && !tod && !fut && col && { color: col, fontWeight: '600' },
                            imgUrl && !sel && { color: '#fff', fontWeight: '700' },
                            inStreak && !sel && { fontWeight: '700' },
                          ]}
                        >
                          {day}
                        </Text>
                        {imgUrl && !sel && imgCount > 1 && (
                          <View
                            style={{
                              position: 'absolute',
                              bottom: 2,
                              right: 2,
                              backgroundColor: ACCENT,
                              borderRadius: 6,
                              paddingHorizontal: 3,
                              paddingVertical: 1,
                              minWidth: 14,
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 8, fontWeight: '800', color: '#fff' }}>
                              +{imgCount - 1}
                            </Text>
                          </View>
                        )}
                      </View>
                      {/* Streak flame badge on top-right */}
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
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
  },
  todayTxt: { color: ACCENT, fontSize: 15, fontWeight: '700' },
});

// ─── Weather Widget ───────────────────────────────────────────────────────────
export function WeatherWidget({ weather }: { weather: WeatherData }) {
  return (
    <View style={ww.card}>
      <View style={ww.left}>
        <Text style={ww.temp}>{Math.round(weather.temp)}°</Text>
        <Text style={ww.desc}>{weather.description}</Text>
      </View>
      <View style={ww.right}>
        <Text style={ww.city}>📍 {weather.city}</Text>
        <Text style={ww.detail}>
          Hissedilen {Math.round(weather.feelsLike)}° · Nem %{weather.humidity}
        </Text>
      </View>
    </View>
  );
}

const ww = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  left: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  temp: { fontSize: 28, fontWeight: '800', color: '#1C1C1E' },
  desc: { fontSize: 14, color: '#636366', textTransform: 'capitalize' },
  right: { alignItems: 'flex-end' },
  city: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  detail: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
});

// ─── Combo Banner ─────────────────────────────────────────────────────────────
export function ComboBanner({ combos }: { combos: ActivityCombo[] }) {
  const [idx, setIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const combo = combos[idx]!;

  const next = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setIdx((i) => (i + 1) % combos.length), 150);
  };

  return (
    <Pressable onPress={combos.length > 1 ? next : undefined}>
      <View style={cb.card}>
        <View style={[cb.iconWrap, { backgroundColor: combo.color + '20' }]}>
          <Ionicons name={combo.icon as any} size={22} color={combo.color} />
        </View>
        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {combo.badge && <Text style={{ fontSize: 14 }}>{combo.badge}</Text>}
            <Text style={cb.name}>{combo.nametr}</Text>
            <View style={[cb.xpBadge, { backgroundColor: combo.color + '15' }]}>
              <Text style={[cb.xpTxt, { color: combo.color }]}>+{combo.xpBonus} XP</Text>
            </View>
          </View>
          <Text style={cb.insight} numberOfLines={2}>
            {combo.aiInsight}
          </Text>
        </Animated.View>
        {combos.length > 1 && (
          <View style={cb.dotsWrap}>
            {combos.map((_, i) => (
              <View
                key={i}
                style={[cb.dot, i === idx && { backgroundColor: combo.color, width: 12 }]}
              />
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const cb = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  xpBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  xpTxt: { fontSize: 11, fontWeight: '800' },
  insight: { fontSize: 12, color: '#636366', marginTop: 3, lineHeight: 17 },
  dotsWrap: { flexDirection: 'row', gap: 4, alignSelf: 'flex-end' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#D1D1D6' },
});

// ─── Goal Modal ───────────────────────────────────────────────────────────────
const GOAL_MIN_OPTS = [20, 30, 45, 60, 75, 90, 120];
const GOAL_CAL_OPTS = [200, 300, 400, 500, 600, 800, 1000];
const OPT_COLS = 3;
const OPT_CELL = (SW - 48 - 10 * (OPT_COLS - 1)) / OPT_COLS;

export function GoalModal({
  visible,
  currentGoal,
  currentGoalType,
  currentCalGoal,
  onClose,
  onSave,
}: {
  visible: boolean;
  currentGoal: number;
  currentGoalType: GoalType;
  currentCalGoal: number;
  onClose: () => void;
  onSave: (value: number, type: GoalType) => void;
}) {
  const [goalType, setGoalType] = useState<GoalType>(currentGoalType);
  const [selMin, setSelMin] = useState(currentGoal);
  const [selCal, setSelCal] = useState(currentCalGoal);
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setGoalType(currentGoalType);
      setSelMin(currentGoal);
      setSelCal(currentCalGoal);
      setCustomMode(false);
      setCustomInput('');
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

  const opts = goalType === 'minutes' ? GOAL_MIN_OPTS : GOAL_CAL_OPTS;
  const selected = goalType === 'minutes' ? selMin : selCal;
  const setSelected = (v: number) => (goalType === 'minutes' ? setSelMin(v) : setSelCal(v));
  const unit = goalType === 'minutes' ? 'dk' : 'kcal';

  const handleSave = () => {
    let val = selected;
    if (customMode) {
      const parsed = parseInt(customInput);
      if (!parsed || parsed < 1) return;
      val = parsed;
    }
    onSave(val, goalType);
    onClose();
  };

  if (!mounted) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[gm.overlay, { opacity: opAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[gm.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={gm.handle} />
          <Text style={gm.title}>Günlük Hedef</Text>

          {/* Tip seçici */}
          <View style={gm.typeRow}>
            {(['minutes', 'calories'] as GoalType[]).map((t) => (
              <Pressable
                key={t}
                style={[gm.typeBtn, goalType === t && gm.typeBtnActive]}
                onPress={() => {
                  setGoalType(t);
                  setCustomMode(false);
                  setCustomInput('');
                }}
              >
                <Ionicons
                  name={t === 'minutes' ? 'time-outline' : 'flame-outline'}
                  size={15}
                  color={goalType === t ? '#fff' : '#8E8E93'}
                />
                <Text style={[gm.typeTxt, goalType === t && gm.typeTxtActive]}>
                  {t === 'minutes' ? 'Dakika' : 'Kalori'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={gm.sub}>
            {goalType === 'minutes'
              ? 'Kaç dakika aktif olmak istiyorsun?'
              : 'Kaç kalori yakmak istiyorsun?'}
          </Text>

          <View style={gm.optsWrap}>
            {opts.map((val) => {
              const sel = !customMode && selected === val;
              return (
                <Pressable
                  key={val}
                  style={[gm.opt, sel && gm.optActive]}
                  onPress={() => {
                    setSelected(val);
                    setCustomMode(false);
                    setCustomInput('');
                  }}
                >
                  <Text style={[gm.optVal, sel && gm.optValActive]}>{val}</Text>
                  <Text style={[gm.optUnit, sel && gm.optUnitActive]}>{unit}</Text>
                </Pressable>
              );
            })}
            {/* Özel seçenek */}
            <Pressable
              style={[gm.opt, customMode && gm.optActive]}
              onPress={() => {
                setCustomMode(true);
                setCustomInput('');
              }}
            >
              <Text style={[gm.optVal, customMode && gm.optValActive]}>Özel</Text>
              <Text style={[gm.optUnit, customMode && gm.optUnitActive]}>{unit}</Text>
            </Pressable>
          </View>

          {customMode && (
            <View style={gm.customRow}>
              <TextInput
                style={gm.customInput}
                placeholder={`Hedef gir (${unit})`}
                placeholderTextColor="#8E8E93"
                keyboardType="number-pad"
                value={customInput}
                onChangeText={setCustomInput}
                autoFocus
                maxLength={5}
              />
              <Text style={gm.customUnit}>{unit}</Text>
            </View>
          )}

          <Pressable style={gm.saveBtn} onPress={handleSave}>
            <Text style={gm.saveTxt}>Kaydet</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const gm = StyleSheet.create({
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
  title: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', marginBottom: 16 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeBtnActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  typeTxt: { fontSize: 14, fontWeight: '700', color: '#8E8E93' },
  typeTxtActive: { color: '#fff' },
  sub: { fontSize: 14, color: '#8E8E93', marginBottom: 20 },
  optsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  opt: {
    width: OPT_CELL,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  optActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  optVal: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  optValActive: { color: '#fff' },
  optUnit: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  optUnitActive: { color: 'rgba(255,255,255,0.8)' },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 8,
  },
  customInput: { flex: 1, fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  customUnit: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  saveBtn: {
    backgroundColor: ACCENT,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  subTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 8 },
  subTypeCell: {
    width: (SW - 80 - 12) / 2,
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 10,
    gap: 8,
  },
  subTypeIcon: { width: 56, height: 56 },
  subTypeIconFallback: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTypeName: { fontSize: 13, fontWeight: '600', color: '#1C1C1E', textAlign: 'center' },
  subTypeMet: { fontSize: 11, color: '#8E8E93', fontWeight: '500' },
});

// ─── Summary Card ─────────────────────────────────────────────────────────────
// ─── Pamuk Section ────────────────────────────────────────────────────────────
export function PamukSection({
  logs,
  goal,
  goalType,
}: {
  logs: ActivityLog[];
  goal: number;
  goalType: GoalType;
}) {
  const completed = logs.filter((l) => l.completed);
  const achieved =
    goalType === 'minutes'
      ? completed.reduce((s, l) => s + l.duration, 0)
      : completed.reduce((s, l) => s + (l.calories ?? 0), 0);
  const pct = goal > 0 ? achieved / goal : 0;

  const mood: PamukMood =
    pct >= 1 ? 'celebrating' : pct >= 0.5 ? 'excited' : pct > 0 ? 'happy' : 'idle';

  const hour = new Date().getHours();
  const greeting =
    hour < 6
      ? 'Gece geç saatler 🌙'
      : hour < 12
        ? 'Günaydın! ☀️'
        : hour < 17
          ? 'İyi günler! 👋'
          : hour < 21
            ? 'İyi akşamlar! 🌆'
            : 'İyi geceler! 🌙';

  const message =
    mood === 'celebrating'
      ? 'Hedefine ulaştın, süpersin! 🎉'
      : mood === 'excited'
        ? 'Çok iyisin, devam et!'
        : mood === 'happy'
          ? 'Harika gidiyor, dur durma!'
          : logs.length > 0
            ? 'Hadi başla, bekleyorum!'
            : greeting;

  return (
    <View style={pk.wrap}>
      <Pamuk mood={mood} size={150} />
      <View style={pk.textWrap}>
        <Text style={pk.msg}>{message}</Text>
        {logs.length === 0 && <Text style={pk.sub}>Bugün henüz aktivite yok.</Text>}
      </View>
    </View>
  );
}

const pk = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    gap: 12,
  },
  textWrap: { flex: 1 },
  msg: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  sub: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
});

export function SummaryCard({
  logs,
  goal,
  goalType,
  onGoalPress,
}: {
  logs: ActivityLog[];
  goal: number;
  goalType: GoalType;
  onGoalPress: () => void;
}) {
  const completedLogs = logs.filter((l) => l.completed);
  const completedMin = completedLogs.reduce((s, l) => s + l.duration, 0);
  const completedCal = completedLogs.reduce((s, l) => s + (l.calories ?? 0), 0);
  const completedCnt = completedLogs.length;
  const achieved = goalType === 'minutes' ? completedMin : completedCal;
  const unit = goalType === 'minutes' ? 'dk' : 'kcal';
  const pct = goal > 0 ? Math.min(Math.round((achieved / goal) * 100), 100) : 0;

  const progAnim = useRef(new Animated.Value(pct / 100)).current;
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

    Animated.timing(progAnim, {
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

  const animColor = progAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['#FF3B30', '#FF6914', '#FFCC00', '#8CD64A', '#30D158'],
  });

  return (
    <View style={sc.card}>
      {/* Üst satır: sol bilgi + sağ yüzde */}
      <View style={sc.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={sc.label}>Günlük ilerleme</Text>
          <Text style={sc.val}>
            {completedCnt}/{logs.length} tamamlandı
          </Text>
          <Text style={sc.subVal}>
            {achieved}
            {unit} / {goal}
            {unit}
          </Text>
        </View>
        <View style={sc.pctWrap}>
          <Animated.Text style={[sc.pctTxt, { color: animColor }]}>{shownPct}%</Animated.Text>
          <Text style={sc.pctLabel}>tamamlandı</Text>
        </View>
      </View>
      {/* Full-width progress bar */}
      <View style={sc.progressBg}>
        <Animated.View
          style={[
            sc.progressFill,
            {
              width: progAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              backgroundColor: animColor,
            },
          ]}
        />
      </View>
      <Pressable onPress={onGoalPress} style={sc.goalBtn}>
        <Ionicons name="pencil" size={11} color={ACCENT} />
        <Text style={sc.goalTxt}>Hedefi değiştir</Text>
      </Pressable>
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14 },
  label: { color: '#8E8E93', fontSize: 13 },
  val: { color: '#1C1C1E', fontSize: 22, fontWeight: '800', marginVertical: 6 },
  subVal: { fontSize: 13, color: '#8E8E93' },
  progressBg: { height: 8, backgroundColor: '#F2F2F7', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  goalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: `${ACCENT}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  goalTxt: { fontSize: 12, fontWeight: '600', color: ACCENT },
  pctWrap: { alignItems: 'center', marginLeft: 20 },
  pctTxt: { fontSize: 28, fontWeight: '800' },
  pctLabel: { color: '#8E8E93', fontSize: 11, marginTop: 2 },
});

// ─── Add Modal ────────────────────────────────────────────────────────────────
const DURATION_OPTS = [
  '5',
  '10',
  '15',
  '20',
  '25',
  '30',
  '45',
  '60',
  '75',
  '90',
  '105',
  '120',
  '150',
  '180',
  '210',
  '240',
  '300',
  '360',
  'Özel',
];
const ROW_H = 44;

const CUSTOM_ACT_KEY = 'user_custom_activities_v1';

interface CustomActivity {
  id: string;
  activityType: string;
  nametr: string;
  category: string;
  iconKey: string | null;
  iconUri: string | null;
  estimatedKcalPer30: number | null;
}

const CUSTOM_CAT_OPTIONS = [
  { val: 'cardio', label: 'Kardiyo', color: '#FF3B30' },
  { val: 'sport', label: 'Spor', color: '#0A84FF' },
  { val: 'water', label: 'Su', color: '#32ADE6' },
  { val: 'mind_body', label: 'Zihin', color: '#5E5CE6' },
  { val: 'recovery', label: 'Toparlanma', color: '#30D158' },
  { val: 'other', label: 'Diğer', color: '#FF6B35' },
];

export function customToCatalogItem(c: CustomActivity): CatalogItem {
  const catOpt =
    CUSTOM_CAT_OPTIONS.find((o) => o.val === c.category) ??
    CUSTOM_CAT_OPTIONS[CUSTOM_CAT_OPTIONS.length - 1]!;
  return {
    id: c.id,
    activityType: c.activityType,
    nametr: c.nametr,
    nameen: c.nametr,
    category: c.category,
    metValue: 0,
    hasDistance: false,
    iconName: c.iconKey ?? 'ellipsis-horizontal-circle-outline',
    color: catOpt.color,
    estimatedKcalPer30: c.estimatedKcalPer30 ?? undefined,
  };
}

export function renderCustomIcon(ca: CustomActivity, size = 44): React.ReactNode {
  const iconSrc = ca.iconKey ? ALL_ACTIVITY_ICONS[ca.iconKey] : null;
  const uri = ca.iconUri;
  if (uri)
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: 8 }}
        resizeMode="cover"
      />
    );
  if (iconSrc)
    return <Image source={iconSrc} style={{ width: size, height: size }} resizeMode="contain" />;
  return <Ionicons name="ellipsis-horizontal-circle-outline" size={size * 0.6} color="#8E8E93" />;
}

export function PickerWheel({
  items,
  value,
  onChange,
  width,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
  width: number;
}) {
  const ref = useRef<ScrollView>(null);
  const initIdx = Math.max(0, items.indexOf(value));
  const scrollY = useRef(new Animated.Value(initIdx * ROW_H)).current;

  useEffect(() => {
    const i = Math.max(0, items.indexOf(value));
    scrollY.setValue(i * ROW_H);
    setTimeout(() => ref.current?.scrollTo({ y: i * ROW_H, animated: false }), 30);
  }, []);

  const onMomentumEnd = (e: any) => {
    const i = Math.max(
      0,
      Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.y / ROW_H)),
    );
    if (items[i] !== value) onChange(items[i]!);
  };
  const onDragEnd = (e: any) => {
    const i = Math.max(
      0,
      Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.y / ROW_H)),
    );
    ref.current?.scrollTo({ y: i * ROW_H, animated: true });
    if (items[i] !== value) onChange(items[i]!);
  };

  return (
    <View style={{ width, height: ROW_H * 3, overflow: 'hidden' }}>
      <Animated.ScrollView
        ref={ref as any}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ROW_H }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumEnd}
        onScrollEndDrag={onDragEnd}
      >
        {items.map((item, i) => {
          const inputRange = [(i - 1) * ROW_H, i * ROW_H, (i + 1) * ROW_H];
          const scale = scrollY.interpolate({
            inputRange,
            outputRange: [0.72, 1, 0.72],
            extrapolate: 'clamp',
          });
          const opacity = scrollY.interpolate({
            inputRange,
            outputRange: [0.28, 1, 0.28],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={item}
              style={{
                height: ROW_H,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale }],
                opacity,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1C1C1E' }}>{item}</Text>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: ROW_H,
          height: ROW_H,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: '#3C3C4360',
        }}
      />
    </View>
  );
}

// ─── Fitness Categories ───────────────────────────────────────────────────────
const FITNESS_CAT_LABELS: Record<string, string> = {
  evde: 'Evde',
  salonda: 'Salonda',
  outdoor: 'Outdoor',
};
const FITNESS_CAT_COLORS: Record<string, string> = {
  evde: '#30D158',
  salonda: '#0A84FF',
  outdoor: '#FF9500',
};
const FITNESS_CATS = ['evde', 'salonda', 'outdoor'] as const;

export function AddModal({
  visible,
  onClose,
  catalog,
  onAdd,
  date,
  fetchSubTypes,
  initialFav,
  checkIsFav,
  toggleFav,
}: {
  visible: boolean;
  onClose: () => void;
  catalog: CatalogItem[];
  onAdd: (data: object) => Promise<void>;
  date: string;
  fetchSubTypes: (activityType: string) => Promise<ActivitySubType[]>;
  initialFav?: FavoriteEntry;
  checkIsFav?: (id: string) => boolean;
  toggleFav?: (entry: FavoriteEntry) => void;
}) {
  const { session } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<'pick' | 'subtype' | 'form' | 'custom'>('pick');
  const [sel, setSel] = useState<CatalogItem | null>(null);
  const [subTypes, setSubTypes] = useState<ActivitySubType[]>([]);
  const [selSub, setSelSub] = useState<ActivitySubType | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [dur, setDur] = useState('30');
  const [customDur, setCustomDur] = useState('');
  const [int, setInt] = useState<Intensity>('medium');
  const [dist, setDist] = useState('');
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [customActivities, setCustomActivities] = useState<CustomActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customSel, setCustomSel] = useState<CustomActivity | null>(null);
  const [customName, setCustomName] = useState('');
  const [customIconKey, setCustomIconKey] = useState<string | null>(null);
  const [customIconUri, setCustomIconUri] = useState<string | null>(null);
  const [customCat, setCustomCat] = useState('other');
  const [customKcal, setCustomKcal] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;
  const stepOp = useRef(new Animated.Value(1)).current;
  const stepTx = useRef(new Animated.Value(0)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;

  const handleFavPress = () => {
    if (!sel || !toggleFav) return;
    const entry: FavoriteEntry = {
      id: `${sel.activityType}:${selSub?.key ?? ''}`,
      activityType: sel.activityType,
      subType: selSub?.key ?? null,
      nametr: selSub ? selSub.nametr : sel.nametr,
      subTypeNametr: selSub ? selSub.nametr : null,
      color: sel.color,
      iconName: selSub ? selSub.iconName : sel.iconName,
    };
    toggleFav(entry);
    Animated.sequence([
      Animated.spring(heartAnim, {
        toValue: 1.4,
        useNativeDriver: true,
        tension: 200,
        friction: 5,
      }),
      Animated.spring(heartAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();
  };

  const animateStep = useCallback((forward: boolean, fn: () => void) => {
    Animated.parallel([
      Animated.timing(stepOp, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
      Animated.timing(stepTx, {
        toValue: forward ? -24 : 24,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
    ]).start(() => {
      stepTx.setValue(forward ? 24 : -24);
      fn();
      Animated.parallel([
        Animated.timing(stepOp, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        Animated.timing(stepTx, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      ]).start();
    });
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setSubTypes([]);
      setDur('30');
      setCustomDur('');
      setInt('medium');
      setDist('');
      setNote('');
      setPhotos([]);
      setCustomSel(null);
      setCustomName('');
      setCustomIconKey(null);
      setCustomIconUri(null);
      setCustomCat('other');
      setCustomKcal('');
      setShowUrlInput(false);
      setUrlInput('');
      setSearchQuery('');
      stepOp.setValue(1);
      stepTx.setValue(0);
      AsyncStorage.getItem(CUSTOM_ACT_KEY)
        .then((raw) => {
          if (raw) setCustomActivities(JSON.parse(raw));
        })
        .catch(() => {});
      if (initialFav) {
        const catalogItem = catalog.find((c) => c.activityType === initialFav.activityType) ?? null;
        setSel(catalogItem);
        setSelSub(
          initialFav.subType
            ? ({
                key: initialFav.subType,
                nametr: initialFav.subTypeNametr ?? '',
                nameen: '',
                metValue: 0,
                iconName: '',
                intensity: 'medium',
                activityType: initialFav.activityType,
              } as ActivitySubType)
            : null,
        );
        setStep('form');
      } else {
        setStep('pick');
        setSel(null);
        setSelSub(null);
      }
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

  const grouped = catalog.reduce<Record<string, CatalogItem[]>>((acc, item) => {
    const c = item.category;
    if (!acc[c]) acc[c] = [];
    acc[c]!.push(item);
    return acc;
  }, {});
  const groupedEntries = CATEGORY_ORDER.filter((c) => grouped[c]?.length)
    .map((c) => [c, grouped[c]!] as [string, CatalogItem[]])
    .concat(Object.entries(grouped).filter(([c]) => !CATEGORY_ORDER.includes(c)));
  const filteredEntries = searchQuery.trim()
    ? groupedEntries
        .map(
          ([cat, items]) =>
            [
              cat,
              items.filter((item: CatalogItem) =>
                item.nametr.toLowerCase().includes(searchQuery.toLowerCase()),
              ),
            ] as [string, CatalogItem[]],
        )
        .filter(([, items]) => (items as CatalogItem[]).length > 0)
    : groupedEntries;
  const filteredCustom = searchQuery.trim()
    ? customActivities.filter((ca) => ca.nametr.toLowerCase().includes(searchQuery.toLowerCase()))
    : customActivities;

  if (!mounted) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[am.overlay, { opacity: opAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View style={[am.sheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={am.handle} />
            <Animated.View style={{ opacity: stepOp, transform: [{ translateX: stepTx }] }}>
              {step === 'pick' && (
                <>
                  <Text style={am.title}>Aktivite Ekle</Text>
                  <Text style={am.sub}>Hangi aktiviteyi yaptın?</Text>
                  <View
                    style={{
                      marginHorizontal: 4,
                      marginBottom: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#F2F2F7',
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      height: 40,
                    }}
                  >
                    <Ionicons name="search" size={16} color="#8E8E93" style={{ marginRight: 8 }} />
                    <TextInput
                      style={{ flex: 1, fontSize: 15, color: '#1C1C1E' }}
                      placeholder="Aktivite ara..."
                      placeholderTextColor="#C7C7CC"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoCorrect={false}
                      autoCapitalize="none"
                      clearButtonMode="while-editing"
                    />
                  </View>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ maxHeight: SCREEN_H * 0.62 }}
                  >
                    {filteredCustom.length > 0 && (
                      <View style={{ marginTop: 22 }}>
                        <View style={am.catHeaderRow}>
                          <View style={[am.catDot, { backgroundColor: '#FF6B35' }]} />
                          <Text style={am.catLabel}>Özel Aktivitelerim</Text>
                        </View>
                        <View style={am.gridWrap}>
                          {filteredCustom.map((ca) => {
                            const ci = customToCatalogItem(ca);
                            return (
                              <Pressable
                                key={ca.id}
                                style={({ pressed }) => [am.gridCell, pressed && { opacity: 0.65 }]}
                                onPress={() =>
                                  animateStep(true, () => {
                                    setSel(ci);
                                    setCustomSel(ca);
                                    setStep('form');
                                  })
                                }
                              >
                                <View
                                  style={[am.gridIconBox, { backgroundColor: ci.color + '18' }]}
                                >
                                  {renderCustomIcon(ca, 70)}
                                </View>
                                <Text style={am.gridName} numberOfLines={2}>
                                  {ca.nametr}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    )}
                    {/* ── FITNESS SECTION ── */}
                    {!searchQuery.trim() && (
                      <View style={{ marginTop: 22 }}>
                        <View style={am.catHeaderRow}>
                          <View style={[am.catDot, { backgroundColor: ACCENT }]} />
                          <Text style={am.catLabel}>Fitness</Text>
                        </View>
                        <View style={am.gridWrap}>
                          {FITNESS_CATS.map((c) => {
                            const color = FITNESS_CAT_COLORS[c] ?? ACCENT;
                            const icons: Record<string, any> = {
                              evde: 'home-outline',
                              salonda: 'barbell-outline',
                              outdoor: 'leaf-outline',
                            };
                            return (
                              <Pressable
                                key={c}
                                style={({ pressed }) => [am.gridCell, pressed && { opacity: 0.65 }]}
                                onPress={() => {
                                  onClose();
                                  setTimeout(
                                    () =>
                                      router.push({
                                        pathname: '/(app)/tracking/fitness-session',
                                        params: { category: c, date },
                                      }),
                                    80,
                                  );
                                }}
                              >
                                <View style={[am.gridIconBox, { backgroundColor: color + '18' }]}>
                                  <Ionicons name={icons[c]} size={34} color={color} />
                                </View>
                                <Text style={am.gridName}>{FITNESS_CAT_LABELS[c]}</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {filteredEntries.map(([cat, items]) => (
                      <View key={cat} style={{ marginTop: 22 }}>
                        <View style={am.catHeaderRow}>
                          <View style={am.catDot} />
                          <Text style={am.catLabel}>{CATEGORY_LABELS[cat] ?? cat}</Text>
                        </View>
                        <View style={am.gridWrap}>
                          {items.map((item) => (
                            <Pressable
                              key={item.id}
                              style={({ pressed }) => [am.gridCell, pressed && { opacity: 0.65 }]}
                              onPress={async () => {
                                if (item.activityType === 'other') {
                                  animateStep(true, () => {
                                    setStep('custom');
                                  });
                                } else if (ACTIVITY_TYPES_WITH_SUBTYPES.has(item.activityType)) {
                                  animateStep(true, () => {
                                    setSel(item);
                                    setSubLoading(true);
                                    setStep('subtype');
                                  });
                                  const subs = await fetchSubTypes(item.activityType);
                                  setSubTypes(subs);
                                  setSubLoading(false);
                                } else {
                                  animateStep(true, () => {
                                    setSel(item);
                                    setStep('form');
                                  });
                                }
                              }}
                            >
                              <View
                                style={[am.gridIconBox, { backgroundColor: item.color + '18' }]}
                              >
                                {getMainActivityIcon(item.activityType) ? (
                                  <Image
                                    source={getMainActivityIcon(item.activityType)!}
                                    style={{ width: 70, height: 70 }}
                                    resizeMode="contain"
                                  />
                                ) : (
                                  <Ionicons
                                    name={item.iconName as any}
                                    size={26}
                                    color={item.color}
                                  />
                                )}
                                {item.userScore && (
                                  <View
                                    style={[
                                      am.gridScoreDot,
                                      { backgroundColor: SCORE_CONFIG[item.userScore.score].dot },
                                    ]}
                                  />
                                )}
                              </View>
                              <Text style={am.gridName} numberOfLines={2}>
                                {item.nametr}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    ))}
                    <View style={{ height: 24 }} />
                  </ScrollView>
                </>
              )}
              {step === 'subtype' && sel && (
                <>
                  {/* Header */}
                  <View style={am.subHeader}>
                    <Pressable
                      onPress={() => animateStep(false, () => setStep('pick'))}
                      style={am.subBackBtn}
                      hitSlop={12}
                    >
                      <Ionicons name="chevron-back" size={20} color="#1C1C1E" />
                    </Pressable>
                    <View style={[am.subHeaderIcon, { backgroundColor: sel.color + '18' }]}>
                      {getMainActivityIcon(sel.activityType) ? (
                        <Image
                          source={getMainActivityIcon(sel.activityType)!}
                          style={{ width: 36, height: 36 }}
                          resizeMode="contain"
                        />
                      ) : (
                        <Ionicons name={sel.iconName as any} size={22} color={sel.color} />
                      )}
                    </View>
                    <View>
                      <Text style={am.subHeaderTitle}>{sel.nametr}</Text>
                      <Text style={am.subHeaderSub}>Tür seç</Text>
                    </View>
                  </View>

                  {subLoading ? (
                    <LoadingOverlay />
                  ) : (
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      style={{ maxHeight: SCREEN_H * 0.58 }}
                    >
                      <View style={{ gap: 10, paddingTop: 4 }}>
                        {subTypes.map((sub) => {
                          const icon = getActivitySubIcon(sub.iconName);
                          return (
                            <Pressable
                              key={sub.key}
                              onPress={() =>
                                animateStep(true, () => {
                                  setSelSub(sub);
                                  setInt(sub.intensity as Intensity);
                                  setStep('form');
                                })
                              }
                            >
                              {({ pressed }) => (
                                <View
                                  style={[
                                    am.subTypeRow,
                                    pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
                                  ]}
                                >
                                  <View
                                    style={[
                                      am.subTypeRowIcon,
                                      { backgroundColor: sel.color + '12' },
                                    ]}
                                  >
                                    {icon ? (
                                      <Image
                                        source={icon}
                                        style={{ width: 52, height: 52 }}
                                        resizeMode="contain"
                                      />
                                    ) : (
                                      <Ionicons
                                        name={sel.iconName as any}
                                        size={26}
                                        color={sel.color}
                                      />
                                    )}
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={am.subTypeRowName}>{sub.nametr}</Text>
                                    <View
                                      style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginTop: 4,
                                      }}
                                    >
                                      <View
                                        style={[
                                          am.subTypeMetBadge,
                                          { backgroundColor: sel.color + '15' },
                                        ]}
                                      >
                                        <Text style={[am.subTypeMetTxt, { color: sel.color }]}>
                                          ~
                                          {(() => {
                                            const INTENSITY_MULT: Record<string, number> = {
                                              low: 0.8,
                                              medium: 1.0,
                                              high: 1.25,
                                            };
                                            const mult = INTENSITY_MULT[sub.intensity] ?? 1.0;
                                            return Math.round(sub.metValue * mult * 75 * 0.5);
                                          })()}{' '}
                                          kcal / 30dk
                                        </Text>
                                      </View>
                                      <IntensityBar intensity={sub.intensity as Intensity} />
                                    </View>
                                  </View>
                                  <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
                                </View>
                              )}
                            </Pressable>
                          );
                        })}
                      </View>
                      <View style={{ height: 24 }} />
                    </ScrollView>
                  )}
                </>
              )}
              {step === 'custom' && (
                <>
                  <View style={am.subHeader}>
                    <Pressable
                      onPress={() => animateStep(false, () => setStep('pick'))}
                      style={am.subBackBtn}
                      hitSlop={12}
                    >
                      <Ionicons name="chevron-back" size={20} color="#1C1C1E" />
                    </Pressable>
                    <View>
                      <Text style={am.subHeaderTitle}>Özel Aktivite</Text>
                      <Text style={am.subHeaderSub}>Kendi aktiviteni oluştur</Text>
                    </View>
                  </View>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    style={{ maxHeight: SCREEN_H * 0.68 }}
                  >
                    <Text style={am.fieldLabel}>Aktivite Adı</Text>
                    <TextInput
                      style={am.input}
                      placeholder="ör. Jiujitsu, Crossfit, Pole Dans..."
                      placeholderTextColor="#C7C7CC"
                      value={customName}
                      onChangeText={setCustomName}
                      maxLength={40}
                    />

                    <Text style={[am.fieldLabel, { marginTop: 16 }]}>İkon Seç</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginHorizontal: -24 }}
                      contentContainerStyle={{
                        paddingHorizontal: 24,
                        gap: 10,
                        flexDirection: 'row',
                      }}
                    >
                      {/* Upload/URL option */}
                      <Pressable
                        onPress={async () => {
                          Alert.alert('İkon Ekle', 'Nasıl eklemek istersin?', [
                            {
                              text: 'Galeriden Seç',
                              onPress: async () => {
                                const perm =
                                  await ImagePicker.requestMediaLibraryPermissionsAsync();
                                if (!perm.granted) {
                                  Alert.alert('İzin Gerekli', 'Fotoğraflara erişim izni ver.');
                                  return;
                                }
                                const result = await ImagePicker.launchImageLibraryAsync({
                                  mediaTypes: ['images'],
                                  quality: 0.8,
                                  allowsEditing: true,
                                  aspect: [1, 1],
                                });
                                if (!result.canceled && result.assets[0]) {
                                  setCustomIconUri(result.assets[0].uri);
                                  setCustomIconKey(null);
                                }
                              },
                            },
                            { text: 'URL Gir', onPress: () => setShowUrlInput(true) },
                            { text: 'İptal', style: 'cancel' },
                          ]);
                        }}
                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      >
                        <View
                          style={[
                            am.customIconCell,
                            am.customIconUpload,
                            customIconUri != null &&
                              !customIconKey && {
                                borderColor: ACCENT,
                                backgroundColor: ACCENT + '15',
                              },
                          ]}
                        >
                          {customIconUri && !customIconKey ? (
                            <Image
                              source={{ uri: customIconUri }}
                              style={{ width: 44, height: 44, borderRadius: 6 }}
                              resizeMode="cover"
                            />
                          ) : (
                            <>
                              <Ionicons name="add-circle-outline" size={24} color={ACCENT} />
                              <Text
                                style={{
                                  fontSize: 9,
                                  fontWeight: '600',
                                  color: ACCENT,
                                  marginTop: 2,
                                  textAlign: 'center',
                                }}
                              >
                                {'Yükle'}
                              </Text>
                            </>
                          )}
                        </View>
                      </Pressable>
                      {/* Catalog icons */}
                      {Object.keys(ALL_ACTIVITY_ICONS).map((key) => (
                        <Pressable
                          key={key}
                          onPress={() => {
                            setCustomIconKey(key);
                            setCustomIconUri(null);
                          }}
                          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                        >
                          <View
                            style={[
                              am.customIconCell,
                              customIconKey === key && {
                                borderColor: ACCENT,
                                backgroundColor: ACCENT + '15',
                              },
                            ]}
                          >
                            <Image
                              source={ALL_ACTIVITY_ICONS[key]}
                              style={{ width: 44, height: 44 }}
                              resizeMode="contain"
                            />
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                    {showUrlInput && (
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                        <TextInput
                          style={[am.input, { flex: 1, fontSize: 13 }]}
                          placeholder="https://..."
                          placeholderTextColor="#C7C7CC"
                          value={urlInput}
                          onChangeText={setUrlInput}
                          autoCapitalize="none"
                          keyboardType="url"
                        />
                        <Pressable
                          style={{
                            backgroundColor: ACCENT,
                            borderRadius: 12,
                            paddingHorizontal: 14,
                            justifyContent: 'center',
                          }}
                          onPress={() => {
                            if (urlInput.trim()) {
                              setCustomIconUri(urlInput.trim());
                              setCustomIconKey(null);
                            }
                            setShowUrlInput(false);
                            setUrlInput('');
                          }}
                        >
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                            Tamam
                          </Text>
                        </Pressable>
                      </View>
                    )}

                    <Text style={[am.fieldLabel, { marginTop: 16 }]}>Kategori</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {CUSTOM_CAT_OPTIONS.map((cat) => {
                        const active = customCat === cat.val;
                        return (
                          <Pressable key={cat.val} onPress={() => setCustomCat(cat.val)}>
                            <View
                              style={[
                                am.catPill,
                                active && { backgroundColor: cat.color, borderColor: cat.color },
                              ]}
                            >
                              <Text style={[am.catPillTxt, active && { color: '#fff' }]}>
                                {cat.label}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>

                    <Text style={[am.fieldLabel, { marginTop: 16 }]}>Yoğunluk</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {(['low', 'medium', 'high'] as Intensity[]).map((lvl) => {
                        const cfg = INTENSITY_CONFIG[lvl];
                        const s = int === lvl;
                        return (
                          <Pressable key={lvl} onPress={() => setInt(lvl)} style={{ flex: 1 }}>
                            <View
                              style={[
                                am.intBtn,
                                s && { backgroundColor: cfg.bg, borderColor: cfg.color },
                              ]}
                            >
                              <Text
                                style={[am.intTxt, s && { color: cfg.color, fontWeight: '700' }]}
                              >
                                {cfg.label}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>

                    <Text style={[am.fieldLabel, { marginTop: 16 }]}>
                      Tahmini Kalori / 30dk (opsiyonel)
                    </Text>
                    <TextInput
                      style={am.input}
                      placeholder="ör. 200"
                      placeholderTextColor="#C7C7CC"
                      value={customKcal}
                      onChangeText={setCustomKcal}
                      keyboardType="number-pad"
                      maxLength={5}
                    />

                    <Pressable
                      style={[am.saveBtn, { marginTop: 24 }]}
                      onPress={() => {
                        if (!customName.trim()) {
                          Alert.alert('Hata', 'Aktivite adı girerek devam et.');
                          return;
                        }
                        const id = 'custom_' + Date.now();
                        const newCustom: CustomActivity = {
                          id,
                          activityType: id,
                          nametr: customName.trim(),
                          category: customCat,
                          iconKey: customIconKey,
                          iconUri: customIconUri,
                          estimatedKcalPer30: customKcal ? parseInt(customKcal) : null,
                        };
                        const ci = customToCatalogItem(newCustom);
                        AsyncStorage.getItem(CUSTOM_ACT_KEY)
                          .then((raw) => {
                            const existing = raw ? (JSON.parse(raw) as CustomActivity[]) : [];
                            AsyncStorage.setItem(
                              CUSTOM_ACT_KEY,
                              JSON.stringify([...existing, newCustom]),
                            ).catch(() => {});
                          })
                          .catch(() => {});
                        setCustomActivities((prev) => [...prev, newCustom]);
                        animateStep(true, () => {
                          setSel(ci);
                          setCustomSel(newCustom);
                          setStep('form');
                        });
                      }}
                    >
                      <Text style={am.saveTxt}>Oluştur ve Ekle</Text>
                    </Pressable>
                    <View style={{ height: 20 }} />
                  </ScrollView>
                </>
              )}
              {step === 'form' && sel && (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={am.formHeader}>
                    <Pressable
                      onPress={() =>
                        animateStep(false, () => {
                          setCustomSel(null);
                          if (ACTIVITY_TYPES_WITH_SUBTYPES.has(sel.activityType))
                            setStep('subtype');
                          else setStep('pick');
                        })
                      }
                      hitSlop={12}
                    >
                      <Ionicons name="chevron-back" size={22} color="#1C1C1E" />
                    </Pressable>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      {(() => {
                        if (customSel) return renderCustomIcon(customSel, 44);
                        const icon = selSub
                          ? getActivitySubIcon(selSub.iconName)
                          : getMainActivityIcon(sel.activityType);
                        return icon ? (
                          <Image
                            source={icon}
                            style={{ width: 44, height: 44 }}
                            resizeMode="contain"
                          />
                        ) : (
                          <View style={[am.formIcon, { backgroundColor: sel.color + '20' }]}>
                            <Ionicons name={sel.iconName as any} size={26} color={sel.color} />
                          </View>
                        );
                      })()}
                      <Text style={am.formTitle}>{selSub ? selSub.nametr : sel.nametr}</Text>
                    </View>
                    {toggleFav ? (
                      (() => {
                        const favId = `${sel.activityType}:${selSub?.key ?? ''}`;
                        const active = checkIsFav?.(favId) ?? false;
                        return (
                          <Pressable
                            onPress={handleFavPress}
                            hitSlop={12}
                            style={{ marginRight: 8 }}
                          >
                            <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
                              <Ionicons
                                name={active ? 'heart' : 'heart-outline'}
                                size={24}
                                color={active ? '#FF2D55' : '#C7C7CC'}
                              />
                            </Animated.View>
                          </Pressable>
                        );
                      })()
                    ) : (
                      <View style={{ width: 24 }} />
                    )}
                  </View>
                  <Text style={am.fieldLabel}>Süre</Text>
                  <View
                    style={{
                      backgroundColor: '#F2F2F7',
                      borderRadius: 14,
                      overflow: 'hidden',
                      alignItems: 'center',
                    }}
                  >
                    <PickerWheel
                      items={DURATION_OPTS}
                      value={dur}
                      onChange={setDur}
                      width={SW - 80}
                    />
                  </View>
                  {dur === 'Özel' ? (
                    <TextInput
                      style={[
                        am.input,
                        { marginTop: 8, textAlign: 'center', fontSize: 18, fontWeight: '700' },
                      ]}
                      placeholder="Dakika gir (ör. 130)"
                      placeholderTextColor="#C7C7CC"
                      value={customDur}
                      onChangeText={setCustomDur}
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                  ) : (
                    <Text
                      style={{ textAlign: 'center', color: '#8E8E93', fontSize: 13, marginTop: 4 }}
                    >
                      dakika
                    </Text>
                  )}
                  {!customSel && (
                    <>
                      <Text style={[am.fieldLabel, { marginTop: 16 }]}>Yoğunluk</Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {(['low', 'medium', 'high'] as Intensity[]).map((lvl) => {
                          const cfg = INTENSITY_CONFIG[lvl];
                          const s = int === lvl;
                          return (
                            <Pressable key={lvl} onPress={() => setInt(lvl)} style={{ flex: 1 }}>
                              <View
                                style={[
                                  am.intBtn,
                                  s && { backgroundColor: cfg.bg, borderColor: cfg.color },
                                ]}
                              >
                                <Text
                                  style={[am.intTxt, s && { color: cfg.color, fontWeight: '700' }]}
                                >
                                  {cfg.label}
                                </Text>
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    </>
                  )}
                  {sel.hasDistance && (
                    <>
                      <Text style={[am.fieldLabel, { marginTop: 16 }]}>
                        Mesafe (km) — opsiyonel
                      </Text>
                      <TextInput
                        style={am.input}
                        placeholder="5.2"
                        placeholderTextColor="#C7C7CC"
                        value={dist}
                        onChangeText={setDist}
                        keyboardType="decimal-pad"
                      />
                    </>
                  )}
                  <Text style={[am.fieldLabel, { marginTop: 16 }]}>Anılar — opsiyonel</Text>
                  <View style={am.photoGrid}>
                    {photos.map((uri, idx) => (
                      <View key={idx} style={am.photoThumb}>
                        <Image source={{ uri }} style={am.photoThumbImg} resizeMode="cover" />
                        <Pressable
                          style={am.photoThumbRemove}
                          onPress={() => setPhotos((p) => p.filter((_, i) => i !== idx))}
                          hitSlop={6}
                        >
                          <Ionicons name="close" size={14} color="#fff" />
                        </Pressable>
                      </View>
                    ))}
                    {photos.length < 4 && (
                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={am.photoAdd}
                        onPress={async () => {
                          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                          if (!perm.granted) {
                            Alert.alert('İzin Gerekli', 'Fotoğraflara erişim izni ver.');
                            return;
                          }
                          const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ['images'],
                            quality: 0.8,
                            allowsEditing: true,
                            aspect: [4, 3],
                          });
                          if (!result.canceled && result.assets[0])
                            setPhotos((p) => [...p, result.assets[0]!.uri]);
                        }}
                      >
                        <Ionicons name="camera-outline" size={24} color="#C7C7CC" />
                        <Text style={am.photoAddTxt}>
                          {photos.length === 0 ? 'Ekle' : `${photos.length}/4`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      marginTop: 16,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={am.fieldLabel}>Not — opsiyonel</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: note.length >= 180 ? '#FF3B30' : '#C7C7CC',
                        fontWeight: '500',
                      }}
                    >
                      {note.length}/200
                    </Text>
                  </View>
                  <TextInput
                    style={[am.input, { height: 72, textAlignVertical: 'top', paddingTop: 12 }]}
                    placeholder="Nasıl hissettin?"
                    placeholderTextColor="#C7C7CC"
                    value={note}
                    onChangeText={setNote}
                    multiline
                    maxLength={200}
                  />
                  <Pressable
                    style={[am.saveBtn, saving && { opacity: 0.7 }]}
                    onPress={async () => {
                      if (saving) return;
                      setSaving(true);
                      try {
                        const token = await session?.getToken();
                        const uploadedUrls: string[] = [];
                        for (const uri of photos) {
                          const fd = new FormData();
                          const ext = uri.split('.').pop() ?? 'jpg';
                          fd.append('file', {
                            uri,
                            name: `photo.${ext}`,
                            type: `image/${ext}`,
                          } as any);
                          const upRes = await fetch(`${API_URL}/api/upload/activity-image`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                            body: fd,
                          });
                          if (upRes.ok) {
                            const j = await upRes.json();
                            uploadedUrls.push(j.url);
                          }
                        }
                        const finalDur = dur === 'Özel' ? parseInt(customDur) || 30 : parseInt(dur);
                        const kcalOverride = customSel?.estimatedKcalPer30
                          ? Math.round((customSel.estimatedKcalPer30 * finalDur) / 30)
                          : undefined;
                        await onAdd({
                          activityType: sel.activityType,
                          subType: selSub?.key,
                          date,
                          duration: finalDur,
                          intensity: int,
                          distance: dist ? parseFloat(dist) : undefined,
                          note: note.trim() || undefined,
                          imageUrls: uploadedUrls,
                          calories: kcalOverride,
                        });
                        onClose();
                      } catch {
                        Alert.alert('Hata', 'Aktivite eklenemedi.');
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={am.saveTxt}>Kaydet</Text>
                    )}
                  </Pressable>
                  {customSel && (
                    <Pressable
                      style={am.deleteCustomBtn}
                      onPress={() => {
                        Alert.alert(
                          'Katalogdan Kaldır',
                          `"${customSel.nametr}" özel aktiviten silinecek. Geçmiş kayıtların etkilenmez.`,
                          [
                            { text: 'İptal', style: 'cancel' },
                            {
                              text: 'Kaldır',
                              style: 'destructive',
                              onPress: () => {
                                setCustomActivities((prev) => {
                                  const next = prev.filter((c) => c.id !== customSel.id);
                                  AsyncStorage.setItem(CUSTOM_ACT_KEY, JSON.stringify(next)).catch(
                                    () => {},
                                  );
                                  return next;
                                });
                                onClose();
                              },
                            },
                          ],
                        );
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                      <Text style={am.deleteCustomTxt}>Katalogdan Kaldır</Text>
                    </Pressable>
                  )}
                  <View style={{ height: 20 }} />
                </ScrollView>
              )}
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const GRID_COLS = 4;
const GRID_GAP = 10;
const GRID_PAD = 24;
const GRID_CELL_W = Math.floor((SW - GRID_PAD * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS);

const am = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    maxHeight: SCREEN_H * 0.92,
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
  sub: { fontSize: 14, color: '#8E8E93', marginBottom: 0 },
  catHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  catDot: { width: 4, height: 14, borderRadius: 2, backgroundColor: ACCENT },
  catLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3C3C43',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  gridCell: { width: GRID_CELL_W, alignItems: 'center' },
  gridIconBox: {
    width: GRID_CELL_W,
    height: GRID_CELL_W,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gridScoreDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  gridName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
  },
  fitPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  fitPillTxt: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  formIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#636366', marginBottom: 8 },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1C1C1E',
  },
  intBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  intTxt: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  saveBtn: {
    backgroundColor: ACCENT,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  subTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 8 },
  subTypeCell: {
    width: (SW - 80 - 12) / 2,
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 10,
    gap: 8,
  },
  subTypeIcon: { width: 56, height: 56 },
  subTypeIconFallback: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTypeName: { fontSize: 13, fontWeight: '600', color: '#1C1C1E', textAlign: 'center' },
  subTypeMet: { fontSize: 11, color: '#8E8E93', fontWeight: '500' },
  // subtype step — yeni tasarım
  subHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  subBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeaderIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeaderTitle: { fontSize: 20, fontWeight: '800', color: '#1C1C1E' },
  subHeaderSub: { fontSize: 13, color: '#8E8E93', marginTop: 1 },
  subTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F9F9FB',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  subTypeRowIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTypeRowName: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  subTypeMetBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  subTypeMetTxt: { fontSize: 12, fontWeight: '700' },
  subTypeIntBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  subTypeIntTxt: { fontSize: 12, fontWeight: '600' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumb: { width: (SW - 80 - 24) / 4, height: (SW - 80 - 24) / 4 },
  photoThumbImg: { width: '100%', height: '100%', borderRadius: 12 },
  photoThumbRemove: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
    width: 22,
    height: 22,
    backgroundColor: '#FF3B30',
    borderBottomLeftRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAdd: {
    width: (SW - 80 - 24) / 4,
    height: (SW - 80 - 24) / 4,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoAddTxt: { fontSize: 11, fontWeight: '600', color: '#C7C7CC' },
  customIconCell: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customIconUpload: {
    borderStyle: 'dashed',
    borderColor: ACCENT + '80',
    backgroundColor: ACCENT + '08',
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  catPillTxt: { fontSize: 13, fontWeight: '600', color: '#636366' },
  deleteCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  deleteCustomTxt: { fontSize: 14, fontWeight: '600', color: '#FF3B30' },
});

// ─── Detail Sheet ─────────────────────────────────────────────────────────────
export function DetailSheet({
  log,
  catalogItem,
  visible,
  onClose,
  onDelete,
  fetchSocialProof,
  dateStr,
  isFav,
  onToggleFav,
  onUpdateImages,
  onUpdateNote,
}: {
  log: ActivityLog | null;
  catalogItem: CatalogItem | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  fetchSocialProof: (type: string, date: string) => Promise<number>;
  dateStr: string;
  isFav: boolean;
  onToggleFav: () => void;
  onUpdateImages: (id: string, urls: string[]) => Promise<ActivityLog>;
  onUpdateNote: (id: string, note: string) => Promise<ActivityLog>;
}) {
  const { session } = useSession();
  const [snap, setSnap] = useState<{ log: ActivityLog; catalogItem: CatalogItem } | null>(null);
  const [socialCnt, setSocialCnt] = useState<number | null>(null);
  const [imgUrls, setImgUrls] = useState<string[]>([]);
  const [imgSaving, setImgSaving] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const lbScale = useRef(new Animated.Value(0.6)).current;
  const lbOpacity = useRef(new Animated.Value(0)).current;
  const [noteModal, setNoteModal] = useState(false);
  const [noteEdit, setNoteEdit] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const nmScale = useRef(new Animated.Value(0.92)).current;
  const nmOpacity = useRef(new Animated.Value(0)).current;

  const openLightbox = (uri: string) => {
    setLightbox(uri);
    lbScale.setValue(0.6);
    lbOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(lbScale, {
        toValue: 1,
        duration: 340,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(lbOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  };

  const openNoteModal = (current: string) => {
    setNoteEdit(current);
    setNoteModal(true);
    nmScale.setValue(0.92);
    nmOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(nmScale, {
        toValue: 1,
        duration: 340,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(nmOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  };

  const closeNoteModal = () => {
    Animated.parallel([
      Animated.timing(nmScale, {
        toValue: 0.92,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
      Animated.timing(nmOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
    ]).start(({ finished }) => {
      if (finished) setNoteModal(false);
    });
  };

  const closeLightbox = () => {
    Animated.parallel([
      Animated.timing(lbScale, {
        toValue: 0.6,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
      Animated.timing(lbOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
    ]).start(({ finished }) => {
      if (finished) setLightbox(null);
    });
  };
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;
  const deleteScale = useRef(new Animated.Value(1)).current;

  const handleFavPress = () => {
    onToggleFav();
    Animated.sequence([
      Animated.spring(heartAnim, {
        toValue: 1.4,
        useNativeDriver: true,
        tension: 200,
        friction: 5,
      }),
      Animated.spring(heartAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();
  };

  useEffect(() => {
    if (visible && log && catalogItem) {
      setSnap({ log, catalogItem });
      setSocialCnt(null);
      setImgUrls(log.imageUrls ?? []);
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
      fetchSocialProof(log.activityType, dateStr)
        .then(setSocialCnt)
        .catch(() => {});
    } else if (snap) {
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
        if (finished) setSnap(null);
      });
    }
  }, [visible]);

  if (!snap) return null;
  const { log: snapLog, catalogItem: snapCatalog } = snap;
  const intCfg = INTENSITY_CONFIG[snapLog.intensity];
  const scoreCfg = snapCatalog.userScore ? SCORE_CONFIG[snapCatalog.userScore.score] : null;
  const actIcon =
    snapLog.subType && getActivitySubIcon(snapLog.subType)
      ? getActivitySubIcon(snapLog.subType)
      : getMainActivityIcon(snapCatalog.activityType);

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[ds.overlay, { opacity: opAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[ds.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle + fav */}
          <View style={ds.topRow}>
            <View style={ds.handle} />
            <Pressable onPress={handleFavPress} hitSlop={12} style={ds.favBtn}>
              <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
                <Ionicons
                  name={isFav ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isFav ? '#FF2D55' : '#C7C7CC'}
                />
              </Animated.View>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Hero */}
            <View style={[ds.hero, { backgroundColor: snapCatalog.color + '12' }]}>
              <View style={[ds.heroIcon, { backgroundColor: snapCatalog.color + '22' }]}>
                {actIcon ? (
                  <Image source={actIcon} style={{ width: 52, height: 52 }} resizeMode="contain" />
                ) : (
                  <Ionicons
                    name={snapCatalog.iconName as any}
                    size={36}
                    color={snapCatalog.color}
                  />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ds.heroName}>
                  {snapLog.subTypeNametr ? `${snapCatalog.nametr}` : snapCatalog.nametr}
                </Text>
                {snapLog.subTypeNametr && (
                  <Text style={[ds.heroSub, { color: snapCatalog.color }]}>
                    {snapLog.subTypeNametr}
                  </Text>
                )}
                <Text style={ds.heroCat}>
                  {CATEGORY_LABELS[snapCatalog.category] ?? snapCatalog.category}
                </Text>
              </View>
              {scoreCfg && (
                <View
                  style={[
                    ds.scoreBadge,
                    { backgroundColor: scoreCfg.bg, borderColor: scoreCfg.border },
                  ]}
                >
                  <View style={[ds.scoreDot, { backgroundColor: scoreCfg.dot }]} />
                  <Text style={[ds.scoreLabel, { color: scoreCfg.dot }]}>{scoreCfg.label}</Text>
                </View>
              )}
            </View>

            {/* Stats grid */}
            <View style={ds.statsGrid}>
              <View style={ds.statBox}>
                <Ionicons name="time-outline" size={20} color={ACCENT} />
                <Text style={ds.statVal}>{formatDuration(snapLog.duration)}</Text>
                <Text style={ds.statLbl}>Süre</Text>
              </View>
              <View style={ds.statDivider} />
              <View style={ds.statBox}>
                <Ionicons name="pulse-outline" size={20} color={intCfg.color} />
                <Text style={[ds.statVal, { color: intCfg.color }]}>{intCfg.label}</Text>
                <Text style={ds.statLbl}>Yoğunluk</Text>
              </View>
              {snapLog.distance ? (
                <>
                  <View style={ds.statDivider} />
                  <View style={ds.statBox}>
                    <Ionicons name="location-outline" size={20} color="#8E8E93" />
                    <Text style={ds.statVal}>{snapLog.distance}km</Text>
                    <Text style={ds.statLbl}>Mesafe</Text>
                  </View>
                </>
              ) : null}
              {snapLog.calories ? (
                <>
                  <View style={ds.statDivider} />
                  <View style={ds.statBox}>
                    <Ionicons name="flame-outline" size={20} color="#FF9F0A" />
                    <Text style={ds.statVal}>{snapLog.calories}</Text>
                    <Text style={ds.statLbl}>kcal</Text>
                  </View>
                </>
              ) : null}
            </View>

            {/* Social proof */}
            {socialCnt !== null && socialCnt > 1 && (
              <View style={ds.infoRow}>
                <Ionicons name="people-outline" size={14} color="#0A84FF" />
                <Text style={ds.infoTxt}>
                  Bugün <Text style={{ fontWeight: '700', color: '#0A84FF' }}>{socialCnt}</Text>{' '}
                  kullanıcı {snapCatalog.nametr} yaptı
                </Text>
              </View>
            )}

            {/* Photos */}
            {(imgUrls.length > 0 || imgUrls.length < 4) && (
              <View style={{ marginBottom: 12 }}>
                {imgUrls.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 8 }}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {imgUrls.map((uri, idx) => (
                      <View key={idx} style={ds.photoThumb}>
                        <Pressable onPress={() => openLightbox(uri)} style={{ flex: 1 }}>
                          <Image source={{ uri }} style={ds.photoThumbImg} resizeMode="cover" />
                        </Pressable>
                        <Pressable
                          style={ds.photoThumbRemove}
                          hitSlop={6}
                          onPress={async () => {
                            const next = imgUrls.filter((_, i) => i !== idx);
                            setImgUrls(next);
                            setImgSaving(true);
                            try {
                              await onUpdateImages(snapLog.id, next);
                            } catch {
                              setImgUrls(imgUrls);
                            } finally {
                              setImgSaving(false);
                            }
                          }}
                        >
                          <Ionicons name="close" size={14} color="#fff" />
                        </Pressable>
                      </View>
                    ))}
                    {imgUrls.length < 4 && (
                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={ds.photoAdd}
                        onPress={async () => {
                          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                          if (!perm.granted) {
                            Alert.alert('İzin Gerekli', 'Fotoğraflara erişim izni ver.');
                            return;
                          }
                          const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ['images'],
                            quality: 0.8,
                            allowsEditing: true,
                            aspect: [4, 3],
                          });
                          if (result.canceled || !result.assets[0]) return;
                          setImgSaving(true);
                          try {
                            const fd = new FormData();
                            const uri = result.assets[0].uri;
                            const ext = uri.split('.').pop() ?? 'jpg';
                            fd.append('file', {
                              uri,
                              name: `photo.${ext}`,
                              type: `image/${ext}`,
                            } as any);
                            const token = await session?.getToken();
                            const upRes = await fetch(`${API_URL}/api/upload/activity-image`, {
                              method: 'POST',
                              headers: { Authorization: `Bearer ${token}` },
                              body: fd,
                            });
                            if (upRes.ok) {
                              const j = await upRes.json();
                              const next = [...imgUrls, j.url];
                              setImgUrls(next);
                              await onUpdateImages(snapLog.id, next);
                            }
                          } catch {
                            Alert.alert('Hata', 'Görsel eklenemedi.');
                          } finally {
                            setImgSaving(false);
                          }
                        }}
                      >
                        {imgSaving ? (
                          <ActivityIndicator size="small" color="#C7C7CC" />
                        ) : (
                          <Ionicons name="add" size={22} color="#C7C7CC" />
                        )}
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                )}
                {imgUrls.length === 0 && (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    style={ds.photoEmpty}
                    onPress={async () => {
                      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (!perm.granted) {
                        Alert.alert('İzin Gerekli', 'Fotoğraflara erişim izni ver.');
                        return;
                      }
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ['images'],
                        quality: 0.8,
                        allowsEditing: true,
                        aspect: [4, 3],
                      });
                      if (result.canceled || !result.assets[0]) return;
                      setImgSaving(true);
                      try {
                        const fd = new FormData();
                        const uri = result.assets[0].uri;
                        const ext = uri.split('.').pop() ?? 'jpg';
                        fd.append('file', {
                          uri,
                          name: `photo.${ext}`,
                          type: `image/${ext}`,
                        } as any);
                        const token = await session?.getToken();
                        const upRes = await fetch(`${API_URL}/api/upload/activity-image`, {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${token}` },
                          body: fd,
                        });
                        if (upRes.ok) {
                          const j = await upRes.json();
                          const next = [j.url];
                          setImgUrls(next);
                          await onUpdateImages(snapLog.id, next);
                        }
                      } catch {
                        Alert.alert('Hata', 'Görsel eklenemedi.');
                      } finally {
                        setImgSaving(false);
                      }
                    }}
                  >
                    <Ionicons name="camera-outline" size={22} color="#C7C7CC" />
                    <Text style={ds.photoEmptyTxt}>Anı ekle</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Note */}
            <Pressable onPress={() => openNoteModal(snapLog.note ?? '')}>
              <View style={ds.noteCard}>
                <View style={ds.noteIconWrap}>
                  <Ionicons name="chatbubble-ellipses" size={16} color="#5E5CE6" />
                </View>
                {snapLog.note ? (
                  <Text style={ds.noteTxt} numberOfLines={3}>
                    {snapLog.note}
                  </Text>
                ) : (
                  <Text style={[ds.noteTxt, { color: '#C7C7CC' }]}>Not ekle...</Text>
                )}
                <Ionicons
                  name="pencil-outline"
                  size={14}
                  color="#8E8E93"
                  style={{ marginLeft: 4 }}
                />
              </View>
            </Pressable>

            <View style={{ height: 8 }} />
          </ScrollView>

          {/* Delete */}
          <Animated.View style={{ transform: [{ scale: deleteScale }] }}>
            <Pressable
              style={ds.deleteBtn}
              onPressIn={() =>
                Animated.timing(deleteScale, {
                  toValue: 0.97,
                  duration: 120,
                  useNativeDriver: true,
                  easing: Easing.bezier(0.4, 0, 0.2, 1),
                }).start()
              }
              onPressOut={() =>
                Animated.timing(deleteScale, {
                  toValue: 1,
                  duration: 150,
                  useNativeDriver: true,
                  easing: Easing.bezier(0.4, 0, 0.2, 1),
                }).start()
              }
              onPress={() =>
                Alert.alert('Aktiviteyi Sil', 'Silmek istediğine emin misin?', [
                  { text: 'İptal', style: 'cancel' },
                  {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => {
                      onDelete(snapLog.id);
                      onClose();
                    },
                  },
                ])
              }
            >
              <Ionicons name="trash-outline" size={16} color="#FF3B30" />
              <Text style={ds.deleteTxt}>Aktiviteyi Sil</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Animated.View>

      {/* Note Modal */}
      {noteModal && (
        <Modal
          visible
          transparent
          animationType="none"
          onRequestClose={closeNoteModal}
          statusBarTranslucent
        >
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: nmOpacity,
              paddingHorizontal: 20,
            }}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={closeNoteModal} />
            <Animated.View
              style={{
                width: '100%',
                backgroundColor: '#fff',
                borderRadius: 24,
                padding: 20,
                transform: [{ scale: nmScale }],
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1C1C1E', marginBottom: 12 }}>
                Not
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#F2F2F7',
                  borderRadius: 14,
                  padding: 14,
                  fontSize: 15,
                  color: '#1C1C1E',
                  minHeight: 100,
                  textAlignVertical: 'top',
                }}
                value={noteEdit}
                onChangeText={setNoteEdit}
                multiline
                maxLength={200}
                placeholder="Nasıl hissettin?"
                placeholderTextColor="#C7C7CC"
                autoFocus
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 }}>
                <Text
                  style={{
                    fontSize: 12,
                    color: noteEdit.length >= 180 ? '#FF3B30' : '#C7C7CC',
                    fontWeight: '500',
                  }}
                >
                  {noteEdit.length}/200
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <Pressable
                  style={{
                    flex: 1,
                    paddingVertical: 13,
                    borderRadius: 14,
                    backgroundColor: '#F2F2F7',
                    alignItems: 'center',
                  }}
                  onPress={closeNoteModal}
                >
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#8E8E93' }}>İptal</Text>
                </Pressable>
                <Pressable
                  style={{
                    flex: 1,
                    paddingVertical: 13,
                    borderRadius: 14,
                    backgroundColor: ACCENT,
                    alignItems: 'center',
                    opacity: noteSaving ? 0.7 : 1,
                  }}
                  onPress={async () => {
                    if (noteSaving) return;
                    setNoteSaving(true);
                    try {
                      await onUpdateNote(snapLog.id, noteEdit);
                      setSnap((s) =>
                        s ? { ...s, log: { ...s.log, note: noteEdit.trim() || null } } : s,
                      );
                      closeNoteModal();
                    } catch {
                      Alert.alert('Hata', 'Not kaydedilemedi.');
                    } finally {
                      setNoteSaving(false);
                    }
                  }}
                >
                  {noteSaving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Kaydet</Text>
                  )}
                </Pressable>
              </View>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}

      {/* Lightbox */}
      {lightbox && (
        <Modal
          visible
          transparent
          animationType="none"
          onRequestClose={closeLightbox}
          statusBarTranslucent
        >
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.92)',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: lbOpacity,
            }}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={closeLightbox} />
            <Animated.View
              style={{ transform: [{ scale: lbScale }], width: SW, paddingHorizontal: 16 }}
            >
              <Image
                source={{ uri: lightbox }}
                style={{ width: SW - 32, height: (SW - 32) * 0.75, borderRadius: 20 }}
                resizeMode="cover"
              />
            </Animated.View>
            <Pressable
              onPress={closeLightbox}
              style={{
                position: 'absolute',
                top: 56,
                right: 20,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
          </Animated.View>
        </Modal>
      )}
    </Modal>
  );
}

const ds = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: SCREEN_H * 0.88,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
    marginBottom: 20,
  },
  handle: { width: 36, height: 4, backgroundColor: '#E5E5EA', borderRadius: 2 },
  favBtn: { position: 'absolute', right: 0, top: 10 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  heroSub: { fontSize: 14, fontWeight: '600', marginTop: 1 },
  heroCat: { fontSize: 12, color: '#8E8E93', marginTop: 3 },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  scoreDot: { width: 7, height: 7, borderRadius: 4 },
  scoreLabel: { fontSize: 12, fontWeight: '700' },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F9F9FB',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 5 },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: '#E5E5EA' },
  statVal: { fontSize: 17, fontWeight: '800', color: '#1C1C1E' },
  statLbl: { fontSize: 11, color: '#8E8E93' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  infoTxt: { flex: 1, fontSize: 13, color: '#636366', lineHeight: 18 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  recordGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  recordItem: {
    width: (SW - 40 - 10) / 2,
    backgroundColor: '#F9F9FB',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 5,
  },
  recordEmoji: { fontSize: 22 },
  recordVal: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  recordLbl: { fontSize: 11, color: '#8E8E93', textAlign: 'center' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 14,
    backgroundColor: '#FFF1F0',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  deleteTxt: { fontSize: 15, fontWeight: '700', color: '#FF3B30' },
  photoThumb: { width: 100, height: 100 },
  photoThumbImg: { width: 100, height: 100, borderRadius: 14 },
  photoThumbRemove: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
    width: 22,
    height: 22,
    backgroundColor: '#FF3B30',
    borderBottomLeftRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAdd: {
    width: 100,
    height: 100,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  photoEmptyTxt: { fontSize: 14, fontWeight: '600', color: '#C7C7CC' },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFEEFD',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  noteIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#5E5CE620',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  noteTxt: { flex: 1, fontSize: 15, fontWeight: '500', color: '#3A3A3C', lineHeight: 22 },
});

// ─── Swipeable Activity Card (with tick) ──────────────────────────────────────
const SWIPE_THRESHOLD = 50;
const DELETE_W = 90;
const BTN_SIZE = 54;
const SNAP_X = -DELETE_W;

export function ActivityCard({
  log,
  catalogItem,
  onPress,
  onDelete,
  onToggle,
  index = 0,
}: {
  log: ActivityLog;
  catalogItem?: CatalogItem;
  onPress: () => void;
  onDelete: () => void;
  onToggle: (id: string, completed: boolean) => void;
  index?: number;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const swipedRef = useRef(false);
  const entryOp = useRef(new Animated.Value(0)).current;
  const entryTy = useRef(new Animated.Value(28)).current;
  const entryScale = useRef(new Animated.Value(0.96)).current;
  const checkScale = useRef(new Animated.Value(1)).current;
  const btnWidth = useRef(new Animated.Value(BTN_SIZE)).current;
  const btnRadius = useRef(new Animated.Value(BTN_SIZE / 2)).current;
  const btnBg = useRef(new Animated.Value(0)).current;
  const iconY = useRef(new Animated.Value(0)).current;
  const labelOp = useRef(new Animated.Value(0)).current;
  const labelY = useRef(new Animated.Value(-12)).current;
  const animHeight = useRef(new Animated.Value(1)).current;
  const [cardH, setCardH] = useState(0);

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
          Animated.timing(entryScale, {
            toValue: 1,
            duration: 340,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        ]).start(),
      Math.min(index, 10) * 40,
    );
    return () => clearTimeout(t);
  }, []);

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
    Animated.timing(translateX, {
      toValue: SNAP_X,
      duration: 280,
      useNativeDriver: false,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }).start(() => {
      Animated.parallel([
        Animated.timing(btnWidth, {
          toValue: DELETE_W,
          duration: 280,
          useNativeDriver: false,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        Animated.timing(btnRadius, {
          toValue: 16,
          duration: 280,
          useNativeDriver: false,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        Animated.timing(btnBg, {
          toValue: 1,
          duration: 280,
          useNativeDriver: false,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        Animated.timing(iconY, {
          toValue: 6,
          duration: 240,
          useNativeDriver: false,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        Animated.timing(labelOp, {
          toValue: 1,
          duration: 200,
          delay: 80,
          useNativeDriver: false,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        Animated.timing(labelY, {
          toValue: 0,
          duration: 220,
          delay: 60,
          useNativeDriver: false,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      ]).start();
    });
  }, []);

  const closeDelete = useCallback(() => {
    swipedRef.current = false;
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 240,
        useNativeDriver: false,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
      Animated.timing(btnWidth, {
        toValue: BTN_SIZE,
        duration: 180,
        useNativeDriver: false,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
      Animated.timing(btnRadius, {
        toValue: BTN_SIZE / 2,
        duration: 180,
        useNativeDriver: false,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
      Animated.timing(btnBg, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
      Animated.timing(iconY, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
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
      Animated.timing(btnWidth, { toValue: 500, duration: 320, useNativeDriver: false }),
    ]).start(() =>
      Animated.timing(animHeight, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }).start(() => {
        resetBtn();
        onDelete();
      }),
    );
  }, [onDelete, resetBtn]);

  const handleTick = () => {
    const doToggle = () => {
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
        Animated.spring(checkScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 8,
        }),
      ]).start();
      onToggle(log.id, !log.completed);
    };
    if (log.completed) {
      Alert.alert(
        'Aktiviteyi geri al?',
        'Bu aktiviteyi tamamlanmadı olarak işaretlemek istediğine emin misin?',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Devam Et', style: 'destructive', onPress: doToggle },
        ],
      );
    } else {
      doToggle();
    }
  };

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

  const bgColor = btnBg.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgb(28,28,30)', 'rgb(255,59,48)'],
  });
  const color = catalogItem?.color ?? ACCENT;
  const icon = (catalogItem?.iconName ?? 'pulse') as any;

  return (
    <Animated.View
      style={{
        marginBottom: 10,
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
          <View style={ac.deleteArea}>
            <Animated.View
              style={[
                ac.deleteCircle,
                { width: btnWidth, borderRadius: btnRadius, backgroundColor: bgColor },
              ]}
            >
              <Pressable onPress={handleDeleteConfirm} style={ac.deletePressable}>
                <Animated.Text
                  style={[ac.deleteLbl, { opacity: labelOp, transform: [{ translateY: labelY }] }]}
                >
                  Sil
                </Animated.Text>
                <Animated.View style={{ transform: [{ translateY: iconY }] }}>
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                </Animated.View>
              </Pressable>
            </Animated.View>
          </View>
          <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
            <Pressable onPress={() => (swipedRef.current ? closeDelete() : onPress())}>
              <View style={ac.card}>
                <View
                  style={[
                    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
                    log.completed && { opacity: 0.4 },
                  ]}
                >
                  <View style={ac.iconWrap}>
                    {log.subType && getActivitySubIcon(log.subType) ? (
                      <Image
                        source={getActivitySubIcon(log.subType)!}
                        style={ac.icon}
                        resizeMode="contain"
                      />
                    ) : getMainActivityIcon(log.activityType) ? (
                      <Image
                        source={getMainActivityIcon(log.activityType)!}
                        style={ac.icon}
                        resizeMode="contain"
                      />
                    ) : (
                      <Ionicons name={icon} size={26} color={color} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        ac.name,
                        log.completed && { textDecorationLine: 'line-through', color: '#8E8E93' },
                      ]}
                    >
                      {log.subTypeNametr
                        ? `${catalogItem?.nametr ?? log.activityType} · ${log.subTypeNametr}`
                        : (catalogItem?.nametr ?? log.activityType)}
                    </Text>
                    <Text style={ac.meta}>
                      {formatDuration(log.duration)}
                      {log.distance ? ` · ${log.distance}km` : ''}
                      {log.calories ? ` · ${log.calories}kcal` : ''}
                    </Text>
                    <View style={{ marginTop: 6 }}>
                      <IntensityBar intensity={log.intensity} />
                    </View>
                  </View>
                </View>
                <Animated.View style={{ transform: [{ scale: checkScale }] }}>
                  <Pressable
                    onPress={handleTick}
                    hitSlop={8}
                    style={[
                      ac.tick,
                      log.completed && { backgroundColor: color, borderColor: color },
                    ]}
                  >
                    {log.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </Pressable>
                </Animated.View>
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const ac = StyleSheet.create({
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
  tick: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Loading Overlay ─────────────────────────────────────────────────────────
export function LoadingOverlay() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(shimmer, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-120, 120] });

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      }}
    >
      <View style={{ transform: [{ scale: 1.6 }] }}>
        <ActivityIndicator color={ACCENT} size="large" />
      </View>
      <View style={{ marginTop: 28, overflow: 'hidden', borderRadius: 6 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', letterSpacing: 0.3, color: '#1C1C1E' }}>
          Yükleniyor
        </Text>
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: 60,
            backgroundColor: 'rgba(255,107,53,0.35)',
            transform: [{ translateX: shimmerX }, { skewX: '-18deg' }],
          }}
        />
      </View>
    </View>
  );
}

// ─── Discover Button ──────────────────────────────────────────────────────────
export function DiscoverButton({ onPress }: { onPress: () => void }) {
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
    outputRange: [-(SW - 40), (SW - 40) * 1.2],
  });
  const borderColor = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,107,53,0.15)', 'rgba(255,107,53,0.55)'],
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
      <Animated.View style={{ transform: [{ scale }], borderRadius: 22, marginTop: 12 }}>
        <Animated.View
          style={{
            borderRadius: 22,
            borderWidth: 1.5,
            borderColor,
            shadowColor: ACCENT,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: shadowOp,
            shadowRadius: 16,
          }}
        >
          <View style={db.card}>
            <Animated.View
              pointerEvents="none"
              style={[db.shimmer, { transform: [{ translateX: shimmerX }] }]}
            />
            <View style={db.top}>
              <View style={db.iconWrap}>
                <Ionicons name="compass" size={32} color={ACCENT} />
              </View>
              <View style={db.badge}>
                <Ionicons name="sparkles" size={11} color="#fff" />
                <Text style={db.badgeTxt}>AI Skorlaması</Text>
              </View>
            </View>
            <Text style={db.title}>Aktivite Keşfet</Text>
            <Text style={db.sub}>Şehrine ve profiline göre AI'ın önerdiği aktiviteler</Text>
            <View style={db.arrow}>
              <Text style={db.arrowTxt}>Keşfet</Text>
              <Ionicons name="arrow-forward" size={14} color={ACCENT} />
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
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: (SW - 40) * 0.5,
    backgroundColor: 'rgba(255,107,53,0.1)',
    transform: [{ skewX: '-18deg' }],
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,107,53,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
  },
  badgeTxt: { fontSize: 12, fontWeight: '700', color: ACCENT },
  title: { fontSize: 20, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  sub: { fontSize: 14, color: '#636366', marginTop: 4, lineHeight: 19 },
  arrow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 16 },
  arrowTxt: { fontSize: 14, fontWeight: '700', color: ACCENT },
});

// ─── İndir Tab ────────────────────────────────────────────────────────────────
// ─── İndir Tab helpers ────────────────────────────────────────────────────────
type PeriodKey =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | '3month'
  | '6month'
  | '9month'
  | 'yearly'
  | 'custom';

export function getPeriodRange(
  key: PeriodKey,
  customStart?: Date,
  customEnd?: Date,
): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (key === 'daily') {
    return { start: today, end: today };
  }
  if (key === 'weekly') {
    const day = today.getDay(); // 0=Sun
    const start = new Date(today);
    start.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    return { start, end: today };
  }
  if (key === 'monthly') {
    return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: today };
  }
  if (key === '3month') {
    return { start: new Date(today.getFullYear(), today.getMonth() - 2, 1), end: today };
  }
  if (key === '6month') {
    return { start: new Date(today.getFullYear(), today.getMonth() - 5, 1), end: today };
  }
  if (key === '9month') {
    return { start: new Date(today.getFullYear(), today.getMonth() - 8, 1), end: today };
  }
  if (key === 'yearly') {
    return { start: new Date(today.getFullYear(), 0, 1), end: today };
  }
  // custom
  return { start: customStart ?? today, end: customEnd ?? today };
}

export function fmtDate(d: Date) {
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
}

interface Period {
  key: PeriodKey;
  label: string;
  sublabel: string;
  icon: string;
  color: string;
  bg: string;
}

const PERIODS: Period[] = [
  {
    key: 'daily',
    label: 'Günlük',
    sublabel: 'Bugün',
    icon: 'sunny',
    color: '#FF9500',
    bg: '#FFF4E5',
  },
  {
    key: 'weekly',
    label: 'Haftalık',
    sublabel: 'Bu hafta',
    icon: 'today',
    color: '#30D158',
    bg: '#EDFAF2',
  },
  {
    key: 'monthly',
    label: 'Aylık',
    sublabel: 'Bu ay',
    icon: 'calendar',
    color: '#0A84FF',
    bg: '#E5F2FF',
  },
  {
    key: '3month',
    label: '3 Aylık',
    sublabel: 'Son 3 ay',
    icon: 'stats-chart',
    color: '#5E5CE6',
    bg: '#EFEEFD',
  },
  {
    key: '6month',
    label: '6 Aylık',
    sublabel: 'Son 6 ay',
    icon: 'bar-chart',
    color: '#FF6B35',
    bg: '#FFF0EB',
  },
  {
    key: '9month',
    label: '9 Aylık',
    sublabel: 'Son 9 ay',
    icon: 'trending-up',
    color: '#FF2D55',
    bg: '#FFE9ED',
  },
  {
    key: 'yearly',
    label: 'Yıllık',
    sublabel: `${new Date().getFullYear()} yılı`,
    icon: 'ribbon',
    color: '#FFD60A',
    bg: '#FFFBE5',
  },
  {
    key: 'custom',
    label: 'Özel Tarih',
    sublabel: 'Tarih aralığı seç',
    icon: 'options',
    color: '#8E8E93',
    bg: '#F2F2F7',
  },
];

type FormatKey = 'pdf' | 'csv' | 'excel';

const FORMATS: {
  key: FormatKey;
  label: string;
  desc: string;
  icon: string;
  color: string;
  bg: string;
}[] = [
  {
    key: 'pdf',
    label: 'PDF',
    desc: 'Görsel rapor',
    icon: 'document-text',
    color: '#FF3B30',
    bg: '#FFF1F0',
  },
  {
    key: 'csv',
    label: 'CSV',
    desc: 'Ham veri',
    icon: 'code-slash',
    color: '#30D158',
    bg: '#EDFAF2',
  },
  {
    key: 'excel',
    label: 'Excel',
    desc: 'Tablo formatı',
    icon: 'grid',
    color: '#0A84FF',
    bg: '#E5F2FF',
  },
];

const CONTENT_SECTIONS: {
  key: string;
  icon: string;
  color: string;
  bg: string;
  title: string;
  desc: string;
}[] = [
  {
    key: 'summary',
    icon: 'stats-chart',
    color: '#5E5CE6',
    bg: '#EFEEFD',
    title: 'Genel Özet',
    desc: 'Toplam aktivite, süre, kalori ve aktif gün sayısı',
  },
  {
    key: 'performance',
    icon: 'trophy',
    color: '#FF9500',
    bg: '#FFF4E5',
    title: 'En İyi Performanslar',
    desc: 'En uzun antrenman, en çok kalori, en aktif gün',
  },
  {
    key: 'breakdown',
    icon: 'pie-chart',
    color: '#FF6B35',
    bg: '#FFF0EB',
    title: 'Aktivite Dağılımı',
    desc: 'Her aktivite türünün süre ve tekrar yüzdesi',
  },
  {
    key: 'daily',
    icon: 'calendar',
    color: '#0A84FF',
    bg: '#E5F2FF',
    title: 'Günlük Detaylar',
    desc: 'Tarih bazlı aktivite listesi, süre ve kalori',
  },
  {
    key: 'trend',
    icon: 'trending-up',
    color: '#30D158',
    bg: '#EDFAF2',
    title: 'İlerleme Trendi',
    desc: 'Haftalık/aylık aktivite artışı ve devamlılık skoru',
  },
];

export function useAnimatedSection() {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(20)).current;
  const show = () =>
    Animated.parallel([
      Animated.timing(op, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(ty, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  const hide = (cb?: () => void) =>
    Animated.parallel([
      Animated.timing(op, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
      Animated.timing(ty, {
        toValue: 10,
        duration: 180,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
    ]).start(cb);
  return { op, ty, show, hide };
}

// ─── Takvim Tarih Seçici ──────────────────────────────────────────────────────

const CAL_MONTHS = [
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
const CAL_DAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

export function calDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
export function calFirstDow(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export function CalendarPicker({
  initialDate,
  onSelect,
}: {
  initialDate: Date;
  onSelect: (d: Date) => void;
}) {
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [selDate, setSelDate] = useState(initialDate);

  const daysInMonth = calDaysInMonth(viewYear, viewMonth);
  const firstDow = calFirstDow(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const handleDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    setSelDate(d);
    onSelect(d);
  };

  const isSelected = (day: number) =>
    day === selDate.getDate() &&
    viewMonth === selDate.getMonth() &&
    viewYear === selDate.getFullYear();

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <Pressable
          onPress={prevMonth}
          hitSlop={12}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: '#F2F2F7',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={18} color="#1C1C1E" />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.3 }}>
          {CAL_MONTHS[viewMonth]} {viewYear}
        </Text>
        <Pressable
          onPress={nextMonth}
          hitSlop={12}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: '#F2F2F7',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-forward" size={18} color="#1C1C1E" />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {CAL_DAYS.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E8E93' }}>{d}</Text>
          </View>
        ))}
      </View>

      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row', marginBottom: 4 }}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            const sel = day !== null && isSelected(day);
            return (
              <View key={col} style={{ flex: 1, alignItems: 'center' }}>
                {day !== null ? (
                  <Pressable
                    onPress={() => handleDay(day)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: sel ? '#FF9500' : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: sel ? '800' : '400',
                        color: sel ? '#fff' : '#1C1C1E',
                      }}
                    >
                      {day}
                    </Text>
                  </Pressable>
                ) : (
                  <View style={{ width: 36, height: 36 }} />
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function CustomDatePickerSheet({
  customStep,
  initialDate,
  onClose,
  onConfirm,
  onBack,
}: {
  customStep: 'start' | 'end';
  initialDate: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<Date>(initialDate);
  const slideAnim = useRef(new Animated.Value(600)).current;
  const opAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
    ]).start();
  }, []);

  const close = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 600,
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
    ]).start(() => cb?.());
  };

  return (
    <Modal transparent animationType="none" visible onRequestClose={() => close(onClose)}>
      <View style={{ flex: 1 }}>
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: opAnim,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={() => close(onClose)} />
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 48,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#E5E5EA',
              alignSelf: 'center',
              marginBottom: 20,
            }}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: '#FFF4E5',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={customStep === 'start' ? 'play-circle' : 'stop-circle'}
                size={26}
                color="#FF9500"
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
                <View
                  style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF9500' }}
                />
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: customStep === 'end' ? '#FF9500' : '#E5E5EA',
                  }}
                />
              </View>
              <Text
                style={{ fontSize: 17, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.3 }}
              >
                {customStep === 'start' ? 'Başlangıç Tarihi' : 'Bitiş Tarihi'}
              </Text>
              <Text style={{ fontSize: 13, color: '#8E8E93', marginTop: 1 }}>
                {customStep === 'start' ? 'Hangi tarihten itibaren?' : 'Hangi tarihe kadar?'}
              </Text>
            </View>
          </View>

          <CalendarPicker initialDate={initialDate} onSelect={setSelected} />

          <View style={{ height: 20 }} />

          <Pressable
            onPress={() => onConfirm(selected)}
            style={({ pressed }) => ({
              backgroundColor: '#FF9500',
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              opacity: pressed ? 0.82 : 1,
              shadowColor: '#FF9500',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            })}
          >
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 }}>
              {customStep === 'start' ? 'İleri →' : 'Tamam'}
            </Text>
          </Pressable>

          {customStep === 'end' && (
            <Pressable
              onPress={onBack}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                paddingVertical: 14,
              }}
            >
              <Ionicons name="chevron-back" size={16} color="#FF9500" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#FF9500' }}>
                Başlangıca Dön
              </Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const CARD_W = (SW - 20 * 2 - 12) / 2;

export function IndirTab() {
  const [selected, setSelected] = useState<PeriodKey | null>(null);
  const [format, setFormat] = useState<FormatKey | null>(null);
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [customStep, setCustomStep] = useState<'start' | 'end'>('start');
  const [showPicker, setShowPicker] = useState(false);
  const [enabledSections, setEnabledSections] = useState<Record<string, boolean>>(
    Object.fromEntries(CONTENT_SECTIONS.map((s) => [s.key, true])),
  );
  const toggleAnims = useRef<Record<string, Animated.Value>>(
    Object.fromEntries(CONTENT_SECTIONS.map((s) => [s.key, new Animated.Value(1)])),
  ).current;

  const itemAnims = useRef<{ op: Animated.Value; ty: Animated.Value }[]>([]).current;
  if (itemAnims.length === 0) {
    PERIODS.forEach(() =>
      itemAnims.push({ op: new Animated.Value(0), ty: new Animated.Value(24) }),
    );
  }
  const fmtAnims = useRef<{ op: Animated.Value; ty: Animated.Value }[]>([]).current;
  if (fmtAnims.length === 0) {
    FORMATS.forEach(() => fmtAnims.push({ op: new Animated.Value(0), ty: new Animated.Value(20) }));
  }
  const fmtPressAnims = useRef<Record<FormatKey, Animated.Value>>({
    pdf: new Animated.Value(1),
    csv: new Animated.Value(1),
    excel: new Animated.Value(1),
  }).current;
  const contentSection = useAnimatedSection();
  const actionSection = useAnimatedSection();

  useEffect(() => {
    PERIODS.forEach((_, i) => {
      setTimeout(
        () =>
          Animated.parallel([
            Animated.timing(itemAnims[i]!.op, {
              toValue: 1,
              duration: 340,
              useNativeDriver: true,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            Animated.timing(itemAnims[i]!.ty, {
              toValue: 0,
              duration: 340,
              useNativeDriver: true,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          ]).start(),
        i * 40,
      );
    });
  }, []);

  const selPressAnims = useRef<Record<PeriodKey, Animated.Value>>(
    Object.fromEntries(PERIODS.map((p) => [p.key, new Animated.Value(1)])) as Record<
      PeriodKey,
      Animated.Value
    >,
  ).current;

  const showFormatSection = () => {
    FORMATS.forEach((_, i) => {
      setTimeout(
        () =>
          Animated.parallel([
            Animated.timing(fmtAnims[i]!.op, {
              toValue: 1,
              duration: 340,
              useNativeDriver: true,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            Animated.timing(fmtAnims[i]!.ty, {
              toValue: 0,
              duration: 340,
              useNativeDriver: true,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          ]).start(),
        i * 60,
      );
    });
  };

  const handleSelectPeriod = (key: PeriodKey) => {
    Animated.sequence([
      Animated.timing(selPressAnims[key], {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
      Animated.spring(selPressAnims[key], {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 12,
      }),
    ]).start();
    if (key === 'custom') {
      setCustomStart(null);
      setCustomEnd(null);
      setCustomStep('start');
      setShowPicker(true);
      return;
    }
    const wasSelected = selected !== null;
    setSelected(key);
    setFormat(null);
    contentSection.hide();
    actionSection.hide();
    if (!wasSelected) setTimeout(showFormatSection, 120);
    else showFormatSection();
  };

  const handleSelectFormat = (key: FormatKey) => {
    Animated.sequence([
      Animated.timing(fmtPressAnims[key], {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
      Animated.spring(fmtPressAnims[key], {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 12,
      }),
    ]).start();
    if (format === key) return;
    setFormat(key);
    if (format === null) {
      setTimeout(() => {
        contentSection.show();
        setTimeout(actionSection.show, 200);
      }, 100);
    }
  };

  const range =
    selected && selected !== 'custom'
      ? getPeriodRange(selected)
      : selected === 'custom' && customStart && customEnd
        ? { start: customStart, end: customEnd }
        : null;

  const canDownload =
    selected !== null &&
    format !== null &&
    (selected !== 'custom' || (customStart != null && customEnd != null));

  const rows: Period[][] = [];
  for (let i = 0; i < PERIODS.length; i += 2) rows.push(PERIODS.slice(i, i + 2));

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={it.scroll}>
      {/* Hero */}
      <View style={it.hero}>
        <View style={it.heroIcon}>
          <Ionicons name="cloud-download" size={28} color={ACCENT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={it.title}>Verilerini İndir</Text>
          <Text style={it.sub}>Dönem seç · Format seç · İndir</Text>
        </View>
      </View>

      {/* Bölüm 1: Dönem */}
      <View style={it.sectionHeader}>
        <View style={[it.sectionNum, { backgroundColor: selected ? ACCENT : '#E5E5EA' }]}>
          <Text style={[it.sectionNumTxt, { color: selected ? '#fff' : '#8E8E93' }]}>1</Text>
        </View>
        <Text style={it.sectionTitle}>Dönem Seç</Text>
      </View>

      {rows.map((row, ri) => (
        <View key={ri} style={it.row}>
          {row.map((p, ci) => {
            const globalIdx = ri * 2 + ci;
            const isActive = selected === p.key;
            const isCustomDone = p.key === 'custom' && customStart && customEnd;
            return (
              <Animated.View
                key={p.key}
                style={{
                  flex: 1,
                  opacity: itemAnims[globalIdx]!.op,
                  transform: [
                    { translateY: itemAnims[globalIdx]!.ty },
                    { scale: selPressAnims[p.key] },
                  ],
                }}
              >
                <Pressable onPress={() => handleSelectPeriod(p.key)}>
                  <View
                    style={[
                      it.card,
                      {
                        backgroundColor: isActive ? p.color : p.bg,
                        borderColor: isActive ? p.color : 'transparent',
                      },
                    ]}
                  >
                    {isActive && (
                      <View style={it.activeCheck}>
                        <Ionicons name="checkmark" size={11} color={p.color} />
                      </View>
                    )}
                    <View
                      style={[
                        it.cardIcon,
                        { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : p.color + '20' },
                      ]}
                    >
                      <Ionicons
                        name={p.icon as any}
                        size={24}
                        color={isActive ? '#fff' : p.color}
                      />
                    </View>
                    <Text style={[it.cardLabel, isActive && { color: '#fff' }]}>{p.label}</Text>
                    <Text style={[it.cardSub, isActive && { color: 'rgba(255,255,255,0.75)' }]}>
                      {isCustomDone
                        ? `${fmtDate(customStart!)} – ${fmtDate(customEnd!)}`
                        : p.sublabel}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
          {row.length === 1 && <View style={{ flex: 1 }} />}
        </View>
      ))}

      {range && (
        <View style={it.rangeBanner}>
          <Ionicons name="calendar-outline" size={14} color={ACCENT} />
          <Text style={it.rangeTxt}>
            {fmtDate(range.start)} – {fmtDate(range.end)}
          </Text>
        </View>
      )}

      {/* Bölüm 2: Format */}
      {selected && (
        <View style={{ marginTop: 8 }}>
          <View style={it.sectionHeader}>
            <View style={[it.sectionNum, { backgroundColor: format ? ACCENT : '#E5E5EA' }]}>
              <Text style={[it.sectionNumTxt, { color: format ? '#fff' : '#8E8E93' }]}>2</Text>
            </View>
            <Text style={it.sectionTitle}>Format Seç</Text>
          </View>
          <View style={it.fmtRow}>
            {FORMATS.map((f, i) => {
              const isActive = format === f.key;
              return (
                <Animated.View
                  key={f.key}
                  style={{
                    flex: 1,
                    opacity: fmtAnims[i]!.op,
                    transform: [{ translateY: fmtAnims[i]!.ty }, { scale: fmtPressAnims[f.key] }],
                  }}
                >
                  <Pressable onPress={() => handleSelectFormat(f.key)}>
                    <View
                      style={[
                        it.fmtCard,
                        {
                          backgroundColor: isActive ? f.color : f.bg,
                          borderColor: isActive ? f.color : 'transparent',
                        },
                      ]}
                    >
                      <Ionicons
                        name={f.icon as any}
                        size={22}
                        color={isActive ? '#fff' : f.color}
                      />
                      <Text style={[it.fmtLabel, isActive && { color: '#fff' }]}>{f.label}</Text>
                      <Text style={[it.fmtDesc, isActive && { color: 'rgba(255,255,255,0.75)' }]}>
                        {f.desc}
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </View>
      )}

      {/* Bölüm 3: İçerik */}
      <Animated.View
        style={{ opacity: contentSection.op, transform: [{ translateY: contentSection.ty }] }}
      >
        {format && (
          <View style={{ marginTop: 8 }}>
            <View style={it.sectionHeader}>
              <View style={[it.sectionNum, { backgroundColor: ACCENT }]}>
                <Text style={[it.sectionNumTxt, { color: '#fff' }]}>3</Text>
              </View>
              <Text style={it.sectionTitle}>Rapor İçeriği</Text>
            </View>
            <View style={it.contentCard}>
              {CONTENT_SECTIONS.map((s, i) => {
                const enabled = enabledSections[s.key] ?? true;
                const handleToggle = () => {
                  const next = !enabled;
                  Animated.spring(toggleAnims[s.key]!, {
                    toValue: next ? 1 : 0,
                    useNativeDriver: false,
                    tension: 300,
                    friction: 20,
                  }).start();
                  setEnabledSections((prev) => ({ ...prev, [s.key]: next }));
                };
                return (
                  <Pressable
                    key={s.key}
                    onPress={handleToggle}
                    style={[
                      it.contentRow,
                      i < CONTENT_SECTIONS.length - 1 && it.contentRowBorder,
                      !enabled && { opacity: 0.4 },
                    ]}
                  >
                    <View style={[it.contentIcon, { backgroundColor: s.bg }]}>
                      <Ionicons name={s.icon as any} size={16} color={s.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={it.contentTitle}>{s.title}</Text>
                      <Text style={it.contentDesc}>{s.desc}</Text>
                    </View>
                    <Animated.View
                      style={[
                        it.toggleCircle,
                        {
                          backgroundColor: toggleAnims[s.key]!.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['#E5E5EA', '#30D158'],
                          }),
                        },
                      ]}
                    >
                      <Animated.View
                        style={{
                          opacity: toggleAnims[s.key]!,
                          transform: [
                            {
                              scale: toggleAnims[s.key]!.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.4, 1],
                              }),
                            },
                          ],
                        }}
                      >
                        <Ionicons name="checkmark" size={13} color="#fff" />
                      </Animated.View>
                    </Animated.View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </Animated.View>

      {/* Bölüm 4: Aksiyon */}
      <Animated.View
        style={{ opacity: actionSection.op, transform: [{ translateY: actionSection.ty }] }}
      >
        {format && (
          <View style={{ marginTop: 20, gap: 12 }}>
            <View style={it.actionRow}>
              <Pressable
                disabled={!canDownload}
                style={[it.shareBtn, !canDownload && { opacity: 0.3 }]}
                onPress={() => {}}
              >
                <Ionicons name="share-outline" size={20} color={ACCENT} />
                <Text style={it.shareTxt}>Paylaş</Text>
              </Pressable>
              <Pressable
                disabled={!canDownload}
                style={[it.dlBtn, !canDownload && { opacity: 0.3 }]}
                onPress={() => {}}
              >
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={it.dlTxt}>İndir</Text>
              </Pressable>
            </View>
            <Text style={it.actionNote}>
              İndirirsen dosya galerine kaydedilir ve paylaşma seçenekleri açılır.
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Özel tarih picker */}
      {showPicker && (
        <CustomDatePickerSheet
          key={customStep}
          customStep={customStep}
          initialDate={customStep === 'end' && customStart ? customStart : new Date()}
          onClose={() => {
            setShowPicker(false);
            setCustomStart(null);
            setCustomEnd(null);
            setSelected(null);
          }}
          onConfirm={(date) => {
            if (customStep === 'start') {
              setCustomStart(date);
              setCustomStep('end');
            } else {
              setCustomEnd(date);
              setSelected('custom');
              setShowPicker(false);
              setTimeout(showFormatSection, 120);
            }
          }}
          onBack={() => setCustomStep('start')}
        />
      )}
    </ScrollView>
  );
}

const it = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 60 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 4, paddingBottom: 20 },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: `${ACCENT}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.4 },
  sub: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumTxt: { fontSize: 13, fontWeight: '800' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.3 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: {
    width: CARD_W,
    borderRadius: 22,
    padding: 18,
    borderWidth: 2,
    minHeight: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  activeCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardLabel: { fontSize: 15, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.2 },
  cardSub: { fontSize: 12, color: '#8E8E93', marginTop: 3 },
  rangeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${ACCENT}12`,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 8,
  },
  rangeTxt: { fontSize: 14, fontWeight: '600', color: ACCENT },
  fmtRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  fmtCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    borderWidth: 2,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  fmtLabel: { fontSize: 14, fontWeight: '800', color: '#1C1C1E' },
  fmtDesc: { fontSize: 11, color: '#8E8E93', textAlign: 'center' },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  contentRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F2F2F7' },
  contentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentTitle: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  contentDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 12 },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: ACCENT,
  },
  shareTxt: { fontSize: 16, fontWeight: '800', color: ACCENT },
  dlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ACCENT,
    borderRadius: 18,
    paddingVertical: 16,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  dlTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },
  actionNote: { fontSize: 12, color: '#8E8E93', textAlign: 'center', lineHeight: 18 },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  pickerBox: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 48,
    height: 500,
  },
  pickerHero: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    alignSelf: 'center',
  },
  pickerTitle: { fontSize: 20, fontWeight: '800', color: '#1C1C1E' },
  pickerSub: { fontSize: 13, color: '#8E8E93' },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  pickerNavRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  pickerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  pickerBackTxt: { fontSize: 14, fontWeight: '600', color: '#FF9500' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
    marginTop: 16,
  },
  dateInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    minWidth: 52,
  },
});

// ─── Rekorlar Tab ─────────────────────────────────────────────────────────────

export function formatDaysSince(days: number | null): string {
  if (days === null) return '—';
  if (days === 0) return 'Bugün';
  if (days === 1) return 'Dün';
  if (days < 7) return `${days} gün önce`;
  if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
  return `${Math.floor(days / 30)} ay önce`;
}

export function MiniTrendBars({ durations, color }: { durations: number[]; color: string }) {
  if (!durations || durations.length === 0) return null;
  const max = Math.max(...durations, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 24 }}>
      {durations.map((d, i) => {
        const h = Math.max(4, Math.round((d / max) * 24));
        const isLast = i === durations.length - 1;
        return (
          <View
            key={i}
            style={{
              width: 5,
              height: h,
              borderRadius: 2,
              backgroundColor: isLast ? color : color + '40',
            }}
          />
        );
      })}
    </View>
  );
}

// ─── Record Detail Sheet ───────────────────────────────────────────────────────

export function RecordDetailSheet({
  record,
  catalogItem,
  icon,
  visible,
  onClose,
}: {
  record: AllRecord | null;
  catalogItem: CatalogItem | null;
  icon: ReturnType<typeof require> | null;
  visible: boolean;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;
  const contentOp = useRef(new Animated.Value(0)).current;
  const contentTy = useRef(new Animated.Value(24)).current;
  const [snap, setSnap] = useState<{ record: AllRecord; cat: CatalogItem } | null>(null);

  useEffect(() => {
    if (visible && record && catalogItem) {
      setSnap({ record, cat: catalogItem });
      contentOp.setValue(0);
      contentTy.setValue(24);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 520,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          Animated.timing(opAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
        ]).start();
        setTimeout(
          () =>
            Animated.parallel([
              Animated.timing(contentOp, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              Animated.timing(contentTy, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            ]).start(),
          160,
        );
      });
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_H,
          duration: 460,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 1, 1),
        }),
        Animated.timing(opAnim, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setSnap(null);
      });
    }
  }, [visible]);

  if (!snap) return null;
  const { record: r, cat } = snap;
  const catLbl = CATEGORY_LABELS[cat.category] ?? cat.category;

  const durationDiff = r.prevLongestDuration > 0 ? r.longestDuration - r.prevLongestDuration : null;
  const caloriesDiff =
    r.prevMostCalories > 0 && r.mostCalories > 0 ? r.mostCalories - r.prevMostCalories : null;

  const bigStats = [
    { label: 'Toplam', val: `${r.totalCount}`, unit: 'kez' },
    { label: 'Bu Ay', val: `${r.thisMonthCount}`, unit: 'kez' },
    { label: 'Ortalama', val: formatDuration(r.avgDuration), unit: '' },
  ];

  const detailRows = [
    {
      label: 'En Uzun Süre',
      val: formatDuration(r.longestDuration),
      sub: formatDaysSince(r.daysSinceDurationRecord),
      diff:
        durationDiff !== null
          ? durationDiff >= 0
            ? `+${formatDuration(durationDiff)}`
            : `-${formatDuration(Math.abs(durationDiff))}`
          : null,
      diffPositive: durationDiff !== null && durationDiff >= 0,
      icon: 'time-outline' as const,
      color: '#FF9500',
    },
    {
      label: 'En Fazla Kalori',
      val: r.mostCalories > 0 ? `${r.mostCalories} kcal` : '—',
      sub: r.mostCalories > 0 ? formatDaysSince(r.daysSinceCaloriesRecord) : null,
      diff:
        caloriesDiff !== null
          ? caloriesDiff >= 0
            ? `+${caloriesDiff} kcal`
            : `${caloriesDiff} kcal`
          : null,
      diffPositive: caloriesDiff !== null && caloriesDiff >= 0,
      icon: 'flame-outline' as const,
      color: '#FF3B30',
    },
    {
      label: 'Son Yapıldı',
      val: r.lastDone ?? '—',
      sub: null,
      diff: null,
      diffPositive: false,
      icon: 'calendar-outline' as const,
      color: ACCENT,
    },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)', opacity: opAnim }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[rds.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* Color hero */}
          <View style={[rds.hero, { backgroundColor: cat.color }]}>
            <View style={rds.handle} />
            <View style={[rds.glowOuter, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
            <View style={[rds.glowInner, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
            <View style={rds.iconShadowWrap}>
              <View style={[rds.iconBg, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                {icon ? (
                  <Image source={icon} style={{ width: 60, height: 60 }} resizeMode="contain" />
                ) : (
                  <Ionicons name={cat.iconName as any} size={38} color="#fff" />
                )}
              </View>
            </View>
            <View style={rds.catChip}>
              <Text style={rds.catChipTxt}>{catLbl}</Text>
            </View>
            <Text style={rds.heroName}>{cat.nametr}</Text>
            <View style={[rds.bigStatRow, { backgroundColor: 'rgba(0,0,0,0.18)' }]}>
              {bigStats.map((s, i) => (
                <View
                  key={s.label}
                  style={[
                    rds.bigStatItem,
                    i < bigStats.length - 1 && {
                      borderRightWidth: StyleSheet.hairlineWidth,
                      borderRightColor: 'rgba(255,255,255,0.25)',
                    },
                  ]}
                >
                  <Text style={rds.bigStatVal}>
                    {s.val}
                    {s.unit ? <Text style={rds.bigStatUnit}> {s.unit}</Text> : null}
                  </Text>
                  <Text style={rds.bigStatLbl}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Content */}
          <Animated.View
            style={{
              opacity: contentOp,
              transform: [{ translateY: contentTy }],
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 48,
            }}
          >
            {/* Trend chart */}
            {r.last5Durations && r.last5Durations.length > 1 && (
              <View style={rds.trendCard}>
                <Text style={rds.trendTitle}>Son {r.last5Durations.length} Antrenman</Text>
                <View
                  style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 12 }}
                >
                  {r.last5Durations.map((d, i) => {
                    const maxVal = Math.max(...r.last5Durations!, 1);
                    const minVal = Math.min(...r.last5Durations!);
                    const range = maxVal - minVal || 1;
                    const h = Math.round(16 + ((d - minVal) / range) * 40);
                    const isLast = i === r.last5Durations!.length - 1;
                    return (
                      <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                        <View
                          style={{
                            width: '100%',
                            height: h,
                            borderRadius: 6,
                            backgroundColor: isLast ? cat.color : cat.color + '35',
                          }}
                        />
                        <Text style={{ fontSize: 9, color: '#8E8E93' }}>{formatDuration(d)}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
            {/* Detail rows */}
            <View style={rds.detailList}>
              {detailRows.map((d, i) => (
                <View
                  key={d.label}
                  style={[rds.detailRow, i < detailRows.length - 1 && rds.detailRowBorder]}
                >
                  <View style={[rds.detailIcon, { backgroundColor: d.color + '18' }]}>
                    <Ionicons name={d.icon} size={17} color={d.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={rds.detailLbl}>{d.label}</Text>
                    {d.sub && <Text style={rds.detailSub}>{d.sub}</Text>}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={[rds.detailVal, { color: d.color }]}>{d.val}</Text>
                    {d.diff && (
                      <View
                        style={[
                          rds.diffChip,
                          { backgroundColor: d.diffPositive ? '#30D15820' : '#FF3B3020' },
                        ]}
                      >
                        <Text
                          style={[rds.diffTxt, { color: d.diffPositive ? '#30D158' : '#FF3B30' }]}
                        >
                          {d.diff}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const rds = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    maxHeight: '88%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  hero: { paddingTop: 14, paddingBottom: 0, alignItems: 'center', overflow: 'hidden' },
  glowOuter: { position: 'absolute', width: 280, height: 280, borderRadius: 140, top: -80 },
  glowInner: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -40 },
  iconShadowWrap: {
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  iconBg: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catChip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 8,
  },
  catChipTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  heroName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.7,
    marginBottom: 20,
  },
  bigStatRow: { flexDirection: 'row', width: '100%' },
  bigStatItem: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  bigStatVal: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  bigStatUnit: { fontSize: 14, fontWeight: '600' },
  bigStatLbl: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginTop: 2 },
  trendCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12 },
  trendTitle: { fontSize: 13, fontWeight: '700', color: '#3A3A3C' },
  detailList: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  detailRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5EA' },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLbl: { fontSize: 15, fontWeight: '500', color: '#3A3A3C' },
  detailSub: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  detailVal: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  diffChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  diffTxt: { fontSize: 11, fontWeight: '700' },
});

// ─── Rekorlar Tab ──────────────────────────────────────────────────────────────
export function RekorlarTab({
  catalog,
  fetchAllRecords,
}: {
  catalog: CatalogItem[];
  fetchAllRecords: () => Promise<AllRecord[]>;
}) {
  const [records, setRecords] = useState<AllRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [detailItem, setDetailItem] = useState<{
    record: AllRecord;
    cat: CatalogItem;
    icon: ReturnType<typeof require> | null;
  } | null>(null);

  useEffect(() => {
    if (loaded) return;
    setLoaded(true);
    fetchAllRecords()
      .then((r) => {
        setRecords(r);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const recentRecords = records
    .filter((r) => r.daysSinceDurationRecord !== null && r.daysSinceDurationRecord <= 90)
    .slice(0, 8)
    .map((r) => ({ record: r, cat: catalog.find((c) => c.activityType === r.activityType) }))
    .filter((x): x is { record: AllRecord; cat: CatalogItem } => !!x.cat);

  const allItems = records
    .map((r) => ({ record: r, cat: catalog.find((c) => c.activityType === r.activityType) }))
    .filter((x): x is { record: AllRecord; cat: CatalogItem } => !!x.cat);

  if (loading) return <LoadingOverlay />;

  if (records.length === 0)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <Ionicons name="trophy-outline" size={52} color="#C7C7CC" />
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1C1C1E' }}>Henüz rekor yok</Text>
        <Text style={{ fontSize: 14, color: '#8E8E93' }}>
          Aktivite ekledikçe rekorların burada görünür
        </Text>
      </View>
    );

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Son Kırılan Rekorlar — horizontal scroll */}
        {recentRecords.length > 0 && (
          <View style={{ marginBottom: 28 }}>
            <Text style={rt.sectionTitle}>Son Kırılan Rekorlar</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {recentRecords.map(({ record: r, cat }) => {
                const icon = getMainActivityIcon(cat.activityType);
                const durationDiff =
                  r.prevLongestDuration > 0 ? r.longestDuration - r.prevLongestDuration : null;
                return (
                  <Pressable
                    key={cat.activityType}
                    onPress={() => setDetailItem({ record: r, cat, icon })}
                    style={[rt.recentCard, { backgroundColor: cat.color }]}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                      }}
                    >
                      <View
                        style={[rt.recentIconBox, { backgroundColor: 'rgba(255,255,255,0.22)' }]}
                      >
                        {icon ? (
                          <Image
                            source={icon}
                            style={{ width: 44, height: 44 }}
                            resizeMode="contain"
                          />
                        ) : (
                          <Ionicons name={cat.iconName as any} size={30} color="#fff" />
                        )}
                      </View>
                      <View style={rt.prBadge}>
                        <Text style={rt.prTxt}>PR</Text>
                      </View>
                    </View>
                    <Text style={rt.recentName} numberOfLines={1}>
                      {cat.nametr}
                    </Text>
                    <Text style={rt.recentRecord}>{formatDuration(r.longestDuration)}</Text>
                    {durationDiff !== null && durationDiff > 0 && (
                      <View style={rt.recentDiff}>
                        <Text style={rt.recentDiffTxt}>+{formatDuration(durationDiff)}</Text>
                      </View>
                    )}
                    <Text style={rt.recentWhen}>{formatDaysSince(r.daysSinceDurationRecord)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Tüm Rekorlar list */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={[rt.sectionTitle, { paddingHorizontal: 0, marginBottom: 12 }]}>
            Tüm Rekorlar
          </Text>
          {allItems.map(({ record, cat }, idx) => {
            const icon = getMainActivityIcon(cat.activityType);
            return (
              <RecordCard
                key={cat.activityType}
                record={record}
                catalogItem={cat}
                icon={icon}
                index={idx}
                onPress={() => setDetailItem({ record, cat, icon })}
              />
            );
          })}
        </View>
      </ScrollView>

      <RecordDetailSheet
        record={detailItem?.record ?? null}
        catalogItem={detailItem?.cat ?? null}
        icon={detailItem?.icon ?? null}
        visible={!!detailItem}
        onClose={() => setDetailItem(null)}
      />
    </>
  );
}

export function RecordCard({
  record,
  catalogItem,
  icon,
  index,
  onPress,
}: {
  record: AllRecord;
  catalogItem: CatalogItem;
  icon: ReturnType<typeof require> | null;
  index: number;
  onPress: () => void;
}) {
  const entryOp = useRef(new Animated.Value(0)).current;
  const entryTy = useRef(new Animated.Value(24)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

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
        ]).start(),
      index * 40,
    );
    return () => clearTimeout(t);
  }, []);

  const durationDiff =
    record.prevLongestDuration > 0 ? record.longestDuration - record.prevLongestDuration : null;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.timing(pressAnim, {
          toValue: 0.97,
          duration: 100,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }).start()
      }
      onPressOut={() =>
        Animated.spring(pressAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 12,
        }).start()
      }
    >
      <Animated.View
        style={[
          rt.card,
          { opacity: entryOp, transform: [{ translateY: entryTy }, { scale: pressAnim }] },
        ]}
      >
        <View style={rt.cardRow}>
          <View style={[rt.iconBox, { backgroundColor: catalogItem.color + '15' }]}>
            {icon ? (
              <Image source={icon} style={{ width: 52, height: 52 }} resizeMode="contain" />
            ) : (
              <Ionicons name={catalogItem.iconName as any} size={34} color={catalogItem.color} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={rt.name}>{catalogItem.nametr}</Text>
              {record.daysSinceDurationRecord === 0 && (
                <View style={rt.prBadgeSm}>
                  <Text style={rt.prTxtSm}>PR</Text>
                </View>
              )}
            </View>
            <Text style={rt.lastDone}>{formatDaysSince(record.daysSinceDurationRecord)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 3 }}>
            <Text style={[rt.recordVal, { color: catalogItem.color }]}>
              {formatDuration(record.longestDuration)}
            </Text>
            {durationDiff !== null && durationDiff > 0 && (
              <View style={rt.diffChipSm}>
                <Text style={rt.diffTxtSm}>+{formatDuration(durationDiff)}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={rt.cardBottom}>
          <View style={{ flex: 1 }}>
            <Text style={rt.cardStatLbl}>Bu Ay</Text>
            <Text style={rt.cardStatVal}>{record.thisMonthCount}x</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={rt.cardStatLbl}>Toplam</Text>
            <Text style={rt.cardStatVal}>{record.totalCount}x</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={rt.cardStatLbl}>Ort. Süre</Text>
            <Text style={rt.cardStatVal}>{formatDuration(record.avgDuration)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <MiniTrendBars durations={record.last5Durations ?? []} color={catalogItem.color} />
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const rt = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.4,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  recentCard: {
    width: 148,
    borderRadius: 20,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  recentIconBox: {
    width: 52,
    height: 52,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  prTxt: { fontSize: 10, fontWeight: '800', color: '#FF9500' },
  recentName: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginBottom: 2 },
  recentRecord: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  recentDiff: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  recentDiffTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
  recentWhen: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  lastDone: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  prBadgeSm: {
    backgroundColor: '#FF950020',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  prTxtSm: { fontSize: 9, fontWeight: '800', color: '#FF9500' },
  recordVal: { fontSize: 17, fontWeight: '800', letterSpacing: -0.4 },
  diffChipSm: {
    backgroundColor: '#30D15820',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  diffTxtSm: { fontSize: 10, fontWeight: '700', color: '#30D158' },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  cardStatLbl: { fontSize: 10, color: '#8E8E93' },
  cardStatVal: { fontSize: 13, fontWeight: '700', color: '#1C1C1E', marginTop: 2 },
});

// ─── Rotalar Tab ──────────────────────────────────────────────────────────────

interface GpsRoute {
  id: string;
  name: string;
  activityType: string;
  distanceKm: number;
  elevationGain: number;
  durationSec: number;
  difficulty: 'Kolay' | 'Orta' | 'Zor';
  surface: 'Asfalt' | 'Patika' | 'Karma';
  coordinates: { latitude: number; longitude: number }[];
  createdAt: string;
}

type RouteFilter = 'Tümü' | 'Koşu' | 'Bisiklet' | 'Yürüyüş';
type RouteViewMode = 'list' | 'map';

const ROUTE_FILTERS: RouteFilter[] = ['Tümü', 'Koşu', 'Bisiklet', 'Yürüyüş'];

const SPORT_ICONS: Record<string, string> = {
  run: '🏃',
  ride: '🚴',
  walk: '🚶',
  hike: '🥾',
};

export function formatRouteDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
}

// ─── Rota Kartı ───────────────────────────────────────────────────────────────

export function RouteCard({ route, onPress }: { route: GpsRoute; onPress: () => void }) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const sport = SPORT_ICONS[route.activityType] ?? '🏃';
  const cardMapRef = useRef<MapboxRouteViewRef>(null);

  // Compute center from bbox
  const center = useMemo(() => {
    if (route.coordinates.length < 2) {
      return { latitude: 41.0082, longitude: 28.9784 };
    }
    const lats = route.coordinates.map((c) => c.latitude);
    const lons = route.coordinates.map((c) => c.longitude);
    return {
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      longitude: (Math.min(...lons) + Math.max(...lons)) / 2,
    };
  }, [route.coordinates]);

  // Auto-fit when component mounts
  useEffect(() => {
    if (route.coordinates.length >= 2) {
      const t = setTimeout(() => cardMapRef.current?.fitToCoords(route.coordinates, 12), 250);
      return () => clearTimeout(t);
    }
  }, [route.coordinates]);

  const diffColor =
    route.difficulty === 'Kolay' ? '#30D158' : route.difficulty === 'Orta' ? '#FF9500' : '#FF453A';

  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(pressScale, {
          toValue: 0.97,
          useNativeDriver: true,
          tension: 300,
          friction: 14,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(pressScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 14,
        }).start()
      }
      onPress={onPress}
    >
      <Animated.View style={[rts.cardCompact, { transform: [{ scale: pressScale }] }]}>
        {/* Yatay mini harita */}
        <View style={rts.thumbCompact} pointerEvents="none">
          <MapboxRouteView
            ref={cardMapRef}
            style={StyleSheet.absoluteFill}
            styleKey="standard"
            initialCenter={center}
            initialZoom={13}
            routeCoords={route.coordinates}
            showStartEnd
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            attributionEnabled={false}
            logoEnabled={false}
          />
          <View style={rts.sportBadgeCompact}>
            <Text style={{ fontSize: 13 }}>{sport}</Text>
          </View>
        </View>

        {/* Bilgiler */}
        <View style={rts.cardInfoCompact}>
          <Text style={rts.cardNameCompact} numberOfLines={1}>
            {route.name}
          </Text>
          <View style={rts.statsCompact}>
            <Ionicons name="resize" size={11} color="rgba(255,255,255,0.45)" />
            <Text style={rts.statTxtCompact}>{route.distanceKm.toFixed(1)} km</Text>
            <Text style={rts.statSep}>·</Text>
            <Ionicons name="trending-up" size={11} color="rgba(255,255,255,0.45)" />
            <Text style={rts.statTxtCompact}>{Math.round(route.elevationGain)}m</Text>
            <Text style={rts.statSep}>·</Text>
            <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.45)" />
            <Text style={rts.statTxtCompact}>{formatRouteDuration(route.durationSec)}</Text>
          </View>
          <View style={rts.badgeRowCompact}>
            <View style={[rts.badgeCompact, { backgroundColor: diffColor + '22' }]}>
              <Text style={[rts.badgeTxtCompact, { color: diffColor }]}>{route.difficulty}</Text>
            </View>
            <View style={[rts.badgeCompact, { backgroundColor: 'rgba(10,132,255,0.18)' }]}>
              <Text style={[rts.badgeTxtCompact, { color: '#5EB1FF' }]}>{route.surface}</Text>
            </View>
          </View>
        </View>

        {/* Chevron */}
        <Ionicons
          name="chevron-forward"
          size={16}
          color="rgba(255,255,255,0.25)"
          style={{ marginRight: 6 }}
        />
      </Animated.View>
    </Pressable>
  );
}

// ─── Boş Durum ───────────────────────────────────────────────────────────────

export function RoutesEmptyState({ onCreate }: { onCreate: () => void }) {
  const btnScale = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 480,
      useNativeDriver: true,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }).start();
  }, []);

  return (
    <Animated.View style={[rts.emptyWrap, { opacity: fadeIn }]}>
      {/* Harita arka plan */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <MapboxRouteView
          style={StyleSheet.absoluteFill}
          styleKey="standard"
          initialCenter={{ latitude: 41.0082, longitude: 28.9784 }}
          initialZoom={11}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        />
      </View>
      {/* Koyu gradient overlay */}
      <View style={rts.emptyMapOverlay} />

      {/* İçerik */}
      <View style={rts.emptyContent}>
        <View style={rts.emptyIconWrap}>
          <Text style={rts.emptyIcon}>🗺️</Text>
        </View>
        <Text style={rts.emptyTitle}>Rotanı çiz, izini takip et</Text>
        <Text style={rts.emptySub}>
          Antrenman güzergahlarını kaydet{'\n'}ve istatistiklerini takip et
        </Text>
        <Pressable
          onPressIn={() =>
            Animated.spring(btnScale, {
              toValue: 0.94,
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
          onPress={onCreate}
        >
          <Animated.View style={[rts.emptyBtn, { transform: [{ scale: btnScale }] }]}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={rts.emptyBtnTxt}>Rota Oluştur</Text>
          </Animated.View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─── Harita Modu ─────────────────────────────────────────────────────────────

export function RoutesMapView({
  routes,
  onRoutePress,
  onBack,
}: {
  routes: GpsRoute[];
  onRoutePress: (route: GpsRoute) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<GpsRoute | null>(null);
  const sheetY = useRef(new Animated.Value(200)).current;
  const sheetOp = useRef(new Animated.Value(0)).current;

  const showSheet = (route: GpsRoute) => {
    setSelected(route);
    Animated.parallel([
      Animated.timing(sheetY, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(sheetOp, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  };

  const hideSheet = () => {
    Animated.parallel([
      Animated.timing(sheetY, {
        toValue: 200,
        duration: 320,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
      Animated.timing(sheetOp, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
    ]).start(() => setSelected(null));
  };

  const allCoords = routes.flatMap((r) => r.coordinates);
  const centerLat =
    allCoords.length > 0
      ? allCoords.reduce((s, c) => s + c.latitude, 0) / allCoords.length
      : 41.0082;
  const centerLng =
    allCoords.length > 0
      ? allCoords.reduce((s, c) => s + c.longitude, 0) / allCoords.length
      : 28.9784;

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {routes.map(
          (route) =>
            route.coordinates.length > 1 && (
              <Polyline
                key={route.id}
                coordinates={route.coordinates}
                strokeColor={selected?.id === route.id ? ACCENT : 'rgba(255,107,53,0.45)'}
                strokeWidth={selected?.id === route.id ? 4 : 2.5}
                tappable
                onPress={() => showSheet(route)}
              />
            ),
        )}
      </MapView>

      {/* Geri + Liste butonu */}
      <View style={rts.mapTopBar}>
        <Pressable onPress={onBack} style={rts.mapTopBtn}>
          <Text style={rts.mapTopBtnTxt}>Rotalar</Text>
        </Pressable>
        <Pressable onPress={() => {}} style={rts.mapTopBtn}>
          <Ionicons name="list" size={16} color="#fff" />
          <Text style={rts.mapTopBtnTxt}>Liste</Text>
        </Pressable>
      </View>

      {/* Seçili rota bottom sheet */}
      {selected && (
        <Pressable style={StyleSheet.absoluteFill} onPress={hideSheet} pointerEvents="box-none">
          <Animated.View
            style={[rts.mapSheet, { transform: [{ translateY: sheetY }], opacity: sheetOp }]}
          >
            <View style={rts.mapSheetHandle} />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <Text style={rts.mapSheetName} numberOfLines={1}>
                {selected.name}
              </Text>
              <Text style={{ fontSize: 20 }}>{SPORT_ICONS[selected.activityType] ?? '🏃'}</Text>
            </View>
            <Text style={rts.cardStats}>
              {selected.distanceKm.toFixed(1)} km · ↑{Math.round(selected.elevationGain)}m · ~
              {formatRouteDuration(selected.durationSec)}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <View
                style={[
                  rts.badge,
                  { backgroundColor: '#30D15820', flex: 1, justifyContent: 'center' },
                ]}
              >
                <Text style={[rts.badgeTxt, { color: '#30D158', textAlign: 'center' }]}>
                  {selected.difficulty}
                </Text>
              </View>
              <Pressable
                onPress={() => onRoutePress(selected)}
                style={[rts.emptyBtn, { flex: 2, paddingVertical: 10, justifyContent: 'center' }]}
              >
                <Text style={rts.emptyBtnTxt}>Detay →</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      )}
    </View>
  );
}

// ─── Free-Run Hızlı Başlangıç ─────────────────────────────────────────────────
// Rota seçmeden anında kayıt başlatmak için Koşu/Bisiklet/Yürüyüş tetikleri.
// Her biri rota-takip ekranına `?mode=free&activityType=...` ile push eder.
type FreeRunActivity = 'running' | 'cycling' | 'walking';

export function FreeRunQuickStart({ router }: { router: ReturnType<typeof useRouter> }) {
  const items: { kind: FreeRunActivity; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { kind: 'running', label: 'Koşu', icon: 'walk' },
    { kind: 'cycling', label: 'Bisiklet', icon: 'bicycle' },
    { kind: 'walking', label: 'Yürüyüş', icon: 'footsteps' },
  ];
  const start = (kind: FreeRunActivity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(('/(app)/tracking/rota-takip?mode=free&activityType=' + kind) as never);
  };
  return (
    <View style={frs.wrap}>
      {items.map((it) => (
        <Pressable
          key={it.kind}
          onPress={() => start(it.kind)}
          style={({ pressed }) => [frs.card, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name={it.icon} size={18} color={ACCENT} />
          <Text style={frs.label}>{it.label}</Text>
          <View style={frs.cta}>
            <Ionicons name="play" size={11} color="#fff" />
            <Text style={frs.ctaTxt}>Şimdi Başlat</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const frs = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ACCENT,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  ctaTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
});

// ─── Ana RotalarTab ───────────────────────────────────────────────────────────

type RouteSort = 'recent' | 'distance' | 'duration';

export function RotalarTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [routes, setRoutes] = useState<GpsRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RouteFilter>('Tümü');
  const [sort, setSort] = useState<RouteSort>('recent');
  const [viewMode, setViewMode] = useState<RouteViewMode>('list');
  const fabScale = useRef(new Animated.Value(1)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(ROUTES_KEY)
      .then((raw) => {
        setRoutes(raw ? JSON.parse(raw) : []);
      })
      .catch(() => {
        setRoutes([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    Animated.timing(filterAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }).start();
  }, [filter, sort]);

  const filtered = useMemo(() => {
    let r =
      filter === 'Tümü'
        ? [...routes]
        : routes.filter((rr) => {
            if (filter === 'Koşu') return rr.activityType === 'run';
            if (filter === 'Bisiklet') return rr.activityType === 'ride';
            if (filter === 'Yürüyüş') return ['walk', 'hike'].includes(rr.activityType);
            return true;
          });
    if (sort === 'recent')
      r.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sort === 'distance') r.sort((a, b) => b.distanceKm - a.distanceKm);
    if (sort === 'duration') r.sort((a, b) => b.durationSec - a.durationSec);
    return r;
  }, [routes, filter, sort]);

  const cycleSort = () => {
    setSort((s) => (s === 'recent' ? 'distance' : s === 'distance' ? 'duration' : 'recent'));
  };
  const sortLabel = sort === 'recent' ? 'Yeni' : sort === 'distance' ? 'Mesafe' : 'Süre';
  const sortIcon: 'time-outline' | 'resize-outline' | 'hourglass-outline' =
    sort === 'recent'
      ? 'time-outline'
      : sort === 'distance'
        ? 'resize-outline'
        : 'hourglass-outline';

  const handleCreate = () => {
    router.push('/(app)/tracking/rota-olustur' as never);
  };

  const handleRoutePress = (route: GpsRoute) => {
    router.push({ pathname: '/(app)/tracking/rota-detay', params: { id: route.id } } as never);
  };

  if (loading) {
    return (
      <View style={rts.loadingWrap}>
        <ActivityIndicator color={ACCENT} size="large" />
      </View>
    );
  }

  if (viewMode === 'map') {
    return (
      <View style={rts.root}>
        <RoutesMapView
          routes={filtered}
          onRoutePress={handleRoutePress}
          onBack={() => setViewMode('list')}
        />
        <Pressable
          style={[rts.fab, { bottom: insets.bottom + 80 }]}
          onPressIn={() =>
            Animated.spring(fabScale, {
              toValue: 0.88,
              useNativeDriver: true,
              tension: 300,
              friction: 12,
            }).start()
          }
          onPressOut={() =>
            Animated.spring(fabScale, {
              toValue: 1,
              useNativeDriver: true,
              tension: 300,
              friction: 12,
            }).start()
          }
          onPress={handleCreate}
        >
          <Animated.View style={[rts.fabInner, { transform: [{ scale: fabScale }] }]}>
            <Ionicons name="add" size={26} color="#fff" />
          </Animated.View>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={rts.root}>
      {/* Header */}
      <View style={rts.header}>
        <Text style={rts.headerTitle}>Rotalar</Text>
        <Pressable onPress={() => setViewMode('map')} style={rts.mapToggleBtn}>
          <Ionicons name="map-outline" size={16} color={ACCENT} />
          <Text style={rts.mapToggleTxt}>Harita</Text>
        </Pressable>
      </View>

      {/* Filter + sort bar */}
      <View style={rts.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={rts.filterRow}
          style={{ flex: 1 }}
        >
          {ROUTE_FILTERS.map((f) => {
            const active = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => {
                  filterAnim.setValue(0);
                  setFilter(f);
                }}
                style={[rts.chip, active && rts.chipActive]}
              >
                <Text style={[rts.chipTxt, active && rts.chipTxtActive]}>{f}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable style={rts.sortBtn} onPress={cycleSort}>
          <Ionicons name={sortIcon} size={13} color={ACCENT} />
          <Text style={rts.sortBtnTxt}>{sortLabel}</Text>
          <Ionicons name="chevron-down" size={11} color="rgba(255,255,255,0.4)" />
        </Pressable>
      </View>

      {/* Free-run hızlı başlangıç — rota olmadan kayıt başlat */}
      <FreeRunQuickStart router={router} />

      {/* İçerik */}
      {filtered.length === 0 ? (
        <RoutesEmptyState onCreate={handleCreate} />
      ) : (
        <>
          <ScrollView contentContainerStyle={rts.listContent} showsVerticalScrollIndicator={false}>
            {filtered.map((route) => (
              <Animated.View
                key={route.id}
                style={{
                  opacity: filterAnim,
                  transform: [
                    {
                      translateY: filterAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [16, 0],
                      }),
                    },
                  ],
                }}
              >
                <RouteCard route={route} onPress={() => handleRoutePress(route)} />
              </Animated.View>
            ))}
            <View style={{ height: 120 }} />
          </ScrollView>

          {/* FAB — sadece rotalar varsa göster */}
          <Pressable
            style={[rts.fab, { bottom: insets.bottom + 80 }]}
            onPressIn={() =>
              Animated.spring(fabScale, {
                toValue: 0.88,
                useNativeDriver: true,
                tension: 300,
                friction: 12,
              }).start()
            }
            onPressOut={() =>
              Animated.spring(fabScale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 300,
                friction: 12,
              }).start()
            }
            onPress={handleCreate}
          >
            <Animated.View style={[rts.fabInner, { transform: [{ scale: fabScale }] }]}>
              <Ionicons name="add" size={26} color="#fff" />
            </Animated.View>
          </Pressable>
        </>
      )}
    </View>
  );
}

const rts = StyleSheet.create({
  // Root
  root: { flex: 1, backgroundColor: '#0A0A0F' },

  // Kart
  card: {
    backgroundColor: '#1C1C2E',
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  mapThumb: { height: 160, position: 'relative', backgroundColor: '#1a2a1a' },
  sportBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(10,10,20,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { padding: 14 },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  cardStats: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeTxt: { fontSize: 11, fontWeight: '600' },

  // Boş durum
  emptyWrap: { flex: 1, position: 'relative', minHeight: 400 },
  emptyMapOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.62)' },
  emptyContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ACCENT,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  emptyBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  mapToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${ACCENT}18`,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  mapToggleTxt: { fontSize: 13, fontWeight: '600', color: ACCENT },

  // Filters + sort
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
    paddingBottom: 12,
    gap: 8,
  },
  filterRow: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: { backgroundColor: `${ACCENT}22`, borderColor: `${ACCENT}40` },
  chipTxt: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.5)' },
  chipTxtActive: { color: ACCENT, fontWeight: '700' },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sortBtnTxt: { fontSize: 12, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },

  // Compact card (90×90 thumb left)
  cardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C2E',
    borderRadius: 18,
    marginHorizontal: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  thumbCompact: { width: 96, height: 96, position: 'relative', backgroundColor: '#1a2a1a' },
  sportBadgeCompact: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: 'rgba(10,10,20,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfoCompact: { flex: 1, paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  cardNameCompact: { fontSize: 14.5, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  statsCompact: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  statTxtCompact: { fontSize: 11.5, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  statSep: { fontSize: 11, color: 'rgba(255,255,255,0.25)' },
  badgeRowCompact: { flexDirection: 'row', gap: 5 },
  badgeCompact: { paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 7 },
  badgeTxtCompact: { fontSize: 10, fontWeight: '700', letterSpacing: -0.1 },

  // Liste
  listContent: { gap: 12, paddingTop: 4, paddingBottom: 16 },

  // FAB
  fab: { position: 'absolute', right: 20, zIndex: 10 },
  fabInner: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },

  // Harita modu
  mapTopBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mapTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(10,10,20,0.82)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backdropFilter: 'blur(10px)',
  } as any,
  mapTopBtnTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  mapSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#16162A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mapSheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  mapSheetName: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1, letterSpacing: -0.3 },

  // Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';
import { fetchMeals } from '../../../../src/features/nutrition/api/client';
import type { MealLog, MealType } from '../../../../src/features/nutrition/api/types';
import { font } from '../../../../src/features/nutrition/theme';
import { SheetShell } from '../saglik/components/SheetShell';
import { SheetBody, Section } from '../saglik/components/SheetPrimitives';
import { DatePickerSheet } from '../../../../components/shared/DateTimePickerSheets';

// ─────────────── Theme ───────────────

const BG = '#F2F2F7';
const CARD = '#FFFFFF';
const ACCENT = '#FF9F0A'; // Beslenme accent (turuncu)
const TEXT = '#1C1C1E';
const SUBTEXT = '#8E8E93';
const HAIRLINE = 'rgba(60,60,67,0.12)';
const MUTED = '#3C3C4399';

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);
const EASE_MICRO = Easing.bezier(0.4, 0, 0.2, 1);

const MEAL_META: Record<MealType, { color: string; icon: string; label: string; order: number }> = {
  breakfast: { color: '#FF9500', icon: '🌅', label: 'Kahvaltı', order: 0 },
  lunch: { color: '#34C759', icon: '🥗', label: 'Öğle Yemeği', order: 1 },
  dinner: { color: '#5E5CE6', icon: '🍽️', label: 'Akşam Yemeği', order: 2 },
  snack: { color: '#FF6914', icon: '🍎', label: 'Atıştırmalık', order: 3 },
};

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
const DAYS_SHORT_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const DAYS_LONG_TR = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

// ─────────────── Date helpers ───────────────

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function fmtMonthYear(d: Date): string {
  return `${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;
}
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function fmtTimeFromISO(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const mn = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${mn}`;
}

// ─────────────── Icons ───────────────

function ChevronRight({ size = 14, color = SUBTEXT }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SparkleIcon({ size = 14, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5c.4 0 .75.27.86.66l1.05 3.7a4 4 0 0 0 2.73 2.73l3.7 1.05a.9.9 0 0 1 0 1.72l-3.7 1.05a4 4 0 0 0-2.73 2.73l-1.05 3.7a.9.9 0 0 1-1.72 0l-1.05-3.7a4 4 0 0 0-2.73-2.73l-3.7-1.05a.9.9 0 0 1 0-1.72l3.7-1.05a4 4 0 0 0 2.73-2.73l1.05-3.7a.9.9 0 0 1 .86-.66z"
        fill={color}
      />
    </Svg>
  );
}

function CalendarEmptyIcon({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 3v2M17 3v2M4 8h16M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"
        stroke={SUBTEXT}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────── AI Avatar ───────────────

function AIAvatar({ size = 24 }: { size?: number }) {
  return (
    <LinearGradient
      colors={['#FFCC80', '#FF9F0A', '#E07900']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <SparkleIcon size={size * 0.55} />
    </LinearGradient>
  );
}

// ─────────────── Pressable helper ───────────────

function SoftPressable({
  children,
  onPress,
  style,
  hitSlop,
  scaleTo = 0.97,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  hitSlop?: number;
  scaleTo?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const animate = (toScale: number, toOp: number, dur: number, ease: any) => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: toScale,
        duration: dur,
        easing: ease,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: toOp,
        duration: dur,
        easing: ease,
        useNativeDriver: true,
      }),
    ]).start();
  };
  return (
    <Pressable
      onPressIn={() => animate(scaleTo, 0.9, 120, EASE_MICRO)}
      onPressOut={() => animate(1, 1, 100, EASE_MICRO)}
      onPress={onPress}
      hitSlop={hitSlop ?? 6}
    >
      <Animated.View style={[{ transform: [{ scale }], opacity }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

// ─────────────── Header ───────────────

function CalendarHeader({
  visibleMonth,
  isTodaySelected,
  onTodayPress,
  onMonthPress,
  topInset,
}: {
  visibleMonth: Date;
  isTodaySelected: boolean;
  onTodayPress: () => void;
  onMonthPress: () => void;
  topInset: number;
}) {
  const todayOpacity = useRef(new Animated.Value(isTodaySelected ? 0 : 1)).current;
  const todayTranslate = useRef(new Animated.Value(isTodaySelected ? -4 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(todayOpacity, {
        toValue: isTodaySelected ? 0 : 1,
        duration: isTodaySelected ? 220 : 280,
        easing: isTodaySelected ? EASE_CLOSE : EASE_SPRING,
        useNativeDriver: true,
      }),
      Animated.timing(todayTranslate, {
        toValue: isTodaySelected ? -4 : 0,
        duration: isTodaySelected ? 220 : 280,
        easing: isTodaySelected ? EASE_CLOSE : EASE_SPRING,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isTodaySelected]);

  return (
    <View style={[styles.headerWrap, { paddingTop: topInset + 8 }]}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            onMonthPress();
          }}
          hitSlop={8}
          style={({ pressed }) => [styles.headerLeft, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text allowFontScaling={false} style={styles.headerTitle}>
            {fmtMonthYear(visibleMonth)}
          </Text>
          <View style={{ marginLeft: 6, marginTop: 4 }}>
            <ChevronRight size={16} color={ACCENT} />
          </View>
        </Pressable>

        <Animated.View
          style={{
            opacity: todayOpacity,
            transform: [{ translateY: todayTranslate }],
          }}
          pointerEvents={isTodaySelected ? 'none' : 'auto'}
        >
          <SoftPressable onPress={onTodayPress} style={styles.todayPill} hitSlop={10}>
            <Text allowFontScaling={false} style={styles.todayPillText}>
              Bugün
            </Text>
          </SoftPressable>
        </Animated.View>
      </View>
    </View>
  );
}

// ─────────────── Week Strip ───────────────

type DaySummary = {
  date: Date;
  meals: MealLog[];
  totalCalories: number;
  mealColors: string[];
};

function WeekStrip({
  weekStart,
  selectedDate,
  today,
  daySummaries,
  onSelect,
}: {
  weekStart: Date;
  selectedDate: Date;
  today: Date;
  daySummaries: Map<string, DaySummary>;
  onSelect: (d: Date) => void;
}) {
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const opacity = useRef(new Animated.Value(1)).current;
  const prevWeekKey = useRef(weekStart.toISOString());

  useEffect(() => {
    const key = weekStart.toISOString();
    if (prevWeekKey.current === key) return;
    prevWeekKey.current = key;
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 0.6,
        duration: 100,
        easing: EASE_CLOSE,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        easing: EASE_SPRING,
        useNativeDriver: true,
      }),
    ]).start();
  }, [weekStart]);

  return (
    <Animated.View style={[styles.weekStrip, { opacity }]}>
      <View style={styles.weekStripInner}>
        {days.map((d, idx) => {
          const dayKey = toISODate(d);
          const summary = daySummaries.get(dayKey);
          const isSelected = isSameDay(d, selectedDate);
          const isToday = isSameDay(d, today);
          const isFuture = startOfDay(d).getTime() > startOfDay(today).getTime();
          return (
            <DayCell
              key={dayKey}
              day={d}
              shortLabel={DAYS_SHORT_TR[idx] ?? ''}
              isSelected={isSelected}
              isToday={isToday}
              isFuture={isFuture}
              colors={summary?.mealColors ?? []}
              onPress={() => {
                Haptics.selectionAsync();
                onSelect(d);
              }}
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

function DayCell({
  day,
  shortLabel,
  isSelected,
  isToday,
  isFuture,
  colors,
  onPress,
}: {
  day: Date;
  shortLabel: string;
  isSelected: boolean;
  isToday: boolean;
  isFuture: boolean;
  colors: string[];
  onPress: () => void;
}) {
  const selAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(selAnim, {
      toValue: isSelected ? 1 : 0,
      duration: isSelected ? 280 : 220,
      easing: isSelected ? EASE_SPRING : EASE_CLOSE,
      useNativeDriver: false,
    }).start();
  }, [isSelected]);

  const bgColor = selAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,159,10,0)', ACCENT],
  });
  const numColor = isSelected ? '#FFFFFF' : isToday ? ACCENT : TEXT;
  const uniqueColors = colors.slice(0, 3);

  return (
    <Pressable
      onPress={onPress}
      disabled={isFuture}
      style={[styles.dayCellPressable, isFuture && { opacity: 0.32 }]}
      hitSlop={4}
    >
      <Text
        allowFontScaling={false}
        style={[styles.dayShortLabel, isSelected && { color: ACCENT, fontFamily: font.semibold }]}
      >
        {shortLabel}
      </Text>
      <Animated.View
        style={[
          styles.dayCircle,
          { backgroundColor: bgColor },
          isToday && !isSelected && styles.dayCircleTodayOutline,
        ]}
      >
        <Text allowFontScaling={false} style={[styles.dayNumber, { color: numColor }]}>
          {day.getDate()}
        </Text>
      </Animated.View>
      <View style={styles.dayDotsRow}>
        {uniqueColors.map((c, i) => (
          <View key={i} style={[styles.dayDot, { backgroundColor: c }]} />
        ))}
        {uniqueColors.length === 0 && <View style={{ height: 5 }} />}
      </View>
    </Pressable>
  );
}

// ─────────────── AI Summary Card ───────────────

function AISummaryCard({ summary }: { summary: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  const prevSummary = useRef<string>('');

  useEffect(() => {
    if (prevSummary.current === summary) return;
    prevSummary.current = summary;
    opacity.stopAnimation();
    translateY.stopAnimation();
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        easing: EASE_SPRING,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        easing: EASE_SPRING,
        useNativeDriver: true,
      }),
    ]).start();
  }, [summary]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        easing: EASE_SPRING,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        easing: EASE_SPRING,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <LinearGradient
        colors={['#FFCC80', '#FF9F0A', '#E07900']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.aiCardBorder}
      >
        <View style={styles.aiCardInner}>
          <AIAvatar size={28} />
          <Text allowFontScaling={false} style={styles.aiCardText} numberOfLines={2}>
            {summary}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ─────────────── Timeline ───────────────

type TimelineRow =
  | { kind: 'caption'; id: string; label: string }
  | { kind: 'meal'; id: string; meal: MealLog; index: number };

function TimelineItem({
  meal,
  index,
  onPress,
}: {
  meal: MealLog;
  index: number;
  onPress: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const delay = Math.min(index, 8) * 40;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 340,
        delay,
        easing: EASE_SPRING,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 340,
        delay,
        easing: EASE_SPRING,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const meta = MEAL_META[meal.mealType];
  const tint = meta.color;
  const icon = meta.icon;
  const time = fmtTimeFromISO(meal.loggedAt);
  const itemNames = meal.items.map((it) => it.name).filter(Boolean);
  const subtitle =
    itemNames.length > 0
      ? itemNames.slice(0, 2).join(', ') + (itemNames.length > 2 ? ` +${itemNames.length - 2}` : '')
      : `${meal.items.length} öğe`;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <SoftPressable onPress={onPress} style={styles.tlRow} scaleTo={0.985}>
        <View style={styles.tlTimeCol}>
          <Text allowFontScaling={false} style={styles.tlTime}>
            {time}
          </Text>
        </View>
        <View style={[styles.tlIconWrap, { backgroundColor: hexAlpha(tint, 0.15) }]}>
          <Text allowFontScaling={false} style={{ fontSize: 16 }}>
            {icon}
          </Text>
        </View>
        <View style={styles.tlBody}>
          <Text allowFontScaling={false} style={styles.tlTitle} numberOfLines={1}>
            {meta.label}
          </Text>
          <Text allowFontScaling={false} style={styles.tlSubtitle} numberOfLines={1}>
            {Math.round(meal.totalCalories)} kcal · {subtitle}
          </Text>
        </View>
        <ChevronRight size={14} color={MUTED} />
      </SoftPressable>
      <View style={styles.tlSeparator} />
    </Animated.View>
  );
}

function GroupCaption({ label }: { label: string }) {
  return (
    <View style={styles.captionWrap}>
      <Text allowFontScaling={false} style={styles.captionText}>
        {label}
      </Text>
    </View>
  );
}

// ─────────────── Macro Totals Card ───────────────

function MacroTotalsCard({
  calories,
  protein,
  carbs,
  fat,
  mealCount,
}: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        easing: EASE_SPRING,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        easing: EASE_SPRING,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[styles.macroCard, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.macroTopRow}>
        <View>
          <Text allowFontScaling={false} style={styles.macroLabel}>
            TOPLAM KALORİ
          </Text>
          <Text allowFontScaling={false} style={styles.macroBig}>
            {Math.round(calories)} <Text style={styles.macroUnit}>kcal</Text>
          </Text>
        </View>
        <View style={styles.macroChip}>
          <Text allowFontScaling={false} style={styles.macroChipText}>
            {mealCount} öğün
          </Text>
        </View>
      </View>
      <View style={styles.macroSep} />
      <View style={styles.macroBottomRow}>
        <MacroBlock label="Protein" value={protein} unit="g" color="#EC4899" />
        <View style={styles.macroVDiv} />
        <MacroBlock label="Karb." value={carbs} unit="g" color="#F59E0B" />
        <View style={styles.macroVDiv} />
        <MacroBlock label="Yağ" value={fat} unit="g" color="#8B5CF6" />
      </View>
    </Animated.View>
  );
}

function MacroBlock({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <View style={styles.macroBlock}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text allowFontScaling={false} style={styles.macroBlockLabel}>
        {label}
      </Text>
      <Text allowFontScaling={false} style={styles.macroBlockValue}>
        {Math.round(value)}
        <Text style={styles.macroBlockUnit}>{unit}</Text>
      </Text>
    </View>
  );
}

// ─────────────── Empty State ───────────────

function EmptyDay() {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(6)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        easing: EASE_SPRING,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        easing: EASE_SPRING,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[styles.emptyWrap, { opacity, transform: [{ translateY }] }]}>
      <CalendarEmptyIcon size={56} />
      <Text allowFontScaling={false} style={styles.emptyTitle}>
        Bu gün için kayıt yok
      </Text>
      <Text allowFontScaling={false} style={styles.emptySubtitle}>
        Eklediğin öğünler ve makro toplamları burada görünür.
      </Text>
    </Animated.View>
  );
}

// ─────────────── Helpers ───────────────

function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function buildSummary(meals: MealLog[], totalCalories: number, isToday: boolean): string {
  if (meals.length === 0) {
    return isToday ? 'Bugün için öğün yok. Hadi başlayalım ✨' : 'Bu gün için öğün eklenmemiş.';
  }
  const counts: Record<MealType, number> = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
  meals.forEach((m) => {
    counts[m.mealType]++;
  });
  const parts: string[] = [];
  if (counts.breakfast > 0)
    parts.push(counts.breakfast > 1 ? `${counts.breakfast} kahvaltı` : 'kahvaltı');
  if (counts.lunch > 0) parts.push(counts.lunch > 1 ? `${counts.lunch} öğle` : 'öğle');
  if (counts.dinner > 0) parts.push(counts.dinner > 1 ? `${counts.dinner} akşam` : 'akşam');
  if (counts.snack > 0) parts.push(`${counts.snack} atıştırmalık`);
  const list =
    parts.length === 1
      ? parts[0]
      : parts.length === 2
        ? `${parts[0]} ve ${parts[1]}`
        : `${parts.slice(0, -1).join(', ')} ve ${parts[parts.length - 1]}`;
  const prefix = isToday ? 'Bugün' : 'Bu gün';
  return `${prefix} ${list} · ${Math.round(totalCalories)} kcal`;
}

// ─────────────── Hook: week meals ───────────────

function useWeekMeals(weekStart: Date) {
  const { getToken } = useAuth();
  const dates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => toISODate(addDays(weekStart, i))),
    [weekStart],
  );
  const key = dates.join(',');

  return useQuery({
    queryKey: ['nutrition', 'meals', 'week', key],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Unauthorized');
      const results = await Promise.all(
        dates.map((d) => fetchMeals(token, d).catch(() => ({ meals: [] as MealLog[] }))),
      );
      const byDate: Record<string, MealLog[]> = {};
      dates.forEach((d, i) => {
        byDate[d] = results[i]?.meals ?? [];
      });
      return byDate;
    },
    staleTime: 60_000,
  });
}

// ─────────────── Main Screen ───────────────

export default function BeslenmeTakvimRoute() {
  const insets = useSafeAreaInsets();

  const today = useMemo(() => startOfDay(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(today));
  const [detailMeal, setDetailMeal] = useState<MealLog | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: byDate } = useWeekMeals(weekStart);

  const daySummaries = useMemo(() => {
    const map = new Map<string, DaySummary>();
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      const key = toISODate(d);
      const meals = byDate?.[key] ?? [];
      const totalCalories = meals.reduce((sum, m) => sum + (m.totalCalories ?? 0), 0);
      const colors = Array.from(new Set(meals.map((m) => MEAL_META[m.mealType].color)));
      map.set(key, { date: d, meals, totalCalories, mealColors: colors });
    }
    return map;
  }, [byDate, weekStart]);

  const selectedKey = toISODate(selectedDate);
  const dayData = daySummaries.get(selectedKey);
  const dayMeals = dayData?.meals ?? [];

  const dayTotals = useMemo(() => {
    return dayMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + (m.totalCalories ?? 0),
        protein: acc.protein + (m.totalProteinG ?? 0),
        carbs: acc.carbs + (m.totalCarbsG ?? 0),
        fat: acc.fat + (m.totalFatG ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [dayMeals]);

  const sortedMeals = useMemo(() => {
    return [...dayMeals].sort((a, b) => {
      const oa = MEAL_META[a.mealType].order;
      const ob = MEAL_META[b.mealType].order;
      if (oa !== ob) return oa - ob;
      return new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime();
    });
  }, [dayMeals]);

  const summary = useMemo(() => {
    const isToday = isSameDay(selectedDate, today);
    if (sortedMeals.length === 0 && !isToday) {
      return `${DAYS_LONG_TR[(selectedDate.getDay() + 6) % 7]}, ${selectedDate.getDate()} ${MONTHS_TR[selectedDate.getMonth()]} için kayıt yok`;
    }
    return buildSummary(sortedMeals, dayTotals.calories, isToday);
  }, [sortedMeals, dayTotals.calories, selectedDate, today]);

  const rows: TimelineRow[] = useMemo(() => {
    const r: TimelineRow[] = [];
    let idx = 0;
    if (sortedMeals.length > 0) {
      r.push({ kind: 'caption', id: 'cap-meals', label: 'ÖĞÜNLER' });
      sortedMeals.forEach((m, i) => {
        r.push({ kind: 'meal', id: `m-${m.id}-${i}`, meal: m, index: idx++ });
      });
    }
    return r;
  }, [sortedMeals]);

  const visibleMonth = useMemo(() => addDays(weekStart, 3), [weekStart]);

  const handleSelect = (d: Date) => {
    setSelectedDate(d);
    const ws = startOfWeek(d);
    if (!isSameDay(ws, weekStart)) setWeekStart(ws);
  };

  const handleToday = () => {
    Haptics.selectionAsync();
    setSelectedDate(today);
    setWeekStart(startOfWeek(today));
  };

  const handleMealPress = (m: MealLog) => {
    Haptics.selectionAsync();
    setDetailMeal(m);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <CalendarHeader
          visibleMonth={visibleMonth}
          isTodaySelected={isSameDay(selectedDate, today)}
          onTodayPress={handleToday}
          onMonthPress={() => setPickerOpen(true)}
          topInset={insets.top}
        />

        <WeekStrip
          weekStart={weekStart}
          selectedDate={selectedDate}
          today={today}
          daySummaries={daySummaries}
          onSelect={handleSelect}
        />

        <View style={styles.divider} />

        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              <View style={styles.aiCardWrap}>
                <AISummaryCard summary={summary} />
              </View>
              {sortedMeals.length > 0 && (
                <View style={styles.macroWrap}>
                  <MacroTotalsCard
                    calories={dayTotals.calories}
                    protein={dayTotals.protein}
                    carbs={dayTotals.carbs}
                    fat={dayTotals.fat}
                    mealCount={sortedMeals.length}
                  />
                </View>
              )}
            </View>
          }
          ListEmptyComponent={<EmptyDay />}
          renderItem={({ item }) => {
            if (item.kind === 'caption') return <GroupCaption label={item.label} />;
            return (
              <TimelineItem
                meal={item.meal}
                index={item.index}
                onPress={() => handleMealPress(item.meal)}
              />
            );
          }}
        />

        <MealDetailSheet meal={detailMeal} onClose={() => setDetailMeal(null)} />

        <DatePickerSheet
          visible={pickerOpen}
          date={selectedDate}
          title="Tarih Seç"
          maxYear={today.getFullYear()}
          onClose={() => setPickerOpen(false)}
          onChange={(d) => {
            const day = startOfDay(d);
            const clamped = day.getTime() > today.getTime() ? today : day;
            setSelectedDate(clamped);
            setWeekStart(startOfWeek(clamped));
            setPickerOpen(false);
          }}
        />
      </View>
    </GestureHandlerRootView>
  );
}

// ─────────────── Meal Detail Sheet ───────────────

function MealDetailSheet({ meal, onClose }: { meal: MealLog | null; onClose: () => void }) {
  if (!meal) return null;
  const meta = MEAL_META[meal.mealType];
  const tint = meta.color;
  const time = fmtTimeFromISO(meal.loggedAt);
  const date = new Date(meal.loggedAt);
  const dateLong = `${date.getDate()} ${MONTHS_TR[date.getMonth()]} ${date.getFullYear()}`;

  return (
    <SheetShell visible title="Öğün Detayı" onClose={onClose} hideSave>
      <SheetBody>
        <View style={{ paddingTop: 24, paddingHorizontal: 16, alignItems: 'center' }}>
          <View style={[styles.detailIconWrap, { backgroundColor: hexAlpha(tint, 0.18) }]}>
            <Text allowFontScaling={false} style={{ fontSize: 36 }}>
              {meta.icon}
            </Text>
          </View>
          <Text allowFontScaling={false} style={styles.detailTitle}>
            {meta.label}
          </Text>
          <Text allowFontScaling={false} style={styles.detailSubtitle}>
            {Math.round(meal.totalCalories)} kcal
          </Text>
        </View>

        <Section caption="DETAY">
          <View style={styles.detailRow}>
            <Text allowFontScaling={false} style={styles.detailLabel}>
              Saat
            </Text>
            <Text allowFontScaling={false} style={styles.detailValue}>
              {time}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text allowFontScaling={false} style={styles.detailLabel}>
              Tarih
            </Text>
            <Text allowFontScaling={false} style={styles.detailValue}>
              {dateLong}
            </Text>
          </View>
        </Section>

        <Section caption="MAKROLAR">
          <View style={styles.detailRow}>
            <Text allowFontScaling={false} style={styles.detailLabel}>
              Protein
            </Text>
            <Text allowFontScaling={false} style={[styles.detailValue, { color: '#EC4899' }]}>
              {Math.round(meal.totalProteinG)} g
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text allowFontScaling={false} style={styles.detailLabel}>
              Karbonhidrat
            </Text>
            <Text allowFontScaling={false} style={[styles.detailValue, { color: '#F59E0B' }]}>
              {Math.round(meal.totalCarbsG)} g
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text allowFontScaling={false} style={styles.detailLabel}>
              Yağ
            </Text>
            <Text allowFontScaling={false} style={[styles.detailValue, { color: '#8B5CF6' }]}>
              {Math.round(meal.totalFatG)} g
            </Text>
          </View>
        </Section>

        {meal.items.length > 0 && (
          <Section caption={`YİYECEKLER (${meal.items.length})`}>
            {meal.items.map((it, i) => (
              <View
                key={i}
                style={[
                  styles.detailRow,
                  i < meal.items.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: HAIRLINE,
                  },
                ]}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text allowFontScaling={false} style={styles.detailLabel} numberOfLines={1}>
                    {it.name}
                  </Text>
                  <Text allowFontScaling={false} style={styles.detailItemSub} numberOfLines={1}>
                    {it.quantity} × {it.servingSize} {it.servingUnit}
                  </Text>
                </View>
                <Text allowFontScaling={false} style={styles.detailValue}>
                  {Math.round(it.calories * it.quantity)} kcal
                </Text>
              </View>
            ))}
          </Section>
        )}

        {!!meal.notes && (
          <Section caption="NOT">
            <View style={styles.detailNoteWrap}>
              <Text allowFontScaling={false} style={styles.detailNote}>
                {meal.notes}
              </Text>
            </View>
          </Section>
        )}
      </SheetBody>
    </SheetShell>
  );
}

// ─────────────── Styles ───────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  headerWrap: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    backgroundColor: BG,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: {
    fontFamily: font.bold,
    fontSize: 28,
    color: TEXT,
    letterSpacing: -0.4,
  },
  todayPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(255,159,10,0.12)',
  },
  todayPillText: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: ACCENT,
    letterSpacing: -0.1,
  },

  weekStrip: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: BG,
  },
  weekStripInner: { flexDirection: 'row', width: '100%' },
  dayCellPressable: { flex: 1, alignItems: 'center' },
  dayShortLabel: {
    fontFamily: font.medium,
    fontSize: 11,
    color: SUBTEXT,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleTodayOutline: {
    borderWidth: 1.5,
    borderColor: ACCENT,
  },
  dayNumber: {
    fontFamily: font.semibold,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  dayDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 8,
    marginTop: 5,
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 1.5,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: HAIRLINE,
  },

  aiCardWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6,
  },
  aiCardBorder: {
    borderRadius: 16,
    padding: 1.5,
    shadowColor: '#FF9F0A',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  aiCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 14.5,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  aiCardText: {
    flex: 1,
    marginLeft: 12,
    fontFamily: font.medium,
    fontSize: 14,
    color: TEXT,
    letterSpacing: -0.1,
    lineHeight: 19,
  },

  macroWrap: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 4 },
  macroCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  macroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  macroLabel: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: SUBTEXT,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  macroBig: {
    fontFamily: font.extrabold,
    fontSize: 26,
    color: TEXT,
    letterSpacing: -0.6,
  },
  macroUnit: {
    fontFamily: font.medium,
    fontSize: 14,
    color: SUBTEXT,
    letterSpacing: -0.2,
  },
  macroChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,159,10,0.12)',
  },
  macroChipText: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: ACCENT,
    letterSpacing: -0.1,
  },
  macroSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: HAIRLINE,
    marginVertical: 12,
  },
  macroBottomRow: { flexDirection: 'row', alignItems: 'center' },
  macroBlock: { flex: 1, alignItems: 'center' },
  macroVDiv: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: HAIRLINE,
  },
  macroDot: { width: 6, height: 6, borderRadius: 3, marginBottom: 4 },
  macroBlockLabel: {
    fontFamily: font.medium,
    fontSize: 11,
    color: SUBTEXT,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  macroBlockValue: {
    fontFamily: font.bold,
    fontSize: 16,
    color: TEXT,
    letterSpacing: -0.3,
  },
  macroBlockUnit: {
    fontFamily: font.medium,
    fontSize: 12,
    color: SUBTEXT,
    letterSpacing: -0.1,
  },

  listContent: { paddingTop: 10, paddingBottom: 24 },
  captionWrap: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  captionText: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: SUBTEXT,
    letterSpacing: 0.6,
  },
  tlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
  },
  tlTimeCol: { width: 48, alignItems: 'flex-start' },
  tlTime: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: TEXT,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.1,
  },
  tlIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tlBody: { flex: 1, paddingRight: 8 },
  tlTitle: {
    fontFamily: font.semibold,
    fontSize: 15,
    color: TEXT,
    letterSpacing: -0.2,
  },
  tlSubtitle: {
    fontFamily: font.regular,
    fontSize: 13,
    color: SUBTEXT,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  tlSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: HAIRLINE,
    marginLeft: 16 + 48 + 32 + 12,
    marginRight: 16,
  },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyTitle: {
    fontFamily: font.semibold,
    fontSize: 17,
    color: TEXT,
    marginTop: 18,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontFamily: font.regular,
    fontSize: 13,
    color: SUBTEXT,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    letterSpacing: -0.1,
  },

  detailIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  detailTitle: {
    fontFamily: font.bold,
    fontSize: 22,
    color: TEXT,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  detailSubtitle: {
    fontFamily: font.regular,
    fontSize: 15,
    color: SUBTEXT,
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  detailLabel: {
    fontFamily: font.regular,
    fontSize: 15,
    color: TEXT,
    letterSpacing: -0.24,
  },
  detailValue: {
    fontFamily: font.medium,
    fontSize: 15,
    color: SUBTEXT,
    letterSpacing: -0.2,
    maxWidth: 220,
    textAlign: 'right',
  },
  detailItemSub: {
    fontFamily: font.regular,
    fontSize: 12,
    color: SUBTEXT,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  detailNoteWrap: { paddingVertical: 14, paddingHorizontal: 16 },
  detailNote: {
    fontFamily: font.regular,
    fontSize: 15,
    color: TEXT,
    lineHeight: 22,
    letterSpacing: -0.24,
  },
});

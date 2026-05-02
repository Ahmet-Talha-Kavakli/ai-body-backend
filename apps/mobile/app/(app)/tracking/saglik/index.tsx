import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useCalendarEvents,
  type CalendarEvent,
  type CalendarEventType,
} from '../../../../src/hooks/useBodyData';
import { SheetShell } from './components/SheetShell';
import { SheetBody, Section } from './components/SheetPrimitives';
import { DatePickerSheet } from '../../../../components/shared/DateTimePickerSheets';

// ─────────────── Theme ───────────────

const BG = '#F2F2F7';
const CARD = '#FFFFFF';
const ACCENT = '#FF2D55';
const TEXT = '#1C1C1E';
const SUBTEXT = '#8E8E93';
const HAIRLINE = 'rgba(60,60,67,0.12)';
const MUTED = '#3C3C4399';

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);
const EASE_MICRO = Easing.bezier(0.4, 0, 0.2, 1);

const TYPE_META: Record<CalendarEventType, { color: string; icon: string; label: string }> = {
  medication_dose: { color: '#34C759', icon: '💊', label: 'İlaç' },
  illness: { color: '#FF453A', icon: '🌡️', label: 'Hastalık' },
  chronic_checkup: { color: '#AF52DE', icon: '🩺', label: 'Kontrol' },
  vaccine: { color: '#5AC8FA', icon: '💉', label: 'Aşı' },
  blood_test: { color: '#FF6914', icon: '🧪', label: 'Tahlil' },
  body_mark: { color: '#FF9F0A', icon: '🩹', label: 'İşaret' },
  surgery: { color: '#FF2D55', icon: '🔪', label: 'Ameliyat' },
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
function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
// Pazartesi başlangıç
function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay(); // 0=Sun, 1=Mon
  const diff = (day + 6) % 7; // Mon→0, Sun→6
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
function fmtTime(t?: string | null): string {
  if (!t) return '';
  // expects "HH:mm"
  return t.slice(0, 5);
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

// ─────────────── AI Avatar (small) ───────────────

function AIAvatar({ size = 24 }: { size?: number }) {
  return (
    <LinearGradient
      colors={['#FF6482', '#FF2D55', '#C7185F']}
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

// ─────────────── Pressable helper (scale + opacity) ───────────────

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
  // Today pill belirme animasyonu
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

function WeekStrip({
  weekStart,
  selectedDate,
  today,
  eventsByDay,
  onSelect,
  onSwipe,
}: {
  weekStart: Date;
  selectedDate: Date;
  today: Date;
  eventsByDay: Map<string, CalendarEvent[]>;
  onSelect: (d: Date) => void;
  onSwipe: (direction: 1 | -1) => void;
}) {
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  // Slide animasyon — hafta değişimi
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const prevWeekKey = useRef(weekStart.toISOString());

  useEffect(() => {
    const key = weekStart.toISOString();
    if (prevWeekKey.current === key) return;
    prevWeekKey.current = key;
    // Yumuşak fade + lift
    Animated.parallel([
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
      ]),
    ]).start();
  }, [weekStart]);

  return (
    <Animated.View style={[styles.weekStrip, { opacity, transform: [{ translateX }] }]}>
      <View style={styles.weekStripInner}>
        {days.map((d, idx) => {
          const dayKey = startOfDay(d).toISOString();
          const dayEvents = eventsByDay.get(dayKey) ?? [];
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
              events={dayEvents}
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
  events,
  onPress,
}: {
  day: Date;
  shortLabel: string;
  isSelected: boolean;
  isToday: boolean;
  isFuture: boolean;
  events: CalendarEvent[];
  onPress: () => void;
}) {
  // Selection background animasyonu (önceki değerden yeniye)
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
    outputRange: ['rgba(255,45,85,0)', ACCENT],
  });
  const numColor = isSelected ? '#FFFFFF' : isToday ? ACCENT : TEXT;

  // Max 3 dot
  const uniqueColors = Array.from(new Set(events.map((e) => e.color))).slice(0, 3);

  return (
    <Pressable
      onPress={onPress}
      disabled={isFuture}
      style={[styles.dayCellPressable, isFuture && { opacity: 0.32 }]}
      hitSlop={4}
    >
      <Text
        allowFontScaling={false}
        style={[styles.dayShortLabel, isSelected && { color: ACCENT, fontWeight: '600' }]}
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
    // Önceki değerden yeniye fade-in lift
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

  // İlk mount'ta da animate et
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
        colors={['#FF6482', '#FF2D55', '#C7185F']}
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
  | { kind: 'event'; id: string; event: CalendarEvent; index: number };

function TimelineItem({
  event,
  index,
  onPress,
}: {
  event: CalendarEvent;
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

  const meta = TYPE_META[event.type];
  const tint = event.color || meta?.color || ACCENT;
  const icon = event.icon || meta?.icon || '•';
  const time = fmtTime(event.timeOfDay);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <SoftPressable onPress={onPress} style={styles.tlRow} scaleTo={0.985}>
        {time ? (
          <View style={styles.tlTimeCol}>
            <Text allowFontScaling={false} style={styles.tlTime}>
              {time}
            </Text>
          </View>
        ) : null}
        <View style={[styles.tlIconWrap, { backgroundColor: hexAlpha(tint, 0.15) }]}>
          <Text allowFontScaling={false} style={{ fontSize: 16 }}>
            {icon}
          </Text>
        </View>
        <View style={styles.tlBody}>
          <Text allowFontScaling={false} style={styles.tlTitle} numberOfLines={1}>
            {event.title}
          </Text>
          {!!event.subtitle && (
            <Text allowFontScaling={false} style={styles.tlSubtitle} numberOfLines={1}>
              {event.subtitle}
            </Text>
          )}
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
        İlaç dozları, hastalıklar ve randevular burada görünür.
      </Text>
    </Animated.View>
  );
}

// ─────────────── Helpers ───────────────

function hexAlpha(hex: string, alpha: number): string {
  // expects #RRGGBB
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function buildSummary(todayEvents: CalendarEvent[]): string {
  if (todayEvents.length === 0) return 'Bugün için kayıt yok. Sakin bir gün ✨';
  const meds = todayEvents.filter((e) => e.type === 'medication_dose').length;
  const illnesses = todayEvents.filter((e) => e.type === 'illness').length;
  const checkups = todayEvents.filter((e) => e.type === 'chronic_checkup').length;
  const vaccines = todayEvents.filter((e) => e.type === 'vaccine').length;
  const tests = todayEvents.filter((e) => e.type === 'blood_test').length;

  const parts: string[] = [];
  if (meds > 0) parts.push(`${meds} ilaç dozu`);
  if (illnesses > 0) parts.push(`${illnesses} aktif hastalık`);
  if (checkups > 0) parts.push(`${checkups} kontrol`);
  if (vaccines > 0) parts.push(`${vaccines} aşı`);
  if (tests > 0) parts.push(`${tests} tahlil`);

  if (parts.length === 0) {
    return `Bugün ${todayEvents.length} kayıtlı olayın var`;
  }
  if (parts.length === 1) return `Bugün ${parts[0]} var`;
  const last = parts.pop();
  return `Bugün ${parts.join(', ')} ve ${last} var`;
}

function isEventOnDay(e: CalendarEvent, day: Date): boolean {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = endOfDay(day).getTime();
  const start = new Date(e.startDate).getTime();
  const end = e.endDate ? new Date(e.endDate).getTime() : start;
  return start <= dayEnd && end >= dayStart;
}

// ─────────────── Main Screen ───────────────

export default function TakvimRoute() {
  const insets = useSafeAreaInsets();

  const today = useMemo(() => startOfDay(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(today));
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // API range: tüm görünen hafta
  const fromISO = useMemo(() => startOfDay(weekStart).toISOString(), [weekStart]);
  const toISO = useMemo(() => endOfDay(addDays(weekStart, 6)).toISOString(), [weekStart]);

  const { data: events = [] } = useCalendarEvents(fromISO, toISO);

  // Hafta içindeki günlere göre grupla
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      const key = startOfDay(d).toISOString();
      map.set(
        key,
        events.filter((e) => isEventOnDay(e, d)),
      );
    }
    return map;
  }, [events, weekStart]);

  const selectedKey = startOfDay(selectedDate).toISOString();
  const dayEvents =
    eventsByDay.get(selectedKey) ?? events.filter((e) => isEventOnDay(e, selectedDate));

  // Timed vs all-day
  const timedEvents = useMemo(
    () =>
      dayEvents
        .filter((e) => !!e.timeOfDay)
        .sort((a, b) => (a.timeOfDay ?? '').localeCompare(b.timeOfDay ?? '')),
    [dayEvents],
  );
  const allDayEvents = useMemo(() => dayEvents.filter((e) => !e.timeOfDay), [dayEvents]);

  const summary = useMemo(() => {
    if (isSameDay(selectedDate, today)) return buildSummary(dayEvents);
    // Seçili gün bugün değilse
    if (dayEvents.length === 0) {
      return `${DAYS_LONG_TR[(selectedDate.getDay() + 6) % 7]}, ${selectedDate.getDate()} ${MONTHS_TR[selectedDate.getMonth()]} için kayıt yok`;
    }
    return buildSummary(dayEvents).replace('Bugün', 'Bu gün');
  }, [dayEvents, selectedDate, today]);

  // Timeline rows
  const rows: TimelineRow[] = useMemo(() => {
    const r: TimelineRow[] = [];
    let idx = 0;
    if (timedEvents.length > 0) {
      r.push({ kind: 'caption', id: 'cap-timed', label: 'ZAMANLI' });
      timedEvents.forEach((e, i) => {
        r.push({ kind: 'event', id: `t-${e.id}-${i}`, event: e, index: idx++ });
      });
    }
    if (allDayEvents.length > 0) {
      r.push({ kind: 'caption', id: 'cap-allday', label: 'TÜM GÜN' });
      allDayEvents.forEach((e, i) => {
        r.push({ kind: 'event', id: `a-${e.id}-${i}`, event: e, index: idx++ });
      });
    }
    return r;
  }, [timedEvents, allDayEvents]);

  // Visible month: hafta ortasındaki güne göre
  const visibleMonth = useMemo(() => addDays(weekStart, 3), [weekStart]);

  const handleSelect = (d: Date) => {
    setSelectedDate(d);
    // Eğer farklı haftaya gittiyse hafta da güncellensin
    const ws = startOfWeek(d);
    if (!isSameDay(ws, weekStart)) setWeekStart(ws);
  };

  const handleSwipe = (dir: 1 | -1) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newWeekStart = addDays(weekStart, dir * 7);
    setWeekStart(newWeekStart);
    // Seçili gün haftada değilse, yeni haftanın aynı günündeki rakama geç
    const dayIdx = (selectedDate.getDay() + 6) % 7;
    setSelectedDate(addDays(newWeekStart, dayIdx));
  };

  const handleToday = () => {
    Haptics.selectionAsync();
    setSelectedDate(today);
    setWeekStart(startOfWeek(today));
  };

  const handleEventPress = (e: CalendarEvent) => {
    Haptics.selectionAsync();
    setDetailEvent(e);
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
          eventsByDay={eventsByDay}
          onSelect={handleSelect}
          onSwipe={handleSwipe}
        />

        <View style={styles.divider} />

        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.aiCardWrap}>
              <AISummaryCard summary={summary} />
            </View>
          }
          ListEmptyComponent={<EmptyDay />}
          renderItem={({ item }) => {
            if (item.kind === 'caption') return <GroupCaption label={item.label} />;
            return (
              <TimelineItem
                event={item.event}
                index={item.index}
                onPress={() => handleEventPress(item.event)}
              />
            );
          }}
        />

        <EventDetailSheet event={detailEvent} onClose={() => setDetailEvent(null)} />

        <DatePickerSheet
          visible={pickerOpen}
          date={selectedDate}
          title="Tarih Seç"
          maxYear={today.getFullYear()}
          onClose={() => setPickerOpen(false)}
          onChange={(d) => {
            // Bugünden ileri seçilirse bugüne clamp et
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

// ─────────────── Event Detail Sheet ───────────────
function EventDetailSheet({
  event,
  onClose,
}: {
  event: CalendarEvent | null;
  onClose: () => void;
}) {
  if (!event) return null;
  const meta = TYPE_META[event.type];
  const tint = event.color || meta?.color || ACCENT;
  const icon = event.icon || meta?.icon || '•';
  const time = fmtTime(event.timeOfDay);
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;

  const fmtDateLong = (d: Date) => `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;

  let dateRange = fmtDateLong(start);
  if (end && !isSameDay(end, start)) {
    dateRange = `${fmtDateLong(start)} → ${fmtDateLong(end)}`;
  } else if (!end && event.type === 'illness') {
    dateRange = `${fmtDateLong(start)} (devam ediyor)`;
  }

  return (
    <SheetShell visible title="Detay" onClose={onClose} hideSave>
      <SheetBody>
        <View style={{ paddingTop: 24, paddingHorizontal: 16, alignItems: 'center' }}>
          <View style={[styles.detailIconWrap, { backgroundColor: hexAlpha(tint, 0.18) }]}>
            <Text allowFontScaling={false} style={{ fontSize: 36 }}>
              {icon}
            </Text>
          </View>
          <Text allowFontScaling={false} style={styles.detailTitle}>
            {event.title}
          </Text>
          {!!event.subtitle && (
            <Text allowFontScaling={false} style={styles.detailSubtitle}>
              {event.subtitle}
            </Text>
          )}
        </View>

        <Section caption="DETAY">
          <View style={styles.detailRow}>
            <Text allowFontScaling={false} style={styles.detailLabel}>
              Kategori
            </Text>
            <Text allowFontScaling={false} style={[styles.detailValue, { color: tint }]}>
              {meta?.label ?? event.type}
            </Text>
          </View>
          {time ? (
            <View style={styles.detailRow}>
              <Text allowFontScaling={false} style={styles.detailLabel}>
                Saat
              </Text>
              <Text allowFontScaling={false} style={styles.detailValue}>
                {time}
              </Text>
            </View>
          ) : null}
          <View style={styles.detailRow}>
            <Text allowFontScaling={false} style={styles.detailLabel}>
              Tarih
            </Text>
            <Text allowFontScaling={false} style={styles.detailValue} numberOfLines={2}>
              {dateRange}
            </Text>
          </View>
        </Section>

        {!!event.note && (
          <Section caption="NOT">
            <View style={styles.detailNoteWrap}>
              <Text allowFontScaling={false} style={styles.detailNote}>
                {event.note}
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
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // Header
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.4,
  },
  todayPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(255,45,85,0.10)',
  },
  todayPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: ACCENT,
    letterSpacing: -0.1,
  },

  // Week strip
  weekStrip: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: BG,
  },
  weekStripInner: {
    flexDirection: 'row',
    width: '100%',
  },
  dayCellPressable: {
    flex: 1,
    alignItems: 'center',
  },
  dayShortLabel: {
    fontSize: 11,
    fontWeight: '500',
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
    fontSize: 17,
    fontWeight: '600',
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
    marginHorizontal: 0,
  },

  // AI card
  aiCardWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6,
  },
  aiCardBorder: {
    borderRadius: 16,
    padding: 1.5,
    shadowColor: '#FF2D55',
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
    fontSize: 14,
    fontWeight: '500',
    color: TEXT,
    letterSpacing: -0.1,
    lineHeight: 19,
  },

  // Timeline
  listContent: {
    paddingTop: 10,
    paddingBottom: 24,
  },
  captionWrap: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  captionText: {
    fontSize: 11,
    fontWeight: '600',
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
  tlTimeCol: {
    width: 48,
    alignItems: 'flex-start',
  },
  tlTime: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.1,
  },
  tlAllDay: {
    fontSize: 13,
    fontWeight: '500',
    color: MUTED,
  },
  tlIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tlBody: {
    flex: 1,
    paddingRight: 8,
  },
  tlTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
    letterSpacing: -0.2,
  },
  tlSubtitle: {
    fontSize: 13,
    fontWeight: '400',
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

  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT,
    marginTop: 18,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: SUBTEXT,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    letterSpacing: -0.1,
  },

  // Event detail sheet
  detailIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  detailSubtitle: {
    fontSize: 15,
    fontWeight: '400',
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
    fontSize: 15,
    color: TEXT,
    letterSpacing: -0.24,
  },
  detailValue: {
    fontSize: 15,
    color: SUBTEXT,
    letterSpacing: -0.2,
    maxWidth: 220,
    textAlign: 'right',
  },
  detailNoteWrap: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  detailNote: {
    fontSize: 15,
    color: TEXT,
    lineHeight: 22,
    letterSpacing: -0.24,
  },
});

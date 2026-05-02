import React, { useRef, useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT = '#FF2D55';
const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 20 * 2 - 12) / 2;

// ─── Types ────────────────────────────────────────────────────────────────────

type PeriodKey =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | '3month'
  | '6month'
  | '9month'
  | 'yearly'
  | 'custom';

type FormatKey = 'pdf' | 'csv' | 'excel';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeriodRange(
  key: PeriodKey,
  customStart?: Date,
  customEnd?: Date,
): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (key === 'daily') return { start: today, end: today };
  if (key === 'weekly') {
    const day = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    return { start, end: today };
  }
  if (key === 'monthly')
    return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: today };
  if (key === '3month')
    return { start: new Date(today.getFullYear(), today.getMonth() - 2, 1), end: today };
  if (key === '6month')
    return { start: new Date(today.getFullYear(), today.getMonth() - 5, 1), end: today };
  if (key === '9month')
    return { start: new Date(today.getFullYear(), today.getMonth() - 8, 1), end: today };
  if (key === 'yearly') return { start: new Date(today.getFullYear(), 0, 1), end: today };
  return { start: customStart ?? today, end: customEnd ?? today };
}

function fmtDate(d: Date) {
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

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
    key: 'profile',
    icon: 'person-circle',
    color: '#FF2D55',
    bg: '#FFE9ED',
    title: 'Tıbbi Profil',
    desc: 'Kan grubu, alerjiler, kronik, görme/işitme, diş, yaşam durumu, fiziksel profil, çocukluk hastalıkları, bağımlılıklar, aile geçmişi',
  },
  {
    key: 'medications',
    icon: 'medkit',
    color: '#34C759',
    bg: '#EDFAF2',
    title: 'İlaç & Takviye',
    desc: 'Aktif ilaçlar, takviyeler, doz programı ve alım kayıtları',
  },
  {
    key: 'illnesses',
    icon: 'thermometer',
    color: '#FF453A',
    bg: '#FFE9E5',
    title: 'Hastalık Kayıtları',
    desc: 'Geçici hastalıklar, süre, şiddet ve tetikleyiciler',
  },
  {
    key: 'bloodwork',
    icon: 'flask',
    color: '#FF6914',
    bg: '#FFF0E5',
    title: 'Kan Tahlilleri',
    desc: 'Tüm tahlil sonuçları ve sağlık skoru analizi',
  },
  {
    key: 'body',
    icon: 'body',
    color: '#FF9F0A',
    bg: '#FFF4E5',
    title: 'Vücut İşaretleri',
    desc: 'Yaralanmalar, ağrılar, ameliyat geçmişi',
  },
  {
    key: 'vitals',
    icon: 'pulse',
    color: '#5AC8FA',
    bg: '#E5F6FF',
    title: 'Vital & Aşılar',
    desc: 'Aşı kayıtları, kontrol tarihleri ve vital ölçümler',
  },
  {
    key: 'goals',
    icon: 'trophy',
    color: '#5E5CE6',
    bg: '#EFEEFD',
    title: 'Hedefler & Profil',
    desc: 'Genel sağlık profili, günlük hedefler ve metrikler',
  },
];

// ─── Calendar ─────────────────────────────────────────────────────────────────

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

function calDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function calFirstDow(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function CalendarPicker({
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
                      backgroundColor: sel ? ACCENT : 'transparent',
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

// ─── Custom Date Picker Sheet ─────────────────────────────────────────────────

function CustomDatePickerSheet({
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
                backgroundColor: `${ACCENT}15`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={customStep === 'start' ? 'play-circle' : 'stop-circle'}
                size={26}
                color={ACCENT}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT }} />
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: customStep === 'end' ? ACCENT : '#E5E5EA',
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
              backgroundColor: ACCENT,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              opacity: pressed ? 0.82 : 1,
              shadowColor: ACCENT,
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
              <Ionicons name="chevron-back" size={16} color={ACCENT} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: ACCENT }}>Başlangıca Dön</Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Animated Section Hook ────────────────────────────────────────────────────

function useAnimatedSection() {
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

// ─── IndirTab ─────────────────────────────────────────────────────────────────

function IndirTab() {
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
  const selPressAnims = useRef<Record<PeriodKey, Animated.Value>>(
    Object.fromEntries(PERIODS.map((p) => [p.key, new Animated.Value(1)])) as Record<
      PeriodKey,
      Animated.Value
    >,
  ).current;

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
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
      {/* Hero */}
      <View style={s.hero}>
        <View style={s.heroIcon}>
          <Ionicons name="cloud-download" size={28} color={ACCENT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Sağlık Verilerini İndir</Text>
          <Text style={s.sub}>Dönem seç · Format seç · İndir</Text>
        </View>
      </View>

      {/* Bölüm 1: Dönem */}
      <View style={s.sectionHeader}>
        <View style={[s.sectionNum, { backgroundColor: selected ? ACCENT : '#E5E5EA' }]}>
          <Text style={[s.sectionNumTxt, { color: selected ? '#fff' : '#8E8E93' }]}>1</Text>
        </View>
        <Text style={s.sectionTitle}>Dönem Seç</Text>
      </View>

      {rows.map((row, ri) => (
        <View key={ri} style={s.row}>
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
                      s.card,
                      {
                        backgroundColor: isActive ? p.color : p.bg,
                        borderColor: isActive ? p.color : 'transparent',
                      },
                    ]}
                  >
                    {isActive && (
                      <View style={s.activeCheck}>
                        <Ionicons name="checkmark" size={11} color={p.color} />
                      </View>
                    )}
                    <View
                      style={[
                        s.cardIcon,
                        { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : p.color + '20' },
                      ]}
                    >
                      <Ionicons
                        name={p.icon as any}
                        size={24}
                        color={isActive ? '#fff' : p.color}
                      />
                    </View>
                    <Text style={[s.cardLabel, isActive && { color: '#fff' }]}>{p.label}</Text>
                    <Text style={[s.cardSub, isActive && { color: 'rgba(255,255,255,0.75)' }]}>
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
        <View style={s.rangeBanner}>
          <Ionicons name="calendar-outline" size={14} color={ACCENT} />
          <Text style={s.rangeTxt}>
            {fmtDate(range.start)} – {fmtDate(range.end)}
          </Text>
        </View>
      )}

      {/* Bölüm 2: Format */}
      {selected && (
        <View style={{ marginTop: 8 }}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionNum, { backgroundColor: format ? ACCENT : '#E5E5EA' }]}>
              <Text style={[s.sectionNumTxt, { color: format ? '#fff' : '#8E8E93' }]}>2</Text>
            </View>
            <Text style={s.sectionTitle}>Format Seç</Text>
          </View>
          <View style={s.fmtRow}>
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
                        s.fmtCard,
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
                      <Text style={[s.fmtLabel, isActive && { color: '#fff' }]}>{f.label}</Text>
                      <Text style={[s.fmtDesc, isActive && { color: 'rgba(255,255,255,0.75)' }]}>
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
            <View style={s.sectionHeader}>
              <View style={[s.sectionNum, { backgroundColor: ACCENT }]}>
                <Text style={[s.sectionNumTxt, { color: '#fff' }]}>3</Text>
              </View>
              <Text style={s.sectionTitle}>Rapor İçeriği</Text>
            </View>
            <View style={s.contentCard}>
              {CONTENT_SECTIONS.map((sec, i) => {
                const enabled = enabledSections[sec.key] ?? true;
                const handleToggle = () => {
                  const next = !enabled;
                  Animated.spring(toggleAnims[sec.key]!, {
                    toValue: next ? 1 : 0,
                    useNativeDriver: false,
                    tension: 300,
                    friction: 20,
                  }).start();
                  setEnabledSections((prev) => ({ ...prev, [sec.key]: next }));
                };
                return (
                  <Pressable
                    key={sec.key}
                    onPress={handleToggle}
                    style={[
                      s.contentRow,
                      i < CONTENT_SECTIONS.length - 1 && s.contentRowBorder,
                      !enabled && { opacity: 0.4 },
                    ]}
                  >
                    <View style={[s.contentIcon, { backgroundColor: sec.bg }]}>
                      <Ionicons name={sec.icon as any} size={16} color={sec.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.contentTitle}>{sec.title}</Text>
                      <Text style={s.contentDesc}>{sec.desc}</Text>
                    </View>
                    <Animated.View
                      style={[
                        s.toggleCircle,
                        {
                          backgroundColor: toggleAnims[sec.key]!.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['#E5E5EA', '#30D158'],
                          }),
                        },
                      ]}
                    >
                      <Animated.View
                        style={{
                          opacity: toggleAnims[sec.key]!,
                          transform: [
                            {
                              scale: toggleAnims[sec.key]!.interpolate({
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
            <View style={s.actionRow}>
              <Pressable
                disabled={!canDownload}
                style={[s.shareBtn, !canDownload && { opacity: 0.3 }]}
                onPress={() => {}}
              >
                <Ionicons name="share-outline" size={20} color={ACCENT} />
                <Text style={s.shareTxt}>Paylaş</Text>
              </Pressable>
              <Pressable
                disabled={!canDownload}
                style={[s.dlBtn, !canDownload && { opacity: 0.3 }]}
                onPress={() => {}}
              >
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={s.dlTxt}>İndir</Text>
              </Pressable>
            </View>
            <Text style={s.actionNote}>
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

// ─── Route ────────────────────────────────────────────────────────────────────

export default function IndirRoute() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingTop: insets.top + 12, backgroundColor: '#F2F2F7' }}>
      <IndirTab />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
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
});

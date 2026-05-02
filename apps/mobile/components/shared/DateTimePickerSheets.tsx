import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WheelPicker } from '../tracking/water/WheelPicker';

const { height: SCREEN_H } = Dimensions.get('window');
const ACCENT = '#FF2D55';

const EASE_OUT_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN_CLOSE = Easing.bezier(0.4, 0, 1, 1);

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
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

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function daysInMonth(year: number, month1: number): number {
  // month1 is 1-12
  return new Date(year, month1, 0).getDate();
}

// ─────────────────────────────────────────────────────────────────────────────
// TimePickerSheet (HH:mm)
// ─────────────────────────────────────────────────────────────────────────────

export function TimePickerSheet({
  visible,
  hour,
  minute,
  accent = ACCENT,
  title = 'Saat',
  onClose,
  onChange,
}: {
  visible: boolean;
  hour: number;
  minute: number;
  accent?: string;
  title?: string;
  onClose: () => void;
  onChange: (hour: number, minute: number) => void;
}) {
  const slide = useRef(new Animated.Value(SCREEN_H)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [localH, setLocalH] = useState(hour);
  const initialM = useMemo(
    () =>
      MINUTES.reduce(
        (best, m) => (Math.abs(m - minute) < Math.abs(best - minute) ? m : best),
        MINUTES[0]!,
      ),
    [minute],
  );
  const [localM, setLocalM] = useState(initialM);

  useEffect(() => {
    if (!visible) return;
    setLocalH(hour);
    setLocalM(initialM);
    Animated.parallel([
      Animated.timing(slide, {
        toValue: 0,
        duration: 520,
        useNativeDriver: true,
        easing: EASE_OUT_SPRING,
      }),
      Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, [visible, hour, initialM, slide, fade]);

  const close = () => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: SCREEN_H,
        duration: 460,
        useNativeDriver: true,
        easing: EASE_IN_CLOSE,
      }),
      Animated.timing(fade, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const done = () => {
    onChange(localH, localM);
    close();
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible onRequestClose={close}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: fade }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <Animated.View style={[ps.sheet, { transform: [{ translateY: slide }] }]}>
        <View style={ps.handle} />
        <View style={ps.header}>
          <Pressable onPress={close} hitSlop={12}>
            <Text allowFontScaling={false} style={ps.cancel}>
              İptal
            </Text>
          </Pressable>
          <Text allowFontScaling={false} style={ps.title}>
            {title}
          </Text>
          <Pressable onPress={done} hitSlop={12}>
            <Text allowFontScaling={false} style={[ps.done, { color: accent }]}>
              Tamam
            </Text>
          </Pressable>
        </View>
        <View style={ps.dualWheelRow}>
          <View style={{ flex: 1 }}>
            <WheelPicker
              values={HOURS}
              current={localH}
              formatValue={pad2}
              onChange={setLocalH}
              accent={accent}
            />
          </View>
          <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              allowFontScaling={false}
              style={{ fontSize: 28, fontWeight: '600', color: '#1C1C1E' }}
            >
              :
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <WheelPicker
              values={MINUTES}
              current={localM}
              formatValue={pad2}
              onChange={setLocalM}
              accent={accent}
            />
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DatePickerSheet (gün / ay / yıl)
// ─────────────────────────────────────────────────────────────────────────────

export function DatePickerSheet({
  visible,
  date,
  accent = ACCENT,
  title = 'Tarih',
  minYear,
  maxYear,
  onClose,
  onChange,
}: {
  visible: boolean;
  date: Date;
  accent?: string;
  title?: string;
  minYear?: number;
  maxYear?: number;
  onClose: () => void;
  onChange: (date: Date) => void;
}) {
  const slide = useRef(new Animated.Value(SCREEN_H)).current;
  const fade = useRef(new Animated.Value(0)).current;

  const today = new Date();
  const startYear = minYear ?? today.getFullYear() - 100;
  const endYear = maxYear ?? today.getFullYear() + 5;

  const YEARS = useMemo(() => {
    const arr: number[] = [];
    for (let y = startYear; y <= endYear; y++) arr.push(y);
    return arr;
  }, [startYear, endYear]);
  const MONTHS = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const [d, setD] = useState(date.getDate());
  const [m, setM] = useState(date.getMonth() + 1);
  const [y, setY] = useState(date.getFullYear());

  // Gün, seçilen ay/yıl'a göre dinamik
  const DAYS = useMemo(() => {
    const max = daysInMonth(y, m);
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [y, m]);

  useEffect(() => {
    // ay/yıl değişince gün taşmazsa düzelt
    const max = daysInMonth(y, m);
    if (d > max) setD(max);
  }, [y, m, d]);

  useEffect(() => {
    if (!visible) return;
    setD(date.getDate());
    setM(date.getMonth() + 1);
    setY(date.getFullYear());
    Animated.parallel([
      Animated.timing(slide, {
        toValue: 0,
        duration: 520,
        useNativeDriver: true,
        easing: EASE_OUT_SPRING,
      }),
      Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, [visible, date, slide, fade]);

  const close = () => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: SCREEN_H,
        duration: 460,
        useNativeDriver: true,
        easing: EASE_IN_CLOSE,
      }),
      Animated.timing(fade, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const done = () => {
    onChange(new Date(y, m - 1, d));
    close();
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible onRequestClose={close}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: fade }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <Animated.View style={[ps.sheet, { transform: [{ translateY: slide }] }]}>
        <View style={ps.handle} />
        <View style={ps.header}>
          <Pressable onPress={close} hitSlop={12}>
            <Text allowFontScaling={false} style={ps.cancel}>
              İptal
            </Text>
          </Pressable>
          <Text allowFontScaling={false} style={ps.title}>
            {title}
          </Text>
          <Pressable onPress={done} hitSlop={12}>
            <Text allowFontScaling={false} style={[ps.done, { color: accent }]}>
              Tamam
            </Text>
          </Pressable>
        </View>
        <View style={ps.tripleWheelRow}>
          <View style={{ flex: 0.8 }}>
            <WheelPicker
              values={DAYS}
              current={d}
              formatValue={(v) => String(v)}
              onChange={setD}
              accent={accent}
            />
          </View>
          <View style={{ flex: 1.3 }}>
            <WheelPicker
              values={MONTHS}
              current={m}
              formatValue={(v) => MONTHS_TR[v - 1] ?? ''}
              onChange={setM}
              accent={accent}
            />
          </View>
          <View style={{ flex: 1.2 }}>
            <WheelPicker
              values={YEARS}
              current={y}
              formatValue={(v) => String(v)}
              onChange={setY}
              accent={accent}
            />
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const ps = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D1D6',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  cancel: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  done: { fontSize: 15, fontWeight: '700' },
  title: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
  dualWheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  tripleWheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
});

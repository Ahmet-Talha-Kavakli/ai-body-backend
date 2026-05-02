import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { N, font } from '../theme';

const EASE = Easing.bezier(0.22, 1, 0.36, 1);

type Props = {
  label: string;
  consumed: number;
  goal: number;
  unit?: string;
  color?: string;
  trackColor?: string;
};

export function MacroBar({
  label,
  consumed,
  goal,
  unit = 'g',
  color = N.accent.primary,
  trackColor = N.bg.well,
}: Props) {
  const ratio = goal > 0 ? Math.min(consumed / goal, 1.2) : 0;

  const barAnim = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;

  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = countAnim.addListener(({ value }) => setShown(Math.round(value)));
    return () => countAnim.removeListener(id);
  }, [countAnim]);

  const prevRatio = useRef<number | null>(null);
  const prevConsumed = useRef<number | null>(null);

  useEffect(() => {
    if (prevRatio.current === ratio && prevConsumed.current === consumed) return;
    prevRatio.current = ratio;
    prevConsumed.current = consumed;

    Animated.parallel([
      Animated.timing(barAnim, {
        toValue: ratio,
        duration: 1800,
        easing: EASE,
        useNativeDriver: false,
      }),
      Animated.timing(countAnim, {
        toValue: consumed,
        duration: 1800,
        easing: EASE,
        useNativeDriver: false,
      }),
    ]).start();
  }, [ratio, consumed, barAnim, countAnim]);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1.2],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.label}>{label}</Text>
        <Text style={s.values}>
          <Text style={s.consumed}>{shown}</Text>
          <Text style={s.goal}>{` / ${goal} ${unit}`}</Text>
        </Text>
      </View>
      <View style={[s.track, { backgroundColor: trackColor }]}>
        <Animated.View style={[s.fill, { width: barWidth, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { width: '100%' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 7,
  },
  label: { fontSize: 13, color: N.text.secondary, fontFamily: font.semibold, letterSpacing: -0.1 },
  values: { fontSize: 13, fontVariant: ['tabular-nums'], fontFamily: font.regular },
  consumed: { fontFamily: font.bold, color: N.text.primary },
  goal: { color: N.text.tertiary, fontFamily: font.medium },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});

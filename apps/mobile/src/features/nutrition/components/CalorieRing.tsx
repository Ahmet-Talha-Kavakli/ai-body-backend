import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { N, font } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const EASE = Easing.bezier(0.22, 1, 0.36, 1);

type Props = {
  consumed: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
};

export function CalorieRing({ consumed, goal, size = 200, strokeWidth = 16 }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const safeConsumed = Number(consumed) || 0;
  const safeGoal = Number(goal) || 1;
  const ratio = Math.min(safeConsumed / safeGoal, 1.0);

  // Animated values — başlangıç her zaman 0, ilk render'da 0→ratio animasyonu
  const ringAnim = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;

  // Sayaç için shown state
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = countAnim.addListener(({ value }) => setShown(Math.round(value)));
    return () => countAnim.removeListener(id);
  }, [countAnim]);

  // Önceki değerleri tut — aynı değerde tekrar animate etme
  const prevRatio = useRef<number | null>(null);
  const prevConsumed = useRef<number | null>(null);

  useEffect(() => {
    if (prevRatio.current === ratio && prevConsumed.current === safeConsumed) return;

    prevRatio.current = ratio;
    prevConsumed.current = safeConsumed;

    Animated.parallel([
      Animated.timing(ringAnim, {
        toValue: ratio,
        duration: 1800,
        easing: EASE,
        useNativeDriver: false,
      }),
      Animated.timing(countAnim, {
        toValue: safeConsumed,
        duration: 1800,
        easing: EASE,
        useNativeDriver: false,
      }),
    ]).start();
  }, [ratio, safeConsumed, ringAnim, countAnim]);

  const isOver = safeConsumed > safeGoal;

  const strokeDashoffset = ringAnim.interpolate({
    inputRange: [0, 1.0],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  const strokeColor = ringAnim.interpolate({
    inputRange: [0, 0.25, 0.6, 0.95, 1.0],
    outputRange: [
      N.semantic.danger,
      N.semantic.warning,
      '#FFCC00',
      N.semantic.success,
      isOver ? N.semantic.danger : N.semantic.success,
    ],
    extrapolate: 'clamp',
  }) as any;

  const remaining = Math.max(safeGoal - safeConsumed, 0);
  const overshoot = Math.max(safeConsumed - safeGoal, 0);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={N.ring.track}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Fill */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="butt"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={{ alignItems: 'center' }}>
        <Text style={s.bigNumber}>{shown.toLocaleString('tr-TR')}</Text>
        <Text style={s.unit}>kcal yendi</Text>
        <View style={s.hr} />
        {isOver ? (
          <Text style={s.sub}>
            <Text style={{ color: N.semantic.danger, fontFamily: font.bold }}>
              +{Math.round(overshoot).toLocaleString('tr-TR')}
            </Text>
            <Text style={{ color: N.text.tertiary }}> aşıldı</Text>
          </Text>
        ) : (
          <Text style={s.sub}>
            <Text style={{ color: N.text.primary, fontFamily: font.bold }}>
              {remaining.toLocaleString('tr-TR')}
            </Text>
            <Text style={{ color: N.text.tertiary }}> kaldı</Text>
          </Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bigNumber: {
    fontSize: 44,
    fontFamily: font.extrabold,
    color: N.text.primary,
    letterSpacing: -1.4,
    fontVariant: ['tabular-nums'],
    lineHeight: 50,
  },
  unit: {
    fontSize: 11,
    color: N.text.tertiary,
    marginTop: 0,
    fontFamily: font.medium,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  hr: { width: 32, height: 1, backgroundColor: N.border.hairline, marginVertical: 10 },
  sub: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.1,
    fontFamily: font.regular,
  },
});

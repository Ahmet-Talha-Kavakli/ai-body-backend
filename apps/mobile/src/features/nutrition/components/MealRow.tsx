import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { N, font } from '../theme';
import type { MealLog, MealType } from '../api/types';

const EASE_SMOOTH = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_MICRO = Easing.bezier(0.4, 0, 0.2, 1);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const LABEL: Record<MealType, { tr: string; emoji: string }> = {
  breakfast: { tr: 'Kahvaltı', emoji: '☕' },
  lunch: { tr: 'Öğle', emoji: '🍝' },
  dinner: { tr: 'Akşam', emoji: '🥘' },
  snack: { tr: 'Atıştırma', emoji: '🍎' },
};

type Props = {
  mealType: MealType;
  meals: MealLog[];
  goalKcal?: number;
  active?: boolean;
  onAdd: () => void;
  onPress: () => void;
};

const ICON = 48;
const ADD = 36;
const RING_W = 3;

export function MealRow({ mealType, meals, goalKcal, onAdd, onPress }: Props) {
  const { tr, emoji } = LABEL[mealType];
  const goal = goalKcal ?? 0;

  const totalKcal = meals.reduce((s, m) => s + m.totalCalories, 0);
  const itemCount = meals.reduce((s, m) => s + (Array.isArray(m.items) ? m.items.length : 0), 0);
  const isEmpty = meals.length === 0;
  const aiCount = meals.filter((m) => m.aiAnalyzed).length;

  const r = (ICON - RING_W) / 2;
  const circ = 2 * Math.PI * r;
  const isOver = goal > 0 && totalKcal > goal;
  const ratio = goal > 0 ? Math.min(totalKcal / goal, 1.0) : 0;

  const ringAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(ringAnim, {
      toValue: ratio,
      duration: 1100,
      easing: EASE_SMOOTH,
      useNativeDriver: false,
    }).start();
  }, [ratio, ringAnim]);

  const offset = ringAnim.interpolate({
    inputRange: [0, 1.0],
    outputRange: [circ, 0],
    extrapolate: 'clamp',
  });
  const ringColor = ringAnim.interpolate({
    inputRange: [0, 0.5, 0.95, 1.0],
    outputRange: [
      N.semantic.danger,
      N.semantic.warning,
      N.semantic.success,
      isOver ? N.semantic.danger : N.semantic.success,
    ],
    extrapolate: 'clamp',
  }) as any;

  const firstItem = meals[0]?.items?.[0];
  const moreCount = itemCount > 1 ? itemCount - 1 : 0;
  const summary = firstItem
    ? moreCount > 0
      ? `${firstItem.name} +${moreCount}`
      : firstItem.name
    : null;

  // Press feedback for both press areas
  const pressScale = useRef(new Animated.Value(1)).current;
  const addScale = useRef(new Animated.Value(1)).current;

  const animateScale = (anim: Animated.Value, to: number) =>
    Animated.timing(anim, {
      toValue: to,
      duration: to === 1 ? 100 : 120,
      easing: EASE_MICRO,
      useNativeDriver: true,
    }).start();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        onPressIn={() => animateScale(pressScale, 0.985)}
        onPressOut={() => animateScale(pressScale, 1)}
        style={styles.pressArea}
      >
        <Animated.View style={[styles.pressInner, { transform: [{ scale: pressScale }] }]}>
          <View style={styles.iconCol}>
            {isEmpty ? (
              <View style={styles.iconEmpty}>
                <Text style={styles.emoji}>{emoji}</Text>
              </View>
            ) : (
              <View style={styles.iconFilled}>
                <Svg width={ICON} height={ICON} style={StyleSheet.absoluteFill}>
                  <Circle
                    cx={ICON / 2}
                    cy={ICON / 2}
                    r={r}
                    stroke={N.bg.well}
                    strokeWidth={RING_W}
                    fill="transparent"
                  />
                  <AnimatedCircle
                    cx={ICON / 2}
                    cy={ICON / 2}
                    r={r}
                    stroke={ringColor}
                    strokeWidth={RING_W}
                    fill="transparent"
                    strokeLinecap="butt"
                    strokeDasharray={`${circ} ${circ}`}
                    strokeDashoffset={offset}
                    rotation="-90"
                    origin={`${ICON / 2}, ${ICON / 2}`}
                  />
                </Svg>
                <Text style={[styles.emoji, { fontSize: 22 }]}>{emoji}</Text>
              </View>
            )}
          </View>

          <View style={styles.middleCol}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {tr}
              </Text>
              {aiCount > 0 && (
                <View style={styles.aiBadge}>
                  <Ionicons name="sparkles" size={9} color={N.ai.fg} />
                  <Text style={styles.aiText}>AI</Text>
                </View>
              )}
            </View>
            <Text style={styles.kcal} numberOfLines={1}>
              <Text style={styles.kcalNum}>{Math.round(totalKcal)}</Text>
              <Text style={styles.kcalGoal}> / {goal} kcal</Text>
            </Text>
            {summary ? (
              <Text style={styles.summary} numberOfLines={1}>
                {summary}
              </Text>
            ) : (
              <Text
                style={[styles.summary, { fontStyle: 'italic', color: N.text.quaternary }]}
                numberOfLines={1}
              >
                Henüz eklenmedi
              </Text>
            )}
          </View>
        </Animated.View>
      </Pressable>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onAdd();
        }}
        onPressIn={() => animateScale(addScale, 0.92)}
        onPressOut={() => animateScale(addScale, 1)}
        hitSlop={14}
        style={styles.addPressable}
      >
        <Animated.View style={[styles.addBtn, { transform: [{ scale: addScale }] }]}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 72,
    backgroundColor: 'transparent',
  },
  pressArea: {
    flex: 1,
    minWidth: 0,
  },
  pressInner: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  iconCol: {
    width: ICON,
    height: ICON,
    marginRight: 12,
  },
  iconEmpty: {
    width: ICON,
    height: ICON,
    borderRadius: ICON / 2,
    backgroundColor: '#F3F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFilled: {
    width: ICON,
    height: ICON,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 24, lineHeight: 28, fontFamily: font.regular },

  middleCol: { flex: 1, minWidth: 0, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 16, fontFamily: font.bold, color: N.text.primary, letterSpacing: -0.3 },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    backgroundColor: N.ai.bg,
    marginLeft: 6,
  },
  aiText: { fontSize: 9, fontFamily: font.bold, color: N.ai.fg, letterSpacing: 0.3 },
  kcal: { fontSize: 13, marginTop: 2, fontVariant: ['tabular-nums'], fontFamily: font.regular },
  kcalNum: { color: N.text.secondary, fontFamily: font.semibold },
  kcalGoal: { color: N.text.tertiary, fontFamily: font.medium },
  summary: { fontSize: 12, color: N.text.tertiary, marginTop: 1, fontFamily: font.regular },

  addPressable: {
    marginLeft: 8,
    width: ADD,
    height: ADD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: ADD,
    height: ADD,
    borderRadius: ADD / 2,
    backgroundColor: N.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});

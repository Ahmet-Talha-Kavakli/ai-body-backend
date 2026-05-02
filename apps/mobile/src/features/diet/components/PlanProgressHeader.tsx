import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { font, palette as N } from '../../nutrition/theme';
import type { ActiveDietPlan } from '../api/types';

type Props = { plan: ActiveDietPlan };

export function PlanProgressHeader({ plan }: Props) {
  const progAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progAnim, {
      toValue: plan.progress.pct / 100,
      duration: 1100,
      useNativeDriver: false,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    }).start();
  }, [plan.progress.pct]);

  const width = progAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const color = progAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['#FF3B30', '#FF9500', '#FFCC00', '#8CD64A', '#30D158'],
  });

  return (
    <View style={[styles.container, { backgroundColor: plan.accentColor + '15' }]}>
      <View style={styles.top}>
        <Text style={styles.name} numberOfLines={1}>
          {plan.name}
        </Text>
        <Text style={[styles.day, { color: plan.accentColor }]}>
          Gün {plan.progress.dayNumber}/{plan.progress.totalDays}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width, backgroundColor: color }]} />
      </View>
      <View style={styles.macroRow}>
        <Text style={styles.macroItem}>{plan.dailyCalories} kal</Text>
        <Text style={styles.macroItem}>P {plan.proteinG}g</Text>
        <Text style={styles.macroItem}>K {plan.carbsG}g</Text>
        <Text style={styles.macroItem}>Y {plan.fatG}g</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, marginHorizontal: 16, marginBottom: 12, padding: 14 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: { fontFamily: font.bold, fontSize: 15, color: N.text.primary, flex: 1, marginRight: 8 },
  day: { fontFamily: font.semibold, fontSize: 13 },
  barTrack: {
    height: 6,
    backgroundColor: N.border.hairline,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: { height: 6, borderRadius: 3 },
  macroRow: { flexDirection: 'row', gap: 12 },
  macroItem: { fontFamily: font.medium, fontSize: 11, color: N.text.tertiary },
});

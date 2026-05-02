import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  unit: string;
  progress: number; // 0-1
  color: string;
  onPress?: () => void;
}

export function StatCard({ icon, label, value, unit, progress, color, onPress }: StatCardProps) {
  const bar = useRef(new Animated.Value(0)).current;
  const sc = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(bar, {
      toValue: Math.min(Math.max(progress, 0), 1),
      duration: 900,
      delay: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(sc, {
          toValue: 0.95,
          useNativeDriver: true,
          speed: 50,
          bounciness: 0,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(sc, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start()
      }
      onPress={onPress}
    >
      <Animated.View style={[s.card, { transform: [{ scale: sc }] }]}>
        <View style={[s.chip, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon as never} size={15} color={color} />
        </View>
        <View style={s.valRow}>
          <Text style={[s.val, { color }]}>{value}</Text>
          <Text style={s.unit}> {unit}</Text>
        </View>
        <Text style={s.label}>{label}</Text>
        <View style={s.barBg}>
          <Animated.View
            style={[
              s.barFill,
              {
                backgroundColor: color,
                width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              },
            ]}
          />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    width: 148,
    height: 148,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(84,84,88,0.65)',
    justifyContent: 'space-between',
  },
  chip: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  valRow: { flexDirection: 'row', alignItems: 'baseline' },
  val: { fontSize: 26, fontWeight: '800', letterSpacing: -1 },
  unit: { color: 'rgba(235,235,245,0.3)', fontSize: 12 },
  label: { color: 'rgba(235,235,245,0.6)', fontSize: 12, fontWeight: '600' },
  barBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: { height: 3, borderRadius: 2 },
});

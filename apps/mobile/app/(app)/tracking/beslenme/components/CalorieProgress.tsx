import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const SIZE = 200;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  current: number;
  goal: number;
}

export function CalorieProgress({ current, goal }: Props) {
  const progress = Math.min(current / goal, 1);
  const anim = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;
  const prevProgress = useRef(0);
  const prevCount = useRef(0);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = countAnim.addListener(({ value }) => setShown(Math.round(value)));
    return () => countAnim.removeListener(id);
  }, []);

  useEffect(() => {
    if (prevProgress.current === progress && prevCount.current === current) return;
    prevProgress.current = progress;
    prevCount.current = current;

    Animated.timing(anim, {
      toValue: progress,
      duration: 1100,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start();

    Animated.timing(countAnim, {
      toValue: current,
      duration: 1100,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start();
  }, [current, progress]);

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRC, 0],
  });

  const remaining = goal - current;

  return (
    <View style={st.wrap}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke="#F0F0F5"
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
        />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke="#FF9F0A"
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>

      <View style={st.center}>
        <Text style={st.value} allowFontScaling={false}>
          {shown.toLocaleString()}
        </Text>
        <Text style={st.unit} allowFontScaling={false}>
          kcal
        </Text>
      </View>

      <View style={st.stats}>
        <View style={st.statItem}>
          <Text style={st.statValue} allowFontScaling={false}>
            {goal.toLocaleString()}
          </Text>
          <Text style={st.statLabel} allowFontScaling={false}>
            Hedef
          </Text>
        </View>
        <View style={st.statDivider} />
        <View style={st.statItem}>
          <Text style={[st.statValue, remaining < 0 && st.over]} allowFontScaling={false}>
            {Math.abs(remaining).toLocaleString()}
          </Text>
          <Text style={st.statLabel} allowFontScaling={false}>
            {remaining >= 0 ? 'Kalan' : 'Fazla'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  center: {
    position: 'absolute',
    top: SIZE / 2 - 30,
    alignItems: 'center',
  },
  value: {
    fontSize: 38,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -1.5,
  },
  unit: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: -4,
    letterSpacing: 0.2,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    gap: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  over: { color: '#FF3B30' },
  statLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: '#8E8E93',
    letterSpacing: 0.1,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F0F0F5',
  },
});

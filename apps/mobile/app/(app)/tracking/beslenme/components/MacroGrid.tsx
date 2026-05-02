import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const MACROS = [
  { key: 'protein', label: 'Protein', unit: 'g', color: '#FF6B35', bg: '#FFF3EE' },
  { key: 'carbs', label: 'Karb', unit: 'g', color: '#FF9F0A', bg: '#FFF8EC' },
  { key: 'fat', label: 'Yağ', unit: 'g', color: '#30B0C7', bg: '#EAF7FA' },
  { key: 'fiber', label: 'Lif', unit: 'g', color: '#34C759', bg: '#EDFAF1' },
  { key: 'sugar', label: 'Şeker', unit: 'g', color: '#AF52DE', bg: '#F5EEFF' },
];

function MacroRing({
  current,
  goal,
  color,
  bg,
}: {
  current: number;
  goal: number;
  color: string;
  bg: string;
}) {
  const SIZE = 64;
  const STROKE = 5;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const progress = Math.min(current / goal, 1);

  const anim = useRef(new Animated.Value(0)).current;
  const prevProg = useRef(0);

  useEffect(() => {
    if (prevProg.current === progress) return;
    prevProg.current = progress;
    Animated.timing(anim, {
      toValue: progress,
      duration: 1100,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRC, 0],
  });

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SIZE} height={SIZE}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={bg} strokeWidth={STROKE} fill="none" />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
    </View>
  );
}

function MacroCard({
  label,
  unit,
  color,
  bg,
  current,
  goal,
}: {
  label: string;
  unit: string;
  color: string;
  bg: string;
  current: number;
  goal: number;
}) {
  const countAnim = useRef(new Animated.Value(0)).current;
  const prevVal = useRef(0);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = countAnim.addListener(({ value }) => setShown(Math.round(value)));
    return () => countAnim.removeListener(id);
  }, []);

  useEffect(() => {
    if (prevVal.current === current) return;
    prevVal.current = current;
    Animated.timing(countAnim, {
      toValue: current,
      duration: 1100,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start();
  }, [current]);

  return (
    <View style={[st.card, { backgroundColor: '#FFFFFF' }]}>
      <MacroRing current={current} goal={goal} color={color} bg={bg} />
      <View style={st.cardInfo}>
        <Text style={[st.cardValue, { color }]} allowFontScaling={false}>
          {shown}
          {unit}
        </Text>
        <Text style={st.cardLabel} allowFontScaling={false}>
          {label}
        </Text>
        <Text style={st.cardGoal} allowFontScaling={false}>
          /{goal}
          {unit}
        </Text>
      </View>
    </View>
  );
}

interface MacroGridProps {
  data: {
    protein: { current: number; goal: number };
    carbs: { current: number; goal: number };
    fat: { current: number; goal: number };
    fiber: { current: number; goal: number };
    sugar: { current: number; goal: number };
  };
}

export function MacroGrid({ data }: MacroGridProps) {
  return (
    <View style={st.grid}>
      {MACROS.map((m) => (
        <MacroCard
          key={m.key}
          label={m.label}
          unit={m.unit}
          color={m.color}
          bg={m.bg}
          current={data[m.key as keyof typeof data].current}
          goal={data[m.key as keyof typeof data].goal}
        />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  cardInfo: { flex: 1 },
  cardValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 1,
  },
  cardGoal: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
  },
});

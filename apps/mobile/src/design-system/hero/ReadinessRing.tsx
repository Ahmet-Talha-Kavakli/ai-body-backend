import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedProps, withSpring } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { DSText } from '../primitives/Text';
import { useTheme } from '../../providers/ThemeProvider';
import { spring } from '../tokens/motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ReadinessRingProps = {
  score: number; // 0-100
  size?: number;
};

function scoreToColor(score: number, colors: { success: string; warning: string; danger: string }) {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.warning;
  return colors.danger;
}

export function ReadinessRing({ score, size = 120 }: ReadinessRingProps) {
  const { colors } = useTheme();
  const strokeWidth = 10;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(score / 100, spring.gentle);
  }, [score, progress]);

  const animProps = useAnimatedProps(() => {
    'worklet';
    return { strokeDashoffset: circumference * (1 - progress.value) };
  });

  const strokeColor = scoreToColor(score, colors);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.bg.surfaceElevated}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <DSText variant="title2">{String(score)}</DSText>
    </View>
  );
}

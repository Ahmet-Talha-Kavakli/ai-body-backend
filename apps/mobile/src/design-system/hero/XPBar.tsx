import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { DSText } from '../primitives/Text';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';
import { spring } from '../tokens/motion';

type XPBarProps = {
  currentXP: number;
  level: number;
};

function xpForLevel(level: number) {
  return level * level * 100;
}

export function XPBar({ currentXP, level }: XPBarProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);
  const nextLevelXP = xpForLevel(level + 1);
  const currentLevelXP = xpForLevel(level);
  const ratio = Math.min((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP), 1);

  useEffect(() => {
    progress.value = withSpring(ratio, spring.smooth);
  }, [ratio, progress]);

  const barStyle = useAnimatedStyle(() => {
    'worklet';
    return { width: `${progress.value * 100}%` };
  });

  return (
    <View style={{ gap: spacing[2] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <DSText variant="caption1" color="secondary">
          Seviye
        </DSText>
        <DSText variant="caption1" color="secondary">
          {String(level)}
        </DSText>
      </View>
      <View
        style={{
          height: 6,
          backgroundColor: colors.bg.surfaceElevated,
          borderRadius: radius.full,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            barStyle,
            {
              height: '100%',
              backgroundColor: colors.accent.primary,
              borderRadius: radius.full,
            },
          ]}
        />
      </View>
    </View>
  );
}

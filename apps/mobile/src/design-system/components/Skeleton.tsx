import React, { useEffect } from 'react';
import { ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';
import { radius } from '../tokens/radius';

type SkeletonProps = ViewProps & {
  width: number | `${number}%`;
  height: number;
  rounded?: keyof typeof radius;
};

export function Skeleton({ width, height, rounded = 'md', testID, style }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => {
    'worklet';
    return { opacity: opacity.value };
  });

  return (
    <Animated.View
      testID={testID}
      style={[
        animStyle,
        {
          width,
          height,
          backgroundColor: colors.bg.surfaceHover,
          borderRadius: radius[rounded],
        },
        style,
      ]}
    />
  );
}

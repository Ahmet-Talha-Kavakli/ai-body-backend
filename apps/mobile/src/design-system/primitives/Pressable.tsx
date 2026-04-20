import React from 'react';
import { Pressable as RNPressable, PressableProps, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { spring } from '../tokens/motion';

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

type DSPressableProps = PressableProps & {
  haptic?: 'light' | 'medium' | 'heavy' | 'none';
  scaleOnPress?: boolean;
  children: React.ReactNode;
};

export function DSPressable({
  haptic = 'light',
  scaleOnPress = true,
  onPress,
  children,
  style,
  ...rest
}: DSPressableProps) {
  const scale = useSharedValue(1);

  // 'worklet' directive required for Reanimated 4 (~4.1.7)
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ scale: scale.value }] };
  });

  function handlePressIn() {
    if (scaleOnPress) {
      // eslint-disable-next-line react-hooks/immutability
      scale.value = withSpring(0.96, spring.snappy);
    }
  }

  function handlePressOut() {
    if (scaleOnPress) {
      // eslint-disable-next-line react-hooks/immutability
      scale.value = withSpring(1, spring.snappy);
    }
  }

  function handlePress(e: Parameters<NonNullable<PressableProps['onPress']>>[0]) {
    if (haptic !== 'none') {
      const feedbackType = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      }[haptic];
      Haptics.impactAsync(feedbackType);
    }
    onPress?.(e);
  }

  return (
    <AnimatedPressable
      style={[animatedStyle, style as ViewStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

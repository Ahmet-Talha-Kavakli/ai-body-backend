// Reanimated 4 mock — replaces require('react-native-reanimated/mock') which fails in jest
// because it tries to load native worklets (NativeWorklets.native.ts)
const React = require('react');

const useSharedValue = (initial: unknown) => ({ value: initial });
const useAnimatedStyle = (fn: () => unknown) => fn();
const withSpring = (value: unknown) => value;
const withTiming = (value: unknown) => value;
const withDelay = (_delay: unknown, animation: unknown) => animation;
const withSequence = (..._animations: unknown[]) => _animations[_animations.length - 1];
const withRepeat = (animation: unknown) => animation;
const runOnJS = (fn: (...args: unknown[]) => unknown) => fn;
const runOnUI = (fn: (...args: unknown[]) => unknown) => fn;
const interpolate = (value: unknown) => value;
const Extrapolation = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' };
const useAnimatedProps = (fn: () => unknown) => fn();
const cancelAnimation = (_sharedValue: unknown) => {};
const useAnimatedScrollHandler = () => ({});
const useAnimatedRef = () => ({ current: null });
const useScrollViewOffset = () => ({ value: 0 });
const useDerivedValue = (fn: () => unknown) => ({ value: fn() });
const useAnimatedReaction = () => {};

function createAnimatedComponent(Component: React.ComponentType<unknown>) {
  const Animated = React.forwardRef((props: unknown, _ref: unknown) =>
    React.createElement(Component as React.ElementType, props as object),
  );
  Animated.displayName = `Animated(${(Component as { displayName?: string; name?: string }).displayName ?? (Component as { name?: string }).name ?? 'Component'})`;
  return Animated;
}

const Animated = {
  View: require('react-native').View,
  Text: require('react-native').Text,
  Image: require('react-native').Image,
  ScrollView: require('react-native').ScrollView,
  FlatList: require('react-native').FlatList,
  createAnimatedComponent,
};

module.exports = {
  default: Animated,
  ...Animated,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  runOnJS,
  runOnUI,
  interpolate,
  Extrapolation,
  useAnimatedProps,
  cancelAnimation,
  useAnimatedScrollHandler,
  useAnimatedRef,
  useScrollViewOffset,
  useDerivedValue,
  useAnimatedReaction,
  createAnimatedComponent,
};

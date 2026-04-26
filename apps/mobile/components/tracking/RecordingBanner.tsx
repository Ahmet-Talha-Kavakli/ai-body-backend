import React, { useEffect, useRef, useState } from 'react';
import { Text, Pressable, Animated, Easing, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getActiveSessionId } from '../../src/lib/tracking/backgroundTask';

const REC_RED = '#FF3B30';
const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);

export function RecordingBanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Animated entrance/exit
  const slideY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Pulse for the rec dot
  const pulse = useRef(new Animated.Value(0)).current;

  // Poll every 2s while mounted
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const id = await getActiveSessionId();
      if (!cancelled) setActiveId(id);
    };
    tick();
    const intervalId = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  // Animate banner in/out when activeId toggles
  useEffect(() => {
    if (activeId) {
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: 0,
          duration: 480,
          easing: EASE_SPRING,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 380,
          easing: EASE_SPRING,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: -80,
          duration: 320,
          easing: EASE_CLOSE,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 280,
          easing: EASE_CLOSE,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeId, opacity, slideY]);

  // Pulse animation while active
  useEffect(() => {
    if (!activeId) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 600,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [activeId, pulse]);

  if (!activeId) return null;

  const dotScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const dotOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { top: insets.top + 8, opacity, transform: [{ translateY: slideY }] }]}
    >
      <Pressable
        onPress={() => router.push('/(app)/tracking/rota-takip?resume=1')}
        style={styles.pill}
        accessibilityRole="button"
        accessibilityLabel="Antrenman devam ediyor, devam et"
      >
        <Animated.View
          style={[styles.dot, { transform: [{ scale: dotScale }], opacity: dotOpacity }]}
        />
        <Text style={styles.txt}>Antrenman devam ediyor</Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color="#fff"
          style={{ marginLeft: 4, opacity: 0.7 }}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 14, right: 14, zIndex: 50 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,10,20,0.92)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: REC_RED },
  txt: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.1,
    flex: 1,
  },
});

/**
 * WelcomeOverlay — Apple tarzı hoşgeldin ekranı.
 *
 * Loading bittikten sonra ~1.8sn boyunca kullanıcıyı selamlayan overlay.
 * Tam ekran blur arka plan, ortada büyük "Hoş geldin, [İsim]" yazısı.
 *
 * Animasyon (Apple-grade):
 *   - Giriş: fade + scale (0.94 → 1) + subtle Y slide
 *   - Çıkış: fade + scale (1 → 1.02) + Y slide
 *   - Easing: APPLE_EASE_OUT (0.32, 0.72, 0, 1)
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';

const { width: SW, height: SH } = Dimensions.get('window');

const APPLE_EASE_OUT = Easing.bezier(0.32, 0.72, 0, 1);
const APPLE_EASE_IN = Easing.bezier(0.42, 0, 1, 1);

interface Props {
  visible: boolean;
  /** İlk açılış: kullanıcı ismi. Tarih değişiminde: tarih string */
  title: string;
  /** Üst etiket — "Hoş geldin," veya "Tarihe gidiliyor" gibi */
  subtitle?: string;
}

export function WelcomeOverlay({ visible, title, subtitle = 'Hoş geldin,' }: Props) {
  const op = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const ty = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (visible) {
      op.setValue(0);
      scale.setValue(0.94);
      ty.setValue(12);
      Animated.parallel([
        Animated.timing(op, {
          toValue: 1,
          duration: 480,
          useNativeDriver: true,
          easing: APPLE_EASE_OUT,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 24,
        }),
        Animated.timing(ty, {
          toValue: 0,
          duration: 520,
          useNativeDriver: true,
          easing: APPLE_EASE_OUT,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(op, {
          toValue: 0,
          duration: 360,
          useNativeDriver: true,
          easing: APPLE_EASE_IN,
        }),
        Animated.timing(scale, {
          toValue: 1.02,
          duration: 420,
          useNativeDriver: true,
          easing: APPLE_EASE_IN,
        }),
        Animated.timing(ty, {
          toValue: -8,
          duration: 420,
          useNativeDriver: true,
          easing: APPLE_EASE_IN,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFill, s.root, { opacity: op }]}
    >
      <BlurView intensity={32} tint="systemChromeMaterial" style={StyleSheet.absoluteFill} />
      <Animated.View
        style={[
          s.content,
          {
            transform: [{ scale }, { translateY: ty }],
          },
        ]}
      >
        <Text style={s.greeting}>{subtitle}</Text>
        <Text style={s.name}>{title}</Text>
        <View style={s.dot} />
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '500',
    color: 'rgba(28,28,30,0.7)',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  name: {
    fontSize: 44,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -1.6,
    textAlign: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#32ADE6',
    marginTop: 20,
    shadowColor: '#32ADE6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
});

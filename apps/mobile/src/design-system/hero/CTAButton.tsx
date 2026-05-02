import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CTAButtonProps {
  label: string;
  subtitle?: string;
  icon?: string;
  color?: string;
  onPress?: () => void;
}

export function CTAButton({
  label,
  subtitle,
  icon = 'flash',
  color = '#30D158',
  onPress,
}: CTAButtonProps) {
  const sc = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(sc, {
          toValue: 0.97,
          useNativeDriver: true,
          speed: 50,
          bounciness: 0,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(sc, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 6 }).start()
      }
      onPress={onPress}
    >
      <Animated.View
        style={[s.card, { backgroundColor: color, shadowColor: color, transform: [{ scale: sc }] }]}
      >
        <View style={s.glow} pointerEvents="none" />
        <View style={s.inner}>
          <View style={s.iconWrap}>
            <Ionicons name={icon as never} size={22} color="#000" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>{label}</Text>
            {subtitle && <Text style={s.sub}>{subtitle}</Text>}
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(0,0,0,0.4)" />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: '#000', fontSize: 17, fontWeight: '800', letterSpacing: -0.4 },
  sub: { color: 'rgba(0,0,0,0.55)', fontSize: 13, fontWeight: '500', marginTop: 1 },
});

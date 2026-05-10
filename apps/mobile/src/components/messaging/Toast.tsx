/**
 * V4.6 M81 — Toast (üstte slide-down, 2sn auto-close)
 */

import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

interface Props {
  message: string | null;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: Props) {
  const translateY = React.useRef(new Animated.Value(-60)).current;

  const dismissRef = React.useRef(onDismiss);
  React.useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!message) return;
    Animated.spring(translateY, {
      toValue: 50,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
    const t = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -60,
        duration: 220,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) dismissRef.current();
      });
    }, 2000);
    return () => clearTimeout(t);
  }, [message, translateY]);

  if (!message) return null;
  return (
    <Animated.View style={[styles.toast, { transform: [{ translateY }] }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 20,
    zIndex: 100,
  },
  text: { color: '#FFFFFF', fontSize: 14 },
});

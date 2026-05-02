/**
 * WheelPicker — iOS-tarzı wheel picker. ScrollView snap + center highlight band + üst/alt fade.
 *
 * - paddingVertical = (height - itemHeight*1) / 2 → ortada highlight'a snap
 * - snapToInterval = itemHeight
 * - decelerationRate fast → momentum sönük, doğal "wheel" hissi
 * - onMomentumEnd ile en yakın item index hesaplanır → onChange
 * - LinearGradient maskler üst/alt → kenar item'lar fade out
 *
 * iOS öncelikli; Android'de `scrollEventThrottle` aynı çalışır.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 5; // ortada 1 + üst 2 + alt 2
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export interface WheelPickerProps {
  values: number[];
  current: number;
  formatValue?: (v: number) => string;
  onChange: (v: number) => void;
  unitLabel?: string; // "ml", "%", "mg"
  unitPosition?: 'before' | 'after'; // % işareti Türkçede sayıdan ÖNCE gelir
  hint?: (v: number) => string | null; // her değerin yanında küçük açıklama
  accent?: string;
}

export function WheelPicker({
  values,
  current,
  formatValue,
  onChange,
  unitLabel,
  unitPosition = 'after',
  hint,
  accent = '#32ADE6',
}: WheelPickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, values.indexOf(current)));

  // İlk açılışta seçili değere snap
  useEffect(() => {
    const idx = values.indexOf(current);
    if (idx < 0) return;
    setActiveIndex(idx);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: false });
      scrollY.setValue(idx * ITEM_HEIGHT);
    });
  }, [current, values]);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    const next = values[clamped];
    if (clamped !== activeIndex && next !== undefined) {
      setActiveIndex(clamped);
      onChange(next);
    }
    // Snap düzelt — bazen browser/native float bırakır
    scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
  };

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
      }),
    [scrollY],
  );

  return (
    <View style={st.wrap}>
      {/* Highlight band — ortada sabit */}
      <View pointerEvents="none" style={st.highlightBand} />

      <Animated.ScrollView
        ref={scrollRef as any}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate={Platform.OS === 'ios' ? 'fast' : 0.92}
        onMomentumScrollEnd={handleMomentumEnd}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
        contentContainerStyle={{
          paddingTop: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
          paddingBottom: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
        }}
        style={{ height: PICKER_HEIGHT }}
      >
        {values.map((v, i) => {
          // Item'ın merkezden uzaklığı — opacity ve scale interpolasyonu için
          const distance = scrollY.interpolate({
            inputRange: [
              (i - 2) * ITEM_HEIGHT,
              (i - 1) * ITEM_HEIGHT,
              i * ITEM_HEIGHT,
              (i + 1) * ITEM_HEIGHT,
              (i + 2) * ITEM_HEIGHT,
            ],
            outputRange: [0.35, 0.55, 1, 0.55, 0.35],
            extrapolate: 'clamp',
          });
          const scale = scrollY.interpolate({
            inputRange: [(i - 1) * ITEM_HEIGHT, i * ITEM_HEIGHT, (i + 1) * ITEM_HEIGHT],
            outputRange: [0.78, 1.18, 0.78],
            extrapolate: 'clamp',
          });

          const isCenter = i === activeIndex;
          const display = formatValue ? formatValue(v) : `${v}`;
          const unit = unitLabel ? <Text style={st.unitText}>{unitLabel}</Text> : null;
          const hintText = hint?.(v);

          return (
            <Animated.View
              key={`${v}-${i}`}
              style={[st.item, { opacity: distance, transform: [{ scale }] }]}
            >
              <View style={st.itemRow}>
                <Text
                  style={[st.itemText, isCenter && { color: accent, fontWeight: '700' }]}
                  numberOfLines={1}
                >
                  {unitPosition === 'before' && unit}
                  {display}
                  {unitPosition === 'after' && <Text style={st.unitText}> {unitLabel}</Text>}
                </Text>
                {hintText ? (
                  <Text
                    style={[st.hintText, isCenter && { color: accent, opacity: 0.75 }]}
                    numberOfLines={1}
                  >
                    {hintText}
                  </Text>
                ) : null}
              </View>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      {/* Üst fade */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
        style={[st.fade, { top: 0 }]}
      />
      {/* Alt fade */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
        style={[st.fade, { bottom: 0 }]}
      />
    </View>
  );
}

const st = StyleSheet.create({
  wrap: {
    height: PICKER_HEIGHT,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  highlightBand: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
    height: ITEM_HEIGHT,
    borderRadius: 12,
    backgroundColor: 'rgba(50, 173, 230, 0.08)',
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    paddingHorizontal: 24,
    maxWidth: '100%',
  },
  itemText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  unitText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#8E8E93',
  },
  hintText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    flexShrink: 1,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 1.6,
  },
});

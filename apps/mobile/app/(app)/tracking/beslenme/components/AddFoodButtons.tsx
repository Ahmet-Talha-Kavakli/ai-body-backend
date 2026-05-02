import React, { useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

const EASE_MICRO = Easing.bezier(0.4, 0, 0.2, 1);

const BUTTONS = [
  { id: 'quick', label: 'Hızlı Ekle', emoji: '⚡', color: '#FF9F0A', bg: '#FFF8EC' },
  { id: 'photo', label: 'Görsel', emoji: '📷', color: '#30B0C7', bg: '#EAF7FA' },
  { id: 'barcode', label: 'Barkod', emoji: '▦', color: '#34C759', bg: '#EDFAF1' },
  { id: 'manual', label: 'Manuel', emoji: '✏️', color: '#FF6B35', bg: '#FFF3EE' },
  { id: 'recipe', label: 'Tarif', emoji: '🍽️', color: '#AF52DE', bg: '#F5EEFF' },
];

interface Props {
  onQuickAdd: () => void;
  onPhoto: () => void;
  onBarcode: () => void;
  onManual: () => void;
  onRecipe: () => void;
}

function Btn({
  emoji,
  label,
  color,
  bg,
  onPress,
}: {
  emoji: string;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const press = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.94,
        duration: 100,
        easing: EASE_MICRO,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 120,
        easing: EASE_MICRO,
        useNativeDriver: true,
      }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable onPress={press} hitSlop={4}>
      <Animated.View style={[st.btn, { backgroundColor: '#FFFFFF', transform: [{ scale }] }]}>
        <View style={[st.iconWrap, { backgroundColor: bg }]}>
          <Text style={st.emoji} allowFontScaling={false}>
            {emoji}
          </Text>
        </View>
        <Text style={[st.label, { color }]} allowFontScaling={false}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function AddFoodButtons({ onQuickAdd, onPhoto, onBarcode, onManual, onRecipe }: Props) {
  const handlers = [onQuickAdd, onPhoto, onBarcode, onManual, onRecipe];

  return (
    <View style={st.wrap}>
      <View style={st.row}>
        {BUTTONS.slice(0, 3).map((b, i) => (
          <Btn key={b.id} {...b} onPress={handlers[i]} />
        ))}
      </View>
      <View style={[st.row, st.rowCenter]}>
        {BUTTONS.slice(3).map((b, i) => (
          <Btn key={b.id} {...b} onPress={handlers[3 + i]} />
        ))}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { gap: 10 },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowCenter: {
    justifyContent: 'center',
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    minWidth: 90,
    maxWidth: 110,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 22 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
});

/**
 * AddOptionsSheet — Yazio "What would you like to create?" benzeri bottom sheet.
 */

import React from 'react';
import { Modal, Pressable, StyleSheet, View, Animated, Easing, Text } from 'react-native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { N, font } from '../theme';
import type { MealType } from '../api/types';

type AddAction = 'search' | 'ai_photo' | 'barcode' | 'quick_add' | 'custom_food' | 'recipe';

type Props = {
  visible: boolean;
  mealType: MealType | null;
  onClose: () => void;
  onSelect: (action: AddAction) => void;
};

const MEAL_LABEL: Record<MealType, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle',
  dinner: 'Akşam',
  snack: 'Atıştırma',
};

const OPTIONS: { key: AddAction; emoji: string; title: string; subtitle: string; tint: string }[] =
  [
    {
      key: 'search',
      emoji: '🔍',
      title: 'Yemek ara',
      subtitle: 'FatSecret + senin yemeklerin',
      tint: '#0A84FF',
    },
    {
      key: 'ai_photo',
      emoji: '📸',
      title: 'Fotoğraftan AI',
      subtitle: 'Yemek fotosu çek, AI tanısın',
      tint: '#7C3AED',
    },
    {
      key: 'barcode',
      emoji: '📊',
      title: 'Barkod oku',
      subtitle: 'Paketli ürünleri hızlıca ekle',
      tint: '#FF9500',
    },
    {
      key: 'quick_add',
      emoji: '⚡',
      title: 'Hızlı ekle',
      subtitle: 'Sadece kalori + makro',
      tint: '#FFCC00',
    },
    {
      key: 'custom_food',
      emoji: '🥕',
      title: 'Yeni yemek oluştur',
      subtitle: 'İsim, porsiyon, makro',
      tint: '#34C759',
    },
    {
      key: 'recipe',
      emoji: '👨‍🍳',
      title: 'Yeni tarif',
      subtitle: 'Malzeme + adımlar',
      tint: '#FF3B30',
    },
  ];

export function AddOptionsSheet({ visible, mealType, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;
  const overlay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlay, {
          toValue: 1,
          duration: 380,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: 1,
          duration: 520,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlay, {
          toValue: 0,
          duration: 320,
          easing: Easing.bezier(0.4, 0, 1, 1),
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: 0,
          duration: 460,
          easing: Easing.bezier(0.4, 0, 1, 1),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slide, overlay]);

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[styles.sheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY }] }]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>
              {mealType ? `${MEAL_LABEL[mealType]} ekle` : 'Yemek ekle'}
            </Text>
            <Text style={styles.subtitle}>Bir yöntem seç</Text>
          </View>

          <View style={styles.list}>
            {OPTIONS.map((opt, idx) => (
              <OptionRow
                key={opt.key}
                emoji={opt.emoji}
                title={opt.title}
                subtitle={opt.subtitle}
                tint={opt.tint}
                showDivider={idx < OPTIONS.length - 1}
                delay={idx * 35}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelect(opt.key);
                }}
              />
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function OptionRow({
  emoji,
  title,
  subtitle,
  tint,
  showDivider,
  onPress,
  delay,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  tint: string;
  showDivider: boolean;
  onPress: () => void;
  delay: number;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 340,
      delay,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [enter, delay]);

  const handlePressIn = () =>
    Animated.timing(press, { toValue: 1, duration: 120, useNativeDriver: false }).start();
  const handlePressOut = () =>
    Animated.timing(press, { toValue: 0, duration: 100, useNativeDriver: false }).start();

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
        ],
      }}
    >
      <View style={styles.rowContainer}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={StyleSheet.absoluteFillObject}
          android_ripple={{ color: N.bg.cardAlt }}
        />
        <View pointerEvents="none" style={styles.rowInner}>
          {/* Sol: emoji */}
          <View style={[styles.emojiBg, { backgroundColor: tint + '1F' }]}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>

          {/* Orta: title + subtitle */}
          <View style={styles.middle}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.rowSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>

          {/* Sağ: chevron */}
          <Ionicons name="chevron-forward" size={18} color={N.text.tertiary} />
        </View>
      </View>
      {showDivider && <View style={styles.divider} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: N.bg.page,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: N.border.strong,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: { paddingHorizontal: 4, marginBottom: 14 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: font.extrabold,
    color: N.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 14, fontFamily: font.medium, color: N.text.tertiary, marginTop: 4 },

  list: {
    backgroundColor: N.bg.card,
    borderRadius: 20,
    overflow: 'hidden',
    ...N.shadow.card,
  },

  rowContainer: {
    minHeight: 72,
    position: 'relative',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 72,
  },
  emojiBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  emoji: { fontSize: 24 },
  middle: { flex: 1, minWidth: 0, justifyContent: 'center' },
  rowTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: font.bold,
    color: N.text.primary,
    letterSpacing: -0.2,
  },
  rowSubtitle: { fontSize: 13, fontFamily: font.regular, color: N.text.tertiary, marginTop: 2 },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: N.border.hairline,
    marginLeft: 76, // emoji genişliği + sol padding kadar
  },
});

export default AddOptionsSheet;

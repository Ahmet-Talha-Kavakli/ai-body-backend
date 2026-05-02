/**
 * CategoryPickerSheet — kategori seçimi bottom sheet.
 * Her kategori büyük tinted ikon + label; seçili olan accent border + check.
 *
 * Akış:
 *  - currentCategory göster, kullanıcı dokunduğunda hemen seç + capture haptik (gelecek)
 *  - 280ms fade + scale transition seçim değişiminde
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrinkIcon, type DrinkIconName } from './DrinkIcons';

const { height: SCREEN_H } = Dimensions.get('window');

const ACCENT = '#32ADE6';
const TEXT = '#1C1C1E';
const SUBTLE = '#8E8E93';
const BORDER = '#E5E5EA';

const EASE_OUT_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN_CLOSE = Easing.bezier(0.4, 0, 1, 1);
const EASE_MICRO = Easing.bezier(0.4, 0, 0.2, 1);

export interface CategoryOption {
  value: string;
  label: string;
  icon: DrinkIconName;
  color: string;
}

export const CATEGORY_OPTIONS_FULL: CategoryOption[] = [
  { value: 'water', label: 'Su', icon: 'bottle', color: '#32ADE6' },
  { value: 'tea', label: 'Çay', icon: 'cup', color: '#FF9500' },
  { value: 'coffee', label: 'Kahve', icon: 'mug', color: '#A0522D' },
  { value: 'herbal', label: 'Bitki Çayı', icon: 'cup', color: '#34C759' },
  { value: 'juice', label: 'Meyve Suyu', icon: 'glass', color: '#FFCC00' },
  { value: 'sports', label: 'Spor İçeceği', icon: 'bottle', color: '#5AC8FA' },
  { value: 'dairy', label: 'Süt & Protein', icon: 'glass', color: '#AEAEB2' },
  { value: 'smoothie', label: 'Smoothie', icon: 'smoothie', color: '#AF52DE' },
  { value: 'soda', label: 'Gazlı', icon: 'canister', color: '#FF3B30' },
  { value: 'alcohol', label: 'Alkol', icon: 'wineGlass', color: '#5856D6' },
  { value: 'other', label: 'Diğer', icon: 'glass', color: '#8E8E93' },
];

interface Props {
  visible: boolean;
  current: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}

export function CategoryPickerSheet({ visible, current, onClose, onSelect }: Props) {
  const [mounted, setMounted] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      requestAnimationFrame(() =>
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 520,
            useNativeDriver: true,
            easing: EASE_OUT_SPRING,
          }),
          Animated.timing(opAnim, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
            easing: EASE_OUT_SPRING,
          }),
        ]).start(),
      );
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_H,
          duration: 460,
          useNativeDriver: true,
          easing: EASE_IN_CLOSE,
        }),
        Animated.timing(opAnim, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
          easing: EASE_IN_CLOSE,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <Modal transparent animationType="none" visible={mounted} onRequestClose={onClose}>
      <Animated.View style={[s.overlay, { opacity: opAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={s.handle} />
        <Text style={s.title}>Kategori</Text>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {CATEGORY_OPTIONS_FULL.map((opt, i) => (
            <CategoryRow
              key={opt.value}
              option={opt}
              selected={current === opt.value}
              isLast={i === CATEGORY_OPTIONS_FULL.length - 1}
              onPress={() => {
                onSelect(opt.value);
                onClose();
              }}
            />
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function CategoryRow({
  option,
  selected,
  isLast,
  onPress,
}: {
  option: CategoryOption;
  selected: boolean;
  isLast?: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const handleIn = () =>
    Animated.timing(scale, {
      toValue: 0.985,
      duration: 120,
      useNativeDriver: true,
      easing: EASE_MICRO,
    }).start();
  const handleOut = () =>
    Animated.timing(scale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
      easing: EASE_MICRO,
    }).start();

  const tint = `${option.color}1A`; // 10% alpha

  return (
    <Pressable onPress={onPress} onPressIn={handleIn} onPressOut={handleOut}>
      <Animated.View
        style={[
          s.row,
          !isLast && s.rowDivider,
          selected && s.rowSelected,
          { transform: [{ scale }] },
        ]}
      >
        <View style={[s.iconBox, { backgroundColor: tint }]}>
          <DrinkIcon name={option.icon} size={26} color={option.color} />
        </View>
        <Text style={[s.rowLabel, selected && { color: ACCENT, fontWeight: '700' }]}>
          {option.label}
        </Text>
        {selected && (
          <Ionicons name="checkmark" size={22} color={ACCENT} style={{ marginLeft: 'auto' }} />
        )}
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_H * 0.7,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D1D6',
    marginTop: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
    textAlign: 'center',
    paddingVertical: 14,
  },
  scroll: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 14,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
    borderRadius: 0,
  },
  rowSelected: {
    backgroundColor: '#F2F8FB',
    borderBottomWidth: 0,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: TEXT,
  },
});

/**
 * ColorPickerSheet — HSV palet (Panel1) + Hue slider + Hex input + üstte hazır renk shortcut'u.
 *
 * Akış:
 *  - Sheet açılır: mevcut renk seçili
 *  - Üstte 12 hazır renk swatch'i — dokunulunca anlık seç
 *  - SV kare + hue slider — sürükleyerek özel renk
 *  - Hex input — manuel girdi
 *  - "Tamam" butonuyla kaydet → onSelect
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import ColorPicker, { Panel1, HueSlider, Swatches, InputWidget } from 'reanimated-color-picker';

const { height: SCREEN_H } = Dimensions.get('window');

const ACCENT = '#32ADE6';
const TEXT = '#1C1C1E';
const SUBTLE = '#8E8E93';

const EASE_OUT_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN_CLOSE = Easing.bezier(0.4, 0, 1, 1);
const EASE_MICRO = Easing.bezier(0.4, 0, 0.2, 1);

// Hızlı erişim hazır renkler — üst sıra (Apple Reminders palette esinli)
const QUICK_SWATCHES = [
  '#32ADE6',
  '#5AC8FA',
  '#30D158',
  '#34C759',
  '#FFCC00',
  '#FF9500',
  '#FF6914',
  '#FF3B30',
  '#AF52DE',
  '#5856D6',
  '#A0522D',
  '#8E8E93',
];

interface Props {
  visible: boolean;
  current: string;
  onClose: () => void;
  onSelect: (hex: string) => void;
}

export function ColorPickerSheet({ visible, current, onClose, onSelect }: Props) {
  const [mounted, setMounted] = useState(false);
  const [tempColor, setTempColor] = useState(current);
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setTempColor(current);
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

  const handleConfirm = () => {
    onSelect(tempColor);
    onClose();
  };

  return (
    <Modal transparent animationType="none" visible={mounted} onRequestClose={onClose}>
      <Animated.View style={[s.overlay, { opacity: opAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={s.headerCancel}>İptal</Text>
            </Pressable>
            <Text style={s.headerTitle}>Renk Seç</Text>
            <Pressable onPress={handleConfirm} hitSlop={12}>
              <Text style={s.headerDone}>Tamam</Text>
            </Pressable>
          </View>

          {/* Mevcut renk preview */}
          <View style={s.previewWrap}>
            <View style={[s.previewCircle, { backgroundColor: tempColor }]} />
            <Text style={s.previewHex}>{tempColor.toUpperCase()}</Text>
          </View>

          <ColorPicker
            value={current}
            onComplete={({ hex }) => {
              'worklet';
              runOnJS(setTempColor)(hex);
            }}
            style={s.picker}
            sliderThickness={24}
            thumbSize={28}
            thumbShape="circle"
          >
            {/* Hazır renkler — Swatches built-in, ama biz custom flat array geçiyoruz */}
            <View style={s.swatchSection}>
              <Text style={s.sectionLabel}>HAZIR RENKLER</Text>
              <Swatches colors={QUICK_SWATCHES} style={s.swatchRow} swatchStyle={s.swatch} />
            </View>

            <View style={s.divider} />

            {/* SV kare */}
            <Panel1 style={s.panel} />

            {/* Hue slider */}
            <HueSlider style={s.slider} />

            {/* Hex input */}
            <View style={s.hexWrap}>
              <InputWidget
                inputStyle={s.hexInput}
                iconColor={SUBTLE}
                defaultFormat="HEX"
                formats={['HEX']}
              />
            </View>
          </ColorPicker>
        </GestureHandlerRootView>
      </Animated.View>
    </Modal>
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
    height: SCREEN_H * 0.85,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerCancel: {
    fontSize: 15,
    fontWeight: '600',
    color: SUBTLE,
  },
  headerDone: {
    fontSize: 15,
    fontWeight: '700',
    color: ACCENT,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT,
  },
  previewWrap: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  previewCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  previewHex: {
    fontSize: 13,
    fontWeight: '600',
    color: SUBTLE,
    letterSpacing: 0.4,
  },
  picker: {
    paddingHorizontal: 20,
    gap: 18,
  },
  swatchSection: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: SUBTLE,
    letterSpacing: 0.6,
  },
  // 6 sütunluk grid → her satıra eşit boşluk, "space-between" tek satır kalan boşluğu yaymıyor
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: 12,
    rowGap: 12,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    margin: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
  },
  panel: {
    height: 200,
    borderRadius: 16,
  },
  slider: {
    borderRadius: 12,
  },
  hexWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  hexInput: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});

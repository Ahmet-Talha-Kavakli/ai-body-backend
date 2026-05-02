/**
 * AddItemSheet — Apple kalitesinde manuel ürün ekleme.
 *
 * Kurallar: Sora font, SF Symbols, native UISegmentedControl (birim için),
 * grouped list pattern, tek Pressable + inline style.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  DeviceEventEmitter,
  Easing,
  InputAccessoryView,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@clerk/expo';

import { N, font } from '../../nutrition/theme';
import { createPantryItem } from '../api/client';

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);
const ACCESSORY_ID = 'addItemAccessory';

const CATEGORIES: Array<{ key: string; label: string; emoji: string }> = [
  { key: 'protein', label: 'Protein', emoji: '🥩' },
  { key: 'sebze', label: 'Sebze', emoji: '🥦' },
  { key: 'meyve', label: 'Meyve', emoji: '🍎' },
  { key: 'süt', label: 'Süt', emoji: '🥛' },
  { key: 'tahıl', label: 'Tahıl', emoji: '🌾' },
  { key: 'baharat', label: 'Baharat', emoji: '🧂' },
  { key: 'içecek', label: 'İçecek', emoji: '🥤' },
  { key: 'diğer', label: 'Diğer', emoji: '📦' },
];

const UNITS = ['adet', 'g', 'kg', 'ml', 'L', 'paket'];

const SHELF_PRESETS: Array<{ label: string; days: number | null }> = [
  { label: '3 gün', days: 3 },
  { label: '1 hafta', days: 7 },
  { label: '2 hafta', days: 14 },
  { label: '1 ay', days: 30 },
  { label: 'Süresiz', days: null },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export default function AddItemSheet({ visible, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('diğer');
  const [quantity, setQuantity] = useState('');
  const [unitIdx, setUnitIdx] = useState(0);
  const [shelfIdx, setShelfIdx] = useState(1); // 1 hafta default
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slide = useRef(new Animated.Value(0)).current;
  const overlay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setName('');
      setCategory('diğer');
      setQuantity('');
      setUnitIdx(0);
      setShelfIdx(1);
      setError(null);
      Animated.parallel([
        Animated.timing(slide, {
          toValue: 1,
          duration: 520,
          easing: EASE_SPRING,
          useNativeDriver: true,
        }),
        Animated.timing(overlay, {
          toValue: 1,
          duration: 380,
          easing: EASE_SPRING,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slide, {
          toValue: 0,
          duration: 460,
          easing: EASE_CLOSE,
          useNativeDriver: true,
        }),
        Animated.timing(overlay, {
          toValue: 0,
          duration: 320,
          easing: EASE_CLOSE,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slide, overlay]);

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [800, 0] });
  const overlayOpacity = overlay.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Ürün adı zorunlu');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Unauthorized');

      const days = SHELF_PRESETS[shelfIdx].days;
      const expiresAt = days
        ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      await createPantryItem(token, {
        name: name.trim(),
        category,
        quantity: Number(quantity) || 1,
        unit: UNITS[unitIdx],
        expiresAt,
        source: 'manual',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      DeviceEventEmitter.emit('pantry:dirty');
      onSaved();
    } catch (err) {
      console.warn('[pantry/create]', err);
      setError('Kayıt başarısız, tekrar dene');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  const canSave = name.trim() && !submitting;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: overlayOpacity }]}
          pointerEvents="none"
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.kvRoot}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[s.sheet, { transform: [{ translateY }], paddingBottom: insets.bottom }]}
          >
            <View style={s.handle} />

            {/* Nav */}
            <View style={s.navRow}>
              <Pressable
                onPress={onClose}
                hitSlop={14}
                style={({ pressed }) => [
                  s.navSide,
                  { alignItems: 'flex-start' },
                  pressed && { opacity: 0.5 },
                ]}
              >
                <Text style={s.navCancel}>İptal</Text>
              </Pressable>
              <Text style={s.navTitle}>Ürün Ekle</Text>
              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                hitSlop={14}
                style={({ pressed }) => [
                  s.navSide,
                  { alignItems: 'flex-end' },
                  pressed && { opacity: 0.5 },
                ]}
              >
                <Text style={[s.navSave, !canSave && { opacity: 0.35 }]}>
                  {submitting ? 'Kaydediliyor…' : 'Kaydet'}
                </Text>
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
            >
              {error && (
                <View style={s.errorBanner}>
                  <SymbolView
                    name="exclamationmark.circle.fill"
                    size={16}
                    tintColor={N.semantic.danger}
                    fallback={<Ionicons name="alert-circle" size={16} color={N.semantic.danger} />}
                  />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              )}

              {/* Ürün adı */}
              <SectionLabel>ÜRÜN ADI</SectionLabel>
              <View style={s.card}>
                <TextInput
                  style={s.nameInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="örn. Süt, Domates, Tavuk"
                  placeholderTextColor={N.text.tertiary}
                  maxLength={50}
                  autoFocus
                  inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
                />
              </View>

              {/* Kategori */}
              <SectionLabel>KATEGORİ</SectionLabel>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              >
                {CATEGORIES.map((cat) => {
                  const active = cat.key === category;
                  return (
                    <Pressable
                      key={cat.key}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setCategory(cat.key);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 100,
                        backgroundColor: active ? '#000000' : N.bg.card,
                        shadowColor: '#000',
                        shadowOpacity: 0.04,
                        shadowRadius: 4,
                        shadowOffset: { width: 0, height: 1 },
                      }}
                    >
                      <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: active ? font.semibold : font.medium,
                          color: active ? '#FFFFFF' : N.text.primary,
                          letterSpacing: -0.1,
                        }}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Miktar */}
              <SectionLabel>MİKTAR</SectionLabel>
              <View style={s.card}>
                <View style={[s.row, { paddingVertical: 14 }]}>
                  <Text style={s.rowLabel}>Adet</Text>
                  <View style={s.numericRight}>
                    <TextInput
                      style={s.numericInput}
                      value={quantity}
                      onChangeText={(v) => setQuantity(v.replace(/[^\d.,]/g, '').replace(',', '.'))}
                      placeholder="1"
                      placeholderTextColor={N.text.tertiary}
                      keyboardType="number-pad"
                      maxLength={5}
                      inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
                    />
                    <Text style={s.numericUnit}>{UNITS[unitIdx]}</Text>
                  </View>
                </View>
                <View style={s.divider} />
                <View style={[s.row, { paddingVertical: 12, alignItems: 'flex-start' }]}>
                  <Text style={[s.rowLabel, { marginTop: 6 }]}>Birim</Text>
                  <SegmentedControl
                    values={UNITS}
                    selectedIndex={unitIdx}
                    onChange={(e) => {
                      Haptics.selectionAsync();
                      setUnitIdx(e.nativeEvent.selectedSegmentIndex);
                    }}
                    style={{ flex: 1, marginLeft: 16, height: 32 }}
                    fontStyle={{ fontSize: 12, fontFamily: font.medium }}
                    activeFontStyle={{ fontSize: 12, fontFamily: font.semibold }}
                  />
                </View>
              </View>

              {/* Son kullanma */}
              <SectionLabel>SON KULLANMA</SectionLabel>
              <View style={s.shelfWrap}>
                {SHELF_PRESETS.map((preset, i) => {
                  const active = i === shelfIdx;
                  return (
                    <Pressable
                      key={preset.label}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setShelfIdx(i);
                      }}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 100,
                        backgroundColor: active ? '#000000' : N.bg.card,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOpacity: 0.04,
                        shadowRadius: 4,
                        shadowOffset: { width: 0, height: 1 },
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: active ? font.semibold : font.medium,
                          color: active ? '#FFFFFF' : N.text.primary,
                          letterSpacing: -0.1,
                        }}
                      >
                        {preset.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>

        {Platform.OS === 'ios' && (
          <InputAccessoryView nativeID={ACCESSORY_ID}>
            <View style={{ height: 0 }} />
          </InputAccessoryView>
        )}
      </View>
    </Modal>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={s.sectionLabel}>{children}</Text>;
}

const s = StyleSheet.create({
  kvRoot: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: N.bg.page,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: N.border.hairline,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  navSide: { minWidth: 72, justifyContent: 'center' },
  navTitle: { fontSize: 17, fontFamily: font.semibold, color: N.text.primary, letterSpacing: -0.3 },
  navCancel: { fontSize: 17, fontFamily: font.regular, color: N.text.secondary },
  navSave: { fontSize: 17, fontFamily: font.semibold, color: N.accent.primary },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF1F0',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCCC7',
  },
  errorText: {
    fontSize: 13,
    fontFamily: font.medium,
    color: N.semantic.danger,
    letterSpacing: -0.1,
  },

  sectionLabel: {
    fontSize: 12,
    fontFamily: font.bold,
    color: N.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 22,
    marginTop: 22,
    marginBottom: 8,
  },

  card: {
    backgroundColor: N.bg.card,
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: N.border.hairline,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    fontSize: 16,
    fontFamily: font.medium,
    color: N.text.primary,
    letterSpacing: -0.2,
    minWidth: 60,
  },
  nameInput: {
    fontSize: 17,
    fontFamily: font.medium,
    color: N.text.primary,
    letterSpacing: -0.3,
    paddingVertical: 14,
    padding: 0,
  },
  numericRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: 4,
  },
  numericInput: {
    fontSize: 17,
    fontFamily: font.semibold,
    color: N.text.primary,
    minWidth: 40,
    textAlign: 'right',
    padding: 0,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  numericUnit: {
    fontSize: 13,
    fontFamily: font.medium,
    color: N.text.tertiary,
  },

  shelfWrap: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
  },
});

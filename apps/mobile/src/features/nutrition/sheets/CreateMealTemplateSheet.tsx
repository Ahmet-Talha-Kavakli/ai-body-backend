/**
 * CreateMealTemplateSheet — yeni öğün şablonu oluşturma akışı.
 *
 * 2 adım:
 *  1. İsim ve öğün tipi seç
 *  2. Şu anki seçili yemekleri (Search'tekiler) şablon olarak kaydet
 *
 * Kullanım:
 *  - Search'te birkaç yemek seçildikten sonra üst sağda "Şablon olarak kaydet" → bu sheet
 *  - TodayScreen'de bir öğüne uzun bas → bu sheet preset'iyle açılır
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  Text,
  InputAccessoryView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@clerk/expo';

import { N, font } from '../theme';
import { createMealTemplate } from '../api/client';
import type { MealItem, MealType } from '../api/types';

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);
const ACCESSORY_ID = 'createTemplateAccessory';

const MEAL_OPTIONS: Array<{ key: MealType; label: string; emoji: string }> = [
  { key: 'breakfast', label: 'Kahvaltı', emoji: '☕' },
  { key: 'lunch', label: 'Öğle', emoji: '🍝' },
  { key: 'dinner', label: 'Akşam', emoji: '🥘' },
  { key: 'snack', label: 'Atıştırma', emoji: '🍎' },
];

type Props = {
  visible: boolean;
  defaultMealType: MealType;
  items: MealItem[]; // şablona eklenecek yemekler
  onClose: () => void;
  onSaved: () => void;
};

export function CreateMealTemplateSheet({
  visible,
  defaultMealType,
  items,
  onClose,
  onSaved,
}: Props) {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [name, setName] = useState('');
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slide = useRef(new Animated.Value(0)).current;
  const overlay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setName('');
      setMealType(defaultMealType);
      setError(null);
      Animated.parallel([
        Animated.timing(slide, {
          toValue: 1,
          duration: 480,
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
          duration: 380,
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
  }, [visible, defaultMealType, slide, overlay]);

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [800, 0] });
  const overlayOpacity = overlay.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });

  const totals = items.reduce(
    (a, it) => {
      const q = Number(it.quantity) || 1;
      a.calories += (it.calories || 0) * q;
      a.proteinG += (it.proteinG || 0) * q;
      a.carbsG += (it.carbsG || 0) * q;
      a.fatG += (it.fatG || 0) * q;
      return a;
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Bir isim ver');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (items.length === 0) {
      setError('Önce yemek ekle');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Unauthorized');
      await createMealTemplate(token, {
        name: trimmed,
        mealType,
        items,
        totalCalories: Math.round(totals.calories),
        totalProteinG: totals.proteinG,
        totalCarbsG: totals.carbsG,
        totalFatG: totals.fatG,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved();
    } catch (e) {
      console.warn('[create template]', e);
      setError('Kayıt başarısız, tekrar dene');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

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
            style={[s.sheet, { transform: [{ translateY }], paddingBottom: insets.bottom + 12 }]}
          >
            <View style={s.handle} />

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
              <Text style={s.navTitle}>Yeni Öğün</Text>
              <Pressable
                onPress={handleSave}
                hitSlop={14}
                disabled={saving}
                style={({ pressed }) => [
                  s.navSide,
                  { alignItems: 'flex-end' },
                  pressed && { opacity: 0.5 },
                ]}
              >
                <Text style={[s.navSave, saving && { opacity: 0.4 }]}>
                  {saving ? 'Kaydediliyor…' : 'Kaydet'}
                </Text>
              </Pressable>
            </View>

            {error && (
              <View style={s.errorBanner}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {/* İsim */}
            <View style={s.field}>
              <Text style={s.label}>İsim</Text>
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="Örn: Pazar Kahvaltı"
                placeholderTextColor={N.text.tertiary}
                maxLength={50}
                autoFocus
                inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
              />
            </View>

            {/* Öğün tipi */}
            <View style={s.field}>
              <Text style={s.label}>Öğün</Text>
              <View style={s.mealRow}>
                {MEAL_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMealType(opt.key);
                    }}
                    style={({ pressed }) => [
                      s.mealChip,
                      mealType === opt.key && s.mealChipActive,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={s.mealEmoji}>{opt.emoji}</Text>
                    <Text
                      style={[
                        s.mealLabel,
                        mealType === opt.key && { color: '#FFF', fontFamily: font.semibold },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Özet */}
            <View style={s.summaryCard}>
              <Text style={s.summaryHeader}>Özet</Text>
              <Text style={s.summaryLine}>
                <Text style={s.summaryBold}>{items.length}</Text>
                <Text style={s.summaryMuted}> yemek · </Text>
                <Text style={s.summaryBold}>{Math.round(totals.calories)} kcal</Text>
              </Text>
            </View>
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

const s = StyleSheet.create({
  kvRoot: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: N.bg.page,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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
    paddingTop: 14,
    paddingBottom: 14,
  },
  navSide: { minWidth: 72 },
  navTitle: { fontSize: 17, fontFamily: font.semibold, color: N.text.primary, letterSpacing: -0.3 },
  navCancel: { fontSize: 17, fontFamily: font.regular, color: N.text.secondary },
  navSave: { fontSize: 17, fontFamily: font.semibold, color: N.accent.primary },

  errorBanner: {
    backgroundColor: '#FFF1F0',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFCCC7',
  },
  errorText: { fontSize: 13, fontFamily: font.medium, color: N.semantic.danger },

  field: { paddingHorizontal: 16, marginBottom: 16 },
  label: {
    fontSize: 12,
    fontFamily: font.bold,
    color: N.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: N.bg.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    fontFamily: font.medium,
    color: N.text.primary,
    letterSpacing: -0.2,
  },
  mealRow: { flexDirection: 'row', gap: 8 },
  mealChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: N.bg.card,
    paddingVertical: 12,
    borderRadius: 12,
  },
  mealChipActive: { backgroundColor: '#000000' },
  mealEmoji: { fontSize: 16 },
  mealLabel: {
    fontSize: 13,
    fontFamily: font.medium,
    color: N.text.secondary,
    letterSpacing: -0.1,
  },

  summaryCard: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
    backgroundColor: N.bg.card,
    padding: 14,
    borderRadius: 14,
  },
  summaryHeader: {
    fontSize: 11,
    fontFamily: font.bold,
    color: N.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryLine: { fontSize: 14, fontFamily: font.regular },
  summaryBold: { fontFamily: font.bold, color: N.text.primary },
  summaryMuted: { color: N.text.secondary },
});

/**
 * QuickAddSheet — Apple kalitesinde hızlı kalori ekleme.
 *
 * Yazio paterni: yemek yaratmadan sadece sayılarla logla.
 * - Kalori zorunlu, makrolar opsiyonel
 * - Toggle: ileride tekrar kullanmak için kütüphaneye kaydet
 *
 * Kurallar: Sora font, SF Symbols, native UISwitch, native InputAccessory,
 * tek Pressable + inline style butonlar, EASE_SPRING/CLOSE.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  InputAccessoryView,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@clerk/expo';

import { N, font } from '../theme';
import { quickAdd } from '../api/client';
import type { MealType } from '../api/types';

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);
const ACCESSORY_ID = 'quickAddAccessory';

const MEAL_LABEL: Record<MealType, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle',
  dinner: 'Akşam',
  snack: 'Atıştırma',
};

const MEAL_EMOJI: Record<MealType, string> = {
  breakfast: '☕',
  lunch: '🍝',
  dinner: '🥘',
  snack: '🍎',
};

type Props = {
  visible: boolean;
  mealType: MealType;
  onClose: () => void;
  onAdded: () => void;
};

export function QuickAddSheet({ visible, mealType, onClose, onAdded }: Props) {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [savePersistent, setSave] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slide = useRef(new Animated.Value(0)).current;
  const overlay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // İlk açılışta state reset
      setName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setSave(false);
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

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [700, 0] });
  const overlayOpacity = overlay.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });

  const handleSave = async () => {
    const cal = Number(calories);
    if (!cal || cal <= 0) {
      setError('Kalori değeri zorunlu');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Unauthorized');
      await quickAdd(token, {
        mealType,
        name: name.trim() || 'Hızlı kayıt',
        calories: cal,
        proteinG: Number(protein) || 0,
        carbsG: Number(carbs) || 0,
        fatG: Number(fat) || 0,
        savePersistent,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAdded();
    } catch (err) {
      console.warn('[quickAdd]', err);
      setError('Kayıt başarısız, tekrar dene');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  const canSave = Number(calories) > 0 && !submitting;

  // Hesaplanmış toplam kalori (makrolardan)
  const fromMacros = (Number(protein) || 0) * 4 + (Number(carbs) || 0) * 4 + (Number(fat) || 0) * 9;

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

            {/* Nav bar */}
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
              <View style={{ alignItems: 'center' }}>
                <Text style={s.navTitle}>Hızlı Ekle</Text>
                <Text style={s.navSub}>
                  {MEAL_EMOJI[mealType]} {MEAL_LABEL[mealType]}
                </Text>
              </View>
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
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {/* Hero — büyük kalori display */}
              <View style={s.heroCard}>
                <Text style={s.heroLabel}>KALORİ</Text>
                <View style={s.heroInputRow}>
                  <TextInput
                    style={s.heroInput}
                    value={calories}
                    onChangeText={(v) => setCalories(v.replace(/[^\d]/g, ''))}
                    placeholder="0"
                    placeholderTextColor={N.text.quaternary}
                    keyboardType="number-pad"
                    inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
                    maxLength={5}
                    autoFocus
                  />
                  <Text style={s.heroUnit}>kcal</Text>
                </View>
                {fromMacros > 0 &&
                  Number(calories) > 0 &&
                  Math.abs(Number(calories) - fromMacros) > 50 && (
                    <Text style={s.heroHint}>
                      Makrolardan hesaplanan: {Math.round(fromMacros)} kcal
                    </Text>
                  )}
              </View>

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

              {/* İsim */}
              <SectionLabel>İSİM</SectionLabel>
              <View style={s.fieldCard}>
                <TextInput
                  style={s.nameInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="örn. Burger menü"
                  placeholderTextColor={N.text.tertiary}
                  maxLength={50}
                  inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
                />
              </View>

              {/* Makrolar */}
              <SectionLabel>MAKROLAR (OPSİYONEL)</SectionLabel>
              <View style={s.macrosCard}>
                <MacroField
                  color={N.macro.protein}
                  label="Protein"
                  value={protein}
                  onChangeText={setProtein}
                  isFirst
                />
                <View style={s.macroDivider} />
                <MacroField
                  color={N.macro.carbs}
                  label="Karbonhidrat"
                  value={carbs}
                  onChangeText={setCarbs}
                />
                <View style={s.macroDivider} />
                <MacroField
                  color={N.macro.fat}
                  label="Yağ"
                  value={fat}
                  onChangeText={setFat}
                  isLast
                />
              </View>

              {/* Save toggle — Apple Settings tarzı */}
              <View style={s.toggleCard}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={s.toggleTitle}>Kütüphaneye kaydet</Text>
                  <Text style={s.toggleSub}>Bir sonraki sefer "Sık kullanılan"da görünür</Text>
                </View>
                <Switch
                  value={savePersistent}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setSave(v);
                  }}
                  trackColor={{ true: N.accent.primary, false: '#E5E5EA' }}
                />
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

function MacroField({
  color,
  label,
  value,
  onChangeText,
  isFirst,
  isLast,
}: {
  color: string;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={s.macroRow}>
      <View style={[s.macroDot, { backgroundColor: color }]} />
      <Text style={s.macroLabel}>{label}</Text>
      <View style={s.macroInputWrap}>
        <TextInput
          style={s.macroInput}
          value={value}
          onChangeText={(v) => onChangeText(v.replace(/[^\d]/g, ''))}
          placeholder="0"
          placeholderTextColor={N.text.quaternary}
          keyboardType="number-pad"
          maxLength={4}
          inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
        />
        <Text style={s.macroUnit}>g</Text>
      </View>
    </View>
  );
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

  // Nav
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    minHeight: 56,
    justifyContent: 'space-between',
  },
  navSide: { minWidth: 72, justifyContent: 'center' },
  navTitle: { fontSize: 17, fontFamily: font.semibold, color: N.text.primary, letterSpacing: -0.3 },
  navSub: {
    fontSize: 12,
    fontFamily: font.medium,
    color: N.text.tertiary,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  navCancel: { fontSize: 17, fontFamily: font.regular, color: N.text.secondary },
  navSave: { fontSize: 17, fontFamily: font.semibold, color: N.accent.primary },

  // Hero kalori
  heroCard: {
    backgroundColor: N.bg.card,
    marginHorizontal: 16,
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  heroLabel: {
    fontSize: 11,
    fontFamily: font.bold,
    color: N.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  heroInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  heroInput: {
    fontSize: 56,
    fontFamily: font.extrabold,
    color: N.text.primary,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
    minWidth: 100,
    textAlign: 'center',
    padding: 0,
  },
  heroUnit: {
    fontSize: 16,
    fontFamily: font.semibold,
    color: N.text.tertiary,
    letterSpacing: -0.2,
  },
  heroHint: {
    fontSize: 12,
    fontFamily: font.medium,
    color: N.text.tertiary,
    marginTop: 8,
    letterSpacing: -0.1,
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF1F0',
    marginHorizontal: 16,
    marginTop: 12,
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

  // Section
  sectionLabel: {
    fontSize: 12,
    fontFamily: font.bold,
    color: N.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 22,
    marginTop: 24,
    marginBottom: 8,
  },

  // İsim alanı
  fieldCard: {
    backgroundColor: N.bg.card,
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  nameInput: {
    fontSize: 17,
    fontFamily: font.medium,
    color: N.text.primary,
    letterSpacing: -0.3,
    padding: 0,
  },

  // Makrolar
  macrosCard: {
    backgroundColor: N.bg.card,
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  macroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: N.border.hairline,
    marginLeft: 22,
  },
  macroDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  macroLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: font.semibold,
    color: N.text.primary,
    letterSpacing: -0.2,
  },
  macroInputWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  macroInput: {
    fontSize: 17,
    fontFamily: font.bold,
    color: N.text.primary,
    minWidth: 40,
    textAlign: 'right',
    padding: 0,
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  macroUnit: {
    fontSize: 13,
    fontFamily: font.medium,
    color: N.text.tertiary,
  },

  // Toggle (Settings tarzı)
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: N.bg.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  toggleTitle: {
    fontSize: 15,
    fontFamily: font.semibold,
    color: N.text.primary,
    letterSpacing: -0.2,
  },
  toggleSub: {
    fontSize: 12,
    fontFamily: font.regular,
    color: N.text.tertiary,
    marginTop: 2,
    letterSpacing: -0.1,
  },
});

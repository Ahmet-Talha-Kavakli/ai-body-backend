/**
 * CustomFoodSheet — Apple kalitesinde yeni yemek oluşturma.
 *
 * Yazio'daki "New food without barcode" eşdeğeri, kalıcı kütüphaneye eklenir.
 *
 * Kurallar:
 *  - Sora font, SF Symbols, native UISegmentedControl (birim için)
 *  - Apple grouped list pattern
 *  - Tek Pressable + inline style butonlar
 *  - InputAccessoryView ile Done butonsuz number-pad
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
  TextInput,
  View,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@clerk/expo';

import { N, font } from '../theme';
import { createCustomFood, createMeal } from '../api/client';
import type { MealType, MealItem } from '../api/types';

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);
const ACCESSORY_ID = 'customFoodAccessory';

const UNITS: Array<{ key: string; label: string }> = [
  { key: 'g', label: 'g' },
  { key: 'ml', label: 'ml' },
  { key: 'adet', label: 'adet' },
  { key: 'dilim', label: 'dilim' },
];

type Props = {
  visible: boolean;
  mealType: MealType;
  initialBarcode?: string;
  onClose: () => void;
  onAdded: () => void;
  alsoLog?: boolean;
};

export function CustomFoodSheet({
  visible,
  mealType,
  initialBarcode,
  onClose,
  onAdded,
  alsoLog = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [unitIdx, setUnitIdx] = useState(0);
  const [cal, setCal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sugar, setSugar] = useState('');
  const [satFat, setSatFat] = useState('');
  const [sodium, setSodium] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slide = useRef(new Animated.Value(0)).current;
  const overlay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setName('');
      setBrand('');
      setServingSize('100');
      setUnitIdx(0);
      setCal('');
      setProtein('');
      setCarbs('');
      setFat('');
      setFiber('');
      setSugar('');
      setSatFat('');
      setSodium('');
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
      setError('İsim zorunlu');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!Number(cal)) {
      setError('Kalori değeri zorunlu');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Unauthorized');

      const { customFood } = await createCustomFood(token, {
        name: name.trim(),
        brand: brand.trim() || undefined,
        barcode: initialBarcode,
        servingSize: Number(servingSize) || 100,
        servingUnit: UNITS[unitIdx].key,
        calories: Number(cal),
        proteinG: Number(protein) || 0,
        carbsG: Number(carbs) || 0,
        fatG: Number(fat) || 0,
        fiberG: Number(fiber) || 0,
        sugarG: Number(sugar) || 0,
        saturatedFatG: Number(satFat) || 0,
        sodiumMg: Number(sodium) || 0,
      });

      if (alsoLog) {
        const item: MealItem = {
          customFoodId: customFood.id,
          name: customFood.name,
          brand: customFood.brand ?? undefined,
          servingSize: customFood.servingSize,
          servingUnit: customFood.servingUnit,
          quantity: 1,
          calories: customFood.calories,
          proteinG: customFood.proteinG,
          carbsG: customFood.carbsG,
          fatG: customFood.fatG,
          fiberG: customFood.fiberG,
          sugarG: customFood.sugarG,
          saturatedFatG: customFood.saturatedFatG,
          sodiumMg: customFood.sodiumMg,
          source: 'custom',
        };
        await createMeal(token, {
          mealType,
          items: [item],
          source: initialBarcode ? 'barcode' : 'manual',
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAdded();
    } catch (err) {
      console.warn('[customFood]', err);
      setError('Kayıt başarısız, tekrar dene');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  const canSave = name.trim() && Number(cal) > 0 && !submitting;

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
              <Text style={s.navTitle}>{initialBarcode ? 'Yeni Ürün' : 'Yeni Yemek'}</Text>
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
              {/* Barkod badge */}
              {initialBarcode && (
                <View style={s.barcodeBadge}>
                  <SymbolView
                    name="barcode"
                    size={16}
                    tintColor={N.accent.primaryDim}
                    fallback={<Ionicons name="barcode" size={16} color={N.accent.primaryDim} />}
                  />
                  <Text style={s.barcodeText}>{initialBarcode}</Text>
                </View>
              )}

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

              {/* Bilgiler */}
              <SectionLabel>BİLGİLER</SectionLabel>
              <View style={s.card}>
                <FieldRow
                  label="İsim"
                  value={name}
                  onChangeText={setName}
                  placeholder="örn. Tavuk göğsü"
                  required
                  isFirst
                />
                <View style={s.divider} />
                <FieldRow
                  label="Marka"
                  value={brand}
                  onChangeText={setBrand}
                  placeholder="örn. Banvit"
                  isLast
                />
              </View>

              {/* Porsiyon */}
              <SectionLabel>PORSİYON</SectionLabel>
              <View style={s.card}>
                <View style={[s.row, { paddingVertical: 14 }]}>
                  <Text style={s.rowLabel}>Miktar</Text>
                  <View style={s.numericRight}>
                    <TextInput
                      style={s.numericInput}
                      value={servingSize}
                      onChangeText={(v) => setServingSize(v.replace(/[^\d]/g, ''))}
                      placeholder="100"
                      placeholderTextColor={N.text.tertiary}
                      keyboardType="number-pad"
                      maxLength={5}
                      inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
                    />
                    <Text style={s.numericUnit}>{UNITS[unitIdx].label}</Text>
                  </View>
                </View>
                <View style={s.divider} />
                <View style={[s.row, { paddingVertical: 12, alignItems: 'flex-start' }]}>
                  <Text style={[s.rowLabel, { marginTop: 6 }]}>Birim</Text>
                  <SegmentedControl
                    values={UNITS.map((u) => u.label)}
                    selectedIndex={unitIdx}
                    onChange={(e) => {
                      Haptics.selectionAsync();
                      setUnitIdx(e.nativeEvent.selectedSegmentIndex);
                    }}
                    style={{ flex: 1, marginLeft: 16, height: 32 }}
                    fontStyle={{ fontSize: 13, fontFamily: font.medium }}
                    activeFontStyle={{ fontSize: 13, fontFamily: font.semibold }}
                  />
                </View>
              </View>

              {/* Per porsiyon makrolar */}
              <SectionLabel>BU PORSİYONDA</SectionLabel>
              <View style={s.card}>
                <MacroRow
                  color={N.accent.primary}
                  label="Kalori"
                  value={cal}
                  onChangeText={setCal}
                  unit="kcal"
                  required
                  isFirst
                />
                <View style={s.divider} />
                <MacroRow
                  color={N.macro.protein}
                  label="Protein"
                  value={protein}
                  onChangeText={setProtein}
                  unit="g"
                />
                <View style={s.divider} />
                <MacroRow
                  color={N.macro.carbs}
                  label="Karbonhidrat"
                  value={carbs}
                  onChangeText={setCarbs}
                  unit="g"
                />
                <View style={s.divider} />
                <MacroRow
                  color={N.macro.fat}
                  label="Yağ"
                  value={fat}
                  onChangeText={setFat}
                  unit="g"
                  isLast
                />
              </View>

              {/* Detay opsiyonel */}
              <SectionLabel>DETAY (OPSİYONEL)</SectionLabel>
              <View style={s.card}>
                <MacroRow
                  color={N.semantic.success}
                  label="Lif"
                  value={fiber}
                  onChangeText={setFiber}
                  unit="g"
                  isFirst
                />
                <View style={s.divider} />
                <MacroRow
                  color="#FFB340"
                  label="Şeker"
                  value={sugar}
                  onChangeText={setSugar}
                  unit="g"
                />
                <View style={s.divider} />
                <MacroRow
                  color="#FF8C42"
                  label="Doymuş yağ"
                  value={satFat}
                  onChangeText={setSatFat}
                  unit="g"
                />
                <View style={s.divider} />
                <MacroRow
                  color="#5856D6"
                  label="Sodyum"
                  value={sodium}
                  onChangeText={setSodium}
                  unit="mg"
                  isLast
                />
              </View>

              <Text style={s.footnote}>
                Bu yemek kütüphanene kaydedilir, bir sonraki sefer "Sık kullanılan"da görünür.
              </Text>
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

function FieldRow({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  isFirst,
  isLast,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={[s.row, { paddingVertical: 14 }]}>
      <Text style={s.rowLabel}>
        {label}
        {required && <Text style={{ color: N.semantic.danger }}> *</Text>}
      </Text>
      <TextInput
        style={s.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={N.text.tertiary}
        maxLength={60}
      />
    </View>
  );
}

function MacroRow({
  color,
  label,
  value,
  onChangeText,
  unit,
  required,
  isFirst,
  isLast,
}: {
  color: string;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  unit: string;
  required?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={[s.row, { paddingVertical: 14 }]}>
      <View style={[s.macroDot, { backgroundColor: color }]} />
      <Text style={s.rowLabel}>
        {label}
        {required && <Text style={{ color: N.semantic.danger }}> *</Text>}
      </Text>
      <View style={s.numericRight}>
        <TextInput
          style={s.numericInput}
          value={value}
          onChangeText={(v) => onChangeText(v.replace(/[^\d]/g, ''))}
          placeholder="0"
          placeholderTextColor={N.text.tertiary}
          keyboardType="number-pad"
          maxLength={5}
          inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
        />
        <Text style={s.numericUnit}>{unit}</Text>
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
    maxHeight: '94%',
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  navSide: { minWidth: 72, justifyContent: 'center' },
  navTitle: { fontSize: 17, fontFamily: font.semibold, color: N.text.primary, letterSpacing: -0.3 },
  navCancel: { fontSize: 17, fontFamily: font.regular, color: N.text.secondary },
  navSave: { fontSize: 17, fontFamily: font.semibold, color: N.accent.primary },

  // Barcode
  barcodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20,184,166,0.1)',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  barcodeText: {
    fontSize: 13,
    fontFamily: font.semibold,
    color: N.accent.primaryDim,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.2,
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF1F0',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
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

  // Section header
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

  // Cards
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
    minWidth: 100,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: font.regular,
    color: N.text.primary,
    letterSpacing: -0.2,
    textAlign: 'right',
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

  macroDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  footnote: {
    fontSize: 12,
    fontFamily: font.regular,
    color: N.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginTop: 18,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
});

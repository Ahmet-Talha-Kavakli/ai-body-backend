/**
 * FoodDetailSheet — Yazio benzeri yemek detay alt sheet'i.
 *
 * - Üst: ‹ Geri · Yemek adı · ⭐ favori toggle
 * - 4 makro grid (kalori, karb, protein, yağ)
 * - "Yakın zamanda girildi" chip (mevcut customFood'sa)
 * - Apple-style wheel picker: miktar (sayı + kesir) + birim (porsiyon)
 * - Alt CTA: siyah pill "Ekle"
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Text,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@clerk/expo';
import { Picker as NativePicker } from '@react-native-picker/picker';
import { SymbolView } from 'expo-symbols';

import { N, font } from '../theme';
import { toggleFavorite, type FavoriteSource } from '../api/client';
import type { MealItem } from '../api/types';

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);

export type FoodDetailRow = {
  source: FavoriteSource;
  sourceId: string;
  name: string;
  brand?: string;
  photoUrl?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  saturatedFatG?: number;
  transFatG?: number;
  cholesterolMg?: number;
  sodiumMg?: number;
  isFavorite?: boolean;
  /** kullanıcının daha önce eklediği bir yemek mi (CustomFood id) */
  customFoodId?: string;
  /** FoodItem cache id'si */
  foodItemId?: string;
};

type Props = {
  visible: boolean;
  row: FoodDetailRow | null;
  onClose: () => void;
  onAdd: (item: MealItem) => void;
  onFavoriteChanged?: () => void;
};

const FRACTIONS = [
  { label: '0', value: 0 },
  { label: '⅛', value: 0.125 },
  { label: '¼', value: 0.25 },
  { label: '⅓', value: 0.333 },
  { label: '½', value: 0.5 },
  { label: '⅔', value: 0.667 },
  { label: '¾', value: 0.75 },
];

export function FoodDetailSheet({ visible, row, onClose, onAdd, onFavoriteChanged }: Props) {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [whole, setWhole] = useState(1);
  const [fraction, setFraction] = useState(0);
  const [unitIdx, setUnitIdx] = useState(0);
  const [favorite, setFavorite] = useState(false);

  const slide = useRef(new Animated.Value(0)).current;
  const overlay = useRef(new Animated.Value(0)).current;
  const favScale = useRef(new Animated.Value(1)).current;

  // Birim seçenekleri — kaynaktan gelen serving + standart fallback'ler
  const units = useMemo(() => {
    if (!row) return [{ label: '100 g', size: 100, unit: 'g' }];
    const base = `${row.servingSize} ${row.servingUnit}`;
    const isLiquid = row.servingUnit === 'ml';
    const out: Array<{ label: string; size: number; unit: string }> = [
      { label: `Porsiyon (${base})`, size: row.servingSize, unit: row.servingUnit },
    ];
    if (isLiquid) {
      out.push({ label: '100 ml', size: 100, unit: 'ml' });
      out.push({ label: '1 bardak (200 ml)', size: 200, unit: 'ml' });
    } else {
      out.push({ label: '100 g', size: 100, unit: 'g' });
      out.push({ label: '1 küçük porsiyon (100 g)', size: 100, unit: 'g' });
      out.push({ label: '1 orta porsiyon (200 g)', size: 200, unit: 'g' });
      out.push({ label: '1 büyük porsiyon (300 g)', size: 300, unit: 'g' });
    }
    return out;
  }, [row]);

  useEffect(() => {
    if (visible && row) {
      setWhole(1);
      setFraction(0);
      setUnitIdx(0);
      setFavorite(!!row.isFavorite);
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
  }, [visible, row, slide, overlay]);

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [800, 0] });
  const overlayOpacity = overlay.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });

  if (!row) return null;

  const quantity = whole + fraction;
  const selectedUnit = units[unitIdx] ?? units[0];
  const ratio = (selectedUnit.size * quantity) / row.servingSize;

  const totals = {
    calories: row.calories * ratio,
    proteinG: row.proteinG * ratio,
    carbsG: row.carbsG * ratio,
    fatG: row.fatG * ratio,
  };

  const onToggleFavorite = async () => {
    // Optimistic — UI önce değişsin
    const next = !favorite;
    setFavorite(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Pop animasyonu — yıldız büyür sonra geri küçülür
    Animated.sequence([
      Animated.timing(favScale, {
        toValue: 1.4,
        duration: 140,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      Animated.spring(favScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();
    try {
      const token = await getToken();
      if (!token) return;
      toggleFavorite(token, row.source, row.sourceId, {
        name: row.name,
        brand: row.brand,
        photoUrl: row.photoUrl,
        servingSize: row.servingSize,
        servingUnit: row.servingUnit,
        calories: row.calories,
        proteinG: row.proteinG,
        carbsG: row.carbsG,
        fatG: row.fatG,
      })
        .then((result) => {
          if (result.favorited !== next) setFavorite(result.favorited);
          onFavoriteChanged?.();
        })
        .catch((e) => {
          console.warn('[favorite toggle]', e);
          setFavorite(!next); // rollback
        });
    } catch (e) {
      console.warn('[favorite toggle]', e);
      setFavorite(!next);
    }
  };

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const item: MealItem = {
      foodId: row.source === 'food' ? row.sourceId : row.foodItemId,
      customFoodId: row.source === 'custom' ? row.sourceId : row.customFoodId,
      offCode: row.source === 'off' ? row.sourceId : undefined,
      usdaFdcId: row.source === 'usda' ? row.sourceId : undefined,
      fatSecretFoodId: row.source === 'fatsecret' ? row.sourceId : undefined,
      name: row.name,
      brand: row.brand,
      photoUrl: row.photoUrl,
      servingSize: selectedUnit.size,
      servingUnit: selectedUnit.unit,
      quantity,
      calories: row.calories * (selectedUnit.size / row.servingSize),
      proteinG: row.proteinG * (selectedUnit.size / row.servingSize),
      carbsG: row.carbsG * (selectedUnit.size / row.servingSize),
      fatG: row.fatG * (selectedUnit.size / row.servingSize),
      fiberG: (row.fiberG ?? 0) * (selectedUnit.size / row.servingSize),
      sugarG: (row.sugarG ?? 0) * (selectedUnit.size / row.servingSize),
      saturatedFatG: (row.saturatedFatG ?? 0) * (selectedUnit.size / row.servingSize),
      transFatG: (row.transFatG ?? 0) * (selectedUnit.size / row.servingSize),
      cholesterolMg: (row.cholesterolMg ?? 0) * (selectedUnit.size / row.servingSize),
      sodiumMg: (row.sodiumMg ?? 0) * (selectedUnit.size / row.servingSize),
      source:
        row.source === 'off'
          ? 'barcode'
          : row.source === 'fatsecret'
            ? 'fatsecret'
            : row.source === 'custom'
              ? 'custom'
              : 'fatsecret',
    };
    onAdd(item);
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

        <Animated.View
          style={[s.sheet, { transform: [{ translateY }], paddingBottom: insets.bottom + 12 }]}
        >
          {/* Handle */}
          <View style={s.handle} />

          {/* Nav row */}
          <View style={s.navRow}>
            <Pressable
              onPress={onClose}
              hitSlop={14}
              style={({ pressed }) => [s.navBtn, pressed && { opacity: 0.5 }]}
            >
              <Ionicons name="chevron-back" size={28} color={N.text.primary} />
            </Pressable>
            <Text style={s.navTitle} numberOfLines={1}>
              {row.name}
            </Text>
            <Pressable
              onPress={onToggleFavorite}
              hitSlop={14}
              style={({ pressed }) => [
                s.navBtn,
                { alignItems: 'flex-end' },
                pressed && { opacity: 0.5 },
              ]}
            >
              <Animated.View style={{ transform: [{ scale: favScale }] }}>
                <SymbolView
                  name={favorite ? 'star.fill' : 'star'}
                  size={26}
                  tintColor={favorite ? '#F5B800' : N.text.tertiary}
                  fallback={
                    <Ionicons
                      name={favorite ? 'star' : 'star-outline'}
                      size={26}
                      color={favorite ? '#F5B800' : N.text.tertiary}
                    />
                  }
                />
              </Animated.View>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            {/* Brand + photo */}
            {(row.brand || row.photoUrl) && (
              <View style={s.brandRow}>
                {row.photoUrl && <Image source={{ uri: row.photoUrl }} style={s.brandImg} />}
                {row.brand && <Text style={s.brandText}>{row.brand}</Text>}
              </View>
            )}

            {/* Macro grid */}
            <View style={s.macroGrid}>
              <MacroCell
                label="Kalori"
                value={Math.round(totals.calories)}
                unit="kcal"
                color={N.accent.primary}
              />
              <View style={s.macroSep} />
              <MacroCell
                label="Karb"
                value={totals.carbsG}
                unit="g"
                color={N.macro.carbs}
                decimals={1}
              />
              <View style={s.macroSep} />
              <MacroCell
                label="Protein"
                value={totals.proteinG}
                unit="g"
                color={N.macro.protein}
                decimals={1}
              />
              <View style={s.macroSep} />
              <MacroCell
                label="Yağ"
                value={totals.fatG}
                unit="g"
                color={N.macro.fat}
                decimals={1}
              />
            </View>

            {/* Native iOS UIPickerView — 3 sütun yan yana */}
            <View style={s.pickerRow}>
              <NativePicker
                style={s.nativePicker}
                itemStyle={s.nativePickerItem}
                selectedValue={whole}
                onValueChange={(v) => {
                  Haptics.selectionAsync();
                  setWhole(Number(v));
                }}
              >
                {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => (
                  <NativePicker.Item key={n} label={String(n)} value={n} />
                ))}
              </NativePicker>

              <NativePicker
                style={s.nativePicker}
                itemStyle={s.nativePickerItem}
                selectedValue={fraction}
                onValueChange={(v) => {
                  Haptics.selectionAsync();
                  setFraction(Number(v));
                }}
              >
                {FRACTIONS.map((f) => (
                  <NativePicker.Item key={f.label} label={f.label} value={f.value} />
                ))}
              </NativePicker>

              <NativePicker
                style={[s.nativePicker, { flex: 2 }]}
                itemStyle={s.nativePickerItem}
                selectedValue={unitIdx}
                onValueChange={(v) => {
                  Haptics.selectionAsync();
                  setUnitIdx(Number(v));
                }}
              >
                {units.map((u, i) => (
                  <NativePicker.Item key={`${u.label}-${i}`} label={u.label} value={i} />
                ))}
              </NativePicker>
            </View>
          </ScrollView>

          {/* CTA */}
          <Pressable
            onPress={handleAdd}
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              marginBottom: 8,
              backgroundColor: '#000000',
              borderRadius: 100,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.18,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: font.semibold,
                color: '#FFFFFF',
                letterSpacing: -0.2,
              }}
            >
              Ekle
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

function MacroCell({
  label,
  value,
  unit,
  color,
  decimals = 0,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  decimals?: number;
}) {
  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  return (
    <View style={s.macroCell}>
      <Text style={[s.macroValue, { color: N.text.primary }]}>{display}</Text>
      <Text style={s.macroUnit}>{unit}</Text>
      <Text style={[s.macroLabel, { color }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: N.bg.page,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
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
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 12,
  },
  navBtn: { width: 48, alignItems: 'flex-start' },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: font.semibold,
    color: N.text.primary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 4,
    marginBottom: 8,
  },
  brandImg: { width: 28, height: 28, borderRadius: 6, backgroundColor: N.bg.well },
  brandText: { fontSize: 14, fontFamily: font.medium, color: N.text.secondary },

  macroGrid: {
    flexDirection: 'row',
    backgroundColor: N.bg.card,
    marginHorizontal: 16,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 18,
  },
  macroCell: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  macroSep: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: N.border.hairline,
    marginVertical: 6,
  },
  macroValue: {
    fontSize: 22,
    fontFamily: font.extrabold,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  macroUnit: { fontSize: 11, fontFamily: font.regular, color: N.text.tertiary, marginTop: -2 },
  macroLabel: {
    fontSize: 11,
    fontFamily: font.semibold,
    marginTop: 4,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },

  pickerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  nativePicker: {
    flex: 1,
    height: 180,
  },
  nativePickerItem: {
    fontSize: 17,
    fontFamily: font.regular,
    color: N.text.primary,
    height: 180,
  },

  cta: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#000000',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  ctaText: {
    fontSize: 16,
    fontFamily: font.semibold,
    color: '#FFFFFF',
    letterSpacing: -0.2,
    fontWeight: '600',
  },
});

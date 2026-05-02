/**
 * MealTemplateSheet — Yazio paterni öğün şablon detay sheet'i.
 *
 * Search'te bir öğüne (template) tıklayınca açılır:
 *  - Üst: ‹ Geri · Şablon adı · ⭐
 *  - Toplam makro grid
 *  - İçindeki yemekler liste — her birinin sağında "−" (çıkar) butonu
 *  - Alt: siyah pill "Hepsini ekle"
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { N, font } from '../theme';
import type { MealItem, MealTemplate } from '../api/client';

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);

type Props = {
  visible: boolean;
  template: MealTemplate | null;
  onClose: () => void;
  onAddAll: (items: MealItem[]) => void;
  onDelete?: (id: string) => void;
};

export function MealTemplateSheet({ visible, template, onClose, onAddAll, onDelete }: Props) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;
  const overlay = useRef(new Animated.Value(0)).current;

  const [removed, setRemoved] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (visible) {
      setRemoved(new Set());
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
  }, [visible, slide, overlay]);

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [800, 0] });
  const overlayOpacity = overlay.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });

  const items = template?.items ?? [];
  const remainingItems = useMemo(() => items.filter((_, i) => !removed.has(i)), [items, removed]);

  const totals = useMemo(() => {
    let c = 0,
      p = 0,
      ca = 0,
      f = 0;
    for (const it of remainingItems) {
      const q = Number(it.quantity) || 1;
      c += (it.calories || 0) * q;
      p += (it.proteinG || 0) * q;
      ca += (it.carbsG || 0) * q;
      f += (it.fatG || 0) * q;
    }
    return { calories: c, proteinG: p, carbsG: ca, fatG: f };
  }, [remainingItems]);

  if (!template) return null;

  const handleAddAll = () => {
    if (remainingItems.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAddAll(remainingItems);
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
          <View style={s.handle} />

          <View style={s.navRow}>
            <Pressable
              onPress={onClose}
              hitSlop={14}
              style={({ pressed }) => [s.navBtn, pressed && { opacity: 0.5 }]}
            >
              <Ionicons name="chevron-back" size={28} color={N.text.primary} />
            </Pressable>
            <Text style={s.navTitle} numberOfLines={1}>
              {template.name}
            </Text>
            <View style={s.navBtn}>
              {onDelete && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onDelete(template.id);
                  }}
                  hitSlop={14}
                  style={({ pressed }) => [{ alignItems: 'flex-end' }, pressed && { opacity: 0.5 }]}
                >
                  <Ionicons name="trash-outline" size={22} color={N.semantic.danger} />
                </Pressable>
              )}
            </View>
          </View>

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
            <MacroCell label="Yağ" value={totals.fatG} unit="g" color={N.macro.fat} decimals={1} />
          </View>

          <Text style={s.sectionTitle}>İçindekiler</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            <View style={s.itemsCard}>
              {items.map((it, i) => {
                const isRemoved = removed.has(i);
                return (
                  <View key={`${it.name}-${i}`} style={[s.itemRow, isRemoved && { opacity: 0.4 }]}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={[s.itemName, isRemoved && { textDecorationLine: 'line-through' }]}
                        numberOfLines={1}
                      >
                        {it.name}
                      </Text>
                      <Text style={s.itemMeta} numberOfLines={1}>
                        {it.brand ? `${it.brand} · ` : ''}
                        {Number(it.servingSize).toFixed(0)} {it.servingUnit} ×{' '}
                        {Number(it.quantity).toFixed(it.quantity % 1 === 0 ? 0 : 1)}
                      </Text>
                    </View>
                    <Text style={s.itemKcal}>
                      {Math.round((it.calories || 0) * (Number(it.quantity) || 1))} kcal
                    </Text>
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setRemoved((curr) => {
                          const next = new Set(curr);
                          if (next.has(i)) next.delete(i);
                          else next.add(i);
                          return next;
                        });
                      }}
                      hitSlop={10}
                      style={({ pressed }) => [
                        s.removeBtn,
                        isRemoved && s.removeBtnOff,
                        pressed && { opacity: 0.6 },
                      ]}
                    >
                      <Ionicons
                        name={isRemoved ? 'add' : 'remove'}
                        size={18}
                        color={isRemoved ? N.text.secondary : '#FFF'}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <Pressable
            onPress={handleAddAll}
            disabled={remainingItems.length === 0}
            style={({ pressed }) => [
              s.cta,
              remainingItems.length === 0 && { opacity: 0.4 },
              pressed && remainingItems.length > 0 && { opacity: 0.85 },
            ]}
          >
            <Text style={s.ctaText}>
              {remainingItems.length === 0
                ? 'Hiç yemek seçilmedi'
                : `${remainingItems.length} yemeği ekle`}
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
      <Text style={s.macroValue}>{display}</Text>
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
    maxHeight: '90%',
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
    color: N.text.primary,
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

  sectionTitle: {
    fontSize: 13,
    fontFamily: font.bold,
    color: N.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 22,
    marginBottom: 10,
  },

  itemsCard: {
    backgroundColor: N.bg.card,
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: N.border.hairline,
  },
  itemName: { fontSize: 15, fontFamily: font.semibold, color: N.text.primary, letterSpacing: -0.2 },
  itemMeta: { fontSize: 12, fontFamily: font.regular, color: N.text.tertiary, marginTop: 2 },
  itemKcal: {
    fontSize: 14,
    fontFamily: font.semibold,
    color: N.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: N.semantic.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnOff: {
    backgroundColor: N.bg.well,
  },

  cta: {
    marginHorizontal: 16,
    marginTop: 8,
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
  ctaText: { fontSize: 16, fontFamily: font.semibold, color: '#FFFFFF', letterSpacing: -0.2 },
});

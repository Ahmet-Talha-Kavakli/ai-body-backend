/**
 * DrinkEditModal — yeni içecek oluşturma + mevcut içeceği düzenleme bottom sheet.
 *
 * Akış:
 *  - new mode: tüm alanlar düzenlenebilir (yeni custom drink)
 *  - edit (custom): tüm alanlar düzenlenebilir + "Sil" butonu
 *  - edit (catalog): sadece size override; hidrasyon ve kafein readonly disabled
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrinkIcon, DRINK_ICON_NAMES, type DrinkIconName } from './DrinkIcons';
import type { UserDrink } from './drinksApi';
import { WheelPicker } from './WheelPicker';
import { CategoryPickerSheet, CATEGORY_OPTIONS_FULL } from './CategoryPickerSheet';
import { ColorPickerSheet } from './ColorPickerSheet';

const { height: SCREEN_H } = Dimensions.get('window');

const ACCENT = '#32ADE6';
const TEXT = '#1C1C1E';
const SUBTLE = '#8E8E93';
const BORDER = '#E5E5EA';
const DANGER = '#FF453A';
const CARD_BG = '#FFFFFF';
const ROW_PRESS_BG = '#F2F2F7';

const EASE_OUT_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN_CLOSE = Easing.bezier(0.4, 0, 1, 1);
const EASE_SMOOTH = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_MICRO = Easing.bezier(0.4, 0, 0.2, 1);

// Hex (#RRGGBB) → rgba(r,g,b,alpha) — tinted background için
function tint(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hydrationColor(pct: number) {
  if (pct < 25) return '#FF3B30';
  if (pct < 50) return '#FF9500';
  if (pct < 75) return '#FFCC00';
  if (pct < 100) return '#8CD64A';
  return '#30D158';
}

const ICON_FOR_CATEGORY: Record<string, DrinkIconName> = {
  water: 'bottle',
  tea: 'cup',
  coffee: 'mug',
  herbal: 'cup',
  juice: 'glass',
  sports: 'bottle',
  dairy: 'glass',
  smoothie: 'smoothie',
  soda: 'canister',
  alcohol: 'wineGlass',
  other: 'glass',
};

export interface DrinkFormValues {
  nametr: string;
  category: string;
  hydrationValue: number;
  caffeinePerServing: number;
  defaultServingMl: number;
  iconName: DrinkIconName;
  color: string;
}

interface DrinkEditModalProps {
  visible: boolean;
  mode: 'new' | 'edit';
  initial?: UserDrink | null;
  onClose: () => void;
  onSubmit: (values: DrinkFormValues, deleteRequested?: boolean) => Promise<void>;
}

export function DrinkEditModal({ visible, mode, initial, onClose, onSubmit }: DrinkEditModalProps) {
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nametr, setNametr] = useState('');
  const [category, setCategory] = useState('other');
  const [hydration, setHydration] = useState(100);
  const [caffeine, setCaffeine] = useState(0);
  const [size, setSize] = useState(250);
  const [iconName, setIconName] = useState<DrinkIconName>('glass');
  const [color, setColor] = useState(ACCENT);

  const [activePicker, setActivePicker] = useState<'size' | 'hydration' | 'caffeine' | null>(null);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;

  // Mount stagger anims (header, hero, metrics, category, icon, color, delete)
  const stagger = useRef(Array.from({ length: 7 }, () => new Animated.Value(0))).current;

  const isCatalogEdit = mode === 'edit' && initial?.type === 'catalog';

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setSaving(false);
      setActivePicker(null);
      if (initial) {
        setNametr(initial.nametr);
        setCategory(initial.category);
        setHydration(Math.round(initial.hydrationValue * 100));
        setCaffeine(initial.caffeinePerServing ?? 0);
        setSize(initial.defaultServingMl);
        setIconName(
          (DRINK_ICON_NAMES.includes(initial.iconName as DrinkIconName)
            ? initial.iconName
            : (ICON_FOR_CATEGORY[initial.category] ?? 'glass')) as DrinkIconName,
        );
        setColor(initial.color || ACCENT);
      } else {
        setNametr('');
        setCategory('other');
        setHydration(100);
        setCaffeine(0);
        setSize(250);
        setIconName('glass');
        setColor(ACCENT);
      }
      stagger.forEach((v) => v.setValue(0));
      requestAnimationFrame(() => {
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
        ]).start();

        Animated.stagger(
          40,
          stagger.map((v) =>
            Animated.timing(v, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
              easing: EASE_OUT_SPRING,
            }),
          ),
        ).start();
      });
    } else if (mounted) {
      Keyboard.dismiss();
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

  const handleSave = async () => {
    if (!nametr.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen içecek adını girin.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        nametr: nametr.trim(),
        category,
        hydrationValue: hydration / 100,
        caffeinePerServing: caffeine,
        defaultServingMl: size,
        iconName,
        color,
      });
    } finally {
      // onSubmit modal'ı kendisi kapatmadıysa burada kapat — "kart kapanmıyor" bug'ı için savunma
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Sil', `"${nametr}" içeceğini silmek istediğinizden emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          await onSubmit(
            {
              nametr,
              category,
              hydrationValue: hydration / 100,
              caffeinePerServing: caffeine,
              defaultServingMl: size,
              iconName,
              color,
            },
            true,
          );
          setSaving(false);
        },
      },
    ]);
  };

  if (!mounted) return null;

  const stage = (i: number) => ({
    opacity: stagger[i]!,
    transform: [
      {
        translateY: stagger[i]!.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 0],
        }),
      },
    ],
  });

  return (
    <Modal transparent animationType="none" visible={mounted} onRequestClose={onClose}>
      <Animated.View style={[s.overlay, { opacity: opAnim }]}>
        <Pressable style={s.overlayPress} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={s.handle} />

        {/* Header */}
        <Animated.View style={[s.header, stage(0)]}>
          <HeaderButton label="İptal" onPress={onClose} />
          <Text style={s.headerTitle}>{mode === 'new' ? 'Yeni İçecek' : 'Düzenle'}</Text>
          <HeaderButton
            label={saving ? '...' : 'Kaydet'}
            onPress={handleSave}
            disabled={saving}
            accent
          />
        </Animated.View>

        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero — büyük ikon + başlık + kategori chip */}
          <Animated.View style={[s.hero, stage(1)]}>
            <View style={[s.heroIconBox, { backgroundColor: tint(color, 0.1) }]}>
              <DrinkIcon name={iconName} size={44} color={color} />
            </View>
            <View style={s.heroBody}>
              {isCatalogEdit ? (
                <Text style={s.heroTitle} numberOfLines={2}>
                  {nametr}
                </Text>
              ) : (
                <TextInput
                  value={nametr}
                  onChangeText={setNametr}
                  placeholder="İçecek adı"
                  placeholderTextColor="#C7C7CC"
                  style={s.heroTitleInput}
                  maxLength={40}
                />
              )}
              <Pressable
                onPress={() => !isCatalogEdit && setCategoryPickerOpen(true)}
                disabled={isCatalogEdit}
                hitSlop={6}
              >
                <CategoryChip category={category} color={color} />
              </Pressable>
            </View>
          </Animated.View>

          {/* Üç metrik (size / hydration / caffeine) */}
          <Animated.View style={[s.metricsCard, stage(2)]}>
            <MetricRow
              label="Boyut"
              value={`${size} ml`}
              onPress={() => setActivePicker('size')}
              isLast={false}
            />
            <MetricRow
              label="Hidrasyon"
              value={`${hydration}%`}
              onPress={isCatalogEdit ? undefined : () => setActivePicker('hydration')}
              disabled={isCatalogEdit}
              hydrationPct={hydration}
              isLast={false}
            />
            <MetricRow
              label="Kafein"
              value={caffeine > 0 ? `${caffeine} mg` : 'Yok'}
              onPress={isCatalogEdit ? undefined : () => setActivePicker('caffeine')}
              disabled={isCatalogEdit}
              caffeineMg={caffeine}
              isLast
            />
          </Animated.View>

          {isCatalogEdit && (
            <View style={s.infoCard}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={ACCENT}
                style={{ marginTop: 1 }}
              />
              <Text style={s.infoCardText}>
                Hidrasyon ve kafein değerleri sistem tarafından belirlenir. Sadece porsiyon boyutunu
                özelleştirebilirsin.
              </Text>
            </View>
          )}

          {!isCatalogEdit && (
            <>
              {/* Kategori + Renk row card */}
              <Animated.View style={[s.metricsCard, stage(3), { marginTop: 16 }]}>
                <CategoryRow category={category} onPress={() => setCategoryPickerOpen(true)} />
                <ColorRow color={color} onPress={() => setColorPickerOpen(true)} />
              </Animated.View>

              {/* İkon */}
              <Animated.View style={stage(4)}>
                <Text style={s.sectionLabel}>İKON</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.iconScroll}
                >
                  {DRINK_ICON_NAMES.map((n) => (
                    <Pressable
                      key={n}
                      onPress={() => setIconName(n)}
                      style={({ pressed }) => [s.iconCell, pressed && { opacity: 0.75 }]}
                    >
                      <View
                        style={[
                          s.iconCellInner,
                          iconName === n && { backgroundColor: '#F2F8FB', borderColor: ACCENT },
                        ]}
                      >
                        <DrinkIcon name={n} size={36} color={iconName === n ? color : '#C7C7CC'} />
                      </View>
                      {iconName === n && (
                        <View style={s.iconCheck}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </Animated.View>
            </>
          )}

          {/* Sil — sadece custom edit */}
          {mode === 'edit' && initial?.type === 'custom' && <DeleteButton onPress={handleDelete} />}

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>

      {/* Wheel picker bottom sheet (size/hydration/caffeine) */}
      <ValuePicker
        visible={activePicker !== null}
        kind={activePicker}
        currentSize={size}
        currentHydration={hydration}
        currentCaffeine={caffeine}
        onClose={() => setActivePicker(null)}
        onSelectSize={(v) => setSize(v)}
        onSelectHydration={(v) => setHydration(v)}
        onSelectCaffeine={(v) => setCaffeine(v)}
      />

      {/* Kategori sheet */}
      <CategoryPickerSheet
        visible={categoryPickerOpen}
        current={category}
        onClose={() => setCategoryPickerOpen(false)}
        onSelect={(v) => setCategory(v)}
      />

      {/* Renk sheet */}
      <ColorPickerSheet
        visible={colorPickerOpen}
        current={color}
        onClose={() => setColorPickerOpen(false)}
        onSelect={(c) => setColor(c)}
      />
    </Modal>
  );
}

// ─── CategoryRow (form içinde) ─────────────────────────────────────────────────
const CATEGORY_FALLBACK = {
  value: 'other',
  label: 'Diğer',
  icon: 'glass' as const,
  color: '#8E8E93',
};

function CategoryRow({ category, onPress }: { category: string; onPress: () => void }) {
  const opt = CATEGORY_OPTIONS_FULL.find((c) => c.value === category) ?? CATEGORY_FALLBACK;
  const scale = useRef(new Animated.Value(1)).current;
  const handleIn = () =>
    Animated.timing(scale, {
      toValue: 0.99,
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

  return (
    <Pressable onPress={onPress} onPressIn={handleIn} onPressOut={handleOut}>
      <Animated.View style={[s.metricRow, s.metricRowDivider, { transform: [{ scale }] }]}>
        <Text style={s.metricLabel}>Kategori</Text>
        <View style={s.metricRight}>
          <View style={[s.miniIconBox, { backgroundColor: `${opt.color}1A` }]}>
            <DrinkIcon name={opt.icon} size={16} color={opt.color} />
          </View>
          <Text style={s.metricValue}>{opt.label}</Text>
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── ColorRow (form içinde) ────────────────────────────────────────────────────
function ColorRow({ color, onPress }: { color: string; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const handleIn = () =>
    Animated.timing(scale, {
      toValue: 0.99,
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

  return (
    <Pressable onPress={onPress} onPressIn={handleIn} onPressOut={handleOut}>
      <Animated.View style={[s.metricRow, { transform: [{ scale }] }]}>
        <Text style={s.metricLabel}>Renk</Text>
        <View style={s.metricRight}>
          <View style={[s.colorDot, { backgroundColor: color }]} />
          <Text style={s.metricValue}>{color.toUpperCase()}</Text>
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── HeaderButton ──────────────────────────────────────────────────────────────
function HeaderButton({
  label,
  onPress,
  disabled,
  accent,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const handleIn = () =>
    Animated.timing(scale, {
      toValue: 0.96,
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

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handleIn}
      onPressOut={handleOut}
      disabled={disabled}
      hitSlop={12}
    >
      <Animated.Text
        style={[
          s.headerBtn,
          accent && { color: ACCENT, fontWeight: '700' },
          disabled && { opacity: 0.5 },
          { transform: [{ scale }] },
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

// ─── DeleteButton ──────────────────────────────────────────────────────────────
function DeleteButton({ onPress }: { onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const handleIn = () =>
    Animated.timing(scale, {
      toValue: 0.98,
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

  return (
    <Pressable onPress={onPress} onPressIn={handleIn} onPressOut={handleOut}>
      <Animated.View style={[s.deleteBtn, { transform: [{ scale }] }]}>
        <Ionicons name="trash-outline" size={18} color={DANGER} />
        <Text style={s.deleteText}>İçeceği Sil</Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── MetricRow ─────────────────────────────────────────────────────────────────
function MetricRow({
  label,
  value,
  onPress,
  disabled,
  isLast,
  hydrationPct,
  caffeineMg,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  disabled?: boolean;
  isLast?: boolean;
  hydrationPct?: number;
  caffeineMg?: number;
}) {
  const bg = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const interactive = !!onPress && !disabled;

  const handleIn = () => {
    if (!interactive) return;
    Animated.parallel([
      Animated.timing(bg, {
        toValue: 1,
        duration: 120,
        useNativeDriver: false,
        easing: EASE_MICRO,
      }),
      Animated.timing(scale, {
        toValue: 0.99,
        duration: 120,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
    ]).start();
  };

  const handleOut = () => {
    if (!interactive) return;
    Animated.parallel([
      Animated.timing(bg, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
        easing: EASE_MICRO,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
    ]).start();
  };

  const bgColor = bg.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF00', ROW_PRESS_BG],
  });

  return (
    <Pressable
      onPress={interactive ? onPress : undefined}
      onPressIn={handleIn}
      onPressOut={handleOut}
      disabled={!interactive}
    >
      {/* Outer view → native driver (transform). Inner view → JS driver (color).
          Aynı view'da mixed driver kullanmak "Attempting to run JS driven animation on
          animated node that has been moved to native" hatasına yol açıyor — bu yüzden
          background ve transform iki ayrı animated view'a bölündü. */}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Animated.View
          style={[s.metricRow, !isLast && s.metricRowDivider, { backgroundColor: bgColor }]}
        >
          <Text style={[s.metricLabel, disabled && { color: '#C7C7CC' }]} numberOfLines={1}>
            {label}
          </Text>
          <View style={s.metricRight}>
            {typeof hydrationPct === 'number' && <HydrationBar pct={hydrationPct} />}
            {typeof caffeineMg === 'number' && caffeineMg > 0 && (
              <Ionicons name="cafe-outline" size={14} color={SUBTLE} style={{ marginRight: 6 }} />
            )}
            <Text style={[s.metricValue, disabled && { color: '#C7C7CC' }]} numberOfLines={1}>
              {value}
            </Text>
            {interactive && <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />}
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// ─── HydrationBar ──────────────────────────────────────────────────────────────
function HydrationBar({ pct }: { pct: number }) {
  const clamp = Math.max(0, Math.min(110, pct));
  const target = clamp / 110; // bar capacity 0..110
  const widthAnim = useRef(new Animated.Value(target)).current;
  const colorAnim = useRef(new Animated.Value(clamp)).current;
  const prev = useRef(clamp);

  useEffect(() => {
    if (prev.current === clamp) return;
    prev.current = clamp;
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: target,
        duration: 1100,
        useNativeDriver: false,
        easing: EASE_SMOOTH,
      }),
      Animated.timing(colorAnim, {
        toValue: clamp,
        duration: 1100,
        useNativeDriver: false,
        easing: EASE_SMOOTH,
      }),
    ]).start();
  }, [clamp]);

  const widthInterp = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const colorInterp = colorAnim.interpolate({
    inputRange: [0, 24, 49, 74, 99, 100, 110],
    outputRange: ['#FF3B30', '#FF9500', '#FFCC00', '#8CD64A', '#30D158', '#30D158', '#30D158'],
  });

  return (
    <View style={s.hydroTrack}>
      <Animated.View style={[s.hydroFill, { width: widthInterp, backgroundColor: colorInterp }]} />
    </View>
  );
}

// ─── CategoryChip ──────────────────────────────────────────────────────────────
function CategoryChip({ category, color }: { category: string; color: string }) {
  const fade = useRef(new Animated.Value(1)).current;
  const [shown, setShown] = useState(category);
  const prev = useRef(category);

  useEffect(() => {
    if (prev.current === category) return;
    prev.current = category;
    Animated.timing(fade, {
      toValue: 0,
      duration: 110,
      useNativeDriver: true,
      easing: EASE_SMOOTH,
    }).start(() => {
      setShown(category);
      Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
        easing: EASE_SMOOTH,
      }).start();
    });
  }, [category]);

  const label = CATEGORY_OPTIONS_FULL.find((c) => c.value === shown)?.label ?? 'Diğer';

  return (
    <Animated.View style={[s.catChip, { backgroundColor: tint(color, 0.1), opacity: fade }]}>
      <Text style={[s.catChipText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

// ─── ValuePicker (size / hydration / caffeine) ─────────────────────────────────
const SIZE_VALUES = [50, 100, 150, 200, 250, 300, 330, 400, 500, 600, 750, 1000, 1500, 2000];
const HYDRATION_VALUES = [0, 30, 50, 60, 70, 80, 90, 95, 100, 105, 110];
const CAFFEINE_VALUES = [0, 5, 10, 25, 35, 50, 80, 100, 120, 150, 200, 300];

// Tipik içecek örnekleri — kullanıcı hidrasyon değerini bilmese bile referansla seçebilsin
const HYDRATION_HINTS: Record<number, string> = {
  0: 'Sek alkol',
  30: 'Bira, şarap',
  50: 'Enerji içeceği',
  60: 'Espresso, kola',
  70: 'Kahve, smoothie',
  80: 'Süt, meyve suyu',
  90: 'Light meşrubat',
  95: 'Bitki çayı',
  100: 'Su',
  105: 'Maden suyu',
  110: 'Elektrolit içeceği',
};

const CAFFEINE_HINTS: Record<number, string> = {
  0: 'Yok',
  5: 'Sıcak çikolata',
  10: 'Kakao',
  25: 'Yeşil çay',
  35: 'Siyah çay, kola',
  50: 'Espresso shot',
  80: 'Filtre kahve',
  100: 'Americano',
  120: 'Latte, cappuccino',
  150: 'Enerji içeceği',
  200: 'Cold brew',
  300: 'Çift shot espresso',
};

function ValuePicker({
  visible,
  kind,
  currentSize,
  currentHydration,
  currentCaffeine,
  onClose,
  onSelectSize,
  onSelectHydration,
  onSelectCaffeine,
}: {
  visible: boolean;
  kind: 'size' | 'hydration' | 'caffeine' | null;
  currentSize: number;
  currentHydration: number;
  currentCaffeine: number;
  onClose: () => void;
  onSelectSize: (v: number) => void;
  onSelectHydration: (v: number) => void;
  onSelectCaffeine: (v: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [renderKind, setRenderKind] = useState<typeof kind>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && kind) {
      setMounted(true);
      setRenderKind(kind);
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
        if (finished) {
          setMounted(false);
          setRenderKind(null);
        }
      });
    }
  }, [visible, kind]);

  const config = useMemo(() => {
    const k = renderKind ?? kind;
    if (!k) return null;
    if (k === 'size') {
      return {
        title: 'Boyut',
        values: SIZE_VALUES,
        current: currentSize,
        unit: 'ml',
        unitPosition: 'after' as const,
        format: (v: number) => `${v} ml`,
        select: onSelectSize,
        hint: undefined,
      };
    }
    if (k === 'hydration') {
      return {
        title: 'Hidrasyon',
        values: HYDRATION_VALUES,
        current: currentHydration,
        unit: '%',
        unitPosition: 'before' as const, // %30 yazılır, 30% değil — WheelPicker unit'i sayıdan ÖNCE basar
        format: (v: number) => `${v}`,
        select: onSelectHydration,
        hint: (v: number) => HYDRATION_HINTS[v] ?? null,
      };
    }
    return {
      title: 'Kafein',
      values: CAFFEINE_VALUES,
      current: currentCaffeine,
      unit: 'mg',
      unitPosition: 'after' as const,
      format: (v: number) => (v === 0 ? 'Yok' : `${v} mg`),
      select: onSelectCaffeine,
      hint: (v: number) => CAFFEINE_HINTS[v] ?? null,
    };
  }, [renderKind, kind, currentSize, currentHydration, currentCaffeine]);

  if (!mounted || !config) return null;

  return (
    <View style={pkr.layer} pointerEvents="box-none">
      <Animated.View style={[pkr.overlay, { opacity: opAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[pkr.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={pkr.handle} />

        {/* Header — İptal / başlık / Tamam */}
        <View style={pkr.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={pkr.headerCancel}>İptal</Text>
          </Pressable>
          <Text style={pkr.title}>{config.title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={pkr.headerDone}>Tamam</Text>
          </Pressable>
        </View>

        {/* Apple-style wheel picker — preview yok, seçili item highlight band'da büyük durur */}
        <View style={pkr.wheelWrap}>
          <WheelPicker
            values={config.values}
            current={config.current}
            formatValue={(v) => `${v}`}
            unitLabel={config.unit}
            unitPosition={config.unitPosition}
            hint={config.hint}
            onChange={config.select}
            accent={ACCENT}
          />
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  overlayPress: { flex: 1 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_H * 0.9,
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
    paddingVertical: 14,
  },
  headerBtn: {
    fontSize: 15,
    fontWeight: '600',
    color: SUBTLE,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 4,
  },
  heroIconBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT,
    letterSpacing: -0.4,
  },
  heroTitleInput: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT,
    letterSpacing: -0.4,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  catChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    maxWidth: '100%',
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  hydroTrack: {
    width: 64,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E5EA',
    overflow: 'hidden',
    marginRight: 10,
  },
  hydroFill: {
    height: '100%',
    borderRadius: 3,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginHorizontal: 0,
  },
  infoCardText: {
    flex: 1,
    fontSize: 13,
    color: SUBTLE,
    lineHeight: 18,
  },
  metricsCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
  },
  metricRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: TEXT,
    flexShrink: 0,
    marginRight: 12,
  },
  metricRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    minWidth: 0,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '400',
    color: SUBTLE,
    textAlign: 'right',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: SUBTLE,
    letterSpacing: 0.6,
    marginTop: 24,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  iconScroll: {
    paddingRight: 12,
    paddingLeft: 4,
    gap: 12,
  },
  iconCell: {
    position: 'relative',
  },
  iconCellInner: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCheck: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: TEXT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  miniIconBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    marginRight: 2,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    marginHorizontal: 4,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FEF1F0',
  },
  deleteText: {
    fontSize: 15,
    fontWeight: '700',
    color: DANGER,
  },
});

const pkr = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_H * 0.5,
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
    fontSize: 17,
    fontWeight: '700',
    color: TEXT,
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
  previewWrap: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  previewValue: {
    fontSize: 36,
    fontWeight: '800',
    color: TEXT,
    letterSpacing: -0.6,
  },
  wheelWrap: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 32,
  },
});

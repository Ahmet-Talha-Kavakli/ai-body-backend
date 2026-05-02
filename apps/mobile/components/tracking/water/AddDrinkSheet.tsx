/**
 * AddDrinkSheet — Waterllama tarzı full-screen "İçecek Ekle" ekranı.
 *
 * Akış:
 *  1. Üst sağda X (kapat) butonu.
 *  2. Ekranın ortasında büyük bardak (placeholder; gerçek implementasyonda SkiaDrinkCup).
 *     Bardağın merkezinde dikey ↕ drag handle — kullanıcı sürükleyerek miktarı değiştirir.
 *  3. Bardağın altında büyük "250 ml" sayacı (drag ile anlık güncellenir).
 *  4. Drink rengi ile boyanmış "+ İÇECEK ADI" CTA butonu.
 *  5. Sağ altta 6-nokta menü → drink switcher alt sheet'i açar.
 *
 * Drag mekanizması:
 *  - ↕ handle Pan gesture; dY → ml farkı (negatif yön = artış).
 *  - Aralık 50 ↔ 1500 ml, 25 ml step.
 *  - Sürükleme sırasında Reanimated shared value, Animated.Value'a köprülenip ml metni
 *    ve sıvı seviyesi anlık güncellenir.
 *  - Bırakınca expo-haptics light impact.
 *
 * Animasyonlar (FitAI standardı):
 *  - Açılış slide-up 520 ms EASE_OUT_SPRING (0.16, 1, 0.3, 1).
 *  - Kapanış slide-down 460 ms EASE_IN_CLOSE (0.4, 0, 1, 1).
 *  - Drink switch cross-fade + scale 280 ms.
 *  - Buton press 120/100 ms scale 0.96 + opacity 0.92.
 *  - Sayaç hiç sıfırlanmaz, daima önceki değerden hedef değere geçer.
 *
 * Not: SkiaDrinkCup henüz yok (paralel ajan yazıyor). Yerine drink renginde
 * yumuşak kenarlı View + alttaki sıvı seviyesi yine View ile render ediliyor.
 * SkiaDrinkCup hazır olduğunda CupVisual içeriği değiştirilecek.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  Keyboard,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, {
  cancelAnimation,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
  Easing as REasing,
} from 'react-native-reanimated';

import { type UserDrink, type DrinkSourceType } from './drinksApi';
import { DrinkIcon, DRINK_ICON_NAMES, type DrinkIconName } from './DrinkIcons';
import { SkiaDrinkCup, SHAPE_LIQUID_BOUNDS, type DrinkShape } from './SkiaDrinkCup';
import { DRINK_EFFECTS, DRINK_EFFECT_LABELS_TR, type DrinkEffect } from './DrinkEffects';

// Catalog iconName Ionicons string'i olabilir → kategori bazlı DrinkIcon fallback.
const ICON_FALLBACK_BY_CATEGORY: Record<string, DrinkIconName> = {
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

function pickIconName(name: string | undefined, category: string): DrinkIconName {
  if (name && DRINK_ICON_NAMES.includes(name as DrinkIconName)) return name as DrinkIconName;
  return ICON_FALLBACK_BY_CATEGORY[category] ?? 'glass';
}

// Kategori → Skia kap şekli eşlemesi (Waterllama tarzı görsel)
const SHAPE_FOR_CATEGORY: Record<string, DrinkShape> = {
  water: 'bottle',
  tea: 'cup',
  coffee: 'mug',
  herbal: 'cup',
  juice: 'tallGlass',
  sports: 'bottle',
  dairy: 'glass',
  smoothie: 'smoothie',
  soda: 'canister',
  alcohol: 'wineGlass',
  other: 'glass',
};

// ─── Easing sabitleri (FitAI standardı) ─────────────────────────────────────
const EASE_OUT_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN_CLOSE = Easing.bezier(0.4, 0, 1, 1);
const EASE_SMOOTH = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_MICRO = Easing.bezier(0.4, 0, 0.2, 1);

const RE_OUT_SPRING = REasing.bezier(0.16, 1, 0.3, 1);
const RE_IN_CLOSE = REasing.bezier(0.4, 0, 1, 1);

// ─── Sabitler ────────────────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window');

const MIN_ML = 50;
const MAX_ML = 500;
const STEP_ML = 25;
const DRAG_ML_PER_PX = 0.7; // 1 px = 0.7 ml — yumuşak, kontrollü.

// CUP_HEIGHT — daha büyük; ekran genişliğine sığacak şekilde sınırlı.
// Mug aspectRatio 1.05 → en geniş şekil. SW - 40 yatay padding margin.
const CUP_HEIGHT = Math.min(SH * 0.5, (SW - 40) / 1.05, 460);
const CUP_WIDTH = CUP_HEIGHT * 1.05;

// Hızlı ekleme miktarları (ml) — max 500ml
const QUICK_AMOUNTS: Array<{ ml: number; label: string }> = [
  { ml: 50, label: '50' },
  { ml: 100, label: '100' },
  { ml: 150, label: '150' },
  { ml: 200, label: '200' },
  { ml: 250, label: '250' },
  { ml: 350, label: '350' },
  { ml: 500, label: '500' },
];

// Tüm bardaklar 500ml referans — drink fark etmeksizin slider 0-500 görsele uyar.
// (Eskiden kategori bazlı max'lar vardı; 350ml çay seçince mug %100 doluyordu — kaldırıldı.)

// ─── Yardımcılar ────────────────────────────────────────────────────────────
function clampMl(v: number): number {
  if (v < MIN_ML) return MIN_ML;
  if (v > MAX_ML) return MAX_ML;
  return v;
}
function snap(v: number): number {
  return Math.round(v / STEP_ML) * STEP_ML;
}
function fillRatio(ml: number): number {
  // Görsel doluluk: 0 ml'de %0, 1500 ml'de %100; kullanıcı algısı için minik bir floor.
  const r = (ml - 0) / MAX_ML;
  return Math.max(0.05, Math.min(1, r));
}

// ─── Props ──────────────────────────────────────────────────────────────────
interface AddDrinkSheetProps {
  visible: boolean;
  drinks: UserDrink[];
  currentDrinkId: string;
  onClose: () => void;
  onSubmit: (drinkId: string, type: DrinkSourceType, amountMl: number) => Promise<void>;
}

// ─── Ana bileşen ────────────────────────────────────────────────────────────
export function AddDrinkSheet({
  visible,
  drinks,
  currentDrinkId,
  onClose,
  onSubmit,
}: AddDrinkSheetProps) {
  const insets = useSafeAreaInsets();

  // ── Görünür içecek listesi ─────────────────────────────────────────────────
  const visibleDrinks = useMemo(
    () => drinks.filter((d) => d.isVisible).sort((a, b) => a.sortOrder - b.sortOrder),
    [drinks],
  );

  // ── Seçili drink ──────────────────────────────────────────────────────────
  const initialDrink =
    drinks.find((d) => d.id === currentDrinkId) ?? visibleDrinks[0] ?? drinks[0] ?? null;
  const [selectedId, setSelectedId] = useState<string>(initialDrink?.id ?? '');

  useEffect(() => {
    if (visible) setSelectedId(currentDrinkId);
  }, [visible, currentDrinkId]);

  const drink = useMemo<UserDrink | null>(
    () => drinks.find((d) => d.id === selectedId) ?? initialDrink,
    [drinks, selectedId, initialDrink],
  );

  // ── Sürüklenebilir miktar ──────────────────────────────────────────────────
  const startMl = drink?.defaultServingMl ?? 250;
  const mlSV = useSharedValue<number>(clampMl(startMl));
  const dragStartMl = useSharedValue<number>(clampMl(startMl));

  // mlSV → Animated.Value (sıvı seviyesi animasyonu için, ml metni izole).
  const mlAnim = useRef(new Animated.Value(clampMl(startMl))).current;
  const fillAnim = useRef(new Animated.Value(fillRatio(clampMl(startMl)))).current;
  const prevMl = useRef<number>(clampMl(startMl));
  // targetMl — kullanıcının seçtiği snap noktası (chip aktif state'i için).
  // Her frame değişen mlAnim'den AYRI; sadece drag-end / chip / drink değişiminde update.
  const [targetMl, setTargetMl] = useState<number>(clampMl(startMl));

  // Drink efekti — local state, her seferde yeni seçim (DB'ye yazılmaz).
  const [effect, setEffect] = useState<DrinkEffect>('none');

  const isDraggingRef = useRef(false);
  const updateMlValue = useCallback(
    (v: number) => {
      const snapped = snap(clampMl(v));
      if (snapped === prevMl.current) return;
      prevMl.current = snapped;
      if (isDraggingRef.current) {
        // Drag sırasında: instant update — kasma yok, native his.
        mlAnim.setValue(snapped);
        fillAnim.setValue(fillRatio(snapped));
      } else {
        // Chip / programatik değişim: smooth timing.
        Animated.timing(mlAnim, {
          toValue: snapped,
          duration: 1100,
          useNativeDriver: false,
          easing: EASE_SMOOTH,
        }).start();
        Animated.timing(fillAnim, {
          toValue: fillRatio(snapped),
          duration: 1100,
          useNativeDriver: false,
          easing: EASE_SMOOTH,
        }).start();
      }
    },
    [mlAnim, fillAnim],
  );

  // mlSV (worklet) → Animated.Value (JS) köprüsü.
  useAnimatedReaction(
    () => mlSV.value,
    (curr) => {
      runOnJS(updateMlValue)(curr);
    },
  );

  // Sıvı SV güncelleyici — drag esnasında her frame instant, chip/drag-end timed.
  const isDraggingSV = useSharedValue<boolean>(false);
  const visualMaxSVEarly = useSharedValue<number>(500);
  const fillTargetSVEarly = useSharedValue<number>(0.5);

  // Drag esnasında: mlSV her frame değişir → fillTargetSV worklet'inde instant set.
  // Drag dışı (chip / programatik): aşağıda smoothFillTo() ile withTiming çağırılır.
  useAnimatedReaction(
    () => ({ ml: mlSV.value, vmax: visualMaxSVEarly.value, drag: isDraggingSV.value }),
    (curr) => {
      if (!curr.drag) return;
      const ratio = curr.vmax > 0 ? curr.ml / curr.vmax : 0;
      const clamped = ratio < 0.04 ? 0.04 : ratio > 1 ? 1 : ratio;
      fillTargetSVEarly.value = clamped;
    },
  );

  // Sıvı seviyesini smooth animate eden helper (worklet/JS her ikisinden çağrılabilir).
  const smoothFillTo = useCallback(
    (targetMl: number, durationMs: number = 1100) => {
      const vmax = visualMaxSVEarly.value;
      const ratio = vmax > 0 ? targetMl / vmax : 0;
      const clamped = ratio < 0.04 ? 0.04 : ratio > 1 ? 1 : ratio;
      fillTargetSVEarly.value = withTiming(clamped, {
        duration: durationMs,
        easing: REasing.bezier(0.22, 1, 0.36, 1),
      });
    },
    [visualMaxSVEarly, fillTargetSVEarly],
  );

  // ml metni listener'ı izole AmountText component'inde — parent re-render olmaz.

  // Drink değiştiğinde default ml'e geç (önceki değerden, setValue(0) yok).
  useEffect(() => {
    if (!drink) return;
    const target = clampMl(drink.defaultServingMl ?? 250);
    mlSV.value = target;
    prevMl.current = target;
    setTargetMl(target);
    Animated.timing(mlAnim, {
      toValue: target,
      duration: 1100,
      useNativeDriver: false,
      easing: EASE_SMOOTH,
    }).start();
    Animated.timing(fillAnim, {
      toValue: fillRatio(target),
      duration: 1100,
      useNativeDriver: false,
      easing: EASE_SMOOTH,
    }).start();
    smoothFillTo(target, 1100);
  }, [drink?.id, smoothFillTo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pan gesture (yukarı = artış) ──────────────────────────────────────────
  const setDragging = useCallback((v: boolean) => {
    isDraggingRef.current = v;
  }, []);
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          dragStartMl.value = mlSV.value;
          isDraggingSV.value = true;
          runOnJS(setDragging)(true);
        })
        .onUpdate((e) => {
          const next = dragStartMl.value - e.translationY * DRAG_ML_PER_PX;
          if (next < MIN_ML) mlSV.value = MIN_ML;
          else if (next > MAX_ML) mlSV.value = MAX_ML;
          else mlSV.value = next;
        })
        .onEnd(() => {
          const snapped = Math.round(mlSV.value / STEP_ML) * STEP_ML;
          const final = snapped < MIN_ML ? MIN_ML : snapped > MAX_ML ? MAX_ML : snapped;
          mlSV.value = final;
          isDraggingSV.value = false;
          runOnJS(setTargetMl)(final);
          // Snap geçişi kısa yumuşak — sıvı son pozisyona oturur.
          const vmax = visualMaxSVEarly.value;
          const ratio = vmax > 0 ? final / vmax : 0;
          const clamped = ratio < 0.04 ? 0.04 : ratio > 1 ? 1 : ratio;
          fillTargetSVEarly.value = withTiming(clamped, {
            duration: 280,
            easing: REasing.bezier(0.22, 1, 0.36, 1),
          });
          runOnJS(triggerHaptic)();
          runOnJS(setDragging)(false);
        }),
    [mlSV, dragStartMl, setDragging, isDraggingSV],
  );

  // ── Açılış / kapanış animasyonu ───────────────────────────────────────────
  const slideY = useSharedValue<number>(SH);
  const overlayOpacity = useSharedValue<number>(0);
  const [mounted, setMounted] = useState<boolean>(visible);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  // Sıvı doluluk SV (UI thread) — chip basışta yumuşak timing, drag'de instant.
  const fillSV = useDerivedValue(() => fillTargetSVEarly.value, [fillTargetSVEarly]);

  // Sıvı yüzeyinin px cinsinden üst/alt sınırı — shape'e göre değişir.
  // CUP_HEIGHT * (top/100) → bardak içindeki sıvı en üst noktası (Canvas tepesinden).
  // CUP_HEIGHT * (bottom/100) → en alt noktası.
  const liquidTopPxSV = useSharedValue<number>(CUP_HEIGHT * 0.12);
  const liquidBottomPxSV = useSharedValue<number>(CUP_HEIGHT * 0.88);

  // Drag handle pozisyonu — mlSV (UI thread) → translateY worklet.
  // Handle bardağın GERÇEK sıvı alanı içinde hareket eder (kulp/rim hesaba katılmaz).
  // Boyut: 0ml küçük (0.5x) → 250ml büyük (1x) → 500ml küçük (0.5x). Sin parabolu.
  const handleStyle = useAnimatedStyle(() => {
    const ml = mlSV.value;
    const vmax = visualMaxSVEarly.value;
    const ratio = vmax > 0 ? ml / vmax : 0;
    const clamped = ratio < 0.04 ? 0.04 : ratio > 1 ? 1 : ratio;

    const topPx = liquidTopPxSV.value;
    const botPx = liquidBottomPxSV.value;
    // Handle Y konumu: Canvas merkezi (CUP_HEIGHT/2) referans alınmıyor — sıvı yüzeyinin
    // gerçek y'si = botPx - clamped*(botPx - topPx). Canvas merkezinden offset:
    const surfaceCenterPx = botPx - clamped * (botPx - topPx);
    const ty = surfaceCenterPx - CUP_HEIGHT / 2;

    const scale = 0.5 + 0.5 * Math.sin(Math.PI * clamped);
    return { transform: [{ translateY: ty }, { scale }] };
  });

  useEffect(() => {
    if (visible) {
      setMounted(true);
      slideY.value = withTiming(0, { duration: 520, easing: RE_OUT_SPRING });
      overlayOpacity.value = withTiming(1, { duration: 380, easing: RE_OUT_SPRING });
    } else if (mounted) {
      slideY.value = withTiming(SH, { duration: 460, easing: RE_IN_CLOSE });
      overlayOpacity.value = withTiming(0, { duration: 320, easing: RE_IN_CLOSE }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // İlk mount: visible false ise hiç render etme; useEffect sadece geçişi yönetir.
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Kaydet ────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState<boolean>(false);
  const handleSubmit = useCallback(async () => {
    if (!drink || saving) return;
    setSaving(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await onSubmit(drink.id, drink.type, snap(clampMl(mlSV.value)));
      onClose();
    } finally {
      setSaving(false);
    }
  }, [drink, mlSV, onSubmit, onClose, saving]);

  // ── Drink switcher alt sheet ──────────────────────────────────────────────
  const [switcherOpen, setSwitcherOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const switcherY = useRef(new Animated.Value(SH)).current;
  const switcherOverlay = useRef(new Animated.Value(0)).current;

  // Türkçe-uyumlu arama filtresi (i/İ, ı/I, ç, ş, ğ vb. lowercase eşitlemesi).
  const filteredDrinks = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase('tr-TR');
    if (!q) return visibleDrinks;
    return visibleDrinks.filter((d) => {
      const tr = (d.nametr || '').toLocaleLowerCase('tr-TR');
      const en = (d.nameen || '').toLocaleLowerCase('tr-TR');
      return tr.includes(q) || en.includes(q);
    });
  }, [visibleDrinks, searchQuery]);

  const openSwitcher = useCallback(async () => {
    setSwitcherOpen(true);
    await Haptics.selectionAsync();
    Animated.parallel([
      Animated.timing(switcherY, {
        toValue: 0,
        duration: 520,
        useNativeDriver: true,
        easing: EASE_OUT_SPRING,
      }),
      Animated.timing(switcherOverlay, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
        easing: EASE_OUT_SPRING,
      }),
    ]).start();
  }, [switcherY, switcherOverlay]);

  const closeSwitcher = useCallback(() => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(switcherY, {
        toValue: SH,
        duration: 460,
        useNativeDriver: true,
        easing: EASE_IN_CLOSE,
      }),
      Animated.timing(switcherOverlay, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
        easing: EASE_IN_CLOSE,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setSwitcherOpen(false);
        setSearchQuery('');
      }
    });
  }, [switcherY, switcherOverlay]);

  // Cup cross-fade için ayrı animatedlar — pickDrink'ten önce tanımlanmalı.
  const cupFade = useRef(new Animated.Value(1)).current;
  const cupScale = useRef(new Animated.Value(1)).current;

  const pickDrink = useCallback(
    async (id: string) => {
      await Haptics.selectionAsync();
      // Cross-fade scale animasyonu: drink switch (280 ms).
      Animated.sequence([
        Animated.timing(cupFade, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
          easing: EASE_IN_CLOSE,
        }),
      ]).start(() => {
        // Bardak tamamen görünmez iken fill/ml sıfırla — yeni içeceğin
        // doğru doluluk seviyesi anında ayarlanır; fade-in'de artifact olmaz.
        const newDrink = drinks.find((d) => d.id === id);
        const defaultMl = clampMl(newDrink?.defaultServingMl ?? 250);
        const ratio = Math.max(0.04, Math.min(1, defaultMl / MAX_ML));
        fillTargetSVEarly.value = ratio;
        mlSV.value = defaultMl;
        prevMl.current = defaultMl;

        setSelectedId(id);
        cupScale.setValue(0.94);

        // 1 rAF: React'ın yeni shape'i commit etmesini bekle, sonra fade-in başlat.
        requestAnimationFrame(() => {
          Animated.parallel([
            Animated.timing(cupFade, {
              toValue: 1,
              duration: 280,
              useNativeDriver: true,
              easing: EASE_OUT_SPRING,
            }),
            Animated.timing(cupScale, {
              toValue: 1,
              duration: 280,
              useNativeDriver: true,
              easing: EASE_OUT_SPRING,
            }),
          ]).start();
        });
      });
      closeSwitcher();
    },
    [closeSwitcher, drinks, fillTargetSVEarly, mlSV],
  );

  // ── Buton press feedback ──────────────────────────────────────────────────
  const ctaScale = useRef(new Animated.Value(1)).current;
  const ctaOpacity = useRef(new Animated.Value(1)).current;
  const onCtaPressIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(ctaScale, {
        toValue: 0.96,
        duration: 120,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
      Animated.timing(ctaOpacity, {
        toValue: 0.92,
        duration: 120,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
    ]).start();
  }, [ctaScale, ctaOpacity]);
  const onCtaPressOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(ctaScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
      Animated.timing(ctaOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
    ]).start();
  }, [ctaScale, ctaOpacity]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cancelAnimation(slideY);
      cancelAnimation(overlayOpacity);
      cancelAnimation(mlSV);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Bardak max kapasitesi sabit MAX_ML (500ml) — tüm drink'ler için aynı referans.
  useEffect(() => {
    visualMaxSVEarly.value = MAX_ML;
  }, [visualMaxSVEarly]);

  // Drink değişince sıvı yüzeyinin alt/üst px sınırlarını shape'e göre güncelle.
  // Handle bu sınırlara kilitli olur (mug'da rim/üst boşluk hesaba katılır).
  const drinkForBounds = drinks.find((d) => d.id === selectedId) ?? initialDrink;
  const shapeForBounds: DrinkShape = drinkForBounds
    ? (SHAPE_FOR_CATEGORY[drinkForBounds.category] ?? 'glass')
    : 'glass';
  useEffect(() => {
    const b = SHAPE_LIQUID_BOUNDS[shapeForBounds];
    liquidTopPxSV.value = withTiming(CUP_HEIGHT * (b.top / 100), {
      duration: 480,
      easing: RE_OUT_SPRING,
    });
    liquidBottomPxSV.value = withTiming(CUP_HEIGHT * (b.bottom / 100), {
      duration: 480,
      easing: RE_OUT_SPRING,
    });
  }, [shapeForBounds, liquidTopPxSV, liquidBottomPxSV]);

  if (!mounted || !drink) return null;

  const drinkColor = drink.color || '#32ADE6';
  const drinkRaw = (drink.nametr || drink.nameen || 'İçecek').trim();
  const drinkLabel =
    drinkRaw.length === 0
      ? 'İçecek'
      : drinkRaw
          .split(/\s+/)
          .map((w) =>
            w.length === 0
              ? w
              : w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1).toLocaleLowerCase('tr-TR'),
          )
          .join(' ');

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.root}>
        {/* Arka plan overlay (beyaz fade-in) */}
        <Reanimated.View pointerEvents="none" style={[styles.overlay, overlayStyle]} />

        {/* Slide-up sheet */}
        <Reanimated.View style={[styles.sheet, sheetStyle]}>
          {/* Üst bar: iOS native — sol "İptal" + orta başlık */}
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <NavButton onPress={onClose} color={drinkColor} label="İptal" />
            <Text style={styles.navTitle} numberOfLines={1}>
              {drinkLabel}
            </Text>
            <View style={styles.navBtnRight} />
          </View>

          {/* Esnek üst boşluk */}
          <View style={styles.spacerTop} />

          {/* Bardak alanı (cross-fade + scale) */}
          <Animated.View
            style={[
              styles.cupWrap,
              {
                opacity: cupFade,
                transform: [{ scale: cupScale }],
              },
            ]}
          >
            <SkiaDrinkCup
              shape={SHAPE_FOR_CATEGORY[drink.category] ?? 'glass'}
              color={drinkColor}
              effect={effect}
              fillSV={fillSV}
              size={CUP_HEIGHT}
              animated
            />
            {/* Drag handle — sıvı yüzeyine kilitli, worklet üzerinden 60fps */}
            <GestureDetector gesture={panGesture}>
              <Reanimated.View style={[styles.dragHandleWrap, handleStyle]} pointerEvents="auto">
                <View style={[styles.dragHandle, { backgroundColor: drinkColor }]}>
                  <Ionicons
                    name="chevron-up"
                    size={14}
                    color="#FFFFFF"
                    style={{ marginBottom: -4 }}
                  />
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color="#FFFFFF"
                    style={{ marginTop: -4 }}
                  />
                </View>
              </Reanimated.View>
            </GestureDetector>
          </Animated.View>

          {/* Boyut metni — izole component, parent re-render etmez */}
          <View style={styles.amountWrap}>
            <AmountText mlAnim={mlAnim} />
            <Text style={styles.amountUnit} allowFontScaling={false}>
              ml
            </Text>
          </View>

          {/* Hızlı ekleme chip'leri — Apple kalitede animasyonlu */}
          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((q, idx) => (
              <QuickChip
                key={q.ml}
                label={q.label}
                ml={q.ml}
                active={targetMl === q.ml}
                drinkColor={drinkColor}
                staggerIndex={idx}
                onPress={() => {
                  Haptics.selectionAsync();
                  mlSV.value = q.ml;
                  setTargetMl(q.ml);
                  smoothFillTo(q.ml, 1100);
                }}
              />
            ))}
          </View>

          {/* CTA butonu + sağ alt 6-nokta */}
          <View style={styles.bottomRow}>
            <View style={{ width: 40 }} />
            <Animated.View
              style={{
                transform: [{ scale: ctaScale }],
                opacity: ctaOpacity,
              }}
            >
              <Pressable
                onPress={handleSubmit}
                onPressIn={onCtaPressIn}
                onPressOut={onCtaPressOut}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel={`${drink.nametr} ekle`}
                style={[styles.cta, { backgroundColor: drinkColor }]}
              >
                <Text style={styles.ctaText}>+ {drinkLabel} Ekle</Text>
              </Pressable>
            </Animated.View>
            <Pressable
              onPress={openSwitcher}
              accessibilityRole="button"
              accessibilityLabel="İçecek değiştir"
              hitSlop={10}
              style={({ pressed }) => [
                styles.switcherBtn,
                { backgroundColor: hexWithAlpha(drinkColor, 0.16) },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="apps" size={18} color={drinkColor} />
            </Pressable>
          </View>

          {/* Animasyon — iOS UIPicker tarzı inline wheel */}
          <EffectWheel value={effect} onChange={setEffect} accent={drinkColor} />

          <View style={styles.spacerBottom} />
        </Reanimated.View>

        {/* Drink switcher alt sheet */}
        {switcherOpen && (
          <>
            <Animated.View style={[styles.switcherOverlay, { opacity: switcherOverlay }]}>
              <Pressable style={StyleSheet.absoluteFill} onPress={closeSwitcher} />
            </Animated.View>
            <Animated.View
              style={[styles.switcherSheet, { transform: [{ translateY: switcherY }] }]}
            >
              <View style={styles.grabber} />
              <View style={styles.switcherHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switcherTitle}>İçecek seç</Text>
                  <Text style={styles.switcherSubtitle}>
                    {searchQuery.trim().length > 0
                      ? `${filteredDrinks.length} sonuç`
                      : `${visibleDrinks.length} içecek`}
                  </Text>
                </View>
                <Pressable
                  onPress={closeSwitcher}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Kapat"
                  style={({ pressed }) => [styles.switcherCloseBtn, pressed && { opacity: 0.6 }]}
                >
                  <Ionicons name="close" size={18} color="#3A3A3C" />
                </Pressable>
              </View>

              {/* Search bar — iOS native field tarzı */}
              <View style={styles.searchWrap}>
                <View style={styles.searchField}>
                  <Ionicons name="search" size={16} color="#8E8E93" style={{ marginRight: 6 }} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Ara"
                    placeholderTextColor="#8E8E93"
                    style={styles.searchInput}
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="search"
                    clearButtonMode="never"
                    accessibilityLabel="İçecek ara"
                  />
                  {searchQuery.length > 0 && (
                    <Pressable
                      onPress={() => setSearchQuery('')}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Aramayı temizle"
                      style={({ pressed }) => [styles.searchClearBtn, pressed && { opacity: 0.6 }]}
                    >
                      <Ionicons name="close-circle" size={18} color="#8E8E93" />
                    </Pressable>
                  )}
                </View>
              </View>

              {filteredDrinks.length === 0 ? (
                <View style={styles.searchEmpty}>
                  <Ionicons name="search-outline" size={36} color="#C7C7CC" />
                  <Text style={styles.searchEmptyTitle}>Sonuç bulunamadı</Text>
                  <Text style={styles.searchEmptySub} numberOfLines={2}>
                    "{searchQuery.trim()}" için içecek yok
                  </Text>
                </View>
              ) : (
                <ScrollView
                  contentContainerStyle={{
                    paddingBottom: insets.bottom + 16,
                    paddingTop: 4,
                  }}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  showsVerticalScrollIndicator={false}
                >
                  {filteredDrinks.map((d, idx) => {
                    const selected = d.id === selectedId;
                    return (
                      <SwitcherRow
                        key={`${d.type}:${d.id}`}
                        drink={d}
                        selected={selected}
                        onPress={() => pickDrink(d.id)}
                        indexForStagger={idx}
                      />
                    );
                  })}
                </ScrollView>
              )}
            </Animated.View>
          </>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

// ─── Cup placeholder ─────────────────────────────────────────────────────────
// TODO: SkiaDrinkCup tamamlanınca bu komponenti onunla değiştir
//   import { SkiaDrinkCup } from './SkiaDrinkCup';
//   return <SkiaDrinkCup color={color} fill={fillAnim} />
function CupVisual({
  color,
  fillAnim,
  iconName,
}: {
  color: string;
  fillAnim: Animated.Value;
  iconName: DrinkIconName;
}) {
  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={{
        width: CUP_WIDTH,
        height: CUP_HEIGHT,
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      {/* Bardak silüeti — yumuşak köşeli kap */}
      <View style={[styles.cupSilhouette, { borderColor: hexWithAlpha(color, 0.18) }]}>
        {/* İç sıvı */}
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: fillHeight,
            backgroundColor: color,
          }}
        />
        {/* Üst hafif highlight */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 14,
            backgroundColor: '#F2F2F7',
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
            opacity: 0.9,
          }}
        />
      </View>
      {/* Köşe ikonu — küçük drink ikonu (estetik için sol üstte değil; placeholder olarak gizli) */}
      <View style={{ position: 'absolute', top: 16, left: 16, opacity: 0 }}>
        <DrinkIcon name={iconName} size={28} color={color} />
      </View>
    </View>
  );
}

// ─── EffectWheel (iOS-tarzı, WheelPicker.tsx ile aynı patern) ──────────────
const EFFECT_ITEM_H = 38;
const EFFECT_VISIBLE = 3;
const EFFECT_PICKER_H = EFFECT_ITEM_H * EFFECT_VISIBLE;

function EffectWheel({
  value,
  onChange,
  accent,
}: {
  value: DrinkEffect;
  onChange: (v: DrinkEffect) => void;
  accent: string;
}) {
  const data = DRINK_EFFECTS;
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState<number>(() => Math.max(0, data.indexOf(value)));

  useEffect(() => {
    const idx = data.indexOf(value);
    if (idx < 0) return;
    setActiveIndex(idx);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: idx * EFFECT_ITEM_H, animated: false });
      scrollY.setValue(idx * EFFECT_ITEM_H);
    });
  }, [value, data, scrollY]);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / EFFECT_ITEM_H);
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    const next = data[clamped];
    if (clamped !== activeIndex && next !== undefined) {
      setActiveIndex(clamped);
      Haptics.selectionAsync();
      onChange(next);
    }
    scrollRef.current?.scrollTo({ y: clamped * EFFECT_ITEM_H, animated: true });
  };

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
      }),
    [scrollY],
  );

  return (
    <View style={styles.effectWheelWrap}>
      <View pointerEvents="none" style={styles.effectWheelHighlight} />
      <Animated.ScrollView
        ref={scrollRef as any}
        showsVerticalScrollIndicator={false}
        snapToInterval={EFFECT_ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
        contentContainerStyle={{
          paddingTop: (EFFECT_PICKER_H - EFFECT_ITEM_H) / 2,
          paddingBottom: (EFFECT_PICKER_H - EFFECT_ITEM_H) / 2,
        }}
        style={{ height: EFFECT_PICKER_H }}
      >
        {data.map((eff, i) => {
          const opacity = scrollY.interpolate({
            inputRange: [
              (i - 2) * EFFECT_ITEM_H,
              (i - 1) * EFFECT_ITEM_H,
              i * EFFECT_ITEM_H,
              (i + 1) * EFFECT_ITEM_H,
              (i + 2) * EFFECT_ITEM_H,
            ],
            outputRange: [0.35, 0.55, 1, 0.55, 0.35],
            extrapolate: 'clamp',
          });
          const scale = scrollY.interpolate({
            inputRange: [(i - 1) * EFFECT_ITEM_H, i * EFFECT_ITEM_H, (i + 1) * EFFECT_ITEM_H],
            outputRange: [0.86, 1.08, 0.86],
            extrapolate: 'clamp',
          });
          const isCenter = i === activeIndex;
          return (
            <Animated.View
              key={eff}
              style={[styles.effectWheelItem, { opacity, transform: [{ scale }] }]}
            >
              <Text
                style={[styles.effectWheelText, isCenter && { color: accent, fontWeight: '700' }]}
                numberOfLines={1}
              >
                {DRINK_EFFECT_LABELS_TR[eff]}
              </Text>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
      {/* Üst fade */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
        style={[styles.effectWheelFade, { top: 0 }]}
      />
      {/* Alt fade */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
        style={[styles.effectWheelFade, { bottom: 0 }]}
      />
    </View>
  );
}

// ─── AmountText (izole — listener parent re-render etmez) ──────────────────
function AmountText({ mlAnim }: { mlAnim: Animated.Value }) {
  const [shown, setShown] = useState<number>(0);
  useEffect(() => {
    // İlk değeri yakala
    // @ts-ignore — _value internal API ama mount anında doğru değer.
    setShown(Math.round((mlAnim as any)._value ?? 0));
    const id = mlAnim.addListener(({ value }) => {
      const rounded = Math.round(value);
      setShown((prev) => (prev === rounded ? prev : rounded));
    });
    return () => mlAnim.removeListener(id);
  }, [mlAnim]);
  return (
    <Text style={styles.amountText} allowFontScaling={false}>
      {shown}
    </Text>
  );
}

// ─── NavButton (Apple-quality nav bar pill button) ─────────────────────────
function NavButton({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const bgProg = useSharedValue(0); // 0 idle → 1 pressed
  const animStyle = useAnimatedStyle(() => {
    const bg = interpolateColor(bgProg.value, [0, 1], ['#F2F2F7', '#E5E5EA']);
    return {
      transform: [{ scale: scale.value }],
      backgroundColor: bg,
    };
  });
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: 120 });
        bgProg.value = withTiming(1, { duration: 120 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 100 });
        bgProg.value = withTiming(0, { duration: 150 });
      }}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Reanimated.View style={[styles.navBtnPill, animStyle]}>
        <Text style={[styles.navBtnText, { color }]}>{label}</Text>
      </Reanimated.View>
    </Pressable>
  );
}

// ─── QuickChip (Apple-quality, Reanimated press + active interpolate) ──────
function QuickChip({
  label,
  ml,
  active,
  drinkColor,
  staggerIndex,
  onPress,
}: {
  label: string;
  ml: number;
  active: boolean;
  drinkColor: string;
  staggerIndex: number;
  onPress: () => void;
}) {
  // Press feedback (worklet, 60fps)
  const pressScale = useSharedValue(1);
  const pressOpacity = useSharedValue(1);
  // Active state — 0..1, interpolate ile bg + text rengi cross-fade
  const activeProg = useSharedValue(active ? 1 : 0);
  // Stagger entry — açılışta 40ms aralıklarla belirir
  const entryProg = useSharedValue(0);
  const entryY = useSharedValue(8);

  useEffect(() => {
    activeProg.value = withTiming(active ? 1 : 0, {
      duration: active ? 280 : 220,
      easing: REasing.bezier(0.22, 1, 0.36, 1),
    });
  }, [active, activeProg]);

  useEffect(() => {
    entryProg.value = withDelay(
      staggerIndex * 40,
      withTiming(1, { duration: 340, easing: REasing.bezier(0.16, 1, 0.3, 1) }),
    );
    entryY.value = withDelay(
      staggerIndex * 40,
      withTiming(0, { duration: 340, easing: REasing.bezier(0.16, 1, 0.3, 1) }),
    );
  }, [staggerIndex, entryProg, entryY]);

  const inactiveBg = '#F2F2F7';
  const inactiveText = '#3A3A3C';

  const bgStyle = useAnimatedStyle(() => {
    const bg = interpolateColor(activeProg.value, [0, 1], [inactiveBg, drinkColor]);
    return {
      backgroundColor: bg,
      transform: [
        { scale: pressScale.value * (1 + activeProg.value * 0.04) },
        { translateY: entryY.value },
      ],
      opacity: pressOpacity.value * entryProg.value,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const color = interpolateColor(activeProg.value, [0, 1], [inactiveText, '#FFFFFF']);
    return { color };
  });

  const handlePressIn = () => {
    pressScale.value = withTiming(0.94, {
      duration: 120,
      easing: REasing.bezier(0.4, 0, 0.2, 1),
    });
    pressOpacity.value = withTiming(0.85, { duration: 120 });
  };
  const handlePressOut = () => {
    pressScale.value = withTiming(1, {
      duration: 100,
      easing: REasing.bezier(0.4, 0, 0.2, 1),
    });
    pressOpacity.value = withTiming(1, { duration: 100 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`${ml} ml`}
    >
      <Reanimated.View style={[styles.quickChip, bgStyle]}>
        <Reanimated.Text style={[styles.quickChipText, textStyle]}>{label}</Reanimated.Text>
      </Reanimated.View>
    </Pressable>
  );
}

// ─── Switcher row (Apple-quality, Reanimated worklet) ──────────────────────
function SwitcherRow({
  drink,
  selected,
  onPress,
  indexForStagger,
}: {
  drink: UserDrink;
  selected: boolean;
  onPress: () => void;
  indexForStagger: number;
}) {
  // Stagger entrance — opacity + translateY + scale
  const entryOpacity = useSharedValue(0);
  const entryTy = useSharedValue(14);
  const entryScale = useSharedValue(0.96);

  // Press feedback
  const pressScale = useSharedValue(1);
  const pressOpacity = useSharedValue(1);

  // Selected state progress (0 idle → 1 selected)
  const selProg = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    entryOpacity.value = withDelay(
      indexForStagger * 40,
      withTiming(1, { duration: 380, easing: REasing.bezier(0.16, 1, 0.3, 1) }),
    );
    entryTy.value = withDelay(
      indexForStagger * 40,
      withTiming(0, { duration: 380, easing: REasing.bezier(0.16, 1, 0.3, 1) }),
    );
    entryScale.value = withDelay(
      indexForStagger * 40,
      withTiming(1, { duration: 380, easing: REasing.bezier(0.16, 1, 0.3, 1) }),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    selProg.value = withTiming(selected ? 1 : 0, {
      duration: selected ? 280 : 220,
      easing: REasing.bezier(0.22, 1, 0.36, 1),
    });
  }, [selected, selProg]);

  const drinkColor = drink.color || '#32ADE6';
  const iconName = pickIconName(drink.iconName, drink.category);
  // Worklet'lerde JS fonksiyon çağrılamaz → renkleri JS thread'de bir kere hesapla.
  const iconBg = useMemo(() => hexWithAlpha(drinkColor, 0.14), [drinkColor]);
  const selectedBg = useMemo(() => hexWithAlpha(drinkColor, 0.08), [drinkColor]);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: entryOpacity.value * pressOpacity.value,
    transform: [{ translateY: entryTy.value }, { scale: entryScale.value * pressScale.value }],
  }));

  const rowBgStyle = useAnimatedStyle(() => {
    const bg = interpolateColor(selProg.value, [0, 1], ['#FFFFFF00', selectedBg]);
    return { backgroundColor: bg };
  }, [selectedBg]);

  const checkStyle = useAnimatedStyle(() => ({
    opacity: selProg.value,
    transform: [{ scale: 0.6 + 0.4 * selProg.value }],
  }));

  return (
    <Reanimated.View style={wrapStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          pressScale.value = withTiming(0.98, {
            duration: 120,
            easing: REasing.bezier(0.4, 0, 0.2, 1),
          });
          pressOpacity.value = withTiming(0.85, { duration: 120 });
        }}
        onPressOut={() => {
          pressScale.value = withTiming(1, {
            duration: 100,
            easing: REasing.bezier(0.4, 0, 0.2, 1),
          });
          pressOpacity.value = withTiming(1, { duration: 100 });
        }}
        accessibilityRole="button"
        accessibilityLabel={drink.nametr}
        accessibilityState={{ selected }}
      >
        <Reanimated.View style={[styles.switcherRow, rowBgStyle]}>
          <View style={[styles.switcherIconWrap, { backgroundColor: iconBg }]}>
            <DrinkIcon name={iconName} size={24} color={drinkColor} />
          </View>
          <View style={styles.switcherRowText}>
            <Text style={styles.switcherRowName} numberOfLines={1}>
              {drink.nametr}
            </Text>
            <Text style={styles.switcherRowSub} numberOfLines={1}>
              {drink.defaultServingMl} ml
            </Text>
          </View>
          <Reanimated.View
            style={[styles.switcherCheck, { backgroundColor: drinkColor }, checkStyle]}
          >
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          </Reanimated.View>
        </Reanimated.View>
      </Pressable>
    </Reanimated.View>
  );
}

// ─── Yardımcı: hex + alpha ──────────────────────────────────────────────────
function hexWithAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─── Haptic helper (worklet → JS) ───────────────────────────────────────────
function triggerHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

// ─── Stiller ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 44,
  },
  navBtnLeft: {
    width: 80,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  navBtnRight: {
    width: 80,
    height: 44,
  },
  navBtnPill: {
    paddingHorizontal: 18,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: {
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: -0.4,
    lineHeight: 22,
    includeFontPadding: false,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
    lineHeight: 22,
    includeFontPadding: false,
    flex: 1,
    textAlign: 'center',
  },
  spacerTop: {
    flex: 0.4,
    minHeight: 16,
  },
  spacerBottom: {
    flex: 0.2,
    minHeight: 12,
  },
  cupWrap: {
    width: '100%',
    height: CUP_HEIGHT,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cupInner: {
    height: CUP_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cupSilhouette: {
    width: CUP_WIDTH,
    height: CUP_HEIGHT,
    borderRadius: 36,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
  },
  dragHandleWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 64,
    height: 64,
    marginTop: -32,
    // Bardağın sağ iç kenarına daha yakın — gövde merkezinden CUP_WIDTH*0.38 kadar sağa.
    marginLeft: -32 + CUP_WIDTH * 0.38,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingTop: 24,
    paddingBottom: 8,
  },
  amountText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.8,
    includeFontPadding: false,
  },
  amountUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: -0.2,
    marginLeft: 6,
    includeFontPadding: false,
  },
  effectWheelWrap: {
    height: EFFECT_PICKER_H,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    marginTop: 14,
  },
  effectWheelHighlight: {
    position: 'absolute',
    left: 32,
    right: 32,
    top: (EFFECT_PICKER_H - EFFECT_ITEM_H) / 2,
    height: EFFECT_ITEM_H,
    borderRadius: EFFECT_ITEM_H / 2,
    backgroundColor: '#F2F2F7',
  },
  effectWheelItem: {
    height: EFFECT_ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectWheelText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  effectWheelFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: EFFECT_ITEM_H * 1.2,
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  quickChip: {
    minWidth: 44,
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  cta: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 28,
    minWidth: 180,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  switcherBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Switcher
  switcherOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  switcherSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: SH * 0.78,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D1D6',
    marginBottom: 4,
  },
  switcherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  switcherTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
    lineHeight: 26,
    includeFontPadding: false,
  },
  switcherSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    letterSpacing: -0.1,
    marginTop: 3,
    includeFontPadding: false,
  },
  switcherCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    letterSpacing: -0.2,
    padding: 0,
    margin: 0,
    includeFontPadding: false,
  },
  searchClearBtn: {
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 32,
  },
  searchEmptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.3,
    marginTop: 12,
    includeFontPadding: false,
  },
  searchEmptySub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    letterSpacing: -0.1,
    marginTop: 4,
    textAlign: 'center',
    includeFontPadding: false,
  },
  switcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    marginVertical: 1,
    borderRadius: 16,
    gap: 14,
    minHeight: 64,
  },
  switcherIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switcherRowText: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  switcherRowName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.3,
    lineHeight: 20,
    includeFontPadding: false,
  },
  switcherRowSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    letterSpacing: -0.1,
    marginTop: 3,
    includeFontPadding: false,
  },
  switcherCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
});

// ESLint kullanılmayan importları engellemek için referans:
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _eases = { EASE_OUT_SPRING, EASE_IN_CLOSE, EASE_SMOOTH, EASE_MICRO };

/**
 * AiCameraScreen — Apple kalitesinde AI yemek tanıma akışı.
 *
 * 4 stage:
 *  1. tips     — büyük ipucu kartı + Devam (siyah pill)
 *  2. camera   — full-screen kamera, native shutter, frame guide
 *  3. analyzing — fotoğraf preview + skeleton + spinner
 *  4. review   — tespit edilen yemekler + porsiyon + Hepsini ekle
 *
 * Kurallar:
 *  - Sora font (theme'den font.* ile)
 *  - SF Symbols (expo-symbols) — Ionicons fallback
 *  - expo-image (RN Image yasak)
 *  - Apple easing: SPRING/CLOSE/MICRO
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@clerk/expo';
import axios from 'axios';

import { Text } from 'react-native';
import { N, font } from '../theme';
import { createMeal } from '../api/client';
import type { MealType, MealItem } from '../api/types';

const TEAL = N.accent.primary;
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);
const EASE_MICRO = Easing.bezier(0.4, 0, 0.2, 1);

type Stage = 'tips' | 'camera' | 'analyzing' | 'review';
type DetectedItem = {
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  saturatedFatG: number;
  transFatG: number;
  cholesterolMg: number;
  sodiumMg: number;
  confidence: number;
  selected: boolean;
};

type Props = {
  mealType: MealType;
  onClose: () => void;
  onAdded: () => void;
};

export default function AiCameraScreen({ mealType, onClose, onAdded }: Props) {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [stage, setStage] = useState<Stage>('tips');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [items, setItems] = useState<DetectedItem[]>([]);
  const cameraRef = useRef<CameraView | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (stage === 'camera' && !permission?.granted) requestPermission();
  }, [stage, permission, requestPermission]);

  const capture = async () => {
    if (!cameraRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
      if (pic?.uri) {
        setPhotoUri(pic.uri);
        setStage('analyzing');
        analyze(pic.uri);
      }
    } catch (e) {
      console.error('[capture]', e);
    }
  };

  const pickFromGallery = async () => {
    Haptics.selectionAsync();
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]) {
      setPhotoUri(res.assets[0].uri);
      setStage('analyzing');
      analyze(res.assets[0].uri);
    }
  };

  const analyze = async (uri: string) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('Unauthorized');

      // Backend base64 string bekliyor (JSON body)
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as any,
      });

      const res = await axios.post(
        `${BASE_URL}/api/nutrition/analyze-meal`,
        { image: base64, mealType },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          timeout: 60_000,
        },
      );
      const foods = (res.data?.analysis?.detectedFoods ??
        res.data?.detectedFoods ??
        res.data?.foods ??
        []) as any[];
      const detected: DetectedItem[] = foods.map((f) => {
        const conf = Number(f.confidence ?? 70);
        return {
          name: f.name ?? f.foodName ?? 'Bilinmeyen',
          servingSize: Number(f.servingSize ?? f.portionG ?? 100),
          servingUnit: f.servingUnit ?? 'g',
          calories: Number(f.calories ?? 0),
          proteinG: Number(f.protein ?? f.proteinG ?? 0),
          carbsG: Number(f.carbs ?? f.carbsG ?? 0),
          fatG: Number(f.fat ?? f.fatG ?? 0),
          fiberG: Number(f.fiberG ?? 0),
          sugarG: Number(f.sugarG ?? 0),
          saturatedFatG: Number(f.saturatedFatG ?? 0),
          transFatG: Number(f.transFatG ?? 0),
          cholesterolMg: Number(f.cholesterolMg ?? 0),
          sodiumMg: Number(f.sodiumMg ?? 0),
          confidence: conf,
          selected: true,
        };
      });
      setItems(detected);
      setStage('review');
    } catch (err: any) {
      // 400 = AI yemek olarak tanımadı (beklenen durum, kullanıcıya empty state göster)
      // 500/timeout = gerçek hata
      const status = err?.response?.status;
      if (status !== 400) {
        console.warn('[analyze]', err?.message ?? err);
      }
      setItems([]);
      setStage('review');
    }
  };

  const submit = async () => {
    const chosen = items.filter((i) => i.selected && i.calories > 0);
    if (chosen.length === 0) return;
    try {
      setSubmitting(true);
      const token = await getToken();
      if (!token) return;
      const mealItems: MealItem[] = chosen.map((it) => ({
        name: it.name,
        servingSize: it.servingSize,
        servingUnit: it.servingUnit,
        quantity: 1,
        calories: it.calories,
        proteinG: it.proteinG,
        carbsG: it.carbsG,
        fatG: it.fatG,
        fiberG: it.fiberG,
        sugarG: it.sugarG,
        saturatedFatG: it.saturatedFatG,
        transFatG: it.transFatG,
        cholesterolMg: it.cholesterolMg,
        sodiumMg: it.sodiumMg,
        source: 'ai',
        confidence: it.confidence,
      }));
      await createMeal(token, {
        mealType,
        items: mealItems,
        photoUrl: photoUri ?? undefined,
        source: 'ai_photo',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAdded();
    } catch (err) {
      console.error('[submit ai]', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  // ── STAGE: TIPS ────────────────────────────
  if (stage === 'tips') {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Header onClose={onClose} title="Yemek fotoğrafı" />

        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8 }}>
          {/* Hero ikon */}
          <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 32 }}>
            <View style={styles.heroCircle}>
              <SymbolView
                name="camera.fill"
                size={56}
                tintColor={TEAL}
                fallback={<Ionicons name="camera" size={56} color={TEAL} />}
              />
            </View>
            <Text style={styles.heroTitle}>Yemeği fotoğrafla</Text>
            <Text style={styles.heroSub}>FitAI yemeği tanıyıp besin değerlerini hesaplar</Text>
          </View>

          {/* İpuçları kartı */}
          <View style={styles.tipsCard}>
            <Tip sf="square.dashed" ion="scan-outline" text="Tüm yemeği kareye sığdır" />
            <View style={styles.tipDivider} />
            <Tip sf="eye" ion="eye-outline" text="Her yemeği net göster" />
            <View style={styles.tipDivider} />
            <Tip sf="lightbulb" ion="bulb-outline" text="İyi ışık kullan" />
          </View>
        </View>

        {/* CTA — siyah pill */}
        <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setStage('camera');
            }}
            style={{
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
              Devam
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── STAGE: CAMERA ──────────────────────────
  if (stage === 'camera') {
    if (!permission) return null;
    if (!permission.granted) {
      return (
        <View
          style={[
            styles.root,
            { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center', padding: 24 },
          ]}
        >
          <Text style={styles.permTitle}>Kamera izni gerekli</Text>
          <Text style={styles.permSub}>FitAI yemeği analiz etmek için kameraya erişmeli</Text>
          <Pressable
            onPress={requestPermission}
            style={{
              backgroundColor: '#000000',
              borderRadius: 100,
              paddingVertical: 14,
              paddingHorizontal: 32,
              marginTop: 24,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: font.semibold,
                color: '#FFFFFF',
                letterSpacing: -0.2,
              }}
            >
              İzin ver
            </Text>
          </Pressable>
          <Pressable onPress={onClose} hitSlop={12} style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 15, fontFamily: font.medium, color: N.text.secondary }}>
              İptal
            </Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView ref={cameraRef as any} style={StyleSheet.absoluteFill} facing="back" />

        {/* Top blur header */}
        <View style={[styles.cameraTop, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => setStage('tips')} hitSlop={14} style={styles.camIconBtn}>
            <SymbolView
              name="chevron.left"
              size={20}
              tintColor="#FFFFFF"
              fallback={<Ionicons name="chevron-back" size={22} color="#FFFFFF" />}
            />
          </Pressable>
          <Text style={styles.cameraTitle}>FitAI</Text>
          <View style={styles.camIconBtn} />
        </View>

        {/* Frame guide */}
        <View style={styles.frame} pointerEvents="none">
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>

        <Text style={styles.cameraHint}>Yemeğin tamamı kareye sığsın</Text>

        {/* Bottom controls */}
        <View style={[styles.cameraBottom, { paddingBottom: insets.bottom + 24 }]}>
          <Pressable onPress={pickFromGallery} hitSlop={12} style={styles.galleryBtn}>
            <SymbolView
              name="photo.on.rectangle"
              size={26}
              tintColor="#FFFFFF"
              fallback={<Ionicons name="images-outline" size={26} color="#FFFFFF" />}
            />
            <Text style={styles.galleryText}>Galeri</Text>
          </Pressable>

          <Pressable
            onPress={capture}
            style={({ pressed }) => [styles.shutter, pressed && { transform: [{ scale: 0.94 }] }]}
          >
            <View style={styles.shutterInner} />
          </Pressable>

          <View style={styles.galleryBtn} />
        </View>
      </View>
    );
  }

  // ── STAGE: ANALYZING ───────────────────────
  if (stage === 'analyzing') {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Header onClose={onClose} title="Analiz ediliyor" />

        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          {photoUri && (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
          )}

          <View style={{ marginTop: 20, gap: 10 }}>
            <SkeletonLine width="80%" />
            <SkeletonLine width="60%" />
            <SkeletonLine width="70%" />
          </View>

          <View style={{ alignItems: 'center', marginTop: 28 }}>
            <ActivityIndicator color={TEAL} size="large" />
            <Text style={styles.analyzingText}>AI yemekleri tanıyor…</Text>
          </View>
        </View>
      </View>
    );
  }

  // ── STAGE: REVIEW ──────────────────────────
  const selectedCount = items.filter((i) => i.selected).length;
  const totalKcal = items.filter((i) => i.selected).reduce((s, i) => s + i.calories, 0);
  const totalProtein = items.filter((i) => i.selected).reduce((s, i) => s + i.proteinG, 0);
  const totalCarbs = items.filter((i) => i.selected).reduce((s, i) => s + i.carbsG, 0);
  const totalFat = items.filter((i) => i.selected).reduce((s, i) => s + i.fatG, 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Header onClose={onClose} title="Sonuçlar" />

      <FlatList
        data={items}
        keyExtractor={(_, i) => `i-${i}`}
        contentContainerStyle={{ paddingBottom: 140 }}
        ListHeaderComponent={
          items.length > 0 ? (
            <>
              {/* Compact photo + ai badge */}
              {photoUri && (
                <View style={styles.heroPhotoWrap}>
                  <Image source={{ uri: photoUri }} style={styles.heroPhoto} contentFit="cover" />
                  <View style={styles.aiBadge}>
                    <SymbolView
                      name="sparkles"
                      size={11}
                      tintColor="#FFFFFF"
                      fallback={<Ionicons name="sparkles" size={11} color="#FFFFFF" />}
                    />
                    <Text style={styles.aiBadgeText}>AI tespit</Text>
                  </View>
                </View>
              )}

              {/* Macro summary card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Text style={styles.summaryLabel}>Toplam</Text>
                  <Text style={styles.summaryCount}>{selectedCount} yemek</Text>
                </View>
                <View style={styles.summaryRow}>
                  <SummaryCell
                    value={Math.round(totalKcal)}
                    unit="kcal"
                    label="Kalori"
                    color={N.accent.primary}
                  />
                  <View style={styles.summarySep} />
                  <SummaryCell
                    value={totalProtein}
                    unit="g"
                    label="Protein"
                    color={N.macro.protein}
                    decimals={1}
                  />
                  <View style={styles.summarySep} />
                  <SummaryCell
                    value={totalCarbs}
                    unit="g"
                    label="Karb"
                    color={N.macro.carbs}
                    decimals={1}
                  />
                  <View style={styles.summarySep} />
                  <SummaryCell
                    value={totalFat}
                    unit="g"
                    label="Yağ"
                    color={N.macro.fat}
                    decimals={1}
                  />
                </View>
              </View>

              {/* Section title */}
              <Text style={styles.sectionTitle}>Tespit edilen yemekler</Text>
            </>
          ) : null
        }
        renderItem={({ item, index }) => (
          <DetectedRow
            item={item}
            isFirst={index === 0}
            isLast={index === items.length - 1}
            onToggle={() =>
              setItems((arr) =>
                arr.map((it, i) => (i === index ? { ...it, selected: !it.selected } : it)),
              )
            }
            onChange={(patch) =>
              setItems((arr) => arr.map((it, i) => (i === index ? { ...it, ...patch } : it)))
            }
            onRemove={() => setItems((arr) => arr.filter((_, i) => i !== index))}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.itemSep} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
            {photoUri && (
              <Image
                source={{ uri: photoUri }}
                style={[styles.heroPhoto, { marginBottom: 24 }]}
                contentFit="cover"
              />
            )}
            <View style={styles.emptyIconWrap}>
              <SymbolView
                name="exclamationmark.triangle.fill"
                size={28}
                tintColor="#FF9500"
                fallback={<Ionicons name="alert-circle" size={28} color="#FF9500" />}
              />
            </View>
            <Text style={styles.emptyTitle}>Yemek tespit edilemedi</Text>
            <Text style={styles.emptySub}>Daha net bir fotoğraf çek veya farklı açı dene</Text>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setStage('tips');
              }}
              style={{
                marginTop: 24,
                backgroundColor: '#000000',
                borderRadius: 100,
                paddingVertical: 14,
                paddingHorizontal: 32,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: font.semibold,
                  color: '#FFFFFF',
                  letterSpacing: -0.2,
                }}
              >
                Tekrar çek
              </Text>
            </Pressable>
          </View>
        }
      />

      {selectedCount > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 14 }]}>
          <Pressable
            onPress={submit}
            disabled={submitting}
            style={{
              backgroundColor: '#000000',
              borderRadius: 100,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: submitting ? 0.6 : 1,
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
              {submitting ? 'Ekleniyor…' : `${selectedCount} yemeği ekle`}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ── COMPONENTS ─────────────────────────────

function Header({ onClose, title }: { onClose: () => void; title: string }) {
  return (
    <View style={styles.headerRow}>
      <Pressable
        onPress={onClose}
        hitSlop={14}
        style={({ pressed }) => [pressed && { opacity: 0.5 }]}
      >
        <SymbolView
          name="xmark"
          size={20}
          tintColor={N.text.primary}
          fallback={<Ionicons name="close" size={26} color={N.text.primary} />}
        />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 26 }} />
    </View>
  );
}

function Tip({ sf, ion, text }: { sf: SFSymbol; ion: any; text: string }) {
  return (
    <View style={styles.tipRow}>
      <View style={styles.tipIconWrap}>
        <SymbolView
          name={sf}
          size={18}
          tintColor={TEAL}
          fallback={<Ionicons name={ion} size={18} color={TEAL} />}
        />
      </View>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

function SkeletonLine({ width }: { width: any }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
          easing: EASE_SPRING,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
          easing: EASE_CLOSE,
        }),
      ]),
    ).start();
  }, [opacity]);
  return (
    <Animated.View
      style={{ height: 14, width, borderRadius: 4, backgroundColor: N.bg.card, opacity }}
    />
  );
}

function SummaryCell({
  value,
  unit,
  label,
  color,
  decimals = 0,
}: {
  value: number;
  unit: string;
  label: string;
  color: string;
  decimals?: number;
}) {
  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}>
      <Text style={styles.summaryValue}>{display}</Text>
      <Text style={styles.summaryUnit}>{unit}</Text>
      <Text style={[styles.summarySubLabel, { color }]}>{label}</Text>
    </View>
  );
}

function DetectedRow({
  item,
  isFirst,
  isLast,
  onToggle,
  onChange,
  onRemove,
}: {
  item: DetectedItem;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onChange: (p: Partial<DetectedItem>) => void;
  onRemove: () => void;
}) {
  // confidence backend'den 0-100 arası gelir
  const confidencePercent = Math.min(
    100,
    Math.max(0, Math.round(item.confidence > 1 ? item.confidence : item.confidence * 100)),
  );

  const radius = {
    borderTopLeftRadius: isFirst ? 16 : 0,
    borderTopRightRadius: isFirst ? 16 : 0,
    borderBottomLeftRadius: isLast ? 16 : 0,
    borderBottomRightRadius: isLast ? 16 : 0,
  };

  return (
    <View style={[styles.detectedRow, radius, !item.selected && { opacity: 0.45 }]}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onToggle();
        }}
        hitSlop={8}
        style={[styles.checkbox, item.selected && styles.checkboxOn]}
      >
        {item.selected && (
          <SymbolView
            name="checkmark"
            size={13}
            tintColor="#FFFFFF"
            fallback={<Ionicons name="checkmark" size={15} color="#FFFFFF" />}
          />
        )}
      </Pressable>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.detectedName} numberOfLines={1}>
            {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
          </Text>
          {confidencePercent >= 75 && (
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceBadgeText}>%{confidencePercent}</Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <View style={styles.qtyRow}>
            <TextInput
              style={styles.qtyInput}
              value={item.servingSize.toString()}
              onChangeText={(v) =>
                onChange({ servingSize: Number(v.replace(/[^\d.,]/g, '').replace(',', '.')) || 0 })
              }
              keyboardType="numeric"
            />
            <Text style={styles.qtyUnit}>{item.servingUnit}</Text>
          </View>
          <Text style={styles.detectedKcal}>{Math.round(item.calories)} kcal</Text>
        </View>
      </View>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onRemove();
        }}
        hitSlop={12}
        style={({ pressed }) => [{ padding: 4 }, pressed && { opacity: 0.5 }]}
      >
        <SymbolView
          name="minus.circle.fill"
          size={22}
          tintColor={N.semantic.danger}
          fallback={<Ionicons name="remove-circle" size={22} color={N.semantic.danger} />}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: N.bg.page },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: font.semibold,
    color: N.text.primary,
    letterSpacing: -0.3,
  },

  // Tips stage
  heroCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(20, 184, 166, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: font.bold,
    color: N.text.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 15,
    fontFamily: font.regular,
    color: N.text.secondary,
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  tipsCard: {
    backgroundColor: N.bg.card,
    borderRadius: 18,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(20, 184, 166, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    fontFamily: font.medium,
    color: N.text.primary,
    letterSpacing: -0.2,
  },
  tipDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: N.border.hairline,
    marginLeft: 60,
  },

  // Permission stage
  permTitle: {
    fontSize: 22,
    fontFamily: font.bold,
    color: N.text.primary,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  permSub: {
    fontSize: 15,
    fontFamily: font.regular,
    color: N.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: -0.2,
    lineHeight: 22,
  },

  // Camera stage
  cameraTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  cameraTitle: {
    fontSize: 17,
    fontFamily: font.semibold,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  camIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 280,
    height: 280,
    alignSelf: 'center',
    position: 'absolute',
    top: '30%',
    left: '50%',
    marginLeft: -140,
  },
  corner: {
    width: 32,
    height: 32,
    position: 'absolute',
    borderColor: '#FFFFFF',
    borderWidth: 0,
  },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  cameraHint: {
    position: 'absolute',
    bottom: 180,
    left: 0,
    right: 0,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: font.medium,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  cameraBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  galleryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 60,
    paddingVertical: 6,
  },
  galleryText: { color: '#FFFFFF', fontSize: 11, fontFamily: font.medium, letterSpacing: -0.1 },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },

  // Analyzing stage
  photoPreview: {
    width: '100%',
    height: 240,
    borderRadius: 18,
    backgroundColor: N.bg.card,
  },
  analyzingText: {
    color: N.text.tertiary,
    fontSize: 13,
    fontFamily: font.medium,
    marginTop: 10,
    letterSpacing: -0.1,
  },

  // Review stage — Apple grouped list pattern
  heroPhotoWrap: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  heroPhoto: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    backgroundColor: N.bg.card,
  },
  aiBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  aiBadgeText: {
    fontSize: 11,
    fontFamily: font.semibold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  summaryCard: {
    backgroundColor: N.bg.card,
    marginHorizontal: 16,
    borderRadius: 16,
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 16,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: font.bold,
    color: N.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryCount: {
    fontSize: 13,
    fontFamily: font.semibold,
    color: N.text.secondary,
    letterSpacing: -0.1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summarySep: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: N.border.hairline,
    alignSelf: 'stretch',
    marginVertical: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: font.extrabold,
    color: N.text.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  summaryUnit: {
    fontSize: 10,
    fontFamily: font.regular,
    color: N.text.tertiary,
    marginTop: -2,
  },
  summarySubLabel: {
    fontSize: 11,
    fontFamily: font.semibold,
    marginTop: 4,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  sectionTitle: {
    fontSize: 13,
    fontFamily: font.bold,
    color: N.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 22,
    marginBottom: 8,
  },

  detectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: N.bg.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
  },
  itemSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: N.border.hairline,
    marginLeft: 16 + 16 + 22 + 12,
    marginRight: 16,
    backgroundColor: N.border.hairline,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: N.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: TEAL, borderColor: TEAL },

  detectedName: {
    fontSize: 16,
    fontFamily: font.semibold,
    color: N.text.primary,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(20,184,166,0.14)',
  },
  confidenceBadgeText: {
    fontSize: 10,
    fontFamily: font.bold,
    color: N.accent.primaryDim,
    letterSpacing: 0.2,
  },

  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: N.bg.well,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 3,
  },
  qtyInput: {
    fontSize: 13,
    fontFamily: font.semibold,
    color: N.text.primary,
    minWidth: 28,
    padding: 0,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.1,
  },
  qtyUnit: {
    fontSize: 12,
    fontFamily: font.medium,
    color: N.text.tertiary,
  },
  detectedKcal: {
    fontSize: 13,
    fontFamily: font.semibold,
    color: N.text.secondary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.1,
  },

  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,149,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: font.bold,
    color: N.text.primary,
    letterSpacing: -0.3,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: font.regular,
    color: N.text.tertiary,
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: -0.1,
    lineHeight: 20,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: N.bg.page,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: N.border.hairline,
  },
});

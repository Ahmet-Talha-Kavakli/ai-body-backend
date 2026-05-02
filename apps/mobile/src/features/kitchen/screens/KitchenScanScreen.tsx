/**
 * KitchenScanScreen — buzdolabı taraması.
 *
 * Aşamalar:
 *  1. tips: foto çekim ipuçları
 *  2. camera: foto çek
 *  3. analyzing: AI işliyor (skeleton)
 *  4. review: tanınan ürünler listesi (☑ + miktar/expire düzenleme)
 *  5. saved: bulk kaydet
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  DeviceEventEmitter,
  Easing,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@clerk/expo';
import axios from 'axios';

import { N, font } from '../../nutrition/theme';
import { bulkCreatePantryItems, scanPantryPhoto } from '../api/client';
import type { ScannedItem } from '../api/types';

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

type Stage = 'tips' | 'camera' | 'analyzing' | 'review';

type ReviewItem = ScannedItem & { selected: boolean };

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export default function KitchenScanScreen({ visible, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();

  const [stage, setStage] = useState<Stage>('tips');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);

  const overlay = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(overlay, {
      toValue: visible ? 1 : 0,
      duration: visible ? 380 : 320,
      useNativeDriver: true,
      easing: visible ? EASE_SPRING : EASE_CLOSE,
    }).start();
    if (!visible) {
      // reset
      setTimeout(() => {
        setStage('tips');
        setPhotoUri(null);
        setItems([]);
      }, 400);
    }
  }, [visible, overlay]);

  useEffect(() => {
    if (stage === 'camera' && !permission?.granted) {
      requestPermission();
    }
  }, [stage, permission, requestPermission]);

  const capture = async () => {
    if (!cameraRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: true });
      if (pic?.uri && pic.base64) {
        setPhotoUri(pic.uri);
        setStage('analyzing');
        analyze(pic.base64);
      }
    } catch (e) {
      console.error('[capture]', e);
    }
  };

  const pickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (!res.canceled && res.assets[0]?.base64) {
      setPhotoUri(res.assets[0].uri);
      setStage('analyzing');
      analyze(res.assets[0].base64);
    }
  };

  const analyze = async (base64: string) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No token');
      const { items: scanned } = await scanPantryPhoto(token, base64);
      const reviewItems: ReviewItem[] = (scanned ?? []).map((it) => ({ ...it, selected: true }));
      setItems(reviewItems);
      setStage('review');
    } catch (err) {
      console.error('[scan]', err);
      Alert.alert('Hata', 'Görsel analiz edilemedi. Tekrar dene.');
      setStage('tips');
    }
  };

  const submit = async () => {
    const chosen = items.filter((i) => i.selected && i.name.trim());
    if (chosen.length === 0) {
      Alert.alert('Uyarı', 'Hiç ürün seçilmedi.');
      return;
    }
    try {
      setSubmitting(true);
      const token = await getToken();
      if (!token) return;
      await bulkCreatePantryItems(
        token,
        chosen.map((c) => ({
          name: c.name,
          category: c.category,
          quantity: c.quantity,
          unit: c.unit,
          expiresAt: c.expiresAt,
        })),
        'photo_scan',
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      DeviceEventEmitter.emit('pantry:dirty');
      onSaved();
    } catch (err) {
      console.error('[bulk save]', err);
      Alert.alert('Hata', 'Kayıt başarısız.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateItem = (idx: number, patch: Partial<ReviewItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: overlay }]}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <Pressable onPress={onClose} hitSlop={12} style={styles.headerSide}>
              <Text style={styles.headerCancel}>{stage === 'review' ? 'İptal' : 'Kapat'}</Text>
            </Pressable>
            <Text style={styles.headerTitle}>
              {stage === 'tips' && 'Buzdolabını tara'}
              {stage === 'camera' && 'Foto çek'}
              {stage === 'analyzing' && 'Analiz ediliyor'}
              {stage === 'review' && `${items.filter((i) => i.selected).length} ürün`}
            </Text>
            {stage === 'review' ? (
              <Pressable
                onPress={submit}
                hitSlop={12}
                disabled={submitting}
                style={[styles.headerSide, { alignItems: 'flex-end' }]}
              >
                {submitting ? (
                  <ActivityIndicator color={N.accent.primary} />
                ) : (
                  <Text style={styles.headerSave}>Kaydet</Text>
                )}
              </Pressable>
            ) : (
              <View style={styles.headerSide} />
            )}
          </View>

          {/* Stage: tips */}
          {stage === 'tips' && (
            <View style={{ flex: 1 }}>
              <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>
                {/* Hero ikon + başlık */}
                <View style={{ alignItems: 'center', marginBottom: 28 }}>
                  <View
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: 26,
                      backgroundColor: N.accent.soft,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <Text style={{ fontSize: 48 }}>🧊</Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 24,
                      fontFamily: font.bold,
                      color: N.text.primary,
                      letterSpacing: -0.5,
                    }}
                  >
                    İpuçları
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: font.regular,
                      color: N.text.secondary,
                      marginTop: 6,
                      textAlign: 'center',
                      letterSpacing: -0.1,
                      lineHeight: 20,
                    }}
                  >
                    En iyi sonuç için aşağıdakileri uygula
                  </Text>
                </View>

                {/* İpuçları kartı */}
                <View
                  style={{
                    backgroundColor: N.bg.card,
                    borderRadius: 18,
                    paddingHorizontal: 4,
                    shadowColor: '#000',
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 1 },
                  }}
                >
                  <Tip
                    sf="lightbulb"
                    ion="bulb-outline"
                    text="Buzdolabını aç, tüm rafları çerçeveye al"
                  />
                  <View style={styles.tipDivider} />
                  <Tip
                    sf="sun.max"
                    ion="sunny-outline"
                    text="İyi aydınlatılmış olsun, parlama olmasın"
                  />
                  <View style={styles.tipDivider} />
                  <Tip sf="eye" ion="eye-outline" text="Ürünler net görünsün, üst üste durmasın" />
                  <View style={styles.tipDivider} />
                  <Tip
                    sf="hand.raised"
                    ion="hand-left-outline"
                    text="Açık paketler tek kalem olarak sayılır"
                  />
                </View>
              </View>

              {/* Butonlar — Apple inline pill */}
              <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16, gap: 10 }}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setStage('camera');
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: '#000000',
                    borderRadius: 100,
                    paddingVertical: 16,
                    shadowColor: '#000',
                    shadowOpacity: 0.18,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 3 },
                  }}
                >
                  <SymbolView
                    name="camera.fill"
                    size={18}
                    tintColor="#FFFFFF"
                    fallback={<Ionicons name="camera" size={20} color="#FFFFFF" />}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: font.semibold,
                      color: '#FFFFFF',
                      letterSpacing: -0.2,
                    }}
                  >
                    Fotoğraf çek
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    pickFromGallery();
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: N.bg.card,
                    borderRadius: 100,
                    paddingVertical: 16,
                  }}
                >
                  <SymbolView
                    name="photo.on.rectangle"
                    size={18}
                    tintColor={N.text.primary}
                    fallback={<Ionicons name="images-outline" size={20} color={N.text.primary} />}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: font.semibold,
                      color: N.text.primary,
                      letterSpacing: -0.2,
                    }}
                  >
                    Galeriden seç
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Stage: camera */}
          {stage === 'camera' && (
            <View style={styles.cameraRoot}>
              {!permission ? (
                <View style={styles.permissionBox}>
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              ) : !permission.granted ? (
                <View style={styles.permissionBox}>
                  <Text style={styles.permissionText}>Kamera izni gerekli</Text>
                  <Pressable onPress={requestPermission} style={styles.primaryBtn}>
                    <Text style={styles.primaryBtnText}>İzin ver</Text>
                  </Pressable>
                </View>
              ) : (
                <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
              )}
              <View style={[styles.cameraControls, { paddingBottom: insets.bottom + 24 }]}>
                <View style={styles.cameraSideSlot} />
                <Pressable
                  onPress={capture}
                  style={({ pressed }) => [
                    styles.shutter,
                    pressed && { transform: [{ scale: 0.96 }] },
                  ]}
                >
                  <View style={styles.shutterInner} />
                </Pressable>
                <Pressable onPress={pickFromGallery} hitSlop={12} style={styles.cameraSideSlot}>
                  <Ionicons name="images" size={28} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          )}

          {/* Stage: analyzing */}
          {stage === 'analyzing' && (
            <View style={styles.analyzingRoot}>
              {photoUri && <Image source={{ uri: photoUri }} style={styles.analyzingPhoto} />}
              <View style={styles.analyzingOverlay}>
                <ActivityIndicator color="#FFFFFF" size="large" />
                <Text style={styles.analyzingText}>Buzdolabı analiz ediliyor</Text>
                <Text style={styles.analyzingSub}>AI ürünleri tanıyor…</Text>
              </View>
            </View>
          )}

          {/* Stage: review */}
          {stage === 'review' && (
            <FlatList
              data={items}
              keyExtractor={(_, i) => `${i}`}
              ListHeaderComponent={
                <View>
                  {photoUri && <Image source={{ uri: photoUri }} style={styles.reviewHero} />}
                  <Text style={styles.reviewSubtitle}>
                    Tanınan ürünler. Onaylamadıklarını seç ve kaydet.
                  </Text>
                </View>
              }
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyEmoji}>🤔</Text>
                  <Text style={styles.emptyTitle}>Hiçbir ürün tanınamadı</Text>
                  <Text style={styles.emptySub}>Daha net bir foto ile tekrar dene.</Text>
                  <Pressable
                    onPress={() => setStage('tips')}
                    style={[styles.primaryBtn, { marginTop: 16 }]}
                  >
                    <Text style={styles.primaryBtnText}>Tekrar dene</Text>
                  </Pressable>
                </View>
              }
              renderItem={({ item, index }) => (
                <ReviewRow
                  item={item}
                  onToggle={() => updateItem(index, { selected: !item.selected })}
                  onChangeName={(name) => updateItem(index, { name })}
                  onChangeQty={(quantity) => updateItem(index, { quantity })}
                  onChangeUnit={(unit) => updateItem(index, { unit })}
                  onRemove={() => removeItem(index)}
                />
              )}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

function Tip({ sf, ion, text }: { sf: SFSymbol; ion: any; text: string }) {
  return (
    <View style={styles.tipRow}>
      <View style={styles.tipIcon}>
        <SymbolView
          name={sf}
          size={18}
          tintColor={N.accent.primary}
          fallback={<Ionicons name={ion} size={18} color={N.accent.primary} />}
        />
      </View>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

function ReviewRow({
  item,
  onToggle,
  onChangeName,
  onChangeQty,
  onChangeUnit,
  onRemove,
}: {
  item: ReviewItem;
  onToggle: () => void;
  onChangeName: (name: string) => void;
  onChangeQty: (q: number | null) => void;
  onChangeUnit: (u: string | null) => void;
  onRemove: () => void;
}) {
  return (
    <View style={[styles.reviewCard, !item.selected && { opacity: 0.45 }]}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onToggle();
        }}
        hitSlop={8}
        style={styles.checkbox}
      >
        {item.selected ? (
          <Ionicons name="checkmark-circle" size={26} color={N.accent.primary} />
        ) : (
          <Ionicons name="ellipse-outline" size={26} color={N.text.tertiary} />
        )}
      </Pressable>

      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <TextInput
          value={item.name}
          onChangeText={onChangeName}
          style={styles.reviewName}
          placeholder="Ürün adı"
          placeholderTextColor={N.text.tertiary}
        />
        <View style={styles.reviewMetaRow}>
          <TextInput
            value={item.quantity != null ? String(item.quantity) : ''}
            onChangeText={(t) => onChangeQty(t ? parseFloat(t) || null : null)}
            keyboardType="numeric"
            placeholder="Miktar"
            placeholderTextColor={N.text.tertiary}
            style={styles.reviewQty}
          />
          <TextInput
            value={item.unit ?? ''}
            onChangeText={(t) => onChangeUnit(t || null)}
            placeholder="birim"
            placeholderTextColor={N.text.tertiary}
            style={styles.reviewUnit}
          />
          <View style={styles.reviewCatChip}>
            <Text style={styles.reviewCatText}>{item.category ?? 'diğer'}</Text>
          </View>
        </View>
      </View>

      <Pressable onPress={onRemove} hitSlop={8} style={styles.removeBtn}>
        <Ionicons name="close-circle" size={22} color={N.text.tertiary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { flex: 1, backgroundColor: N.bg.page },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: N.bg.page,
    zIndex: 2,
  },
  headerSide: { width: 70 },
  headerCancel: {
    fontSize: 17,
    color: N.text.secondary,
    fontFamily: font.regular,
    letterSpacing: -0.2,
  },
  headerSave: {
    fontSize: 17,
    color: N.accent.primary,
    fontFamily: font.semibold,
    letterSpacing: -0.2,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: font.semibold,
    color: N.text.primary,
    letterSpacing: -0.3,
    fontWeight: '600',
  },

  // Tips
  tipsRoot: { flex: 1, alignItems: 'center', paddingTop: 32 },
  tipsIcon: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: N.accent.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsTitle: {
    fontSize: 24,
    fontFamily: font.bold,
    color: N.text.primary,
    marginTop: 18,
    letterSpacing: -0.4,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(20, 184, 166, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    fontSize: 15,
    color: N.text.primary,
    fontFamily: font.medium,
    flex: 1,
    letterSpacing: -0.2,
  },
  tipDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: N.border.hairline,
    marginLeft: 60,
  },

  tipsButtons: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    gap: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: N.text.primary,
    borderRadius: 100,
    paddingVertical: 16,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: font.bold,
    letterSpacing: -0.2,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: N.bg.card,
    borderRadius: 100,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: N.border.hairline,
  },
  secondaryBtnText: {
    color: N.text.primary,
    fontSize: 15,
    fontFamily: font.semibold,
    letterSpacing: -0.2,
  },

  // Camera
  cameraRoot: { flex: 1, backgroundColor: '#000' },
  permissionBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  permissionText: { color: '#FFFFFF', fontSize: 15, fontFamily: font.medium },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  cameraSideSlot: { width: 56, alignItems: 'center', justifyContent: 'center' },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#FFFFFF' },

  // Analyzing
  analyzingRoot: { flex: 1, backgroundColor: '#000' },
  analyzingPhoto: { ...StyleSheet.absoluteFillObject, opacity: 0.4 },
  analyzingOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  analyzingText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: font.bold,
    marginTop: 8,
    letterSpacing: -0.2,
  },
  analyzingSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: font.regular },

  // Review
  reviewHero: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  reviewSubtitle: {
    fontSize: 13,
    color: N.text.tertiary,
    marginBottom: 12,
    fontFamily: font.regular,
    paddingHorizontal: 4,
  },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: N.bg.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    ...N.shadow.card,
  },
  checkbox: { paddingTop: 4 },
  reviewName: {
    fontSize: 15,
    fontFamily: font.semibold,
    color: N.text.primary,
    paddingVertical: 4,
    letterSpacing: -0.2,
  },
  reviewMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewQty: {
    backgroundColor: N.bg.well,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 13,
    fontFamily: font.regular,
    color: N.text.primary,
    width: 70,
  },
  reviewUnit: {
    backgroundColor: N.bg.well,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 13,
    fontFamily: font.regular,
    color: N.text.primary,
    width: 64,
  },
  reviewCatChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: N.accent.soft,
    borderRadius: 100,
  },
  reviewCatText: {
    fontSize: 11,
    color: N.accent.primaryDim,
    fontFamily: font.semibold,
    letterSpacing: -0.1,
  },
  removeBtn: { paddingTop: 4 },

  // Empty
  emptyCard: {
    backgroundColor: N.bg.card,
    borderRadius: 18,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 24,
    ...N.shadow.card,
  },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: {
    fontSize: 16,
    fontFamily: font.semibold,
    color: N.text.primary,
    marginTop: 12,
    letterSpacing: -0.2,
  },
  emptySub: {
    fontSize: 13,
    color: N.text.tertiary,
    marginTop: 6,
    textAlign: 'center',
    fontFamily: font.regular,
  },
});

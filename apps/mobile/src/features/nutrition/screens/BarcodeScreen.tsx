/**
 * BarcodeScreen — barkod tara, sonucu lookup et:
 *   - Bulunduysa porsiyon + kayıt onay sheet
 *   - Bulunamadıysa CustomFoodSheet (initialBarcode ile) açılır
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@clerk/expo';

import { Text } from 'react-native';
import { N } from '../theme';
import { lookupBarcode, createMeal } from '../api/client';
import type { MealType, MealItem } from '../api/types';
import { CustomFoodSheet } from '../sheets/CustomFoodSheet';

const TEAL = N.accent.primary;

type Props = {
  mealType: MealType;
  onClose: () => void;
  onAdded: () => void;
};

export default function BarcodeScreen({ mealType, onClose, onAdded }: Props) {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [foundFood, setFoundFood] = useState<any | null>(null);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // Scan line animation
  const scanAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
        }),
      ]),
    ).start();
  }, [scanAnim]);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission, requestPermission]);

  const onScan = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setCode(data);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await lookupBarcode(token, data);
      if (res.found) {
        setFoundFood(res.food);
      } else {
        setNotFoundCode(data);
      }
    } catch (err) {
      console.error('[barcode]', err);
    } finally {
      setLoading(false);
    }
  };

  const addFound = async () => {
    if (!foundFood) return;
    try {
      setAdding(true);
      const token = await getToken();
      if (!token) return;
      const item: MealItem = {
        foodId: foundFood.id ?? undefined,
        customFoodId: undefined,
        name: foundFood.name,
        brand: foundFood.brand ?? undefined,
        servingSize: Number(foundFood.servingSize ?? 100),
        servingUnit: String(foundFood.servingUnit ?? 'g'),
        quantity: 1,
        calories: Number(foundFood.calories ?? 0),
        proteinG: Number(foundFood.proteinG ?? 0),
        carbsG: Number(foundFood.carbsG ?? 0),
        fatG: Number(foundFood.fatG ?? 0),
        fiberG: Number(foundFood.fiberG ?? 0),
        sugarG: Number(foundFood.sugarG ?? 0),
        saturatedFatG: Number(foundFood.saturatedFatG ?? 0),
        sodiumMg: Number(foundFood.sodiumMg ?? 0),
        source: 'barcode',
      };
      await createMeal(token, { mealType, items: [item], source: 'barcode' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAdded();
    } catch (err) {
      console.error('[barcode add]', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setAdding(false);
    }
  };

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <View
        style={[
          styles.root,
          { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center', padding: 24 },
        ]}
      >
        <Text style={[styles.headerTitle, { textAlign: 'center', marginBottom: 16 }]}>
          Kamera izni gerekli
        </Text>
        <Pressable onPress={requestPermission} style={styles.primaryBtn}>
          <Text style={styles.primaryText}>İzin ver</Text>
        </Pressable>
        <Pressable onPress={onClose} style={{ marginTop: 12 }}>
          <Text style={{ color: N.text.secondary }}>İptal</Text>
        </Pressable>
      </View>
    );
  }

  if (notFoundCode) {
    return (
      <CustomFoodSheet
        visible={true}
        mealType={mealType}
        initialBarcode={notFoundCode}
        onClose={() => {
          setNotFoundCode(null);
          setScanned(false);
          setCode(null);
        }}
        onAdded={onAdded}
      />
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: '#000' }]}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'qr'],
        }}
        onBarcodeScanned={scanned ? undefined : onScan}
      />
      <View
        style={[styles.overlay, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          <Text style={[styles.headerTitle, { color: '#fff' }]}>Barkod tara</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.barcodeFrame}>
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [
                  {
                    translateY: scanAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-80, 80],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>

        <Text style={styles.hint}>Barkodu kareye hizala</Text>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={TEAL} />
            <Text style={{ color: '#fff', marginTop: 8 }}>Aranıyor: {code}</Text>
          </View>
        )}

        {foundFood && (
          <View style={styles.resultCard}>
            <Text style={styles.resultName}>{foundFood.name}</Text>
            {foundFood.brand && <Text style={styles.resultBrand}>{foundFood.brand}</Text>}
            <View style={{ flexDirection: 'row', gap: 14, marginTop: 8 }}>
              <Stat label="Kalori" value={`${Math.round(Number(foundFood.calories))}`} />
              <Stat label="Protein" value={`${Number(foundFood.proteinG ?? 0)}g`} />
              <Stat label="Karb" value={`${Number(foundFood.carbsG ?? 0)}g`} />
              <Stat label="Yağ" value={`${Number(foundFood.fatG ?? 0)}g`} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <Pressable
                onPress={() => {
                  setFoundFood(null);
                  setScanned(false);
                  setCode(null);
                }}
                style={[styles.secondaryBtn, { flex: 1 }]}
              >
                <Text style={styles.secondaryText}>Tekrar tara</Text>
              </Pressable>
              <Pressable
                onPress={addFound}
                disabled={adding}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { flex: 1.2 },
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
              >
                <Text style={styles.primaryText}>{adding ? 'Ekleniyor...' : 'Öğüne ekle'}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ fontSize: 11, color: N.text.tertiary }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: N.text.primary, marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: N.bg.page },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: N.text.primary },
  barcodeFrame: {
    width: 280,
    height: 180,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  scanLine: {
    position: 'absolute',
    top: 80,
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: TEAL,
    shadowColor: TEAL,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  hint: { color: '#fff', fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
  loadingBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    padding: 16,
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultCard: {
    backgroundColor: N.bg.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  resultName: { fontSize: 17, fontWeight: '700', color: N.text.primary, letterSpacing: -0.2 },
  resultBrand: { fontSize: 13, color: N.text.tertiary, marginTop: 2 },
  primaryBtn: {
    backgroundColor: N.text.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  secondaryBtn: {
    backgroundColor: N.bg.well,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontSize: 14, fontWeight: '600', color: N.text.primary },
});

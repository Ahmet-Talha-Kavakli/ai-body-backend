import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';

const GREEN = '#30D158';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function SupplementBarcodeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getToken } = useAuth();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);

  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ]),
    ).start();
  }, []);

  const handleBarcode = useCallback(
    async ({ data: code }: { data: string }) => {
      if (!scanning || loading || code === lastCode) return;
      setScanning(false);
      setLastCode(code);
      setLoading(true);

      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/supplements/barcode/${encodeURIComponent(code)}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        const data = (await res.json()) as {
          found: boolean;
          name?: string;
          brand?: string;
          category?: string;
          type?: string;
          barcode?: string;
          source?: string;
        };

        if (data.found && data.name) {
          // Supplement bilgileri bulundu — supplement ekle ve geri dön
          const addToken = await getToken();
          const addRes = await fetch(`${API_URL}/api/tracking/supplements`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(addToken ? { Authorization: `Bearer ${addToken}` } : {}),
            },
            body: JSON.stringify({
              name: data.name,
              brand: data.brand,
              category: data.category,
              type: data.type ?? 'genel',
              barcode: code,
              dosage: '1',
              unit: 'adet',
              timing: 'morning',
            }),
          });

          if (addRes.ok) {
            Alert.alert('Eklendi!', `"${data.name}" supplement listenize eklendi.`, [
              { text: 'Tamam', onPress: () => router.back() },
            ]);
          } else {
            throw new Error('Add failed');
          }
        } else {
          // Bulunamadı — fotoğraf analizine yönlendir
          Alert.alert(
            'Bulunamadı',
            'Bu barkod veritabanımızda yok. AI fotoğraf analizi ile dene.',
            [
              {
                text: 'İptal',
                style: 'cancel',
                onPress: () => {
                  setScanning(true);
                  setLastCode(null);
                },
              },
              {
                text: 'Fotoğraf ile Analiz',
                onPress: () => router.replace('/(app)/tracking/supplement-photo' as never),
              },
            ],
          );
        }
      } catch (e) {
        console.error('[barcode] lookup error', e);
        Alert.alert('Hata', 'Barkod sorgulanamadı. Tekrar dene.', [
          {
            text: 'Tamam',
            onPress: () => {
              setScanning(true);
              setLastCode(null);
            },
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [scanning, loading, lastCode, getToken, router],
  );

  if (!permission) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <ActivityIndicator color={GREEN} style={{ flex: 1 }} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[s.root, { paddingTop: insets.top }, s.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="camera-off-outline" size={48} color="#8E8E93" />
        <Text style={s.permTxt}>Kamera izni gerekli</Text>
        <Text style={s.permSub}>Barkod taramak için kamera erişimi gerekiyor</Text>
        <Pressable onPress={requestPermission}>
          {({ pressed }) => (
            <View style={[s.permBtn, pressed && { opacity: 0.8 }]}>
              <Text style={s.permBtnTxt}>İzin Ver</Text>
            </View>
          )}
        </Pressable>
        <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: '#8E8E93', fontSize: 14 }}>Geri Dön</Text>
        </Pressable>
      </View>
    );
  }

  const scanLineY = scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 130] });

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr', 'code128', 'code39'],
        }}
        onBarcodeScanned={scanning && !loading ? handleBarcode : undefined}
      />

      {/* Overlay */}
      <View style={s.overlay}>
        {/* Top bar */}
        <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={s.topTitle}>Barkod Tara</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Frame */}
        <View style={s.frameWrap}>
          <View style={s.frame}>
            <View style={[s.corner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]} />
            <View
              style={[s.corner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }]}
            />
            <View
              style={[s.corner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]}
            />
            <View
              style={[s.corner, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }]}
            />

            {/* Animated scan line */}
            {!loading && (
              <Animated.View style={[s.scanLine, { transform: [{ translateY: scanLineY }] }]} />
            )}

            {loading && (
              <View style={s.loadingBox}>
                <ActivityIndicator color={GREEN} size="large" />
                <Text style={s.loadingTxt}>Sorgulanıyor...</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom hint */}
        <View style={s.bottomHint}>
          <Text style={s.hintTxt}>Barkodu çerçeve içine hizala</Text>
          <Pressable
            onPress={() => router.replace('/(app)/tracking/supplement-photo' as never)}
            style={{ marginTop: 16 }}
          >
            {({ pressed }) => (
              <View style={[s.altBtn, pressed && { opacity: 0.7 }]}>
                <Ionicons name="camera-outline" size={16} color="#fff" />
                <Text style={s.altBtnTxt}>Fotoğraf ile Analiz Et</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  overlay: { flex: 1, backgroundColor: 'transparent' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 260, height: 160, position: 'relative', overflow: 'hidden' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: GREEN },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: GREEN,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingTxt: { color: '#fff', fontSize: 14 },
  bottomHint: {
    paddingBottom: 60,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  hintTxt: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  altBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  altBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },
  permTxt: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  permSub: { fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 20 },
  permBtn: {
    backgroundColor: GREEN,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  permBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

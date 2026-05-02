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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';

const ACCENT = '#32ADE6';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

interface DrinkResult {
  found: boolean;
  nametr?: string;
  nameen?: string;
  brand?: string;
  category?: string;
  defaultServingMl?: number;
}

export default function SuBarcodeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getToken } = useAuth();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [result, setResult] = useState<DrinkResult | null>(null);
  const [ml, setMl] = useState('');
  const [saving, setSaving] = useState(false);

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ]),
    ).start();
  }, []);

  const showResult = (res: DrinkResult) => {
    setResult(res);
    setMl(String(res.defaultServingMl ?? 250));
    resultAnim.setValue(0);
    Animated.timing(resultAnim, {
      toValue: 1,
      duration: 340,
      useNativeDriver: true,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }).start();
  };

  const handleBarcode = useCallback(
    async ({ data: code }: { data: string }) => {
      if (!scanning || loading || code === lastCode) return;
      setScanning(false);
      setLastCode(code);
      setLoading(true);

      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/drinks/barcode/${encodeURIComponent(code)}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        const data = (await res.json()) as DrinkResult;

        if (data.found && data.nametr) {
          showResult(data);
        } else {
          Alert.alert(
            'Bulunamadı',
            'Bu barkod veritabanımızda yok. Görselle analiz etmek ister misin?',
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
                text: 'Görsel ile Analiz',
                onPress: () => router.replace('/(app)/tracking/su-photo' as never),
              },
            ],
          );
        }
      } catch {
        Alert.alert('Hata', 'Barkod sorgulanamadı.', [
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

  const handleSave = async () => {
    const amount = parseInt(ml);
    if (!amount || amount <= 0 || amount > 5000) return;
    setSaving(true);
    try {
      const token = await getToken();
      await fetch(`${API_URL}/api/water/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ amountMl: amount }),
      });
      Alert.alert('Kaydedildi!', `${amount} ml eklendi.`, [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Hata', 'Kaydedilemedi. Tekrar dene.');
    } finally {
      setSaving(false);
    }
  };

  const resetScan = () => {
    setResult(null);
    setScanning(true);
    setLastCode(null);
  };

  if (!permission) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <ActivityIndicator color={ACCENT} style={{ flex: 1 }} />
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

  const scanLineY = scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 120] });

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr', 'code128'],
        }}
        onBarcodeScanned={scanning && !loading && !result ? handleBarcode : undefined}
      />

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
        {!result && (
          <View style={s.frameWrap}>
            <View style={s.frame}>
              <View
                style={[s.corner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]}
              />
              <View
                style={[s.corner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }]}
              />
              <View
                style={[s.corner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]}
              />
              <View
                style={[
                  s.corner,
                  { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
                ]}
              />
              {!loading && (
                <Animated.View style={[s.scanLine, { transform: [{ translateY: scanLineY }] }]} />
              )}
              {loading && (
                <View style={s.loadingBox}>
                  <ActivityIndicator color={ACCENT} size="large" />
                  <Text style={s.loadingTxt}>Sorgulanıyor...</Text>
                </View>
              )}
            </View>
            <Text style={s.hintTxt}>Barkodu çerçeve içine hizala</Text>
          </View>
        )}

        {/* Result card */}
        {result && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={s.frameWrap}
          >
            <Animated.View
              style={[
                s.resultCard,
                {
                  opacity: resultAnim,
                  transform: [
                    {
                      translateY: resultAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={s.resultTop}>
                <Ionicons name="checkmark-circle" size={20} color="#30D158" />
                <Text style={s.resultTitle}>{result.nametr}</Text>
                {result.brand ? <Text style={s.resultBrand}>{result.brand}</Text> : null}
              </View>

              <Text style={s.mlLabel}>Kaç ml içtin?</Text>
              <View style={s.mlRow}>
                <TextInput
                  style={s.mlInput}
                  value={ml}
                  onChangeText={setMl}
                  keyboardType="number-pad"
                  maxLength={4}
                  autoFocus
                />
                <Text style={s.mlUnit}>ml</Text>
              </View>

              <View style={s.quickRow}>
                {[100, 150, 200, 250, 330, 500].map((v) => (
                  <Pressable key={v} onPress={() => setMl(String(v))}>
                    {({ pressed }) => (
                      <View
                        style={[
                          s.quickBtn,
                          ml === String(v) && s.quickBtnActive,
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Text style={[s.quickBtnTxt, ml === String(v) && s.quickBtnTxtActive]}>
                          {v}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>

              <View style={s.actionRow}>
                <Pressable onPress={resetScan} style={s.retryBtn}>
                  <Ionicons name="scan-outline" size={16} color="#8E8E93" />
                  <Text style={s.retryTxt}>Yeniden Tara</Text>
                </Pressable>
                <Pressable onPress={saving ? undefined : handleSave} style={s.saveBtn}>
                  {({ pressed }) => (
                    <View style={[s.saveBtnInner, (pressed || saving) && { opacity: 0.8 }]}>
                      {saving ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={s.saveBtnTxt}>Kaydet</Text>
                      )}
                    </View>
                  )}
                </Pressable>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        )}

        {/* Bottom hint (when scanning) */}
        {!result && (
          <View style={[s.bottomHint, { paddingBottom: insets.bottom + 20 }]}>
            <Pressable onPress={() => router.replace('/(app)/tracking/su-photo' as never)}>
              {({ pressed }) => (
                <View style={[s.altBtn, pressed && { opacity: 0.7 }]}>
                  <Ionicons name="camera-outline" size={16} color="#fff" />
                  <Text style={s.altBtnTxt}>Görsel ile Analiz Et</Text>
                </View>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  overlay: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  frame: { width: 260, height: 140, position: 'relative', overflow: 'hidden' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: ACCENT },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingTxt: { color: '#fff', fontSize: 13 },
  hintTxt: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 20 },
  resultCard: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 12 },
  resultTop: { gap: 4 },
  resultTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', marginTop: 4 },
  resultBrand: { fontSize: 13, color: '#8E8E93' },
  mlLabel: { fontSize: 13, fontWeight: '600', color: '#636366' },
  mlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  mlInput: { flex: 1, fontSize: 24, fontWeight: '700', color: '#1C1C1E' },
  mlUnit: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  quickRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
  },
  quickBtnActive: { backgroundColor: ACCENT },
  quickBtnTxt: { fontSize: 13, fontWeight: '600', color: '#636366' },
  quickBtnTxtActive: { color: '#fff' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  retryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingVertical: 14,
  },
  retryTxt: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  saveBtn: { flex: 2 },
  saveBtnInner: {
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  saveBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  bottomHint: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  altBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginBottom: 20,
  },
  altBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },
  permTxt: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  permSub: { fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 20 },
  permBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  permBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

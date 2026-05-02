import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';

const ACCENT = '#32ADE6';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

interface AnalysisResult {
  found: boolean;
  nametr?: string;
  nameen?: string;
  brand?: string;
  category?: string;
  defaultMl?: number;
  confidence?: number;
  error?: string;
}

export default function SuPhotoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getToken } = useAuth();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [ml, setMl] = useState('');
  const [saving, setSaving] = useState(false);

  const analyzeImage = useCallback(
    async (uri: string, base64: string, mimeType: string) => {
      setImageUri(uri);
      setResult(null);
      setAnalyzing(true);
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/water/analyze-photo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        });
        const data = (await res.json()) as AnalysisResult;
        setResult(data);
        if (data.found && data.defaultMl) {
          setMl(String(data.defaultMl));
        }
      } catch {
        Alert.alert('Hata', 'Fotoğraf analiz edilemedi.');
      } finally {
        setAnalyzing(false);
      }
    },
    [getToken],
  );

  const pickFromCamera = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('İzin Gerekli', 'Fotoğraf çekmek için kamera izni gerekiyor.');
      return;
    }
    const picked = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.7,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!picked.canceled && picked.assets[0]) {
      const asset = picked.assets[0];
      if (!asset.base64) {
        Alert.alert('Hata', 'Fotoğraf okunamadı.');
        return;
      }
      await analyzeImage(asset.uri, asset.base64, 'image/jpeg');
    }
  }, [analyzeImage]);

  const pickFromGallery = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('İzin Gerekli', 'Galeri erişimi için izin gerekiyor.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.7,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!picked.canceled && picked.assets[0]) {
      const asset = picked.assets[0];
      if (!asset.base64) {
        Alert.alert('Hata', 'Fotoğraf okunamadı.');
        return;
      }
      const mime = asset.uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
      await analyzeImage(asset.uri, asset.base64, mime);
    }
  }, [analyzeImage]);

  const handleSave = async () => {
    const amount = parseInt(ml);
    if (!amount || amount <= 0 || amount > 5000) return;
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/water/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ amountMl: amount }),
      });
      if (!res.ok) throw new Error('Save failed');
      Alert.alert('Kaydedildi!', `${amount} ml eklendi.`, [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Hata', 'Kaydedilemedi. Tekrar dene.');
    } finally {
      setSaving(false);
    }
  };

  const confidenceColor = (c?: number) => {
    if (!c) return '#8E8E93';
    if (c >= 0.8) return '#30D158';
    if (c >= 0.5) return '#FF9F0A';
    return '#FF453A';
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={[s.root, { paddingTop: insets.top }]}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={s.header}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#1C1C1E" />
            </Pressable>
            <Text style={s.title}>Görsel ile Ekle</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Image area */}
          {imageUri ? (
            <View style={s.previewWrap}>
              <Image source={{ uri: imageUri }} style={s.preview} resizeMode="cover" />
              {analyzing && (
                <View style={s.analyzingOverlay}>
                  <ActivityIndicator color={ACCENT} size="large" />
                  <Text style={s.analyzingTxt}>AI analiz ediyor...</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={s.placeholder}>
              <Ionicons name="water-outline" size={56} color="#C7C7CC" />
              <Text style={s.placeholderTxt}>Fotoğraf seç veya çek</Text>
              <Text style={s.placeholderSub}>AI, içeceği tanıyıp ml miktarını tahmin edecek</Text>
            </View>
          )}

          {/* Pick buttons */}
          {!analyzing && (
            <View style={s.btnRow}>
              <Pressable style={{ flex: 1 }} onPress={pickFromCamera}>
                {({ pressed }) => (
                  <View style={[s.btn, { backgroundColor: ACCENT }, pressed && { opacity: 0.8 }]}>
                    <Ionicons name="camera-outline" size={18} color="#fff" />
                    <Text style={s.btnTxt}>Fotoğraf Çek</Text>
                  </View>
                )}
              </Pressable>
              <Pressable style={{ flex: 1 }} onPress={pickFromGallery}>
                {({ pressed }) => (
                  <View
                    style={[s.btn, { backgroundColor: '#F2F2F7' }, pressed && { opacity: 0.8 }]}
                  >
                    <Ionicons name="images-outline" size={18} color="#1C1C1E" />
                    <Text style={[s.btnTxt, { color: '#1C1C1E' }]}>Galeriden Seç</Text>
                  </View>
                )}
              </Pressable>
            </View>
          )}

          {/* Result */}
          {result && !analyzing && (
            <View style={s.resultCard}>
              {!result.found ? (
                <View style={s.notFoundBox}>
                  <Ionicons name="alert-circle-outline" size={36} color="#FF453A" />
                  <Text style={s.notFoundTxt}>İçecek tanımlanamadı</Text>
                  <Text style={s.notFoundSub}>Daha net bir fotoğraf dene.</Text>
                </View>
              ) : (
                <>
                  <View style={s.resultHeader}>
                    <Ionicons name="checkmark-circle" size={20} color="#30D158" />
                    <Text style={s.resultHeaderTxt}>{result.nametr}</Text>
                    {result.confidence !== undefined && (
                      <Text style={[s.confidence, { color: confidenceColor(result.confidence) }]}>
                        %{Math.round(result.confidence * 100)} güven
                      </Text>
                    )}
                  </View>

                  {result.brand ? <Text style={s.brandTxt}>{result.brand}</Text> : null}

                  <Text style={s.mlLabel}>Kaç ml içtin?</Text>
                  <View style={s.mlRow}>
                    <TextInput
                      style={s.mlInput}
                      value={ml}
                      onChangeText={setMl}
                      keyboardType="number-pad"
                      maxLength={4}
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

                  <Pressable onPress={saving ? undefined : handleSave} style={{ marginTop: 8 }}>
                    {({ pressed }) => (
                      <View style={[s.saveBtn, (pressed || saving) && { opacity: 0.8 }]}>
                        {saving ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="add-circle" size={18} color="#fff" />
                            <Text style={s.saveBtnTxt}>Kaydet</Text>
                          </>
                        )}
                      </View>
                    )}
                  </Pressable>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { paddingHorizontal: 20, paddingBottom: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 20,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
  placeholder: {
    backgroundColor: '#fff',
    borderRadius: 20,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  placeholderTxt: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  placeholderSub: {
    fontSize: 13,
    color: '#C7C7CC',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  previewWrap: { borderRadius: 20, overflow: 'hidden', marginBottom: 16, position: 'relative' },
  preview: { width: '100%', height: 220, borderRadius: 20 },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 20,
  },
  analyzingTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  notFoundBox: { alignItems: 'center', gap: 8 },
  notFoundTxt: { fontSize: 16, fontWeight: '700', color: '#FF453A' },
  notFoundSub: { fontSize: 13, color: '#8E8E93', textAlign: 'center' },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultHeaderTxt: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', flex: 1 },
  confidence: { fontSize: 12, fontWeight: '600' },
  brandTxt: { fontSize: 13, color: '#8E8E93', marginTop: -6 },
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
  saveBtn: {
    backgroundColor: ACCENT,
    paddingVertical: 15,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';

const GREEN = '#30D158';
const RED = '#FF3B30';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const ALLERGENS = [
  { key: 'Gluten', emoji: '🌾', desc: 'Buğday, arpa, çavdar' },
  { key: 'Laktoz', emoji: '🥛', desc: 'Süt ve süt ürünleri' },
  { key: 'Soya', emoji: '🫘', desc: 'Soya fasulyesi türevleri' },
  { key: 'Fıstık', emoji: '🥜', desc: 'Yer fıstığı ve türevleri' },
  { key: 'Ağaç Kabukluları', emoji: '🌰', desc: 'Badem, ceviz, fındık vb.' },
  { key: 'Yumurta', emoji: '🥚', desc: 'Yumurta ve albümin' },
  { key: 'Kabuklu Deniz Ürünleri', emoji: '🦐', desc: 'Karides, ıstakoz, yengeç' },
  { key: 'Balık', emoji: '🐟', desc: 'Tüm balık türleri' },
  { key: 'Susam', emoji: '🌿', desc: 'Susam tohumu ve yağı' },
  { key: 'Mısır', emoji: '🌽', desc: 'Mısır nişastası, sirup' },
  { key: 'Kafein', emoji: '☕', desc: 'Kahve, çay, enerji içecekleri' },
  { key: 'Yapay Tatlandırıcılar', emoji: '🍬', desc: 'Aspartam, sukraloz, stevia' },
  { key: 'Jelatin', emoji: '🧪', desc: 'Hayvansal jelatin (kapsül)' },
  { key: 'Magnezyum Stearat', emoji: '💊', desc: 'Kaplama/dolgu maddesi' },
  { key: 'Titanyum Dioksit', emoji: '⚗️', desc: 'Renklendirici E171' },
  { key: 'Kükürt Dioksit', emoji: '🌫️', desc: 'Koruyucu E220' },
];

export default function AllergiesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getToken } = useAuth();

  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = (await getToken()) ?? null;
      return fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...((options.headers as Record<string, string>) ?? {}),
        },
      });
    },
    [getToken],
  );

  useEffect(() => {
    authFetch('/api/user/allergies')
      .then((r) => r.json())
      .then((d: { allergies: string[] }) => setSelected(d.allergies ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]));

  const save = async () => {
    setSaving(true);
    try {
      const res = await authFetch('/api/user/allergies', {
        method: 'PATCH',
        body: JSON.stringify({ allergies: selected }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('[allergies PATCH]', res.status, body);
        throw new Error(`HTTP ${res.status}`);
      }
      Alert.alert('Kaydedildi', 'Alerji bilgilerin güncellendi.');
      router.back();
    } catch (e) {
      console.error('[allergies save]', e);
      Alert.alert('Hata', 'Kaydetme başarısız oldu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[s.root, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color="#1C1C1E" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.title}>Alerji & Hassasiyetler</Text>
            <Text style={s.sub}>AI supplement önerilerini kişiselleştirir</Text>
          </View>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={GREEN} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {selected.length > 0 && (
              <View style={s.selectedBanner}>
                <Ionicons name="warning-outline" size={14} color={RED} />
                <Text style={s.selectedTxt}>{selected.length} hassasiyet seçili</Text>
              </View>
            )}

            <Text style={s.hint}>
              Alerjin veya hassasiyetin varsa seç. Supplement keşfederken sana uyarı vereceğiz.
            </Text>

            {ALLERGENS.map((a) => {
              const sel = selected.includes(a.key);
              return (
                <Pressable key={a.key} onPress={() => toggle(a.key)}>
                  {({ pressed }) => (
                    <View style={[s.row, sel && s.rowSel, pressed && { opacity: 0.7 }]}>
                      <Text style={s.emoji}>{a.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.name, sel && { color: RED }]}>{a.key}</Text>
                        <Text style={s.desc}>{a.desc}</Text>
                      </View>
                      <View style={[s.check, sel && s.checkSel]}>
                        {sel && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                    </View>
                  )}
                </Pressable>
              );
            })}

            <View style={{ height: 20 }} />
          </ScrollView>
        )}

        {/* Save button */}
        <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable onPress={saving ? undefined : save}>
            {({ pressed }) => (
              <View style={[s.saveBtn, (pressed || saving) && { opacity: 0.8 }]}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.saveTxt}>Kaydet</Text>
                )}
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F2F2F7',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  sub: { fontSize: 12, color: '#8E8E93', marginTop: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  hint: { fontSize: 13, color: '#8E8E93', marginBottom: 16, lineHeight: 18 },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF3B3012',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FF3B3030',
  },
  selectedTxt: { fontSize: 13, fontWeight: '600', color: RED },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  rowSel: { borderColor: '#FF3B3040', backgroundColor: '#FFF1F2' },
  emoji: { fontSize: 24, width: 34, textAlign: 'center' },
  name: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  desc: { fontSize: 12, color: '#8E8E93', marginTop: 1 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSel: { backgroundColor: RED, borderColor: RED },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#F2F2F7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  saveBtn: { backgroundColor: GREEN, paddingVertical: 16, alignItems: 'center', borderRadius: 16 },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

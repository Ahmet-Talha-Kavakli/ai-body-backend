/**
 * Asistan ayarları — isim değiştirme, bildirim, sessiz saatler.
 */

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { font, SLEEP, API_URL } from '../tracking/uyku/_components/theme';

interface ProfileFull {
  name: string;
  formality: number;
  humor: number;
  directness: number;
  supportStyle: string;
}

interface NotifSettings {
  enabled: boolean;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  hasToken: boolean;
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileFull | null>(null);
  const [notif, setNotif] = useState<NotifSettings | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const tk = await getToken();
      const [pRes, nRes] = await Promise.all([
        fetch(`${API_URL}/api/assistant/profile`, { headers: { Authorization: `Bearer ${tk}` } }),
        fetch(`${API_URL}/api/assistant/notifications`, {
          headers: { Authorization: `Bearer ${tk}` },
        }),
      ]);
      if (pRes.ok) {
        const pData = await pRes.json().catch(() => null);
        if (pData?.profile) {
          setProfile(pData.profile);
          setNameInput(pData.profile.name);
        }
      }
      if (nRes.ok) {
        const nData = await nRes.json().catch(() => null);
        if (nData) setNotif(nData);
      }
    } catch (e) {
      console.error('[settings]', e);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll]),
  );

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 20) {
      Alert.alert('İsim 2-20 karakter olmalı');
      return;
    }
    setSaving(true);
    try {
      const tk = await getToken();
      const res = await fetch(`${API_URL}/api/assistant/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const data = await res.json();
        setProfile(data);
        setEditingName(false);
      } else {
        const err = await res.json();
        Alert.alert('Hata', err.error ?? 'Kaydedilemedi');
      }
    } finally {
      setSaving(false);
    }
  };

  const updateNotif = async (patch: Partial<NotifSettings>) => {
    if (!notif) return;
    const next = { ...notif, ...patch };
    setNotif(next);
    try {
      const tk = await getToken();
      await fetch(`${API_URL}/api/assistant/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
        body: JSON.stringify(patch),
      });
    } catch (e) {
      console.error('[settings/notif]', e);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[st.root, { paddingTop: insets.top }]}>
        <View style={st.header}>
          <Pressable onPress={() => router.back()} hitSlop={14} style={st.backBtn}>
            <SymbolView
              name="chevron.left"
              size={20}
              tintColor={SLEEP.text}
              fallback={<Text>‹</Text>}
            />
          </Pressable>
          <Text style={st.headerTitle}>Ayarlar</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={SLEEP.accent} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={[st.scroll, { paddingBottom: insets.bottom + 32 }]}>
            {/* Asistan İsmi */}
            <Text style={st.sectionLabel}>ASİSTAN</Text>
            <View style={st.card}>
              <View style={st.row}>
                <Text style={st.rowLabel}>İsim</Text>
                {editingName ? (
                  <View style={st.editRow}>
                    <TextInput
                      value={nameInput}
                      onChangeText={setNameInput}
                      autoFocus
                      maxLength={20}
                      style={st.nameInput}
                      placeholderTextColor={SLEEP.textDim}
                    />
                    <Pressable
                      onPress={() => {
                        setEditingName(false);
                        setNameInput(profile?.name ?? '');
                      }}
                      hitSlop={10}
                      style={st.cancelBtn}
                    >
                      <Text style={st.cancelTxt}>Vazgeç</Text>
                    </Pressable>
                    <Pressable
                      onPress={saveName}
                      disabled={saving || nameInput.trim().length < 2}
                      hitSlop={10}
                      style={[st.saveBtn, { opacity: saving ? 0.5 : 1 }]}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={st.saveTxt}>Kaydet</Text>
                      )}
                    </Pressable>
                  </View>
                ) : (
                  <Pressable onPress={() => setEditingName(true)} style={st.valueRow}>
                    <Text style={st.value}>{profile?.name ?? '—'}</Text>
                    <SymbolView
                      name="pencil"
                      size={14}
                      tintColor={SLEEP.accent}
                      fallback={<Text style={{ color: SLEEP.accent }}>✎</Text>}
                    />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Bildirimler */}
            <Text style={st.sectionLabel}>BİLDİRİMLER</Text>
            <View style={st.card}>
              <View style={st.row}>
                <Text style={st.rowLabel}>Bildirimleri al</Text>
                <Switch
                  value={notif?.enabled ?? true}
                  onValueChange={(v) => updateNotif({ enabled: v })}
                  trackColor={{ false: '#E5E5EA', true: SLEEP.accent }}
                />
              </View>
              {notif?.hasToken === false && notif?.enabled && (
                <Text style={st.warningTxt}>Bildirim izni verilmemiş veya cihaz hazır değil.</Text>
              )}

              <View style={[st.row, st.divider]}>
                <Text style={st.rowLabel}>Sessiz saat — başlangıç</Text>
                <HourPicker
                  value={notif?.quietHoursStart ?? null}
                  onChange={(v) => updateNotif({ quietHoursStart: v })}
                />
              </View>
              <View style={st.row}>
                <Text style={st.rowLabel}>Sessiz saat — bitiş</Text>
                <HourPicker
                  value={notif?.quietHoursEnd ?? null}
                  onChange={(v) => updateNotif({ quietHoursEnd: v })}
                />
              </View>
              <Text style={st.helperTxt}>Sessiz saatlerde asistan sana bildirim göndermez.</Text>
            </View>

            {/* Hafıza linki */}
            <Text style={st.sectionLabel}>HAFIZA</Text>
            <Pressable
              style={st.linkCard}
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/seans/memory');
              }}
            >
              <View style={st.linkIcon}>
                <SymbolView
                  name="brain"
                  size={18}
                  tintColor={SLEEP.accent}
                  fallback={<Text>🧠</Text>}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.linkTitle}>Asistanın hafızası</Text>
                <Text style={st.linkSub}>Hatırladığı her şeyi gör</Text>
              </View>
              <SymbolView
                name="chevron.right"
                size={14}
                tintColor={SLEEP.textDim}
                fallback={<Text style={{ color: SLEEP.textDim }}>›</Text>}
              />
            </Pressable>

            {/* Bağlantılar linki */}
            <Text style={st.sectionLabel}>BAĞLANTILAR</Text>
            <Pressable
              style={st.linkCard}
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/seans/baglantilar');
              }}
            >
              <View style={st.linkIcon}>
                <SymbolView
                  name="link"
                  size={18}
                  tintColor={SLEEP.accent}
                  fallback={<Text>🔗</Text>}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.linkTitle}>Bağlantılar</Text>
                <Text style={st.linkSub}>Apple Health, Takvim, Rehber, Hatırlatıcılar</Text>
              </View>
              <SymbolView
                name="chevron.right"
                size={14}
                tintColor={SLEEP.textDim}
                fallback={<Text style={{ color: SLEEP.textDim }}>›</Text>}
              />
            </Pressable>
          </ScrollView>
        )}
      </View>
    </>
  );
}

function HourPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const display = value === null ? 'Kapalı' : `${String(value).padStart(2, '0')}:00`;

  const cycle = () => {
    Haptics.selectionAsync();
    if (value === null) onChange(0);
    else if (value >= 23) onChange(null);
    else onChange(value + 1);
  };

  return (
    <Pressable onPress={cycle} hitSlop={8} style={st.hourPill}>
      <Text style={st.hourTxt}>{display}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: SLEEP.page },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SLEEP.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    fontFamily: font.bold,
    fontSize: 17,
    color: SLEEP.text,
    textAlign: 'center',
    letterSpacing: -0.2,
  },

  scroll: { paddingHorizontal: 18, paddingTop: 18 },
  sectionLabel: {
    fontFamily: font.bold,
    fontSize: 11,
    color: SLEEP.textDim,
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 12,
    paddingLeft: 4,
  },

  card: {
    backgroundColor: SLEEP.card,
    borderRadius: 14,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: SLEEP.border },
  rowLabel: {
    flex: 1,
    fontFamily: font.medium,
    fontSize: 14,
    color: SLEEP.text,
    letterSpacing: -0.1,
  },

  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: { fontFamily: font.semibold, fontSize: 14, color: SLEEP.accent },

  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: SLEEP.text,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 100,
    textAlign: 'center',
  },
  cancelBtn: { paddingHorizontal: 8 },
  cancelTxt: { fontFamily: font.regular, fontSize: 12, color: SLEEP.textMuted },
  saveBtn: {
    backgroundColor: SLEEP.accent,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  saveTxt: { fontFamily: font.bold, fontSize: 12, color: '#fff' },

  warningTxt: {
    fontFamily: font.regular,
    fontSize: 12,
    color: SLEEP.warn,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  helperTxt: {
    fontFamily: font.regular,
    fontSize: 11,
    color: SLEEP.textDim,
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
  },

  hourPill: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  hourTxt: { fontFamily: font.semibold, fontSize: 13, color: SLEEP.text },

  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: SLEEP.card,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: SLEEP.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: { fontFamily: font.semibold, fontSize: 14, color: SLEEP.text },
  linkSub: { fontFamily: font.regular, fontSize: 12, color: SLEEP.textMuted, marginTop: 2 },
});

/**
 * V4 Test — Admin Flag Panel
 *
 * Sadece Talha için. V4 flag'lerini açıp kapatmaya yarar.
 * Test sonrası bu ekran V4.5'te kaldırılacak.
 *
 * Erişim: deep link → /(app)/characters/admin
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { font, C, API_URL } from '../../../lib/theme';

const FLAG_LABELS: Record<string, { label: string; description: string }> = {
  v4_graph_memory: {
    label: 'Graph Hafıza',
    description: 'Konuştukça AI seni daha derin tanır (node + edge graph)',
  },
  v4_characters: {
    label: 'Karakterler',
    description: '5 karakter zaman içinde gelir (Mia, Kerem, Selin, Ayşe, Mehmet)',
  },
  v4_life_engine: {
    label: 'Yaşam Motoru',
    description: 'Karakterler sen yokken yaşıyor (mood, hayat olayı)',
  },
  v4_decision_engine: {
    label: 'Karar Motoru',
    description: 'Proaktif mesajlar — karakterler kendiliğinden yazıyor',
  },
  v4_group_chat: {
    label: 'Grup Sohbet (V4.5)',
    description: "Henüz hazır değil — V4.5'te aktif",
  },
  v4_ui: {
    label: 'V4 UI',
    description: 'Yeni sohbet listesi tasarımı',
  },
  v4_inner_thought: {
    label: 'İç Ses',
    description: "Karakterler kendi düşüncelerini graph'a yazar",
  },
  v4_avatar_consistency: {
    label: 'Avatar Tutarlılığı',
    description: 'Flux Pro Kontext ile karakter avatarları (henuz yok)',
  },
};

export default function AdminFlagsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_URL}/api/assistant/admin/v4-flags`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        Alert.alert('Yetki yok', 'Bu ekran sadece admin için');
        router.back();
        return;
      }
      if (!res.ok) throw new Error(`load fail: ${res.status}`);
      const data = await res.json();
      setFlags(data.flags ?? {});
    } catch (e) {
      console.error('[admin-flags] load fail:', e);
    } finally {
      setLoading(false);
    }
  }, [getToken, router]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (flag: string, value: boolean) => {
    setUpdating(flag);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_URL}/api/assistant/admin/v4-flags`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ flag, enabled: value }),
      });
      if (!res.ok) throw new Error(`toggle fail: ${res.status}`);
      setFlags((prev) => ({ ...prev, [flag]: value }));
    } catch (e) {
      console.error('[admin-flags] toggle fail:', e);
      Alert.alert('Hata', 'Flag güncellenemedi');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={C.accent} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }}
      >
        <Text style={styles.title}>V4 Flag Panel</Text>
        <Text style={styles.subtitle}>
          Test için flag'leri aç/kapa. Açtığın flag sadece senin hesabına etki eder.
        </Text>

        {Object.entries(FLAG_LABELS).map(([flag, meta]) => (
          <View key={flag} style={styles.row}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.flagLabel}>{meta.label}</Text>
              <Text style={styles.flagDesc}>{meta.description}</Text>
              <Text style={styles.flagKey}>{flag}</Text>
            </View>
            <Switch
              value={!!flags[flag]}
              onValueChange={(v) => toggle(flag, v)}
              disabled={updating === flag}
              trackColor={{ false: '#E5E7EB', true: C.accent }}
            />
          </View>
        ))}

        <Text style={[styles.subtitle, { marginTop: 24, marginBottom: 8 }]}>
          Test: Karakter spawn (trigger bypass)
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['mia', 'kerem', 'selin', 'ayse', 'mehmet'].map((key) => (
            <Pressable
              key={key}
              onPress={async () => {
                try {
                  const token = await getToken();
                  if (!token) return;
                  const res = await fetch(`${API_URL}/api/assistant/admin/spawn-character`, {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ templateKey: key }),
                  });
                  const data = await res.json();
                  if (data.alreadyExists) {
                    Alert.alert(key, 'Bu karakter zaten var');
                  } else if (data.ok) {
                    Alert.alert(key, `Spawn edildi: ${data.introLine}`);
                  } else {
                    Alert.alert('Hata', JSON.stringify(data));
                  }
                } catch (e) {
                  Alert.alert('Hata', String(e));
                }
              }}
              style={styles.spawnBtn}
            >
              <Text style={styles.spawnBtnText}>+ {key}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.subtitle, { marginTop: 24, marginBottom: 8 }]}>
          Test: Avatar üret (Flux 1.1 Pro Ultra — $0.06/karakter)
        </Text>
        <Pressable
          onPress={async () => {
            try {
              const token = await getToken();
              if (!token) return;
              const listRes = await fetch(`${API_URL}/api/assistant/characters`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const listData = await listRes.json();
              const noAvatar = (listData.characters ?? []).filter((c: any) => !c.avatarUrl);
              if (noAvatar.length === 0) {
                Alert.alert('Avatar', 'Tüm karakterlerin avatarı zaten var');
                return;
              }
              Alert.alert('Avatar', `${noAvatar.length} karakter için üretiliyor — 10-30sn`);
              for (const c of noAvatar) {
                await fetch(`${API_URL}/api/assistant/admin/generate-avatar`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ characterId: c.id }),
                });
              }
              Alert.alert('Avatar', 'Tamamlandı! Listeyi yenile.');
            } catch (e) {
              Alert.alert('Hata', String(e));
            }
          }}
          style={[styles.spawnBtn, { alignSelf: 'flex-start' }]}
        >
          <Text style={styles.spawnBtnText}>🎨 Eksik avatarları üret</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/(app)/characters')} style={styles.gotoBtn}>
          <Text style={styles.gotoBtnText}>Karakterlere git →</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: { paddingHorizontal: 12, paddingVertical: 8 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: font.bold, fontSize: 28, color: '#0A0A0A', marginBottom: 6 },
  subtitle: { fontFamily: font.regular, fontSize: 14, color: '#6B7280', marginBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  flagLabel: { fontFamily: font.semibold, fontSize: 16, color: '#0A0A0A' },
  flagDesc: { fontFamily: font.regular, fontSize: 13, color: '#6B7280', marginTop: 2 },
  flagKey: { fontFamily: font.regular, fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  gotoBtn: {
    marginTop: 32,
    paddingVertical: 16,
    backgroundColor: C.accent,
    borderRadius: 14,
    alignItems: 'center',
  },
  gotoBtnText: { fontFamily: font.semibold, fontSize: 16, color: '#FFFFFF' },
  spawnBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.accentSofter,
    borderRadius: 10,
  },
  spawnBtnText: {
    fontFamily: font.medium,
    fontSize: 14,
    color: C.accent,
  },
});

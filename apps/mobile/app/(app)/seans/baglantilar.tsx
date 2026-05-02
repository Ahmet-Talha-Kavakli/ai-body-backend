/**
 * Asistan Bağlantıları — kullanıcı izinleri tek ekrandan yönetir.
 * Apple Photos paterni: just-in-time + buradan toplu görünüm.
 */

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  Pressable,
  Linking,
} from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { font, SLEEP, API_URL } from '../tracking/uyku/_components/theme';
import {
  requestHealthKitAuth,
  runFullHealthKitSync,
} from '../../../src/services/assistant/healthkit';
import {
  requestCalendarAuth,
  requestRemindersAuth,
} from '../../../src/services/assistant/calendar';
import { requestContactsAuth } from '../../../src/services/assistant/contacts';
import {
  syncCalendarToBackend,
  syncRemindersToBackend,
  syncContactsToBackend,
  requestAndStorePermission,
} from '../../../src/services/assistant/sync';

interface PermRow {
  capability: string;
  status: 'not_asked' | 'granted' | 'denied' | 'revoked';
}

interface ConnDef {
  capability: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  request: () => Promise<boolean>;
  postGrant?: () => void;
}

export default function ConnectionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [perms, setPerms] = useState<Record<string, PermRow['status']>>({});

  const fetchAll = useCallback(async () => {
    try {
      const tk = await getToken();
      const res = await fetch(`${API_URL}/api/assistant/permissions`, {
        headers: { Authorization: `Bearer ${tk}` },
      });
      const data = await res.json();
      const map: Record<string, PermRow['status']> = {};
      for (const p of data.permissions ?? []) map[p.capability] = p.status;
      setPerms(map);
    } catch (e) {
      console.error('[connections]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll]),
  );

  const updateStatus = useCallback(
    async (capability: string, status: PermRow['status']) => {
      try {
        const tk = await getToken();
        await fetch(`${API_URL}/api/assistant/permissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
          body: JSON.stringify({ capability, status }),
        });
        setPerms((prev) => ({ ...prev, [capability]: status }));
      } catch {}
    },
    [getToken],
  );

  const connections: ConnDef[] = [
    {
      capability: 'healthkit',
      title: 'Apple Health',
      subtitle: 'Adım, kalp, uyku, antrenman, kilo',
      icon: 'heart.text.square.fill',
      color: '#FF3B30',
      request: () => requestHealthKitAuth(),
      postGrant: async () => {
        await runFullHealthKitSync({ apiUrl: API_URL, getToken });
      },
    },
    {
      capability: 'calendar_read',
      title: 'Takvim',
      subtitle: 'Etkinlikleri okur, yenisini ekleyebilir',
      icon: 'calendar',
      color: '#FF3B30',
      request: () => requestCalendarAuth(),
      postGrant: async () => {
        await syncCalendarToBackend({ apiUrl: API_URL, getToken });
      },
    },
    {
      capability: 'reminders_read',
      title: 'Hatırlatıcılar',
      subtitle: 'Görevleri okur, yenisini ekleyebilir',
      icon: 'list.bullet',
      color: '#FF9F0A',
      request: () => requestRemindersAuth(),
      postGrant: async () => {
        await syncRemindersToBackend({ apiUrl: API_URL, getToken });
      },
    },
    {
      capability: 'contacts',
      title: 'Rehber',
      subtitle: '"X\'i ara" dediğinde rehberden bulur',
      icon: 'person.crop.circle.fill',
      color: '#30D158',
      request: () => requestContactsAuth(),
      postGrant: async () => {
        await syncContactsToBackend({ apiUrl: API_URL, getToken });
      },
    },
  ];

  const toggle = async (def: ConnDef) => {
    const current = perms[def.capability] ?? 'not_asked';
    if (current === 'granted') {
      // Kapatmak istiyor — ama iOS zaten native izni revoke etmiyor, sadece bizim kayıtta işaretliyoruz
      Alert.alert(
        def.title,
        "Kapatmak için iOS Ayarları > Gizlilik'ten yapman gerek. Burada işareti düşürürsem asistan bu kaynağı kullanmaz.",
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'iOS Ayarları',
            onPress: () => Linking.openSettings(),
          },
          {
            text: 'Asistanda Kapat',
            style: 'destructive',
            onPress: () => updateStatus(def.capability, 'revoked'),
          },
        ],
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const granted = await requestAndStorePermission({
      apiUrl: API_URL,
      getToken,
      capability: def.capability,
      request: def.request,
    });
    if (granted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      def.postGrant?.();
    }
    fetchAll();
  };

  if (loading) {
    return (
      <View
        style={[
          st.root,
          { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <ActivityIndicator color={SLEEP.accent} />
      </View>
    );
  }

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
          <Text style={st.headerTitle}>Bağlantılar</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={[st.scroll, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchAll();
              }}
              tintColor={SLEEP.accent}
            />
          }
        >
          <Text style={st.intro}>
            Asistan'ın elini güçlü kılmak için bağlantı kurabilirsin. Her birini istediğin zaman
            kapatabilirsin.
          </Text>

          <View style={{ gap: 10, marginTop: 18 }}>
            {connections.map((c) => {
              const status = perms[c.capability] ?? 'not_asked';
              const isOn = status === 'granted';
              return (
                <Pressable key={c.capability} onPress={() => toggle(c)} style={connSt.card}>
                  <View style={[connSt.iconWrap, { backgroundColor: c.color + '20' }]}>
                    <SymbolView
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      name={c.icon as any}
                      size={20}
                      tintColor={c.color}
                      fallback={<Text style={{ color: c.color }}>•</Text>}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={connSt.title}>{c.title}</Text>
                    <Text style={connSt.subtitle}>{c.subtitle}</Text>
                  </View>
                  <Switch
                    value={isOn}
                    onValueChange={() => toggle(c)}
                    trackColor={{ false: '#D1D1D6', true: c.color }}
                  />
                </Pressable>
              );
            })}
          </View>

          <Text style={st.footnote}>
            Bağlantıları yönetmek için iOS Ayarları &gt; Gizlilik bölümünden de gidebilirsin.
          </Text>
        </ScrollView>
      </View>
    </>
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
  scroll: { paddingHorizontal: 18, paddingTop: 16 },
  intro: { fontFamily: font.regular, fontSize: 14, color: SLEEP.textMuted, lineHeight: 20 },
  footnote: {
    fontFamily: font.regular,
    fontSize: 12,
    color: SLEEP.textDim,
    marginTop: 24,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});

const connSt = StyleSheet.create({
  card: {
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
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: font.semibold, fontSize: 14, color: SLEEP.text, letterSpacing: -0.2 },
  subtitle: { fontFamily: font.regular, fontSize: 12, color: SLEEP.textMuted, marginTop: 2 },
});

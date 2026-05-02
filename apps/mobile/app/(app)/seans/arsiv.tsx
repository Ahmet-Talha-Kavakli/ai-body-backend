/**
 * Arşivlenmiş sohbetler — geri çıkarma veya kalıcı silme.
 */

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { font, SLEEP, API_URL } from '../tracking/uyku/_components/theme';

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  _count: { messages: number };
  messages: Array<{ content: string; role: string; createdAt: string }>;
}

export default function ArchiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [convs, setConvs] = useState<Conversation[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      const tk = await getToken();
      const res = await fetch(`${API_URL}/api/assistant/conversations?archived=true`, {
        headers: { Authorization: `Bearer ${tk}` },
      });
      const data = await res.json();
      setConvs(data.conversations ?? []);
    } catch (e) {
      console.error('[arsiv]', e);
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

  const handleLongPress = (id: string, title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(title, undefined, [
      {
        text: 'Geri Çıkar',
        onPress: async () => {
          try {
            const tk = await getToken();
            await fetch(`${API_URL}/api/assistant/conversations/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
              body: JSON.stringify({ archived: false }),
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            fetchAll();
          } catch {}
        },
      },
      {
        text: 'Kalıcı Sil',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Sohbeti Sil', 'Bu sohbet ve tüm mesajları kalıcı silinecek.', [
            { text: 'Vazgeç', style: 'cancel' },
            {
              text: 'Sil',
              style: 'destructive',
              onPress: async () => {
                try {
                  const tk = await getToken();
                  await fetch(`${API_URL}/api/assistant/conversations/${id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${tk}` },
                  });
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  fetchAll();
                } catch {}
              },
            },
          ]);
        },
      },
      { text: 'Vazgeç', style: 'cancel' },
    ]);
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
          <Text style={st.headerTitle}>Arşiv</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={SLEEP.accent} />
          </View>
        ) : convs.length === 0 ? (
          <View style={emptySt.wrap}>
            <SymbolView
              name="archivebox"
              size={36}
              tintColor={SLEEP.textDim}
              fallback={<Text style={{ fontSize: 32 }}>📦</Text>}
            />
            <Text style={emptySt.title}>Arşivde sohbet yok</Text>
            <Text style={emptySt.sub}>
              Bir sohbete uzun bas → "Arşivle" ile buraya gönderebilirsin.
            </Text>
          </View>
        ) : (
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
            <Text style={st.hint}>Uzun basıp geri çıkar veya kalıcı sil.</Text>
            <View style={{ gap: 10, marginTop: 12 }}>
              {convs.map((c) => (
                <Pressable
                  key={c.id}
                  onLongPress={() => handleLongPress(c.id, c.title)}
                  style={cardSt.wrap}
                >
                  <View style={cardSt.iconWrap}>
                    <SymbolView
                      name="archivebox.fill"
                      size={16}
                      tintColor={SLEEP.textMuted}
                      fallback={<Text>📦</Text>}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={cardSt.title} numberOfLines={1}>
                      {c.title}
                    </Text>
                    <Text style={cardSt.preview} numberOfLines={1}>
                      {c.messages[0]?.content?.slice(0, 70) ?? '—'}
                    </Text>
                  </View>
                  <Text style={cardSt.count}>{c._count.messages}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
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
  scroll: { paddingHorizontal: 18, paddingTop: 14 },
  hint: { fontFamily: font.regular, fontSize: 12, color: SLEEP.textDim, paddingHorizontal: 4 },
});

const cardSt = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    backgroundColor: SLEEP.card,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: font.semibold, fontSize: 14, color: SLEEP.text, letterSpacing: -0.2 },
  preview: { fontFamily: font.regular, fontSize: 12, color: SLEEP.textMuted, marginTop: 2 },
  count: { fontFamily: font.medium, fontSize: 11, color: SLEEP.textDim },
});

const emptySt = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  title: { fontFamily: font.bold, fontSize: 16, color: SLEEP.text, marginTop: 6 },
  sub: {
    fontFamily: font.regular,
    fontSize: 13,
    color: SLEEP.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
});

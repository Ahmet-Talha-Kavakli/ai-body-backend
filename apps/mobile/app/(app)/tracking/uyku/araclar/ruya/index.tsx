import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { font, SLEEP, API_URL } from '../../_components/theme';
import { useSleepFonts } from '../../_components/useSleepFonts';

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{ id: string; role: string; content: string }>;
  _count: { messages: number };
}

export default function RuyaListScreen() {
  const fontsLoaded = useSleepFonts();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const fetchList = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/ai/dream/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch (e) {
      console.error('[ruya/list]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useFocusEffect(
    useCallback(() => {
      fetchList();
    }, [fetchList]),
  );

  const startNew = async () => {
    if (creating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCreating(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/ai/dream/conversations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const conv = await res.json();
      router.push(`/(app)/tracking/uyku/araclar/ruya/${conv.id}`);
    } catch (e) {
      console.error('[ruya/new]', e);
    } finally {
      setCreating(false);
    }
  };

  if (!fontsLoaded) return <View style={st.root} />;

  return (
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
        <Text style={st.headerTitle}>Rüya Yorumcusu</Text>
        <Pressable onPress={startNew} hitSlop={14} style={st.newBtn} disabled={creating}>
          {creating ? (
            <ActivityIndicator size="small" color={SLEEP.accent} />
          ) : (
            <SymbolView
              name="square.and.pencil"
              size={20}
              tintColor={SLEEP.accent}
              fallback={<Text>✎</Text>}
            />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[st.scroll, { paddingBottom: insets.bottom + 120 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchList();
            }}
            tintColor={SLEEP.accent}
          />
        }
      >
        {!loading && conversations.length === 0 && (
          <EmptyState onStart={startNew} loading={creating} />
        )}

        {conversations.length > 0 && (
          <>
            <Text style={st.sectionLabel}>SOHBETLERİN</Text>
            <View style={{ gap: 10, marginTop: 10 }}>
              {conversations.map((c) => (
                <ConversationCard
                  key={c.id}
                  conv={c}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/(app)/tracking/uyku/araclar/ruya/${c.id}`);
                  }}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {conversations.length > 0 && (
        <View style={[st.fabWrap, { paddingBottom: insets.bottom + 14 }]}>
          <Pressable
            onPress={startNew}
            disabled={creating}
            style={{
              backgroundColor: SLEEP.accent,
              borderRadius: 30,
              paddingVertical: 16,
              paddingHorizontal: 24,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              shadowColor: SLEEP.accent,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
            }}
          >
            <SymbolView
              name="plus"
              size={16}
              tintColor="#fff"
              fallback={<Text style={{ color: '#fff' }}>+</Text>}
            />
            <Text style={{ fontFamily: font.bold, fontSize: 15, color: '#fff' }}>Yeni Rüya</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ConversationCard({ conv, onPress }: { conv: Conversation; onPress: () => void }) {
  const lastUserPreview = conv.title.slice(0, 80);
  const date = new Date(conv.updatedAt);
  const dateStr = formatDate(date);

  return (
    <Pressable onPress={onPress} style={cardSt.wrap}>
      <View style={cardSt.iconWrap}>
        <SymbolView
          name="moon.stars.fill"
          size={22}
          tintColor={SLEEP.accent}
          fallback={<Text style={{ fontSize: 20 }}>🌙</Text>}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={cardSt.title} numberOfLines={1}>
          {lastUserPreview || 'Yeni Rüya'}
        </Text>
        <Text style={cardSt.meta} numberOfLines={1}>
          {conv._count.messages} mesaj • {dateStr}
        </Text>
      </View>
      <SymbolView
        name="chevron.right"
        size={14}
        tintColor={SLEEP.textDim}
        fallback={<Text style={{ color: SLEEP.textDim }}>›</Text>}
      />
    </Pressable>
  );
}

function EmptyState({ onStart, loading }: { onStart: () => void; loading: boolean }) {
  return (
    <View style={emptySt.wrap}>
      <View style={emptySt.iconWrap}>
        <SymbolView
          name="moon.stars.fill"
          size={56}
          tintColor={SLEEP.accent}
          fallback={<Text style={{ fontSize: 48 }}>🌙</Text>}
        />
      </View>
      <Text style={emptySt.title}>Rüyanı yorumlayalım</Text>
      <Text style={emptySt.sub}>
        Profesyonel bir rüya yorumcusuyla sohbet et. Sembolleri, duyguları, anlamları birlikte
        çözelim.
      </Text>
      <Pressable
        onPress={onStart}
        disabled={loading}
        style={{
          marginTop: 28,
          backgroundColor: SLEEP.accent,
          borderRadius: 16,
          paddingVertical: 16,
          paddingHorizontal: 32,
          minHeight: 52,
          alignItems: 'center',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={{ fontFamily: font.bold, fontSize: 15, color: '#fff' }}>
            Yeni Sohbet Başlat
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function formatDate(d: Date) {
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'Az önce';
  if (diffMin < 60) return `${diffMin} dk önce`;
  if (diffH < 24) return `${diffH} saat önce`;
  if (diffDay < 7) return `${diffDay} gün önce`;
  const months = [
    'Oca',
    'Şub',
    'Mar',
    'Nis',
    'May',
    'Haz',
    'Tem',
    'Ağu',
    'Eyl',
    'Eki',
    'Kas',
    'Ara',
  ];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: SLEEP.page },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  newBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    fontFamily: font.bold,
    fontSize: 17,
    color: SLEEP.text,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  scroll: { paddingHorizontal: 18, paddingTop: 12 },
  sectionLabel: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: SLEEP.textDim,
    letterSpacing: 1.2,
    paddingHorizontal: 4,
  },
  fabWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 12,
  },
});

const cardSt = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: SLEEP.card,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: SLEEP.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: font.semibold, fontSize: 14, color: SLEEP.text, letterSpacing: -0.2 },
  meta: { fontFamily: font.regular, fontSize: 12, color: SLEEP.textMuted, marginTop: 3 },
});

const emptySt = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24 },
  iconWrap: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: SLEEP.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: font.extrabold,
    fontSize: 24,
    color: SLEEP.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  sub: {
    fontFamily: font.regular,
    fontSize: 14,
    color: SLEEP.textMuted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
  },
});

void Animated;

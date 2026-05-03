/**
 * Favori Anlarımız — V3 Faz B
 *
 * Yıldızlanmış mesajların listesi. Her kart tıklanınca o sohbete götürür.
 * Kullanıcı + AI'nın yıldızladığı tüm mesajlar bir arada.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { font, C, API_URL } from '../../../lib/theme';

interface StarredMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  starredAt: string;
  starredBy: 'user' | 'ai';
  createdAt: string;
  conversationId: string;
  conversationTitle: string;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState<StarredMessage[]>([]);

  const fetch_ = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/assistant/messages/starred`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setMessages(json.messages ?? []);
    } catch (e) {
      console.error('[favorites]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useFocusEffect(
    useCallback(() => {
      fetch_();
    }, [fetch_]),
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[st.root, { paddingTop: insets.top }]}>
        <View style={st.header}>
          <Pressable onPress={() => router.back()} hitSlop={14} style={st.backBtn}>
            <SymbolView
              name="chevron.left"
              size={20}
              tintColor={C.accent}
              fallback={<Text style={{ color: C.accent }}>‹</Text>}
            />
          </Pressable>
          <View style={st.headerCenter}>
            <Text style={st.headerTitle}>Favori Anlarımız</Text>
            {messages.length > 0 && <Text style={st.headerSub}>{messages.length} mesaj</Text>}
          </View>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={[st.center, { flex: 1 }]}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : messages.length === 0 ? (
          <EmptyState />
        ) : (
          <FlashList
            data={messages}
            keyExtractor={(m) => m.id}
            estimatedItemSize={120}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 32,
            }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item, index }) => (
              <FavoriteCard
                msg={item}
                index={index}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push(`/seans/${item.conversationId}`);
                }}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetch_();
                }}
                tintColor={C.accent}
              />
            }
          />
        )}
      </View>
    </>
  );
}

function FavoriteCard({
  msg,
  index,
  onPress,
}: {
  msg: StarredMessage;
  index: number;
  onPress: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay: Math.min(index, 5) * 40,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        delay: Math.min(index, 5) * 40,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  }, []);

  const date = new Date(msg.starredAt);
  const dateStr = formatRelativeDate(date);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable onPress={onPress} style={cardSt.wrap}>
        <View style={cardSt.headerRow}>
          <View style={cardSt.starIcon}>
            <SymbolView
              name="star.fill"
              size={11}
              tintColor="#FFD60A"
              fallback={<Text style={{ color: '#FFD60A' }}>⭐</Text>}
            />
          </View>
          <Text style={cardSt.role}>{msg.role === 'user' ? 'Sen' : 'AI'}</Text>
          <Text style={cardSt.dot}>·</Text>
          <Text style={cardSt.date}>{dateStr}</Text>
        </View>
        <Text style={cardSt.content} numberOfLines={4}>
          {msg.content}
        </Text>
        <Text style={cardSt.convo} numberOfLines={1}>
          {msg.conversationTitle || 'Sohbet'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function EmptyState() {
  return (
    <View style={emptySt.wrap}>
      <View style={emptySt.iconCircle}>
        <SymbolView
          name="star.fill"
          size={28}
          tintColor="#FFD60A"
          fallback={<Text style={{ fontSize: 26 }}>⭐</Text>}
        />
      </View>
      <Text style={emptySt.title}>Henüz favori an yok</Text>
      <Text style={emptySt.sub}>
        Sohbetlerde önemli bir mesaja uzun bas, "Yıldızla" de — burada birikecek.
      </Text>
    </View>
  );
}

function formatRelativeDate(d: Date) {
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'Şimdi';
  if (min < 60) return `${min}dk`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}sa`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}g`;
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.page },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontFamily: font.semibold,
    fontSize: 16,
    color: C.text,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontFamily: font.regular,
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
});

const cardSt = StyleSheet.create({
  wrap: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  starIcon: {
    width: 18,
    height: 18,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 214, 10, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  role: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: C.accent,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  dot: { color: C.textDim, fontSize: 11 },
  date: { fontFamily: font.regular, fontSize: 11, color: C.textMuted },
  content: {
    fontFamily: font.regular,
    fontSize: 14,
    color: C.text,
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  convo: {
    fontFamily: font.medium,
    fontSize: 11,
    color: C.textDim,
    marginTop: 8,
    letterSpacing: 0.2,
  },
});

const emptySt = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 214, 10, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontFamily: font.bold,
    fontSize: 18,
    color: C.text,
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: font.regular,
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
});

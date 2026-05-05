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
  Modal,
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
import { LinearGradient } from 'expo-linear-gradient';
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
  const [openCard, setOpenCard] = useState<StarredMessage | null>(null);

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
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setOpenCard(item);
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

      {/* Sinematik anı kartı modal */}
      <Modal
        visible={!!openCard}
        animationType="fade"
        transparent
        onRequestClose={() => setOpenCard(null)}
      >
        {openCard && (
          <MemoryCard
            msg={openCard}
            onClose={() => setOpenCard(null)}
            onGoToConversation={() => {
              const id = openCard.conversationId;
              setOpenCard(null);
              router.push(`/seans/${id}`);
            }}
          />
        )}
      </Modal>
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

// V3 Faz C — Sinematik anı kartı
function MemoryCard({
  msg,
  onClose,
  onGoToConversation,
}: {
  msg: StarredMessage;
  onClose: () => void;
  onGoToConversation: () => void;
}) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 240,
        easing: Easing.bezier(0.4, 0, 1, 1),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.96,
        duration: 240,
        easing: Easing.bezier(0.4, 0, 1, 1),
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const date = new Date(msg.starredAt);
  const dateStr = date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Animated.View style={[memoSt.root, { opacity }]}>
      <LinearGradient colors={['#F2EFFE', '#E0DBFC', '#F8F7FF']} style={StyleSheet.absoluteFill} />

      {/* Top bar — kapat */}
      <View style={[memoSt.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={handleClose} hitSlop={14} style={memoSt.closeBtn}>
          <SymbolView
            name="xmark"
            size={14}
            tintColor={C.textMuted}
            fallback={<Text style={{ color: C.textMuted, fontSize: 14 }}>✕</Text>}
          />
        </Pressable>
      </View>

      {/* Card content */}
      <Animated.View style={[memoSt.cardWrap, { transform: [{ scale }] }]}>
        <View style={memoSt.metaRow}>
          <View style={memoSt.starChip}>
            <SymbolView
              name="star.fill"
              size={11}
              tintColor="#FFD60A"
              fallback={<Text style={{ color: '#FFD60A' }}>⭐</Text>}
            />
            <Text style={memoSt.metaTxt}>Favori an</Text>
          </View>
          <View style={memoSt.metaDot} />
          <Text style={memoSt.metaTxt}>{msg.role === 'user' ? 'Sen' : 'AI'}</Text>
          <View style={memoSt.metaDot} />
          <Text style={memoSt.metaTxt}>{dateStr}</Text>
        </View>

        <Text style={memoSt.body} selectable>
          {msg.content}
        </Text>

        {msg.conversationTitle && <Text style={memoSt.convo}>{msg.conversationTitle}</Text>}
      </Animated.View>

      {/* Bottom action */}
      <View style={[memoSt.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            onGoToConversation();
          }}
          style={memoSt.goBtn}
        >
          <Text style={memoSt.goBtnTxt}>Sohbete git</Text>
          <SymbolView
            name="arrow.right"
            size={14}
            tintColor="#fff"
            fallback={<Text style={{ color: '#fff' }}>→</Text>}
          />
        </Pressable>
      </View>
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

// V3 Faz C — Sinematik anı kartı stilleri
const memoSt = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrap: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 22,
    flexWrap: 'wrap',
  },
  starChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,214,10,0.18)',
    borderRadius: 10,
  },
  metaTxt: {
    fontFamily: font.medium,
    fontSize: 12,
    color: C.textMuted,
    letterSpacing: -0.1,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.textDim,
    marginHorizontal: 2,
  },
  body: {
    fontFamily: font.regular,
    fontSize: 22,
    color: C.text,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  convo: {
    fontFamily: font.medium,
    fontSize: 12,
    color: C.textMuted,
    marginTop: 28,
    letterSpacing: -0.1,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  goBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.accent,
    borderRadius: 16,
    paddingVertical: 16,
    minHeight: 52,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  goBtnTxt: {
    fontFamily: font.bold,
    fontSize: 15,
    color: '#fff',
    letterSpacing: -0.2,
  },
});

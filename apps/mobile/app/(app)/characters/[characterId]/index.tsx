/**
 * V4 Faz E — Karakter Sohbet Ekranı
 *
 * Tek bir karakterle yapılan sohbeti gösterir.
 * - Üstte: avatar + isim + status (mood / activity / location)
 * - Mesajlar: WhatsApp tarzı balonlar
 * - "Yazıyor..." indikatörü stream sırasında
 * - Alt input
 *
 * Stream akışı: streamCharacterMessage callbacks'leri ile chunk-by-chunk dolar.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import ContextMenu from 'react-native-context-menu-view';
import { font, C, API_URL } from '../../../../lib/theme';
import {
  fetchCharacterMessages,
  markCharacterAsRead,
  streamCharacterMessage,
  type CharacterMessage,
} from '../../../../src/services/assistant/characters';

const MOOD_EMOJI: Record<string, string> = {
  calm: '🌿',
  energetic: '⚡',
  thoughtful: '💭',
  tired: '🌙',
  happy: '✨',
  sad: '🥲',
  anxious: '😶‍🌫️',
  angry: '😤',
};

interface HeaderState {
  name: string;
  bio: string | null;
  avatarUrl?: string | null;
  currentMood: string | null;
  currentActivity?: string | null;
  currentLocation?: string | null;
}

function TypingDots() {
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  const a3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const make = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            delay,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
        ]),
      );

    const loops = [make(a1, 0), make(a2, 150), make(a3, 300)];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [a1, a2, a3]);

  const dotStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
    transform: [
      {
        translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }),
      },
    ],
  });

  return (
    <View style={styles.typingDots}>
      <Animated.View style={[styles.dot, dotStyle(a1)]} />
      <Animated.View style={[styles.dot, dotStyle(a2)]} />
      <Animated.View style={[styles.dot, dotStyle(a3)]} />
    </View>
  );
}

interface ChatBubbleProps {
  message:
    | CharacterMessage
    | { id: string; role: 'assistant'; content: string; createdAt: string; pending?: boolean };
  characterName: string;
  onStarToggle?: (messageId: string, starred: boolean) => void;
  isStarred?: boolean;
}

function ChatBubble({ message, characterName, onStarToggle, isStarred }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const isPending = 'pending' in message && message.pending;
  const isTemp = message.id.startsWith('tmp-') || message.id.startsWith('streaming-');

  // Pop-in entrance: scale + translate + fade
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 180,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bubble = (
    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
      <Text
        style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}
      >
        {message.content || (isPending ? '…' : '')}
      </Text>
      {isStarred && (
        <Text
          style={{
            position: 'absolute',
            top: 4,
            right: 6,
            fontSize: 10,
            color: '#FFC107',
            fontFamily: font.regular,
          }}
        >
          ⭐
        </Text>
      )}
    </View>
  );

  // Geçici mesaj (gönderilirken / streaming) — sadece kopyala
  if (isTemp || !message.content) {
    return (
      <Animated.View
        style={[
          styles.bubbleRow,
          isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant,
          { opacity, transform: [{ translateY }, { scale }] },
        ]}
      >
        {message.content ? (
          <ContextMenu
            actions={[{ title: 'Kopyala', systemIcon: 'doc.on.doc' }]}
            onPress={async (e) => {
              if (e.nativeEvent.index === 0) {
                await Clipboard.setStringAsync(message.content);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }}
          >
            {bubble}
          </ContextMenu>
        ) : (
          bubble
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.bubbleRow,
        isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant,
        { opacity, transform: [{ translateY }, { scale }] },
      ]}
    >
      <ContextMenu
        actions={[
          { title: 'Kopyala', systemIcon: 'doc.on.doc' },
          {
            title: isStarred ? 'Yıldızı Kaldır' : 'Yıldızla',
            systemIcon: isStarred ? 'star.slash' : 'star',
          },
        ]}
        onPress={async (e) => {
          const idx = e.nativeEvent.index;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (idx === 0) {
            await Clipboard.setStringAsync(message.content);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else if (idx === 1) {
            onStarToggle?.(message.id, !isStarred);
          }
        }}
      >
        {bubble}
      </ContextMenu>
    </Animated.View>
  );
}

export default function CharacterChatScreen() {
  const router = useRouter();
  const { characterId } = useLocalSearchParams<{ characterId: string }>();
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const headerAvatarScale = useRef(new Animated.Value(1)).current;
  const sendBtnScale = useRef(new Animated.Value(1)).current;

  const [header, setHeader] = useState<HeaderState | null>(null);
  const [messages, setMessages] = useState<
    Array<
      | CharacterMessage
      | { id: string; role: 'assistant'; content: string; createdAt: string; pending?: boolean }
    >
  >([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');

  const load = useCallback(async () => {
    if (!characterId) return;
    try {
      const token = await getToken();
      if (!token) return;
      const data = await fetchCharacterMessages(token, characterId);
      setHeader(data.character);
      // Akıllı merge: optimistic (tmp-) mesajları koru, ama içeriği server'da varsa sil
      setMessages((prev) => {
        const tmpMessages = prev.filter((m) => m.id.startsWith('tmp-'));
        const serverContents = new Set(data.messages.map((m) => m.content));
        const stillPending = tmpMessages.filter((m) => !serverContents.has(m.content));
        return [...data.messages, ...stillPending];
      });
      markCharacterAsRead(token, characterId).catch(() => {});
    } catch (e) {
      // 401 vb. sessizce geç
    }
  }, [characterId, getToken]);

  useEffect(() => {
    load();
  }, [load]);

  // Scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length, streamingText]);

  const onStarToggle = useCallback(
    async (messageId: string, starred: boolean) => {
      try {
        const token = await getToken();
        if (!token) return;
        await fetch(`${API_URL}/api/assistant/messages/${messageId}/star`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ starred }),
        });
        // Optimistic update — local state'te starredAt'i toggle et
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            // Streaming/temp mesajlar için starredAt yok, atla
            if (!('starredAt' in m)) return m;
            return { ...m, starredAt: starred ? new Date().toISOString() : null };
          }),
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        console.error('[character-chat] star toggle fail:', e);
      }
    },
    [getToken],
  );

  const onSend = async () => {
    if (!input.trim() || sending || !characterId) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic kullanıcı mesajı
    const tempUserMsg: CharacterMessage = {
      id: `tmp-user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
      starredAt: null,
      readAt: null,
      repliedToMessageId: null,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    // Stream başlat
    const streamId = `streaming-${Date.now()}`;
    setStreamingMessageId(streamId);
    setStreamingText('');

    try {
      const token = await getToken();
      if (!token) throw new Error('No token');

      let accumulated = '';
      await streamCharacterMessage(token, characterId, text, {
        onChunk: (delta) => {
          accumulated += delta;
          setStreamingText(accumulated);
        },
        onComplete: (messageId) => {
          // Mesaj geldi — soft haptic ding
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Stream'i kalıcı mesaja çevir — duplicate id varsa eklemeyi atla
          setMessages((prev) => {
            if (prev.some((m) => m.id === messageId)) return prev;
            return [
              ...prev,
              {
                id: messageId,
                role: 'assistant',
                content: accumulated,
                createdAt: new Date().toISOString(),
                starredAt: null,
                readAt: new Date().toISOString(),
                repliedToMessageId: null,
              },
            ];
          });
          setStreamingMessageId(null);
          setStreamingText('');
        },
        onSkipped: (reason) => {
          setStreamingMessageId(null);
          setStreamingText('');
          // Skip bilgisi UI'da gösterilebilir — Faz E sonu polish
          console.log('[character-chat] skipped:', reason);
        },
        onError: (msg) => {
          console.error('[character-chat] stream error:', msg);
          setStreamingMessageId(null);
          setStreamingText('');
          // Optimistic kullanıcı mesajını koru (server'a yazıldı), sadece stream durdu
          // load() çağırınca akıllı merge zaten doğru sonucu verir
        },
      });
      // Stream başarılı bitti — server'dan kesin gerçek mesajı çek (id'leri eşitle)
      load();
    } catch (e) {
      console.error('[character-chat] send fail:', e);
      setStreamingMessageId(null);
      setStreamingText('');
    } finally {
      setSending(false);
    }
  };

  // WhatsApp tarzı son görülme / durum
  // - Yazıyorsa zaten streamingMessageId'den biliyoruz, ama header'da basit tutalım
  // - currentActivity sleeping → "uyuyor"
  // - kafede / işte / dışarda → "kafede" / "işte" / "dışarda"
  // - default → "çevrimiçi"
  const activityLabels: Record<string, string> = {
    sleeping: 'uyuyor',
    sleep: 'uyuyor',
    eating: 'yemekte',
    working: 'işte',
    cafe: 'kafede',
    outside: 'dışarda',
    resting: 'dinleniyor',
  };
  const headerStatus = streamingMessageId
    ? 'yazıyor…'
    : header?.currentActivity && activityLabels[header.currentActivity]
      ? activityLabels[header.currentActivity]
      : 'çevrimiçi';

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={C.accent} />
        </Pressable>
        <Pressable
          style={styles.headerCenter}
          onPress={() => {
            // Avatar bounce
            Animated.sequence([
              Animated.timing(headerAvatarScale, {
                toValue: 1.15,
                duration: 110,
                useNativeDriver: true,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
              }),
              Animated.spring(headerAvatarScale, {
                toValue: 1,
                tension: 200,
                friction: 7,
                useNativeDriver: true,
              }),
            ]).start();
            Haptics.selectionAsync();
            router.push(`/(app)/characters/${characterId}/profile`);
          }}
        >
          {header?.avatarUrl ? (
            <Animated.Image
              source={{ uri: header.avatarUrl }}
              style={[styles.headerAvatar, { transform: [{ scale: headerAvatarScale }] }]}
            />
          ) : (
            <Animated.View
              style={[styles.headerAvatar, { transform: [{ scale: headerAvatarScale }] }]}
            >
              <Text style={styles.headerAvatarFallback}>{header?.name?.[0]}</Text>
            </Animated.View>
          )}
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.headerName}>{header?.name}</Text>
            {!!headerStatus && <Text style={styles.headerStatus}>{headerStatus}</Text>}
          </View>
        </Pressable>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m, idx) => `${m.id}-${idx}`}
        renderItem={({ item }) => (
          <ChatBubble
            message={item}
            characterName={header?.name ?? ''}
            isStarred={'starredAt' in item ? !!item.starredAt : false}
            onStarToggle={onStarToggle}
          />
        )}
        contentContainerStyle={styles.messagesContent}
        ListFooterComponent={
          streamingMessageId ? (
            <View>
              {streamingText ? (
                <ChatBubble
                  message={{
                    id: streamingMessageId,
                    role: 'assistant',
                    content: streamingText,
                    createdAt: new Date().toISOString(),
                  }}
                  characterName={header?.name ?? ''}
                />
              ) : (
                <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
                  <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
                    <TypingDots />
                  </View>
                </View>
              )}
            </View>
          ) : null
        }
      />

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Mesaj yaz…"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          multiline
          editable={!sending}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={() => {
            if (input.trim() && !sending) onSend();
          }}
        />
        <Animated.View style={{ transform: [{ scale: sendBtnScale }] }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              Animated.sequence([
                Animated.timing(sendBtnScale, {
                  toValue: 0.85,
                  duration: 90,
                  useNativeDriver: true,
                }),
                Animated.spring(sendBtnScale, {
                  toValue: 1,
                  tension: 200,
                  friction: 8,
                  useNativeDriver: true,
                }),
              ]).start();
              onSend();
            }}
            disabled={!input.trim() || sending}
            style={[styles.sendBtn, (!input.trim() || sending) && { opacity: 0.4 }]}
          >
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.accentSofter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarFallback: { fontFamily: font.semibold, fontSize: 16, color: C.accent },
  headerName: { fontFamily: font.semibold, fontSize: 17, color: '#0A0A0A' },
  headerStatus: { fontFamily: font.regular, fontSize: 12, color: '#6B7280', marginTop: 1 },
  messagesContent: { paddingHorizontal: 16, paddingVertical: 12 },
  bubbleRow: { flexDirection: 'row', marginVertical: 3 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowAssistant: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  bubbleUser: {
    backgroundColor: C.accent,
    borderBottomRightRadius: 6,
  },
  bubbleAssistant: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 6,
  },
  bubbleText: { fontFamily: font.regular, fontSize: 16, lineHeight: 22 },
  bubbleTextUser: { color: '#FFFFFF' },
  bubbleTextAssistant: { color: '#0A0A0A' },
  typingBubble: { paddingVertical: 14, paddingHorizontal: 16, minWidth: 60 },
  typingDots: { flexDirection: 'row', gap: 4 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#9CA3AF',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 16,
    color: '#0A0A0A',
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    minHeight: 40,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

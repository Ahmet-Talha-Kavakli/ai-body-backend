import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
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
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { font, SLEEP, API_URL } from '../../_components/theme';
import { useSleepFonts } from '../../_components/useSleepFonts';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export default function RuyaChatScreen() {
  const fontsLoaded = useSleepFonts();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [title, setTitle] = useState('Rüya Yorumcusu');

  const listRef = useRef<FlatList<Message>>(null);

  const fetchConversation = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/ai/dream/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(data.messages ?? []);
      if (data.title) setTitle(data.title);
    } catch (e) {
      console.error('[ruya/chat]', e);
    } finally {
      setLoading(false);
    }
  }, [id, getToken]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    }
  }, [messages.length, sending]);

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;

    setInput('');
    Haptics.selectionAsync();

    // Optimistic kullanıcı mesajı
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/ai/dream/conversations/${id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.userMessage && data.aiMessage) {
        setMessages((prev) => {
          // Optimistic'i sil + var olan id'leri çıkar (dedup)
          const filtered = prev.filter(
            (m) =>
              m.id !== optimistic.id && m.id !== data.userMessage.id && m.id !== data.aiMessage.id,
          );
          return [...filtered, data.userMessage, data.aiMessage];
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e) {
      console.error('[ruya/send]', e);
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View
        style={[
          st.root,
          { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator color={SLEEP.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[st.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={st.header}>
        <Pressable onPress={() => router.back()} hitSlop={14} style={st.backBtn}>
          <SymbolView
            name="chevron.left"
            size={20}
            tintColor={SLEEP.accent}
            fallback={<Text style={{ color: SLEEP.accent }}>‹</Text>}
          />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={st.avatarSmall}>
            <SymbolView
              name="moon.stars.fill"
              size={14}
              tintColor={SLEEP.accent}
              fallback={<Text style={{ fontSize: 12 }}>🌙</Text>}
            />
          </View>
          <Text style={st.headerTitle} numberOfLines={1}>
            {title.length > 32 ? title.slice(0, 32) + '…' : title}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m, i) => `${m.id}-${i}`}
        contentContainerStyle={[st.list, { paddingBottom: 16 }]}
        renderItem={({ item, index }) => (
          <MessageBubble message={item} previous={messages[index - 1]} />
        )}
        ListFooterComponent={sending ? <TypingIndicator /> : null}
        showsVerticalScrollIndicator={false}
      />

      <View style={[st.inputWrap, { paddingBottom: insets.bottom + 8 }]}>
        <View style={st.inputBubble}>
          <TextInput
            style={st.input}
            value={input}
            onChangeText={setInput}
            placeholder="Rüyanı anlat..."
            placeholderTextColor={SLEEP.textDim}
            multiline
            maxLength={2000}
            editable={!sending}
          />
          <Pressable
            onPress={send}
            disabled={!input.trim() || sending}
            style={[
              st.sendBtn,
              {
                backgroundColor: input.trim() && !sending ? SLEEP.accent : '#D1D1D6',
              },
            ]}
          >
            <SymbolView
              name="arrow.up"
              size={16}
              tintColor="#fff"
              fallback={<Text style={{ color: '#fff', fontSize: 14 }}>↑</Text>}
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Mesaj balonu
function MessageBubble({ message, previous }: { message: Message; previous?: Message }) {
  const isUser = message.role === 'user';
  const showSpacing = previous && previous.role !== message.role;

  return (
    <View style={[bubbleSt.row, { marginTop: showSpacing ? 12 : 3 }]}>
      <View style={isUser ? bubbleSt.userOuter : bubbleSt.aiOuter}>
        <View style={[bubbleSt.bubble, isUser ? bubbleSt.user : bubbleSt.ai]}>
          <Text style={[bubbleSt.text, isUser ? bubbleSt.userText : bubbleSt.aiText]}>
            {message.content}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Typing indicator (3 nokta)
function TypingIndicator() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 380,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 1, 1),
          }),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={[bubbleSt.row, { marginTop: 12 }]}>
      <View style={bubbleSt.aiOuter}>
        <View style={[bubbleSt.bubble, bubbleSt.ai, typingSt.bubble]}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[
                typingSt.dot,
                {
                  opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
                  transform: [
                    { translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── styles
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
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: SLEEP.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: SLEEP.textMuted,
    letterSpacing: -0.1,
  },

  list: { paddingHorizontal: 14, paddingTop: 14 },

  inputWrap: {
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: SLEEP.page,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SLEEP.border,
  },
  inputBubble: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: SLEEP.border,
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 4,
    minHeight: 40,
  },
  input: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 16,
    color: SLEEP.text,
    lineHeight: 22,
    paddingTop: 6,
    paddingBottom: 6,
    maxHeight: 120,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    marginBottom: 2,
  },
});

const bubbleSt = StyleSheet.create({
  row: { flexDirection: 'row' },
  userOuter: { flex: 1, alignItems: 'flex-end' },
  aiOuter: { flex: 1, alignItems: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  user: { backgroundColor: SLEEP.accent, borderBottomRightRadius: 6 },
  ai: { backgroundColor: '#E9E9EB', borderBottomLeftRadius: 6 },
  text: { fontFamily: font.regular, fontSize: 16, lineHeight: 22, letterSpacing: -0.2 },
  userText: { color: '#fff' },
  aiText: { color: SLEEP.text },
});

const typingSt = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: SLEEP.textMuted },
});

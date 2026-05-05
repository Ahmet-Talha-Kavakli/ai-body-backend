/**
 * V4 Faz F — Grup Sohbet Ekranı
 *
 * WhatsApp tarzı grup sohbet:
 *  - Üstte grup adı + üye sayısı
 *  - Mesaj balonları: kullanıcı sağda mor, karakter solda renkli (per-karakter hash)
 *  - Karakter mesajının üstünde mini avatar + isim
 *  - Altta input + gönder
 *  - 5sn polling (yeni karakter mesajları gelir)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import * as Haptics from 'expo-haptics';
import { font, C } from '../../../../lib/theme';
import {
  getGroup,
  listGroupMessages,
  sendGroupMessage,
  type GroupListItem,
  type GroupMessage,
} from '../../../../src/services/assistant/groups';

const POLL_MS = 5000;

function characterBubbleColor(id: string): { bg: string; name: string } {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  const hue = h % 360;
  return {
    bg: `hsl(${hue}, 70%, 94%)`,
    name: `hsl(${hue}, 60%, 35%)`,
  };
}

function MessageBubble({
  msg,
  isMe,
  showSender,
}: {
  msg: GroupMessage;
  isMe: boolean;
  showSender: boolean;
}) {
  if (isMe) {
    return (
      <View style={[styles.bubbleRow, { justifyContent: 'flex-end' }]}>
        <View style={[styles.bubble, styles.bubbleMe]}>
          <Text style={styles.bubbleMeText}>{msg.content}</Text>
        </View>
      </View>
    );
  }

  const colors = msg.senderCharacterId
    ? characterBubbleColor(msg.senderCharacterId)
    : { bg: '#F3F4F6', name: '#6B7280' };

  return (
    <View style={[styles.bubbleRow, { justifyContent: 'flex-start' }]}>
      <View style={styles.charSide}>
        {showSender && msg.senderCharacter?.avatarUrl ? (
          <Image source={{ uri: msg.senderCharacter.avatarUrl }} style={styles.charAvatar} />
        ) : showSender ? (
          <View style={[styles.charAvatar, { backgroundColor: C.accentSofter }]}>
            <Text style={styles.charAvatarFallback}>{msg.senderCharacter?.name?.[0] ?? '?'}</Text>
          </View>
        ) : (
          <View style={styles.charAvatar} />
        )}
      </View>

      <View style={{ maxWidth: '76%' }}>
        {showSender && (
          <Text style={[styles.senderName, { color: colors.name }]}>
            {msg.senderCharacter?.name ?? 'biri'}
          </Text>
        )}
        <View style={[styles.bubble, { backgroundColor: colors.bg }]}>
          <Text style={styles.bubbleText}>{msg.content}</Text>
        </View>
      </View>
    </View>
  );
}

export default function GroupChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [group, setGroup] = useState<GroupListItem | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingTypers, setPendingTypers] = useState<string[]>([]);

  const listRef = useRef<FlatList<GroupMessage>>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadGroup = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token || !id) return;
      const g = await getGroup(token, id);
      setGroup(g);
    } catch (e) {
      console.error('[group] loadGroup', e);
    }
  }, [getToken, id]);

  const loadMessages = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token || !id) return;
      const msgs = await listGroupMessages(token, id, { take: 50 });
      setMessages(msgs);
    } catch (e) {
      console.error('[group] loadMessages', e);
    }
  }, [getToken, id]);

  useEffect(() => {
    (async () => {
      await Promise.all([loadGroup(), loadMessages()]);
      setLoading(false);
    })();
  }, [loadGroup, loadMessages]);

  // Polling
  useEffect(() => {
    pollRef.current = setInterval(() => {
      loadMessages();
    }, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadMessages]);

  // Yeni mesaj geldiğinde scroll en alta
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length]);

  // Yeni karakter mesajı gelince typer'ı listeden çıkar
  useEffect(() => {
    if (pendingTypers.length === 0) return;
    const lastCharIds = new Set(
      messages
        .filter((m) => m.senderType === 'character' && m.senderCharacterId)
        .slice(-5)
        .map((m) => m.senderCharacterId as string),
    );
    setPendingTypers((prev) =>
      prev.filter((name) => {
        const member = group?.members.find((mb) => mb.character.name === name);
        if (!member) return false;
        return !lastCharIds.has(member.character.id);
      }),
    );
  }, [messages, group, pendingTypers.length]);

  const onSend = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic kullanıcı balonu
    const optimistic: GroupMessage = {
      id: `local-${Date.now()}`,
      senderType: 'user',
      senderCharacterId: null,
      senderCharacter: null,
      content,
      repliedToMessageId: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');

    try {
      const token = await getToken();
      if (!token || !id) throw new Error('no_token');
      const result = await sendGroupMessage(token, id, content);

      // "Yazıyor..." göstergesi — cevap verecek karakterler
      const typerNames = result.decisions.filter((d) => d.respond).map((d) => d.characterName);
      setPendingTypers(typerNames);

      // Optimistic mesajı server kayıdı ile değiştir
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimistic.id ? { ...result.message, senderCharacter: null } : m,
        ),
      );
    } catch (e) {
      console.error('[group] send fail', e);
      // Optimistic mesajı sil
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const subtitle = useMemo(() => {
    if (!group) return '';
    return `${group.members.length} kişi`;
  }, [group]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <Text style={styles.emptyText}>Grup bulunamadı</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
    >
      <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.navTitle} numberOfLines={1}>
            {group.title}
          </Text>
          <Text style={styles.navSubtitle}>{subtitle}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item, index }) => {
          const prev = index > 0 ? messages[index - 1] : null;
          const showSender =
            item.senderType === 'character' &&
            (!prev || prev.senderCharacterId !== item.senderCharacterId);
          return (
            <MessageBubble msg={item} isMe={item.senderType === 'user'} showSender={showSender} />
          );
        }}
        contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 12 }}
        ListFooterComponent={
          pendingTypers.length > 0 ? (
            <View style={styles.typingRow}>
              <Text style={styles.typingText}>{pendingTypers.join(', ')} yazıyor…</Text>
            </View>
          ) : null
        }
      />

      <View style={[styles.inputBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Mesaj yaz…"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          multiline
          maxLength={4000}
        />
        <Pressable
          onPress={onSend}
          disabled={!input.trim() || sending}
          style={({ pressed }) => [
            styles.sendBtn,
            (!input.trim() || sending) && { opacity: 0.4 },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  emptyText: {
    fontFamily: font.regular,
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  back: {
    fontFamily: font.regular,
    fontSize: 17,
    color: C.accent,
    minWidth: 60,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  navTitle: {
    fontFamily: font.semibold,
    fontSize: 17,
    color: '#0A0A0A',
    letterSpacing: -0.3,
  },
  navSubtitle: {
    fontFamily: font.regular,
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  charSide: {
    width: 36,
    marginRight: 6,
  },
  charAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charAvatarFallback: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: C.accent,
  },
  senderName: {
    fontFamily: font.semibold,
    fontSize: 12,
    marginBottom: 3,
    marginLeft: 14,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: C.accent,
    borderBottomRightRadius: 4,
  },
  bubbleMeText: {
    fontFamily: font.regular,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  bubbleText: {
    fontFamily: font.regular,
    fontSize: 16,
    color: '#0A0A0A',
    lineHeight: 22,
  },
  typingRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontFamily: font.regular,
    fontSize: 13,
    color: C.accent,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 16,
    color: '#0A0A0A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    maxHeight: 120,
    minHeight: 40,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontFamily: font.bold,
    fontSize: 22,
    lineHeight: 24,
  },
});

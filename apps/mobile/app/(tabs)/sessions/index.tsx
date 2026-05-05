/**
 * V4.5 Faz 2 — Sohbetler Listesi (WhatsApp tarzı)
 *
 * Üstte Jarvis sabit (pinned), altında karakterler + gruplar son etkileşime göre.
 *
 * Ana kaynaklar:
 *  - GET /api/assistant/conversations?archived=false → Jarvis sohbeti (tek)
 *  - GET /api/assistant/characters → karakter listesi + son mesaj
 *  - GET /api/assistant/groups → grup listesi + son mesaj
 *
 * Sıralama:
 *  - Jarvis her zaman 0. sırada
 *  - Diğerleri lastMessageAt DESC
 *
 * Polling: 8sn'de bir yenile.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import * as Haptics from 'expo-haptics';
import { font, C } from '../../../lib/theme';
import { listCharacters, type CharacterListItem } from '../../../src/services/assistant/characters';
import { listGroups, type GroupListItem } from '../../../src/services/assistant/groups';
import { API_URL } from '../../../lib/theme';

interface JarvisConversation {
  id: string;
  title: string;
  updatedAt: string;
  aiTypingUntil?: string | null;
  messages: Array<{ content: string; role: string; createdAt: string }>;
  _count?: { messages: number };
}

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

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = Date.now();
  const diff = (now - date.getTime()) / 1000;
  if (diff < 60) return 'şimdi';
  if (diff < 3600) return `${Math.floor(diff / 60)}d`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}s`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}g`;
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

type ListItem =
  | { kind: 'jarvis'; data: JarvisConversation; sortAt: string }
  | { kind: 'character'; data: CharacterListItem; sortAt: string }
  | { kind: 'group'; data: GroupListItem; sortAt: string };

// ─── Row Components ──────────────────────────────────────────────────────────

function JarvisRow({ item, onPress }: { item: JarvisConversation; onPress: () => void }) {
  const last = item.messages?.[0];
  const isTyping = item.aiTypingUntil && new Date(item.aiTypingUntil).getTime() > Date.now();
  const lastText = isTyping
    ? 'yazıyor…'
    : last
      ? last.role === 'user'
        ? `Sen: ${last.content}`
        : last.content
      : 'AI asistanın';

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.avatarBox}>
        <View style={[styles.avatar, { backgroundColor: C.accent }]}>
          <Text style={[styles.avatarFallback, { color: '#FFFFFF' }]}>J</Text>
        </View>
        <View style={[styles.pinBadge]}>
          <Text style={styles.pinIcon}>📌</Text>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.titleLine}>
          <Text style={styles.name}>Jarvis</Text>
          <Text style={styles.time}>{relativeTime(last?.createdAt ?? item.updatedAt)}</Text>
        </View>
        <View style={styles.previewLine}>
          <Text
            style={[styles.preview, isTyping && { color: C.accent, fontFamily: font.medium }]}
            numberOfLines={1}
          >
            {lastText}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function CharacterRow({ item, onPress }: { item: CharacterListItem; onPress: () => void }) {
  const lastText = item.isTyping
    ? 'yazıyor…'
    : item.lastMessage
      ? item.lastMessage.role === 'assistant'
        ? item.lastMessage.content
        : `Sen: ${item.lastMessage.content}`
      : (item.bio?.slice(0, 60) ?? '');

  const moodEmoji = item.currentMood ? MOOD_EMOJI[item.currentMood] : null;
  const isCold = item.relationship?.status === 'cold';
  const isBroken = item.relationship?.status === 'broken';
  const isSilent = item.relationship?.status === 'silent';

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.avatarBox}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: C.accentSofter }]}>
            <Text style={styles.avatarFallback}>{item.name[0]}</Text>
          </View>
        )}
        {moodEmoji && (
          <View style={styles.moodBadge}>
            <Text style={styles.moodEmoji}>{moodEmoji}</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.titleLine}>
          <Text style={styles.name}>
            {item.name}
            {isBroken && ' 💔'}
            {isSilent && ' 🔇'}
          </Text>
          <Text style={styles.time}>{relativeTime(item.lastMessageAt ?? item.arrivedAt)}</Text>
        </View>
        <View style={styles.previewLine}>
          <Text
            style={[
              styles.preview,
              item.isTyping && { color: C.accent, fontFamily: font.medium },
              isCold && { color: '#9CA3AF', fontStyle: 'italic' },
            ]}
            numberOfLines={1}
          >
            {lastText}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function GroupRow({ item, onPress }: { item: GroupListItem; onPress: () => void }) {
  const last = item.messages?.[0];
  const lastText = last
    ? last.senderType === 'user'
      ? `Sen: ${last.content}`
      : `${last.senderCharacter?.name ?? 'biri'}: ${last.content}`
    : `${item.members.length} üye`;
  const avatars = item.members.slice(0, 2);

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.avatarBox}>
        <View style={styles.groupAvatarComposite}>
          {avatars.map((m, idx) => (
            <View
              key={m.id}
              style={[
                styles.groupAvatarPart,
                {
                  left: idx === 0 ? 0 : 18,
                  top: idx === 0 ? 0 : 18,
                  zIndex: idx === 0 ? 2 : 1,
                },
              ]}
            >
              {m.character.avatarUrl ? (
                <Image source={{ uri: m.character.avatarUrl }} style={styles.groupAvatarImg} />
              ) : (
                <View
                  style={[
                    styles.groupAvatarImg,
                    {
                      backgroundColor: C.accentSofter,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}
                >
                  <Text style={styles.avatarFallback}>{m.character.name[0]}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.titleLine}>
          <Text style={styles.name} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.time}>{relativeTime(last?.createdAt ?? item.updatedAt)}</Text>
        </View>
        <View style={styles.previewLine}>
          <Text style={styles.preview} numberOfLines={1}>
            {lastText}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function SessionsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [jarvis, setJarvis] = useState<JarvisConversation | null>(null);
  const [characters, setCharacters] = useState<CharacterListItem[]>([]);
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [groupFlagEnabled, setGroupFlagEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const [convRes, charData, groupData] = await Promise.all([
        // Jarvis sohbeti — tek olduğu için ilk satırı al
        fetch(`${API_URL}/api/assistant/conversations?archived=false`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => (r.ok ? r.json() : { conversations: [] }))
          .catch(() => ({ conversations: [] })),
        listCharacters(token).catch(() => ({
          characters: [] as CharacterListItem[],
          flagEnabled: false,
        })),
        listGroups(token).catch(() => ({
          groups: [] as GroupListItem[],
          flagEnabled: false,
        })),
      ]);

      const convs = (convRes?.conversations ?? []) as JarvisConversation[];
      // Tek Jarvis sohbeti — yoksa otomatik oluştur
      let jarvisConv: JarvisConversation | null = convs[0] ?? null;
      if (!jarvisConv) {
        const created = await fetch(`${API_URL}/api/assistant/conversations`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => (r.ok ? r.json() : null));
        if (created?.id) {
          jarvisConv = {
            id: created.id,
            title: created.title ?? 'Jarvis',
            updatedAt: created.updatedAt ?? new Date().toISOString(),
            messages: [],
          };
        }
      }
      setJarvis(jarvisConv);
      setCharacters(charData.characters);
      setGroups(groupData.groups);
      setGroupFlagEnabled(groupData.flagEnabled);
    } catch (e) {
      // 401 vb. sessize al
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
      const id = setInterval(load, 8000);
      return () => clearInterval(id);
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  // Birleşik liste — Jarvis 0. sırada sabit, kalanı son etkileşime göre
  const otherItems: ListItem[] = [
    ...characters.map((c) => ({
      kind: 'character' as const,
      data: c,
      sortAt: c.lastMessageAt ?? c.arrivedAt,
    })),
    ...groups.map((g) => ({
      kind: 'group' as const,
      data: g,
      sortAt: g.messages?.[0]?.createdAt ?? g.updatedAt,
    })),
  ].sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime());

  const combined: ListItem[] = jarvis
    ? [{ kind: 'jarvis', data: jarvis, sortAt: jarvis.updatedAt }, ...otherItems]
    : otherItems;

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  const totalCount = (jarvis ? 1 : 0) + characters.length + groups.length;
  const canCreateGroup = groupFlagEnabled && characters.length >= 2;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Sohbetler</Text>
          {canCreateGroup && (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/(app)/characters/new-group');
              }}
              hitSlop={12}
              style={styles.newGroupBtn}
            >
              <Text style={styles.newGroupBtnText}>＋ Grup</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.subtitle}>
          {totalCount === 0 ? 'Henüz sohbet yok' : `${totalCount} sohbet`}
        </Text>
      </View>

      <FlatList
        data={combined}
        keyExtractor={(item) => `${item.kind}:${item.data.id}`}
        renderItem={({ item }) => {
          if (item.kind === 'jarvis') {
            return (
              <JarvisRow
                item={item.data}
                onPress={() => router.push(`/(app)/seans/${item.data.id}`)}
              />
            );
          }
          if (item.kind === 'character') {
            return (
              <CharacterRow
                item={item.data}
                onPress={() => router.push(`/(app)/characters/${item.data.id}`)}
              />
            );
          }
          return (
            <GroupRow
              item={item.data}
              onPress={() => router.push(`/(app)/characters/group/${item.data.id}`)}
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  newGroupBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: C.accentSofter,
    marginBottom: 6,
  },
  newGroupBtnText: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: C.accent,
    letterSpacing: -0.2,
  },
  title: {
    fontFamily: font.bold,
    fontSize: 32,
    letterSpacing: -0.6,
    color: '#0A0A0A',
  },
  subtitle: {
    fontFamily: font.regular,
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 72,
  },
  avatarBox: {
    width: 56,
    height: 56,
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallback: {
    fontFamily: font.semibold,
    fontSize: 22,
    color: C.accent,
  },
  pinBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinIcon: {
    fontSize: 11,
  },
  moodBadge: {
    position: 'absolute',
    right: -4,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 12,
  },
  groupAvatarComposite: {
    width: 56,
    height: 56,
    position: 'relative',
  },
  groupAvatarPart: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  groupAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
  },
  body: {
    flex: 1,
  },
  titleLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontFamily: font.semibold,
    fontSize: 17,
    color: '#0A0A0A',
    letterSpacing: -0.3,
  },
  time: {
    fontFamily: font.regular,
    fontSize: 13,
    color: '#9CA3AF',
  },
  previewLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preview: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 15,
    color: '#6B7280',
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 11,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  separator: {
    height: 1,
    marginLeft: 90,
    backgroundColor: '#F3F4F6',
  },
});

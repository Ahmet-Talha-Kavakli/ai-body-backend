/**
 * V4 Faz E — Karakterler Sohbet Listesi (WhatsApp tarzı)
 *
 * Kullanıcının aktif karakterlerini listeler. Her karakter satırı:
 *  - Avatar (yuvarlak)
 *  - İsim + son mesaj ön izlemesi
 *  - Saat + okunmamış rozeti
 *  - Status göstergesi (mood emoji / küs / ayrılmış)
 *  - "Yazıyor..." animasyonu (varsa)
 *
 * Tıklayınca karakter sohbet ekranına gidiyor.
 *
 * Flag (v4_characters) kapalıysa "Henüz tanışmadığın biri yok" mesajı.
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

function relativeTime(iso: string | null): string {
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
  | { kind: 'character'; data: CharacterListItem; sortAt: string }
  | { kind: 'group'; data: GroupListItem; sortAt: string };

function GroupRow({ item, onPress }: { item: GroupListItem; onPress: () => void }) {
  const last = item.messages?.[0];
  const lastText = last
    ? last.senderType === 'user'
      ? `Sen: ${last.content}`
      : `${last.senderCharacter?.name ?? 'biri'}: ${last.content}`
    : `${item.members.length} üye`;

  // İlk 2 üyenin avatarı yan yana (kompozit)
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

export default function CharactersScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [characters, setCharacters] = useState<CharacterListItem[]>([]);
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [flagEnabled, setFlagEnabled] = useState(true);
  const [groupFlagEnabled, setGroupFlagEnabled] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const [charData, groupData] = await Promise.all([
        listCharacters(token),
        listGroups(token).catch(() => ({ groups: [] as GroupListItem[], flagEnabled: false })),
      ]);
      setCharacters(charData.characters);
      setFlagEnabled(charData.flagEnabled);
      setGroups(groupData.groups);
      setGroupFlagEnabled(groupData.flagEnabled);
    } catch (e) {
      console.error('[characters] load fail:', e);
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
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  // Birleşik liste — son aktiviteye göre sırala
  const combined: ListItem[] = [
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

  const totalCount = characters.length + groups.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Karakterler</Text>
          {groupFlagEnabled && characters.length >= 2 && (
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
          {flagEnabled
            ? totalCount === 0
              ? 'Henüz biriyle tanışmadın — zaman içinde gelecekler'
              : `${totalCount} ${groups.length > 0 ? 'sohbet' : 'kişi'}`
            : 'Bu özellik henüz açık değil'}
        </Text>
      </View>

      <FlatList
        data={combined}
        keyExtractor={(item) => `${item.kind}:${item.data.id}`}
        renderItem={({ item }) =>
          item.kind === 'character' ? (
            <CharacterRow
              item={item.data}
              onPress={() => router.push(`/(app)/characters/${item.data.id}`)}
            />
          ) : (
            <GroupRow
              item={item.data}
              onPress={() => router.push(`/(app)/characters/group/${item.data.id}`)}
            />
          )
        }
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

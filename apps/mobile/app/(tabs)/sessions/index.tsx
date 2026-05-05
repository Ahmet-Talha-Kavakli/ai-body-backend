/**
 * V4.5 Faz 2 — Sohbetler Listesi (WhatsApp parity)
 *
 * iOS Messages + WhatsApp karması:
 *  - Üstte large title + arama input'u
 *  - Jarvis pinned (üstte 📌 SF Symbol ile)
 *  - Karakterler + gruplar son etkileşime göre
 *  - Presence dot (yeşil = aktif, gri = uyuyor/değil)
 *  - Swipe-left → arşivle/sil
 *  - Press → scale 0.98 + haptic
 *  - 8sn polling
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { font, C, API_URL } from '../../../lib/theme';
import { listCharacters, type CharacterListItem } from '../../../src/services/assistant/characters';
import { listGroups, type GroupListItem } from '../../../src/services/assistant/groups';

interface JarvisConv {
  id: string;
  title: string;
  updatedAt: string;
  aiTypingUntil?: string | null;
  messages: Array<{ content: string; role: string; createdAt: string }>;
}

type Item =
  | { kind: 'jarvis'; data: JarvisConv; sortAt: string }
  | { kind: 'character'; data: CharacterListItem; sortAt: string }
  | { kind: 'group'; data: GroupListItem; sortAt: string };

// ─── Helpers ────────────────────────────────────────────────────────────────

function relTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'şimdi';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk`;
  if (diff < 86400) {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
  if (diff < 7 * 86400) {
    const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    return days[date.getDay()];
  }
  return `${date.getDate()}.${date.getMonth() + 1}`;
}

function isCharacterOnline(char: CharacterListItem): boolean {
  // Karakterler "AI" — uyumadıkça aktif
  return char.currentActivity !== 'sleeping' && char.currentActivity !== 'sleep';
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({
  uri,
  fallback,
  bg,
  fg,
  online,
  pinned,
}: {
  uri?: string | null;
  fallback: string;
  bg?: string;
  fg?: string;
  online?: boolean;
  pinned?: boolean;
}) {
  return (
    <View style={a.box}>
      {uri ? (
        <Image source={{ uri }} style={a.img} />
      ) : (
        <View
          style={[
            a.img,
            {
              backgroundColor: bg ?? C.accentSofter,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Text style={[a.fallback, { color: fg ?? C.accent }]}>{fallback}</Text>
        </View>
      )}
      {online !== undefined && (
        <View style={[a.dot, { backgroundColor: online ? '#34C759' : '#C7C7CC' }]} />
      )}
      {pinned && (
        <View style={a.pinWrap}>
          <SymbolView
            name="pin.fill"
            size={10}
            tintColor="#8E8E93"
            fallback={<Text style={{ fontSize: 8 }}>📌</Text>}
          />
        </View>
      )}
    </View>
  );
}

function GroupAvatar({ members }: { members: GroupListItem['members'] }) {
  const avs = members.slice(0, 2);
  return (
    <View style={a.box}>
      <View style={a.groupComposite}>
        {avs.map((m, idx) => (
          <View
            key={m.id}
            style={[
              a.groupPart,
              {
                left: idx === 0 ? 0 : 18,
                top: idx === 0 ? 0 : 18,
                zIndex: idx === 0 ? 2 : 1,
              },
            ]}
          >
            {m.character.avatarUrl ? (
              <Image source={{ uri: m.character.avatarUrl }} style={a.groupImg} />
            ) : (
              <View
                style={[
                  a.groupImg,
                  {
                    backgroundColor: C.accentSofter,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}
              >
                <Text style={[a.fallback, { fontSize: 14, color: C.accent }]}>
                  {m.character.name[0]}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function Row({
  avatar,
  name,
  preview,
  time,
  unread,
  typing,
  onPress,
  onArchive,
  pressDisabled,
}: {
  avatar: React.ReactNode;
  name: string;
  preview: string;
  time: string;
  unread?: number;
  typing?: boolean;
  onPress: () => void;
  onArchive?: () => void;
  pressDisabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    Animated.timing(scale, { toValue: 0.98, duration: 80, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  };

  const renderRightActions = () => (
    <View style={s.rightActions}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onArchive?.();
        }}
        style={s.archiveBtn}
      >
        <SymbolView
          name="archivebox.fill"
          size={20}
          tintColor="#FFFFFF"
          fallback={<Text style={{ color: '#fff' }}>📦</Text>}
        />
        <Text style={s.archiveText}>Arşivle</Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable
      renderRightActions={onArchive ? renderRightActions : undefined}
      overshootRight={false}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={() => {
            if (pressDisabled) return;
            Haptics.selectionAsync();
            onPress();
          }}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={s.row}
        >
          {avatar}
          <View style={s.body}>
            <View style={s.titleLine}>
              <Text style={s.name} numberOfLines={1}>
                {name}
              </Text>
              <Text style={s.time}>{time}</Text>
            </View>
            <View style={s.previewLine}>
              <Text
                style={[s.preview, typing && { color: C.accent, fontFamily: font.medium }]}
                numberOfLines={1}
              >
                {typing ? 'yazıyor…' : preview}
              </Text>
              {!!unread && unread > 0 && (
                <View style={s.unread}>
                  <Text style={s.unreadText}>{unread > 99 ? '99+' : unread}</Text>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </Swipeable>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function SessionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [jarvis, setJarvis] = useState<JarvisConv | null>(null);
  const [characters, setCharacters] = useState<CharacterListItem[]>([]);
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [groupFlagEnabled, setGroupFlagEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const [convRes, charData, groupData] = await Promise.all([
        fetch(`${API_URL}/api/assistant/conversations?archived=false`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => (r.ok ? r.json() : { conversations: [] }))
          .catch(() => ({ conversations: [] })),
        listCharacters(token).catch(() => ({
          characters: [] as CharacterListItem[],
          flagEnabled: false,
        })),
        listGroups(token).catch(() => ({ groups: [] as GroupListItem[], flagEnabled: false })),
      ]);

      const convs = (convRes?.conversations ?? []) as JarvisConv[];
      let jv: JarvisConv | null = convs[0] ?? null;
      if (!jv) {
        const created = await fetch(`${API_URL}/api/assistant/conversations`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => (r.ok ? r.json() : null));
        if (created?.id) {
          jv = {
            id: created.id,
            title: 'Jarvis',
            updatedAt: created.updatedAt ?? new Date().toISOString(),
            messages: [],
          };
        }
      }
      setJarvis(jv);
      setCharacters(charData.characters);
      setGroups(groupData.groups);
      setGroupFlagEnabled(groupData.flagEnabled);
    } catch {
      // sessize al
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

  const items: Item[] = useMemo(() => {
    const others: Item[] = [
      ...characters.map((c) => {
        const lastTs = c.lastMessage?.createdAt ?? c.lastMessageAt ?? c.arrivedAt;
        return { kind: 'character' as const, data: c, sortAt: lastTs };
      }),
      ...groups.map((g) => ({
        kind: 'group' as const,
        data: g,
        sortAt: g.messages?.[0]?.createdAt ?? g.updatedAt,
      })),
    ].sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime());

    const list = jarvis
      ? [{ kind: 'jarvis' as const, data: jarvis, sortAt: jarvis.updatedAt }, ...others]
      : others;

    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter((it) => {
      const name =
        it.kind === 'jarvis' ? 'jarvis' : it.kind === 'character' ? it.data.name : it.data.title;
      return name.toLowerCase().includes(q);
    });
  }, [jarvis, characters, groups, search]);

  if (loading) {
    return (
      <View style={[s.container, { paddingTop: insets.top + 60 }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  const canCreateGroup = groupFlagEnabled && characters.length >= 2;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <Text style={s.title}>Sohbetler</Text>
          {canCreateGroup && (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/(app)/characters/new-group');
              }}
              hitSlop={12}
              style={s.composeBtn}
            >
              <SymbolView
                name="square.and.pencil"
                size={22}
                tintColor={C.accent}
                fallback={<Text style={{ color: C.accent, fontSize: 22 }}>✎</Text>}
              />
            </Pressable>
          )}
        </View>

        {/* Search */}
        <View style={s.searchWrap}>
          <SymbolView
            name="magnifyingglass"
            size={15}
            tintColor="#8E8E93"
            fallback={<Text style={{ color: '#8E8E93', fontSize: 14 }}>🔍</Text>}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Ara"
            placeholderTextColor="#8E8E93"
            style={s.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => `${it.kind}:${it.data.id}`}
        renderItem={({ item }) => {
          if (item.kind === 'jarvis') {
            const last = item.data.messages?.[0];
            const isTyping =
              !!item.data.aiTypingUntil && new Date(item.data.aiTypingUntil).getTime() > Date.now();
            const preview = last
              ? last.role === 'user'
                ? `Sen: ${last.content}`
                : last.content
              : 'AI asistanın';
            return (
              <Row
                avatar={<Avatar fallback="J" bg={C.accent} fg="#FFFFFF" online pinned />}
                name="Jarvis"
                preview={preview}
                time={relTime(last?.createdAt ?? item.data.updatedAt)}
                typing={isTyping}
                onPress={() => router.push(`/(app)/seans/${item.data.id}`)}
              />
            );
          }
          if (item.kind === 'character') {
            const c = item.data;
            const preview = c.lastMessage
              ? c.lastMessage.role === 'assistant'
                ? c.lastMessage.content
                : `Sen: ${c.lastMessage.content}`
              : (c.bio?.slice(0, 60) ?? '');
            return (
              <Row
                avatar={
                  <Avatar uri={c.avatarUrl} fallback={c.name[0]} online={isCharacterOnline(c)} />
                }
                name={c.name}
                preview={preview}
                time={relTime(c.lastMessage?.createdAt ?? c.lastMessageAt ?? c.arrivedAt)}
                unread={c.unreadCount}
                typing={c.isTyping}
                onPress={() => router.push(`/(app)/characters/${c.id}`)}
              />
            );
          }
          // group
          const g = item.data;
          const last = g.messages?.[0];
          const preview = last
            ? last.senderType === 'user'
              ? `Sen: ${last.content}`
              : `${last.senderCharacter?.name ?? 'biri'}: ${last.content}`
            : `${g.members.length} üye`;
          return (
            <Row
              avatar={<GroupAvatar members={g.members} />}
              name={g.title}
              preview={preview}
              time={relTime(last?.createdAt ?? g.updatedAt)}
              onPress={() => router.push(`/(app)/characters/group/${g.id}`)}
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={s.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={C.accent}
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  title: {
    fontFamily: font.bold,
    fontSize: 32,
    letterSpacing: -0.6,
    color: '#0A0A0A',
  },
  composeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 16,
    color: '#0A0A0A',
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    minHeight: 68,
  },
  body: { flex: 1, justifyContent: 'center' },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  name: {
    flex: 1,
    fontFamily: font.semibold,
    fontSize: 17,
    letterSpacing: -0.3,
    color: '#0A0A0A',
    marginRight: 8,
  },
  time: {
    fontFamily: font.regular,
    fontSize: 13,
    color: '#8E8E93',
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
    lineHeight: 19,
    color: '#8E8E93',
    marginRight: 8,
  },
  unread: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
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
    height: StyleSheet.hairlineWidth,
    marginLeft: 78,
    backgroundColor: '#E5E5EA',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  archiveBtn: {
    width: 80,
    backgroundColor: '#8E8E93',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  archiveText: {
    fontFamily: font.medium,
    fontSize: 12,
    color: '#FFFFFF',
  },
});

const a = StyleSheet.create({
  box: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  img: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  fallback: {
    fontFamily: font.semibold,
    fontSize: 19,
  },
  dot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pinWrap: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  groupComposite: {
    width: 48,
    height: 48,
    position: 'relative',
  },
  groupPart: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  groupImg: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
});

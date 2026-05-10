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
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';

// Android'de LayoutAnimation aktive et
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { Swipeable } from 'react-native-gesture-handler';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useUser } from '@clerk/expo';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { font, C, API_URL } from '../../../lib/theme';
import { listCharacters, type CharacterListItem } from '../../../src/services/assistant/characters';
import { listGroups, type GroupListItem } from '../../../src/services/assistant/groups';
import { fetchStatusFeed, type StatusGroup } from '../../../src/services/assistant/status';
import { StatusStrip } from '../../../src/components/messaging/StatusStrip';
import { StatusViewer } from '../../../src/components/messaging/StatusViewer';
import { CreateStatusSheet } from '../../../src/components/messaging/CreateStatusSheet';

interface JarvisConv {
  id: string;
  title: string;
  updatedAt: string;
  aiTypingUntil?: string | null;
  messages: Array<{ content: string; role: string; createdAt: string }>;
  unreadCount?: number;
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
  // V4.6 M2: Online state backend tarafından kullanıcıdan bağımsız hesaplanıyor.
  // Backend `isCurrentlyOnline` döndürürse onu kullan; eski kayıtlar için
  // fallback: sadece son 5 dakika içinde lastSeenAt güncellenmişse online.
  const anyChar = char as unknown as {
    isCurrentlyOnline?: boolean | null;
    lastSeenAt?: string | null;
  };
  if (typeof anyChar.isCurrentlyOnline === 'boolean') return anyChar.isCurrentlyOnline;
  if (anyChar.lastSeenAt) {
    const last = new Date(anyChar.lastSeenAt).getTime();
    if (!isNaN(last) && Date.now() - last < 5 * 60 * 1000) return true;
  }
  return false;
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
            fallback={<Text style={{ fontSize: 8, fontFamily: font.regular }}>📌</Text>}
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
          fallback={<Text style={{ color: '#fff', fontFamily: font.regular }}>📦</Text>}
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
              <Text style={[s.name, !!unread && unread > 0 && s.nameUnread]} numberOfLines={1}>
                {name}
              </Text>
              <Text style={[s.time, !!unread && unread > 0 && s.timeUnread]}>{time}</Text>
            </View>
            <View style={s.previewLine}>
              <Text
                style={[
                  s.preview,
                  !!unread && unread > 0 && s.previewUnread,
                  typing && { color: C.accent, fontFamily: font.medium },
                ]}
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
  const { user: clerkUser } = useUser();
  const ADMIN_EMAILS = ['ahmettalhakavakli32@gmail.com', 'atalhakavakli@gmail.com'];
  const isAdmin =
    !!clerkUser?.emailAddresses?.[0]?.emailAddress &&
    ADMIN_EMAILS.includes(clerkUser.emailAddresses[0].emailAddress.toLowerCase());
  const [seeding, setSeeding] = useState(false);

  const onSeedCharacters = async () => {
    if (seeding) return;
    setSeeding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Hata', 'Token alınamadı');
        return;
      }
      // 1) Jarvis sohbeti garanti
      await fetch(`${API_URL}/api/assistant/conversations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      // 2) Mia + Kerem + Selin + Ayşe spawn
      const r = await fetch(`${API_URL}/api/assistant/admin/spawn-character`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateKey: 'all' }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        Alert.alert('Hata', data?.error ?? `HTTP ${r.status}`);
        return;
      }
      const spawned = (data?.spawned ?? []) as Array<{ key: string; alreadyExists: boolean }>;
      const newCount = spawned.filter((s) => !s.alreadyExists).length;
      Alert.alert(
        'Hazır',
        newCount > 0
          ? `${newCount} yeni karakter eklendi. Jarvis hazır. Sayfa yenilenecek.`
          : 'Karakterler zaten var. Jarvis hazır. Sayfa yenilenecek.',
        [{ text: 'Tamam', onPress: () => router.replace('/(tabs)/sessions' as any) }],
      );
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Bilinmeyen hata');
    } finally {
      setSeeding(false);
    }
  };

  const [jarvis, setJarvis] = useState<JarvisConv | null>(null);
  const [characters, setCharacters] = useState<CharacterListItem[]>([]);
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [groupFlagEnabled, setGroupFlagEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchGlow = useRef(new Animated.Value(0)).current;

  // V4.6 M75 — Status sistemi
  const [statusGroups, setStatusGroups] = useState<StatusGroup[]>([]);
  const [viewerGroup, setViewerGroup] = useState<StatusGroup | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetchStatusFeed(token);
      setStatusGroups(res.groups);
    } catch {
      /* sessiz */
    }
  }, [getToken]);

  useEffect(() => {
    Animated.timing(searchGlow, {
      toValue: searchFocused ? 1 : 0,
      duration: 220,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start();
  }, [searchFocused, searchGlow]);

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
      // Sıralama değişimini smooth göster
      LayoutAnimation.configureNext({
        duration: 320,
        update: { type: LayoutAnimation.Types.easeInEaseOut },
      });
      setJarvis(jv);
      setCharacters(charData.characters);
      setGroups(groupData.groups);
      setGroupFlagEnabled(groupData.flagEnabled);
      // Status feed'i paralel yükle
      loadStatus();
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
      const id = setInterval(load, 30000);
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
          <Text style={s.title} numberOfLines={1} adjustsFontSizeToFit>
            Sohbetler
          </Text>
          {isAdmin && (
            <Pressable
              onPress={onSeedCharacters}
              disabled={seeding}
              hitSlop={12}
              style={[s.composeBtn, { marginRight: 8, opacity: seeding ? 0.4 : 1 }]}
            >
              {seeding ? (
                <ActivityIndicator color={C.accent} size="small" />
              ) : (
                <SymbolView
                  name="sparkles"
                  size={20}
                  tintColor={C.accent}
                  fallback={
                    <Text style={{ color: C.accent, fontSize: 18, fontFamily: font.regular }}>
                      ✨
                    </Text>
                  }
                />
              )}
            </Pressable>
          )}
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
                fallback={
                  <Text style={{ color: C.accent, fontSize: 22, fontFamily: font.regular }}>✎</Text>
                }
              />
            </Pressable>
          )}
        </View>

        {/* Search — Apple Messages stili + focus glow */}
        <Animated.View
          style={[
            s.searchWrap,
            {
              borderWidth: 1.5,
              borderColor: searchGlow.interpolate({
                inputRange: [0, 1],
                outputRange: ['rgba(124, 58, 237, 0)', C.accent],
              }),
              backgroundColor: searchGlow.interpolate({
                inputRange: [0, 1],
                outputRange: ['#E3E3E8', '#FFFFFF'],
              }),
            },
          ]}
        >
          <SymbolView
            name="magnifyingglass"
            size={15}
            tintColor="#8E8E93"
            fallback={
              <Text style={{ color: '#8E8E93', fontSize: 14, fontFamily: font.regular }}>🔍</Text>
            }
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Ara"
            placeholderTextColor="#8E8E93"
            style={s.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </Animated.View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => `${it.kind}:${it.data.id}`}
        ListHeaderComponent={
          <StatusStrip
            groups={statusGroups}
            onPressGroup={(g) => {
              Haptics.selectionAsync();
              setViewerGroup(g);
            }}
            onPressCreate={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCreateOpen(true);
            }}
          />
        }
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
                unread={item.data.unreadCount}
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

      {/* V4.6 M75 — Status viewer + create sheet */}
      <StatusViewer
        visible={!!viewerGroup}
        group={viewerGroup}
        onClose={() => {
          setViewerGroup(null);
          loadStatus();
        }}
        onReplied={({ characterId }) => {
          setViewerGroup(null);
          router.push(`/(app)/characters/${characterId}`);
        }}
      />
      <CreateStatusSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          loadStatus();
        }}
        characters={characters.map((c) => ({
          id: c.id,
          name: c.name,
          avatarUrl: c.avatarUrl,
        }))}
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
    flex: 1,
    fontFamily: font.bold,
    fontSize: 34,
    letterSpacing: -0.4,
    color: '#0A0A0A',
    marginRight: 12,
  },
  composeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3E3E8',
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 36,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 17,
    letterSpacing: -0.4,
    color: '#0A0A0A',
    paddingVertical: 0,
    paddingHorizontal: 0,
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
  nameUnread: {
    fontFamily: font.bold,
    color: '#000000',
  },
  time: {
    fontFamily: font.regular,
    fontSize: 13,
    color: '#8E8E93',
  },
  timeUnread: {
    fontFamily: font.semibold,
    color: C.accent,
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
  previewUnread: {
    fontFamily: font.medium,
    color: '#0A0A0A',
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

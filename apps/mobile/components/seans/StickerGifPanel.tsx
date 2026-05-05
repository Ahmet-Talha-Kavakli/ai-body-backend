/**
 * StickerGifPanel — V3 Faz B4
 *
 * Sohbet input'unun üstüne açılan inline emoji/sticker/GIF paneli.
 * Modal yok — saf View animasyonu, klavye gibi alttan açılır.
 *
 * 3 sekme: Emoji (inline custom grid) / Sticker (Giphy) / GIF (Giphy)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';

import { font, C } from '../../lib/theme';
import {
  searchTenor,
  type TenorItem,
  type StickerKind,
} from '../../src/services/assistant/stickers';

type Tab = 'emoji' | 'sticker' | 'gif';

const PANEL_HEIGHT = 300;
const COL_GAP = 6;
const COLS = 4;
const SCREEN_W = Dimensions.get('window').width;
const TILE_SIZE = (SCREEN_W - COL_GAP * (COLS + 1) - 16) / COLS;

// ─── Emoji verisi ─────────────────────────────────────────────────────────────

const EMOJI_CATS: { icon: string; label: string; emojis: string[] }[] = [
  {
    icon: '🕐',
    label: 'Son',
    emojis: [], // runtime'da dolduruluyor
  },
  {
    icon: '😀',
    label: 'Yüzler',
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😅',
      '😂',
      '🤣',
      '😊',
      '😇',
      '🙂',
      '🙃',
      '😉',
      '😌',
      '😍',
      '🥰',
      '😘',
      '😗',
      '😙',
      '😚',
      '😋',
      '😛',
      '😝',
      '😜',
      '🤪',
      '🤨',
      '🧐',
      '🤓',
      '😎',
      '🤩',
      '🥳',
      '😏',
      '😒',
      '😞',
      '😔',
      '😟',
      '😕',
      '🙁',
      '☹️',
      '😣',
      '😖',
      '😫',
      '😩',
      '🥺',
      '😢',
      '😭',
      '😤',
      '😠',
      '😡',
      '🤬',
      '😈',
      '👿',
      '💀',
      '☠️',
      '💩',
      '🤡',
      '👹',
      '👺',
      '👻',
      '👽',
      '👾',
      '🤖',
    ],
  },
  {
    icon: '👋',
    label: 'El/Vücut',
    emojis: [
      '👋',
      '🤚',
      '🖐',
      '✋',
      '🖖',
      '👌',
      '🤏',
      '✌️',
      '🤞',
      '🤟',
      '🤘',
      '🤙',
      '👈',
      '👉',
      '👆',
      '🖕',
      '👇',
      '☝️',
      '👍',
      '👎',
      '✊',
      '👊',
      '🤛',
      '🤜',
      '👏',
      '🙌',
      '👐',
      '🤲',
      '🤝',
      '🙏',
      '✍️',
      '💅',
      '🤳',
      '💪',
      '🦾',
      '🦿',
      '🦵',
      '🦶',
      '👂',
      '🦻',
      '👃',
      '🫀',
      '🫁',
      '🧠',
      '🦷',
      '🦴',
      '👀',
      '👁',
      '👅',
      '👄',
    ],
  },
  {
    icon: '🐶',
    label: 'Hayvanlar',
    emojis: [
      '🐶',
      '🐱',
      '🐭',
      '🐹',
      '🐰',
      '🦊',
      '🐻',
      '🐼',
      '🐨',
      '🐯',
      '🦁',
      '🐮',
      '🐷',
      '🐸',
      '🐵',
      '🙈',
      '🙉',
      '🙊',
      '🐒',
      '🦆',
      '🐧',
      '🐦',
      '🦅',
      '🦉',
      '🦇',
      '🐺',
      '🐗',
      '🐴',
      '🦄',
      '🐝',
      '🐛',
      '🦋',
      '🐌',
      '🐞',
      '🐜',
      '🦟',
      '🦗',
      '🕷',
      '🦂',
      '🐢',
      '🐍',
      '🦎',
      '🦖',
      '🦕',
      '🐙',
      '🦑',
      '🦐',
      '🦞',
      '🦀',
      '🐡',
      '🐠',
      '🐟',
      '🐬',
      '🐳',
      '🐋',
      '🦈',
      '🐊',
      '🐅',
      '🐆',
      '🦓',
      '🦍',
      '🦧',
      '🦣',
      '🐘',
      '🦛',
      '🦏',
      '🐪',
      '🐫',
      '🦒',
      '🦘',
      '🦬',
      '🐃',
      '🐂',
      '🐄',
      '🐎',
      '🐖',
      '🐏',
      '🐑',
      '🦙',
      '🐐',
      '🦌',
      '🐕',
      '🐩',
      '🦮',
      '🐕‍🦺',
      '🐈',
      '🐈‍⬛',
      '🪶',
      '🐓',
      '🦃',
      '🦤',
      '🦚',
      '🦜',
      '🦢',
      '🕊',
      '🐇',
      '🦝',
      '🦨',
      '🦡',
      '🦫',
      '🦦',
      '🦥',
      '🐁',
      '🐀',
      '🐿',
      '🦔',
    ],
  },
  {
    icon: '🍎',
    label: 'Yiyecek',
    emojis: [
      '🍎',
      '🍐',
      '🍊',
      '🍋',
      '🍌',
      '🍉',
      '🍇',
      '🍓',
      '🫐',
      '🍈',
      '🍒',
      '🍑',
      '🥭',
      '🍍',
      '🥥',
      '🥝',
      '🍅',
      '🫒',
      '🥑',
      '🍆',
      '🥔',
      '🥕',
      '🌽',
      '🌶',
      '🫑',
      '🥒',
      '🥬',
      '🥦',
      '🧄',
      '🧅',
      '🍄',
      '🥜',
      '🫘',
      '🌰',
      '🍞',
      '🥐',
      '🥖',
      '🫓',
      '🥨',
      '🥯',
      '🧀',
      '🥚',
      '🍳',
      '🧈',
      '🥞',
      '🧇',
      '🥓',
      '🥩',
      '🍗',
      '🍖',
      '🦴',
      '🌭',
      '🍔',
      '🍟',
      '🍕',
      '🫔',
      '🌮',
      '🌯',
      '🥙',
      '🧆',
      '🥚',
      '🍜',
      '🍝',
      '🍛',
      '🍲',
      '🫕',
      '🍣',
      '🍱',
      '🥟',
      '🦪',
      '🍤',
      '🍙',
      '🍘',
      '🍥',
      '🥮',
      '🍢',
      '🧁',
      '🍰',
      '🎂',
      '🍮',
      '🍭',
      '🍬',
      '🍫',
      '🍿',
      '🍩',
      '🍪',
      '🌰',
      '🍯',
      '🧃',
      '🥤',
      '🧋',
      '☕',
      '🍵',
      '🫖',
      '🍶',
      '🍺',
      '🍻',
      '🥂',
      '🍷',
      '🫗',
      '🥃',
      '🍸',
      '🍹',
      '🧉',
      '🍾',
    ],
  },
  {
    icon: '⚽',
    label: 'Spor',
    emojis: [
      '⚽',
      '🏀',
      '🏈',
      '⚾',
      '🥎',
      '🎾',
      '🏐',
      '🏉',
      '🥏',
      '🎱',
      '🏓',
      '🏸',
      '🏒',
      '🥍',
      '🏑',
      '🥊',
      '🥋',
      '🎽',
      '🛹',
      '🛼',
      '🛷',
      '⛸',
      '🥌',
      '🎿',
      '⛷',
      '🏂',
      '🪂',
      '🏋️',
      '🤼',
      '🤸',
      '⛹',
      '🤺',
      '🏊',
      '🚣',
      '🧗',
      '🚴',
      '🏆',
      '🥇',
      '🥈',
      '🥉',
      '🏅',
      '🎖',
      '🎗',
      '🎫',
      '🎟',
      '🎪',
    ],
  },
  {
    icon: '🚗',
    label: 'Nesneler',
    emojis: [
      '🚗',
      '🚕',
      '🚙',
      '🚌',
      '🚎',
      '🏎',
      '🚓',
      '🚑',
      '🚒',
      '🚐',
      '🛻',
      '🚚',
      '🚛',
      '🚜',
      '🏍',
      '🛵',
      '🚲',
      '🛴',
      '🛺',
      '🚨',
      '🚔',
      '🚍',
      '🚘',
      '🚖',
      '🚡',
      '🚠',
      '🚟',
      '🚃',
      '🚋',
      '🚞',
      '🚝',
      '🚄',
      '🚅',
      '🚈',
      '🚂',
      '🚆',
      '🚇',
      '🚊',
      '🚉',
      '✈️',
      '🛫',
      '🛬',
      '🛩',
      '💺',
      '🛸',
      '🚁',
      '🛶',
      '⛵',
      '🚤',
      '🛥',
      '🛳',
      '⛴',
      '🚢',
      '⚓',
      '🪝',
      '⛽',
      '🚧',
      '🚦',
      '🚥',
      '🛑',
      '🚏',
      '🗺',
      '🗿',
      '🗽',
      '🗼',
      '🏰',
      '🏯',
      '🏟',
      '🎡',
      '🎢',
      '🎠',
      '⛲',
      '⛺',
      '🌁',
      '🏙',
      '🌃',
      '🌄',
      '🌅',
      '🌆',
      '🌇',
      '🌉',
      '♾',
      '🎑',
      '🏞',
      '🌌',
      '🌠',
      '🎇',
      '🎆',
      '🌈',
      '🌐',
      '🗾',
      '🧭',
      '⛰',
      '🌋',
      '🗻',
      '🏔',
      '🏕',
      '🏖',
      '🏜',
      '🏝',
      '🏛',
      '🏗',
      '🏘',
      '🏚',
      '🏠',
      '🏡',
      '🏢',
      '🏣',
      '🏤',
      '🏥',
      '🏦',
      '🏨',
      '🏩',
      '🏪',
      '🏫',
      '🏬',
      '🏭',
      '🏯',
      '🏰',
    ],
  },
  {
    icon: '❤️',
    label: 'Semboller',
    emojis: [
      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '💜',
      '🖤',
      '🤍',
      '🤎',
      '💔',
      '❣️',
      '💕',
      '💞',
      '💓',
      '💗',
      '💖',
      '💘',
      '💝',
      '💟',
      '☮️',
      '✝️',
      '☪️',
      '🕉',
      '☸️',
      '✡️',
      '🔯',
      '🕎',
      '☯️',
      '☦️',
      '🛐',
      '⛎',
      '♈',
      '♉',
      '♊',
      '♋',
      '♌',
      '♍',
      '♎',
      '♏',
      '♐',
      '♑',
      '♒',
      '♓',
      '🆔',
      '⚕️',
      '♻️',
      '⚜️',
      '🔰',
      '✅',
      '❎',
      '🆘',
      '⛔',
      '📵',
      '🚫',
      '❌',
      '⭕',
      '🛑',
      '💯',
      '❗',
      '❕',
      '❓',
      '❔',
      '‼️',
      '⁉️',
      '🔅',
      '🔆',
      '🔱',
      '⚜',
      '🏳',
      '🏴',
      '🚩',
      '🎌',
      '🏁',
    ],
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  apiUrl: string;
  getToken: () => Promise<string | null>;
  onClose: () => void;
  onPickSticker: (item: TenorItem) => void;
  onPickEmoji: (emoji: string) => void;
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function StickerGifPanel({
  visible,
  apiUrl,
  getToken,
  onClose,
  onPickSticker,
  onPickEmoji,
}: Props) {
  const [tab, setTab] = useState<Tab>('emoji');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: visible ? PANEL_HEIGHT : 0,
      duration: visible ? 260 : 220,
      easing: Easing.bezier(visible ? 0.16 : 0.4, visible ? 1 : 0, visible ? 0.3 : 1, 1),
      useNativeDriver: false,
    }).start();
  }, [visible, heightAnim]);

  const handleEmoji = (emoji: string) => {
    Haptics.selectionAsync();
    onPickEmoji(emoji);
    setRecentEmojis((prev) => {
      const next = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 32);
      return next;
    });
  };

  const cats = EMOJI_CATS.map((c, i) => (i === 0 ? { ...c, emojis: recentEmojis } : c)).filter(
    (c) => c.emojis.length > 0 || c.label !== 'Son',
  );

  return (
    <Animated.View style={[s.panel, { height: heightAnim }]}>
      {/* Sekme satırı */}
      <View style={s.tabs}>
        <TabBtn label="😊" active={tab === 'emoji'} onPress={() => setTab('emoji')} />
        <TabBtn label="Sticker" active={tab === 'sticker'} onPress={() => setTab('sticker')} />
        <TabBtn label="GIF" active={tab === 'gif'} onPress={() => setTab('gif')} />
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            onClose();
          }}
          hitSlop={12}
          style={s.closeBtn}
        >
          <SymbolView
            name="xmark"
            size={13}
            tintColor={C.textMuted}
            fallback={<Text style={{ color: C.textMuted, fontSize: 13 }}>✕</Text>}
          />
        </Pressable>
      </View>

      <View style={s.body}>
        {tab === 'emoji' && <EmojiTab cats={cats} onPick={handleEmoji} />}
        {(tab === 'sticker' || tab === 'gif') && (
          <GiphyTab
            key={tab}
            apiUrl={apiUrl}
            getToken={getToken}
            kind={tab}
            onPick={onPickSticker}
          />
        )}
      </View>
    </Animated.View>
  );
}

// ─── TabBtn ───────────────────────────────────────────────────────────────────

function TabBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={[s.tabBtn, active && s.tabBtnActive]}
    >
      <Text style={[s.tabText, active && s.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

// ─── EmojiTab ─────────────────────────────────────────────────────────────────

function EmojiTab({ cats, onPick }: { cats: typeof EMOJI_CATS; onPick: (e: string) => void }) {
  const [activeCat, setActiveCat] = useState(0);
  const validCats = cats.filter((c) => c.emojis.length > 0);
  const currentEmojis = validCats[activeCat]?.emojis ?? [];

  return (
    <View style={s.emojiTab}>
      {/* Kategori bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.catBar}
        contentContainerStyle={s.catContent}
        keyboardShouldPersistTaps="handled"
      >
        {validCats.map((cat, i) => (
          <Pressable
            key={cat.label}
            onPress={() => setActiveCat(i)}
            style={[s.catBtn, activeCat === i && s.catBtnActive]}
          >
            <Text style={s.catIcon}>{cat.icon}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Emoji grid */}
      <FlatList
        data={currentEmojis}
        numColumns={8}
        keyExtractor={(e, i) => `${e}-${i}`}
        renderItem={({ item }) => (
          <Pressable onPress={() => onPick(item)} style={s.emojiCell}>
            <Text style={s.emojiText}>{item}</Text>
          </Pressable>
        )}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.emojiGrid}
      />
    </View>
  );
}

// ─── GiphyTab ─────────────────────────────────────────────────────────────────

function GiphyTab({
  apiUrl,
  getToken,
  kind,
  onPick,
}: {
  apiUrl: string;
  getToken: () => Promise<string | null>;
  kind: StickerKind;
  onPick: (item: TenorItem) => void;
}) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<TenorItem[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqIdRef = useRef(0);

  const load = useCallback(
    async (query: string, pos?: string) => {
      const myId = ++reqIdRef.current;
      if (pos) setLoadingMore(true);
      else setLoading(true);
      const token = (await getToken()) ?? '';
      const res = await searchTenor({ apiUrl, token, q: query, type: kind, pos, limit: 24 });
      if (myId !== reqIdRef.current) return;
      setItems((prev) => (pos ? [...prev, ...res.items] : res.items));
      setNext(res.next);
      setLoading(false);
      setLoadingMore(false);
    },
    [apiUrl, getToken, kind],
  );

  useEffect(() => {
    load('');
  }, [load]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(q.trim()), 320);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, load]);

  return (
    <View style={s.giphyTab}>
      <View style={s.searchWrap}>
        <SymbolView
          name="magnifyingglass"
          size={13}
          tintColor={C.textMuted}
          fallback={<Text style={{ color: C.textMuted }}>🔍</Text>}
        />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={kind === 'sticker' ? 'Sticker ara...' : 'GIF ara...'}
          placeholderTextColor={C.textDim}
          style={s.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {q.length > 0 && (
          <Pressable onPress={() => setQ('')} hitSlop={8}>
            <SymbolView
              name="xmark.circle.fill"
              size={13}
              tintColor={C.textDim}
              fallback={<Text style={{ color: C.textDim }}>✕</Text>}
            />
          </Pressable>
        )}
      </View>

      {loading && items.length === 0 ? (
        <View style={s.loaderWrap}>
          <ActivityIndicator color={C.accent} />
        </View>
      ) : items.length === 0 ? (
        <View style={s.loaderWrap}>
          <Text style={s.emptyText}>Sonuç yok</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          numColumns={COLS}
          keyExtractor={(it) => it.id}
          contentContainerStyle={s.gridContent}
          columnWrapperStyle={s.gridRow}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                onPick(item);
              }}
              style={s.tile}
            >
              <Image
                source={{ uri: item.previewUrl }}
                style={s.tileImage}
                contentFit="contain"
                transition={150}
              />
            </Pressable>
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (next && !loadingMore && !loading) load(q.trim(), next);
          }}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={C.accent} style={{ padding: 12 }} /> : null
          }
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  panel: {
    backgroundColor: C.page,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: C.hairline,
    overflow: 'hidden',
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: C.hairline,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: C.well,
  },
  tabText: {
    fontFamily: font.medium,
    fontSize: 13,
    color: C.textMuted,
  },
  tabTextActive: {
    color: C.accent,
    fontFamily: font.semibold,
  },
  closeBtn: {
    marginLeft: 'auto',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },

  // Emoji
  emojiTab: { flex: 1 },
  catBar: { maxHeight: 38, flexGrow: 0 },
  catContent: { paddingHorizontal: 8, gap: 4, alignItems: 'center' },
  catBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catBtnActive: { backgroundColor: C.well },
  catIcon: { fontSize: 20 },
  emojiGrid: { paddingHorizontal: 4, paddingVertical: 4 },
  emojiCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
  },
  emojiText: { fontSize: 26 },

  // Giphy
  giphyTab: { flex: 1, paddingHorizontal: 8, paddingTop: 6 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.well,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 14,
    color: C.text,
    padding: 0,
  },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  emptyText: { fontFamily: font.regular, fontSize: 13, color: C.textMuted },
  gridContent: { paddingBottom: 8 },
  gridRow: { gap: COL_GAP, marginBottom: COL_GAP },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: C.surface,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileImage: { width: '100%', height: '100%' },
});

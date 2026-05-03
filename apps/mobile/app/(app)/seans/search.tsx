/**
 * Mesaj Arama — V3 Faz B
 *
 * Tüm sohbetlerde mesaj arama. Kısa kelime → text, uzun cümle → semantic.
 * WhatsApp tarzı liste, sonuca tıklayınca o sohbete götürür.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { font, C, API_URL } from '../../../lib/theme';

interface SearchResult {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  createdAt: string;
  conversationId: string;
  conversationTitle: string;
  matchType: 'text' | 'semantic';
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const token = await getToken();
        const res = await fetch(
          `${API_URL}/api/assistant/messages/search?q=${encodeURIComponent(q)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const json = await res.json();
        if (res.ok) setResults(json.messages ?? []);
      } catch (e) {
        console.error('[search]', e);
      } finally {
        setLoading(false);
      }
    },
    [getToken],
  );

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, performSearch]);

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
          <View style={st.searchBar}>
            <SymbolView
              name="magnifyingglass"
              size={14}
              tintColor={C.textDim}
              fallback={<Text style={{ color: C.textDim }}>🔍</Text>}
            />
            <TextInput
              style={st.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Mesaj ara..."
              placeholderTextColor={C.textDim}
              autoFocus
              autoCorrect={false}
              returnKeyType="search"
            />
            {loading && <ActivityIndicator size="small" color={C.accent} />}
            {query.length > 0 && !loading && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <SymbolView
                  name="xmark.circle.fill"
                  size={16}
                  tintColor={C.textDim}
                  fallback={<Text style={{ color: C.textDim }}>×</Text>}
                />
              </Pressable>
            )}
          </View>
        </View>

        {query.trim().length < 2 ? (
          <View style={st.center}>
            <Text style={st.hintTitle}>Mesaj ara</Text>
            <Text style={st.hintSub}>
              Tüm sohbetlerinde kelime veya konu ile mesaj bulabilirsin.
            </Text>
          </View>
        ) : results.length === 0 && !loading ? (
          <View style={st.center}>
            <Text style={st.hintTitle}>"{query.trim()}" eşleşmiyor</Text>
          </View>
        ) : (
          <FlashList
            data={results}
            keyExtractor={(item) => item.id}
            estimatedItemSize={90}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: insets.bottom + 24,
            }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push(`/seans/${item.conversationId}`);
                }}
                style={resultSt.card}
              >
                <View style={resultSt.headerRow}>
                  <Text style={resultSt.role}>{item.role === 'user' ? 'Sen' : 'AI'}</Text>
                  <Text style={resultSt.dot}>·</Text>
                  <Text style={resultSt.convo} numberOfLines={1}>
                    {item.conversationTitle || 'Sohbet'}
                  </Text>
                  <View style={{ flex: 1 }} />
                  <Text style={resultSt.date}>{formatDate(item.createdAt)}</Text>
                </View>
                <Text style={resultSt.content} numberOfLines={3}>
                  <HighlightedText text={item.content} query={query} />
                </Text>
                {item.matchType === 'semantic' && (
                  <Text style={resultSt.semanticBadge}>~ benzer içerik</Text>
                )}
              </Pressable>
            )}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </>
  );
}

// Basit highlighting — query kelimesini kalın yap
function HighlightedText({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (q.length < 2) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, 'gi'));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === q.toLowerCase() ? (
          <Text key={i} style={{ fontFamily: font.bold, color: C.accent }}>
            {p}
          </Text>
        ) : (
          <Text key={i}>{p}</Text>
        ),
      )}
    </>
  );
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const day = Math.floor(diff / 86400000);
  if (day < 1) {
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
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
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 14,
    color: C.text,
    padding: 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  hintTitle: { fontFamily: font.bold, fontSize: 16, color: C.text, letterSpacing: -0.2 },
  hintSub: {
    fontFamily: font.regular,
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
});

const resultSt = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  role: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: C.accent,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  dot: { color: C.textDim, fontSize: 11 },
  convo: {
    fontFamily: font.regular,
    fontSize: 11,
    color: C.textMuted,
    maxWidth: 140,
  },
  date: { fontFamily: font.regular, fontSize: 11, color: C.textDim },
  content: {
    fontFamily: font.regular,
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  semanticBadge: {
    fontFamily: font.regular,
    fontSize: 10,
    color: C.textDim,
    marginTop: 6,
    fontStyle: 'italic',
  },
});

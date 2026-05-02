/**
 * Asistan hakkında — kullanıcı AI'nin onun hakkında ne hatırladığını görür.
 * Silme: AI'ye söyleyerek (örn. "vegan değilim artık").
 */

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { font, SLEEP, API_URL } from '../tracking/uyku/_components/theme';

interface FactHistoryItem {
  id: string;
  content: string;
  createdAt: string;
  supersededAt?: string | null;
}

interface Fact {
  id: string;
  category: string;
  content: string;
  confidence: number;
  effectiveConfidence: number;
  createdAt: string;
  lastUsedAt: string;
  lastConfirmedAt: string;
  history: FactHistoryItem[];
}

interface Person {
  id: string;
  name: string;
  relationship: string;
  importance: number;
  healthConditions: string[];
  notes?: string | null;
}

interface LifeEvent {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  date: string;
  resolved: boolean;
  stressLevel?: number | null;
  person?: { name: string; relationship: string } | null;
}

const CATEGORY_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  identity: { label: 'Kimlik', emoji: '🪪', color: '#0A84FF' },
  preference: { label: 'Tercih', emoji: '⚙️', color: '#5E5CE6' },
  pattern: { label: 'Davranış Deseni', emoji: '🔄', color: '#FF9F0A' },
  event: { label: 'Olay', emoji: '📅', color: '#30D158' },
  promise: { label: 'Söz', emoji: '🤝', color: '#BF5AF2' },
};

const REL_LABELS: Record<string, string> = {
  father: 'Baba',
  mother: 'Anne',
  sibling: 'Kardeş',
  friend: 'Arkadaş',
  partner: 'Eş/Sevgili',
  colleague: 'İş arkadaşı',
  child: 'Çocuk',
  other: 'Diğer',
};

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  diagnosis: { label: 'Tanı', color: '#FF3B30' },
  meeting: { label: 'Toplantı', color: '#0A84FF' },
  deadline: { label: 'Deadline', color: '#FF9F0A' },
  trip: { label: 'Yolculuk', color: '#30D158' },
  celebration: { label: 'Kutlama', color: '#FFD60A' },
  conflict: { label: 'Çatışma', color: '#FF3B30' },
  loss: { label: 'Kayıp', color: '#8E8E93' },
  achievement: { label: 'Başarı', color: '#30D158' },
  health_event: { label: 'Sağlık olayı', color: '#FF3B30' },
  other: { label: 'Diğer', color: '#5E5CE6' },
};

export default function MemoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [events, setEvents] = useState<LifeEvent[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/assistant/memory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setFacts(data.facts ?? []);
      setPeople(data.people ?? []);
      setEvents(data.events ?? []);
    } catch (e) {
      console.error('[memory]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll]),
  );

  // Kategoriye göre fact gruplama
  const grouped: Record<string, Fact[]> = {};
  for (const f of facts) {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category]!.push(f);
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[st.root, { paddingTop: insets.top }]}>
        <View style={st.header}>
          <Pressable onPress={() => router.back()} hitSlop={14} style={st.backBtn}>
            <SymbolView
              name="chevron.left"
              size={20}
              tintColor={SLEEP.text}
              fallback={<Text>‹</Text>}
            />
          </Pressable>
          <Text style={st.headerTitle}>Hafıza</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={SLEEP.accent} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[st.scroll, { paddingBottom: insets.bottom + 24 }]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchAll();
                }}
                tintColor={SLEEP.accent}
              />
            }
          >
            <View style={st.intro}>
              <Text style={st.introTitle}>Asistanın hakkında bildikleri</Text>
              <Text style={st.introSub}>
                Bu bilgiler her sohbetinde kullanılır. Düzeltmek istediğin bir şey varsa, doğrudan
                asistanına söyle (örn. "vegan değilim artık").
              </Text>
            </View>

            {/* Fact'ler */}
            {Object.keys(grouped).length === 0 && people.length === 0 && events.length === 0 && (
              <View style={emptySt.wrap}>
                <View style={emptySt.iconCircle}>
                  <SymbolView
                    name="brain"
                    size={32}
                    tintColor={SLEEP.accent}
                    fallback={<Text style={{ fontSize: 30 }}>🧠</Text>}
                  />
                </View>
                <Text style={emptySt.title}>Henüz hiçbir şey hatırlamıyorum</Text>
                <Text style={emptySt.sub}>
                  Sohbet ettikçe seni öğreniyorum. Bunları otomatik kaydediyorum:
                </Text>
                <View style={emptySt.exampleList}>
                  <ExampleRow emoji="🪪" text={'Tercihlerin ("vegan değilim", "kahve sevmem")'} />
                  <ExampleRow
                    emoji="👥"
                    text={'Hayatındaki kişiler ("babam Ahmet, kalp hastası")'}
                  />
                  <ExampleRow emoji="📅" text={'Olaylar ("perşembe ameliyatım var")'} />
                  <ExampleRow emoji="🤝" text={'Sözler ("bu hafta düzenli yürüyeceğim")'} />
                </View>
                <Text style={emptySt.tip}>İlk sohbetini başlat, otomatik öğreneceğim.</Text>
              </View>
            )}

            {Object.entries(grouped).map(([category, items]) => {
              const meta = CATEGORY_LABELS[category] ?? {
                label: category,
                emoji: '•',
                color: SLEEP.accent,
              };
              return (
                <View key={category} style={{ marginTop: 22 }}>
                  <View style={st.sectionHeader}>
                    <Text style={st.sectionEmoji}>{meta.emoji}</Text>
                    <Text style={st.sectionTitle}>{meta.label}</Text>
                    <Text style={st.sectionCount}>{items.length}</Text>
                  </View>
                  <View style={{ gap: 8, marginTop: 10 }}>
                    {items.map((f) => (
                      <FactCard key={f.id} fact={f} color={meta.color} onChanged={fetchAll} />
                    ))}
                  </View>
                </View>
              );
            })}

            {/* Kişiler */}
            {people.length > 0 && (
              <View style={{ marginTop: 22 }}>
                <View style={st.sectionHeader}>
                  <Text style={st.sectionEmoji}>👥</Text>
                  <Text style={st.sectionTitle}>Hayatındaki Kişiler</Text>
                  <Text style={st.sectionCount}>{people.length}</Text>
                </View>
                <View style={{ gap: 8, marginTop: 10 }}>
                  {people.map((p) => (
                    <View key={p.id} style={personSt.card}>
                      <View style={personSt.row}>
                        <Text style={personSt.name}>{p.name}</Text>
                        <View style={personSt.relPill}>
                          <Text style={personSt.relTxt}>
                            {REL_LABELS[p.relationship] ?? p.relationship}
                          </Text>
                        </View>
                      </View>
                      {p.healthConditions.length > 0 && (
                        <Text style={personSt.health}>🏥 {p.healthConditions.join(', ')}</Text>
                      )}
                      {p.notes && <Text style={personSt.notes}>{p.notes}</Text>}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Yaşam olayları */}
            {events.length > 0 && (
              <View style={{ marginTop: 22 }}>
                <View style={st.sectionHeader}>
                  <Text style={st.sectionEmoji}>📅</Text>
                  <Text style={st.sectionTitle}>Yaşam Olayları</Text>
                  <Text style={st.sectionCount}>{events.length}</Text>
                </View>
                <View style={{ gap: 8, marginTop: 10 }}>
                  {events.map((e) => {
                    const meta = EVENT_LABELS[e.type] ?? { label: e.type, color: SLEEP.accent };
                    return (
                      <View key={e.id} style={[eventSt.card, { borderLeftColor: meta.color }]}>
                        <View style={eventSt.row}>
                          <Text style={eventSt.title}>{e.title}</Text>
                          <Text style={eventSt.date}>{formatDate(new Date(e.date))}</Text>
                        </View>
                        <View style={eventSt.metaRow}>
                          <Text
                            style={[
                              eventSt.typePill,
                              { backgroundColor: meta.color + '15', color: meta.color },
                            ]}
                          >
                            {meta.label}
                          </Text>
                          {e.person && <Text style={eventSt.personLabel}>{e.person.name}</Text>}
                          {e.stressLevel && (
                            <Text style={eventSt.stressLabel}>⚡ {e.stressLevel}/10</Text>
                          )}
                          {e.resolved && <Text style={eventSt.resolvedLabel}>✓ Çözüldü</Text>}
                        </View>
                        {e.description && <Text style={eventSt.desc}>{e.description}</Text>}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </>
  );
}

function FactCard({
  fact,
  color,
  onChanged,
}: {
  fact: Fact;
  color: string;
  onChanged: () => void;
}) {
  const { getToken } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const eff = fact.effectiveConfidence ?? fact.confidence;
  const certainty = eff >= 0.7 ? 'kesin' : eff >= 0.4 ? 'muhtemel' : 'belirsiz';
  const certaintyColor = eff >= 0.7 ? SLEEP.success : eff >= 0.4 ? SLEEP.warn : SLEEP.textDim;

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Bu bilgiyi', undefined, [
      {
        text: 'Düzelt',
        onPress: () =>
          Alert.prompt(
            'Yeni içerik',
            "Eski versiyon timeline'da kalır.",
            async (text) => {
              if (!text?.trim()) return;
              try {
                const tk = await getToken();
                await fetch(`${API_URL}/api/assistant/memory/facts/${fact.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
                  body: JSON.stringify({ content: text.trim() }),
                });
                onChanged();
              } catch {}
            },
            'plain-text',
            fact.content,
          ),
      },
      {
        text: 'Unut',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            'Unutulsun mu?',
            'Bu bilgi tüm geçmişiyle silinecek. Asistan bir daha bu konuda bilgi sahibi gibi konuşmaz. Geri alınamaz.',
            [
              { text: 'Vazgeç', style: 'cancel' },
              {
                text: 'Unut',
                style: 'destructive',
                onPress: async () => {
                  try {
                    const tk = await getToken();
                    await fetch(`${API_URL}/api/assistant/memory/facts/${fact.id}`, {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${tk}` },
                    });
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onChanged();
                  } catch {}
                },
              },
            ],
          ),
      },
      { text: 'Vazgeç', style: 'cancel' },
    ]);
  };

  return (
    <Pressable
      onPress={() => fact.history.length > 0 && setExpanded((v) => !v)}
      onLongPress={handleLongPress}
      style={[factSt.card, { borderLeftColor: color }]}
    >
      <View style={factSt.headerRow}>
        <Text style={factSt.content}>{fact.content}</Text>
        {fact.history.length > 0 && (
          <SymbolView
            name={expanded ? 'chevron.up' : 'chevron.down'}
            size={11}
            tintColor={SLEEP.textDim}
            fallback={
              <Text style={{ color: SLEEP.textDim, fontSize: 10 }}>{expanded ? '▴' : '▾'}</Text>
            }
          />
        )}
      </View>
      <View style={factSt.metaRow}>
        <Text
          style={[
            factSt.certaintyPill,
            { backgroundColor: certaintyColor + '20', color: certaintyColor },
          ]}
        >
          {certainty}
        </Text>
        <Text style={factSt.meta}>{formatDate(new Date(fact.lastConfirmedAt))}</Text>
      </View>
      {expanded && fact.history.length > 0 && (
        <View style={factSt.historyWrap}>
          <Text style={factSt.historyLabel}>Geçmiş</Text>
          {fact.history.map((h) => (
            <View key={h.id} style={factSt.historyRow}>
              <View style={factSt.historyDot} />
              <Text style={factSt.historyContent}>{h.content}</Text>
              <Text style={factSt.historyDate}>{formatDate(new Date(h.createdAt))}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

function ExampleRow({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={emptySt.exampleRow}>
      <Text style={emptySt.exampleEmoji}>{emoji}</Text>
      <Text style={emptySt.exampleText}>{text}</Text>
    </View>
  );
}

function formatDate(d: Date) {
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Bugün';
  if (days === 1) return 'Dün';
  if (days < 7) return `${days} gün önce`;
  if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
  const months = [
    'Oca',
    'Şub',
    'Mar',
    'Nis',
    'May',
    'Haz',
    'Tem',
    'Ağu',
    'Eyl',
    'Eki',
    'Kas',
    'Ara',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

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
  headerTitle: {
    flex: 1,
    fontFamily: font.bold,
    fontSize: 17,
    color: SLEEP.text,
    textAlign: 'center',
    letterSpacing: -0.2,
  },

  scroll: { paddingHorizontal: 18, paddingTop: 16 },

  intro: {},
  introTitle: { fontFamily: font.extrabold, fontSize: 22, color: SLEEP.text, letterSpacing: -0.4 },
  introSub: {
    fontFamily: font.regular,
    fontSize: 13,
    color: SLEEP.textMuted,
    marginTop: 8,
    lineHeight: 19,
  },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionEmoji: { fontSize: 18 },
  sectionTitle: {
    flex: 1,
    fontFamily: font.bold,
    fontSize: 15,
    color: SLEEP.text,
    letterSpacing: -0.2,
  },
  sectionCount: { fontFamily: font.semibold, fontSize: 13, color: SLEEP.textMuted },
});

const factSt = StyleSheet.create({
  card: {
    backgroundColor: SLEEP.card,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  content: { fontFamily: font.medium, fontSize: 14, color: SLEEP.text, lineHeight: 20, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  certaintyPill: {
    fontFamily: font.semibold,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    overflow: 'hidden',
  },
  meta: { fontFamily: font.regular, fontSize: 11, color: SLEEP.textDim },
  historyWrap: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SLEEP.border,
    gap: 8,
  },
  historyLabel: {
    fontFamily: font.semibold,
    fontSize: 10,
    color: SLEEP.textDim,
    letterSpacing: 1,
    marginBottom: 2,
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: SLEEP.textDim },
  historyContent: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 12,
    color: SLEEP.textMuted,
    textDecorationLine: 'line-through',
  },
  historyDate: { fontFamily: font.regular, fontSize: 10, color: SLEEP.textDim },
});

const personSt = StyleSheet.create({
  card: {
    backgroundColor: SLEEP.card,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontFamily: font.bold, fontSize: 15, color: SLEEP.text, flex: 1 },
  relPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: SLEEP.accentSoft,
    borderRadius: 8,
  },
  relTxt: { fontFamily: font.semibold, fontSize: 11, color: SLEEP.accent },
  health: { fontFamily: font.regular, fontSize: 12, color: SLEEP.textMuted, marginTop: 6 },
  notes: {
    fontFamily: font.regular,
    fontSize: 12,
    color: SLEEP.textMuted,
    marginTop: 4,
    lineHeight: 17,
  },
});

const eventSt = StyleSheet.create({
  card: {
    backgroundColor: SLEEP.card,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { fontFamily: font.bold, fontSize: 14, color: SLEEP.text, flex: 1 },
  date: { fontFamily: font.regular, fontSize: 11, color: SLEEP.textDim },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  typePill: {
    fontFamily: font.semibold,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  personLabel: { fontFamily: font.medium, fontSize: 11, color: SLEEP.textMuted },
  stressLabel: { fontFamily: font.medium, fontSize: 11, color: '#FF9F0A' },
  resolvedLabel: { fontFamily: font.medium, fontSize: 11, color: SLEEP.success },
  desc: {
    fontFamily: font.regular,
    fontSize: 12,
    color: SLEEP.textMuted,
    marginTop: 6,
    lineHeight: 17,
  },
});

const emptySt = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 32, paddingBottom: 40, paddingHorizontal: 8 },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: SLEEP.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: font.bold,
    fontSize: 18,
    color: SLEEP.text,
    marginTop: 4,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  sub: {
    fontFamily: font.regular,
    fontSize: 13,
    color: SLEEP.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 19,
  },
  exampleList: {
    alignSelf: 'stretch',
    marginTop: 18,
    gap: 10,
    backgroundColor: SLEEP.card,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  exampleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  exampleEmoji: { fontSize: 16, marginTop: 1 },
  exampleText: {
    flex: 1,
    fontFamily: font.medium,
    fontSize: 13,
    color: SLEEP.text,
    lineHeight: 19,
  },
  tip: {
    fontFamily: font.medium,
    fontSize: 12,
    color: SLEEP.accent,
    marginTop: 18,
    textAlign: 'center',
  },
});

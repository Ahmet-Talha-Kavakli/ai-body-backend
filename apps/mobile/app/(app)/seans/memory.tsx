/**
 * Beni Nasıl Tanıyorsun — kullanıcının asistanın onun hakkında ne hatırladığını
 * gördüğü ekran. V2 redesign: önem sırasına göre hayat olayları üstte,
 * sonra kişiler, sonra fact'ler kategoriye göre.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
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
import { font, C, API_URL } from '../../../lib/theme';

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
  effectiveConfidence?: number;
  importance?: number;
  eventType?: string | null;
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

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  identity: { label: 'Kimlik', icon: 'person.fill', color: '#0A84FF' },
  preference: { label: 'Tercihler', icon: 'slider.horizontal.3', color: C.accent },
  pattern: { label: 'Davranış Desenleri', icon: 'arrow.triangle.2.circlepath', color: '#FF9F0A' },
  event: { label: 'Olaylar', icon: 'calendar', color: '#30D158' },
  promise: { label: 'Sözler', icon: 'hand.raised.fill', color: '#BF5AF2' },
  life_event: { label: 'Hayat Olayları', icon: 'sparkles', color: '#FF375F' },
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

const LIFE_EVENT_LABELS: Record<string, string> = {
  birth: 'Doğum',
  death: 'Kayıp',
  wedding: 'Evlilik',
  breakup: 'Ayrılık',
  new_job: 'Yeni İş',
  job_loss: 'İş Kaybı',
  move: 'Taşınma',
  diagnosis: 'Sağlık Tanısı',
  pregnancy: 'Hamilelik',
  graduation: 'Mezuniyet',
  other: 'Olay',
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

  // Toplam hatırlanan sayısı
  const totalCount = facts.length + people.length + events.length;

  // life_event önce, sonra önem ve son kullanım tarihine göre kategori sıralaması
  const categoryOrder = ['life_event', 'identity', 'event', 'promise', 'preference', 'pattern'];
  const grouped: Record<string, Fact[]> = {};
  for (const f of facts) {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category]!.push(f);
  }
  // Kategorinin içinde de importance'a göre sırala (yoksa lastConfirmedAt)
  for (const k of Object.keys(grouped)) {
    grouped[k]!.sort((a, b) => {
      const ai = a.importance ?? 2;
      const bi = b.importance ?? 2;
      if (ai !== bi) return bi - ai;
      return new Date(b.lastConfirmedAt).getTime() - new Date(a.lastConfirmedAt).getTime();
    });
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
              tintColor={C.accent}
              fallback={<Text style={{ color: C.accent }}>‹</Text>}
            />
          </Pressable>
          <View style={st.headerCenter}>
            <Text style={st.headerTitle}>Beni nasıl tanıyorsun</Text>
            {totalCount > 0 && <Text style={st.headerCount}>{totalCount} hatırlama</Text>}
          </View>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <MemorySkeleton />
        ) : totalCount === 0 ? (
          <EmptyMemoryView />
        ) : (
          <ScrollView
            contentContainerStyle={[st.scroll, { paddingBottom: insets.bottom + 32 }]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchAll();
                }}
                tintColor={C.accent}
              />
            }
          >
            {/* Hero — kullanıcıya ne anlama geldiğini özetle */}
            <View style={heroSt.wrap}>
              <Text style={heroSt.title}>Sohbet ettikçe seni öğreniyorum.</Text>
              <Text style={heroSt.body}>
                Aşağıdakiler aklımda kalanlar — her sohbetimizde bunları hatırlıyorum. Bir şey
                yanlışsa, doğrudan bana söyle (örn. "vegan değilim artık").
              </Text>
            </View>

            {/* Hayat olayları — her zaman ilk */}
            {grouped['life_event'] && grouped['life_event'].length > 0 && (
              <Section
                meta={CATEGORY_META.life_event!}
                count={grouped['life_event']!.length}
                items={grouped['life_event']!.map((f) => (
                  <LifeEventFactCard key={f.id} fact={f} onChanged={fetchAll} />
                ))}
                index={0}
              />
            )}

            {/* Kişiler — life_event'ten sonra çünkü ailen+arkadaşların önemli */}
            {people.length > 0 && (
              <Section
                meta={{ label: 'Hayatındaki Kişiler', icon: 'person.2.fill', color: C.accent }}
                count={people.length}
                items={people.map((p) => (
                  <PersonCard key={p.id} person={p} />
                ))}
                index={1}
              />
            )}

            {/* Diğer fact kategorileri sırayla */}
            {categoryOrder
              .filter((cat) => cat !== 'life_event' && grouped[cat] && grouped[cat]!.length > 0)
              .map((cat, i) => (
                <Section
                  key={cat}
                  meta={CATEGORY_META[cat]!}
                  count={grouped[cat]!.length}
                  items={grouped[cat]!.map((f) => (
                    <FactCard
                      key={f.id}
                      fact={f}
                      color={CATEGORY_META[cat]!.color}
                      onChanged={fetchAll}
                    />
                  ))}
                  index={i + 2}
                />
              ))}

            {/* Yaşam olayları (HealthEvent / Person'dan gelen) — life_event'ten ayrı */}
            {events.length > 0 && (
              <Section
                meta={{
                  label: 'Sağlık & Olay Geçmişi',
                  icon: 'clock.arrow.circlepath',
                  color: '#FF9F0A',
                }}
                count={events.length}
                items={events.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
                index={99}
              />
            )}
          </ScrollView>
        )}
      </View>
    </>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({
  meta,
  count,
  items,
  index,
}: {
  meta: { label: string; icon: string; color: string };
  count: number;
  items: React.ReactNode[];
  index: number;
}) {
  const translateY = useRef(new Animated.Value(8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        delay: Math.min(index, 5) * 60,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay: Math.min(index, 5) * 60,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], marginTop: 22 }}>
      <View style={st.sectionHeader}>
        <View style={[st.sectionIcon, { backgroundColor: meta.color + '15' }]}>
          <SymbolView
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name={meta.icon as any}
            size={14}
            tintColor={meta.color}
            fallback={<Text style={{ color: meta.color }}>•</Text>}
          />
        </View>
        <Text style={st.sectionTitle}>{meta.label}</Text>
        <View style={st.sectionCountPill}>
          <Text style={st.sectionCountTxt}>{count}</Text>
        </View>
      </View>
      <View style={{ gap: 8, marginTop: 10 }}>{items}</View>
    </Animated.View>
  );
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function FactCard({
  fact,
  color,
  onChanged,
}: {
  fact: Fact;
  color: string;
  onChanged: () => void;
}) {
  const importance = fact.importance ?? 2;
  const isHighImportance = importance >= 4;

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Bunu unutmamı ister misin?', `"${fact.content}"`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Unut',
        style: 'destructive',
        onPress: async () => {
          try {
            const { useAuth } = await import('@clerk/expo');
            // Direct API; not great but avoids passing token through
            // Use existing memory endpoint
            // Note: this uses the implicit fetch in fetchAll's caller via re-fetch below
            await fetch(`${API_URL}/api/assistant/memory/facts/${fact.id}`, {
              method: 'DELETE',
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onChanged();
          } catch {}
        },
      },
    ]);
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      style={[factSt.card, isHighImportance && { borderLeftColor: color, borderLeftWidth: 3 }]}
    >
      <Text style={factSt.content}>{fact.content}</Text>
      {(fact.history.length > 0 || isHighImportance) && (
        <View style={factSt.metaRow}>
          {isHighImportance && <Text style={[factSt.importanceTag, { color }]}>Önemli</Text>}
          {fact.history.length > 0 && (
            <Text style={factSt.metaText}>{fact.history.length} versiyon önce</Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

function LifeEventFactCard({ fact, onChanged }: { fact: Fact; onChanged: () => void }) {
  const eventLabel = fact.eventType ? (LIFE_EVENT_LABELS[fact.eventType] ?? 'Olay') : 'Olay';
  const date = new Date(fact.createdAt);
  const dateStr = formatRelativeDate(date);

  return (
    <View style={lifeEventSt.card}>
      <View style={lifeEventSt.headerRow}>
        <View style={lifeEventSt.typePill}>
          <Text style={lifeEventSt.typeTxt}>{eventLabel}</Text>
        </View>
        <Text style={lifeEventSt.date}>{dateStr}</Text>
      </View>
      <Text style={lifeEventSt.summary}>{fact.content}</Text>
    </View>
  );
}

function PersonCard({ person }: { person: Person }) {
  return (
    <View style={personSt.card}>
      <View style={personSt.row}>
        <View style={personSt.avatar}>
          <Text style={personSt.avatarTxt}>{person.name[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={personSt.name}>{person.name}</Text>
          <Text style={personSt.relTxt}>
            {REL_LABELS[person.relationship] ?? person.relationship}
          </Text>
        </View>
      </View>
      {person.healthConditions.length > 0 && (
        <View style={personSt.healthRow}>
          <SymbolView
            name="heart.fill"
            size={11}
            tintColor="#FF3B30"
            fallback={<Text style={{ color: '#FF3B30', fontSize: 10 }}>♥</Text>}
          />
          <Text style={personSt.healthTxt}>{person.healthConditions.join(', ')}</Text>
        </View>
      )}
      {person.notes && <Text style={personSt.notes}>{person.notes}</Text>}
    </View>
  );
}

function EventCard({ event }: { event: LifeEvent }) {
  return (
    <View style={eventCardSt.card}>
      <View style={eventCardSt.row}>
        <Text style={eventCardSt.title}>{event.title}</Text>
        <Text style={eventCardSt.date}>{formatRelativeDate(new Date(event.date))}</Text>
      </View>
      {event.description && <Text style={eventCardSt.desc}>{event.description}</Text>}
      <View style={eventCardSt.metaRow}>
        {event.person && <Text style={eventCardSt.personLabel}>· {event.person.name}</Text>}
        {event.resolved && (
          <View style={eventCardSt.resolvedTag}>
            <Text style={eventCardSt.resolvedTxt}>Çözüldü</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Empty ────────────────────────────────────────────────────────────────────

function EmptyMemoryView() {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 480,
      useNativeDriver: true,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }).start();
  }, []);

  return (
    <Animated.View style={[emptySt.wrap, { opacity }]}>
      <View style={emptySt.iconCircle}>
        <SymbolView
          name="brain"
          size={36}
          tintColor={C.accent}
          fallback={<Text style={{ fontSize: 32 }}>🧠</Text>}
        />
      </View>
      <Text style={emptySt.title}>Seni henüz tanımıyorum.</Text>
      <Text style={emptySt.sub}>
        Sohbet ettikçe seni öğreniyorum. Bana hayatından, alışkanlıklarından, sevdiğin şeylerden
        bahsederken — aklımda kalıyor.
      </Text>
      <View style={emptySt.exampleList}>
        <ExampleRow icon="person.fill" text="Tercihlerin (örn. vegan, kahve sevmem)" />
        <ExampleRow icon="person.2.fill" text="Hayatındaki kişiler (örn. annem Ayşe)" />
        <ExampleRow icon="sparkles" text="Hayat olayları (örn. yeni iş, taşınma)" />
        <ExampleRow icon="hand.raised.fill" text="Sözlerin (örn. düzenli yürüyeceğim)" />
      </View>
    </Animated.View>
  );
}

function ExampleRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={emptySt.exampleRow}>
      <View style={emptySt.exampleIcon}>
        <SymbolView
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name={icon as any}
          size={12}
          tintColor={C.accent}
          fallback={<Text style={{ color: C.accent, fontSize: 10 }}>•</Text>}
        />
      </View>
      <Text style={emptySt.exampleText}>{text}</Text>
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function MemorySkeleton() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={{ paddingHorizontal: 18, paddingTop: 24, gap: 14 }}>
      <Animated.View
        style={{ width: '70%', height: 18, borderRadius: 9, backgroundColor: '#E5E5EA', opacity }}
      />
      <Animated.View
        style={{ width: '90%', height: 12, borderRadius: 6, backgroundColor: '#EAEAEF', opacity }}
      />
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ marginTop: 16, gap: 8 }}>
          <Animated.View
            style={{ width: 120, height: 14, borderRadius: 7, backgroundColor: '#E5E5EA', opacity }}
          />
          <Animated.View
            style={{ height: 56, borderRadius: 14, backgroundColor: '#FFFFFF', opacity }}
          />
          <Animated.View
            style={{ height: 56, borderRadius: 14, backgroundColor: '#FFFFFF', opacity }}
          />
        </View>
      ))}
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeDate(d: Date) {
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'Şimdi';
  if (min < 60) return `${min} dk önce`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} sa önce`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day} gün önce`;
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
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.page },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: font.semibold, fontSize: 16, color: C.text, letterSpacing: -0.3 },
  headerCount: { fontFamily: font.regular, fontSize: 11, color: C.textMuted, marginTop: 2 },
  scroll: { paddingHorizontal: 18, paddingTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontFamily: font.bold,
    fontSize: 13,
    color: C.text,
    letterSpacing: -0.1,
    textTransform: 'uppercase',
  },
  sectionCountPill: {
    backgroundColor: C.surface,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionCountTxt: { fontFamily: font.semibold, fontSize: 11, color: C.textMuted },
});

const heroSt = StyleSheet.create({
  wrap: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: C.accentSoft,
  },
  title: {
    fontFamily: font.bold,
    fontSize: 17,
    color: C.text,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  body: {
    fontFamily: font.regular,
    fontSize: 14,
    color: C.textMuted,
    marginTop: 8,
    lineHeight: 21,
    letterSpacing: -0.1,
  },
});

const factSt = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  content: {
    fontFamily: font.regular,
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  importanceTag: {
    fontFamily: font.semibold,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  metaText: { fontFamily: font.regular, fontSize: 11, color: C.textDim },
});

const lifeEventSt = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#FF375F',
    borderWidth: 1,
    borderColor: C.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typePill: {
    backgroundColor: '#FF375F15',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeTxt: {
    fontFamily: font.semibold,
    fontSize: 10,
    color: '#FF375F',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  date: { fontFamily: font.regular, fontSize: 11, color: C.textDim },
  summary: {
    fontFamily: font.medium,
    fontSize: 14,
    color: C.text,
    marginTop: 8,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
});

const personSt = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { fontFamily: font.bold, fontSize: 15, color: C.accent },
  name: { fontFamily: font.semibold, fontSize: 15, color: C.text, letterSpacing: -0.2 },
  relTxt: { fontFamily: font.regular, fontSize: 12, color: C.textMuted, marginTop: 1 },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  healthTxt: { fontFamily: font.regular, fontSize: 12, color: '#FF3B30' },
  notes: {
    fontFamily: font.regular,
    fontSize: 13,
    color: C.textMuted,
    marginTop: 8,
    lineHeight: 19,
  },
});

const eventCardSt = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1, fontFamily: font.semibold, fontSize: 14, color: C.text, letterSpacing: -0.2 },
  date: { fontFamily: font.regular, fontSize: 11, color: C.textDim, marginLeft: 8 },
  desc: {
    fontFamily: font.regular,
    fontSize: 13,
    color: C.textMuted,
    marginTop: 6,
    lineHeight: 19,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  personLabel: { fontFamily: font.regular, fontSize: 12, color: C.textDim },
  resolvedTag: {
    backgroundColor: '#30D15815',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  resolvedTxt: { fontFamily: font.semibold, fontSize: 10, color: '#30D158', letterSpacing: 0.3 },
});

const emptySt = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: font.extrabold,
    fontSize: 22,
    color: C.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  sub: {
    fontFamily: font.regular,
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  exampleList: { alignSelf: 'stretch', marginTop: 28, gap: 10 },
  exampleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  exampleIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exampleText: {
    fontFamily: font.regular,
    fontSize: 13,
    color: C.textMuted,
    flex: 1,
    letterSpacing: -0.1,
  },
});

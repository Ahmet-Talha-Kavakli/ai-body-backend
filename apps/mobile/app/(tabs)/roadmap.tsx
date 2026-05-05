/**
 * AI Road Map Tab — V3 Faz C (Pivot Mantığı)
 *
 * Ortada PİVOT = "Tanıştığımız gün". Yukarıda birlikteliğin olayları
 * (sürpriz arklar, zaman milestone'ları). Aşağıda AI'ın geçmişi.
 *
 * Mount'ta otomatik scroll pivot'a gider.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';

import { font, C, API_URL } from '../../lib/theme';
import {
  fetchRoadmap,
  postMilestoneComment,
  deleteMilestoneComment,
  type MilestoneCharacterItem,
  type MilestoneCommentItem,
  type RoadmapMilestone,
  type RoadmapResponse,
  type SharedMilestone,
} from '../../src/services/assistant/roadmap';

const { width: W } = Dimensions.get('window');
const NODE_SIZE = 64;
const PIVOT_SIZE = 84;
const ROW_HEIGHT = 140;
const PATH_AMP = 80;

const EMOTION_EMOJI: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  fear: '😨',
  pride: '🏆',
  shame: '😳',
  anger: '😡',
  love: '❤️',
  loneliness: '🌙',
  curiosity: '🔍',
  peace: '🌿',
};

// Birleşik node tipi — render için
type NodeKind = 'shared_future' | 'pivot' | 'past';
interface UnifiedNode {
  kind: NodeKind;
  key: string;
  id: string;
  commentTargetType: 'past' | 'shared';
  title: string;
  body: string | null;
  illustrationUrl: string | null;
  emotion: string | null;
  importance: number;
  isLocked: boolean;
  ageOrYear: string | null;
  location: string | null;
  unlockedAt: string | null;
  initialComments: MilestoneCommentItem[];
  characters: MilestoneCharacterItem[];
  raw: RoadmapMilestone | SharedMilestone;
}

export default function RoadmapTabScreen() {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  const [data, setData] = useState<RoadmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openNode, setOpenNode] = useState<UnifiedNode | null>(null);
  const [hasScrolledToPivot, setHasScrolledToPivot] = useState(false);

  const fetch_ = useCallback(async () => {
    try {
      const token = (await getToken()) ?? '';
      const r = await fetchRoadmap({ apiUrl: API_URL, token });
      if (r) setData(r);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useFocusEffect(
    useCallback(() => {
      fetch_();
    }, [fetch_]),
  );

  // Birleşik node listesi: yukarıdan aşağıya = en yeni gelecek → pivot → en eski geçmiş
  const nodes: UnifiedNode[] = useMemo(() => {
    if (!data || data.status !== 'ready' || !data.story) return [];
    const result: UnifiedNode[] = [];

    // Shared milestones — büyük order'dan başla (en yukarı = ileri zamana)
    const sharedSorted = [...data.sharedMilestones].sort((a, b) => b.sharedOrder - a.sharedOrder);
    const futureShared = sharedSorted.filter((m) => m.sharedOrder > 0); // pivot dışı
    const pivot = sharedSorted.find((m) => m.type === 'first_meeting' || m.sharedOrder === 0);

    for (const m of futureShared) {
      result.push({
        kind: 'shared_future',
        key: `shared-${m.id}`,
        id: m.id,
        commentTargetType: 'shared',
        title: m.title,
        body: m.bodyText,
        illustrationUrl: m.illustrationUrl,
        emotion: m.emotion,
        importance: m.importance,
        isLocked: false,
        ageOrYear: null,
        location: null,
        unlockedAt: m.occurredAt,
        initialComments: m.comments ?? [],
        characters: [],
        raw: m,
      });
    }

    if (pivot) {
      result.push({
        kind: 'pivot',
        key: `pivot-${pivot.id}`,
        id: pivot.id,
        commentTargetType: 'shared',
        title: pivot.title,
        body: pivot.bodyText,
        illustrationUrl: pivot.illustrationUrl,
        emotion: pivot.emotion,
        importance: pivot.importance,
        isLocked: false,
        ageOrYear: null,
        location: null,
        unlockedAt: pivot.occurredAt,
        initialComments: pivot.comments ?? [],
        characters: [],
        raw: pivot,
      });
    }

    // Geçmiş milestone'lar — son chronological order'dan başla (en yakın geçmiş üstte)
    // Ama pivot ile aynı an olan milestone'u (typically chronologicalOrder=9 = "Ahmet ile tanışma") FİLTRELE
    const pastSorted = [...data.milestones].sort(
      (a, b) => b.chronologicalOrder - a.chronologicalOrder,
    );
    // En son milestone (kullanıcıyla tanışma anı) pivot ile çakışıyor — atla
    const pastFiltered = pastSorted.length > 0 ? pastSorted.slice(1) : pastSorted;

    for (const m of pastFiltered) {
      result.push({
        kind: 'past',
        key: `past-${m.id}`,
        id: m.id,
        commentTargetType: 'past',
        title: m.title,
        body: m.bodyText,
        illustrationUrl: m.illustrationUrl,
        emotion: m.emotion,
        importance: m.importance,
        isLocked: m.isLocked,
        ageOrYear: m.age != null ? `${m.age} yaş` : m.year != null ? String(m.year) : null,
        location: m.location,
        unlockedAt: m.unlockedAt,
        initialComments: m.comments ?? [],
        characters: m.characters ?? [],
        raw: m,
      });
    }

    return result;
  }, [data]);

  const pivotIndex = nodes.findIndex((n) => n.kind === 'pivot');

  // Mount'ta pivot'a scroll
  useEffect(() => {
    if (hasScrolledToPivot || pivotIndex < 0 || !scrollRef.current) return;
    setTimeout(() => {
      const y = pivotIndex * ROW_HEIGHT - 100; // hero ofsetini hesaba katmıyor; kaba
      scrollRef.current?.scrollTo({ y, animated: false });
      setHasScrolledToPivot(true);
    }, 50);
  }, [pivotIndex, hasScrolledToPivot, nodes.length]);

  if (loading || !data) {
    return (
      <View style={[s.root, { paddingTop: insets.top, justifyContent: 'center' }]}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (data.status !== 'ready' || !data.story) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <TabHeader title={data.profile.name ? `${data.profile.name}'in hayatı` : 'Yolculuk'} />
        <View style={s.emptyWrap}>
          <View style={s.emptyIcon}>
            <SymbolView
              name="hourglass"
              size={28}
              tintColor={C.accent}
              fallback={<Text style={{ fontSize: 28 }}>⏳</Text>}
            />
          </View>
          <Text style={s.emptyTitle}>
            {data.status === 'generating'
              ? 'Hikaye yazılıyor…'
              : data.status === 'failed'
                ? 'Hikaye oluşturulamadı'
                : 'Henüz hikaye yok'}
          </Text>
          <Text style={s.emptySub}>
            {data.status === 'generating'
              ? 'Birkaç dakika içinde hikayesi şekilleniyor.'
              : 'Karakter testini yaptıktan sonra hikaye otomatik oluşur.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <TabHeader
        title={data.profile.name ? `${data.profile.name} ile yolculuk` : 'Yolculuk'}
        subtitle={(() => {
          const age = computeLiveAge(data.profile.bornAt, data.profile.ageAtCreation);
          return age != null ? `${data.profile.name}, ${age} yaşında` : null;
        })()}
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 80,
          paddingTop: 12,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetch_();
            }}
            tintColor={C.accent}
          />
        }
      >
        {/* Üst gösterge: ileri (gelecek) */}
        <DirectionLabel direction="up" text="Birlikteliğimiz" />

        {/* Yol + nodes */}
        <View style={{ position: 'relative' }}>
          <RoadPath count={nodes.length} />
          <View>
            {nodes.map((n, idx) => (
              <RoadNode
                key={n.key}
                node={n}
                index={idx}
                onOpen={() => {
                  if (!n.isLocked) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setOpenNode(n);
                  } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  }
                }}
              />
            ))}
          </View>
        </View>

        {/* Alt gösterge: geçmiş */}
        <DirectionLabel direction="down" text={`${data.profile.name}'in geçmişi`} />
      </ScrollView>

      <Modal
        visible={!!openNode}
        animationType="fade"
        transparent
        onRequestClose={() => setOpenNode(null)}
      >
        {openNode && (
          <NodeCard
            node={openNode}
            profileName={data.profile.name}
            onClose={() => setOpenNode(null)}
          />
        )}
      </Modal>
    </View>
  );
}

// ─── TabHeader ───────────────────────────────────────────────────────────────

function TabHeader({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <View style={s.header}>
      <View style={s.headerCenter}>
        <Text style={s.headerTitle}>{title}</Text>
        {subtitle && <Text style={s.headerSub}>{subtitle}</Text>}
      </View>
    </View>
  );
}

// V3 Faz C — Atmosfer gradient (yaş bandına göre)
function pickGradient(
  node: UnifiedNode,
  isPivot: boolean,
  isShared: boolean,
): readonly [string, string, string] {
  if (isPivot) return ['#E0DBFC', '#C4BBF7', '#E0DBFC'] as const;
  if (isShared) return ['#F2EFFE', '#D9D2F8', '#F8F7FF'] as const;
  // Past — yaş bandına göre
  const age = node.raw && 'age' in node.raw ? node.raw.age : null;
  if (age == null) return ['#F2EFFE', '#E0DBFC', '#F8F7FF'] as const;
  if (age <= 8) {
    // Çocukluk — sıcak sarı/turuncu (köy/güneşli)
    return ['#FDF4E0', '#F5E1B8', '#FAF1D9'] as const;
  }
  if (age <= 14) {
    // Geç çocukluk — yumuşak yeşil (kasaba)
    return ['#E8F3E5', '#C8E0C0', '#EEF5EB'] as const;
  }
  if (age <= 22) {
    // Lise/üniversite — soft mavi (lise pencere ışığı)
    return ['#E3EBFA', '#BFD0F0', '#EBF1FB'] as const;
  }
  // Yetişkin — şehir tonu
  return ['#E8E5F5', '#C9C0E2', '#EEEBF7'] as const;
}

// V3 Faz C — İlişki etiketleri
function relLabel(rel: string): string {
  const map: Record<string, string> = {
    mother: 'Annem',
    father: 'Babam',
    sibling: 'Kardeşim',
    first_love: 'İlk aşkım',
    grandparent: 'Dedem/Anneannem',
    friend: 'Arkadaşım',
    other: '',
  };
  return map[rel] ?? '';
}

// V3 Faz C — Anlık yaş hesabı (bornAt'tan)
function computeLiveAge(bornAt: string | null, fallback: number | null): number | null {
  if (!bornAt) return fallback;
  const born = new Date(bornAt);
  const now = new Date();
  let a = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) a--;
  return a;
}

// ─── Direction Label (üst/alt yönlendirici) ─────────────────────────────────

function DirectionLabel({ direction, text }: { direction: 'up' | 'down'; text: string }) {
  return (
    <View style={[dirSt.wrap, direction === 'up' ? dirSt.up : dirSt.down]}>
      <View style={dirSt.line} />
      <View style={dirSt.pill}>
        <SymbolView
          name={direction === 'up' ? 'arrow.up' : 'arrow.down'}
          size={11}
          tintColor={C.accent}
          fallback={
            <Text style={{ color: C.accent, fontSize: 10 }}>{direction === 'up' ? '↑' : '↓'}</Text>
          }
        />
        <Text style={dirSt.txt}>{text}</Text>
      </View>
      <View style={dirSt.line} />
    </View>
  );
}

// ─── SVG Yol ─────────────────────────────────────────────────────────────────

function RoadPath({ count }: { count: number }) {
  if (count === 0) return null;
  const totalH = count * ROW_HEIGHT;
  const cx = W / 2;

  let d = `M ${cx} 0`;
  for (let i = 0; i < count; i++) {
    const y = (i + 1) * ROW_HEIGHT;
    const offset = (i % 2 === 0 ? 1 : -1) * PATH_AMP;
    const ctrlX = cx + offset;
    const ctrlY = y - ROW_HEIGHT / 2;
    d += ` Q ${ctrlX} ${ctrlY}, ${cx} ${y}`;
  }

  return (
    <Svg
      width={W}
      height={totalH}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      <Path d={d} stroke="rgba(94,92,230,0.15)" strokeWidth={3} fill="none" strokeDasharray="6 8" />
    </Svg>
  );
}

// ─── Node ─────────────────────────────────────────────────────────────────

function RoadNode({
  node,
  index,
  onOpen,
}: {
  node: UnifiedNode;
  index: number;
  onOpen: () => void;
}) {
  const isLeft = index % 2 === 0;
  const offset = isLeft ? -PATH_AMP : PATH_AMP;
  const isPivot = node.kind === 'pivot';
  const isLocked = node.isLocked;

  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isPivot || (!isLocked && (node.importance ?? 3) >= 4)) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: isPivot ? 1.08 : 1.05,
            duration: isPivot ? 1400 : 1200,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: isPivot ? 1400 : 1200,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [isPivot, isLocked, node.importance, pulse]);

  const emoji = isPivot ? '💜' : node.emotion ? (EMOTION_EMOJI[node.emotion] ?? '✨') : '✨';
  const size = isPivot ? PIVOT_SIZE : NODE_SIZE;

  return (
    <View style={[nodeSt.row, { height: ROW_HEIGHT, transform: [{ translateX: offset }] }]}>
      <Pressable onPress={onOpen} disabled={isLocked && !isPivot}>
        <Animated.View
          style={[
            nodeSt.node,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [{ scale: pulse }],
              backgroundColor: isPivot ? C.accent : isLocked ? 'rgba(94,92,230,0.18)' : '#FFFFFF',
              borderColor: isPivot ? C.accent : isLocked ? 'transparent' : C.accent,
              borderWidth: isPivot ? 0 : isLocked ? 0 : 2,
            },
          ]}
        >
          {isLocked && !isPivot ? (
            <SymbolView
              name="lock.fill"
              size={20}
              tintColor={C.accent}
              fallback={<Text style={{ color: C.accent, fontSize: 18 }}>🔒</Text>}
            />
          ) : (
            <Text style={[nodeSt.emoji, isPivot && { fontSize: 36 }]}>{emoji}</Text>
          )}
        </Animated.View>

        {/* Etiket */}
        <View style={[nodeSt.label, isLeft ? nodeSt.labelRight : nodeSt.labelLeft]}>
          <Text
            style={[
              nodeSt.labelTitle,
              isPivot && { color: C.accent, fontFamily: font.bold },
              isLocked && !isPivot && { color: C.textMuted },
            ]}
            numberOfLines={1}
          >
            {isLocked && !isPivot ? '?' : node.title}
          </Text>
          {(node.ageOrYear || node.location) && !isLocked && (
            <Text style={nodeSt.labelMeta}>
              {[node.ageOrYear, node.location].filter(Boolean).join(' · ')}
            </Text>
          )}
          {isPivot && <Text style={nodeSt.labelMeta}>başlangıç noktası</Text>}
        </View>
      </Pressable>
    </View>
  );
}

// ─── Card (sinematik) ─────────────────────────────────────────────────────────

function NodeCard({
  node,
  profileName,
  onClose,
}: {
  node: UnifiedNode;
  profileName: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 240,
        easing: Easing.bezier(0.4, 0, 1, 1),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.96,
        duration: 240,
        easing: Easing.bezier(0.4, 0, 1, 1),
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const isPivot = node.kind === 'pivot';
  const isShared = node.kind === 'shared_future' || isPivot;
  const emoji = isPivot ? '💜' : node.emotion ? (EMOTION_EMOJI[node.emotion] ?? '✨') : '✨';

  return (
    <Animated.View style={[cardSt.root, { opacity }]}>
      <LinearGradient
        colors={pickGradient(node, isPivot, isShared)}
        style={StyleSheet.absoluteFill}
      />

      <View style={[cardSt.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={handleClose} hitSlop={14} style={cardSt.closeBtn}>
          <SymbolView
            name="xmark"
            size={14}
            tintColor={C.textMuted}
            fallback={<Text style={{ color: C.textMuted, fontSize: 14 }}>✕</Text>}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 28,
          paddingBottom: insets.bottom + 32,
          justifyContent: 'center',
        }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          {/* Illustration varsa göster, yoksa emoji */}
          {node.illustrationUrl ? (
            <View style={cardSt.illustrationWrap}>
              <Image
                source={{ uri: node.illustrationUrl }}
                style={cardSt.illustration}
                contentFit="cover"
                transition={400}
              />
            </View>
          ) : (
            <View style={[cardSt.emojiCircle, isPivot && cardSt.pivotEmojiCircle]}>
              <Text style={cardSt.emojiBig}>{emoji}</Text>
            </View>
          )}

          {isPivot && <Text style={cardSt.kindLabel}>BİZİM HİKAYEMİZ BAŞLADI</Text>}
          {!isPivot &&
            isShared &&
            node.raw &&
            'type' in node.raw &&
            node.raw.type === 'surprise_arc' && (
              <Text style={cardSt.kindLabel}>
                {profileName.toUpperCase()}'İN HAYATINDA YENİ BİR OLAY
              </Text>
            )}
          {!isPivot &&
            isShared &&
            (!node.raw || !('type' in node.raw) || node.raw.type !== 'surprise_arc') && (
              <Text style={cardSt.kindLabel}>BİRLİKTE</Text>
            )}
          {node.kind === 'past' && (
            <Text style={cardSt.kindLabel}>{profileName.toUpperCase()}'İN HAYATINDAN</Text>
          )}

          <Text style={cardSt.title}>{node.title}</Text>

          <View style={cardSt.metaRow}>
            {node.ageOrYear && (
              <View style={cardSt.metaChip}>
                <Text style={cardSt.metaTxt}>{node.ageOrYear}</Text>
              </View>
            )}
            {node.location && (
              <View style={cardSt.metaChip}>
                <Text style={cardSt.metaTxt}>{node.location}</Text>
              </View>
            )}
          </View>

          {node.body && <Text style={cardSt.body}>{node.body}</Text>}

          {/* V3 Faz C — Bu anıdaki kişiler */}
          {node.characters.length > 0 && (
            <View style={charSt.wrap}>
              <Text style={charSt.heading}>Bu anıdaki kişiler</Text>
              <View style={charSt.row}>
                {node.characters.map((c) => (
                  <View key={c.id} style={charSt.item}>
                    <View style={charSt.avatar}>
                      {c.avatarUrl ? (
                        <Image
                          source={{ uri: c.avatarUrl }}
                          style={charSt.avatarImg}
                          contentFit="cover"
                        />
                      ) : (
                        <Text style={charSt.avatarTxt}>{c.name[0]?.toUpperCase()}</Text>
                      )}
                    </View>
                    <Text style={charSt.name} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={charSt.rel} numberOfLines={1}>
                      {relLabel(c.relationship)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* V3 Faz C — Aksiyon barı */}
          <View style={actionSt.row}>
            <Pressable
              onPress={async () => {
                Haptics.selectionAsync();
                try {
                  const message = `${node.title}\n\n${node.body ?? ''}\n\n— ${profileName}'in hayatından`;
                  await Share.share({
                    message,
                    title: node.title,
                  });
                } catch {}
              }}
              style={actionSt.btn}
            >
              <SymbolView
                name="square.and.arrow.up"
                size={16}
                tintColor={C.accent}
                fallback={<Text style={{ color: C.accent, fontSize: 14 }}>↑</Text>}
              />
              <Text style={actionSt.btnTxt}>Paylaş</Text>
            </Pressable>
          </View>

          {/* V3 Faz C — Yorumlar */}
          <CommentsBlock node={node} />

          {node.unlockedAt && (
            <Text style={cardSt.footer}>
              {isPivot
                ? `${new Date(node.unlockedAt).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })} tarihinde tanıştık.`
                : isShared
                  ? `${new Date(node.unlockedAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}`
                  : `${profileName} bu anıyı ${new Date(node.unlockedAt).toLocaleDateString(
                      'tr-TR',
                      { day: 'numeric', month: 'long', year: 'numeric' },
                    )} tarihinde paylaştı.`}
            </Text>
          )}
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
}

// ─── Comments Block ─────────────────────────────────────────────────────────

function CommentsBlock({ node }: { node: UnifiedNode }) {
  const { getToken } = useAuth();
  const [comments, setComments] = useState<MilestoneCommentItem[]>(node.initialComments);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    Haptics.selectionAsync();
    try {
      const token = (await getToken()) ?? '';
      const r = await postMilestoneComment({
        apiUrl: API_URL,
        token,
        mid: node.id,
        type: node.commentTargetType,
        content: text,
      });
      if (r) {
        setComments((prev) => [r, ...prev]);
        setDraft('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const token = (await getToken()) ?? '';
    const ok = await deleteMilestoneComment({
      apiUrl: API_URL,
      token,
      mid: node.id,
      commentId,
    });
    if (ok) setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <View style={commentSt.wrap}>
      <Text style={commentSt.heading}>Notlarım</Text>

      {comments.map((c) => (
        <Pressable key={c.id} onLongPress={() => handleDelete(c.id)} style={commentSt.bubble}>
          <Text style={commentSt.bubbleTxt}>{c.content}</Text>
          <Text style={commentSt.bubbleDate}>
            {new Date(c.createdAt).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'short',
            })}
          </Text>
        </Pressable>
      ))}

      <View style={commentSt.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Bu an için bir not bırak..."
          placeholderTextColor={C.textDim}
          style={commentSt.input}
          multiline
          maxLength={1000}
        />
        <Pressable
          onPress={handleSend}
          disabled={!draft.trim() || sending}
          style={[commentSt.sendBtn, { opacity: draft.trim() && !sending ? 1 : 0.4 }]}
        >
          <SymbolView
            name="arrow.up"
            size={14}
            tintColor="#fff"
            fallback={<Text style={{ color: '#fff' }}>↑</Text>}
          />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.page },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: font.semibold, fontSize: 15, color: C.text, letterSpacing: -0.2 },
  headerSub: { fontFamily: font.regular, fontSize: 11, color: C.textMuted, marginTop: 1 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(94,92,230,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: font.bold,
    fontSize: 18,
    color: C.text,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: font.regular,
    fontSize: 14,
    color: C.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

const dirSt = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  up: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  down: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.hairline,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(94,92,230,0.10)',
    borderRadius: 10,
  },
  txt: {
    fontFamily: font.medium,
    fontSize: 11,
    color: C.accent,
    letterSpacing: 0.3,
  },
});

const nodeSt = StyleSheet.create({
  row: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  node: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  emoji: { fontSize: 28 },
  label: {
    position: 'absolute',
    top: NODE_SIZE / 2 - 16,
    width: 130,
  },
  labelLeft: {
    right: NODE_SIZE + 14,
    alignItems: 'flex-end',
  },
  labelRight: {
    left: NODE_SIZE + 14,
    alignItems: 'flex-start',
  },
  labelTitle: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: C.text,
    letterSpacing: -0.2,
  },
  labelMeta: {
    fontFamily: font.regular,
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },
});

const cardSt = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  illustrationWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 22,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  pivotEmojiCircle: {
    backgroundColor: C.accent,
    shadowOpacity: 0.4,
  },
  emojiBig: { fontSize: 48 },
  kindLabel: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: C.accent,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: font.extrabold,
    fontSize: 28,
    color: C.text,
    letterSpacing: -0.6,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 34,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
  },
  metaChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: 'rgba(94,92,230,0.12)',
    borderRadius: 10,
  },
  metaTxt: {
    fontFamily: font.medium,
    fontSize: 12,
    color: C.accent,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: font.regular,
    fontSize: 17,
    color: C.text,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  footer: {
    fontFamily: font.regular,
    fontSize: 12,
    color: C.textDim,
    marginTop: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

const actionSt = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(94,92,230,0.10)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  btnTxt: {
    fontFamily: font.medium,
    fontSize: 13,
    color: C.accent,
    letterSpacing: -0.1,
  },
});

const charSt = StyleSheet.create({
  wrap: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(94,92,230,0.18)',
  },
  heading: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: C.accent,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  item: {
    alignItems: 'center',
    width: 64,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 48,
    height: 48,
  },
  avatarTxt: {
    fontFamily: font.bold,
    fontSize: 18,
    color: '#fff',
  },
  name: {
    fontFamily: font.medium,
    fontSize: 11,
    color: C.text,
    textAlign: 'center',
  },
  rel: {
    fontFamily: font.regular,
    fontSize: 9,
    color: C.textMuted,
    textAlign: 'center',
  },
});

const commentSt = StyleSheet.create({
  wrap: {
    marginTop: 28,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(94,92,230,0.18)',
  },
  heading: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: C.accent,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  bubbleTxt: {
    fontFamily: font.regular,
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  bubbleDate: {
    fontFamily: font.regular,
    fontSize: 11,
    color: C.textDim,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 14,
    padding: 6,
    paddingLeft: 12,
  },
  input: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 14,
    color: C.text,
    minHeight: 36,
    maxHeight: 100,
    paddingVertical: 6,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

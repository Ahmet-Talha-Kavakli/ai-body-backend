/**
 * V4 Faz E — Karakter Sohbet Ekranı
 *
 * Tek bir karakterle yapılan sohbeti gösterir.
 * - Üstte: avatar + isim + status (mood / activity / location)
 * - Mesajlar: WhatsApp tarzı balonlar
 * - "Yazıyor..." indikatörü stream sırasında
 * - Alt input
 *
 * Stream akışı: streamCharacterMessage callbacks'leri ile chunk-by-chunk dolar.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Image as RNImage,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import RNAnimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { font, C, API_URL } from '../../../../lib/theme';
import {
  fetchCharacterMessages,
  markCharacterAsRead,
  streamCharacterMessage,
  sendGiftToCharacter,
  uploadCharacterMedia,
  grantDataAccess,
  reactToMessage,
  type CharacterMessage,
} from '../../../../src/services/assistant/characters';
import * as ImagePicker from 'expo-image-picker';
import { ChatBackground } from '../../../../src/components/messaging/ChatBackground';
import VoiceBubble from '../../../../src/components/characters/VoiceBubble';
import { MediaViewer } from '../../../../src/components/messaging/MediaViewer';
import { Toast } from '../../../../src/components/messaging/Toast';
import { MessageActionsModal } from '../../../../src/components/messaging/MessageActionsModal';
import GiftPickerSheet from '../../../../src/components/characters/GiftPickerSheet';
import { AnniversaryLetterCard } from '../../../../src/components/characters/AnniversaryLetterCard';
import { SymbolicGiftCard } from '../../../../src/components/characters/SymbolicGiftCard';
import {
  ensureMicPermission,
  prepareRecordingMode,
  uploadAndTranscribe,
} from '../../../../src/services/assistant/voice';
import { useAudioRecorder, RecordingPresets } from 'expo-audio';

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

interface HeaderState {
  name: string;
  bio: string | null;
  avatarUrl?: string | null;
  currentMood: string | null;
  currentActivity?: string | null;
  currentLocation?: string | null;
  status?: 'active' | 'cold' | 'silent' | 'broken' | 'recovering' | 'departed' | null;
  lastMajorEvent?: string | null;
  lastSeenAt?: string | null;
}

function formatDateSeparator(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (86400 * 1000));
  if (diffDays === 0) return 'Bugün';
  if (diffDays === 1) return 'Dün';
  if (diffDays < 7) {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[d.getDay()];
  }
  if (d.getFullYear() === now.getFullYear()) {
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
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db_ = new Date(b);
  return (
    da.getFullYear() === db_.getFullYear() &&
    da.getMonth() === db_.getMonth() &&
    da.getDate() === db_.getDate()
  );
}

function formatLastSeenLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);
  if (sec < 30) return null; // çok yeniyse "çevrimiçi" sayılır
  if (sec < 60) return 'son görülme az önce';
  if (min === 1) return 'son görülme 1 dk önce';
  if (min < 60) return `son görülme ${min} dk önce`;
  if (hour === 1) return 'son görülme 1 saat önce';
  if (hour < 24) return `son görülme ${hour} saat önce`;
  if (day === 1) return 'son görülme dün';
  if (day < 7) return `son görülme ${day} gün önce`;
  // Çok eski tarihte bile fallback olarak tarih ver
  const d = new Date(iso);
  return `son görülme ${d.getDate()}/${d.getMonth() + 1}`;
}

function TypingDots() {
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  const a3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const make = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            delay,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
        ]),
      );

    const loops = [make(a1, 0), make(a2, 150), make(a3, 300)];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [a1, a2, a3]);

  const dotStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
    transform: [
      {
        translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }),
      },
    ],
  });

  return (
    <View style={styles.typingDots}>
      <Animated.View style={[styles.dot, dotStyle(a1)]} />
      <Animated.View style={[styles.dot, dotStyle(a2)]} />
      <Animated.View style={[styles.dot, dotStyle(a3)]} />
    </View>
  );
}

interface ChatBubbleProps {
  message:
    | CharacterMessage
    | { id: string; role: 'assistant'; content: string; createdAt: string; pending?: boolean };
  characterName: string;
  onStarToggle?: (messageId: string, starred: boolean) => void;
  isStarred?: boolean;
  onReply?: (messageId: string, content: string, role: 'user' | 'assistant') => void;
  /** Eğer bu mesaj başka bir mesaja cevapsa, alıntılanan mesaj */
  quotedMessage?: { content: string; role: 'user' | 'assistant'; senderName: string } | null;
  /** V4.6 M69 — Reaksiyon eylemleri */
  onReact?: (messageId: string, emoji: string) => void;
  reactions?: Array<{ emoji: string; fromType: 'user' | 'character' }>;
  /** V4.6 M72 — Foto'ya tıklayınca tam ekran açar */
  onMediaPress?: (uri: string, meta: { senderName: string; sentAt: string }) => void;
  /** V4.6 M81 — Toast tetikleme */
  onToast?: (message: string) => void;
  /** V4.6 M68 — Long-press menü tetikleme (parent'ta MessageActionsModal açılır) */
  onLongPress?: (
    messageId: string,
    content: string,
    role: 'user' | 'assistant',
    isStarred: boolean,
    layout: { y: number; height: number },
  ) => void;
}

function ChatBubble({
  message,
  characterName,
  onStarToggle,
  isStarred,
  onReply,
  quotedMessage,
  onReact,
  reactions,
  onMediaPress,
  onToast,
  onLongPress,
}: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const isPending = 'pending' in message && message.pending;
  const isTemp = message.id.startsWith('tmp-') || message.id.startsWith('streaming-');

  // Pop-in entrance: scale + translate + fade
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 180,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // V4.5 — mesaj iletim durumu
  const deliveredAt = 'deliveredAt' in message ? (message as CharacterMessage).deliveredAt : null;
  const seenByCharacterAt =
    'seenByCharacterAt' in message ? (message as CharacterMessage).seenByCharacterAt : null;
  const deletedByCharacterAt =
    'deletedByCharacterAt' in message ? (message as CharacterMessage).deletedByCharacterAt : null;
  const originalContent =
    'originalContent' in message ? (message as CharacterMessage).originalContent : null;
  const isDeleted = !!deletedByCharacterAt;

  // Tik durumu: tek (sent), çift gri (delivered), çift mor (seen)
  const tickStatus: 'sending' | 'sent' | 'delivered' | 'seen' = (() => {
    if (isPending || isTemp) return 'sending';
    if (seenByCharacterAt) return 'seen';
    if (deliveredAt) return 'delivered';
    return 'sent';
  })();
  // Mor baloncuğa uyumlu tik renkleri:
  //  - sending: yarı şeffaf beyaz
  //  - sent (tek tik): yarı şeffaf beyaz
  //  - delivered (çift gri): yarı şeffaf beyaz
  //  - seen (çift mavi): parlak açık mavi (mor üzerinde belirgin)
  const tickColor =
    tickStatus === 'seen'
      ? '#7DD3FC' // seen — açık mavi, mor üzerinde belirgin
      : tickStatus === 'sending'
        ? 'rgba(255,255,255,0.5)'
        : 'rgba(255,255,255,0.85)';
  const tickGlyph = tickStatus === 'sending' ? '⏱' : tickStatus === 'sent' ? '✓' : '✓✓';

  // Saat formatı: HH:mm (createdAt kullanıcının yerel saatine)
  const timeStr = (() => {
    try {
      const d = new Date(message.createdAt);
      return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  })();

  // V4.5 Madde 3 — Sesli mesaj için özel container (text bubble bypass edilir)
  const audioUrlForBubble = 'audioUrl' in message ? (message as CharacterMessage).audioUrl : null;
  const audioDurationForBubble =
    'audioDurationMs' in message ? (message as CharacterMessage).audioDurationMs : null;

  if (audioUrlForBubble && !isDeleted) {
    return (
      <Animated.View
        style={[
          styles.bubbleRow,
          isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant,
          { opacity, transform: [{ translateY }, { scale }] },
        ]}
      >
        <View
          style={{
            backgroundColor: isUser ? C.accent : '#FFFFFF',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 16,
            borderTopRightRadius: isUser ? 4 : 16,
            borderTopLeftRadius: isUser ? 16 : 4,
            minWidth: 240,
            maxWidth: 280,
          }}
        >
          <VoiceBubble
            audioUrl={audioUrlForBubble}
            durationMs={audioDurationForBubble ?? 0}
            isSelf={isUser}
            accentColor={isUser ? '#FFFFFF' : C.accent}
            inactiveColor={isUser ? 'rgba(255,255,255,0.4)' : '#D1D5DB'}
            iconColor={isUser ? C.accent : '#FFFFFF'}
            playBtnBg={isUser ? '#FFFFFF' : C.accent}
          />
          {timeStr && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'flex-end',
                marginTop: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: font.regular,
                  color: isUser ? 'rgba(255,255,255,0.85)' : '#9CA3AF',
                  marginRight: isUser ? 3 : 0,
                }}
              >
                {timeStr}
              </Text>
              {isUser && (
                <Ionicons
                  name={
                    tickStatus === 'sending'
                      ? 'time-outline'
                      : tickStatus === 'sent'
                        ? 'checkmark'
                        : 'checkmark-done'
                  }
                  size={16}
                  color={tickColor}
                  style={{ marginLeft: 2 }}
                />
              )}
            </View>
          )}
        </View>
      </Animated.View>
    );
  }

  // V4.6 M68 — Bubble ref (long-press konumunu yakalamak için)
  const bubbleRefAlt = useRef<unknown>(null);

  // V4.6 M65 — Medya bubble (foto), padding sıfır + foto kenarlarda
  const isMediaBubble =
    'mediaUrl' in message &&
    !!(message as CharacterMessage).mediaUrl &&
    (message as CharacterMessage).mediaType === 'image' &&
    !isDeleted;

  const bubble = (
    <View
      style={[
        styles.bubble,
        isUser ? styles.bubbleUser : styles.bubbleAssistant,
        isDeleted && { opacity: 0.5 },
        isMediaBubble && {
          padding: 3,
          paddingHorizontal: 3,
          paddingVertical: 3,
          overflow: 'hidden',
        },
      ]}
    >
      {/* V4.5 Reply: alıntılanan mesaj (varsa baloncuğun üstünde) */}
      {quotedMessage && (
        <View
          style={{
            borderLeftWidth: 3,
            borderLeftColor: isUser ? 'rgba(255,255,255,0.6)' : C.accent,
            paddingLeft: 8,
            paddingVertical: 4,
            marginBottom: 6,
            backgroundColor: isUser ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.04)',
            borderRadius: 4,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontFamily: font.semibold,
              color: isUser ? 'rgba(255,255,255,0.85)' : C.accent,
              marginBottom: 2,
            }}
          >
            {quotedMessage.role === 'user' ? 'Sen' : quotedMessage.senderName}
          </Text>
          <Text
            numberOfLines={2}
            style={{
              fontSize: 12,
              fontFamily: font.regular,
              color: isUser ? 'rgba(255,255,255,0.85)' : '#666',
            }}
          >
            {quotedMessage.content}
          </Text>
        </View>
      )}
      {(() => {
        const audioUrl = 'audioUrl' in message ? (message as CharacterMessage).audioUrl : null;
        const audioDurationMs =
          'audioDurationMs' in message ? (message as CharacterMessage).audioDurationMs : null;
        if (audioUrl && !isDeleted) {
          return (
            <VoiceBubble
              audioUrl={audioUrl}
              durationMs={audioDurationMs ?? 0}
              isSelf={isUser}
              accentColor={isUser ? '#FFFFFF' : C.accent}
              inactiveColor={isUser ? 'rgba(255,255,255,0.4)' : '#D1D5DB'}
              iconColor={isUser ? C.accent : '#FFFFFF'}
              playBtnBg={isUser ? '#FFFFFF' : C.accent}
            />
          );
        }
        // V4.6 M59 — Medya (foto/video) gösterimi
        const mediaUrl = 'mediaUrl' in message ? (message as CharacterMessage).mediaUrl : null;
        const mediaType = 'mediaType' in message ? (message as CharacterMessage).mediaType : null;
        if (mediaUrl && mediaType === 'image' && !isDeleted) {
          const hasCaption =
            message.content &&
            message.content !== '[foto gönderdi]' &&
            message.content !== '📷 Foto' &&
            message.content !== '🎬 Video';
          return (
            <Pressable
              onPress={() =>
                onMediaPress?.(mediaUrl, {
                  senderName: isUser ? 'Sen' : characterName,
                  sentAt: message.createdAt,
                })
              }
            >
              <Image
                source={{ uri: mediaUrl }}
                style={{ width: 240, height: 300, borderRadius: 6 }}
                contentFit="cover"
              />
              {hasCaption && (
                <Text
                  style={[
                    styles.bubbleText,
                    isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
                    { marginTop: 4, paddingHorizontal: 8, paddingBottom: 6 },
                  ]}
                >
                  {message.content}
                </Text>
              )}
            </Pressable>
          );
        }
        return (
          <Text
            style={[
              styles.bubbleText,
              isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
              isDeleted && {
                textDecorationLine: 'line-through' as const,
                fontStyle: 'italic' as const,
              },
            ]}
          >
            {isDeleted && originalContent
              ? originalContent
              : message.content || (isPending ? '…' : '')}
          </Text>
        );
      })()}
      {isDeleted && (
        <Text
          style={{
            marginTop: 4,
            fontSize: 11,
            fontFamily: font.regular,
            color: isUser ? 'rgba(255,255,255,0.7)' : '#999',
          }}
        >
          {characterName} bu mesajı sildi
        </Text>
      )}
      {/* WhatsApp tarzı: saat + (user için) tik bubble içinde sağ altta */}
      {timeStr && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-end',
            marginTop: 2,
            // V4.6 — Foto bubble'da saat foto'nun üstüne overlay
            ...(isMediaBubble
              ? {
                  position: 'absolute' as const,
                  bottom: 8,
                  right: 8,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 8,
                }
              : {}),
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontFamily: font.regular,
              color: isMediaBubble ? '#FFFFFF' : isUser ? 'rgba(255,255,255,0.85)' : '#9CA3AF',
              marginRight: isUser ? 3 : 0,
            }}
          >
            {timeStr}
          </Text>
          {isUser && (
            <Ionicons
              name={
                tickStatus === 'sending'
                  ? 'time-outline'
                  : tickStatus === 'sent'
                    ? 'checkmark'
                    : 'checkmark-done'
              }
              size={isMediaBubble ? 14 : 18}
              color={isMediaBubble ? '#FFFFFF' : tickColor}
              style={{ marginLeft: 2 }}
            />
          )}
        </View>
      )}
      {/* V4.6 M69 — Reaksiyon rozeti */}
      {reactions && reactions.length > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: -10,
            [isUser ? 'left' : 'right']: 8,
            flexDirection: 'row',
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            paddingHorizontal: 6,
            paddingVertical: 2,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          {reactions.slice(0, 3).map((r, i) => (
            <Text key={i} style={{ fontSize: 12, marginHorizontal: 1 }}>
              {r.emoji}
            </Text>
          ))}
        </View>
      )}
      {isStarred && (
        <Text
          style={{
            position: 'absolute',
            top: 4,
            right: 6,
            fontSize: 10,
            color: '#FFC107',
            fontFamily: font.regular,
          }}
        >
          ⭐
        </Text>
      )}
    </View>
  );

  // Geçici mesaj (gönderilirken / streaming) — sadece kopyala
  if (isTemp || !message.content) {
    return (
      <Animated.View
        style={[
          styles.bubbleRow,
          isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant,
          { opacity, transform: [{ translateY }, { scale }] },
        ]}
      >
        <Pressable
          ref={(r) => {
            bubbleRefAlt.current = r;
          }}
          onLongPress={() => {
            if (!message.content) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            const node = bubbleRefAlt.current as unknown as {
              measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void;
            } | null;
            if (node?.measureInWindow) {
              node.measureInWindow((_x, y, _w, h) => {
                onLongPress?.(
                  message.id,
                  message.content,
                  message.role as 'user' | 'assistant',
                  !!isStarred,
                  { y, height: h },
                );
              });
            } else {
              onLongPress?.(
                message.id,
                message.content,
                message.role as 'user' | 'assistant',
                !!isStarred,
                { y: 0, height: 0 },
              );
            }
          }}
          delayLongPress={300}
        >
          {bubble}
        </Pressable>
      </Animated.View>
    );
  }

  // V4.5 Reply: pan gesture (sola/sağa kaydırma → reply tetikle)
  const translateX = useSharedValue(0);
  const triggerReply = () => {
    if (onReply) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onReply(message.id, message.content, message.role as 'user' | 'assistant');
    }
  };
  const panGesture = Gesture.Pan()
    .activeOffsetX(isUser ? [-50, 0] : [0, 50])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      // User mesajı sola, assistant mesajı sağa
      const limited = isUser ? Math.max(e.translationX, -80) : Math.min(e.translationX, 80);
      translateX.value = limited;
    })
    .onEnd((e) => {
      const threshold = 50;
      const triggered = isUser ? e.translationX < -threshold : e.translationX > threshold;
      if (triggered && onReply) {
        runOnJS(triggerReply)();
      }
      translateX.value = withSpring(0, { damping: 15 });
    });

  const animatedSwipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.bubbleRow,
        isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant,
        { opacity, transform: [{ translateY }, { scale }] },
      ]}
    >
      <GestureDetector gesture={panGesture}>
        <RNAnimated.View style={animatedSwipeStyle}>
          <Pressable
            ref={(r) => {
              bubbleRefAlt.current = r;
            }}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              const node = bubbleRefAlt.current as unknown as {
                measureInWindow?: (
                  cb: (x: number, y: number, w: number, h: number) => void,
                ) => void;
              } | null;
              if (node?.measureInWindow) {
                node.measureInWindow((_x, y, _w, h) => {
                  onLongPress?.(
                    message.id,
                    message.content,
                    message.role as 'user' | 'assistant',
                    !!isStarred,
                    { y, height: h },
                  );
                });
              } else {
                onLongPress?.(
                  message.id,
                  message.content,
                  message.role as 'user' | 'assistant',
                  !!isStarred,
                  { y: 0, height: 0 },
                );
              }
            }}
            delayLongPress={300}
          >
            {bubble}
          </Pressable>
        </RNAnimated.View>
      </GestureDetector>
    </Animated.View>
  );
}

export default function CharacterChatScreen() {
  const router = useRouter();
  const { characterId } = useLocalSearchParams<{ characterId: string }>();
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const headerAvatarScale = useRef(new Animated.Value(1)).current;
  const sendBtnScale = useRef(new Animated.Value(1)).current;

  const [header, setHeader] = useState<HeaderState | null>(null);
  const [messages, setMessages] = useState<
    Array<
      | CharacterMessage
      | { id: string; role: 'assistant'; content: string; createdAt: string; pending?: boolean }
    >
  >([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  // V4.6 M6 — Engellenme durumu
  const [blockedState, setBlockedState] = useState<{
    permanent: boolean;
    until: string | null;
    reason: string | null;
  } | null>(null);
  // V4.6 M69 — Mesaj reaksiyonları (messageId → emoji listesi)
  const [reactionsByMsg, setReactionsByMsg] = useState<
    Record<string, Array<{ emoji: string; fromType: 'user' | 'character' }>>
  >({});
  // V4.6 M72 — Foto viewer state
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [viewerMeta, setViewerMeta] = useState<{ senderName: string; sentAt: string } | null>(null);
  // V4.6 M81 — Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // V4.6 M74 — Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  // V4.6 M68 — Mesaj eylem modal'ı (basılı tutulan mesajın konumu dahil)
  const [actionModal, setActionModal] = useState<{
    messageId: string;
    content: string;
    role: 'user' | 'assistant';
    isStarred: boolean;
    anchorY: number;
    anchorHeight: number;
  } | null>(null);
  // V4.5 Faz 15B — Hediye sheet
  const [giftSheetOpen, setGiftSheetOpen] = useState(false);

  // Aktif stream controller — yeni mesaj atılınca eski stream iptal olur
  const activeStreamRef = useRef<AbortController | null>(null);

  // V4.5 Madde 3 — Sesli mesaj kaydı (expo-audio hook)
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const [recordStartTime, setRecordStartTime] = useState<number | null>(null);
  const [recordElapsed, setRecordElapsed] = useState(0);
  const [cancelRequested, setCancelRequested] = useState(false);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // V4.5 Reply
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    content: string;
    role: 'user' | 'assistant';
  } | null>(null);

  const load = useCallback(async () => {
    if (!characterId) return;
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const data = await fetchCharacterMessages(token, characterId);
      setHeader(data.character);
      // Akıllı merge: optimistic (tmp-) mesajları koru, ama içeriği server'da varsa sil
      setMessages((prev) => {
        const tmpMessages = prev.filter((m) => m.id.startsWith('tmp-'));
        const serverContents = new Set(data.messages.map((m) => m.content));
        const stillPending = tmpMessages.filter((m) => !serverContents.has(m.content));
        return [...data.messages, ...stillPending];
      });
      markCharacterAsRead(token, characterId).catch(() => {});
    } catch (e) {
      console.error('[character-load] failed:', e);
    } finally {
      setLoading(false);
    }
  }, [characterId, getToken]);

  useEffect(() => {
    load();
  }, [load]);

  // Scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length, streamingText]);

  const onStarToggle = useCallback(
    async (messageId: string, starred: boolean) => {
      try {
        const token = await getToken();
        if (!token) return;
        await fetch(`${API_URL}/api/assistant/messages/${messageId}/star`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ starred }),
        });
        // Optimistic update — local state'te starredAt'i toggle et
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            // Streaming/temp mesajlar için starredAt yok, atla
            if (!('starredAt' in m)) return m;
            return { ...m, starredAt: starred ? new Date().toISOString() : null };
          }),
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        console.error('[character-chat] star toggle fail:', e);
      }
    },
    [getToken],
  );

  const onSend = async (
    voicePayload?: {
      audioUrl: string;
      durationMs: number;
      transcript: string;
      tone: any;
    } | null,
    mediaPayload?: { url: string; type: 'image' | 'video' } | null,
  ) => {
    if (!characterId) return;
    // V4.6 M6 — Engellenmişsek mesaj gönderme
    if (blockedState) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const isVoice = !!voicePayload;
    const isMedia = !!mediaPayload;
    const text = isVoice ? voicePayload!.transcript : input.trim();
    if (!text && !isVoice && !isMedia) return;
    if (!isVoice) setInput('');
    // Optimistic spam koruması: 150ms kısa lock
    setSending(true);
    setTimeout(() => setSending(false), 150);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Eski aktif stream varsa iptal et — Mia yarım kalan cevabı kesilir
    if (activeStreamRef.current) {
      activeStreamRef.current.abort();
    }
    const myController = new AbortController();
    activeStreamRef.current = myController;

    // Optimistic kullanıcı mesajı
    // Foto/video varsa optimistic'te caption yoksa boş bırak (bubble'da foto görünür)
    const optimisticContent = text;
    const tempUserMsg: CharacterMessage = {
      id: `tmp-user-${Date.now()}`,
      role: 'user',
      content: optimisticContent,
      createdAt: new Date().toISOString(),
      starredAt: null,
      readAt: null,
      repliedToMessageId: null,
      deliveredAt: null,
      seenByCharacterAt: null,
      deletedByCharacterAt: null,
      originalContent: null,
      audioUrl: voicePayload?.audioUrl ?? null,
      audioDurationMs: voicePayload?.durationMs ?? null,
      transcript: voicePayload?.transcript ?? null,
      mediaUrl: mediaPayload?.url ?? null,
      mediaType: mediaPayload?.type ?? null,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    // Stream başlat — streamingMessageId DELAYED gelince veya ilk chunk'ta set edilir.
    // (Karakter uyuyor/meşgulse hemen "yazıyor" göstermek yanlış, delay sonra göstermeli.)
    const streamId = `streaming-${Date.now()}`;
    setStreamingText('');

    try {
      // Fresh token — 401 spam azalt
      const token = (await getToken({ skipCache: true })) ?? (await getToken());
      if (!token) throw new Error('No token');

      let accumulated = '';
      // V4.5 Reply: send sırasında varsa repliedToMessageId payload'a giriyor
      const replyOpts: {
        repliedToMessageId?: string | null;
        voice?: any;
        media?: { url: string; type: 'image' | 'video' } | null;
        abortSignal?: AbortSignal;
      } = {
        abortSignal: myController.signal,
      };
      if (replyingTo) replyOpts.repliedToMessageId = replyingTo.id;
      if (voicePayload) replyOpts.voice = voicePayload;
      if (mediaPayload) replyOpts.media = mediaPayload;
      // Reply state'i hemen temizle (mesaj gönderildi)
      if (replyingTo) setReplyingTo(null);
      await streamCharacterMessage(
        token,
        characterId,
        text,
        {
          onChunk: (delta) => {
            // İlk chunk gelince "yazıyor" göster (karakter şimdi gerçekten yazıyor)
            if (!accumulated) setStreamingMessageId(streamId);
            accumulated += delta;
            setStreamingText(accumulated);
          },
          onComplete: (messageId, cleanContent) => {
            // V4.7 A4 — server sanitize tarafından temizlenmiş bir cleanContent geldiyse
            // streaming sırasında gönderilen bug cümle yerine onu kullan.
            const finalContent = cleanContent ?? accumulated;
            // Mesaj geldi — soft haptic ding
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Stream'i kalıcı mesaja çevir — duplicate id varsa eklemeyi atla
            setMessages((prev) => {
              if (prev.some((m) => m.id === messageId)) return prev;
              return [
                ...prev,
                {
                  id: messageId,
                  role: 'assistant',
                  content: finalContent,
                  createdAt: new Date().toISOString(),
                  starredAt: null,
                  readAt: new Date().toISOString(),
                  repliedToMessageId: null,
                  deliveredAt: null,
                  seenByCharacterAt: null,
                  deletedByCharacterAt: null,
                  originalContent: null,
                  audioUrl: null,
                  audioDurationMs: null,
                  transcript: null,
                } as CharacterMessage,
              ];
            });
            setStreamingMessageId(null);
            setStreamingText('');
          },
          onVoiceMessage: ({ messageId, audioUrl, durationMs, transcript }) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setMessages((prev) => {
              if (prev.some((m) => m.id === messageId)) return prev;
              return [
                ...prev,
                {
                  id: messageId,
                  role: 'assistant',
                  content: transcript,
                  createdAt: new Date().toISOString(),
                  starredAt: null,
                  readAt: new Date().toISOString(),
                  repliedToMessageId: null,
                  deliveredAt: null,
                  seenByCharacterAt: null,
                  deletedByCharacterAt: null,
                  originalContent: null,
                  audioUrl,
                  audioDurationMs: durationMs,
                  transcript,
                } as CharacterMessage,
              ];
            });
            setStreamingMessageId(null);
            setStreamingText('');
          },
          onDelayed: ({ reason, estimatedDelayMs }) => {
            // Mia uyuyor/meşgul/sinirli → "yazıyor" yerine bilgi göster
            const reasonText: Record<string, string> = {
              sleeping: 'uyuyor',
              busy: 'meşgul',
              eating: 'yemekte',
              angry: 'sinirli',
              tired: 'yorgun',
              normal: '',
            };
            const label = reasonText[reason] ?? '';
            if (label) {
              console.log(
                `[delayed] Mia ${label}, ~${Math.round(estimatedDelayMs / 1000)}sn sonra cevap`,
              );
            }
            // Stream zaten devam edecek — typing dots gösterilmeye devam
          },
          onSkipped: (reason) => {
            setStreamingMessageId(null);
            setStreamingText('');
            console.log('[character-chat] skipped:', reason);
          },
          onError: (msg) => {
            console.error('[character-chat] stream error:', msg);
            setStreamingMessageId(null);
            setStreamingText('');
            // Optimistic kullanıcı mesajını koru (server'a yazıldı), sadece stream durdu
            // load() çağırınca akıllı merge zaten doğru sonucu verir
          },
          // V4.6 M6 — Karakter kullanıcıyı engellediyse banner göster, optimistic mesajı kaldır
          onBlocked: ({ permanent, until, reason }) => {
            setBlockedState({ permanent, until, reason });
            setStreamingMessageId(null);
            setStreamingText('');
            // Optimistic eklenen kullanıcı mesajını UI'dan kaldır (server'a düşmedi)
            setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          },
        },
        replyOpts,
      );
      // Stream başarılı bitti — server'dan kesin gerçek mesajı çek (id'leri eşitle)
      load();
    } catch (e) {
      console.error('[character-chat] send fail:', e);
      setStreamingMessageId(null);
      setStreamingText('');
    } finally {
      setSending(false);
    }
  };

  // V4.6 M74 — Pull-to-refresh: eski mesajları yükle
  const handleRefresh = async () => {
    if (refreshing || !characterId) return;
    if (messages.length === 0) return;
    setRefreshing(true);
    try {
      const oldest = messages[0];
      if (!oldest) return;
      const token = await getToken();
      if (!token) return;
      const r = await fetchCharacterMessages(token, characterId, {
        before: oldest.createdAt,
        take: 30,
      });
      const newOnes = r.messages.filter((m) => !messages.some((x) => x.id === m.id));
      if (newOnes.length > 0) {
        setMessages((prev) => [...newOnes, ...prev]);
      } else {
        setToastMessage('Daha eski mesaj yok');
      }
    } catch (e) {
      console.error('[refresh] fail:', e);
      setToastMessage('Yüklenemedi');
    } finally {
      setRefreshing(false);
    }
  };

  // V4.6 M69 — Reaksiyon ekle
  const handleReact = async (messageId: string, emoji: string) => {
    // Optimistic
    setReactionsByMsg((prev) => {
      const cur = prev[messageId] ?? [];
      const filtered = cur.filter((r) => r.fromType !== 'user');
      return { ...prev, [messageId]: [...filtered, { emoji, fromType: 'user' }] };
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const token = await getToken();
      if (!token) return;
      await reactToMessage(token, { messageId, emoji });
    } catch (e) {
      console.error('[react] fail:', e);
    }
  };

  // V4.6 M59 — Foto/video gönderme
  const handlePickMedia = async () => {
    if (!characterId || sending || blockedState) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Galeri izni', 'Foto/video göndermek için galeri iznine ihtiyacımız var.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.85,
        allowsEditing: false,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const type: 'image' | 'video' = asset.type === 'video' ? 'video' : 'image';
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setSending(true);
      const token = await getToken();
      if (!token) {
        setSending(false);
        return;
      }
      const uploaded = await uploadCharacterMedia(token, {
        characterId,
        uri: asset.uri,
        type,
        mimeType: asset.mimeType,
      });
      setSending(false);
      // Stream başlat — text varsa caption olarak kullan
      onSend(null, { url: uploaded.url, type: uploaded.type });
    } catch (e) {
      setSending(false);
      console.error('[media] pick fail:', e);
      Alert.alert('Hata', 'Medya yüklenemedi.');
    }
  };

  // V4.6 M62 — @ menüsü: veri paylaşımı sheet
  const handleAtMention = () => {
    if (!characterId) return;
    Alert.alert('Veri Paylaşımı', 'Mia ile hangi verini paylaşmak istersin?', [
      { text: 'Beslenme', onPress: () => promptScopeAndShare('nutrition') },
      { text: 'Su', onPress: () => promptScopeAndShare('water') },
      { text: 'İlaç', onPress: () => promptScopeAndShare('medication') },
      { text: 'Egzersiz', onPress: () => promptScopeAndShare('exercise') },
      { text: 'Vücut/Kilo', onPress: () => promptScopeAndShare('body') },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const promptScopeAndShare = (
    category: 'nutrition' | 'water' | 'medication' | 'exercise' | 'body',
  ) => {
    Alert.alert(
      'Hangi tarih aralığı?',
      `${category} verisini Mia ile paylaşacaksın. Hangi aralığı görsün?`,
      [
        { text: 'Sadece bugün', onPress: () => doShare(category, 'today') },
        { text: 'Son 7 gün', onPress: () => doShare(category, 'last7') },
        { text: 'Tüm geçmiş', onPress: () => doShare(category, 'all') },
        { text: 'İptal', style: 'cancel' },
      ],
    );
  };

  const doShare = async (
    category: 'nutrition' | 'water' | 'medication' | 'exercise' | 'body',
    scope: 'today' | 'last7' | 'all',
  ) => {
    if (!characterId) return;
    try {
      const token = await getToken();
      if (!token) return;
      await grantDataAccess(token, { characterId, category, scope });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Input'a etiket koy
      const label = {
        nutrition: 'beslenme',
        water: 'su',
        medication: 'ilaç',
        exercise: 'egzersiz',
        body: 'vücut',
      }[category];
      const scopeLabel = { today: 'bugün', last7: 'son 7 gün', all: 'tüm geçmiş' }[scope];
      setInput((prev) => `${prev}@${label} (${scopeLabel}) `.trimStart());
    } catch (e) {
      console.error('[data-share] grant fail:', e);
      Alert.alert('Hata', 'Veri paylaşımı başarısız oldu.');
    }
  };

  // @ tetiklemesini takip et — kullanıcı @ yazdığında menü aç
  useEffect(() => {
    if (input.endsWith('@') && !sending && !blockedState) {
      // Kısa gecikme ile alert (klavye kayması için)
      const t = setTimeout(() => {
        // Kullanıcı hâlâ @ ile bitiyorsa menüyü aç
        setInput((cur) => {
          if (cur.endsWith('@')) {
            handleAtMention();
            return cur.slice(0, -1); // @ işaretini kaldır
          }
          return cur;
        });
      }, 100);
      return () => clearTimeout(t);
    }
    return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  // V4.5 Madde 3 — Sesli kayıt handlers (expo-audio hook)
  const handleStartRecord = async () => {
    if (recording || sending) return;
    const granted = await ensureMicPermission();
    if (!granted) {
      Alert.alert('Mikrofon izni', 'Sesli mesaj göndermek için mikrofon iznine ihtiyacımız var.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      await prepareRecordingMode();
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      const startedAt = Date.now();
      setRecording(true);
      setCancelRequested(false);
      setRecordStartTime(startedAt);
      setRecordElapsed(0);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      recordTimerRef.current = setInterval(() => {
        setRecordElapsed(Date.now() - startedAt);
      }, 200);
    } catch (e) {
      console.error('[voice] start fail', e);
      setRecording(false);
    }
  };

  const handleStopRecord = async () => {
    if (!recording) return;
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    const startedAt = recordStartTime ?? Date.now();
    const durationMs = Date.now() - startedAt;
    const wasCancelled = cancelRequested;
    setRecording(false);
    setRecordStartTime(null);
    setRecordElapsed(0);
    setCancelRequested(false);

    // Recorder'ı durdur
    try {
      await audioRecorder.stop();
    } catch (e) {
      console.error('[voice] stop fail', e);
      return;
    }
    const uri = audioRecorder.uri;

    // İptal isteği veya çok kısa (<700ms) veya uri yoksa → iptal
    if (wasCancelled || durationMs < 700 || !uri) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    // Upload + Whisper + send
    setSending(true);
    try {
      const token = (await getToken({ skipCache: true })) ?? (await getToken());
      if (!token) throw new Error('No token');
      const result = await uploadAndTranscribe(token, characterId!, { uri, durationMs });
      await onSend({
        audioUrl: result.audioUrl,
        durationMs: result.durationMs,
        transcript: result.transcript,
        tone: result.tone,
      });
    } catch (e) {
      console.error('[voice] upload/transcribe fail', e);
      Alert.alert('Sesli mesaj gönderilemedi', 'Lütfen tekrar dene.');
      setSending(false);
    }
  };

  const handleCancelRecord = () => {
    // Sadece flag set; gerçek stop bırakılınca handleStopRecord'da olur
    setCancelRequested(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  };

  // WhatsApp tarzı son görülme / durum
  // - Yazıyorsa zaten streamingMessageId'den biliyoruz, ama header'da basit tutalım
  // - currentActivity sleeping → "uyuyor"
  // - kafede / işte / dışarda → "kafede" / "işte" / "dışarda"
  // - default → "çevrimiçi"
  // WhatsApp paterni:
  // - Yazıyorsa → "yazıyor…"
  // - Karakter şu an gerçekten aktif (lastSeen <30sn) → "çevrimiçi"
  // - Değilse → "son görülme X önce"
  // Mood/activity header'da gösterilmez — sohbet sırasında karakterin kendi
  // konuşmasında ortaya çıkar (gerçekçi).
  const isCharacterOnline = (() => {
    if (!header?.lastSeenAt) return false;
    const t = new Date(header.lastSeenAt).getTime();
    if (!Number.isFinite(t)) return false;
    return Date.now() - t < 30_000;
  })();
  const headerStatus: string = (() => {
    if (streamingMessageId) return 'yazıyor…';
    if (header?.status === 'departed') return 'ayrıldı';
    if (isCharacterOnline) return 'çevrimiçi';
    const lastSeenLabel = formatLastSeenLabel(header?.lastSeenAt);
    if (lastSeenLabel) return lastSeenLabel;
    // lastSeen bilgisi henüz yoksa varsayılan
    return 'çevrimiçi';
  })();

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={C.accent} />
        </Pressable>
        <Pressable
          style={styles.headerCenter}
          onPress={() => {
            // Avatar bounce
            Animated.sequence([
              Animated.timing(headerAvatarScale, {
                toValue: 1.15,
                duration: 110,
                useNativeDriver: true,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
              }),
              Animated.spring(headerAvatarScale, {
                toValue: 1,
                tension: 200,
                friction: 7,
                useNativeDriver: true,
              }),
            ]).start();
            Haptics.selectionAsync();
            router.push(`/(app)/characters/${characterId}/profile`);
          }}
        >
          {header?.avatarUrl ? (
            <Animated.Image
              source={{ uri: header.avatarUrl }}
              style={[styles.headerAvatar, { transform: [{ scale: headerAvatarScale }] }]}
            />
          ) : (
            <Animated.View
              style={[styles.headerAvatar, { transform: [{ scale: headerAvatarScale }] }]}
            >
              <Text style={styles.headerAvatarFallback}>{header?.name?.[0]}</Text>
            </Animated.View>
          )}
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.headerName}>{header?.name}</Text>
            {!!headerStatus && <Text style={styles.headerStatus}>{headerStatus}</Text>}
          </View>
        </Pressable>
      </View>

      {/* Messages — WhatsApp tarzı doodle arka plan */}
      <ChatBackground>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m, idx) => `${m.id}-${idx}`}
          renderItem={({ item, index }) => {
            // V4.5 Reply: bu mesajın alıntıladığı eski mesajı bul
            const repliedToId =
              'repliedToMessageId' in item ? (item as CharacterMessage).repliedToMessageId : null;
            const quoted = repliedToId ? messages.find((m) => m.id === repliedToId) : null;
            const quotedMessage = quoted
              ? {
                  content: quoted.content,
                  role: quoted.role as 'user' | 'assistant',
                  senderName: quoted.role === 'user' ? 'Sen' : (header?.name ?? 'Karakter'),
                }
              : null;
            // V4.6 M66 — Tarih ayraçları (önceki mesaj farklı gündeyse pill göster)
            const prev = index > 0 ? messages[index - 1] : null;
            const showDateSeparator = !prev || !isSameDay(prev.createdAt, item.createdAt);
            return (
              <>
                {showDateSeparator && (
                  <View
                    style={{
                      alignSelf: 'center',
                      marginVertical: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      backgroundColor: 'rgba(0,0,0,0.06)',
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: font.semibold,
                        color: '#5B5B5B',
                      }}
                    >
                      {formatDateSeparator(item.createdAt)}
                    </Text>
                  </View>
                )}
                {(() => {
                  // V4.7 Faz 7 — özel kart attachments kontrolü
                  const att = (item as CharacterMessage).attachments;
                  if (att && att.kind === 'anniversary_letter') {
                    return (
                      <AnniversaryLetterCard
                        characterName={att.characterName}
                        year={att.year}
                        content={item.content}
                        createdAt={item.createdAt}
                      />
                    );
                  }
                  if (att && att.kind === 'symbolic_gift') {
                    return (
                      <SymbolicGiftCard
                        giftType={att.giftType}
                        occasion={att.occasion}
                        content={item.content}
                      />
                    );
                  }
                  return (
                    <ChatBubble
                      message={item}
                      characterName={header?.name ?? ''}
                      isStarred={'starredAt' in item ? !!item.starredAt : false}
                      onStarToggle={onStarToggle}
                      onReply={(id, content, role) => setReplyingTo({ id, content, role })}
                      quotedMessage={quotedMessage}
                      onReact={handleReact}
                      reactions={reactionsByMsg[item.id]}
                      onMediaPress={(uri, meta) => {
                        setViewerUri(uri);
                        setViewerMeta(meta);
                      }}
                      onToast={(msg) => setToastMessage(msg)}
                      onLongPress={(messageId, content, role, starred, layout) =>
                        setActionModal({
                          messageId,
                          content,
                          role,
                          isStarred: starred,
                          anchorY: layout.y,
                          anchorHeight: layout.height,
                        })
                      }
                    />
                  );
                })()}
              </>
            );
          }}
          contentContainerStyle={styles.messagesContent}
          style={{ backgroundColor: 'transparent' }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={C.accent}
              progressViewOffset={80}
            />
          }
          ListFooterComponent={
            streamingMessageId ? (
              <View>
                {streamingText ? (
                  <ChatBubble
                    message={{
                      id: streamingMessageId,
                      role: 'assistant',
                      content: streamingText,
                      createdAt: new Date().toISOString(),
                    }}
                    characterName={header?.name ?? ''}
                  />
                ) : (
                  <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
                    <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
                      <TypingDots />
                    </View>
                  </View>
                )}
              </View>
            ) : null
          }
        />
      </ChatBackground>

      {/* V4.5 Reply Preview — input bar'ın üstünde */}
      {replyingTo && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: '#F3F4F6',
            borderTopWidth: 0.5,
            borderTopColor: '#E5E7EB',
          }}
        >
          <View
            style={{
              borderLeftWidth: 3,
              borderLeftColor: C.accent,
              paddingLeft: 8,
              flex: 1,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: font.semibold,
                color: C.accent,
              }}
            >
              {replyingTo.role === 'user' ? 'Sen' : (header?.name ?? 'Karakter')}'e cevap veriyorsun
            </Text>
            <Text
              numberOfLines={1}
              style={{ fontSize: 13, fontFamily: font.regular, color: '#666', marginTop: 2 }}
            >
              {replyingTo.content}
            </Text>
          </View>
          <Pressable
            onPress={() => setReplyingTo(null)}
            style={{ padding: 6, marginLeft: 8 }}
            hitSlop={12}
          >
            <Ionicons name="close" size={20} color="#9CA3AF" />
          </Pressable>
        </View>
      )}

      {/* V4.6 M6 — Engelleme banner'ı */}
      {blockedState && (
        <View
          style={{
            backgroundColor: '#FFE4E1',
            borderTopWidth: 1,
            borderTopColor: '#F5C6BD',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Text style={{ fontFamily: font.semibold, fontSize: 14, color: '#8B0000' }}>
            {blockedState.permanent
              ? `${header?.name ?? 'Karakter'} seninle konuşmak istemiyor`
              : `${header?.name ?? 'Karakter'} seni şu an dinlemiyor`}
          </Text>
          {blockedState.reason && (
            <Text
              style={{ fontFamily: font.regular, fontSize: 12, color: '#5C0000', marginTop: 4 }}
            >
              {blockedState.reason}
            </Text>
          )}
          {!blockedState.permanent && blockedState.until && (
            <Text
              style={{ fontFamily: font.regular, fontSize: 12, color: '#5C0000', marginTop: 2 }}
            >
              {(() => {
                const d = new Date(blockedState.until);
                const diffH = Math.max(0, Math.round((d.getTime() - Date.now()) / 3600000));
                if (diffH < 1) return 'Birazdan tekrar dene';
                if (diffH < 24) return `Yaklaşık ${diffH} saat sonra tekrar deneyebilirsin`;
                const diffD = Math.round(diffH / 24);
                return `Yaklaşık ${diffD} gün sonra tekrar deneyebilirsin`;
              })()}
            </Text>
          )}
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {/* Sol taraf: TextInput veya Recording Pill */}
        {recording ? (
          <View style={styles.recordingPill}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingTime}>
              {`${Math.floor(recordElapsed / 60000)}:${String(Math.floor((recordElapsed % 60000) / 1000)).padStart(2, '0')}`}
            </Text>
            <Text style={styles.recordingHint}>Kaydediyor…</Text>
            <Pressable onPress={handleCancelRecord} hitSlop={8} style={{ paddingHorizontal: 6 }}>
              <Ionicons name="close-circle" size={22} color="#EF4444" />
            </Pressable>
          </View>
        ) : (
          <>
            {/* Hediye butonu */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setGiftSheetOpen(true);
              }}
              disabled={sending || !!blockedState}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: sending || blockedState ? 0.4 : 1,
              }}
            >
              <Ionicons name="gift-outline" size={20} color={C.accent} />
            </Pressable>
            {/* V4.6 M59 — Foto/video gönder */}
            <Pressable
              onPress={handlePickMedia}
              disabled={sending || !!blockedState}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 6,
                opacity: sending || blockedState ? 0.4 : 1,
              }}
            >
              <Ionicons name="image-outline" size={20} color={C.accent} />
            </Pressable>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Mesaj yaz…"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              multiline
              editable={!sending && !blockedState}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={() => {
                if (input.trim() && !sending) onSend();
              }}
            />
          </>
        )}

        {/* Sağ taraf: input doluysa Send | input boş ve recording değilse Mic (hold) | recording ise Stop+Send */}
        {input.trim().length > 0 && !recording ? (
          <Animated.View style={{ transform: [{ scale: sendBtnScale }] }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                Animated.sequence([
                  Animated.timing(sendBtnScale, {
                    toValue: 0.85,
                    duration: 90,
                    useNativeDriver: true,
                  }),
                  Animated.spring(sendBtnScale, {
                    toValue: 1,
                    tension: 200,
                    friction: 8,
                    useNativeDriver: true,
                  }),
                ]).start();
                onSend();
              }}
              disabled={sending || !!blockedState}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: C.accent,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: sending || blockedState ? 0.4 : 1,
              }}
            >
              <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        ) : (
          // Tek Pressable — onPressIn ile başlar, onPressOut ile durur+gönderir.
          // recording iken görsel "stop" ikon, parmak çekildiğinde aynı Pressable onPressOut'u tetikler.
          <Pressable
            onPressIn={handleStartRecord}
            onPressOut={handleStopRecord}
            disabled={sending || !!blockedState}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: recording ? '#EF4444' : C.accent,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: sending || blockedState ? 0.4 : 1,
            }}
          >
            <Ionicons name={recording ? 'stop' : 'mic'} size={20} color="#FFFFFF" />
          </Pressable>
        )}
      </View>

      {/* V4.5 Faz 15B — Hediye sheet */}
      <GiftPickerSheet
        visible={giftSheetOpen}
        onClose={() => setGiftSheetOpen(false)}
        accentColor={C.accent}
        onSend={async (gift, msg) => {
          if (!characterId) return;
          const token = await getToken();
          if (!token) return;
          try {
            const result = await sendGiftToCharacter(token, characterId, {
              giftType: gift.giftType,
              label: gift.label,
              emoji: gift.emoji,
              message: msg || undefined,
            });
            // Optimistic — sohbette hemen göster
            const giftMsg: CharacterMessage = {
              id: result.messageId,
              role: 'user',
              content: msg ? `${gift.emoji} ${gift.label} (${msg})` : `${gift.emoji} ${gift.label}`,
              createdAt: new Date().toISOString(),
              starredAt: null,
              readAt: null,
              repliedToMessageId: null,
              deliveredAt: new Date().toISOString(),
              seenByCharacterAt: null,
              deletedByCharacterAt: null,
              originalContent: null,
              audioUrl: null,
              audioDurationMs: null,
              transcript: null,
            };
            setMessages((prev) => [...prev, giftMsg]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          } catch (e) {
            console.error('[gift] send fail', e);
          }
        }}
      />
      {/* V4.6 M72 — Foto viewer (tam ekran) */}
      <MediaViewer
        visible={viewerUri !== null}
        uri={viewerUri}
        senderName={viewerMeta?.senderName}
        sentAt={viewerMeta?.sentAt}
        onClose={() => {
          setViewerUri(null);
          setViewerMeta(null);
        }}
      />
      {/* V4.6 M81 — Toast */}
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      {/* V4.6 M68+M69 — Mesaj eylem modal'ı (WhatsApp tarzı) */}
      <MessageActionsModal
        visible={actionModal !== null}
        isUser={actionModal?.role === 'user'}
        messageText={actionModal?.content ?? ''}
        isStarred={actionModal?.isStarred}
        anchorY={actionModal?.anchorY}
        anchorHeight={actionModal?.anchorHeight}
        onClose={() => setActionModal(null)}
        onReact={(emoji) => actionModal && handleReact(actionModal.messageId, emoji)}
        onReply={() => {
          if (!actionModal) return;
          setReplyingTo({
            id: actionModal.messageId,
            content: actionModal.content,
            role: actionModal.role,
          });
        }}
        onCopy={async () => {
          if (!actionModal) return;
          await Clipboard.setStringAsync(actionModal.content);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setToastMessage('Mesaj kopyalandı');
        }}
        onStarToggle={() => {
          if (!actionModal) return;
          onStarToggle(actionModal.messageId, !actionModal.isStarred);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.accentSofter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarFallback: { fontFamily: font.semibold, fontSize: 16, color: C.accent },
  headerName: { fontFamily: font.semibold, fontSize: 17, color: '#0A0A0A' },
  headerStatus: { fontFamily: font.regular, fontSize: 12, color: '#6B7280', marginTop: 1 },
  messagesContent: { paddingHorizontal: 12, paddingVertical: 8 },
  bubbleRow: { flexDirection: 'row', marginVertical: 1.5 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowAssistant: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '86%',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  bubbleUser: {
    backgroundColor: C.accent,
    borderTopRightRadius: 0, // WhatsApp tarzı: gönderen mesajın sağ üstü köşeli
  },
  bubbleAssistant: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 0, // WhatsApp tarzı: gelen mesajın sol üstü köşeli
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  bubbleText: { fontFamily: font.regular, fontSize: 16, lineHeight: 22 },
  bubbleTextUser: { color: '#FFFFFF' },
  bubbleTextAssistant: { color: '#0A0A0A' },
  typingBubble: { paddingVertical: 14, paddingHorizontal: 16, minWidth: 60 },
  typingDots: { flexDirection: 'row', gap: 4 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#9CA3AF',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 16,
    color: '#0A0A0A',
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    minHeight: 40,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  recordingTime: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: '#EF4444',
    minWidth: 36,
  },
  recordingHint: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
});

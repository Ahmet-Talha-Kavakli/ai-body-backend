/**
 * V4.6 M75 — StatusViewer
 *
 * Tam ekran story viewer:
 * - 5sn auto-advance (text/photo)
 * - Üstte ilerleme barı (her status için segment)
 * - Tap sol/sağ → önceki/sonraki
 * - Long-press → duraklat
 * - Swipe-down → kapat
 * - Alt input: "Cevapla..." (karakter status'üne)
 * - Görüldü endpoint'i her açılışta tetiklenir
 */

import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@clerk/expo';
import { font, C } from '../../../lib/theme';
import { markStatusViewed, replyToStatus, deleteStatus } from '../../services/assistant/status';
import type { StatusGroup } from '../../services/assistant/status';

const STORY_DURATION_MS = 5000;
const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '🙏', '🔥'];

interface Props {
  visible: boolean;
  group: StatusGroup | null;
  onClose: () => void;
  onReplied?: (args: { conversationId: string; characterId: string }) => void;
}

function relTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'şimdi';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa`;
  return `${Math.floor(diff / 86400)} gün`;
}

export function StatusViewer({ visible, group, onClose, onReplied }: Props) {
  const { getToken } = useAuth();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const current = group?.statuses[index];
  const total = group?.statuses.length || 0;
  const isMyStatus = group?.authorType === 'user';

  // Status değiştiğinde view kaydı
  useEffect(() => {
    if (!visible || !current || !group) return;
    if (group.authorType !== 'character' || current.viewedByMe) return;
    (async () => {
      try {
        const token = await getToken();
        if (token) await markStatusViewed(token, current.id);
      } catch {}
    })();
  }, [visible, current?.id, group?.authorType, getToken]);

  // Auto-advance animasyonu
  useEffect(() => {
    if (!visible || !current || paused) {
      animRef.current?.stop();
      return;
    }
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION_MS,
      useNativeDriver: false,
    });
    animRef.current = anim;
    anim.start(({ finished }) => {
      if (!finished) return;
      if (index + 1 < total) {
        setIndex((i) => i + 1);
      } else {
        onClose();
      }
    });
    return () => {
      anim.stop();
    };
  }, [visible, index, paused, current?.id, total]);

  // Modal kapanınca state reset
  useEffect(() => {
    if (!visible) {
      setIndex(0);
      setPaused(false);
      setReplyText('');
      progress.setValue(0);
    }
  }, [visible]);

  // Swipe-down kapama
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 12 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80) onClose();
      },
    }),
  ).current;

  if (!group || !current) return null;

  const handleTapLeft = () => {
    if (index > 0) {
      setIndex((i) => i - 1);
    }
  };
  const handleTapRight = () => {
    if (index + 1 < total) {
      setIndex((i) => i + 1);
    } else {
      onClose();
    }
  };

  const handleSendReply = async (emojiOnly?: string) => {
    if (sending) return;
    if (group.authorType !== 'character') return;
    const text = emojiOnly || replyText.trim();
    if (!text) return;
    setSending(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await replyToStatus(
        token,
        current.id,
        emojiOnly ? { emoji: emojiOnly } : { text },
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setReplyText('');
      onReplied?.({ conversationId: res.conversationId, characterId: group.authorId });
      onClose();
    } catch (e) {
      console.error('reply failed', e);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!isMyStatus) return;
    try {
      const token = await getToken();
      if (!token) return;
      await deleteStatus(token, current.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <View style={s.container} {...panResponder.panHandlers}>
        {/* İçerik */}
        {current.contentType === 'photo' && current.mediaUrl ? (
          <Image source={{ uri: current.mediaUrl }} style={s.media} resizeMode="contain" />
        ) : (
          <View style={[s.textBg, { backgroundColor: current.bgColor || '#1F2937' }]}>
            <Text style={s.textCaption}>{current.caption}</Text>
          </View>
        )}

        {/* Tap zones */}
        <Pressable
          style={[s.tapZone, s.tapLeft]}
          onPress={handleTapLeft}
          onLongPress={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
          delayLongPress={150}
        />
        <Pressable
          style={[s.tapZone, s.tapRight]}
          onPress={handleTapRight}
          onLongPress={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
          delayLongPress={150}
        />

        {/* Üst bar */}
        <View style={s.topBar} pointerEvents="box-none">
          {/* Progress segments */}
          <View style={s.progressRow}>
            {group.statuses.map((_, i) => (
              <View key={i} style={s.progressTrack}>
                <Animated.View
                  style={[
                    s.progressFill,
                    {
                      width:
                        i < index
                          ? '100%'
                          : i === index
                            ? progress.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%'],
                              })
                            : '0%',
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          {/* Author + close */}
          <View style={s.authorRow} pointerEvents="box-none">
            <View style={s.authorAvatarRing}>
              {group.authorAvatarUrl ? (
                <Image source={{ uri: group.authorAvatarUrl }} style={s.authorAvatar} />
              ) : (
                <View style={[s.authorAvatar, s.authorAvatarFallback]}>
                  <Text style={s.authorAvatarText}>{group.authorName[0]}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.authorName}>{isMyStatus ? 'Sen' : group.authorName}</Text>
              <Text style={s.authorMeta}>{relTime(current.createdAt)}</Text>
            </View>
            {isMyStatus && (
              <Pressable hitSlop={12} onPress={handleDelete} style={{ marginRight: 8 }}>
                <SymbolView
                  name="trash"
                  size={22}
                  tintColor="#FFFFFF"
                  fallback={<Text style={{ color: '#FFFFFF', fontSize: 22 }}>🗑</Text>}
                />
              </Pressable>
            )}
            <Pressable hitSlop={12} onPress={onClose}>
              <SymbolView
                name="xmark"
                size={22}
                tintColor="#FFFFFF"
                fallback={<Text style={{ color: '#FFFFFF', fontSize: 22 }}>✕</Text>}
              />
            </Pressable>
          </View>
        </View>

        {/* Alt: cevap input (sadece karakter status'lerinde) */}
        {!isMyStatus && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={s.bottomBar}
            pointerEvents="box-none"
          >
            <View style={s.reactionRow} pointerEvents="box-none">
              {QUICK_REACTIONS.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => handleSendReply(emoji)}
                  style={({ pressed }) => [
                    s.reactionBtn,
                    pressed && { transform: [{ scale: 1.2 }] },
                  ]}
                >
                  <Text style={s.reactionEmoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
            <View style={s.inputRow}>
              <TextInput
                value={replyText}
                onChangeText={setReplyText}
                placeholder={`${group.authorName}'a cevap yaz...`}
                placeholderTextColor="rgba(255,255,255,0.6)"
                style={s.input}
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
                returnKeyType="send"
                onSubmitEditing={() => handleSendReply()}
              />
              {!!replyText.trim() && (
                <Pressable onPress={() => handleSendReply()} hitSlop={12} style={s.sendBtn}>
                  <SymbolView
                    name="paperplane.fill"
                    size={20}
                    tintColor="#FFFFFF"
                    fallback={<Text style={{ color: '#FFFFFF', fontSize: 18 }}>➤</Text>}
                  />
                </Pressable>
              )}
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  media: {
    flex: 1,
    width: '100%',
  },
  textBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  textCaption: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: font.semibold,
    textAlign: 'center',
    lineHeight: 32,
  },
  tapZone: {
    position: 'absolute',
    top: 80,
    bottom: 120,
    width: '40%',
  },
  tapLeft: { left: 0 },
  tapRight: { right: 0 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 12,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorAvatarRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 1.5,
  },
  authorAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  authorAvatarFallback: {
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: font.semibold,
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: font.semibold,
  },
  authorMeta: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: font.regular,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 30,
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 10,
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  reactionBtn: {
    padding: 6,
  },
  reactionEmoji: {
    fontSize: 30,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 44,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: font.regular,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});

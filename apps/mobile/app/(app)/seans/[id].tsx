import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import {
  createEvent,
  createReminder,
  requestCalendarAuth,
  requestRemindersAuth,
  updateEvent,
  deleteEvent,
  updateReminder,
  completeReminder,
  deleteReminder,
} from '../../../src/services/assistant/calendar';
import { searchContacts, requestContactsAuth } from '../../../src/services/assistant/contacts';
import {
  pickAndUploadMedia,
  captureAndUploadPhoto,
  pickAndUploadDocument,
} from '../../../src/services/assistant/attachment';
import { sendSticker, type TenorItem } from '../../../src/services/assistant/stickers';
import { StickerGifPanel } from '../../../components/seans/StickerGifPanel';
import { fetchAIPresence, type AIStatus } from '../../../src/services/assistant/presence';
import { ChatBackground } from '../../../components/seans/ChatBackground';
import ContextMenu from 'react-native-context-menu-view';
import { font, C, API_URL } from '../../../lib/theme';
import { streamAssistantMessage } from './_streamClient';

interface ToolCallRecord {
  id: string;
  name: string;
  args: unknown;
  result: {
    ok: boolean;
    error?: string;
    data?: {
      navigate?: string;
      [key: string]: unknown;
    };
    display?: {
      title: string;
      subtitle?: string;
      icon?: string;
      color?: string;
      undoable?: boolean;
      undoToolCall?: { name: string; params: Record<string, unknown> };
    };
  };
}

interface Attachment {
  kind: 'image' | 'video' | 'document' | 'sticker' | 'gif';
  url: string;
  previewUrl?: string;
  filename?: string;
  size?: number;
  mime?: string;
  width?: number;
  height?: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  createdAt: string;
  toolCalls?: ToolCallRecord[] | null;
  isPinned?: boolean;
  attachments?: Attachment[] | null;
}

export default function SeansChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { id, starter } = useLocalSearchParams<{ id: string; starter?: string }>();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [activeToolName, setActiveToolName] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('Asistan');
  const [onboardingActive, setOnboardingActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(starter ? decodeURIComponent(starter) : '');
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [memoryToast, setMemoryToast] = useState<{
    facts: Array<{ category: string; content: string }>;
    visible: boolean;
  } | null>(null);
  const [replyTo, setReplyTo] = useState<{
    id: string;
    role: 'user' | 'assistant' | 'tool';
    content: string;
  } | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [stickerPanelOpen, setStickerPanelOpen] = useState(false);
  const [sendingSticker, setSendingSticker] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ status: AIStatus; label: string } | null>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recordingDuration = useRef(0);
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recordSecs, setRecordSecs] = useState(0);

  const listRef = useRef<FlatList<Message>>(null);
  const stickToBottomRef = useRef(true);
  const scrollAt = (animated = true) => {
    if (!stickToBottomRef.current) return;
    listRef.current?.scrollToEnd({ animated });
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const token = await getToken();
        const [profileRes, convRes] = await Promise.all([
          fetch(`${API_URL}/api/assistant/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/assistant/conversations/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const p = await profileRes.json();
        const c = await convRes.json();
        if (!alive) return;
        if (p.profile?.name) setProfileName(p.profile.name);
        if (p.profile && p.profile.onboardingCompleted === false) setOnboardingActive(true);
        // Akıllı merge: optimistic (tmp-) mesajları koru, server'da içeriği varsa sil
        setMessages((prev) => {
          const serverMsgs = (c.messages ?? []) as Message[];
          const tmpMsgs = prev.filter((m) => typeof m.id === 'string' && m.id.startsWith('tmp-'));
          const serverContents = new Set(serverMsgs.map((m) => m.content));
          const stillPending = tmpMsgs.filter((m) => !serverContents.has(m.content));
          return [...serverMsgs, ...stillPending];
        });

        // V3 Faz B: AI'nın mesajlarını okundu olarak işaretle (background)
        fetch(`${API_URL}/api/assistant/messages/mark-read`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ conversationId: id }),
        }).catch(() => {});
      } catch (e) {
        console.error('[seans/chat]', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => scrollAt(true), 80);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // V3 Faz B — AI presence polling (60s)
  useEffect(() => {
    let alive = true;
    const fetchOnce = async () => {
      const token = (await getToken()) ?? '';
      if (!token) return;
      const res = await fetchAIPresence({ apiUrl: API_URL, token });
      if (alive && res) setAiStatus(res);
    };
    fetchOnce();
    const t = setInterval(fetchOnce, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // V3 Faz B — sohbet ekranı focus'a dönünce mesajları yenile
  // (kullanıcı çıkıp girince arkada tamamlanmış AI cevabını al)
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      // İlk mount'ta zaten yukarıdaki useEffect çekiyor; sadece yeniden focus'ta çek
      // (id değişince useEffect zaten tetikleniyor, focus'ta tekrar tetiklemiyor)
      const refresh = async () => {
        try {
          const token = await getToken();
          const res = await fetch(`${API_URL}/api/assistant/conversations/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) return;
          const c = await res.json();
          if (!alive) return;
          setMessages((prev) => {
            // Optimistik tmp mesajları koru, ID'leri yenile
            const incoming = c.messages ?? [];
            const incomingIds = new Set(incoming.map((m: Message) => m.id));
            const tmpKeep = prev.filter((m) => m.id.startsWith('tmp-') && !incomingIds.has(m.id));
            return [...incoming, ...tmpKeep];
          });
        } catch {}
      };
      refresh();
      return () => {
        alive = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]),
  );

  const startRecording = async () => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Mikrofon İzni', 'Ses kaydı için mikrofon iznine ihtiyaç var.', [
          { text: 'Tamam' },
        ]);
        return;
      }
      await AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
      setRecordSecs(0);
      recordingDuration.current = 0;
      durationTimer.current = setInterval(() => {
        recordingDuration.current += 1;
        setRecordSecs((s) => s + 1);
      }, 1000);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      console.error('[record/start]', e);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    try {
      if (durationTimer.current) {
        clearInterval(durationTimer.current);
        durationTimer.current = null;
      }
      setIsRecording(false);
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (!uri || recordingDuration.current < 1) return;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTranscribing(true);

      const token = await getToken();
      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as unknown as Blob);

      const res = await fetch(`${API_URL}/api/voice/transcribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.transcript) {
        setInput(data.transcript);
      }
    } catch (e) {
      console.error('[record/stop]', e);
    } finally {
      setTranscribing(false);
      setRecordSecs(0);
    }
  };

  const cancelRecording = async () => {
    if (!isRecording) return;
    if (durationTimer.current) {
      clearInterval(durationTimer.current);
      durationTimer.current = null;
    }
    setIsRecording(false);
    setRecordSecs(0);
    try {
      await audioRecorder.stop();
    } catch {}
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const showAttachmentMenu = () => {
    Alert.alert('Eklenti', 'Ne paylaşmak istersin?', [
      {
        text: 'Fotoğraf çek',
        onPress: () => uploadAttachment('camera'),
      },
      {
        text: 'Galeriden seç',
        onPress: () => uploadAttachment('gallery'),
      },
      {
        text: 'Dosya seç',
        onPress: () => uploadAttachment('document'),
      },
      { text: 'Vazgeç', style: 'cancel' },
    ]);
  };

  const uploadAttachment = async (source: 'camera' | 'gallery' | 'document') => {
    if (uploadingAttachment) return;
    setUploadingAttachment(true);
    try {
      const token = (await getToken()) ?? '';
      const caption = input.trim();
      let result = null;
      if (source === 'camera') {
        result = await captureAndUploadPhoto({
          apiUrl: API_URL,
          conversationId: id,
          token,
          caption,
        });
      } else if (source === 'gallery') {
        result = await pickAndUploadMedia({
          apiUrl: API_URL,
          conversationId: id,
          token,
          kind: 'mixed',
          caption,
        });
      } else {
        result = await pickAndUploadDocument({
          apiUrl: API_URL,
          conversationId: id,
          token,
          caption,
        });
      }

      if (result) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Optimistic kullanıcı mesajı ekle (zaten DB'de kaydedildi)
        const newMsg: Message = {
          id: result.messageId,
          role: 'user',
          content:
            caption ||
            `[${result.attachment.kind === 'image' ? 'Fotoğraf' : result.attachment.kind === 'video' ? 'Video' : 'Dosya'}]`,
          createdAt: new Date().toISOString(),
          attachments: [
            {
              kind: result.attachment.kind,
              url: result.attachment.url,
              filename: result.attachment.filename,
              size: result.attachment.size,
              mime: result.attachment.mime,
            },
          ],
        };
        setMessages((prev) => [...prev, newMsg]);
        setInput('');
        stickToBottomRef.current = true;

        // V3 Faz B — Fotoğraf yüklendiyse AI cevabını tetikle (vision)
        if (result.attachment.kind === 'image') {
          await runVisionStream(result.messageId);
        }
      }
    } catch (e) {
      console.error('[upload]', e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setUploadingAttachment(false);
    }
  };

  // V3 Faz B — Vision stream: bir attachment mesajına AI cevabı iste
  const runVisionStream = async (attachmentMessageId: string) => {
    const aiTmpId = `tmp-ai-${Date.now()}`;
    const optimisticAi: Message = {
      id: aiTmpId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      toolCalls: [],
    };
    setMessages((prev) => [...prev, optimisticAi]);
    setSending(true);
    setThinking(true);

    let aiAccumulated = '';
    try {
      const token = await getToken();
      await streamAssistantMessage({
        url: `${API_URL}/api/assistant/conversations/${id}/stream`,
        token: token ?? '',
        forAttachmentMessageId: attachmentMessageId,
        onEvent: (event) => {
          if (event.type === 'text_delta') {
            setThinking(false);
            aiAccumulated += event.text;
            setMessages((prev) =>
              prev.map((m) => (m.id === aiTmpId ? { ...m, content: aiAccumulated } : m)),
            );
            return;
          }
          if (event.type === 'done') {
            aiAccumulated = event.finalText;
            return;
          }
          if (event.type === 'saved') {
            setMessages((prev) =>
              prev.map((m) => (m.id === aiTmpId ? { ...m, id: event.aiMessageId } : m)),
            );
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return;
          }
          if (event.type === 'error') {
            console.error('[vision-stream]', event.message);
            setMessages((prev) => prev.filter((m) => m.id !== aiTmpId || !!m.content));
            return;
          }
        },
      });
    } catch (e) {
      console.error('[vision-stream/network]', e);
      setMessages((prev) => prev.filter((m) => m.id !== aiTmpId));
    } finally {
      setSending(false);
      setThinking(false);
    }
  };

  const handlePickEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
  };

  const handlePickSticker = async (item: TenorItem) => {
    if (sendingSticker) return;
    setSendingSticker(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const token = (await getToken()) ?? '';
      const result = await sendSticker({ apiUrl: API_URL, token, conversationId: id, item });
      if (result) {
        const newMsg: Message = {
          id: result.messageId,
          role: 'user',
          content: item.kind === 'sticker' ? '[Sticker]' : '[GIF]',
          createdAt: new Date().toISOString(),
          attachments: [
            {
              kind: item.kind,
              url: item.url,
              previewUrl: item.previewUrl,
              width: item.width,
              height: item.height,
            } as Attachment,
          ],
        };
        setMessages((prev) => [...prev, newMsg]);
        stickToBottomRef.current = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStickerPanelOpen(false);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setSendingSticker(false);
    }
  };

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;

    // Yanıt verilen mesaj varsa içeriğin başına ekle ki AI bağlamı anlasın
    const finalContent = replyTo
      ? `[Şu mesaja yanıt: "${replyTo.content.slice(0, 100)}"]\n${content}`
      : content;

    setInput('');
    setReplyTo(null);
    Haptics.selectionAsync();
    stickToBottomRef.current = true;

    const userTmpId = `tmp-user-${Date.now()}`;
    const aiTmpId = `tmp-ai-${Date.now()}`;
    const optimisticUser: Message = {
      id: userTmpId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    const optimisticAi: Message = {
      id: aiTmpId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      toolCalls: [],
    };
    setMessages((prev) => [...prev, optimisticUser, optimisticAi]);
    setSending(true);
    setThinking(true);
    setActiveToolName(null);

    let aiAccumulated = '';
    const collectedTools: ToolCallRecord[] = [];

    try {
      const token = await getToken();
      await streamAssistantMessage({
        url: `${API_URL}/api/assistant/conversations/${id}/stream`,
        token: token ?? '',
        content: finalContent,
        onEvent: (event) => {
          if (event.type === 'thinking') return;

          if (event.type === 'user_message_id') {
            setMessages((prev) =>
              prev.map((m) => (m.id === userTmpId ? { ...m, id: event.userMessageId } : m)),
            );
            return;
          }

          if (event.type === 'tool_start') {
            setThinking(false);
            setActiveToolName(event.name);
            const tcRecord: ToolCallRecord = {
              id: event.toolCallId,
              name: event.name,
              args: event.args,
              result: {
                ok: true,
                display: {
                  title: `${labelTool(event.name)}…`,
                  icon: 'circle.dotted',
                  color: C.textDim,
                },
              },
            };
            collectedTools.push(tcRecord);
            setMessages((prev) =>
              prev.map((m) => (m.id === aiTmpId ? { ...m, toolCalls: [...collectedTools] } : m)),
            );
            return;
          }

          if (event.type === 'tool_end') {
            setActiveToolName(null);
            const idx = collectedTools.findIndex((t) => t.id === event.toolCallId);
            if (idx >= 0) {
              collectedTools[idx] = {
                ...collectedTools[idx]!,
                result: event.result as ToolCallRecord['result'],
              };
              setMessages((prev) =>
                prev.map((m) => (m.id === aiTmpId ? { ...m, toolCalls: [...collectedTools] } : m)),
              );
            }
            return;
          }

          if (event.type === 'text_delta') {
            setThinking(false);
            setActiveToolName(null);
            aiAccumulated += event.text;
            setMessages((prev) =>
              prev.map((m) => (m.id === aiTmpId ? { ...m, content: aiAccumulated } : m)),
            );
            return;
          }

          if (event.type === 'done') {
            aiAccumulated = event.finalText;
            return;
          }

          if (event.type === 'saved') {
            setMessages((prev) =>
              prev.map((m) => (m.id === aiTmpId ? { ...m, id: event.aiMessageId } : m)),
            );
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return;
          }

          if (event.type === 'memory_saved') {
            if (event.facts && event.facts.length > 0) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMemoryToast({ facts: event.facts, visible: true });
              setTimeout(() => setMemoryToast((t) => (t ? { ...t, visible: false } : null)), 4500);
            }
            return;
          }

          if (event.type === 'error') {
            console.error('[stream]', event.message);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setMessages((prev) => prev.filter((m) => m.id !== aiTmpId || !!m.content));
            return;
          }
        },
        onError: (e) => {
          console.error('[stream/network]', e);
          setMessages((prev) => prev.filter((m) => m.id !== aiTmpId));
        },
      });
    } catch (e) {
      console.error('[seans/send]', e);
      setMessages((prev) => prev.filter((m) => m.id !== userTmpId && m.id !== aiTmpId));
    } finally {
      setSending(false);
      setThinking(false);
      setActiveToolName(null);
    }
  };

  function labelTool(name: string): string {
    return (
      (
        {
          add_water: 'Su ekleniyor',
          remove_water_amount: 'Su düşülüyor',
          get_water_today: 'Su kontrol ediliyor',
          get_today_summary: 'Bugünün özeti',
          get_last_sleep: 'Son uyku',
          list_medications: 'İlaçlar listeleniyor',
          get_today_medications: 'Bugünkü ilaçlar',
          mark_med_taken: 'İlaç işaretleniyor',
          add_meal: 'Öğün ekleniyor',
          get_today_macros: 'Makrolar hesaplanıyor',
          log_activity: 'Aktivite kaydediliyor',
          log_mood: 'Mood kaydediliyor',
          add_person: 'Kişi kaydediliyor',
          add_life_event: 'Olay kaydediliyor',
          set_reminder: 'Hatırlatıcı kuruluyor',
          remember_fact: 'Hatırlanıyor',
          get_weather_today: 'Hava durumu',
          start_breath_exercise: 'Nefes egzersizi',
          start_meditation: 'Meditasyon',
          play_sleep_sound: 'Ses çalınıyor',
          measure_pulse: 'Nabız ölçümü',
          log_expense: 'Harcama kaydediliyor',
          log_income: 'Gelir kaydediliyor',
          add_task: 'Görev ekleniyor',
          start_focus_session: 'Odak başlatılıyor',
          log_weight: 'Kilo kaydediliyor',
          revise_belief: 'Güncelleniyor',
        } as Record<string, string>
      )[name] ?? name
    );
  }

  if (loading) {
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
              <View style={st.avatarSmall}>
                <Text style={st.avatarTxt}>{profileName[0]?.toUpperCase()}</Text>
              </View>
              <Text style={st.headerName}>{profileName}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
          <View style={[st.list, { flex: 1 }]}>
            <ChatSkeleton />
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={[st.root, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ChatBackground />
        {/* Header */}
        <View style={st.header}>
          <Pressable onPress={() => router.back()} hitSlop={14} style={st.backBtn}>
            <SymbolView
              name="chevron.left"
              size={20}
              tintColor={C.accent}
              fallback={<Text style={{ color: C.accent }}>‹</Text>}
            />
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/seans/profile');
            }}
            style={st.headerCenter}
          >
            <View style={st.avatarSmall}>
              <Text style={st.avatarTxt}>{profileName[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={st.headerName}>{profileName}</Text>
              <PresenceLine thinking={thinking} status={aiStatus} />
            </View>
          </Pressable>
          {onboardingActive ? (
            <Pressable
              onPress={async () => {
                Haptics.selectionAsync();
                Alert.alert(
                  'Tanışmayı atla',
                  'Şimdi sonra tanışırız. İstediğin zaman ayarlardan döneriz.',
                  [
                    { text: 'Vazgeç', style: 'cancel' },
                    {
                      text: 'Atla',
                      onPress: async () => {
                        try {
                          const tk = await getToken();
                          await fetch(`${API_URL}/api/assistant/profile`, {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${tk}`,
                            },
                            body: JSON.stringify({ skipOnboarding: true }),
                          });
                          setOnboardingActive(false);
                        } catch {}
                      },
                    },
                  ],
                );
              }}
              hitSlop={10}
              style={{ paddingHorizontal: 8 }}
            >
              <Text style={{ fontFamily: font.medium, fontSize: 13, color: C.textDim }}>Atla</Text>
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* Memory toast — yeni hafıza kaydedildi bildirimi */}
        {memoryToast && <MemoryToast facts={memoryToast.facts} visible={memoryToast.visible} />}

        {/* Mesaj listesi */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={[st.list, { paddingBottom: 16 }]}
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              previous={messages[index - 1]}
              getToken={getToken}
              onReply={(m) => {
                Haptics.selectionAsync();
                setReplyTo({
                  id: m.id,
                  role: m.role,
                  content: m.content.slice(0, 200),
                });
              }}
              onDelete={(mid) => {
                setMessages((prev) => prev.filter((m) => m.id !== mid));
              }}
            />
          )}
          ListHeaderComponent={
            !loading && messages.length === 0 && !thinking ? (
              <ConversationStarters
                profileName={profileName}
                onSelect={(text) => {
                  setInput(text);
                }}
              />
            ) : null
          }
          ListFooterComponent={
            thinking && !messages.some((m) => m.id.startsWith('tmp-ai-') && m.content) ? (
              <TypingIndicator toolName={activeToolName} />
            ) : null
          }
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
            const distanceFromBottom =
              contentSize.height - (contentOffset.y + layoutMeasurement.height);
            stickToBottomRef.current = distanceFromBottom < 60;
          }}
          onScrollBeginDrag={() => {
            stickToBottomRef.current = false;
          }}
          onContentSizeChange={() => {
            if (stickToBottomRef.current) {
              listRef.current?.scrollToEnd({ animated: false });
            }
          }}
          scrollEventThrottle={32}
        />

        {/* Reply preview — yanıt verilen mesaj */}
        {replyTo && (
          <View style={replyPreviewSt.wrap}>
            <View style={replyPreviewSt.bar} />
            <View style={{ flex: 1 }}>
              <Text style={replyPreviewSt.label}>
                {replyTo.role === 'user' ? 'Sen' : profileName}
              </Text>
              <Text style={replyPreviewSt.content} numberOfLines={1}>
                {replyTo.content}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setReplyTo(null);
              }}
              hitSlop={10}
              style={replyPreviewSt.closeBtn}
            >
              <SymbolView
                name="xmark"
                size={12}
                tintColor={C.textMuted}
                fallback={<Text style={{ color: C.textMuted }}>×</Text>}
              />
            </Pressable>
          </View>
        )}

        {/* Input */}
        <View style={[st.inputWrap, { paddingBottom: insets.bottom + 8 }]}>
          {isRecording ? (
            <RecordingBar seconds={recordSecs} onStop={stopRecording} onCancel={cancelRecording} />
          ) : (
            <View style={st.inputBubble}>
              {/* Eklenti seç (+ butonu) */}
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  showAttachmentMenu();
                }}
                disabled={sending || transcribing || uploadingAttachment}
                style={st.plusBtn}
              >
                {uploadingAttachment ? (
                  <ActivityIndicator size="small" color={C.accent} />
                ) : (
                  <SymbolView
                    name="plus"
                    size={18}
                    tintColor={C.accent}
                    fallback={<Text style={{ color: C.accent, fontSize: 16 }}>+</Text>}
                  />
                )}
              </Pressable>
              <TextInput
                style={st.input}
                value={transcribing ? '' : input}
                onChangeText={setInput}
                onSubmitEditing={send}
                placeholder={transcribing ? 'Transkript ediliyor...' : 'Mesaj yaz...'}
                placeholderTextColor={transcribing ? C.accent : C.textDim}
                multiline
                blurOnSubmit={false}
                submitBehavior="submit"
                returnKeyType="send"
                maxLength={2000}
                editable={!sending && !transcribing}
                onFocus={() => stickerPanelOpen && setStickerPanelOpen(false)}
              />
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setStickerPanelOpen((v) => !v);
                }}
                hitSlop={8}
                style={st.emojiBtn}
              >
                <SymbolView
                  name={stickerPanelOpen ? 'keyboard' : 'square.grid.2x2'}
                  size={20}
                  tintColor={stickerPanelOpen ? C.accent : C.textMuted}
                  fallback={
                    <Text
                      style={{ color: stickerPanelOpen ? C.accent : C.textMuted, fontSize: 18 }}
                    >
                      {stickerPanelOpen ? '⌨' : '◫'}
                    </Text>
                  }
                />
              </Pressable>
              {!input.trim() && !transcribing ? (
                <Pressable
                  onPress={startRecording}
                  disabled={sending}
                  style={[st.sendBtn, { backgroundColor: C.surface }]}
                >
                  <SymbolView
                    name="mic.fill"
                    size={16}
                    tintColor={C.accent}
                    fallback={<Text style={{ color: C.accent, fontSize: 14 }}>🎤</Text>}
                  />
                </Pressable>
              ) : (
                <Pressable
                  onPress={send}
                  disabled={!input.trim() || sending || transcribing}
                  style={[
                    st.sendBtn,
                    { backgroundColor: input.trim() && !sending ? C.accent : '#D1D1D6' },
                  ]}
                >
                  <SymbolView
                    name="arrow.up"
                    size={16}
                    tintColor="#fff"
                    fallback={<Text style={{ color: '#fff', fontSize: 14 }}>↑</Text>}
                  />
                </Pressable>
              )}
            </View>
          )}
          <StickerGifPanel
            visible={stickerPanelOpen}
            apiUrl={API_URL}
            getToken={getToken}
            onClose={() => setStickerPanelOpen(false)}
            onPickSticker={handlePickSticker}
            onPickEmoji={handlePickEmoji}
            hideEmojiTab
          />
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  previous,
  getToken,
  onReply,
  onDelete,
}: {
  message: Message;
  previous?: Message;
  getToken: () => Promise<string | null>;
  onReply?: (m: Message) => void;
  onDelete?: (messageId: string) => void;
}) {
  const router = useRouter();
  const isUser = message.role === 'user';
  const showSpacing = previous && previous.role !== message.role;
  const visibleTools = (message.toolCalls ?? []).filter((tc) => tc.result?.display);
  const isStreaming = !isUser && message.id.startsWith('tmp-ai-');

  // Entrance animasyonu
  const translateY = useRef(new Animated.Value(8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // V3 Faz B — Sağa swipe yanıtla (sadece tmp olmayan mesajlarda)
  const swipeX = useRef(new Animated.Value(0)).current;
  const SWIPE_THRESHOLD = 56;
  const replyTriggeredRef = useRef(false);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_evt, gs) => {
          // Sadece yatay sağa swipe (vertical scroll'u blokla)
          return (
            !!onReply &&
            !message.id.startsWith('tmp-') &&
            Math.abs(gs.dx) > 8 &&
            Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5 &&
            gs.dx > 0
          );
        },
        onPanResponderMove: (_e, gs) => {
          if (gs.dx > 0) {
            // Hafif dirençli movement (resistance)
            const resisted = Math.min(gs.dx * 0.6, 80);
            swipeX.setValue(resisted);
            if (!replyTriggeredRef.current && gs.dx >= SWIPE_THRESHOLD) {
              replyTriggeredRef.current = true;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }
        },
        onPanResponderRelease: (_e, gs) => {
          if (gs.dx >= SWIPE_THRESHOLD && onReply) {
            onReply(message);
          }
          replyTriggeredRef.current = false;
          Animated.spring(swipeX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 7,
            tension: 80,
          }).start();
        },
        onPanResponderTerminate: () => {
          replyTriggeredRef.current = false;
          Animated.spring(swipeX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 7,
            tension: 80,
          }).start();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [message.id, onReply],
  );
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
    // sadece mount'ta çalışsın
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateCalendarEvent = async (data: {
    title?: string;
    startISO?: string;
    endISO?: string;
    notes?: string;
    location?: string;
    alarmMinutes?: number;
  }) => {
    if (!data.title || !data.startISO || !data.endISO) return;
    Alert.alert(
      'Takvime ekle',
      `${data.title}\n${new Date(data.startISO).toLocaleString('tr-TR')}`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Ekle',
          onPress: async () => {
            const granted = await requestCalendarAuth();
            if (!granted) {
              Alert.alert('İzin gerekli', 'Takvim izni verilmedi.');
              return;
            }
            const eid = await createEvent({
              title: data.title!,
              startDate: new Date(data.startISO!),
              endDate: new Date(data.endISO!),
              notes: data.notes,
              location: data.location,
              alarmMinutes: data.alarmMinutes,
            });
            if (eid) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  };

  const handleCreateReminder = async (data: {
    title?: string;
    dueISO?: string;
    notes?: string;
  }) => {
    if (!data.title) return;
    Alert.alert('Görev ekle', data.title, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Ekle',
        onPress: async () => {
          const granted = await requestRemindersAuth();
          if (!granted) {
            Alert.alert('İzin gerekli', 'Reminders izni verilmedi.');
            return;
          }
          const rid = await createReminder({
            title: data.title!,
            notes: data.notes,
            dueDate: data.dueISO ? new Date(data.dueISO) : undefined,
          });
          if (rid) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleUpdateCalendarEvent = async (data: Record<string, unknown>) => {
    const eventId = data.eventId as string | undefined;
    if (!eventId) return;
    Alert.alert('Etkinliği güncelle', (data.title as string) ?? 'Onayla', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Güncelle',
        onPress: async () => {
          const ok = await updateEvent(eventId, {
            title: data.title as string | undefined,
            startDate: data.startISO ? new Date(data.startISO as string) : undefined,
            endDate: data.endISO ? new Date(data.endISO as string) : undefined,
            notes: data.notes as string | undefined,
            location: data.location as string | undefined,
          });
          if (ok) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleDeleteCalendarEvent = async (data: { eventId?: string }) => {
    if (!data.eventId) return;
    Alert.alert('Etkinliği sil', 'Geri alınamaz', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const ok = await deleteEvent(data.eventId!);
          if (ok) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleCompleteReminder = async (data: { reminderId?: string }) => {
    if (!data.reminderId) return;
    const ok = await completeReminder(data.reminderId);
    if (ok) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleUpdateReminder = async (data: Record<string, unknown>) => {
    const reminderId = data.reminderId as string | undefined;
    if (!reminderId) return;
    Alert.alert('Görevi güncelle', (data.title as string) ?? 'Onayla', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Güncelle',
        onPress: async () => {
          const ok = await updateReminder(reminderId, {
            title: data.title as string | undefined,
            notes: data.notes as string | undefined,
            dueDate: data.dueISO ? new Date(data.dueISO as string) : undefined,
          });
          if (ok) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleDeleteReminder = async (data: { reminderId?: string }) => {
    if (!data.reminderId) return;
    Alert.alert('Görevi sil', 'Geri alınamaz', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const ok = await deleteReminder(data.reminderId!);
          if (ok) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const navigateTool = (call: ToolCallRecord) => {
    const nav = call.result?.data?.navigate;
    if (!nav) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const data = call.result.data ?? {};
    if (nav === 'breath') router.push('/(app)/tracking/uyku/araclar/nefes');
    else if (nav === 'meditation') router.push('/(app)/tracking/uyku/araclar/meditasyon');
    else if (nav === 'sounds') router.push('/(app)/tracking/uyku/araclar/sesler');
    else if (nav === 'pulse') router.push('/(app)/tracking/uyku/araclar/nabiz');
    else if (nav === 'dream') router.push('/(app)/tracking/uyku/araclar/ruya');
    else if (nav === 'sleep_start') router.push('/(app)/tracking/uyku/baslat');
    else if (nav === 'emergency_call') {
      const url = (data as { dialerUrl?: string })?.dialerUrl;
      if (url) Linking.openURL(url).catch(() => {});
    } else if (nav === 'create_calendar_event')
      handleCreateCalendarEvent(data as Parameters<typeof handleCreateCalendarEvent>[0]);
    else if (nav === 'create_reminder')
      handleCreateReminder(data as Parameters<typeof handleCreateReminder>[0]);
    else if (nav === 'find_and_call_contact') handleFindAndCallContact(data as { name?: string });
    else if (nav === 'update_calendar_event')
      handleUpdateCalendarEvent(data as Record<string, unknown>);
    else if (nav === 'delete_calendar_event')
      handleDeleteCalendarEvent(data as { eventId?: string });
    else if (nav === 'complete_reminder') handleCompleteReminder(data as { reminderId?: string });
    else if (nav === 'update_reminder') handleUpdateReminder(data as Record<string, unknown>);
    else if (nav === 'delete_reminder') handleDeleteReminder(data as { reminderId?: string });
    void data;
  };

  const handleFindAndCallContact = async (data: { name?: string }) => {
    if (!data.name) return;
    const granted = await requestContactsAuth();
    if (!granted) {
      Alert.alert('İzin gerekli', 'Rehber izni verilmedi.');
      return;
    }
    const results = await searchContacts(data.name, 5);
    if (results.length === 0) {
      Alert.alert('Bulunamadı', `Rehberde "${data.name}" bulunamadı.`);
      return;
    }
    const contact = results[0]!;
    const phone = contact.phoneNumbers[0];
    if (!phone) {
      Alert.alert(contact.name ?? '', 'Bu kişinin telefonu kayıtlı değil.');
      return;
    }
    Alert.alert(`${contact.name}'i ara`, phone, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Ara', onPress: () => Linking.openURL(`tel:${phone}`).catch(() => {}) },
    ]);
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        bubbleSt.row,
        { marginTop: showSpacing ? 12 : 3 },
        { transform: [{ translateY }, { translateX: swipeX }], opacity },
      ]}
    >
      {/* Sağa swipe ipucu — sol kenarda yanıt ikonu */}
      {!message.id.startsWith('tmp-') && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: -36,
            top: 0,
            bottom: 0,
            justifyContent: 'center',
            opacity: swipeX.interpolate({
              inputRange: [0, 30, 80],
              outputRange: [0, 0.4, 1],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                scale: swipeX.interpolate({
                  inputRange: [0, 56, 80],
                  outputRange: [0.6, 1, 1.1],
                  extrapolate: 'clamp',
                }),
              },
            ],
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: C.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SymbolView
              name="arrowshape.turn.up.left.fill"
              size={14}
              tintColor="#fff"
              fallback={<Text style={{ color: '#fff', fontSize: 12 }}>↩</Text>}
            />
          </View>
        </Animated.View>
      )}
      {/* AI mesajı — Flow modeli */}
      {!isUser && (
        <View style={bubbleSt.aiOuter}>
          {/* Sol çizgi + içerik */}
          <View style={bubbleSt.aiFlow}>
            <View style={bubbleSt.aiLine} />
            <View style={{ flex: 1, gap: 6 }}>
              {/* Tool kartları */}
              {visibleTools.length > 0 && (
                <View style={{ gap: 5 }}>
                  {visibleTools.map((tc, i) => (
                    <ToolCard key={i} call={tc} onPress={() => navigateTool(tc)} />
                  ))}
                </View>
              )}
              {/* Mesaj metni — WhatsApp tarzı uzun bas context menu */}
              {!!message.content && (
                <ContextMenu
                  actions={
                    message.id.startsWith('tmp-')
                      ? [{ title: 'Kopyala', systemIcon: 'doc.on.doc' }]
                      : [
                          { title: 'Yanıtla', systemIcon: 'arrowshape.turn.up.left' },
                          { title: 'Kopyala', systemIcon: 'doc.on.doc' },
                          {
                            title: message.isPinned ? 'Yıldızı Kaldır' : 'Yıldızla',
                            systemIcon: message.isPinned ? 'star.slash' : 'star',
                          },
                          { title: 'İlet', systemIcon: 'square.and.arrow.up' },
                          { title: 'Sil', systemIcon: 'trash', destructive: true },
                        ]
                  }
                  onPress={async (e) => {
                    const idx = e.nativeEvent.index;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (message.id.startsWith('tmp-')) {
                      if (idx === 0) {
                        await Clipboard.setStringAsync(message.content);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }
                      return;
                    }
                    if (idx === 0) {
                      onReply?.(message);
                    } else if (idx === 1) {
                      await Clipboard.setStringAsync(message.content);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    } else if (idx === 2) {
                      try {
                        const tk = await getToken();
                        await fetch(`${API_URL}/api/assistant/messages/${message.id}/star`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${tk}`,
                          },
                          body: JSON.stringify({ starred: !message.isPinned }),
                        });
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      } catch {}
                    } else if (idx === 3) {
                      // İlet — iOS share sheet
                      try {
                        const Sharing = await import('expo-sharing');
                        const isAvailable = await Sharing.isAvailableAsync();
                        if (isAvailable) {
                          // expo-sharing dosya bekliyor; metin için Share API kullan
                          const { Share } = await import('react-native');
                          await Share.share({ message: message.content });
                        } else {
                          const { Share } = await import('react-native');
                          await Share.share({ message: message.content });
                        }
                      } catch {}
                    } else if (idx === 4) {
                      // Sil
                      try {
                        const tk = await getToken();
                        await fetch(`${API_URL}/api/assistant/messages/${message.id}`, {
                          method: 'DELETE',
                          headers: { Authorization: `Bearer ${tk}` },
                        });
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        onDelete?.(message.id);
                      } catch {}
                    }
                  }}
                >
                  <View style={bubbleSt.aiTextWrap}>
                    <Text style={bubbleSt.aiText}>
                      {message.content}
                      {isStreaming && <StreamingCaret />}
                    </Text>
                    {message.isPinned && (
                      <SymbolView
                        name="pin.fill"
                        size={10}
                        tintColor={C.textDim}
                        fallback={<Text>📌</Text>}
                        style={{ position: 'absolute', top: 2, right: 0 }}
                      />
                    )}
                  </View>
                </ContextMenu>
              )}
            </View>
          </View>
        </View>
      )}

      {/* User mesajı — Bubble */}
      {isUser &&
        (() => {
          const stickerOnly =
            !!message.attachments?.length &&
            message.attachments.every((a) => a.kind === 'sticker' || a.kind === 'gif') &&
            (message.content === '[Sticker]' ||
              message.content === '[GIF]' ||
              !message.content.trim());
          return (
            <View style={bubbleSt.userOuter}>
              {/* Attachment thumbnails (image/video/document/sticker/gif) */}
              {message.attachments && message.attachments.length > 0 && (
                <View style={bubbleSt.attachmentRow}>
                  {message.attachments.map((att, i) => (
                    <AttachmentPreview key={i} attachment={att} />
                  ))}
                </View>
              )}
              {!stickerOnly && (
                <ContextMenu
                  actions={
                    message.id.startsWith('tmp-')
                      ? [{ title: 'Kopyala', systemIcon: 'doc.on.doc' }]
                      : [
                          { title: 'Yanıtla', systemIcon: 'arrowshape.turn.up.left' },
                          { title: 'Kopyala', systemIcon: 'doc.on.doc' },
                          {
                            title: message.isPinned ? 'Yıldızı Kaldır' : 'Yıldızla',
                            systemIcon: message.isPinned ? 'star.slash' : 'star',
                          },
                          { title: 'İlet', systemIcon: 'square.and.arrow.up' },
                          { title: 'Sil', systemIcon: 'trash', destructive: true },
                        ]
                  }
                  onPress={async (e) => {
                    const idx = e.nativeEvent.index;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (message.id.startsWith('tmp-')) {
                      if (idx === 0) {
                        await Clipboard.setStringAsync(message.content);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }
                      return;
                    }
                    if (idx === 0) {
                      onReply?.(message);
                    } else if (idx === 1) {
                      await Clipboard.setStringAsync(message.content);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    } else if (idx === 2) {
                      try {
                        const tk = await getToken();
                        await fetch(`${API_URL}/api/assistant/messages/${message.id}/star`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${tk}`,
                          },
                          body: JSON.stringify({ starred: !message.isPinned }),
                        });
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      } catch {}
                    } else if (idx === 3) {
                      try {
                        const { Share } = await import('react-native');
                        await Share.share({ message: message.content });
                      } catch {}
                    } else if (idx === 4) {
                      try {
                        const tk = await getToken();
                        await fetch(`${API_URL}/api/assistant/messages/${message.id}`, {
                          method: 'DELETE',
                          headers: { Authorization: `Bearer ${tk}` },
                        });
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        onDelete?.(message.id);
                      } catch {}
                    }
                  }}
                >
                  <View style={[bubbleSt.userBubble, message.isPinned && bubbleSt.pinnedUser]}>
                    <Text style={bubbleSt.userText}>{message.content}</Text>
                    {message.isPinned && (
                      <SymbolView
                        name="pin.fill"
                        size={10}
                        tintColor="rgba(255,255,255,0.7)"
                        fallback={<Text>📌</Text>}
                        style={{ position: 'absolute', top: 4, right: 6 }}
                      />
                    )}
                  </View>
                </ContextMenu>
              )}
            </View>
          );
        })()}
    </Animated.View>
  );
}

// ─── StreamingCaret ───────────────────────────────────────────────────────────

// ─── AttachmentPreview ────────────────────────────────────────────────────────

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  const handlePress = async () => {
    if (attachment.url) {
      Haptics.selectionAsync();
      try {
        await Linking.openURL(attachment.url);
      } catch {}
    }
  };

  if (attachment.kind === 'sticker' || attachment.kind === 'gif') {
    const aspect = attachment.width && attachment.height ? attachment.width / attachment.height : 1;
    const w = attachment.kind === 'sticker' ? 140 : 200;
    const h = w / Math.max(0.4, Math.min(2.5, aspect));
    return (
      <View
        style={{
          width: w,
          height: h,
          borderRadius: 14,
          overflow: 'hidden',
          backgroundColor: 'transparent',
        }}
      >
        <Animated.Image
          source={{ uri: attachment.url }}
          style={{ width: '100%', height: '100%' }}
          resizeMode={attachment.kind === 'sticker' ? 'contain' : 'cover'}
        />
      </View>
    );
  }
  if (attachment.kind === 'image') {
    return (
      <Pressable onPress={handlePress} style={attSt.imageWrap}>
        <Animated.Image source={{ uri: attachment.url }} style={attSt.image} resizeMode="cover" />
      </Pressable>
    );
  }
  if (attachment.kind === 'video') {
    return (
      <Pressable onPress={handlePress} style={attSt.videoWrap}>
        <View style={attSt.videoOverlay}>
          <SymbolView
            name="play.circle.fill"
            size={36}
            tintColor="#FFF"
            fallback={<Text style={{ color: '#FFF', fontSize: 30 }}>▶</Text>}
          />
        </View>
        <Text style={attSt.videoLabel} numberOfLines={1}>
          {attachment.filename ?? 'Video'}
        </Text>
      </Pressable>
    );
  }
  // Document
  return (
    <Pressable onPress={handlePress} style={attSt.docWrap}>
      <View style={attSt.docIcon}>
        <SymbolView
          name="doc.fill"
          size={20}
          tintColor={C.accent}
          fallback={<Text style={{ color: C.accent }}>📄</Text>}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={attSt.docName} numberOfLines={1}>
          {attachment.filename ?? 'Belge'}
        </Text>
        {attachment.size && <Text style={attSt.docSize}>{formatBytes(attachment.size)}</Text>}
      </View>
    </Pressable>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const attSt = StyleSheet.create({
  imageWrap: {
    width: 200,
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: C.surface,
    marginBottom: 6,
  },
  image: { width: '100%', height: '100%' },
  videoWrap: {
    width: 220,
    height: 140,
    borderRadius: 14,
    backgroundColor: '#000',
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoOverlay: {
    position: 'absolute',
    inset: 0 as unknown as number,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLabel: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
    color: '#FFF',
    fontFamily: 'System',
    fontSize: 11,
  },
  docWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    minWidth: 200,
    maxWidth: 280,
    marginBottom: 6,
  },
  docIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: { fontFamily: 'System', fontSize: 14, color: C.text },
  docSize: { fontFamily: 'System', fontSize: 11, color: C.textMuted, marginTop: 2 },
});

// V3 Faz B — header presence indicator
function PresenceLine({
  thinking,
  status,
}: {
  thinking: boolean;
  status: { status: AIStatus; label: string } | null;
}) {
  if (thinking) {
    return (
      <View style={presenceSt.row}>
        <PresenceTypingDots />
        <Text style={[presenceSt.label, { color: C.accent }]}>yazıyor</Text>
      </View>
    );
  }
  if (!status) return null;
  const color =
    status.status === 'online'
      ? C.success
      : status.status === 'sleeping' || status.status === 'dozing'
        ? C.textMuted
        : status.status === 'blocked' || status.status === 'silent'
          ? C.danger
          : C.textMuted;
  return (
    <View style={presenceSt.row}>
      <View style={[presenceSt.dot, { backgroundColor: color }]} />
      <Text style={[presenceSt.label, { color: C.textMuted }]}>{status.label}</Text>
    </View>
  );
}

function PresenceTypingDots() {
  const a1 = useRef(new Animated.Value(0.3)).current;
  const a2 = useRef(new Animated.Value(0.3)).current;
  const a3 = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const make = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.3, duration: 320, useNativeDriver: true }),
        ]),
      );
    const anims = [make(a1, 0), make(a2, 160), make(a3, 320)];
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [a1, a2, a3]);
  return (
    <View style={{ flexDirection: 'row', gap: 2, marginRight: 4 }}>
      {[a1, a2, a3].map((a, i) => (
        <Animated.View
          key={i}
          style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.accent, opacity: a }}
        />
      ))}
    </View>
  );
}

const presenceSt = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 1, gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontFamily: font.regular, fontSize: 10.5, letterSpacing: -0.1 },
});

function StreamingCaret() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.Text style={{ opacity, color: C.accent, fontWeight: '600' }}>{' ▍'}</Animated.Text>
  );
}

// ─── ToolCard ─────────────────────────────────────────────────────────────────

function ToolCard({ call, onPress }: { call: ToolCallRecord; onPress?: () => void }) {
  const display = call.result?.display;
  if (!display) return null;

  const isPending = display.icon === 'circle.dotted';
  const isError = !call.result.ok;
  const isNav = !!call.result?.data?.navigate;

  // Renk: hata → kırmızı, bekliyor → gri, başarı → yeşil
  const tint = isError ? C.danger : isPending ? C.textDim : (display.color ?? C.success);
  const bgTint = isError ? C.dangerBg : isPending ? C.surface : C.successBg;
  const checkIcon = isError
    ? 'xmark.circle.fill'
    : isPending
      ? 'circle.dotted'
      : 'checkmark.circle.fill';

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const Inner = (
    <View style={[toolSt.card, { backgroundColor: bgTint }]}>
      <SymbolView
        name={
          display.icon
            ? (display.icon as 'checkmark.circle.fill')
            : (checkIcon as 'checkmark.circle.fill')
        }
        size={15}
        tintColor={tint}
        fallback={
          <Text style={{ color: tint, fontSize: 13 }}>{isError ? '✗' : isPending ? '…' : '✓'}</Text>
        }
      />
      <View style={{ flex: 1 }}>
        <Text style={[toolSt.title, { color: isError ? C.danger : C.text }]} numberOfLines={1}>
          {display.title}
        </Text>
        {display.subtitle && (
          <Text style={toolSt.subtitle} numberOfLines={1}>
            {display.subtitle}
          </Text>
        )}
        {!isPending && !isError && (
          <Text style={toolSt.meta}>
            {timeStr}
            {display.undoable && <Text style={toolSt.undo}> · Geri al</Text>}
          </Text>
        )}
      </View>
      {isNav && (
        <SymbolView
          name="chevron.right"
          size={11}
          tintColor={C.textDim}
          fallback={<Text style={{ color: C.textDim }}>›</Text>}
        />
      )}
    </View>
  );

  if (isNav && onPress) return <Pressable onPress={onPress}>{Inner}</Pressable>;
  return Inner;
}

// ─── MemoryToast ──────────────────────────────────────────────────────────────

function MemoryToast({
  facts,
  visible,
}: {
  facts: Array<{ category: string; content: string }>;
  visible: boolean;
}) {
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: visible ? 0 : -60,
        duration: visible ? 380 : 320,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 380 : 320,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  }, [visible]);

  const first = facts[0];
  if (!first) return null;

  return (
    <Animated.View
      style={[memToastSt.wrap, { opacity, transform: [{ translateY }] }]}
      pointerEvents="none"
    >
      <View style={memToastSt.card}>
        <View style={memToastSt.iconWrap}>
          <SymbolView
            name="brain.head.profile"
            size={14}
            tintColor={C.accent}
            fallback={<Text style={{ color: C.accent, fontSize: 12 }}>🧠</Text>}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={memToastSt.title}>Hatırladım</Text>
          <Text style={memToastSt.body} numberOfLines={2}>
            {first.content}
            {facts.length > 1 ? ` · +${facts.length - 1} daha` : ''}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const memToastSt = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.card,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.accentSoft,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: C.accent,
    letterSpacing: 0.2,
  },
  body: {
    fontFamily: font.regular,
    fontSize: 13,
    color: C.text,
    marginTop: 1,
    letterSpacing: -0.1,
  },
});

// ─── RecordingBar ─────────────────────────────────────────────────────────────

const BAR_COUNT = 24;
const BAR_ANIMS = Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3));

function RecordingBar({
  seconds,
  onStop,
  onCancel,
}: {
  seconds: number;
  onStop: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const animations = BAR_ANIMS.map((bar, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 40),
          Animated.timing(bar, {
            toValue: 0.3 + (i % 5) * 0.15,
            duration: 300 + (i % 3) * 100,
            useNativeDriver: true,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
          }),
          Animated.timing(bar, {
            toValue: 0.15,
            duration: 280 + (i % 3) * 80,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 1, 1),
          }),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');

  return (
    <View style={recSt.wrap}>
      <Pressable onPress={onCancel} hitSlop={12} style={recSt.cancelBtn}>
        <SymbolView
          name="xmark"
          size={14}
          tintColor={C.textMuted}
          fallback={<Text style={{ color: C.textMuted }}>✕</Text>}
        />
      </Pressable>

      <View style={recSt.waveWrap}>
        {BAR_ANIMS.map((bar, i) => (
          <Animated.View
            key={i}
            style={[
              recSt.bar,
              {
                transform: [{ scaleY: bar }],
                backgroundColor: C.accent,
              },
            ]}
          />
        ))}
      </View>

      <Text style={recSt.timer}>
        {mins}:{secs}
      </Text>

      <Pressable onPress={onStop} style={recSt.stopBtn}>
        <SymbolView
          name="arrow.up"
          size={16}
          tintColor="#fff"
          fallback={<Text style={{ color: '#fff' }}>↑</Text>}
        />
      </Pressable>
    </View>
  );
}

const replyPreviewSt = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  bar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    backgroundColor: C.accent,
  },
  label: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: C.accent,
    letterSpacing: 0.2,
  },
  content: {
    fontFamily: font.regular,
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
  },
});

const recSt = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 48,
    gap: 8,
  },
  cancelBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 32,
    overflow: 'hidden',
  },
  bar: {
    width: 3,
    height: 20,
    borderRadius: 2,
  },
  timer: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: C.accent,
    minWidth: 36,
    textAlign: 'right',
  },
  stopBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── TypingIndicator ──────────────────────────────────────────────────────────

function TypingIndicator({ toolName }: { toolName?: string | null }) {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 380,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 1, 1),
          }),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={[bubbleSt.row, { marginTop: 12 }]}>
      <View style={bubbleSt.aiOuter}>
        <View style={bubbleSt.aiFlow}>
          <View style={bubbleSt.aiLine} />
          <View style={{ gap: 4 }}>
            {toolName && (
              <Text style={typingSt.toolLabel}>{toolName.replace(/_/g, ' ')} yapılıyor...</Text>
            )}
            <View style={typingSt.dotsRow}>
              {dots.map((dot, i) => (
                <Animated.View
                  key={i}
                  style={[
                    typingSt.dot,
                    {
                      opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
                      transform: [
                        {
                          translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }),
                        },
                      ],
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── ConversationStarters ─────────────────────────────────────────────────────

function getStarters(profileName: string): string[] {
  const hour = new Date().getHours();
  const day = new Date().getDay(); // 0=Pazar, 6=Cumartesi

  if (hour >= 6 && hour < 11) {
    return [
      'Bugün nasıl hissediyorsun?',
      'Nasıl uyudun?',
      'Bugün için planın ne?',
      'Kahvaltında ne yedin?',
    ];
  }
  if (hour >= 11 && hour < 14) {
    return [
      'Sabahın nasıl geçti?',
      'Öğle yemeğinde ne yiyeceksin?',
      'Bugün kaç adım attın?',
      'Bugün bir şey içtin mi?',
    ];
  }
  if (hour >= 14 && hour < 18) {
    return [
      'Öğleden sonra nasıl gidiyor?',
      'Bugün en çok ne düşündün?',
      'Akşam ne yapmayı planlıyorsun?',
      `${profileName}, bugün kendine iyi baktın mı?`,
    ];
  }
  if (hour >= 18 && hour < 22) {
    return [
      'Bugün nasıl geçti?',
      'Akşam yemeğinde ne yedin?',
      day === 5 || day === 6 ? 'Haftasonu planın var mı?' : 'Bu hafta nasıl gidiyor?',
      'Bugünün en güzel anı neydi?',
    ];
  }
  // Gece
  return [
    'Bugünü nasıl değerlendirirsin?',
    'Uyumadan önce aklında ne var?',
    'Yarın için bir hedefin var mı?',
    'Bu gece iyi uyuman için bir şey yapayım mı?',
  ];
}

function ConversationStarters({
  profileName,
  onSelect,
}: {
  profileName: string;
  onSelect: (text: string) => void;
}) {
  const starters = getStarters(profileName);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 380,
      useNativeDriver: true,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, paddingTop: 32, paddingBottom: 24, gap: 10 }}>
      <Text
        style={{
          fontFamily: font.semibold,
          fontSize: 13,
          color: C.textDim,
          textAlign: 'center',
          letterSpacing: 0.3,
          marginBottom: 6,
        }}
      >
        Nasıl başlamak istersin?
      </Text>
      {starters.map((text, i) => (
        <StarterChip key={i} text={text} delay={i * 60} onSelect={onSelect} />
      ))}
    </Animated.View>
  );
}

function StarterChip({
  text,
  delay,
  onSelect,
}: {
  text: string;
  delay: number;
  onSelect: (text: string) => void;
}) {
  const translateY = useRef(new Animated.Value(12)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 340,
        delay,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 340,
        delay,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onSelect(text);
        }}
        onPressIn={() => {
          Animated.timing(scale, { toValue: 0.97, duration: 100, useNativeDriver: true }).start();
        }}
        onPressOut={() => {
          Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }).start();
        }}
        style={{
          backgroundColor: C.card,
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 13,
          borderWidth: 1,
          borderColor: C.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            fontFamily: font.regular,
            fontSize: 15,
            color: C.text,
            flex: 1,
            letterSpacing: -0.2,
          }}
        >
          {text}
        </Text>
        <SymbolView
          name="arrow.up.circle.fill"
          size={20}
          tintColor={C.accent}
          fallback={<Text style={{ color: C.accent }}>↑</Text>}
        />
      </Pressable>
    </Animated.View>
  );
}

// ─── ChatSkeleton ─────────────────────────────────────────────────────────────

function ChatSkeleton() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const bubbles: Array<{ side: 'ai' | 'user'; w: number }> = [
    { side: 'ai', w: 220 },
    { side: 'user', w: 160 },
    { side: 'ai', w: 260 },
    { side: 'user', w: 120 },
  ];
  return (
    <View style={{ paddingTop: 20, gap: 10 }}>
      {bubbles.map((b, i) => (
        <View key={i} style={{ alignItems: b.side === 'user' ? 'flex-end' : 'flex-start' }}>
          <Animated.View
            style={{
              width: b.w,
              height: 38,
              borderRadius: 18,
              backgroundColor: b.side === 'user' ? C.accentSoft : '#E9E9EB',
              opacity,
            }}
          />
        </View>
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.page },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: 'rgba(248,247,255,0.92)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  avatarTxt: { fontFamily: font.bold, fontSize: 13, color: '#fff' },
  headerName: { fontFamily: font.semibold, fontSize: 11, color: C.textMuted, letterSpacing: -0.1 },
  list: { paddingHorizontal: 16, paddingTop: 14 },
  inputWrap: {
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: 'rgba(248,247,255,0.94)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  inputBubble: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 4,
    minHeight: 40,
  },
  input: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 16,
    color: C.text,
    lineHeight: 22,
    paddingTop: 6,
    paddingBottom: 6,
    maxHeight: 120,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    marginBottom: 2,
  },
  plusBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginBottom: 2,
  },
  emojiBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    marginBottom: 2,
  },
});

const bubbleSt = StyleSheet.create({
  row: { flexDirection: 'row' },

  // User
  userOuter: { flex: 1, alignItems: 'flex-end' },
  attachmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  userBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderBottomRightRadius: 6,
    backgroundColor: C.accent,
  },
  pinnedUser: { borderWidth: 1.5, borderColor: C.accentDark },
  userText: {
    fontFamily: font.regular,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: '#fff',
  },

  // AI — flow modeli (arka plan yok)
  aiOuter: { flex: 1, alignItems: 'flex-start' },
  aiFlow: {
    flexDirection: 'row',
    gap: 10,
    maxWidth: '88%',
  },
  aiLine: {
    width: 2,
    borderRadius: 1,
    backgroundColor: C.accent,
    opacity: 0.25,
    alignSelf: 'stretch',
    marginTop: 3,
  },
  aiTextWrap: { flex: 1 },
  aiText: {
    fontFamily: font.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.2,
    color: C.text,
  },
  pinnedAi: {},
});

const toolSt = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  title: { fontFamily: font.semibold, fontSize: 13, letterSpacing: -0.1 },
  subtitle: { fontFamily: font.regular, fontSize: 11, color: C.textMuted, marginTop: 1 },
  meta: { fontFamily: font.regular, fontSize: 11, color: C.textDim, marginTop: 2 },
  undo: { fontFamily: font.medium, fontSize: 11, color: C.accent },
});

const typingSt = StyleSheet.create({
  toolLabel: {
    fontFamily: font.regular,
    fontSize: 12,
    color: C.textDim,
    fontStyle: 'italic',
  },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.textMuted },
});

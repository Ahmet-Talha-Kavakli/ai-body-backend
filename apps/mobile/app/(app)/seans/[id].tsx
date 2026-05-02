import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
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
import { font, SLEEP, API_URL } from '../tracking/uyku/_components/theme';
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

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  createdAt: string;
  toolCalls?: ToolCallRecord[] | null;
  isPinned?: boolean;
}

export default function SeansChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [profileName, setProfileName] = useState('Asistan');
  const [onboardingActive, setOnboardingActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const listRef = useRef<FlatList<Message>>(null);
  // Otomatik scroll: kullanıcı yukarı kaydırırsa duraklat, en altta ise aktif
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
        setMessages(c.messages ?? []);
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

  // Sadece mesaj SAYISI değişince (yeni eklendi) animated scroll
  // Streaming sırasında token akışı zaten onContentSizeChange tarafından handle ediliyor
  useEffect(() => {
    if (messages.length) {
      setTimeout(() => scrollAt(true), 80);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;

    setInput('');
    Haptics.selectionAsync();

    // Yeni mesaj atılırken stick'i tekrar aktive et (kullanıcı net şekilde aşağı dönmek istiyor)
    stickToBottomRef.current = true;

    const userTmpId = `tmp-user-${Date.now()}`;
    const aiTmpId = `tmp-ai-${Date.now()}`;
    const optimisticUser: Message = {
      id: userTmpId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    // Boş AI mesajı — streaming buraya yazacak
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

    let aiAccumulated = '';
    const collectedTools: ToolCallRecord[] = [];

    try {
      const token = await getToken();
      await streamAssistantMessage({
        url: `${API_URL}/api/assistant/conversations/${id}/stream`,
        token: token ?? '',
        content,
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
            const tcRecord: ToolCallRecord = {
              id: event.toolCallId,
              name: event.name,
              args: event.args,
              result: {
                ok: true,
                display: {
                  title: `${labelTool(event.name)}…`,
                  icon: 'circle.dotted',
                  color: '#8E8E93',
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
                tintColor={SLEEP.accent}
                fallback={<Text style={{ color: SLEEP.accent }}>‹</Text>}
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
        <View style={st.header}>
          <Pressable onPress={() => router.back()} hitSlop={14} style={st.backBtn}>
            <SymbolView
              name="chevron.left"
              size={20}
              tintColor={SLEEP.accent}
              fallback={<Text style={{ color: SLEEP.accent }}>‹</Text>}
            />
          </Pressable>
          <View style={st.headerCenter}>
            <View style={st.avatarSmall}>
              <Text style={st.avatarTxt}>{profileName[0]?.toUpperCase()}</Text>
            </View>
            <Text style={st.headerName}>{profileName}</Text>
          </View>
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
              <Text style={{ fontFamily: font.medium, fontSize: 13, color: SLEEP.textDim }}>
                Atla
              </Text>
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m, i) => `${m.id}-${i}`}
          contentContainerStyle={[st.list, { paddingBottom: 16 }]}
          renderItem={({ item, index }) => (
            <MessageBubble message={item} previous={messages[index - 1]} />
          )}
          ListFooterComponent={
            // Sadece thinking aşamasında alt typing — AI streaming başlayınca caret zaten bubble'da görünür
            thinking && !messages.some((m) => m.id.startsWith('tmp-ai-') && m.content) ? (
              <TypingIndicator showThinking={true} />
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
            // Kullanıcı manuel scroll başlattı — şu anki pozisyonu korusun
            stickToBottomRef.current = false;
          }}
          onContentSizeChange={() => {
            // Sadece sticky modda kayır
            if (stickToBottomRef.current) {
              listRef.current?.scrollToEnd({ animated: false });
            }
          }}
          scrollEventThrottle={32}
        />

        <View style={[st.inputWrap, { paddingBottom: insets.bottom + 8 }]}>
          <View style={st.inputBubble}>
            <TextInput
              style={st.input}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={send}
              placeholder="Mesaj yaz..."
              placeholderTextColor={SLEEP.textDim}
              multiline
              blurOnSubmit={false}
              submitBehavior="submit"
              returnKeyType="send"
              maxLength={2000}
              editable={!sending}
            />
            <Pressable
              onPress={send}
              disabled={!input.trim() || sending}
              style={[
                st.sendBtn,
                { backgroundColor: input.trim() && !sending ? SLEEP.accent : '#D1D1D6' },
              ]}
            >
              <SymbolView
                name="arrow.up"
                size={16}
                tintColor="#fff"
                fallback={<Text style={{ color: '#fff', fontSize: 14 }}>↑</Text>}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

function MessageBubble({ message, previous }: { message: Message; previous?: Message }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const isUser = message.role === 'user';
  const showSpacing = previous && previous.role !== message.role;
  const visibleTools = (message.toolCalls ?? []).filter((tc) => tc.result?.display);
  const isStreaming = !isUser && message.id.startsWith('tmp-ai-');

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
            const id = await createEvent({
              title: data.title!,
              startDate: new Date(data.startISO!),
              endDate: new Date(data.endISO!),
              notes: data.notes,
              location: data.location,
              alarmMinutes: data.alarmMinutes,
            });
            if (id) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
          const id = await createReminder({
            title: data.title!,
            notes: data.notes,
            dueDate: data.dueISO ? new Date(data.dueISO) : undefined,
          });
          if (id) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  const navigateTool = (call: ToolCallRecord) => {
    const nav = call.result?.data?.navigate;
    if (!nav) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const data = call.result.data ?? {};
    if (nav === 'breath') {
      router.push('/(app)/tracking/uyku/araclar/nefes');
    } else if (nav === 'meditation') {
      router.push('/(app)/tracking/uyku/araclar/meditasyon');
    } else if (nav === 'sounds') {
      router.push('/(app)/tracking/uyku/araclar/sesler');
    } else if (nav === 'pulse') {
      router.push('/(app)/tracking/uyku/araclar/nabiz');
    } else if (nav === 'dream') {
      router.push('/(app)/tracking/uyku/araclar/ruya');
    } else if (nav === 'sleep_start') {
      router.push('/(app)/tracking/uyku/baslat');
    } else if (nav === 'emergency_call') {
      const url = (data as { dialerUrl?: string })?.dialerUrl;
      if (url) {
        Linking.openURL(url).catch((e) => {
          console.error('[emergency-call]', e);
        });
      }
    } else if (nav === 'create_calendar_event') {
      handleCreateCalendarEvent(
        data as {
          title?: string;
          startISO?: string;
          endISO?: string;
          notes?: string;
          location?: string;
          alarmMinutes?: number;
        },
      );
    } else if (nav === 'create_reminder') {
      handleCreateReminder(
        data as {
          title?: string;
          dueISO?: string;
          notes?: string;
        },
      );
    } else if (nav === 'find_and_call_contact') {
      handleFindAndCallContact(data as { name?: string });
    } else if (nav === 'update_calendar_event') {
      handleUpdateCalendarEvent(data as Record<string, unknown>);
    } else if (nav === 'delete_calendar_event') {
      handleDeleteCalendarEvent(data as { eventId?: string });
    } else if (nav === 'complete_reminder') {
      handleCompleteReminder(data as { reminderId?: string });
    } else if (nav === 'update_reminder') {
      handleUpdateReminder(data as Record<string, unknown>);
    } else if (nav === 'delete_reminder') {
      handleDeleteReminder(data as { reminderId?: string });
    }
    void data;
  };

  return (
    <View style={[bubbleSt.row, { marginTop: showSpacing ? 12 : 3 }]}>
      <View style={isUser ? bubbleSt.userOuter : bubbleSt.aiOuter}>
        {/* Tool kartları (varsa) */}
        {visibleTools.length > 0 && (
          <View style={{ gap: 6, marginBottom: message.content ? 8 : 0, alignSelf: 'stretch' }}>
            {visibleTools.map((tc, i) => (
              <ToolCard key={i} call={tc} onPress={() => navigateTool(tc)} />
            ))}
          </View>
        )}
        {/* Mesaj balonu (içerik varsa) */}
        {!!message.content && (
          <Pressable
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const buttons: Array<{
                text: string;
                onPress?: () => void;
                style?: 'cancel' | 'destructive';
              }> = [];
              buttons.push({
                text: 'Kopyala',
                onPress: async () => {
                  await Clipboard.setStringAsync(message.content);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                },
              });
              if (!isUser && !message.id.startsWith('tmp-')) {
                buttons.push({
                  text: message.isPinned ? 'Sabitlemeyi Kaldır' : 'Bunu Hatırla (Pinle)',
                  onPress: async () => {
                    try {
                      const tk = await getToken();
                      await fetch(`${API_URL}/api/assistant/messages/${message.id}/pin`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${tk}` },
                      });
                    } catch {}
                  },
                });
              }
              buttons.push({ text: 'Vazgeç', style: 'cancel' });
              Alert.alert('Mesaj', undefined, buttons);
            }}
            style={[
              bubbleSt.bubble,
              isUser ? bubbleSt.user : bubbleSt.ai,
              message.isPinned && bubbleSt.pinned,
            ]}
          >
            <Text style={[bubbleSt.text, isUser ? bubbleSt.userText : bubbleSt.aiText]}>
              {message.content}
              {isStreaming && <StreamingCaret />}
            </Text>
            {message.isPinned && (
              <SymbolView
                name="pin.fill"
                size={10}
                tintColor={isUser ? 'rgba(255,255,255,0.7)' : SLEEP.textDim}
                fallback={<Text>📌</Text>}
                style={{ position: 'absolute', top: 4, right: 6 }}
              />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

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
    <Animated.Text style={{ opacity, color: SLEEP.accent, fontWeight: '600' }}>
      {' ▍'}
    </Animated.Text>
  );
}

function ToolCard({ call, onPress }: { call: ToolCallRecord; onPress?: () => void }) {
  const display = call.result?.display;
  if (!display) return null;
  const tint = display.color ?? SLEEP.accent;
  const isNav = !!call.result?.data?.navigate;

  const Inner = (
    <View style={[toolSt.card, { borderLeftColor: tint }]}>
      <View style={[toolSt.iconWrap, { backgroundColor: tint + '20' }]}>
        {display.icon ? (
          <SymbolView
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name={display.icon as any}
            size={16}
            tintColor={tint}
            fallback={<Text style={{ color: tint }}>•</Text>}
          />
        ) : (
          <Text style={{ color: tint }}>✓</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={toolSt.title} numberOfLines={1}>
          {display.title}
        </Text>
        {display.subtitle && (
          <Text style={toolSt.subtitle} numberOfLines={1}>
            {display.subtitle}
          </Text>
        )}
      </View>
      {isNav && (
        <SymbolView
          name="chevron.right"
          size={12}
          tintColor={tint}
          fallback={<Text style={{ color: tint }}>›</Text>}
        />
      )}
    </View>
  );

  if (isNav && onPress) {
    return <Pressable onPress={onPress}>{Inner}</Pressable>;
  }
  return Inner;
}

function TypingIndicator({ showThinking }: { showThinking?: boolean }) {
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
        {showThinking && <Text style={typingSt.thinking}>Bir bakayım...</Text>}
        <View style={[bubbleSt.bubble, bubbleSt.ai, typingSt.bubble]}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[
                typingSt.dot,
                {
                  opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
                  transform: [
                    { translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

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

  // 3 bubble — solda AI, sağda user, solda AI — gerçek paterne yakın
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
              backgroundColor: b.side === 'user' ? SLEEP.accentSoft : '#E9E9EB',
              opacity,
            }}
          />
        </View>
      ))}
    </View>
  );
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
  headerCenter: { flex: 1, alignItems: 'center' },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: SLEEP.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  avatarTxt: { fontFamily: font.bold, fontSize: 13, color: '#fff' },
  headerName: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: SLEEP.textMuted,
    letterSpacing: -0.1,
  },
  list: { paddingHorizontal: 14, paddingTop: 14 },
  inputWrap: {
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: SLEEP.page,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SLEEP.border,
  },
  inputBubble: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: SLEEP.border,
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 4,
    minHeight: 40,
  },
  input: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 16,
    color: SLEEP.text,
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
});

const bubbleSt = StyleSheet.create({
  row: { flexDirection: 'row' },
  userOuter: { flex: 1, alignItems: 'flex-end' },
  aiOuter: { flex: 1, alignItems: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  user: { backgroundColor: SLEEP.accent, borderBottomRightRadius: 6 },
  ai: { backgroundColor: '#E9E9EB', borderBottomLeftRadius: 6 },
  pinned: { borderWidth: 1.5, borderColor: SLEEP.accent },
  text: { fontFamily: font.regular, fontSize: 16, lineHeight: 22, letterSpacing: -0.2 },
  userText: { color: '#fff' },
  aiText: { color: SLEEP.text },
});

const toolSt = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    minWidth: 200,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: font.semibold, fontSize: 13, color: SLEEP.text, letterSpacing: -0.1 },
  subtitle: { fontFamily: font.regular, fontSize: 11, color: SLEEP.textMuted, marginTop: 2 },
});

const typingSt = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: SLEEP.textMuted },
  thinking: {
    fontFamily: font.regular,
    fontSize: 12,
    color: SLEEP.textDim,
    fontStyle: 'italic',
    marginBottom: 6,
    marginLeft: 4,
  },
});

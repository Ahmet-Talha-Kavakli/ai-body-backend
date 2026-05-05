import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { Canvas, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { font, SLEEP, API_URL } from '../../(app)/tracking/uyku/_components/theme';
import { useSleepFonts } from '../../(app)/tracking/uyku/_components/useSleepFonts';
import {
  registerForPushNotificationsAsync,
  setupNotificationHandler,
  setupNotificationActionsListener,
} from '../../../src/services/pushNotifications';
import { runAllAssistantSyncs } from '../../../src/services/assistant/sync';
import * as Notifications from 'expo-notifications';

interface Profile {
  id: string;
  name: string;
  characterTestCompletedAt?: string | null;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  aiTypingUntil?: string | null;
  pinnedAt?: string | null;
  mutedUntil?: string | null;
  _count: { messages: number };
  messages: Array<{ content: string; role: string; createdAt: string }>;
}

export default function SessionsScreen() {
  const fontsLoaded = useSleepFonts();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  // Notification handler bir kere setup
  useEffect(() => {
    setupNotificationHandler();
  }, []);

  // Profil yüklendiyse push token kayıt et + native sync (HealthKit, Calendar, Reminders)
  useEffect(() => {
    if (!profile) return;
    registerForPushNotificationsAsync({ apiUrl: API_URL, getToken }).catch(() => {});
    runAllAssistantSyncs({ apiUrl: API_URL, getToken }).catch(() => {});
  }, [profile, getToken]);

  // Notification tıklanınca o sohbete git (sadece default tap)
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { conversationId?: string };
      // V3 Faz C — Action ID 'default' ise (banner'a tap), action varsa ayrı listener handle eder
      if (
        response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER &&
        data?.conversationId
      ) {
        router.push(`/seans/${data.conversationId}`);
      }
    });
    return () => sub.remove();
  }, [router]);

  // V3 Faz C — Bildirim aksiyon listener (Yanıtla / Sessize al)
  useEffect(() => {
    const sub = setupNotificationActionsListener({ apiUrl: API_URL, getToken });
    return () => sub.remove();
  }, [getToken]);

  const fetchAll = useCallback(async () => {
    try {
      const token = await getToken();
      const [profileRes, convsRes] = await Promise.all([
        fetch(`${API_URL}/api/assistant/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/assistant/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const profileData = await profileRes.json();
      const convsData = await convsRes.json();
      setProfile(profileData.profile ?? null);
      setConversations(convsData.conversations ?? []);

      // V3 Faz C — Karakter testi yapılmamışsa yönlendir
      // (profil yoksa da test bizim için profili oluşturuyor; ilk girişte de teste git)
      if (profileData.profile && !profileData.profile.characterTestCompletedAt) {
        router.replace('/seans/character-test' as never);
        return;
      }
      if (!profileData.profile) {
        // Profil hiç yoksa: test profili kuracak
        router.replace('/seans/character-test' as never);
        return;
      }
    } catch (e) {
      console.error('[sessions]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
      // V3 Faz B — typing indicator için 5s polling
      const t = setInterval(fetchAll, 5_000);
      return () => clearInterval(t);
    }, [fetchAll]),
  );

  // Sohbet long-press menü
  const handleConvLongPress = useCallback(
    (conv: Conversation) => {
      const isPinned = !!conv.pinnedAt;
      const isMuted = !!conv.mutedUntil && new Date(conv.mutedUntil).getTime() > Date.now();
      const patch = async (body: object) => {
        const tk = await getToken();
        await fetch(`${API_URL}/api/assistant/conversations/${conv.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
          body: JSON.stringify(body),
        });
        fetchAll();
      };
      Alert.alert(conv.title, undefined, [
        {
          text: isPinned ? 'Sabitlemeyi Kaldır' : 'Sabitle',
          onPress: async () => {
            Haptics.selectionAsync();
            await patch({ pinned: !isPinned }).catch(() => {});
          },
        },
        {
          text: isMuted ? 'Sessizden Çıkar' : 'Sessize Al',
          onPress: async () => {
            if (isMuted) {
              Haptics.selectionAsync();
              await patch({ mute: 'off' }).catch(() => {});
              return;
            }
            // Mute süre seçici
            Alert.alert('Sessize Al', 'Ne kadar süre?', [
              { text: '8 saat', onPress: () => patch({ mute: '8h' }).catch(() => {}) },
              { text: '1 gün', onPress: () => patch({ mute: '1d' }).catch(() => {}) },
              { text: '1 hafta', onPress: () => patch({ mute: '1w' }).catch(() => {}) },
              { text: 'Sonsuz', onPress: () => patch({ mute: 'forever' }).catch(() => {}) },
              { text: 'Vazgeç', style: 'cancel' },
            ]);
          },
        },
        {
          text: 'Yeniden Adlandır',
          onPress: () => {
            Alert.prompt(
              'Yeni başlık',
              undefined,
              async (text) => {
                if (!text?.trim()) return;
                await patch({ title: text.trim().slice(0, 80) }).catch(() => {});
              },
              'plain-text',
              conv.title,
            );
          },
        },
        {
          text: 'Arşivle',
          onPress: () => patch({ archived: true }).catch(() => {}),
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Sohbeti Sil', 'Bu sohbet ve tüm mesajları silinecek. Emin misin?', [
              { text: 'Vazgeç', style: 'cancel' },
              {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                  try {
                    const tk = await getToken();
                    await fetch(`${API_URL}/api/assistant/conversations/${conv.id}`, {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${tk}` },
                    });
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    fetchAll();
                  } catch {}
                },
              },
            ]);
          },
        },
        { text: 'Vazgeç', style: 'cancel' },
      ]);
    },
    [getToken, fetchAll],
  );

  const startNewChat = async () => {
    if (creating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCreating(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/assistant/conversations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const conv = await res.json();
      router.push(`/seans/${conv.id}`);
    } catch (e) {
      console.error('[sessions/new]', e);
    } finally {
      setCreating(false);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={[st.root, { paddingTop: insets.top + 8, paddingHorizontal: 18 }]}>
        <SessionsSkeleton />
      </View>
    );
  }

  // Profil yoksa onboarding'e yönlendir
  if (!profile) {
    return (
      <OnboardingView
        onComplete={(name, firstConversationId) => {
          setProfile({ id: 'temp', name });
          fetchAll();
          // V2 (Faz K): otomatik tanışma sohbetine yönlendir
          if (firstConversationId) {
            setTimeout(() => router.push(`/seans/${firstConversationId}`), 300);
          }
        }}
      />
    );
  }

  return (
    <ScrollView
      style={st.root}
      contentContainerStyle={[st.scroll, { paddingTop: insets.top + 8, paddingBottom: 120 }]}
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
      <View style={st.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={st.title}>Seans</Text>
          <Text style={st.sub}>{profile.name} ile konuş</Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.push('/seans/search');
          }}
          hitSlop={12}
          style={st.headerIconBtn}
        >
          <SymbolView
            name="magnifyingglass"
            size={20}
            tintColor={SLEEP.accent}
            fallback={<Text style={{ fontSize: 18 }}>🔍</Text>}
          />
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.push('/seans/memory');
          }}
          hitSlop={12}
          style={st.headerIconBtn}
        >
          <SymbolView
            name="brain"
            size={20}
            tintColor={SLEEP.accent}
            fallback={<Text style={{ fontSize: 18 }}>🧠</Text>}
          />
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.push('/seans/arsiv');
          }}
          hitSlop={12}
          style={st.headerIconBtn}
        >
          <SymbolView
            name="archivebox.fill"
            size={18}
            tintColor={SLEEP.accent}
            fallback={<Text style={{ fontSize: 16 }}>📦</Text>}
          />
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.push('/seans/settings');
          }}
          hitSlop={12}
          style={st.headerIconBtn}
        >
          <SymbolView
            name="gearshape.fill"
            size={20}
            tintColor={SLEEP.accent}
            fallback={<Text style={{ fontSize: 18 }}>⚙️</Text>}
          />
        </Pressable>
      </View>

      {/* Mode picker */}
      <View style={st.modesRow}>
        <ModeCard
          icon="bubble.left.and.bubble.right.fill"
          label="Metin"
          active
          onPress={startNewChat}
        />
        <ModeCard
          icon="waveform"
          label="Sesli"
          active
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            try {
              const token = await getToken();
              const res = await fetch(`${API_URL}/api/assistant/conversations`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
              });
              const conv = await res.json();
              router.push(`/seans/voice?id=${conv.id}`);
            } catch (e) {
              console.error('[sessions/voice]', e);
            }
          }}
        />
        <ModeCard icon="video.fill" label="Görüntülü" comingSoon />
      </View>

      {/* Sohbet listesi */}
      {conversations.length > 0 && (
        <>
          <View style={st.sectionHeaderRow}>
            <Text style={st.sectionLabel}>SOHBETLER</Text>
            <Text style={st.sectionCount}>{conversations.length}</Text>
          </View>

          {/* Search — 5+ sohbet varsa göster */}
          {conversations.length >= 5 && (
            <View style={st.searchWrap}>
              <SymbolView
                name="magnifyingglass"
                size={14}
                tintColor={SLEEP.textDim}
                fallback={<Text style={{ color: SLEEP.textDim }}>🔍</Text>}
              />
              <TextInput
                style={st.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Sohbette ara…"
                placeholderTextColor={SLEEP.textDim}
                autoCorrect={false}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <SymbolView
                    name="xmark.circle.fill"
                    size={14}
                    tintColor={SLEEP.textDim}
                    fallback={<Text style={{ color: SLEEP.textDim }}>×</Text>}
                  />
                </Pressable>
              )}
            </View>
          )}

          <View style={{ gap: 10, marginTop: 10 }}>
            {conversations
              .filter((c) => {
                if (!search.trim()) return true;
                const q = search.trim().toLowerCase();
                if (c.title.toLowerCase().includes(q)) return true;
                const last = c.messages[0]?.content ?? '';
                return last.toLowerCase().includes(q);
              })
              // V3 Faz B — Sabitlenmiş sohbetler en üstte
              .sort((a, b) => {
                const aPin = a.pinnedAt ? 1 : 0;
                const bPin = b.pinnedAt ? 1 : 0;
                if (aPin !== bPin) return bPin - aPin;
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
              })
              .map((c) => (
                <ConversationCard
                  key={c.id}
                  conv={c}
                  profileName={profile.name}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/seans/${c.id}`);
                  }}
                  onLongPress={() => handleConvLongPress(c)}
                />
              ))}
            {/* Boş arama sonucu */}
            {search.trim() &&
              conversations.filter((c) => {
                const q = search.trim().toLowerCase();
                const last = c.messages[0]?.content ?? '';
                return c.title.toLowerCase().includes(q) || last.toLowerCase().includes(q);
              }).length === 0 && (
                <View style={searchEmptySt.wrap}>
                  <Text style={searchEmptySt.txt}>"{search.trim()}" eşleşmiyor</Text>
                </View>
              )}
          </View>
        </>
      )}

      {conversations.length === 0 && (
        <EmptyHero
          profileName={profile.name}
          onStart={startNewChat}
          loading={creating}
          onSelectStarter={async (text) => {
            if (creating) return;
            setCreating(true);
            try {
              const token = await getToken();
              const res = await fetch(`${API_URL}/api/assistant/conversations`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
              });
              const conv = await res.json();
              router.push(`/seans/${conv.id}?starter=${encodeURIComponent(text)}`);
            } catch (e) {
              console.error('[sessions/starter]', e);
            } finally {
              setCreating(false);
            }
          }}
        />
      )}
    </ScrollView>
  );
}

// ─── Mode Card
function ModeCard({
  icon,
  label,
  active,
  comingSoon,
  onPress,
}: {
  icon: string;
  label: string;
  active?: boolean;
  comingSoon?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[modeSt.wrap, comingSoon && { opacity: 0.45 }]}
    >
      <View style={[modeSt.iconWrap, active && { backgroundColor: SLEEP.accentSoft }]}>
        <SymbolView
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name={icon as any}
          size={22}
          tintColor={active ? SLEEP.accent : SLEEP.textMuted}
          fallback={<Text>•</Text>}
        />
      </View>
      <Text style={[modeSt.label, active && { color: SLEEP.text }]}>{label}</Text>
      {comingSoon && <Text style={modeSt.badge}>Yakında</Text>}
    </Pressable>
  );
}

// ─── Conversation Card
function ConversationCard({
  conv,
  profileName,
  onPress,
  onLongPress,
}: {
  conv: Conversation;
  profileName: string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const last = conv.messages[0];
  const lastPreview = last?.content.slice(0, 70) ?? '';
  const date = new Date(conv.updatedAt);
  const typing = conv.aiTypingUntil && new Date(conv.aiTypingUntil).getTime() > Date.now();
  const isPinned = !!conv.pinnedAt;
  const isMuted = !!conv.mutedUntil && new Date(conv.mutedUntil).getTime() > Date.now();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress();
      }}
      style={cardSt.wrap}
    >
      <View style={cardSt.avatar}>
        <Text style={cardSt.avatarTxt}>{profileName[0]?.toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={cardSt.headerRow}>
          <Text style={cardSt.title} numberOfLines={1}>
            {conv.title}
          </Text>
          {isMuted && (
            <SymbolView
              name="bell.slash.fill"
              size={11}
              tintColor={SLEEP.textDim}
              fallback={<Text style={{ color: SLEEP.textDim, fontSize: 11 }}>🔕</Text>}
              style={{ marginLeft: 4 }}
            />
          )}
          {isPinned && (
            <SymbolView
              name="pin.fill"
              size={11}
              tintColor={SLEEP.accent}
              fallback={<Text style={{ color: SLEEP.accent, fontSize: 11 }}>📌</Text>}
              style={{ marginLeft: 4 }}
            />
          )}
          <Text style={cardSt.time}>{formatRelativeDate(date)}</Text>
        </View>
        {typing ? (
          <Text
            style={[cardSt.preview, { color: '#5E5CE6', fontFamily: font.medium }]}
            numberOfLines={1}
          >
            yazıyor...
          </Text>
        ) : (
          <Text style={cardSt.preview} numberOfLines={1}>
            {lastPreview}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// ─── Empty Hero
function EmptyHero({
  profileName,
  onStart,
  loading,
  onSelectStarter,
}: {
  profileName: string;
  onStart: () => void;
  loading: boolean;
  onSelectStarter: (text: string) => void;
}) {
  const starters = getEmptyStarters(profileName);

  // V3 Faz B — açılış sahnesi animasyonu (stagger)
  const avatarScale = useRef(new Animated.Value(0.85)).current;
  const avatarOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(8)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const subY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const ease = Easing.bezier(0.16, 1, 0.3, 1);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(avatarOpacity, {
          toValue: 1,
          duration: 480,
          easing: ease,
          useNativeDriver: true,
        }),
        Animated.timing(avatarScale, {
          toValue: 1,
          duration: 480,
          easing: ease,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 360,
          easing: ease,
          useNativeDriver: true,
        }),
        Animated.timing(titleY, { toValue: 0, duration: 360, easing: ease, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(subOpacity, {
          toValue: 1,
          duration: 360,
          easing: ease,
          useNativeDriver: true,
        }),
        Animated.timing(subY, { toValue: 0, duration: 360, easing: ease, useNativeDriver: true }),
      ]),
    ]).start();
  }, [avatarScale, avatarOpacity, titleOpacity, titleY, subOpacity, subY]);

  return (
    <View style={emptySt.wrap}>
      <Animated.View
        style={[emptySt.avatar, { opacity: avatarOpacity, transform: [{ scale: avatarScale }] }]}
      >
        <Text style={emptySt.avatarTxt}>{profileName[0]?.toUpperCase()}</Text>
      </Animated.View>
      <Animated.Text
        style={[emptySt.title, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}
      >
        {profileName}
      </Animated.Text>
      <Animated.Text
        style={[emptySt.sub, { opacity: subOpacity, transform: [{ translateY: subY }] }]}
      >
        Sağlığın, alışkanlıkların, hayatın hakkında bilebileceğin her şey için buradayım.
      </Animated.Text>

      {/* Starter chip'ler */}
      <View style={{ alignSelf: 'stretch', gap: 8, marginTop: 24 }}>
        {starters.map((text, i) => (
          <EmptyStarterChip
            key={i}
            text={text}
            delay={i * 60}
            onSelect={onSelectStarter}
            loading={loading}
          />
        ))}
      </View>

      <Pressable
        onPress={onStart}
        disabled={loading}
        style={{
          marginTop: 20,
          backgroundColor: SLEEP.accent,
          borderRadius: 16,
          paddingVertical: 14,
          paddingHorizontal: 32,
          minHeight: 48,
          alignItems: 'center',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={{ fontFamily: font.semibold, fontSize: 15, color: '#fff' }}>
            Boş sohbet başlat
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function getEmptyStarters(profileName: string): string[] {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) {
    return ['Bugün nasıl hissediyorsun?', 'Nasıl uyudun?', 'Bugün için planın ne?'];
  }
  if (hour >= 11 && hour < 18) {
    return [
      'Sabahın nasıl geçti?',
      'Bugün kaç adım attın?',
      `${profileName}, bugün öğle ne yedin?`,
    ];
  }
  if (hour >= 18 && hour < 22) {
    return ['Bugün nasıl geçti?', 'Bugünün en güzel anı neydi?', 'Akşam yemeğinde ne yedin?'];
  }
  return ['Bugünü nasıl değerlendirirsin?', 'Yarın için bir hedefin var mı?', 'Aklında ne var?'];
}

function EmptyStarterChip({
  text,
  delay,
  onSelect,
  loading,
}: {
  text: string;
  delay: number;
  onSelect: (text: string) => void;
  loading: boolean;
}) {
  const translateY = useRef(new Animated.Value(10)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        delay,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
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
          if (!loading) onSelect(text);
        }}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: 'rgba(94,92,230,0.12)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            fontFamily: font.regular,
            fontSize: 14,
            color: '#1C1C1E',
            flex: 1,
            letterSpacing: -0.1,
          }}
        >
          {text}
        </Text>
        <Text style={{ fontSize: 14, color: SLEEP.accent, marginLeft: 8 }}>→</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Onboarding
function OnboardingView({
  onComplete,
}: {
  onComplete: (name: string, firstConversationId?: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { getToken, signOut } = useAuth();
  const [step, setStep] = useState<'intro' | 'name'>('intro');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/assistant/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Bir hata oldu');
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete(data.name, data.firstConversationId);
    } catch (e) {
      setError('Bağlantı sorunu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[onbSt.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={onbSt.center}>
        {step === 'intro' && (
          <>
            <View style={onbSt.bigAvatar}>
              <Canvas style={StyleSheet.absoluteFill}>
                <RoundedRect x={0} y={0} width={120} height={120} r={60}>
                  <LinearGradient
                    start={vec(0, 0)}
                    end={vec(120, 120)}
                    colors={['#7D5FFF', SLEEP.accent]}
                  />
                </RoundedRect>
              </Canvas>
              <SymbolView
                name="sparkles"
                size={44}
                tintColor="#fff"
                fallback={<Text style={{ fontSize: 36, color: '#fff' }}>✨</Text>}
              />
            </View>
            <Text style={onbSt.heading}>Selam.</Text>
            <Text style={onbSt.body}>
              Sana yardım etmem için önce bana bir isim ver.{'\n'}
              Bana ne demek istersen — istediğini koy.
            </Text>
            <Pressable
              onPress={() => setStep('name')}
              style={{
                marginTop: 36,
                backgroundColor: SLEEP.accent,
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 36,
                minHeight: 52,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: font.bold, fontSize: 16, color: '#fff' }}>Devam</Text>
            </Pressable>
          </>
        )}
        {step === 'intro' && (
          <Pressable onPress={() => signOut()} hitSlop={12} style={{ marginTop: 24, padding: 8 }}>
            <Text style={{ fontFamily: font.medium, fontSize: 13, color: SLEEP.textDim }}>
              Farklı hesapla giriş yap
            </Text>
          </Pressable>
        )}
        {step === 'name' && (
          <>
            <Text style={onbSt.heading}>Bir isim ver</Text>
            <Text style={onbSt.body}>2-20 karakter. Sonradan değiştirebilirsin.</Text>
            <NameInput
              value={name}
              onChange={(v) => {
                setName(v);
                setError(null);
              }}
              onSubmit={submit}
            />
            {error && <Text style={onbSt.error}>{error}</Text>}
            <Pressable
              onPress={submit}
              disabled={submitting || name.trim().length < 2}
              style={{
                marginTop: 24,
                backgroundColor: name.trim().length >= 2 ? SLEEP.accent : '#D1D1D6',
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 48,
                minHeight: 52,
                alignItems: 'center',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ fontFamily: font.bold, fontSize: 16, color: '#fff' }}>
                  Tanışalım
                </Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function NameInput({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <View style={onbSt.inputWrap}>
      <TextInput
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder="Bir isim..."
        placeholderTextColor={SLEEP.textDim}
        autoFocus
        maxLength={20}
        autoCapitalize="words"
        style={onbSt.input}
      />
    </View>
  );
}

function SessionsSkeleton() {
  const opacity = useState(() => new Animated.Value(0.4))[0];
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  const Bar = ({
    w,
    h,
    mt = 0,
    br = 8,
  }: {
    w: number | string;
    h: number;
    mt?: number;
    br?: number;
  }) => (
    <Animated.View
      style={{
        width: w as number,
        height: h,
        borderRadius: br,
        backgroundColor: '#E5E5EA',
        opacity,
        marginTop: mt,
      }}
    />
  );
  return (
    <View style={{ paddingTop: 8 }}>
      <Bar w={140} h={32} br={8} />
      <Bar w={180} h={14} mt={10} />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 28 }}>
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={{ flex: 1, height: 92, borderRadius: 16, backgroundColor: '#E5E5EA', opacity }}
          />
        ))}
      </View>
      <Bar w={100} h={11} mt={32} />
      <View style={{ gap: 10, marginTop: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <Animated.View
            key={i}
            style={{
              flexDirection: 'row',
              gap: 12,
              padding: 14,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              alignItems: 'center',
              opacity,
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#E5E5EA' }} />
            <View style={{ flex: 1, gap: 6 }}>
              <View
                style={{ width: '60%', height: 12, borderRadius: 6, backgroundColor: '#E5E5EA' }}
              />
              <View
                style={{ width: '85%', height: 10, borderRadius: 5, backgroundColor: '#EAEAEF' }}
              />
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

function formatRelativeDate(d: Date) {
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'Şimdi';
  if (min < 60) return `${min}dk`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}sa`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}g`;
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

// ─── Styles
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: SLEEP.page },
  scroll: { paddingHorizontal: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { fontFamily: font.extrabold, fontSize: 32, color: SLEEP.text, letterSpacing: -0.7 },
  sub: { fontFamily: font.regular, fontSize: 14, color: SLEEP.textMuted, marginTop: 4 },
  memoryBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SLEEP.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SLEEP.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginLeft: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sectionCount: { fontFamily: font.semibold, fontSize: 11, color: SLEEP.textDim },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: SLEEP.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  searchInput: { flex: 1, fontFamily: font.regular, fontSize: 14, color: SLEEP.text, padding: 0 },
  modesRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
  sectionLabel: {
    fontFamily: font.bold,
    fontSize: 12,
    color: SLEEP.textDim,
    letterSpacing: 1.2,
    marginTop: 28,
    paddingLeft: 4,
  },
});

const searchEmptySt = StyleSheet.create({
  wrap: { paddingVertical: 32, alignItems: 'center' },
  txt: { fontFamily: font.regular, fontSize: 13, color: SLEEP.textDim },
});

const modeSt = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: SLEEP.card,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: { fontFamily: font.semibold, fontSize: 13, color: SLEEP.textMuted, letterSpacing: -0.1 },
  badge: { fontFamily: font.medium, fontSize: 9, color: SLEEP.textDim, marginTop: 2 },
});

const cardSt = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    backgroundColor: SLEEP.card,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SLEEP.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { fontFamily: font.bold, fontSize: 16, color: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: SLEEP.text,
    flex: 1,
    letterSpacing: -0.2,
  },
  time: { fontFamily: font.regular, fontSize: 11, color: SLEEP.textDim, marginLeft: 8 },
  preview: { fontFamily: font.regular, fontSize: 13, color: SLEEP.textMuted, marginTop: 3 },
});

const emptySt = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: SLEEP.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: SLEEP.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
  },
  avatarTxt: { fontFamily: font.extrabold, fontSize: 36, color: '#fff' },
  title: { fontFamily: font.extrabold, fontSize: 28, color: SLEEP.text, letterSpacing: -0.6 },
  sub: {
    fontFamily: font.regular,
    fontSize: 14,
    color: SLEEP.textMuted,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 21,
  },
});

const onbSt = StyleSheet.create({
  root: { flex: 1, backgroundColor: SLEEP.page },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  bigAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: SLEEP.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
  },
  heading: { fontFamily: font.extrabold, fontSize: 38, color: SLEEP.text, letterSpacing: -0.8 },
  body: {
    fontFamily: font.regular,
    fontSize: 16,
    color: SLEEP.textMuted,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 24,
  },
  inputWrap: {
    marginTop: 28,
    alignSelf: 'stretch',
    backgroundColor: SLEEP.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  input: {
    fontFamily: font.bold,
    fontSize: 22,
    color: SLEEP.text,
    paddingVertical: 16,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  error: { fontFamily: font.medium, fontSize: 13, color: SLEEP.danger, marginTop: 12 },
});

void Animated;

/**
 * AI Profil Sayfası — V3 Faz B
 *
 * WhatsApp tarzı profil:
 * - Üstte büyük avatar (DALL-E ile üretilen)
 * - İsim, bio, durum (online/sleeping/unavailable)
 * - İlk konuşma tarihi
 * - Yıldızlanan mesajlar bölümü (Favori Anlarımız)
 * - İlişki durumu göstergesi (cold/silent/warning/blocked)
 * - Avatar yenileme butonu
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { font, C, API_URL } from '../../../lib/theme';

interface ProfileData {
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  archetype: string;
  onlineState: 'online' | 'offline' | 'sleeping' | 'unavailable';
  relationshipState: 'normal' | 'cold' | 'silent' | 'warning' | 'blocked';
  blockedUntil: string | null;
  firstConversationAt: string;
  profileCreatedAt: string;
  totalMessages: number;
  starredMessageCount: number;
}

const RELATIONSHIP_LABELS: Record<string, { label: string; color: string; description: string }> = {
  normal: { label: '', color: '', description: '' },
  cold: {
    label: 'Soğuk',
    color: '#8E8E93',
    description: 'Az önce kırıldı, biraz mesafeli',
  },
  silent: {
    label: 'Küs',
    color: '#FF9500',
    description: 'Konuşmak istemiyor şu an',
  },
  warning: {
    label: 'Uyarı verdi',
    color: '#FF9F0A',
    description: 'Son uyarıyı verdi — devam edersen küsecek',
  },
  blocked: {
    label: 'Engelledi',
    color: '#FF3B30',
    description: 'Şu an seninle konuşmak istemiyor',
  },
};

const ARCHETYPE_LABELS: Record<string, string> = {
  comedian: 'Komedyen',
  philosopher: 'Filozof',
  street: 'Sokak Çocuğu',
  princess: 'Romantik',
  artist: 'Sanatçı',
  soldier: 'Disiplinli',
  sage: 'Bilge',
  rebel: 'Asi',
  warm_friend: 'Sıcak Arkadaş',
};

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfileData | null>(null);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/assistant/profile/full`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setData(json);
    } catch (e) {
      console.error('[profile/full]', e);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile]),
  );

  const generateAvatar = async (regenerate = false) => {
    if (generatingAvatar) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGeneratingAvatar(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/assistant/profile/avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ regenerate }),
      });
      const json = await res.json();
      if (res.ok && json.avatarUrl) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setData((prev) => (prev ? { ...prev, avatarUrl: json.avatarUrl } : prev));
      }
    } catch (e) {
      console.error('[avatar/gen]', e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setGeneratingAvatar(false);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[st.root, { paddingTop: insets.top }]}>
          <View style={[st.center, { flex: 1 }]}>
            <ActivityIndicator color={C.accent} />
          </View>
        </View>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[st.root, { paddingTop: insets.top }]}>
          <View style={[st.center, { flex: 1 }]}>
            <Text style={st.errorText}>Profil yüklenemedi</Text>
          </View>
        </View>
      </>
    );
  }

  const relationship = RELATIONSHIP_LABELS[data.relationshipState] ?? RELATIONSHIP_LABELS.normal;
  const showRelationshipBanner = data.relationshipState !== 'normal';
  const friendDays = Math.floor(
    (Date.now() - new Date(data.firstConversationAt).getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[st.root, { paddingTop: insets.top }]}>
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
          <Text style={st.headerTitle}>Profil</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={[st.scroll, { paddingBottom: insets.bottom + 32 }]}>
          {/* Avatar */}
          <View style={st.avatarWrap}>
            <AvatarView
              url={data.avatarUrl}
              fallbackLetter={data.name[0]?.toUpperCase() ?? '?'}
              dimmed={data.relationshipState === 'blocked'}
            />
            {generatingAvatar && (
              <View style={st.avatarLoader}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
            {!data.avatarUrl && !generatingAvatar && (
              <Pressable onPress={() => generateAvatar(false)} style={st.generateAvatarBtn}>
                <SymbolView
                  name="sparkles"
                  size={14}
                  tintColor="#fff"
                  fallback={<Text style={{ color: '#fff' }}>✨</Text>}
                />
                <Text style={st.generateAvatarTxt}>Avatar oluştur</Text>
              </Pressable>
            )}
          </View>

          {/* İsim + durum */}
          <Text style={st.name}>{data.name}</Text>
          <View style={st.statusRow}>
            <StatusDot state={data.onlineState} />
            <Text style={st.statusTxt}>{statusLabel(data.onlineState)}</Text>
          </View>

          {/* Karakter rozeti */}
          {data.archetype && (
            <View style={st.archetypeRow}>
              <Text style={st.archetypeTxt}>
                {ARCHETYPE_LABELS[data.archetype] ?? data.archetype}
              </Text>
            </View>
          )}

          {/* İlişki durumu banner (cold/silent/blocked) */}
          {showRelationshipBanner && (
            <View style={[st.relBanner, { borderColor: relationship.color }]}>
              <View style={[st.relBannerDot, { backgroundColor: relationship.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[st.relBannerLabel, { color: relationship.color }]}>
                  {relationship.label}
                </Text>
                <Text style={st.relBannerDesc}>{relationship.description}</Text>
                {data.blockedUntil && (
                  <Text style={st.relBannerSub}>{formatBlockedUntil(data.blockedUntil)}</Text>
                )}
              </View>
            </View>
          )}

          {/* Bio */}
          {data.bio && (
            <View style={st.section}>
              <Text style={st.sectionLabel}>Hakkında</Text>
              <Text style={st.bio}>{data.bio}</Text>
            </View>
          )}

          {/* İstatistikler */}
          <View style={st.statsRow}>
            <Stat label="Birlikte" value={`${friendDays} gün`} />
            <View style={st.statDivider} />
            <Stat label="Mesaj" value={`${data.totalMessages}`} />
            <View style={st.statDivider} />
            <Stat label="Favori" value={`${data.starredMessageCount}`} />
          </View>

          {/* İlk konuşma tarihi */}
          <View style={st.section}>
            <Text style={st.sectionLabel}>İlk konuşma</Text>
            <Text style={st.dateText}>
              {new Date(data.firstConversationAt).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>

          {/* Aksiyonlar */}
          <View style={st.actionsSection}>
            {data.avatarUrl && (
              <Pressable
                onPress={() => {
                  Alert.alert(
                    'Avatarı yenile',
                    'AI yeni bir avatar üretsin mi? Eski avatar kaybolacak.',
                    [
                      { text: 'Vazgeç', style: 'cancel' },
                      {
                        text: 'Yenile',
                        onPress: () => generateAvatar(true),
                      },
                    ],
                  );
                }}
                style={st.actionRow}
              >
                <SymbolView
                  name="sparkles"
                  size={18}
                  tintColor={C.accent}
                  fallback={<Text style={{ color: C.accent }}>✨</Text>}
                />
                <Text style={st.actionTxt}>Avatarı yenile</Text>
                <SymbolView
                  name="chevron.right"
                  size={14}
                  tintColor={C.textDim}
                  fallback={<Text style={{ color: C.textDim }}>›</Text>}
                />
              </Pressable>
            )}

            <Pressable onPress={() => router.push('/seans/memory')} style={st.actionRow}>
              <SymbolView
                name="brain"
                size={18}
                tintColor={C.accent}
                fallback={<Text style={{ color: C.accent }}>🧠</Text>}
              />
              <Text style={st.actionTxt}>Beni nasıl tanıyorsun</Text>
              <SymbolView
                name="chevron.right"
                size={14}
                tintColor={C.textDim}
                fallback={<Text style={{ color: C.textDim }}>›</Text>}
              />
            </Pressable>

            {data.starredMessageCount > 0 && (
              <Pressable
                onPress={() => {
                  Alert.alert('Yakında', 'Favori anlarımız sayfası yakında.');
                }}
                style={st.actionRow}
              >
                <SymbolView
                  name="star.fill"
                  size={18}
                  tintColor="#FFD60A"
                  fallback={<Text style={{ color: '#FFD60A' }}>⭐</Text>}
                />
                <Text style={st.actionTxt}>Favori anlarımız</Text>
                <SymbolView
                  name="chevron.right"
                  size={14}
                  tintColor={C.textDim}
                  fallback={<Text style={{ color: C.textDim }}>›</Text>}
                />
              </Pressable>
            )}

            <Pressable onPress={() => router.push('/seans/settings')} style={st.actionRow}>
              <SymbolView
                name="gearshape.fill"
                size={18}
                tintColor={C.textMuted}
                fallback={<Text style={{ color: C.textMuted }}>⚙️</Text>}
              />
              <Text style={st.actionTxt}>Ayarlar</Text>
              <SymbolView
                name="chevron.right"
                size={14}
                tintColor={C.textDim}
                fallback={<Text style={{ color: C.textDim }}>›</Text>}
              />
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

// ─── Avatar View ──────────────────────────────────────────────────────────────

function AvatarView({
  url,
  fallbackLetter,
  dimmed,
}: {
  url: string | null;
  fallbackLetter: string;
  dimmed: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 480,
      useNativeDriver: true,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }).start();
  }, []);

  return (
    <Animated.View
      style={[st.avatarOuter, { transform: [{ scale: scaleAnim }], opacity: dimmed ? 0.4 : 1 }]}
    >
      {url ? (
        <Image source={{ uri: url }} style={st.avatarImage} contentFit="cover" />
      ) : (
        <View style={st.avatarFallback}>
          <Text style={st.avatarLetter}>{fallbackLetter}</Text>
        </View>
      )}
    </Animated.View>
  );
}

// ─── Status Dot ───────────────────────────────────────────────────────────────

function StatusDot({ state }: { state: ProfileData['onlineState'] }) {
  const color =
    state === 'online'
      ? '#30D158'
      : state === 'sleeping'
        ? '#5E5CE6'
        : state === 'unavailable'
          ? '#FF3B30'
          : '#8E8E93';
  return <View style={[st.statusDot, { backgroundColor: color }]} />;
}

function statusLabel(state: ProfileData['onlineState']): string {
  switch (state) {
    case 'online':
      return 'Çevrimiçi';
    case 'sleeping':
      return 'Uyuyor';
    case 'unavailable':
      return 'Şu an müsait değil';
    default:
      return 'Çevrimdışı';
  }
}

// ─── Stat ─────────────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={st.statBox}>
      <Text style={st.statValue}>{value}</Text>
      <Text style={st.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBlockedUntil(iso: string): string {
  const target = new Date(iso);
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return 'Az sonra dönecek';
  const hours = Math.ceil(diff / 3600000);
  if (hours < 24) return `${hours} saat sonra dönecek`;
  const days = Math.ceil(hours / 24);
  return `${days} gün sonra dönecek`;
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
  headerTitle: {
    flex: 1,
    fontFamily: font.semibold,
    fontSize: 17,
    color: C.text,
    textAlign: 'center',
    letterSpacing: -0.2,
  },

  scroll: { paddingHorizontal: 0, paddingTop: 24 },

  center: { alignItems: 'center', justifyContent: 'center' },
  errorText: { fontFamily: font.regular, fontSize: 14, color: C.textMuted },

  // Avatar
  avatarWrap: { alignItems: 'center', marginBottom: 18 },
  avatarOuter: {
    width: 132,
    height: 132,
    borderRadius: 66,
    overflow: 'hidden',
    backgroundColor: C.accentSoft,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontFamily: font.extrabold, fontSize: 48, color: '#fff' },
  avatarLoader: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateAvatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.accent,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    marginTop: 14,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  generateAvatarTxt: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: '#fff',
    letterSpacing: -0.1,
  },

  // İsim
  name: {
    fontFamily: font.extrabold,
    fontSize: 28,
    color: C.text,
    textAlign: 'center',
    letterSpacing: -0.6,
  },

  // Durum
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusTxt: { fontFamily: font.regular, fontSize: 13, color: C.textMuted },

  // Karakter
  archetypeRow: {
    alignSelf: 'center',
    marginTop: 12,
    backgroundColor: C.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  archetypeTxt: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: C.accent,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // İlişki durumu banner
  relBanner: {
    marginHorizontal: 18,
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  relBannerDot: { width: 8, height: 8, borderRadius: 4 },
  relBannerLabel: {
    fontFamily: font.bold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  relBannerDesc: {
    fontFamily: font.regular,
    fontSize: 13,
    color: C.text,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  relBannerSub: { fontFamily: font.regular, fontSize: 11, color: C.textDim, marginTop: 4 },

  // Section
  section: { paddingHorizontal: 18, marginTop: 24 },
  sectionLabel: {
    fontFamily: font.bold,
    fontSize: 11,
    color: C.textDim,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  bio: {
    fontFamily: font.regular,
    fontSize: 14,
    color: C.text,
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  dateText: {
    fontFamily: font.medium,
    fontSize: 14,
    color: C.text,
    letterSpacing: -0.1,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginTop: 22,
    backgroundColor: C.card,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginVertical: 4,
  },
  statValue: {
    fontFamily: font.bold,
    fontSize: 18,
    color: C.text,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },

  // Actions
  actionsSection: {
    marginTop: 28,
    paddingHorizontal: 18,
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  actionTxt: {
    flex: 1,
    fontFamily: font.medium,
    fontSize: 15,
    color: C.text,
    letterSpacing: -0.1,
  },
});

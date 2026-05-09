/**
 * V4.8 Faz F — Yaratıcı profili
 *
 * Apple App Store "geliştirici sayfası" paterni:
 *   - Native large title @handle
 *   - Header'da context menu (3 nokta) — bildirim aç/kapa, paylaş, şikayet
 *   - Üstte avatar + bio + tier
 *   - Stat satırı (karakter sayısı, takipçi)
 *   - "Takip Et" / "Takiptesin" CTA
 *   - Karakter listesi (yatay scroll yok, dikey kompakt)
 */

import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import ContextMenu from 'react-native-context-menu-view';
import { C, font } from '../../../../lib/theme';
import { useCreatorsApi, type CreatorProfile } from '../../../../lib/marketplace/creatorsApi';

const TIER_LABEL: Record<string, { text: string; color: string }> = {
  bronze: { text: 'Bronz', color: '#CD7F32' },
  silver: { text: 'Gümüş', color: '#A8A8A8' },
  gold: { text: 'Altın', color: '#FFCC00' },
  platinum: { text: 'Platin', color: '#5E5CE6' },
};

export default function CreatorProfileScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const api = useCreatorsApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!handle) return;
    const data = await apiRef.current.getProfile(handle);
    setProfile(data);
    setLoading(false);
    setRefreshing(false);
  }, [handle]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const onFollowPress = useCallback(async () => {
    if (!handle || !profile || followBusy) return;
    setFollowBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const r = await apiRef.current.toggleFollow(handle);
    if (r) {
      setProfile((p) =>
        p
          ? {
              ...p,
              isFollowing: r.following,
              followerCount: r.followerCount,
              notifyOnNew: r.notifyOnNew,
            }
          : p,
      );
    }
    setFollowBusy(false);
  }, [handle, profile, followBusy]);

  const onToggleNotify = useCallback(async () => {
    if (!handle || !profile?.isFollowing) return;
    Haptics.selectionAsync();
    const r = await apiRef.current.toggleFollow(handle, { notifyOnNew: !profile.notifyOnNew });
    if (r) {
      setProfile((p) =>
        p
          ? {
              ...p,
              isFollowing: r.following,
              followerCount: r.followerCount,
              notifyOnNew: r.notifyOnNew,
            }
          : p,
      );
    }
  }, [handle, profile]);

  const onSharePress = useCallback(async () => {
    if (!handle || !profile) return;
    Haptics.selectionAsync();
    try {
      await Share.share({
        title: `@${handle} · FitAI`,
        message: profile.bio
          ? `@${handle} — ${profile.bio}\n\nFitAI'da yaratıcıya bak.`
          : `@${handle} yaratıcısına FitAI'da bak.`,
      });
    } catch {
      // User cancelled or share failed — sessizce geç
    }
  }, [handle, profile]);

  const onReportPress = useCallback(() => {
    if (!handle) return;
    const REASONS: {
      key: 'real_person' | 'nsfw' | 'harassment' | 'low_quality' | 'copy_claim' | 'other';
      label: string;
    }[] = [
      { key: 'real_person', label: 'Gerçek bir kişiyi taklit ediyor' },
      { key: 'nsfw', label: 'Yetişkinlere uygun (NSFW)' },
      { key: 'harassment', label: 'Taciz / nefret söylemi' },
      { key: 'copy_claim', label: 'İzinsiz kopya' },
      { key: 'low_quality', label: 'Düşük kalite / spam' },
      { key: 'other', label: 'Diğer' },
    ];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: `@${handle} hakkında şikayet`,
        message: 'Sebebini seç. Moderasyon ekibi inceleyecek.',
        options: ['İptal', ...REASONS.map((r) => r.label)],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 1, // İlk sebep "gerçek kişi taklidi" en ciddi olduğu için kırmızı
        userInterfaceStyle: 'light',
      },
      async (idx) => {
        if (idx === 0 || idx === undefined) return;
        const reason = REASONS[idx - 1];
        if (!reason) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        const res = await apiRef.current.reportCreator(handle, reason.key);
        if (res?.alreadyReported) {
          Alert.alert('Şikayet alındı', 'Bu yaratıcıyı zaten son 24 saat içinde şikayet etmişsin.');
        } else if (res?.ok) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Şikayet alındı', 'Moderasyon ekibimiz inceleyecek. Teşekkürler.');
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert('Hata', 'Şikayet gönderilemedi, daha sonra tekrar dene.');
        }
      },
    );
  }, [handle]);

  if (loading) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.page }}
      >
        <Stack.Screen
          options={{
            title: handle ? `@${handle}` : 'Yaratıcı',
            headerBackTitle: 'Geri',
            headerTitleStyle: { fontFamily: font.bold, fontSize: 17, color: C.text } as any,
          }}
        />
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: C.page,
          paddingHorizontal: 32,
        }}
      >
        <Stack.Screen
          options={{
            title: handle ? `@${handle}` : 'Yaratıcı',
            headerBackTitle: 'Geri',
            headerTitleStyle: { fontFamily: font.bold, fontSize: 17, color: C.text } as any,
          }}
        />
        <SymbolView
          name="person.crop.circle.badge.questionmark"
          tintColor={C.textMuted}
          size={48}
        />
        <Text
          style={{
            fontFamily: font.bold,
            fontSize: 18,
            color: C.text,
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          Profil bulunamadı
        </Text>
        <Text
          style={{
            fontFamily: font.regular,
            fontSize: 14,
            color: C.textMuted,
            textAlign: 'center',
            marginTop: 6,
            lineHeight: 20,
          }}
        >
          Bu yaratıcının profili henüz açılmamış olabilir. (En az 3 yayınlanmış karakter veya 10
          takipçi şart.)
        </Text>
      </View>
    );
  }

  const tier = TIER_LABEL[profile.tier] ?? null;

  return (
    <>
      <Stack.Screen
        options={{
          title: `@${profile.handle}`,
          headerBackTitle: 'Geri',
          headerTitleStyle: { fontFamily: font.bold, fontSize: 17, color: C.text } as any,
          headerRight: () =>
            profile.isSelf ? null : (
              <ContextMenu
                actions={
                  profile.isFollowing
                    ? [
                        {
                          title: profile.notifyOnNew ? 'Bildirimi kapat' : 'Bildirimi aç',
                          systemIcon: profile.notifyOnNew ? 'bell.slash' : 'bell',
                        },
                        { title: 'Paylaş', systemIcon: 'square.and.arrow.up' },
                        { title: 'Şikayet et', systemIcon: 'flag', destructive: true },
                      ]
                    : [
                        { title: 'Paylaş', systemIcon: 'square.and.arrow.up' },
                        { title: 'Şikayet et', systemIcon: 'flag', destructive: true },
                      ]
                }
                dropdownMenuMode
                onPress={(e) => {
                  const idx = e.nativeEvent.index;
                  if (profile.isFollowing) {
                    if (idx === 0) onToggleNotify();
                    else if (idx === 1) onSharePress();
                    else if (idx === 2) onReportPress();
                  } else {
                    if (idx === 0) onSharePress();
                    else if (idx === 1) onReportPress();
                  }
                }}
              >
                <Pressable hitSlop={12}>
                  <SymbolView name="ellipsis.circle" tintColor={C.accent} size={22} />
                </Pressable>
              </ContextMenu>
            ),
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: C.page }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              refresh();
            }}
            tintColor={C.accent}
          />
        }
      >
        {/* Üst kart: ortalanmış avatar + handle + tier rozet inline + bio */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, alignItems: 'center' }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: C.surface,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {profile.avatar ? (
              <Image
                source={{ uri: profile.avatar }}
                style={{ width: 88, height: 88 }}
                contentFit="cover"
              />
            ) : (
              <SymbolView name="person.fill" tintColor={C.textMuted} size={42} />
            )}
          </View>

          {/* Handle + tier inline (Twitter verified paterni) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <Text
              style={{
                fontFamily: font.extrabold,
                fontSize: 22,
                color: C.text,
                letterSpacing: -0.4,
              }}
            >
              @{profile.handle}
            </Text>
            {tier && <SymbolView name="checkmark.seal.fill" tintColor={tier.color} size={18} />}
          </View>
          {tier && (
            <Text
              style={{
                fontFamily: font.semibold,
                fontSize: 11,
                color: tier.color,
                letterSpacing: 0.6,
                marginTop: 3,
                textTransform: 'uppercase',
              }}
            >
              {tier.text} Yaratıcı
            </Text>
          )}

          {profile.bio && (
            <Text
              style={{
                fontFamily: font.regular,
                fontSize: 15,
                color: C.text,
                lineHeight: 22,
                marginTop: 14,
                textAlign: 'center',
              }}
            >
              {profile.bio}
            </Text>
          )}
        </View>

        {/* 3'lü stat satırı — App Store paterni */}
        <View
          style={{
            flexDirection: 'row',
            marginHorizontal: 20,
            marginTop: 20,
            backgroundColor: C.card,
            borderRadius: 16,
            paddingVertical: 16,
          }}
        >
          <StatBlock label="Karakter" value={String(profile.totalCharacters)} />
          <StatDivider />
          <StatBlock label="Takipçi" value={String(profile.followerCount)} />
          <StatDivider />
          <StatBlock label="Ortalama" value={avgRating(profile.listings) ?? '—'} icon="star.fill" />
        </View>

        {/* CTA — geniş, accent renkli */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          {!profile.isSelf && (
            <Pressable
              onPress={onFollowPress}
              disabled={followBusy}
              style={{
                backgroundColor: profile.isFollowing ? C.surface : C.accent,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: 'center',
                opacity: followBusy ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  fontFamily: font.bold,
                  fontSize: 16,
                  color: profile.isFollowing ? C.text : '#FFFFFF',
                }}
              >
                {profile.isFollowing ? 'Takiptesin' : 'Takip Et'}
              </Text>
            </Pressable>
          )}

          {profile.isSelf && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => router.push('/more/creator/me/edit' as any)}
                style={{
                  flex: 1,
                  backgroundColor: C.surface,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: font.semibold, fontSize: 15, color: C.text }}>
                  Düzenle
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/more/creator/dashboard' as any)}
                style={{
                  flex: 1,
                  backgroundColor: C.accent,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: font.semibold, fontSize: 15, color: '#FFFFFF' }}>
                  Stüdyo
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Karakter listesi */}
        <View style={{ marginTop: 28 }}>
          <Text
            style={{
              fontFamily: font.bold,
              fontSize: 22,
              color: C.text,
              paddingHorizontal: 20,
              paddingBottom: 10,
              letterSpacing: -0.3,
            }}
          >
            Karakterler
          </Text>
          {profile.listings.length === 0 ? (
            <Text
              style={{
                fontFamily: font.regular,
                fontSize: 14,
                color: C.textMuted,
                paddingHorizontal: 20,
                paddingVertical: 18,
              }}
            >
              Henüz yayınlanmış karakter yok.
            </Text>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                paddingHorizontal: 16,
                gap: 12,
              }}
            >
              {profile.listings.map((l) => (
                <CharacterCard
                  key={l.id}
                  listing={l}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/more/market/listing/${l.id}` as any);
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {profile.isSelf && (
          <Pressable
            onPress={() => router.push(`/more/creator/${profile.handle}/followers` as any)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 14,
              marginTop: 18,
              backgroundColor: pressed ? C.surface : 'transparent',
            })}
          >
            <Text style={{ fontFamily: font.semibold, fontSize: 15, color: C.text }}>
              Takipçilerim
            </Text>
            <SymbolView name="chevron.right" tintColor={C.textDim} size={13} />
          </Pressable>
        )}
      </ScrollView>
    </>
  );
}

function StatBlock({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {icon && <SymbolView name={icon as any} tintColor="#FFCC00" size={15} />}
        <Text
          style={{ fontFamily: font.extrabold, fontSize: 20, color: C.text, letterSpacing: -0.4 }}
        >
          {value}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: font.regular,
          fontSize: 11,
          color: C.textMuted,
          marginTop: 2,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function StatDivider() {
  return (
    <View
      style={{
        width: 1,
        backgroundColor: C.border,
        marginVertical: 4,
      }}
    />
  );
}

function avgRating(listings: { averageRating: number | null }[]): string | null {
  const rated = listings.filter((l) => l.averageRating != null);
  if (rated.length === 0) return null;
  const avg = rated.reduce((acc, l) => acc + (l.averageRating ?? 0), 0) / rated.length;
  return avg.toFixed(1);
}

function CharacterCard({
  listing,
  onPress,
}: {
  listing: {
    id: string;
    character: {
      id: string;
      name: string;
      age: number;
      avatarUrl: string | null;
      bio: string | null;
      hometown: string | null;
      category: string;
    };
    rentPrice7d: number | null;
    rentPrice30d: number | null;
    averageRating: number | null;
    totalRentals: number;
  };
  onPress: () => void;
}) {
  const { width } = useWindowDimensions();
  const cardWidth = (width - 16 * 2 - 12) / 2;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: cardWidth,
        backgroundColor: C.card,
        borderRadius: 16,
        overflow: 'hidden',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: cardWidth,
          height: cardWidth,
          backgroundColor: C.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {listing.character.avatarUrl ? (
          <Image
            source={{ uri: listing.character.avatarUrl }}
            style={{ width: cardWidth, height: cardWidth }}
            contentFit="cover"
          />
        ) : (
          <SymbolView name="person.fill" tintColor={C.textMuted} size={48} />
        )}
        {listing.averageRating != null && (
          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: '#000000AA',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
              paddingHorizontal: 7,
              paddingVertical: 3,
              borderRadius: 10,
            }}
          >
            <SymbolView name="star.fill" tintColor="#FFCC00" size={10} />
            <Text style={{ fontFamily: font.bold, fontSize: 11, color: '#FFFFFF' }}>
              {listing.averageRating.toFixed(1)}
            </Text>
          </View>
        )}
      </View>
      <View style={{ padding: 12 }}>
        <Text numberOfLines={1} style={{ fontFamily: font.bold, fontSize: 15, color: C.text }}>
          {listing.character.name}
        </Text>
        <Text
          numberOfLines={1}
          style={{ fontFamily: font.regular, fontSize: 12, color: C.textMuted, marginTop: 2 }}
        >
          {listing.character.age}
          {listing.character.hometown ? ` · ${listing.character.hometown}` : ''}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
          {listing.rentPrice7d != null && (
            <Text style={{ fontFamily: font.bold, fontSize: 13, color: C.accent }}>
              {listing.rentPrice7d} cr
            </Text>
          )}
          <Text style={{ fontFamily: font.regular, fontSize: 11, color: C.textMuted }}>
            · {listing.totalRentals} kira
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/**
 * V4.8 Faz D — Listing Detay
 *
 * Karakterin kısıtlı profili (raw bible YOK), istatistikler, yorumlar.
 * Demo başlat / Kira / Satın alma CTA'ları.
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { ShareCard } from '../../../../components/marketplace/ShareCard';
import { BoostSheet, type BoostSheetRef } from '../../../../components/marketplace/BoostSheet';
import { GiftSheet, type GiftSheetRef } from '../../../../components/marketplace/GiftSheet';
import { C, font } from '../../../../lib/theme';
import {
  useMarketApi,
  type ListingDetail,
  type RentalType,
} from '../../../../lib/marketplace/marketApi';

const CATEGORY_LABEL: Record<string, string> = {
  friend: 'Arkadaş',
  mentor: 'Mentor',
  romantic: 'Romantik',
  family: 'Aile',
  fantasy: 'Hayali',
  professional: 'Profesyonel',
};

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useMarketApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [data, setData] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [similar, setSimilar] = useState<
    {
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
      ownerHandle: string | null;
      rentPrice7d: number | null;
      averageRating: number | null;
      totalRentals: number;
      isBoosted: boolean;
    }[]
  >([]);
  const cardRef = useRef<View>(null);
  const boostSheetRef = useRef<BoostSheetRef>(null);
  const giftSheetRef = useRef<GiftSheetRef>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    const [r, sim] = await Promise.all([
      apiRef.current.getListing(id),
      apiRef.current.getSimilarListings(id, 6),
    ]);
    if (r) setData(r);
    if (sim) setSimilar(sim.items);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.page }}
      >
        <Stack.Screen options={{ title: '' }} />
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={{ flex: 1, padding: 20, backgroundColor: C.page }}>
        <Stack.Screen options={{ title: 'Bulunamadı' }} />
        <Text style={{ fontFamily: font.regular, color: C.textMuted }}>Listing bulunamadı.</Text>
      </View>
    );
  }

  const onDemo = () => {
    if (!id) return;
    Haptics.selectionAsync();
    router.push(`/more/market/demo/${id}` as any);
  };

  const onRent = (type: RentalType) => {
    if (!id) return;
    Alert.alert(
      'Onay',
      type === 'outright_buy'
        ? `${data.listing.buyPrice} credit ile satın al?`
        : `${getRentPrice(data.listing, type)} credit ile ${getDays(type)} gün kirala?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const r = await apiRef.current.rent(id, type);
            setActionLoading(false);
            if (!r.ok) {
              Alert.alert('Hata', r.error ?? 'İşlem başarısız');
              return;
            }
            Alert.alert(
              type === 'outright_buy' ? 'Satın Alındı' : 'Kira Başladı',
              type === 'outright_buy'
                ? 'Karakter artık senin. Sohbet listende görünür.'
                : 'Karakter sohbet listende. Süre dolduğunda hatıralar kapsüllenecek.',
              [{ text: 'Tamam', onPress: () => router.back() }],
            );
          },
        },
      ],
    );
  };

  const onWishlistToggle = async () => {
    if (!data) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const r = await apiRef.current.toggleWishlist(data.listing.id);
    if (r) {
      setData({ ...data, userState: { ...data.userState, isWishlisted: r.added } });
    }
  };

  const onGift = () => {
    if (!data) return;
    Haptics.selectionAsync();
    giftSheetRef.current?.open({
      listingId: data.listing.id,
      characterName: data.listing.character.name,
      avatarUrl: data.listing.character.avatarUrl,
      rentPrice7d: data.listing.rentPrice7d,
      rentPrice14d: data.listing.rentPrice14d,
      rentPrice30d: data.listing.rentPrice30d,
    });
  };

  const onShare = async () => {
    if (!cardRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { dialogTitle: 'Karakteri paylaş' });
      } else {
        Alert.alert('Paylaşım', `Görsel hazır: ${uri}`);
      }
    } catch (e) {
      Alert.alert('Hata', 'Paylaşım kartı oluşturulamadı');
    }
  };

  const onReport = () => {
    Alert.alert('Şikayet', 'Sebep seç:', [
      { text: 'Gerçek kişi taklidi', onPress: () => submitReport('real_person') },
      { text: 'Uygunsuz içerik', onPress: () => submitReport('nsfw') },
      { text: 'Taciz/zorbalık', onPress: () => submitReport('harassment') },
      { text: 'Düşük kalite', onPress: () => submitReport('low_quality') },
      { text: 'Kopya iddiası', onPress: () => submitReport('copy_claim') },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const submitReport = async (reason: string) => {
    if (!data) return;
    const ok = await apiRef.current.report(data.listing.character.id, reason);
    Alert.alert(
      ok ? 'Şikayet Alındı' : 'Hata',
      ok ? 'Teşekkürler. İncelenecek.' : 'Şikayet gönderilemedi.',
    );
  };

  const ch = data.listing.character;
  const isOwner = data.userState.isOwner;
  const hasRental = data.userState.hasActiveRental;

  return (
    <>
      <Stack.Screen
        options={{
          title: ch.name,
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              {!isOwner && (
                <Pressable onPress={onWishlistToggle} hitSlop={12}>
                  <SymbolView
                    name={data.userState.isWishlisted ? 'heart.fill' : 'heart'}
                    tintColor={data.userState.isWishlisted ? '#FF3B30' : C.textMuted}
                    size={20}
                  />
                </Pressable>
              )}
              <Pressable onPress={onShare} hitSlop={12}>
                <SymbolView name="square.and.arrow.up" tintColor={C.accent} size={18} />
              </Pressable>
              {!isOwner && (
                <Pressable onPress={onReport} hitSlop={12}>
                  <SymbolView name="flag" tintColor={C.textMuted} size={18} />
                </Pressable>
              )}
            </View>
          ),
        }}
      />

      {/* Off-screen share card (ekranın dışında, capture için) */}
      <View style={{ position: 'absolute', top: -2000, left: 0 }}>
        <ShareCard
          ref={cardRef}
          data={{
            name: ch.name,
            age: ch.age,
            category: ch.category,
            hometown: ch.hometown,
            bio: ch.bio,
            avatarUrl: ch.avatarUrl,
            dnaScore: ch.dnaScore,
            averageRating: data.listing.averageRating,
            ownerHandle: data.listing.ownerHandle,
          }}
        />
      </View>
      <ScrollView
        style={{ flex: 1, backgroundColor: C.page }}
        contentContainerStyle={{ paddingBottom: isOwner ? 40 : 200 }}
      >
        {isOwner && (
          <>
            <Pressable onPress={() => router.push(`/more/characters/${ch.id}/listing` as any)}>
              {({ pressed }) => (
                <View
                  style={{
                    marginHorizontal: 16,
                    marginTop: 12,
                    backgroundColor: C.accentSoft,
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    opacity: pressed ? 0.85 : 1,
                  }}
                >
                  <SymbolView name="storefront" tintColor={C.accent} size={20} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: font.semibold, fontSize: 15, color: C.text }}>
                      Bu senin karakterin
                    </Text>
                    <Text
                      style={{
                        fontFamily: font.regular,
                        fontSize: 12,
                        color: C.textMuted,
                        marginTop: 2,
                      }}
                    >
                      Listing'i yönet, fiyatları güncelle
                    </Text>
                  </View>
                  <SymbolView name="chevron.right" tintColor={C.accent} size={14} />
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                boostSheetRef.current?.open(data.listing.id);
              }}
            >
              {({ pressed }) => (
                <View
                  style={{
                    marginHorizontal: 16,
                    marginTop: 8,
                    backgroundColor: '#FFCC0022',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    opacity: pressed ? 0.85 : 1,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: '#FFCC00',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SymbolView name="bolt.fill" tintColor="#1C1C1E" size={16} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: font.semibold, fontSize: 15, color: C.text }}>
                      {data.listing.isBoosted ? 'Boost aktif' : 'Öne çıkar'}
                    </Text>
                    <Text
                      style={{
                        fontFamily: font.regular,
                        fontSize: 12,
                        color: C.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {data.listing.isBoosted
                        ? 'Listingn şu an üst sıralarda. Süreyi uzat.'
                        : 'Trend ve Keşfet üst sıralarına yerleş'}
                    </Text>
                  </View>
                  <SymbolView name="chevron.right" tintColor="#FFCC00" size={14} />
                </View>
              )}
            </Pressable>
          </>
        )}
        {/* Hero — fullscreen avatar + gradient + bottom info */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            height: 460,
            borderRadius: 28,
            overflow: 'hidden',
            backgroundColor: C.accent,
          }}
        >
          {ch.avatarUrl ? (
            <Image
              source={{ uri: ch.avatarUrl }}
              style={{ width: '100%', height: '100%', position: 'absolute' }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SymbolView name="person.fill" tintColor="#FFFFFF55" size={150} />
            </View>
          )}

          {/* Bottom gradient overlay */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '70%',
              backgroundColor: '#00000099',
            }}
          />

          {/* Bottom info */}
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 22 }}>
            <Text
              style={{
                fontFamily: font.extrabold,
                fontSize: 40,
                color: '#FFFFFF',
                letterSpacing: -0.7,
              }}
            >
              {ch.name}
            </Text>
            <Text
              style={{
                fontFamily: font.medium,
                fontSize: 15,
                color: '#FFFFFFCC',
                marginTop: 4,
              }}
            >
              {ch.age} · {CATEGORY_LABEL[ch.category] ?? ch.category}
              {ch.hometown ? ` · ${ch.hometown}` : ''}
            </Text>

            {data.listing.trending && (
              <View
                style={{
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  marginTop: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.28)',
                }}
              >
                <SymbolView name="flame.fill" tintColor="#FF9F0A" size={11} />
                <Text
                  style={{
                    fontFamily: font.semibold,
                    fontSize: 12,
                    color: '#FFFFFF',
                    letterSpacing: -0.1,
                  }}
                >
                  Bu hafta trend
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 18, marginTop: 14 }}>
              {data.listing.averageRating != null && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <SymbolView name="star.fill" tintColor="#FFCC00" size={13} />
                  <Text style={{ fontFamily: font.bold, fontSize: 14, color: '#FFFFFF' }}>
                    {data.listing.averageRating.toFixed(1)}
                  </Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <SymbolView name="bag" tintColor="#FFFFFFCC" size={12} />
                <Text style={{ fontFamily: font.semibold, fontSize: 13, color: '#FFFFFFCC' }}>
                  {data.listing.totalRentals} kira
                </Text>
              </View>
              {ch.dnaScore != null && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <SymbolView name="seal" tintColor="#FFFFFFCC" size={12} />
                  <Text style={{ fontFamily: font.semibold, fontSize: 13, color: '#FFFFFFCC' }}>
                    DNA {ch.dnaScore}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Bio */}
        {ch.bio && (
          <Section title="Hakkında">
            <Text style={{ fontFamily: font.regular, fontSize: 15, color: C.text, lineHeight: 22 }}>
              {ch.bio}
            </Text>
          </Section>
        )}

        {/* Owner */}
        {data.listing.ownerHandle && (
          <Section title="Yaratıcı">
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/more/creator/${data.listing.ownerHandle}` as any);
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 4,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: C.accentSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SymbolView name="person.crop.circle" tintColor={C.accent} size={22} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{ fontFamily: font.semibold, fontSize: 15, color: C.text }}
                >
                  @{data.listing.ownerHandle}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: font.regular,
                    fontSize: 11,
                    color: C.textMuted,
                    letterSpacing: 0.4,
                    marginTop: 1,
                    textTransform: 'uppercase',
                  }}
                >
                  {data.listing.ownerTier}
                </Text>
              </View>
              <SymbolView name="chevron.right" tintColor={C.textDim} size={13} />
            </Pressable>
          </Section>
        )}

        {/* Reviews */}
        {data.reviews.length > 0 && (
          <Section title="Yorumlar">
            {data.reviews.map((rev) => (
              <View
                key={rev.id}
                style={{
                  backgroundColor: C.card,
                  padding: 14,
                  borderRadius: 12,
                  marginBottom: 8,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SymbolView
                      key={i}
                      name={i < rev.rating ? 'star.fill' : 'star'}
                      tintColor={i < rev.rating ? '#FFCC00' : C.textDim}
                      size={12}
                    />
                  ))}
                </View>
                <Text
                  style={{
                    fontFamily: font.regular,
                    fontSize: 14,
                    color: C.text,
                    marginTop: 6,
                    lineHeight: 20,
                  }}
                >
                  {rev.review}
                </Text>
              </View>
            ))}
          </Section>
        )}

        {/* Similar listings */}
        {similar.length > 0 && (
          <SimilarRow
            listings={similar}
            onPressItem={(sid) => {
              Haptics.selectionAsync();
              router.push(`/more/market/listing/${sid}` as any);
            }}
          />
        )}
      </ScrollView>

      {/* Bottom CTA */}
      {!isOwner && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: C.page,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: C.hairline,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 32,
            gap: 8,
          }}
        >
          {hasRental ? (
            <View
              style={{
                backgroundColor: C.successBg,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: font.semibold, fontSize: 15, color: C.success }}>
                ✓ Aktif kiranız var — Sohbetler'de
              </Text>
            </View>
          ) : (
            <>
              {/* Demo */}
              {data.userState.demoMessagesUsed < 5 && !data.userState.demoEnded && (
                <CTAButton
                  label={`Demo (${5 - data.userState.demoMessagesUsed} mesaj kaldı)`}
                  variant="secondary"
                  onPress={onDemo}
                  disabled={actionLoading}
                />
              )}

              {/* Kira seçenekleri (min 14 gün) */}
              {data.listing.rentEnabled && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {data.listing.rentPrice14d && (
                    <FlexCTA
                      label={`14 gün · ${data.listing.rentPrice14d}`}
                      onPress={() => onRent('rent_14d')}
                      disabled={actionLoading}
                    />
                  )}
                  {data.listing.rentPrice30d && (
                    <FlexCTA
                      label={`30 gün · ${data.listing.rentPrice30d}`}
                      onPress={() => onRent('rent_30d')}
                      disabled={actionLoading}
                      primary
                    />
                  )}
                </View>
              )}

              {/* Satın alma */}
              {data.listing.buyEnabled && data.listing.buyPrice && (
                <CTAButton
                  label={`Satın al · ${data.listing.buyPrice} credit`}
                  variant="outline"
                  onPress={() => onRent('outright_buy')}
                  disabled={actionLoading}
                />
              )}

              {/* Gift CTA — kira'ya eşit ağırlıkta secondary buton */}
              <Pressable
                onPress={onGift}
                disabled={actionLoading}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: C.accentSoft,
                  paddingVertical: 14,
                  borderRadius: 14,
                  marginTop: 6,
                  minHeight: 52,
                  opacity: actionLoading ? 0.5 : 1,
                }}
              >
                <SymbolView name="gift.fill" tintColor={C.accent} size={16} />
                <Text
                  style={{
                    fontFamily: font.bold,
                    fontSize: 15,
                    color: C.accent,
                    letterSpacing: -0.2,
                  }}
                >
                  Bir arkadaşına hediye et
                </Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      <BoostSheet
        ref={boostSheetRef}
        onPurchased={() => {
          refresh();
        }}
      />

      <GiftSheet ref={giftSheetRef} />
    </>
  );
}

function Stat({
  label,
  value,
  icon,
  iconColor,
}: {
  label: string;
  value: string;
  icon: string;
  iconColor: string;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <SymbolView name={icon as any} tintColor={iconColor} size={14} />
        <Text style={{ fontFamily: font.bold, fontSize: 17, color: C.text }}>{value}</Text>
      </View>
      <Text style={{ fontFamily: font.regular, fontSize: 11, color: C.textMuted, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 28 }}>
      <Text style={{ fontFamily: font.semibold, fontSize: 17, color: C.text, marginBottom: 12 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function CTAButton({
  label,
  onPress,
  variant,
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled}>
      {({ pressed }) => (
        <View
          style={{
            backgroundColor:
              variant === 'primary'
                ? C.accent
                : variant === 'secondary'
                  ? C.surface
                  : 'transparent',
            borderWidth: variant === 'outline' ? 1 : 0,
            borderColor: C.accent,
            borderRadius: 14,
            paddingVertical: 15,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 52,
            opacity: pressed || disabled ? 0.85 : 1,
          }}
        >
          <Text
            style={{
              fontFamily: font.semibold,
              fontSize: 15,
              color: variant === 'primary' ? '#FFFFFF' : C.accent,
            }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function FlexCTA({
  label,
  onPress,
  primary,
  disabled,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ flex: 1 }}>
      {({ pressed }) => (
        <View
          style={{
            backgroundColor: primary ? C.accent : C.card,
            borderWidth: primary ? 0 : 1,
            borderColor: C.border,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            minHeight: 50,
            opacity: pressed || disabled ? 0.85 : 1,
          }}
        >
          <Text
            style={{
              fontFamily: font.semibold,
              fontSize: 14,
              color: primary ? '#FFFFFF' : C.text,
            }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function SimilarRow({
  listings,
  onPressItem,
}: {
  listings: {
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
    averageRating: number | null;
    isBoosted: boolean;
  }[];
  onPressItem: (id: string) => void;
}) {
  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          fontFamily: font.bold,
          fontSize: 22,
          color: C.text,
          paddingHorizontal: 20,
          paddingBottom: 4,
          letterSpacing: -0.3,
        }}
      >
        Bunlar da hoşuna gidebilir
      </Text>
      <Text
        style={{
          fontFamily: font.regular,
          fontSize: 13,
          color: C.textMuted,
          paddingHorizontal: 20,
          paddingBottom: 12,
        }}
      >
        Aynı kategoride trend olanlar
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {listings.map((l) => (
          <Pressable
            key={l.id}
            onPress={() => onPressItem(l.id)}
            style={{
              width: 150,
              backgroundColor: C.card,
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: 150,
                height: 180,
                backgroundColor: C.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {l.character.avatarUrl ? (
                <Image
                  source={{ uri: l.character.avatarUrl }}
                  style={{ width: 150, height: 180 }}
                  contentFit="cover"
                />
              ) : (
                <SymbolView name="person.fill" tintColor={C.textMuted} size={42} />
              )}
              {l.isBoosted && (
                <View
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    backgroundColor: '#FFCC00',
                    paddingHorizontal: 6,
                    paddingVertical: 3,
                    borderRadius: 6,
                  }}
                >
                  <SymbolView name="bolt.fill" tintColor="#1C1C1E" size={9} />
                  <Text
                    style={{
                      fontFamily: font.bold,
                      fontSize: 9,
                      color: '#1C1C1E',
                      letterSpacing: 0.3,
                    }}
                  >
                    BOOST
                  </Text>
                </View>
              )}
            </View>
            <View style={{ padding: 10 }}>
              <Text
                numberOfLines={1}
                style={{ fontFamily: font.bold, fontSize: 14, color: C.text, letterSpacing: -0.2 }}
              >
                {l.character.name}
              </Text>
              <Text
                numberOfLines={1}
                style={{ fontFamily: font.regular, fontSize: 11, color: C.textMuted, marginTop: 2 }}
              >
                {l.character.age}
                {l.character.hometown ? ` · ${l.character.hometown}` : ''}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                {l.averageRating != null && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <SymbolView name="star.fill" tintColor="#FFCC00" size={9} />
                    <Text style={{ fontFamily: font.semibold, fontSize: 11, color: C.text }}>
                      {l.averageRating.toFixed(1)}
                    </Text>
                  </View>
                )}
                {l.rentPrice7d != null && (
                  <Text style={{ fontFamily: font.semibold, fontSize: 11, color: C.accent }}>
                    {l.rentPrice7d} cr
                  </Text>
                )}
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function getRentPrice(listing: any, type: RentalType): number {
  if (type === 'rent_7d') return listing.rentPrice7d ?? 0;
  if (type === 'rent_14d') return listing.rentPrice14d ?? 0;
  if (type === 'rent_30d') return listing.rentPrice30d ?? 0;
  return listing.buyPrice ?? 0;
}

function getDays(type: RentalType): number {
  if (type === 'rent_7d') return 7;
  if (type === 'rent_14d') return 14;
  if (type === 'rent_30d') return 30;
  return 0;
}

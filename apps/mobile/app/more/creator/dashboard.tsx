/**
 * V4.8 Faz F — Yaratıcı Dashboard
 *
 * Apple App Store Connect tarzı yönetim paneli:
 *   - Üstte toplam kazanç + tier progress
 *   - Bugün satırı (demo / kira / görüntülenme)
 *   - Karakter listingleri kart (boost rozeti + "Öne Çıkar" CTA)
 *   - Son kiralamalar listesi
 */

import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { C, font } from '../../../lib/theme';
import { useCreatorsApi, type CreatorDashboard } from '../../../lib/marketplace/creatorsApi';
import { BoostSheet, type BoostSheetRef } from '../../../components/marketplace/BoostSheet';

const TIER_COLOR: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#A8A8A8',
  gold: '#FFCC00',
  platinum: '#5E5CE6',
};

const TIER_LABEL: Record<string, string> = {
  bronze: 'Bronz',
  silver: 'Gümüş',
  gold: 'Altın',
  platinum: 'Platin',
};

export default function CreatorDashboardScreen() {
  const router = useRouter();
  const api = useCreatorsApi();
  const apiRef = useRef(api);
  apiRef.current = api;
  const boostSheetRef = useRef<BoostSheetRef>(null);

  const [data, setData] = useState<CreatorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    const d = await apiRef.current.getDashboard();
    setData(d);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Stüdyo',
          headerBackTitle: 'Geri',
          headerTitleStyle: { fontFamily: font.bold, fontSize: 17, color: C.text } as any,
        }}
      />

      {loading && !data ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: C.page,
          }}
        >
          <ActivityIndicator color={C.accent} />
        </View>
      ) : !data ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: C.page,
            paddingHorizontal: 32,
          }}
        >
          <SymbolView name="exclamationmark.triangle" tintColor={C.textMuted} size={36} />
          <Text
            style={{
              fontFamily: font.bold,
              fontSize: 17,
              color: C.text,
              marginTop: 12,
              textAlign: 'center',
            }}
          >
            Dashboard yüklenemedi
          </Text>
          <Text
            style={{
              fontFamily: font.regular,
              fontSize: 14,
              color: C.textMuted,
              marginTop: 6,
              textAlign: 'center',
            }}
          >
            Yaratıcı profilin yoksa önce bir karakter yayınlamalısın.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1, backgroundColor: C.page }}
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
          {/* Hero — toplam kazanç + tier */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            <Text
              style={{
                fontFamily: font.semibold,
                fontSize: 12,
                color: C.textMuted,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              Toplam Kazanç
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <Text
                style={{
                  fontFamily: font.extrabold,
                  fontSize: 40,
                  color: C.text,
                  letterSpacing: -1,
                }}
              >
                {data.summary.totalEarnings.toLocaleString('tr-TR')}
              </Text>
              <Text style={{ fontFamily: font.semibold, fontSize: 16, color: C.textMuted }}>
                kredi
              </Text>
            </View>

            {/* Tier progress */}
            <TierBar tier={data.summary.tier} />
          </View>

          {/* Bugün */}
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <SectionTitle text="Bugün" />
            <View
              style={{
                flexDirection: 'row',
                marginTop: 8,
                backgroundColor: C.card,
                borderRadius: 16,
                paddingVertical: 16,
              }}
            >
              <TodayBlock label="Görüntülenme" value={data.summary.today.views} icon="eye.fill" />
              <Divider />
              <TodayBlock label="Demo" value={data.summary.today.demos} icon="bubble.left.fill" />
              <Divider />
              <TodayBlock label="Kira" value={data.summary.today.rentals} icon="cart.fill" />
            </View>
          </View>

          {/* Aktif kira */}
          {data.summary.activeRentals > 0 && (
            <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: '#30D15822',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <SymbolView name="person.2.fill" tintColor="#30D158" size={18} />
                <Text style={{ fontFamily: font.semibold, fontSize: 14, color: C.text, flex: 1 }}>
                  Şu an{' '}
                  <Text style={{ fontFamily: font.extrabold, color: '#30D158' }}>
                    {data.summary.activeRentals}
                  </Text>{' '}
                  kişi karakterlerinle konuşuyor
                </Text>
              </View>
            </View>
          )}

          {/* Karakterlerim */}
          <View style={{ marginTop: 28 }}>
            <View style={{ paddingHorizontal: 20 }}>
              <SectionTitle text="Karakterlerim" />
            </View>
            {data.listings.length === 0 ? (
              <Text
                style={{
                  fontFamily: font.regular,
                  fontSize: 14,
                  color: C.textMuted,
                  paddingHorizontal: 20,
                  paddingVertical: 18,
                }}
              >
                Henüz yayınlanmış karakterin yok.
              </Text>
            ) : (
              data.listings.map((l) => (
                <ListingRow
                  key={l.id}
                  listing={l}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/more/market/listing/${l.id}` as any);
                  }}
                  onBoost={() => {
                    Haptics.selectionAsync();
                    boostSheetRef.current?.open(l.id);
                  }}
                />
              ))
            )}
          </View>

          {/* Son Kiralamalar */}
          {data.recentRentals.length > 0 && (
            <View style={{ marginTop: 28 }}>
              <View style={{ paddingHorizontal: 20 }}>
                <SectionTitle text="Son Kiralamalar" />
              </View>
              {data.recentRentals.map((r) => (
                <View
                  key={r.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: r.status === 'active' ? '#30D15822' : C.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SymbolView
                      name={r.status === 'active' ? 'play.fill' : 'checkmark'}
                      tintColor={r.status === 'active' ? '#30D158' : C.textMuted}
                      size={14}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      numberOfLines={1}
                      style={{ fontFamily: font.semibold, fontSize: 14, color: C.text }}
                    >
                      {r.characterName}
                    </Text>
                    <Text
                      style={{
                        fontFamily: font.regular,
                        fontSize: 11,
                        color: C.textMuted,
                        marginTop: 1,
                      }}
                    >
                      {formatDate(r.startedAt)}
                      {r.rating != null ? ` · ${r.rating}★` : ''}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: font.bold, fontSize: 14, color: '#30D158' }}>
                    +{r.earning} cr
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <BoostSheet
        ref={boostSheetRef}
        onPurchased={() => {
          refresh();
        }}
      />
    </>
  );
}

function SectionTitle({ text }: { text: string }) {
  return (
    <Text
      style={{
        fontFamily: font.bold,
        fontSize: 22,
        color: C.text,
        letterSpacing: -0.3,
      }}
    >
      {text}
    </Text>
  );
}

function TierBar({ tier }: { tier: CreatorDashboard['summary']['tier'] }) {
  const color = TIER_COLOR[tier.current] ?? C.accent;
  const label = TIER_LABEL[tier.current] ?? tier.current;
  const nextLabel = tier.next ? (TIER_LABEL[tier.next] ?? tier.next) : null;
  return (
    <View
      style={{
        marginTop: 14,
        backgroundColor: C.card,
        borderRadius: 14,
        padding: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <SymbolView name="checkmark.seal.fill" tintColor={color} size={16} />
        <Text style={{ fontFamily: font.bold, fontSize: 14, color, letterSpacing: 0.3 }}>
          {label.toUpperCase()}
        </Text>
        {nextLabel && (
          <>
            <View style={{ flex: 1 }} />
            <Text style={{ fontFamily: font.regular, fontSize: 12, color: C.textMuted }}>
              {nextLabel}'a {tier.remainingEarnings} cr kaldı
            </Text>
          </>
        )}
      </View>
      <View
        style={{
          height: 6,
          backgroundColor: C.surface,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${Math.min(100, Math.max(0, tier.progress * 100))}%`,
            height: '100%',
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

function TodayBlock({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <SymbolView name={icon as any} tintColor={C.accent} size={16} />
      <Text
        style={{
          fontFamily: font.extrabold,
          fontSize: 22,
          color: C.text,
          marginTop: 4,
          letterSpacing: -0.4,
        }}
      >
        {value}
      </Text>
      <Text style={{ fontFamily: font.regular, fontSize: 11, color: C.textMuted, marginTop: 1 }}>
        {label}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={{ width: 1, backgroundColor: C.border, marginVertical: 4 }} />;
}

function ListingRow({
  listing,
  onPress,
  onBoost,
}: {
  listing: CreatorDashboard['listings'][number];
  onPress: () => void;
  onBoost: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: pressed ? C.surface : 'transparent',
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            backgroundColor: C.surface,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {listing.character.avatarUrl ? (
            <Image
              source={{ uri: listing.character.avatarUrl }}
              style={{ width: 56, height: 56 }}
              contentFit="cover"
            />
          ) : (
            <SymbolView name="person.fill" tintColor={C.textMuted} size={24} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              numberOfLines={1}
              style={{ fontFamily: font.bold, fontSize: 16, color: C.text, flexShrink: 1 }}
            >
              {listing.character.name}
            </Text>
            {listing.isBoosted && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  backgroundColor: '#FFCC00',
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: 5,
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
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <Text style={{ fontFamily: font.regular, fontSize: 11, color: C.textMuted }}>
              {listing.totalViews} görüntülenme
            </Text>
            <Text style={{ fontFamily: font.regular, fontSize: 11, color: C.textMuted }}>
              {listing.totalRentals} kira
            </Text>
            {listing.averageRating != null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <SymbolView name="star.fill" tintColor="#FFCC00" size={9} />
                <Text style={{ fontFamily: font.semibold, fontSize: 11, color: C.text }}>
                  {listing.averageRating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
          <Text style={{ fontFamily: font.semibold, fontSize: 12, color: '#30D158', marginTop: 4 }}>
            {listing.totalEarnings} cr kazandırdı
          </Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onBoost();
          }}
          hitSlop={8}
          style={({ pressed }) => ({
            backgroundColor: listing.isBoosted ? '#FFCC0022' : C.accentSoft,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <SymbolView
              name="bolt.fill"
              tintColor={listing.isBoosted ? '#FFCC00' : C.accent}
              size={11}
            />
            <Text
              style={{
                fontFamily: font.bold,
                fontSize: 12,
                color: listing.isBoosted ? '#1C1C1E' : C.accent,
              }}
            >
              {listing.isBoosted ? 'Uzat' : 'Öne Çıkar'}
            </Text>
          </View>
        </Pressable>
      </View>
    </Pressable>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffH = (now - d.getTime()) / (60 * 60 * 1000);
  if (diffH < 1) return 'biraz önce';
  if (diffH < 24) return `${Math.floor(diffH)} saat önce`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} gün önce`;
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

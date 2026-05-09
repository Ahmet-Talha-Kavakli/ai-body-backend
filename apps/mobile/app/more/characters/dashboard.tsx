/**
 * V4.8 Faz D — Yaratıcı Dashboard
 *
 * Kazanç, aktif listings, son kiralar.
 */

import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useSession } from '@clerk/expo';
import { C, font } from '../../../lib/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

interface DashboardData {
  summary: {
    totalCharacters: number;
    totalListings: number;
    activeListings: number;
    totalEarnings: number;
    activeRentals: number;
    totalViews: number;
    tier?: {
      current: { tier: string; label: string; emoji: string; color: string };
      next: {
        tier: string;
        label: string;
        emoji: string;
        color: string;
        minEarnings: number;
      } | null;
      progress: number;
      remainingEarnings: number;
    };
    today?: { demos: number; rentals: number; views: number };
  };
  listings: any[];
  recentRentals: any[];
}

export default function DashboardScreen() {
  const router = useRouter();
  const { session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const refresh = useCallback(async () => {
    const token = await sessionRef.current?.getToken();
    const r = await fetch(`${API_URL}/api/creator/dashboard`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (r.ok) setData(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.page }}
      >
        <Stack.Screen options={{ title: 'Dashboard' }} />
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (!data) return null;

  return (
    <>
      <Stack.Screen options={{ title: 'Yaratıcı Paneli' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: C.page }}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Kazanç hero */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            backgroundColor: C.accent,
            borderRadius: 20,
            padding: 22,
          }}
        >
          <Text style={{ fontFamily: font.regular, fontSize: 13, color: '#FFFFFFCC' }}>
            Toplam kazanç
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
            <Text
              style={{
                fontFamily: font.extrabold,
                fontSize: 40,
                color: '#FFFFFF',
                letterSpacing: -1,
              }}
            >
              {data.summary.totalEarnings}
            </Text>
            <Text style={{ fontFamily: font.semibold, fontSize: 14, color: '#FFFFFFCC' }}>
              credit
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
            <MiniStat label="Karakter" value={data.summary.totalCharacters} />
            <MiniStat label="Aktif kira" value={data.summary.activeRentals} />
            <MiniStat label="Listing" value={data.summary.activeListings} />
            <MiniStat label="Görüntülenme" value={data.summary.totalViews ?? 0} />
          </View>
        </View>

        {/* Tier rozeti */}
        {data.summary.tier && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              backgroundColor: C.card,
              borderRadius: 18,
              padding: 18,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: data.summary.tier.current.color + '22',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 26 }}>{data.summary.tier.current.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: font.bold, fontSize: 16, color: C.text }}>
                  {data.summary.tier.current.label} Yaratıcı
                </Text>
                {data.summary.tier.next ? (
                  <Text
                    style={{
                      fontFamily: font.regular,
                      fontSize: 12,
                      color: C.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {data.summary.tier.next.label}'a {data.summary.tier.remainingEarnings} credit
                    kaldı
                  </Text>
                ) : (
                  <Text
                    style={{
                      fontFamily: font.regular,
                      fontSize: 12,
                      color: C.success,
                      marginTop: 2,
                    }}
                  >
                    En yüksek seviyedesin 🎉
                  </Text>
                )}
              </View>
            </View>
            {data.summary.tier.next && (
              <View
                style={{
                  marginTop: 12,
                  height: 6,
                  backgroundColor: C.well,
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${data.summary.tier.progress * 100}%`,
                    height: 6,
                    backgroundColor: data.summary.tier.current.color,
                  }}
                />
              </View>
            )}
          </View>
        )}

        {/* Bugün özeti */}
        {data.summary.today &&
          data.summary.today.views + data.summary.today.demos + data.summary.today.rentals > 0 && (
            <View
              style={{
                marginHorizontal: 16,
                marginTop: 12,
                backgroundColor: C.card,
                borderRadius: 18,
                padding: 18,
              }}
            >
              <Text
                style={{
                  fontFamily: font.semibold,
                  fontSize: 13,
                  color: C.textMuted,
                  letterSpacing: 0.4,
                  marginBottom: 10,
                }}
              >
                BUGÜN
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <TodayStat
                  icon="eye"
                  iconColor={C.info}
                  label="Görüntülenme"
                  value={data.summary.today.views}
                />
                <TodayStat
                  icon="play.fill"
                  iconColor={C.success}
                  label="Demo"
                  value={data.summary.today.demos}
                />
                <TodayStat
                  icon="bag.fill"
                  iconColor={C.accent}
                  label="Kira"
                  value={data.summary.today.rentals}
                />
              </View>
            </View>
          )}

        {/* Listings */}
        {data.listings.length > 0 && (
          <Section title="Markette">
            <View style={{ backgroundColor: C.card, borderRadius: 14, overflow: 'hidden' }}>
              {data.listings.map((l, i) => (
                <Pressable
                  key={l.id}
                  onPress={() => router.push(`/more/characters/${l.character.id}/listing` as any)}
                >
                  {({ pressed }) => (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderBottomWidth:
                          i < data.listings.length - 1 ? StyleSheet.hairlineWidth : 0,
                        borderBottomColor: C.hairline,
                        backgroundColor: pressed ? C.surface : 'transparent',
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          backgroundColor: C.well,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <SymbolView name="person.fill" tintColor={C.textMuted} size={20} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: font.semibold, fontSize: 15, color: C.text }}>
                          {l.character.name}
                        </Text>
                        <Text
                          style={{
                            fontFamily: font.regular,
                            fontSize: 12,
                            color: C.textMuted,
                            marginTop: 2,
                          }}
                        >
                          {l.totalViews ?? 0} görüntülenme · {l.totalRentals} kira ·{' '}
                          {l.totalEarnings} cr
                        </Text>
                      </View>
                      {l.isBoosted && (
                        <View
                          style={{
                            backgroundColor: '#FF9F0A22',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 5,
                            marginRight: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: font.bold,
                              fontSize: 9,
                              color: '#FF9F0A',
                              letterSpacing: 0.4,
                            }}
                          >
                            BOOST
                          </Text>
                        </View>
                      )}
                      <SymbolView name="chevron.right" tintColor={C.textDim} size={13} />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </Section>
        )}

        {/* Recent rentals */}
        {data.recentRentals.length > 0 && (
          <Section title="Son Kiralar">
            <View style={{ backgroundColor: C.card, borderRadius: 14, overflow: 'hidden' }}>
              {data.recentRentals.map((r, i) => (
                <View
                  key={r.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderBottomWidth:
                      i < data.recentRentals.length - 1 ? StyleSheet.hairlineWidth : 0,
                    borderBottomColor: C.hairline,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: font.semibold, fontSize: 14, color: C.text }}>
                      {r.characterName}
                    </Text>
                    <Text
                      style={{
                        fontFamily: font.regular,
                        fontSize: 12,
                        color: C.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {r.type === 'outright_buy' ? 'Satın alma' : `${getDays(r.type)} gün kira`}
                      {r.rating ? ` · ${'★'.repeat(r.rating)}` : ''}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: font.bold, fontSize: 15, color: C.success }}>
                    +{r.earning}
                  </Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {data.listings.length === 0 && (
          <View style={{ paddingHorizontal: 32, paddingTop: 60, alignItems: 'center' }}>
            <SymbolView name="storefront" tintColor={C.textMuted} size={48} />
            <Text style={{ fontFamily: font.bold, fontSize: 18, color: C.text, marginTop: 12 }}>
              Henüz listing yok
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
              Bir karakter yarat, "Markete koy" ile yayınla, fiyat belirle.
            </Text>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </>
  );
}

function TodayStat({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: number;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: iconColor + '22',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
        }}
      >
        <SymbolView name={icon as any} tintColor={iconColor} size={16} />
      </View>
      <Text style={{ fontFamily: font.bold, fontSize: 18, color: C.text }}>{value}</Text>
      <Text style={{ fontFamily: font.regular, fontSize: 11, color: C.textMuted, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <View>
      <Text style={{ fontFamily: font.bold, fontSize: 16, color: '#FFFFFF' }}>{value}</Text>
      <Text style={{ fontFamily: font.regular, fontSize: 11, color: '#FFFFFFCC', marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
      <Text
        style={{
          fontFamily: font.semibold,
          fontSize: 13,
          color: C.textMuted,
          marginBottom: 8,
          letterSpacing: 0.4,
          paddingHorizontal: 4,
        }}
      >
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function getDays(type: string): number {
  if (type === 'rent_7d') return 7;
  if (type === 'rent_14d') return 14;
  if (type === 'rent_30d') return 30;
  return 0;
}

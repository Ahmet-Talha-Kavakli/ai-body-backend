/**
 * V4.8 Faz D — Credit Bakiye + Geçmiş
 */

import { Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { C, font } from '../../../lib/theme';
import { useMarketApi, type CreditInfo } from '../../../lib/marketplace/marketApi';

const REASON_LABEL: Record<string, string> = {
  rental_payment: 'Kira ödemesi',
  rental_earning: 'Kira kazancı',
  commission: 'Komisyon',
  iap_topup: 'Yükleme',
  boost: 'Öne çıkarma',
  listing_fee: 'Listing ücreti',
  insurance: 'Sigorta',
};

export default function CreditsScreen() {
  const api = useMarketApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [info, setInfo] = useState<CreditInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const r = await apiRef.current.credits();
    if (r) setInfo(r);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <>
      <Stack.Screen options={{ title: 'Bakiyem' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: C.page }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            backgroundColor: C.accent,
            borderRadius: 20,
            padding: 24,
            alignItems: 'center',
          }}
        >
          <SymbolView name="bolt.fill" tintColor="#FFFFFF" size={28} />
          <Text
            style={{ fontFamily: font.regular, fontSize: 14, color: '#FFFFFFCC', marginTop: 8 }}
          >
            Mevcut bakiye
          </Text>
          <Text
            style={{
              fontFamily: font.extrabold,
              fontSize: 48,
              color: '#FFFFFF',
              letterSpacing: -1,
            }}
          >
            {loading ? '—' : (info?.balance ?? 0)}
          </Text>
          <Text style={{ fontFamily: font.medium, fontSize: 13, color: '#FFFFFFCC', marginTop: 2 }}>
            credit
          </Text>
        </View>

        <Text
          style={{
            fontFamily: font.semibold,
            fontSize: 13,
            color: C.textMuted,
            paddingHorizontal: 32,
            paddingTop: 28,
            paddingBottom: 8,
            letterSpacing: 0.4,
          }}
        >
          SON HAREKETLER
        </Text>

        {loading ? (
          <ActivityIndicator color={C.accent} style={{ marginTop: 20 }} />
        ) : info && info.recent.length > 0 ? (
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: C.card,
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            {info.recent.map((entry, i) => (
              <View
                key={entry.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderBottomWidth: i < info.recent.length - 1 ? StyleSheet.hairlineWidth : 0,
                  borderBottomColor: C.hairline,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: entry.delta > 0 ? C.successBg : C.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <SymbolView
                    name={entry.delta > 0 ? 'arrow.down' : 'arrow.up'}
                    tintColor={entry.delta > 0 ? C.success : C.textMuted}
                    size={14}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: font.semibold, fontSize: 14, color: C.text }}>
                    {REASON_LABEL[entry.reason] ?? entry.reason}
                  </Text>
                  <Text
                    style={{
                      fontFamily: font.regular,
                      fontSize: 12,
                      color: C.textMuted,
                      marginTop: 1,
                    }}
                  >
                    {new Date(entry.createdAt).toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: font.bold,
                    fontSize: 15,
                    color: entry.delta > 0 ? C.success : C.text,
                  }}
                >
                  {entry.delta > 0 ? '+' : ''}
                  {entry.delta}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text
            style={{
              fontFamily: font.regular,
              fontSize: 14,
              color: C.textMuted,
              textAlign: 'center',
              marginTop: 30,
            }}
          >
            Henüz hareket yok
          </Text>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </>
  );
}

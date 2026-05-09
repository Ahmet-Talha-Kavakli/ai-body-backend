/**
 * V4.8 Faz E — Yolculuk Anı Kartı (kira sonu)
 *
 * Kira bittikten sonra üretilir. Spotify Wrapped tarzı.
 * Avatar + "X gün, Y mesaj" + "en duygusal an" alıntı + closeness peak.
 */

import { forwardRef } from 'react';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { C, font } from '../../lib/theme';

export interface MemoryCardData {
  characterName: string;
  characterAvatar?: string | null;
  days: number;
  totalMessages: number;
  closenessPeak?: number | null;
  highlightQuote?: string | null;
  highlightDate?: string | null;
}

export const MemoryCard = forwardRef<View, { data: MemoryCardData }>(({ data }, ref) => {
  return (
    <View
      ref={ref}
      collapsable={false}
      style={{
        width: 360,
        height: 640,
        borderRadius: 32,
        overflow: 'hidden',
        backgroundColor: '#1A1A2E',
      }}
    >
      {/* Üst — koyu arka plan + avatar */}
      <View
        style={{
          backgroundColor: '#1A1A2E',
          paddingTop: 50,
          paddingBottom: 30,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: font.semibold,
            fontSize: 13,
            color: '#FFFFFF66',
            letterSpacing: 2,
            marginBottom: 24,
          }}
        >
          YOLCULUĞUN
        </Text>
        <View
          style={{
            width: 110,
            height: 110,
            borderRadius: 24,
            backgroundColor: '#FFFFFF11',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderWidth: 3,
            borderColor: '#FFFFFF22',
          }}
        >
          {data.characterAvatar ? (
            <Image source={{ uri: data.characterAvatar }} style={{ width: 110, height: 110 }} />
          ) : (
            <SymbolView name="person.fill" tintColor="#FFFFFF44" size={50} />
          )}
        </View>
        <Text
          style={{
            fontFamily: font.extrabold,
            fontSize: 32,
            color: '#FFFFFF',
            marginTop: 18,
            letterSpacing: -0.5,
          }}
        >
          {data.characterName}
        </Text>
      </View>

      {/* Stats */}
      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: 20,
          marginTop: 20,
          backgroundColor: '#FFFFFF11',
          borderRadius: 18,
          paddingVertical: 18,
          justifyContent: 'space-around',
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: font.extrabold, fontSize: 28, color: '#7C6FF7' }}>
            {data.days}
          </Text>
          <Text
            style={{ fontFamily: font.regular, fontSize: 11, color: '#FFFFFF99', marginTop: 2 }}
          >
            GÜN
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: font.extrabold, fontSize: 28, color: '#7C6FF7' }}>
            {data.totalMessages}
          </Text>
          <Text
            style={{ fontFamily: font.regular, fontSize: 11, color: '#FFFFFF99', marginTop: 2 }}
          >
            MESAJ
          </Text>
        </View>
        {data.closenessPeak != null && (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: font.extrabold, fontSize: 28, color: '#7C6FF7' }}>
              {data.closenessPeak}
            </Text>
            <Text
              style={{ fontFamily: font.regular, fontSize: 11, color: '#FFFFFF99', marginTop: 2 }}
            >
              YAKINLIK
            </Text>
          </View>
        )}
      </View>

      {/* Highlight quote */}
      {data.highlightQuote && (
        <View
          style={{
            marginHorizontal: 24,
            marginTop: 26,
            padding: 20,
            backgroundColor: '#FFFFFF08',
            borderRadius: 20,
            borderLeftWidth: 3,
            borderLeftColor: '#7C6FF7',
          }}
        >
          <Text
            style={{
              fontFamily: font.regular,
              fontSize: 12,
              color: '#FFFFFF66',
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            EN DUYGUSAL AN
            {data.highlightDate ? ` · ${data.highlightDate}` : ''}
          </Text>
          <Text
            style={{
              fontFamily: font.medium,
              fontSize: 15,
              color: '#FFFFFF',
              lineHeight: 22,
              fontStyle: 'italic',
            }}
            numberOfLines={4}
          >
            "{data.highlightQuote}"
          </Text>
        </View>
      )}

      {/* Footer */}
      <View
        style={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: font.bold,
            fontSize: 13,
            color: '#FFFFFF77',
            letterSpacing: 0.5,
          }}
        >
          FitAI
        </Text>
      </View>
    </View>
  );
});

MemoryCard.displayName = 'MemoryCard';

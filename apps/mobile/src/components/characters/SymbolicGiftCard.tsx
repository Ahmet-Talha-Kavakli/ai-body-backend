/**
 * V4.7 Faz 7 E1 — Sembolik hediye kartı
 *
 * `attachments.kind === 'symbolic_gift'` mesajları için.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { font, C } from '../../../lib/theme';

interface Props {
  giftType: string;
  occasion: string;
  content: string;
}

const GIFT_EMOJI: Record<string, string> = {
  virtual_coffee: '☕',
  flower: '🌸',
  note: '📝',
  song_dedication: '🎵',
};

const OCCASION_LABEL: Record<string, string> = {
  birthday: 'Doğum günü',
  anniversary: 'Yıl dönümü',
  special_moment: 'Özel an',
  comeback: 'Geri dönüş',
};

export function SymbolicGiftCard({ giftType, occasion, content }: Props) {
  const emoji = GIFT_EMOJI[giftType] ?? '🎁';
  const occasionLabel = OCCASION_LABEL[occasion] ?? occasion;

  return (
    <View
      style={{
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 16,
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.borderStrong,
        padding: 16,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 40, marginBottom: 8 }}>{emoji}</Text>
      <Text
        style={{
          fontFamily: font.semibold,
          fontSize: 12,
          color: C.accent,
          letterSpacing: 0.5,
          marginBottom: 8,
        }}
      >
        {occasionLabel.toUpperCase()}
      </Text>
      <Text
        style={{
          fontFamily: font.regular,
          fontSize: 15,
          lineHeight: 21,
          color: C.text,
          textAlign: 'center',
        }}
      >
        {content}
      </Text>
    </View>
  );
}

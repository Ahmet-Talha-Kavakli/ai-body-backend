/**
 * V4.7 Faz 7 E2 — Yıl dönümü mektubu kart UI
 *
 * `attachments.kind === 'anniversary_letter'` mesajları için özel görünüm.
 * Klasik mesaj balonundan ayrılır — özel tasarımlı kart.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { font, C } from '../../../lib/theme';

interface Props {
  characterName: string;
  year: number;
  content: string;
  createdAt: string;
}

export function AnniversaryLetterCard({ characterName, year, content, createdAt }: Props) {
  const date = new Date(createdAt).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <View
      style={{
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 18,
        backgroundColor: C.accentSoft,
        borderWidth: 1,
        borderColor: C.borderStrong,
        padding: 18,
        shadowColor: C.accent,
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ fontSize: 20, marginRight: 8 }}>💌</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: font.bold,
              fontSize: 14,
              color: C.accent,
              letterSpacing: 0.3,
            }}
          >
            {year}. YILIMIZ
          </Text>
          <Text
            style={{ fontFamily: font.regular, fontSize: 11, color: C.textMuted, marginTop: 2 }}
          >
            {characterName} — {date}
          </Text>
        </View>
      </View>

      <View
        style={{
          height: 1,
          backgroundColor: C.borderStrong,
          marginBottom: 12,
          opacity: 0.5,
        }}
      />

      <Text
        style={{
          fontFamily: font.regular,
          fontSize: 15,
          lineHeight: 22,
          color: C.text,
        }}
      >
        {content}
      </Text>
    </View>
  );
}

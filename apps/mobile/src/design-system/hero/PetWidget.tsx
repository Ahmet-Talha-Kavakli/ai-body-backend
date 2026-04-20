import React from 'react';
import { View } from 'react-native';
import { DSText } from '../primitives/Text';
import { spacing } from '../tokens/spacing';

type PetMood = 'happy' | 'sad' | 'angry' | 'tired' | 'sick' | 'energetic';

const MOOD_EMOJI: Record<PetMood, string> = {
  happy: '😺',
  sad: '😿',
  angry: '😾',
  tired: '🙀',
  sick: '🤒',
  energetic: '😸',
};

type PetWidgetProps = {
  mood: PetMood;
  size?: number;
};

export function PetWidget({ mood, size = 60 }: PetWidgetProps) {
  return (
    <View style={{ alignItems: 'center', gap: spacing[1] }}>
      <DSText style={{ fontSize: size }}>{MOOD_EMOJI[mood]}</DSText>
    </View>
  );
}

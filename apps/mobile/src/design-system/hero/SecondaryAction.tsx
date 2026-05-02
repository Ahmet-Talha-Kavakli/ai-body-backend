import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SecondaryActionProps {
  label: string;
  subtitle?: string;
  icon?: string;
  accentColor?: string;
  onPress?: () => void;
}

export function SecondaryAction({
  label,
  subtitle,
  icon = 'map-outline',
  accentColor = '#30D158',
  onPress,
}: SecondaryActionProps) {
  return (
    <Pressable style={({ pressed }) => [s.card, pressed && { opacity: 0.7 }]} onPress={onPress}>
      <View
        style={[
          s.iconWrap,
          { backgroundColor: accentColor + '22', borderColor: accentColor + '40' },
        ]}
      >
        <Ionicons name={icon as never} size={20} color={accentColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.label}>{label}</Text>
        {subtitle && <Text style={s.sub}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color="rgba(235,235,245,0.3)" />
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(84,84,88,0.65)',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  sub: { color: 'rgba(235,235,245,0.6)', fontSize: 13, marginTop: 1 },
});

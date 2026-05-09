/**
 * V4.8 Faz E — Karakterlerim Onboarding Tour
 *
 * Kullanıcının ilk Karakterlerim ziyaretinde çıkar.
 * 3 adımlı: yarat / markete koy / kazan.
 * AsyncStorage'da bir kez gösterilir.
 */

import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, font } from '../../lib/theme';

const STORAGE_KEY = 'mp_creator_onboarded_v1';

const STEPS = [
  {
    icon: 'person.crop.square.badge.plus',
    iconColor: '#5E5CE6',
    title: 'Karakter yarat',
    desc: 'Kişiliği, geçmişi, alışkanlıkları sen belirle. AI yardımcı olur, sen yönetirsin.',
  },
  {
    icon: 'storefront',
    iconColor: '#FF9F0A',
    title: 'Markete koy',
    desc: 'Kira fiyatı belirle, satılığa çıkar. Diğer kullanıcılar karakterinle tanışır.',
  },
  {
    icon: 'bolt.fill',
    iconColor: '#30D158',
    title: 'Kazanmaya başla',
    desc: 'Her kira için %70 sana kalır. Karakterin popüler olunca kazanç katlanır.',
  },
];

export function CreatorOnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((seen) => {
      if (!seen) setVisible(true);
    });
  }, []);

  const onNext = () => {
    Haptics.selectionAsync();
    if (step < STEPS.length - 1) setStep(step + 1);
    else onClose();
  };

  const onClose = () => {
    AsyncStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  const cur = STEPS[step];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: '#00000088',
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            backgroundColor: C.card,
            borderRadius: 24,
            padding: 28,
            alignItems: 'center',
          }}
        >
          {/* Progress dots */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 24 }}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === step ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === step ? C.accent : C.well,
                }}
              />
            ))}
          </View>

          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 22,
              backgroundColor: cur.iconColor + '22',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <SymbolView name={cur.icon as any} tintColor={cur.iconColor} size={40} />
          </View>

          <Text
            style={{
              fontFamily: font.bold,
              fontSize: 22,
              color: C.text,
              textAlign: 'center',
              marginBottom: 10,
            }}
          >
            {cur.title}
          </Text>
          <Text
            style={{
              fontFamily: font.regular,
              fontSize: 15,
              color: C.textMuted,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 24,
            }}
          >
            {cur.desc}
          </Text>

          <Pressable onPress={onNext} style={{ width: '100%' }}>
            {({ pressed }) => (
              <View
                style={{
                  backgroundColor: C.accent,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  minHeight: 50,
                  opacity: pressed ? 0.85 : 1,
                }}
              >
                <Text style={{ fontFamily: font.semibold, fontSize: 16, color: '#FFFFFF' }}>
                  {step < STEPS.length - 1 ? 'Devam' : 'Hadi başla'}
                </Text>
              </View>
            )}
          </Pressable>

          {step < STEPS.length - 1 && (
            <Pressable onPress={onClose} style={{ marginTop: 12 }}>
              <Text style={{ fontFamily: font.semibold, fontSize: 14, color: C.textMuted }}>
                Atla
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

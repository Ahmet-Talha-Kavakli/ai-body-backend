/**
 * V4.8 Faz A — Yeni karakter (Wizard giriş)
 *
 * Wizard ilk ekranı: temel kimlik (isim, yaş, cinsiyet, kategori).
 * Apple Pay tarzı bottom CTA + üstte progress dots.
 */

import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { C, font } from '../../../lib/theme';
import { useCharactersApi, type CharacterCategory } from '../../../lib/marketplace/charactersApi';

const CATEGORIES: { key: CharacterCategory; label: string; icon: string; desc: string }[] = [
  { key: 'friend', label: 'Arkadaş', icon: 'person.2.fill', desc: 'Günlük sohbet, derin bağ' },
  { key: 'mentor', label: 'Mentor', icon: 'graduationcap.fill', desc: 'Uzman bakış, yönlendirme' },
  { key: 'romantic', label: 'Romantik', icon: 'heart.fill', desc: 'Yaş doğrulamalı, yakın bağ' },
  { key: 'family', label: 'Aile figürü', icon: 'house.fill', desc: 'Anne, baba, kardeş, çocuk' },
  { key: 'fantasy', label: 'Hayali', icon: 'sparkles', desc: 'Anime, oyun, kurgu' },
  { key: 'professional', label: 'Profesyonel', icon: 'briefcase.fill', desc: 'Asistan, koç' },
];

const GENDERS = [
  { key: 'female', label: 'Kadın' },
  { key: 'male', label: 'Erkek' },
  { key: 'other', label: 'Diğer' },
];

export default function NewCharacterScreen() {
  const router = useRouter();
  const api = useCharactersApi();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [category, setCategory] = useState<CharacterCategory>('friend');
  const [creating, setCreating] = useState(false);

  const ageNum = parseInt(age, 10);
  const isValid =
    name.trim().length >= 2 && !isNaN(ageNum) && ageNum >= 18 && ageNum <= 99 && gender;

  const onContinue = async () => {
    if (!isValid || creating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCreating(true);
    const result = await api.createDraft({
      name: name.trim(),
      age: ageNum,
      gender: gender ?? undefined,
      category,
    });
    setCreating(false);
    if ('error' in result) {
      Alert.alert('Hata', result.error);
      return;
    }
    router.replace(`/more/characters/${result.character.id}/edit` as any);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: 'Yeni Karakter',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.cancelText}>İptal</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={styles.page}
        contentContainerStyle={{ paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.intro}>
          Önce temel bilgileri verelim. Sonra adım adım kişiliğini oluşturalım.
        </Text>

        <Section title="İsim">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Örn: Faruk"
            placeholderTextColor={C.textDim}
            style={styles.input}
            autoCapitalize="words"
            maxLength={32}
          />
        </Section>

        <Section title="Yaş" subtitle="18 ve üzeri">
          <TextInput
            value={age}
            onChangeText={setAge}
            placeholder="Örn: 27"
            placeholderTextColor={C.textDim}
            keyboardType="number-pad"
            style={styles.input}
            maxLength={2}
          />
        </Section>

        <Section title="Cinsiyet">
          <View style={styles.genderRow}>
            {GENDERS.map((g) => (
              <Pressable
                key={g.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setGender(g.key);
                }}
                style={[
                  styles.genderChip,
                  gender === g.key && { backgroundColor: C.accent, borderColor: C.accent },
                ]}
              >
                <Text style={[styles.genderText, gender === g.key && { color: '#FFFFFF' }]}>
                  {g.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="Kategori" subtitle="Karakterin tarzını belirler">
          <View style={styles.catGrid}>
            {CATEGORIES.map((c) => {
              const selected = category === c.key;
              return (
                <Pressable
                  key={c.key}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCategory(c.key);
                  }}
                  style={[
                    styles.catCard,
                    selected && { borderColor: C.accent, backgroundColor: C.accentSoft },
                  ]}
                >
                  <SymbolView
                    name={c.icon as any}
                    tintColor={selected ? C.accent : C.textMuted}
                    size={22}
                  />
                  <Text style={[styles.catLabel, selected && { color: C.accent }]}>{c.label}</Text>
                  <Text style={styles.catDesc}>{c.desc}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          onPress={onContinue}
          disabled={!isValid || creating}
          style={{
            backgroundColor: isValid && !creating ? C.accent : C.textDim,
            borderRadius: 16,
            paddingVertical: 18,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 56,
          }}
        >
          {creating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueText}>Devam et</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.page },
  intro: {
    fontFamily: font.regular,
    fontSize: 15,
    color: C.textMuted,
    paddingHorizontal: 20,
    paddingTop: 16,
    lineHeight: 22,
  },
  cancelText: { fontFamily: font.regular, fontSize: 16, color: C.accent },
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { fontFamily: font.semibold, fontSize: 17, color: C.text },
  sectionSubtitle: { fontFamily: font.regular, fontSize: 13, color: C.textMuted, marginTop: 2 },
  input: {
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: font.regular,
    fontSize: 17,
    color: C.text,
    minHeight: 52,
  },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  genderText: { fontFamily: font.semibold, fontSize: 15, color: C.text },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  catLabel: { fontFamily: font.semibold, fontSize: 15, color: C.text, marginTop: 8 },
  catDesc: { fontFamily: font.regular, fontSize: 12, color: C.textMuted, marginTop: 2 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.page,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.hairline,
  },
  continueText: { fontFamily: font.semibold, fontSize: 17, color: '#FFFFFF' },
});

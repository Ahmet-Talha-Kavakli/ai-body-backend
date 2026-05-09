/**
 * V4.8 Faz A — Karakter Düzenleme Ekranı
 *
 * Sadece draft veya private status'taki karakterler düzenlenir.
 * Yayında olan karakterde tüm alanlar read-only.
 *
 * Section'lar: Bio, Geçmiş, Aile, İlgiler, Değerler, Rutin, Bible Upload, Validation, Yayınla
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { C, font } from '../../../../lib/theme';
import { useCharactersApi } from '../../../../lib/marketplace/charactersApi';

export default function EditCharacterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useCharactersApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoadingField, setAiLoadingField] = useState<string | null>(null);
  const [validationLoading, setValidationLoading] = useState(false);

  // Düzenlenebilir alanlar (local state)
  const [bio, setBio] = useState('');
  const [hometown, setHometown] = useState('');
  const [coreValues, setCoreValues] = useState('');
  const [bibleText, setBibleText] = useState('');
  const [aiAlternatives, setAiAlternatives] = useState<{ field: string; alts: string[] } | null>(
    null,
  );
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    const c = await apiRef.current.getCharacter(id);
    if (c) {
      setCharacter(c);
      setBio(c.bio ?? '');
      setHometown(c.hometown ?? '');
      setCoreValues(Array.isArray(c.coreValues) ? c.coreValues.join(', ') : '');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const readOnly =
    character && character.publishStatus !== 'draft' && character.publishStatus !== 'private';

  const onSave = async () => {
    if (!id || !character) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    const valuesArr = coreValues
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const ok = await api.patchCharacter(id, {
      bio: bio.trim(),
      hometown: hometown.trim(),
      coreValues: valuesArr.length > 0 ? valuesArr : null,
    });
    setSaving(false);
    if (!ok) Alert.alert('Hata', 'Kaydedilemedi');
    else await refresh();
  };

  const onAiFill = async (field: string) => {
    if (!id) return;
    Haptics.selectionAsync();
    setAiLoadingField(field);
    const r = await api.aiFill(id, { field });
    setAiLoadingField(null);
    if (!r) {
      Alert.alert('Hata', 'AI önerisi alınamadı');
      return;
    }
    setAiAlternatives({ field, alts: r.alternatives });
  };

  const onSelectAlternative = (text: string) => {
    if (!aiAlternatives) return;
    if (aiAlternatives.field === 'bio') setBio(text);
    if (aiAlternatives.field === 'values') setCoreValues(text);
    setAiAlternatives(null);
  };

  const onUploadBible = async () => {
    console.log('[onUploadBible] CALLED', { id, bibleLength: bibleText.trim().length });
    if (!id || bibleText.trim().length < 50) {
      Alert.alert(
        'Bible eksik',
        `Metin en az 50 karakter olmalı (şu an ${bibleText.trim().length} karakter). "Bible Yapıştır" alanına yapıştır, "Biyografi" alanına değil.`,
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Yükleniyor', 'Bible anonimleştiriliyor, ~10 saniye.');
    const r = await apiRef.current.uploadBible(id, bibleText.trim());
    console.log('[onUploadBible] RESULT', r);
    if (r.decision === 'hard_block') {
      Alert.alert('Reddedildi', r.reason ?? 'Yasaklı içerik tespit edildi.');
      return;
    }
    Alert.alert(
      'Bible Eklendi',
      `Durum: ${r.decision === 'pass' ? 'Onaylandı' : 'İncelemeye alındı'}\nKaldırılan PII: ${(r.removedPII ?? []).length} öğe`,
    );
    setBibleText('');
  };

  const onValidate = async () => {
    console.log('[onValidate] CALLED', { id, hasApi: !!apiRef.current });
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setValidationLoading(true);
    Alert.alert('Doğrulama başladı', '30 sorulu test ~30-60 saniye sürer. Lütfen bekle.');
    const r = await apiRef.current.runValidation(id);
    console.log('[onValidate] RESULT', r);
    setValidationLoading(false);
    if (!r) {
      Alert.alert('Hata', 'Doğrulama yapılamadı');
      return;
    }
    Alert.alert(
      'Doğrulama Sonucu',
      `Drift: ${r.driftScore}/100 (düşük iyi)\nDNA: ${r.dna.total}/100\n${r.passed ? '✅ Tutarlı' : '⚠ Tutarsız'}\n\n${r.dna.warnings.join('\n') || 'Uyarı yok'}`,
    );
    await refresh();
  };

  const onGenerateAvatar = async () => {
    if (!id) return;
    if (avatarPrompt.trim().length < 5) {
      Alert.alert('Açıklama eksik', 'En az 5 karakter — örn: "30 yaşında, sakallı, kahve gözlü"');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAvatarLoading(true);
    const r = await apiRef.current.generateAvatar(id, avatarPrompt.trim());
    setAvatarLoading(false);
    if (!r.ok) {
      Alert.alert('Üretilemedi', r.error ?? 'Bir hata oluştu');
      return;
    }
    Alert.alert('Avatar Hazır', 'Karakterin görseli güncellendi.');
    setAvatarPrompt('');
    await refresh();
  };

  const onPublish = async (mode: 'private' | 'marketplace') => {
    console.log('[onPublish] CALLED', { id, mode });
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const r = await apiRef.current.publish(id, mode);
    console.log('[onPublish] RESULT', r);
    if (!r.ok) {
      Alert.alert(
        'Yayınlanamadı',
        `${r.error}${r.missing ? `\n\nEksik: ${r.missing.join(', ')}` : ''}`,
      );
      return;
    }
    if (mode === 'marketplace') {
      Alert.alert(
        'Yayınlandı',
        'Karakter markete eklenmeye hazır. Şimdi fiyat belirle ve listele.',
        [
          { text: 'Sonra', onPress: () => router.replace('/more/characters') },
          {
            text: 'Fiyat belirle',
            onPress: () => router.push(`/more/characters/${id}/listing` as any),
          },
        ],
      );
    } else {
      Alert.alert('Yayınlandı', 'Karakter sohbet listende.', [
        { text: 'Tamam', onPress: () => router.replace('/more/characters') },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={[styles.page, { alignItems: 'center', paddingTop: 80 }]}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (!character) {
    return (
      <View style={[styles.page, { padding: 20 }]}>
        <Text style={{ fontFamily: font.regular, color: C.textMuted }}>Karakter bulunamadı</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: character.name,
          headerRight: () =>
            !readOnly && (
              <Pressable onPress={onSave} disabled={saving} hitSlop={12}>
                {saving ? (
                  <ActivityIndicator color={C.accent} />
                ) : (
                  <Text style={styles.headerRight}>Kaydet</Text>
                )}
              </Pressable>
            ),
        }}
      />
      <ScrollView
        style={styles.page}
        contentContainerStyle={{ paddingBottom: 200 }}
        keyboardShouldPersistTaps="handled"
      >
        {readOnly && (
          <View style={styles.readonlyBanner}>
            <SymbolView name="lock.fill" tintColor={C.warning} size={14} />
            <Text style={styles.readonlyText}>Yayında olan karakter düzenlenemez</Text>
          </View>
        )}

        {character.publishStatus === 'published' && (
          <Pressable onPress={() => router.push(`/more/characters/${id}/listing` as any)}>
            {({ pressed }) => (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginHorizontal: 16,
                  marginTop: 12,
                  backgroundColor: C.accentSoft,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 14,
                  opacity: pressed ? 0.85 : 1,
                }}
              >
                <SymbolView name="storefront" tintColor={C.accent} size={20} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: font.semibold, fontSize: 15, color: C.text }}>
                    Markette
                  </Text>
                  <Text
                    style={{
                      fontFamily: font.regular,
                      fontSize: 12,
                      color: C.textMuted,
                      marginTop: 2,
                    }}
                  >
                    Fiyat belirle, listing yönet
                  </Text>
                </View>
                <SymbolView name="chevron.right" tintColor={C.accent} size={14} />
              </View>
            )}
          </Pressable>
        )}

        <DnaCard score={character.dnaScore} />

        {!readOnly && (
          <Pressable onPress={() => router.push(`/more/characters/${id}/bible` as any)}>
            {({ pressed }) => (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginHorizontal: 16,
                  marginTop: 12,
                  backgroundColor: C.card,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 14,
                  opacity: pressed ? 0.85 : 1,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: '#7C6FF7',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SymbolView name="book.closed.fill" tintColor="#FFFFFF" size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: font.semibold, fontSize: 15, color: C.text }}>
                    Bible
                  </Text>
                  <Text
                    style={{
                      fontFamily: font.regular,
                      fontSize: 12,
                      color: C.textMuted,
                      marginTop: 2,
                    }}
                  >
                    Çocukluk, aile, dönüm noktaları — 6 kart halinde
                  </Text>
                </View>
                <SymbolView name="chevron.right" tintColor={C.textDim} size={13} />
              </View>
            )}
          </Pressable>
        )}

        {!readOnly && (
          <Section title="Görsel" subtitle="Karakterinin nasıl göründüğünü tarif et, AI üretsin">
            {character.avatarUrl && (
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 24,
                  alignSelf: 'center',
                  marginBottom: 12,
                  overflow: 'hidden',
                  backgroundColor: C.well,
                }}
              >
                <Image source={{ uri: character.avatarUrl }} style={{ width: 120, height: 120 }} />
              </View>
            )}
            <TextInput
              value={avatarPrompt}
              onChangeText={setAvatarPrompt}
              multiline
              placeholder="Örn: 27 yaşında, koyu kahve gözlü, kısa sakallı, gri tişört, hafif düşünceli bakış"
              placeholderTextColor={C.textDim}
              style={[styles.input, { minHeight: 80, paddingTop: 12 }]}
              textAlignVertical="top"
            />
            <Pressable onPress={onGenerateAvatar} disabled={avatarLoading}>
              {({ pressed }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: C.accent,
                    marginTop: 12,
                    borderRadius: 12,
                    paddingVertical: 14,
                    minHeight: 48,
                    opacity: pressed || avatarLoading ? 0.85 : 1,
                  }}
                >
                  {avatarLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <SymbolView name="sparkles" tintColor="#FFFFFF" size={16} />
                      <Text style={{ fontFamily: font.semibold, fontSize: 15, color: '#FFFFFF' }}>
                        {character.avatarUrl ? 'Yeniden Üret' : 'Avatar Üret'}
                      </Text>
                    </>
                  )}
                </View>
              )}
            </Pressable>
            <Text
              style={{
                fontFamily: font.regular,
                fontSize: 12,
                color: C.textMuted,
                marginTop: 8,
                lineHeight: 17,
              }}
            >
              Üretim ~10 saniye sürer. Beğenmezsen tekrar üret.
            </Text>
          </Section>
        )}

        <Section
          title="Biyografi"
          subtitle="2-3 cümle, kim olduğunu özetle"
          onAiFill={!readOnly ? () => onAiFill('bio') : undefined}
          aiLoading={aiLoadingField === 'bio'}
        >
          <TextInput
            value={bio}
            onChangeText={setBio}
            editable={!readOnly}
            multiline
            placeholder="Örn: 27 yaşında, Norm Coffee'de barista. Müzik kulağı keskin, sözler önemli ona."
            placeholderTextColor={C.textDim}
            style={[styles.input, styles.textArea]}
            textAlignVertical="top"
          />
        </Section>

        <Section title="Doğum / Yaşadığı Yer">
          <TextInput
            value={hometown}
            onChangeText={setHometown}
            editable={!readOnly}
            placeholder="Örn: İstanbul, Kadıköy"
            placeholderTextColor={C.textDim}
            style={styles.input}
          />
        </Section>

        <Section
          title="Temel Değerler"
          subtitle="5-7 değer, virgülle ayır"
          onAiFill={!readOnly ? () => onAiFill('values') : undefined}
          aiLoading={aiLoadingField === 'values'}
        >
          <TextInput
            value={coreValues}
            onChangeText={setCoreValues}
            editable={!readOnly}
            placeholder="sadakat, özgürlük, sanat, samimiyet"
            placeholderTextColor={C.textDim}
            style={styles.input}
          />
        </Section>

        {!readOnly && (
          <Section
            title="Bible Yapıştır"
            subtitle="WhatsApp konuşması, anı, hikaye — kişisel detaylar otomatik anonimleştirilir"
          >
            <TextInput
              value={bibleText}
              onChangeText={setBibleText}
              multiline
              placeholder="Konuşma örnekleri, anı, geçmiş..."
              placeholderTextColor={C.textDim}
              style={[styles.input, styles.bibleArea]}
              textAlignVertical="top"
            />
            <Pressable onPress={onUploadBible}>
              {({ pressed }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: C.accent,
                    marginTop: 12,
                    borderRadius: 12,
                    paddingVertical: 14,
                    minHeight: 48,
                    opacity: pressed ? 0.85 : 1,
                  }}
                >
                  <SymbolView name="square.and.arrow.up" tintColor="#FFFFFF" size={16} />
                  <Text style={{ fontFamily: font.semibold, fontSize: 15, color: '#FFFFFF' }}>
                    Yükle ve Anonimleştir
                  </Text>
                </View>
              )}
            </Pressable>
          </Section>
        )}

        {!readOnly && (
          <Section
            title="Tutarlılık Doğrulama"
            subtitle="30 sorulu test ile bible tutarlılığını ölç (DNA puanı için gerekli)"
          >
            <Pressable onPress={onValidate} disabled={validationLoading}>
              {({ pressed }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: C.accent,
                    marginTop: 12,
                    borderRadius: 12,
                    paddingVertical: 14,
                    minHeight: 48,
                    opacity: pressed || validationLoading ? 0.85 : 1,
                  }}
                >
                  {validationLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <SymbolView name="checkmark.shield" tintColor="#FFFFFF" size={16} />
                      <Text style={{ fontFamily: font.semibold, fontSize: 15, color: '#FFFFFF' }}>
                        Doğrulama Çalıştır
                      </Text>
                    </>
                  )}
                </View>
              )}
            </Pressable>
          </Section>
        )}

        {!readOnly && (
          <View
            style={{
              backgroundColor: C.card,
              marginHorizontal: 16,
              marginTop: 32,
              padding: 18,
              borderRadius: 16,
            }}
          >
            <Text
              style={{
                fontFamily: font.bold,
                fontSize: 17,
                color: C.text,
                marginBottom: 14,
              }}
            >
              Hazır olduğunda yayınla
            </Text>
            <Pressable onPress={() => onPublish('private')}>
              {({ pressed }) => (
                <View
                  style={{
                    backgroundColor: C.surface,
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                    minHeight: 48,
                    marginBottom: 8,
                    opacity: pressed ? 0.85 : 1,
                  }}
                >
                  <Text style={{ fontFamily: font.semibold, fontSize: 15, color: C.text }}>
                    Sadece kendim için
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => onPublish('marketplace')}>
              {({ pressed }) => (
                <View
                  style={{
                    backgroundColor: C.accent,
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                    minHeight: 48,
                    opacity: pressed ? 0.9 : 1,
                  }}
                >
                  <Text style={{ fontFamily: font.semibold, fontSize: 15, color: '#FFFFFF' }}>
                    Markete koy
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {aiAlternatives && (
        <View style={styles.aiSheet}>
          <Text style={styles.aiSheetTitle}>AI Önerileri ({aiAlternatives.field})</Text>
          {aiAlternatives.alts.map((alt, i) => (
            <Pressable
              key={i}
              onPress={() => onSelectAlternative(alt)}
              style={({ pressed }) => [
                styles.aiAlt,
                pressed && { backgroundColor: C.accentSofter },
              ]}
            >
              <Text style={styles.aiAltText}>{alt}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setAiAlternatives(null)} style={styles.aiClose}>
            <Text style={styles.aiCloseText}>Vazgeç</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function DnaCard({ score }: { score: number | null }) {
  if (score == null) {
    return (
      <View style={styles.dnaCard}>
        <Text style={styles.dnaTitle}>DNA Puanı</Text>
        <Text style={styles.dnaSub}>Doğrulama çalıştırarak hesapla</Text>
      </View>
    );
  }
  const tier = score >= 60 ? 'Mainstream' : 'Deneysel';
  const color = score >= 60 ? C.success : C.warning;
  return (
    <View style={styles.dnaCard}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <Text style={[styles.dnaScore, { color }]}>{score}</Text>
        <Text style={styles.dnaMax}>/100</Text>
      </View>
      <Text style={[styles.dnaTier, { color }]}>{tier}</Text>
    </View>
  );
}

function Section({
  title,
  subtitle,
  onAiFill,
  aiLoading,
  children,
}: {
  title: string;
  subtitle?: string;
  onAiFill?: () => void;
  aiLoading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
        </View>
        {onAiFill && (
          <Pressable onPress={onAiFill} disabled={aiLoading} hitSlop={8} style={styles.aiBadge}>
            {aiLoading ? (
              <ActivityIndicator color={C.accent} size="small" />
            ) : (
              <>
                <SymbolView name="sparkles" tintColor={C.accent} size={12} />
                <Text style={styles.aiBadgeText}>AI ile üret</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
      <View style={{ marginTop: 10 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.page },
  headerRight: { fontFamily: font.semibold, fontSize: 16, color: C.accent },
  readonlyBanner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: C.warningBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  readonlyText: { fontFamily: font.medium, fontSize: 13, color: C.warning },
  dnaCard: {
    backgroundColor: C.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  dnaTitle: { fontFamily: font.semibold, fontSize: 14, color: C.textMuted },
  dnaSub: { fontFamily: font.regular, fontSize: 13, color: C.textDim, marginTop: 4 },
  dnaScore: { fontFamily: font.extrabold, fontSize: 36 },
  dnaMax: { fontFamily: font.medium, fontSize: 14, color: C.textMuted },
  dnaTier: { fontFamily: font.semibold, fontSize: 13, marginTop: 2 },
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontFamily: font.semibold, fontSize: 17, color: C.text },
  sectionSubtitle: { fontFamily: font.regular, fontSize: 13, color: C.textMuted, marginTop: 2 },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  aiBadgeText: { fontFamily: font.semibold, fontSize: 12, color: C.accent },
  input: {
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: font.regular,
    fontSize: 15,
    color: C.text,
    minHeight: 48,
  },
  textArea: { minHeight: 100, paddingTop: 14 },
  bibleArea: { minHeight: 140, paddingTop: 14 },
  actionBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.accent,
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 14,
    minHeight: 48,
  },
  actionBtnText: { fontFamily: font.semibold, fontSize: 15, color: '#FFFFFF' },
  publishBox: {
    backgroundColor: C.card,
    marginHorizontal: 16,
    marginTop: 32,
    padding: 18,
    borderRadius: 16,
  },
  publishTitle: { fontFamily: font.bold, fontSize: 17, color: C.text, marginBottom: 14 },
  publishBtnSecondary: {
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    marginBottom: 8,
  },
  publishSecondaryText: { fontFamily: font.semibold, fontSize: 15, color: C.text },
  publishBtnPrimary: {
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
  },
  publishPrimaryText: { fontFamily: font.semibold, fontSize: 15, color: '#FFFFFF' },
  aiSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.card,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
  },
  aiSheetTitle: { fontFamily: font.bold, fontSize: 16, color: C.text, marginBottom: 12 },
  aiAlt: {
    backgroundColor: C.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  aiAltText: { fontFamily: font.regular, fontSize: 14, color: C.text, lineHeight: 20 },
  aiClose: { paddingVertical: 12, alignItems: 'center' },
  aiCloseText: { fontFamily: font.semibold, fontSize: 15, color: C.textMuted },
});

/**
 * V4 Faz F — Yeni Grup Oluşturma Sheet
 *
 * Aktif karakterlerden 2-4 tanesini seç + isim → grup oluşturur, oluşan grubun
 * sohbet ekranına yönlendirir.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import * as Haptics from 'expo-haptics';
import { font, C } from '../../../lib/theme';
import { listCharacters, type CharacterListItem } from '../../../src/services/assistant/characters';
import { createGroup } from '../../../src/services/assistant/groups';

export default function NewGroupScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [characters, setCharacters] = useState<CharacterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await listCharacters(token);
      setCharacters(data.characters.filter((c) => c.status !== 'departed'));
    } catch (e) {
      console.error('[new-group] load fail:', e);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (id: string) => {
    Haptics.selectionAsync();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 4) return prev;
        next.add(id);
      }
      return next;
    });
  };

  const canCreate = selected.size >= 2 && selected.size <= 4;

  const onCreate = async () => {
    if (!canCreate || submitting) return;
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await getToken();
      if (!token) throw new Error('no_token');
      const group = await createGroup(token, {
        title: title.trim() || 'Grup',
        characterIds: Array.from(selected),
      });
      router.replace(`/(app)/characters/group/${group.id}`);
    } catch (e: any) {
      console.error('[new-group] create fail:', e);
      Alert.alert('Hata', 'Grup oluşturulamadı, tekrar dene.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
    >
      <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.cancel}>İptal</Text>
        </Pressable>
        <Text style={styles.navTitle}>Yeni Grup</Text>
        <Pressable onPress={onCreate} disabled={!canCreate || submitting} hitSlop={10}>
          <Text style={[styles.create, (!canCreate || submitting) && { opacity: 0.4 }]}>
            {submitting ? '...' : 'Oluştur'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.label}>Grup adı</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Grup"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            maxLength={80}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Üyeler (2-4)</Text>
          <Text style={styles.hint}>
            {selected.size === 0
              ? 'En az 2 karakter seç'
              : `${selected.size} kişi seçildi${selected.size === 4 ? ' (max)' : ''}`}
          </Text>

          {loading ? (
            <ActivityIndicator color={C.accent} style={{ marginTop: 16 }} />
          ) : characters.length === 0 ? (
            <Text style={styles.empty}>Henüz hiç karakterin yok. Önce biriyle tanışman gerek.</Text>
          ) : (
            <View style={styles.charList}>
              {characters.map((c) => {
                const isSelected = selected.has(c.id);
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => toggle(c.id)}
                    style={({ pressed }) => [
                      styles.charRow,
                      isSelected && styles.charRowActive,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    {c.avatarUrl ? (
                      <Image source={{ uri: c.avatarUrl }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, { backgroundColor: C.accentSofter }]}>
                        <Text style={styles.avatarFallback}>{c.name[0]}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.charName}>{c.name}</Text>
                      <Text style={styles.charBio} numberOfLines={1}>
                        {c.bio?.slice(0, 60) ?? c.archetype}
                      </Text>
                    </View>
                    <View style={[styles.check, isSelected && styles.checkActive]}>
                      {isSelected && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  cancel: {
    fontFamily: font.regular,
    fontSize: 17,
    color: '#6B7280',
  },
  navTitle: {
    fontFamily: font.semibold,
    fontSize: 17,
    color: '#0A0A0A',
    letterSpacing: -0.3,
  },
  create: {
    fontFamily: font.semibold,
    fontSize: 17,
    color: C.accent,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  label: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  hint: {
    fontFamily: font.regular,
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  input: {
    fontFamily: font.regular,
    fontSize: 17,
    color: '#0A0A0A',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  empty: {
    fontFamily: font.regular,
    fontSize: 15,
    color: '#9CA3AF',
    paddingVertical: 24,
    textAlign: 'center',
  },
  charList: {
    marginTop: 8,
  },
  charRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  charRowActive: {
    backgroundColor: C.accentSofter,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallback: {
    fontFamily: font.semibold,
    fontSize: 18,
    color: C.accent,
  },
  charName: {
    fontFamily: font.semibold,
    fontSize: 16,
    color: '#0A0A0A',
    letterSpacing: -0.2,
  },
  charBio: {
    fontFamily: font.regular,
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  checkMark: {
    color: '#FFFFFF',
    fontFamily: font.bold,
    fontSize: 14,
  },
});

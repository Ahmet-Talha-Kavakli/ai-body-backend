/**
 * V4.8 Faz A — Karakterlerim
 *
 * Yaratıcının karakter listesi + boş state + yeni yarat CTA + quota gösterimi.
 * Apple HIG paterni: büyük başlık, list, "+" sağ üst, boş state hero.
 */

import { useFocusEffect, useRouter, Stack } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CreatorOnboardingModal } from '../../../components/marketplace/OnboardingModal';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { C, font } from '../../../lib/theme';
import {
  useCharactersApi,
  type MyCharacter,
  type QuotaInfo,
} from '../../../lib/marketplace/charactersApi';

const CATEGORY_LABEL: Record<string, string> = {
  friend: 'Arkadaş',
  mentor: 'Mentor',
  romantic: 'Romantik',
  family: 'Aile',
  fantasy: 'Hayali',
  professional: 'Profesyonel',
};

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  draft: { text: 'Taslak', color: C.textMuted },
  private: { text: 'Özel', color: C.info },
  pending_review: { text: 'İncelemede', color: C.warning },
  published: { text: 'Yayında', color: C.success },
  suspended: { text: 'Askıda', color: C.danger },
  retired: { text: 'Emekli', color: C.textDim },
};

export default function CharactersScreen() {
  const router = useRouter();
  const api = useCharactersApi();
  const apiRef = useRef(api);
  apiRef.current = api;
  const [characters, setCharacters] = useState<MyCharacter[]>([]);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await apiRef.current.listMine();
    if (data) {
      setCharacters(data.characters);
      setQuota(data.quota);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const onCreate = () => {
    Haptics.selectionAsync();
    if (!quota?.allowed) return;
    router.push('/more/characters/new');
  };

  return (
    <>
      <CreatorOnboardingModal />
      <Stack.Screen
        options={{
          title: 'Karakterlerim',
          headerLargeTitle: true,
          headerLargeTitleStyle: { fontFamily: font.extrabold } as any,
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push('/more/characters/dashboard' as any);
                }}
                hitSlop={12}
              >
                <SymbolView name="chart.bar" tintColor={C.accent} size={20} />
              </Pressable>
              <Pressable onPress={onCreate} hitSlop={12} disabled={!quota?.allowed}>
                <SymbolView
                  name="plus.circle.fill"
                  tintColor={quota?.allowed ? C.accent : C.textDim}
                  size={26}
                />
              </Pressable>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.page} contentInsetAdjustmentBehavior="automatic">
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : characters.length === 0 ? (
          <EmptyState quota={quota} onCreate={onCreate} />
        ) : (
          <>
            <QuotaBanner quota={quota} />
            <View style={styles.list}>
              {characters.map((c) => (
                <CharacterRow
                  key={c.id}
                  character={c}
                  onPress={() => router.push(`/more/characters/${c.id}` as any)}
                />
              ))}
            </View>
            {quota?.allowed && (
              <Pressable onPress={onCreate}>
                {({ pressed }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: C.accent,
                      marginHorizontal: 16,
                      marginTop: 16,
                      borderRadius: 14,
                      minHeight: 52,
                      paddingVertical: 14,
                      opacity: pressed ? 0.85 : 1,
                    }}
                  >
                    <SymbolView name="plus" tintColor="#FFFFFF" size={18} />
                    <Text style={{ fontFamily: font.semibold, fontSize: 16, color: '#FFFFFF' }}>
                      Yeni karakter yarat
                    </Text>
                  </View>
                )}
              </Pressable>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

function EmptyState({ quota, onCreate }: { quota: QuotaInfo | null; onCreate: () => void }) {
  return (
    <View style={{ paddingHorizontal: 28, paddingTop: 60, alignItems: 'center' }}>
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          backgroundColor: C.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <SymbolView name="person.2.fill" tintColor={C.accent} size={48} />
      </View>
      <Text
        style={{
          fontFamily: font.bold,
          fontSize: 24,
          color: C.text,
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        İlk karakterini yarat
      </Text>
      <Text
        style={{
          fontFamily: font.regular,
          fontSize: 15,
          color: C.textMuted,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 28,
        }}
      >
        Kişiliğini, geçmişini, alışkanlıklarını sen belirle. Hayata sen geçir.
      </Text>
      {quota?.allowed ? (
        <Pressable onPress={onCreate}>
          {({ pressed }) => (
            <View
              style={{
                backgroundColor: C.accent,
                paddingVertical: 16,
                paddingHorizontal: 36,
                borderRadius: 14,
                minHeight: 52,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              }}
            >
              <Text
                style={{
                  fontFamily: font.semibold,
                  fontSize: 16,
                  color: '#FFFFFF',
                }}
              >
                Hadi başlayalım
              </Text>
            </View>
          )}
        </Pressable>
      ) : (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: C.surface,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 10,
          }}
        >
          <SymbolView name="lock.fill" tintColor={C.textMuted} size={14} />
          <Text style={{ fontFamily: font.medium, fontSize: 14, color: C.textMuted }}>
            {quota?.reason ?? 'Yaratım kilitli'}
          </Text>
        </View>
      )}
    </View>
  );
}

function QuotaBanner({ quota }: { quota: QuotaInfo | null }) {
  if (!quota) return null;
  const used = quota.current;
  const limit = quota.limit;
  return (
    <View style={styles.quotaBanner}>
      <Text style={styles.quotaText}>
        {used} / {limit} aktif karakter
      </Text>
      {!quota.allowed && quota.reason && <Text style={styles.quotaReason}>{quota.reason}</Text>}
    </View>
  );
}

function CharacterRow({ character, onPress }: { character: MyCharacter; onPress: () => void }) {
  const status = STATUS_LABEL[character.publishStatus] ?? STATUS_LABEL.draft;
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14,
            paddingHorizontal: 14,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: C.hairline,
            backgroundColor: pressed ? C.surface : 'transparent',
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: C.well,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <SymbolView name="person.fill" tintColor={C.textMuted} size={22} />
          </View>

          <View style={{ flex: 1, marginRight: 8 }}>
            <Text
              numberOfLines={1}
              style={{ fontFamily: font.semibold, fontSize: 16, color: C.text }}
            >
              {character.name}
            </Text>
            <Text
              numberOfLines={1}
              style={{ fontFamily: font.regular, fontSize: 13, color: C.textMuted, marginTop: 2 }}
            >
              {CATEGORY_LABEL[character.category] ?? 'Arkadaş'} · {character.age}
              {character.dnaScore != null ? ` · DNA ${character.dnaScore}` : ''}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: status.color + '22',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 6,
              marginRight: 8,
            }}
          >
            <Text style={{ fontFamily: font.semibold, fontSize: 11, color: status.color }}>
              {status.text}
            </Text>
          </View>

          <SymbolView name="chevron.right" tintColor={C.textDim} size={13} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.page },
  center: { paddingTop: 80, alignItems: 'center' },
  emptyWrap: { paddingHorizontal: 28, paddingTop: 60, alignItems: 'center' },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: font.bold,
    fontSize: 24,
    color: C.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: font.regular,
    fontSize: 15,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  ctaPrimary: {
    backgroundColor: C.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimaryText: { fontFamily: font.semibold, fontSize: 16, color: '#FFFFFF' },
  lockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  lockText: { fontFamily: font.medium, fontSize: 14, color: C.textMuted },
  quotaBanner: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  quotaText: { fontFamily: font.semibold, fontSize: 13, color: C.textMuted },
  quotaReason: { fontFamily: font.regular, fontSize: 12, color: C.warning, marginTop: 4 },
  list: { backgroundColor: C.card, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.hairline,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.well,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.well },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  rowName: { fontFamily: font.semibold, fontSize: 16, color: C.text },
  rowMeta: { fontFamily: font.regular, fontSize: 13, color: C.textMuted },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusPillText: { fontFamily: font.semibold, fontSize: 11 },
  newBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.accent,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    minHeight: 52,
    paddingVertical: 14,
  },
  newBtnText: { fontFamily: font.semibold, fontSize: 16, color: '#FFFFFF' },
});

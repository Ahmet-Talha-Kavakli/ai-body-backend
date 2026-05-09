/**
 * V4.8 Faz E — Bible Kart Yapısı
 *
 * Düz textarea yerine 6 kategori, her biri ayrı kart.
 * Notion paterni: tıkla, genişle, doldur, kaydet.
 *
 * Veriler Character.bibleMetadata.cards içinde.
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
import * as Haptics from 'expo-haptics';
import { C, font } from '../../../../lib/theme';
import { useCharactersApi } from '../../../../lib/marketplace/charactersApi';

interface BibleCard {
  key: string;
  title: string;
  hint: string;
  icon: string;
  iconColor: string;
}

const CARDS: BibleCard[] = [
  {
    key: 'childhood',
    title: 'Çocukluk',
    hint: 'En erken hatırladığı an, ev ortamı, neyle büyüdü',
    icon: 'house.fill',
    iconColor: '#FF9F0A',
  },
  {
    key: 'family',
    title: 'Aile & Yakınlar',
    hint: 'Anne, baba, kardeş, en yakın 3 arkadaş, ilişki dinamikleri',
    icon: 'person.2.fill',
    iconColor: '#0A84FF',
  },
  {
    key: 'firstLove',
    title: 'İlk Aşk / Romantik Geçmiş',
    hint: 'İlk hissedilen aşk, kalp kırıklığı, şu anki durum',
    icon: 'heart.fill',
    iconColor: '#FF3B30',
  },
  {
    key: 'turningPoint',
    title: 'Dönüm Noktası',
    hint: 'Hayatını değiştiren bir olay — kayıp, başarı, taşınma, karar',
    icon: 'arrow.triangle.branch',
    iconColor: '#5E5CE6',
  },
  {
    key: 'fearsAndDreams',
    title: 'Korkular & Hayaller',
    hint: 'En büyük korkusu, gizli hayali, vazgeçemediği şey',
    icon: 'sparkles',
    iconColor: '#7C6FF7',
  },
  {
    key: 'currentLife',
    title: 'Şu Anki Hayatı',
    hint: 'Bir günü nasıl geçer, neyle uğraşır, neyle uğraşmaz',
    icon: 'sun.max.fill',
    iconColor: '#30D158',
  },
];

export default function BibleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useCharactersApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [cards, setCards] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    if (!id) return;
    const c = await apiRef.current.getCharacter(id);
    if (c) {
      setCharacter(c);
      const meta = (c.bibleMetadata as any) ?? {};
      setCards(meta.cards ?? {});
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onSaveCard = async (key: string, value: string) => {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    const newCards = { ...cards, [key]: value };
    const meta = (character.bibleMetadata as any) ?? {};
    await apiRef.current.patchCharacter(id, {
      bibleMetadata: { ...meta, cards: newCards },
    });
    setCards(newCards);
    setSaving(false);
    setActiveCard(null);
  };

  if (loading) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.page }}
      >
        <Stack.Screen options={{ title: 'Bible' }} />
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (!character) return null;

  const filledCount = CARDS.filter((c) => cards[c.key] && cards[c.key].trim().length > 20).length;

  return (
    <>
      <Stack.Screen options={{ title: 'Bible' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: C.page }}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Progress */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            backgroundColor: C.card,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: C.accentSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: font.bold, fontSize: 14, color: C.accent }}>
                {filledCount}/{CARDS.length}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: font.semibold, fontSize: 15, color: C.text }}>
                {filledCount === CARDS.length ? 'Bible tamamlandı' : 'Bible doldurma'}
              </Text>
              <Text
                style={{ fontFamily: font.regular, fontSize: 12, color: C.textMuted, marginTop: 2 }}
              >
                Daha çok kart = daha gerçekçi karakter
              </Text>
            </View>
          </View>
        </View>

        {/* Cards */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 10 }}>
          {CARDS.map((card) => {
            const value = cards[card.key] ?? '';
            const filled = value.trim().length > 20;
            return (
              <CardItem
                key={card.key}
                card={card}
                value={value}
                filled={filled}
                expanded={activeCard === card.key}
                onExpand={() => {
                  Haptics.selectionAsync();
                  setActiveCard(activeCard === card.key ? null : card.key);
                }}
                onSave={(val) => onSaveCard(card.key, val)}
                saving={saving && activeCard === card.key}
              />
            );
          })}
        </View>
      </ScrollView>
    </>
  );
}

function CardItem({
  card,
  value,
  filled,
  expanded,
  onExpand,
  onSave,
  saving,
}: {
  card: BibleCard;
  value: string;
  filled: boolean;
  expanded: boolean;
  onExpand: () => void;
  onSave: (val: string) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <View
      style={{
        backgroundColor: C.card,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: filled ? 0 : StyleSheet.hairlineWidth,
        borderColor: C.hairline,
      }}
    >
      <Pressable onPress={onExpand}>
        {({ pressed }) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 14,
              gap: 12,
              backgroundColor: pressed ? C.surface : 'transparent',
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: card.iconColor,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SymbolView name={card.icon as any} tintColor="#FFFFFF" size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontFamily: font.semibold, fontSize: 15, color: C.text }}>
                  {card.title}
                </Text>
                {filled && (
                  <View
                    style={{
                      backgroundColor: C.successBg,
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                      borderRadius: 5,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: font.bold,
                        fontSize: 9,
                        color: C.success,
                        letterSpacing: 0.4,
                      }}
                    >
                      DOLU
                    </Text>
                  </View>
                )}
              </View>
              <Text
                numberOfLines={expanded ? 0 : 1}
                style={{ fontFamily: font.regular, fontSize: 12, color: C.textMuted, marginTop: 2 }}
              >
                {filled && !expanded ? value : card.hint}
              </Text>
            </View>
            <SymbolView
              name={expanded ? 'chevron.up' : 'chevron.right'}
              tintColor={C.textDim}
              size={13}
            />
          </View>
        )}
      </Pressable>

      {expanded && (
        <View
          style={{
            paddingHorizontal: 14,
            paddingTop: 4,
            paddingBottom: 14,
            gap: 10,
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            placeholder={card.hint}
            placeholderTextColor={C.textDim}
            style={{
              backgroundColor: C.well,
              borderRadius: 12,
              padding: 12,
              fontFamily: font.regular,
              fontSize: 14,
              color: C.text,
              minHeight: 100,
              textAlignVertical: 'top',
            }}
          />
          <Pressable onPress={() => onSave(draft)} disabled={saving || draft === value}>
            {({ pressed }) => (
              <View
                style={{
                  backgroundColor: draft !== value ? C.accent : C.well,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                  minHeight: 44,
                  opacity: pressed || saving ? 0.85 : 1,
                }}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text
                    style={{
                      fontFamily: font.semibold,
                      fontSize: 14,
                      color: draft !== value ? '#FFFFFF' : C.textMuted,
                    }}
                  >
                    Kaydet
                  </Text>
                )}
              </View>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

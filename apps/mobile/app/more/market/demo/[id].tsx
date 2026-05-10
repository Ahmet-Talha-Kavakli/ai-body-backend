/**
 * V4.8 Faz D — Demo Sohbet
 *
 * 5 mesaj/24h. Hafıza yazılmaz, karakter sadece kişiliğiyle cevap verir.
 * WhatsApp tarzı UI, üstte "X mesaj kaldı" persistent banner.
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { C, font } from '../../../../lib/theme';
import { useMarketApi } from '../../../../lib/marketplace/marketApi';
import {
  DemoEndSheet,
  type DemoEndSheetRef,
} from '../../../../components/marketplace/DemoEndSheet';

interface Msg {
  id: string;
  role: 'user' | 'character';
  text: string;
}

export default function DemoChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useMarketApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [character, setCharacter] = useState<{
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null>(null);
  const [pricing, setPricing] = useState<{
    rentPrice7d: number | null;
    rentPrice14d: number | null;
    rentPrice30d: number | null;
  } | null>(null);
  const [remaining, setRemaining] = useState(5);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const listRef = useRef<FlatList>(null);
  const endSheetRef = useRef<DemoEndSheetRef>(null);

  const init = useCallback(async () => {
    if (!id) return;
    const [r, listingDetail] = await Promise.all([
      apiRef.current.startDemo(id),
      apiRef.current.getListing(id),
    ]);
    if (!r) {
      Alert.alert('Hata', 'Demo başlatılamadı', [{ text: 'Tamam', onPress: () => router.back() }]);
      return;
    }
    setCharacter({
      id: r.character.id,
      name: r.character.name,
      avatarUrl: listingDetail?.listing.character.avatarUrl ?? null,
    });
    if (listingDetail) {
      setPricing({
        rentPrice7d: listingDetail.listing.rentPrice7d,
        rentPrice14d: listingDetail.listing.rentPrice14d,
        rentPrice30d: listingDetail.listing.rentPrice30d,
      });
    }
    setRemaining(r.session.remaining);
    if (r.session.remaining === 0) {
      // Demo zaten önceden kullanılmış — sheet'i hemen aç
      setInitLoading(false);
      setTimeout(() => openEndSheet(r.character.name, listingDetail), 300);
      return;
    }
    setMessages([
      {
        id: 'greeting',
        role: 'character',
        text: `Hadi tanışalım. Ne sormak istersin? (Demo: ${r.session.remaining} mesaj kaldı)`,
      },
    ]);
    setInitLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  const openEndSheet = useCallback(
    (
      charName?: string,
      detail?: {
        listing: {
          character: { avatarUrl: string | null };
          rentPrice7d: number | null;
          rentPrice14d: number | null;
          rentPrice30d: number | null;
        };
      } | null,
    ) => {
      if (!id) return;
      const name = charName ?? character?.name ?? 'Karakter';
      const avatar = detail?.listing.character.avatarUrl ?? character?.avatarUrl ?? null;
      const p7 = detail?.listing.rentPrice7d ?? pricing?.rentPrice7d ?? null;
      const p14 = detail?.listing.rentPrice14d ?? pricing?.rentPrice14d ?? null;
      const p30 = detail?.listing.rentPrice30d ?? pricing?.rentPrice30d ?? null;
      endSheetRef.current?.open({
        listingId: id,
        characterName: name,
        avatarUrl: avatar,
        rentPrice7d: p7,
        rentPrice14d: p14,
        rentPrice30d: p30,
      });
    },
    [id, character, pricing],
  );

  useEffect(() => {
    init();
  }, [init]);

  const onSend = async () => {
    if (!id || !input.trim() || sending) return;
    if (remaining <= 0) {
      onLimitReached();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', text: input.trim() };
    setMessages((m) => [...m, userMsg]);
    const text = input.trim();
    setInput('');
    setSending(true);

    const r = await apiRef.current.sendDemoMessage(id, text);
    setSending(false);

    if (!r.ok) {
      if (r.limitReached) {
        onLimitReached();
        return;
      }
      Alert.alert('Hata', r.error ?? 'Mesaj gönderilemedi');
      return;
    }

    const charMsg: Msg = { id: `c-${Date.now()}`, role: 'character', text: r.reply ?? '' };
    setMessages((m) => [...m, charMsg]);
    setRemaining(r.remaining ?? 0);

    if ((r.remaining ?? 0) === 0) {
      setTimeout(onLimitReached, 1200);
    }
  };

  const onLimitReached = () => {
    openEndSheet();
  };

  if (initLoading) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.page }}
      >
        <Stack.Screen options={{ title: 'Demo' }} />
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: C.page }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <Stack.Screen
          options={{
            title: character?.name ?? 'Demo',
            headerStyle: { backgroundColor: C.page } as any,
          }}
        />

        {/* Banner — kalan mesaja göre dramatik tonlama */}
        <DemoBanner remaining={remaining} onCTAPress={openEndSheet} />

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <Bubble msg={item} />}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input */}
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: 16,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: C.hairline,
            backgroundColor: C.card,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={remaining > 0 ? 'Mesaj yaz...' : 'Demo bitti'}
            placeholderTextColor={C.textDim}
            editable={remaining > 0 && !sending}
            multiline
            style={{
              flex: 1,
              backgroundColor: C.well,
              borderRadius: 18,
              paddingHorizontal: 14,
              paddingVertical: 10,
              fontFamily: font.regular,
              fontSize: 15,
              color: C.text,
              maxHeight: 100,
              minHeight: 40,
            }}
          />
          <Pressable onPress={onSend} disabled={!input.trim() || sending || remaining <= 0}>
            {({ pressed }) => (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: input.trim() && !sending && remaining > 0 ? C.accent : C.textDim,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.85 : 1,
                }}
              >
                {sending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <SymbolView name="arrow.up" tintColor="#FFFFFF" size={18} />
                )}
              </View>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <DemoEndSheet
        ref={endSheetRef}
        onRented={() => {
          // Kira başladı → karakter sayfasına git (artık gerçek sohbet)
          router.replace(`/more/market/listing/${id}` as any);
        }}
        onLater={() => {
          router.back();
        }}
      />
    </>
  );
}

function DemoBanner({ remaining, onCTAPress }: { remaining: number; onCTAPress: () => void }) {
  // Kalan mesaj sayısına göre dramatik tonlama
  const config =
    remaining === 0
      ? {
          bg: '#FF3B3022',
          accent: '#FF3B30',
          label: 'Demo bitti',
          sub: 'Konuşmaya devam etmek için kirala',
        }
      : remaining === 1
        ? { bg: '#FF3B3022', accent: '#FF3B30', label: `Son mesajın`, sub: 'Şimdi karar ver' }
        : remaining === 2
          ? {
              bg: '#FF9F0A22',
              accent: '#FF9F0A',
              label: `${remaining} mesaj kaldı`,
              sub: 'Sona yaklaşıyorsun',
            }
          : {
              bg: C.accentSoft,
              accent: C.accent,
              label: `Demo modu`,
              sub: `${remaining} mesaj kaldı`,
            };

  return (
    <View
      style={{
        backgroundColor: config.bg,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: C.hairline,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: config.accent,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          <SymbolView
            name={remaining <= 1 ? 'exclamationmark' : 'sparkles'}
            tintColor="#FFFFFF"
            size={14}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: font.bold,
              fontSize: 14,
              color: config.accent,
              letterSpacing: -0.2,
            }}
          >
            {config.label}
          </Text>
          <Text
            numberOfLines={1}
            style={{ fontFamily: font.regular, fontSize: 12, color: C.textMuted, marginTop: 1 }}
          >
            {config.sub}
          </Text>
        </View>
        <Pressable
          onPress={onCTAPress}
          hitSlop={6}
          style={{
            backgroundColor: config.accent,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 12,
            alignSelf: 'center',
          }}
        >
          <Text
            style={{ fontFamily: font.bold, fontSize: 13, color: '#FFFFFF', letterSpacing: -0.1 }}
          >
            Kirala
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === 'user';
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <View
        style={{
          maxWidth: '78%',
          backgroundColor: isUser ? C.accent : C.card,
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderRadius: 18,
          borderBottomLeftRadius: isUser ? 18 : 4,
          borderBottomRightRadius: isUser ? 4 : 18,
        }}
      >
        <Text
          style={{
            fontFamily: font.regular,
            fontSize: 15,
            color: isUser ? '#FFFFFF' : C.text,
            lineHeight: 20,
          }}
        >
          {msg.text}
        </Text>
      </View>
    </View>
  );
}

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
  const [remaining, setRemaining] = useState(5);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const listRef = useRef<FlatList>(null);

  const init = useCallback(async () => {
    if (!id) return;
    const r = await apiRef.current.startDemo(id);
    if (!r) {
      Alert.alert('Hata', 'Demo başlatılamadı', [{ text: 'Tamam', onPress: () => router.back() }]);
      return;
    }
    setCharacter({
      id: r.character.id,
      name: r.character.name,
      avatarUrl: null,
    });
    setRemaining(r.session.remaining);
    if (r.session.remaining === 0) {
      Alert.alert('Demo Bitti', '5 demo mesajını kullandın. Karakteri kiralamak ister misin?', [
        { text: 'Vazgeç', style: 'cancel', onPress: () => router.back() },
        { text: 'Kirala', onPress: () => router.replace(`/more/market/listing/${id}` as any) },
      ]);
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
  }, [id, router]);

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
    Alert.alert(
      'Demo Bitti',
      'Karakterle gerçekten konuşmak istersen kirala — hatıralarınız kapsüllenir, geri döndüğünde devam eder.',
      [
        { text: 'Şimdi değil', style: 'cancel' },
        { text: 'Kirala', onPress: () => router.replace(`/more/market/listing/${id}` as any) },
      ],
    );
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

      {/* Banner */}
      <View
        style={{
          backgroundColor: C.accentSoft,
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: C.hairline,
        }}
      >
        <SymbolView name="info.circle.fill" tintColor={C.accent} size={14} />
        <Text style={{ flex: 1, fontFamily: font.medium, fontSize: 13, color: C.text }}>
          Demo modu · {remaining} mesaj kaldı
        </Text>
        <Pressable onPress={() => router.replace(`/more/market/listing/${id}` as any)} hitSlop={8}>
          <Text style={{ fontFamily: font.semibold, fontSize: 13, color: C.accent }}>Kirala</Text>
        </Pressable>
      </View>

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

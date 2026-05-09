/**
 * V4.8 Faz E — Kira Sonu Yorum + Anı Kartı
 *
 * Kira bittikten sonra kullanıcı 1-5 yıldız + opsiyonel yorum bırakır.
 * Sonra Anı Kartı (Spotify Wrapped tarzı) çıkar — paylaşılabilir.
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
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { C, font } from '../../../../lib/theme';
import { useMarketApi } from '../../../../lib/marketplace/marketApi';
import { MemoryCard } from '../../../../components/marketplace/MemoryCard';

export default function ReviewScreen() {
  const { rentalId } = useLocalSearchParams<{ rentalId: string }>();
  const router = useRouter();
  const api = useMarketApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [rental, setRental] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const cardRef = useRef<View>(null);

  const refresh = useCallback(async () => {
    const data = await apiRef.current.myRentals();
    if (data) {
      const r =
        data.pendingReview.find((x: any) => x.id === rentalId) ??
        data.history.find((x: any) => x.id === rentalId);
      setRental(r);
    }
    setLoading(false);
  }, [rentalId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onSubmit = async () => {
    if (!rentalId || rating === 0) {
      Alert.alert('Puan eksik', 'En az 1 yıldız ver');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    const r = await apiRef.current.submitReview(rentalId, rating, review.trim() || undefined);
    setSubmitting(false);
    if (!r.ok) {
      Alert.alert('Hata', r.error ?? 'Yorum bırakılamadı');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
  };

  const onShare = async () => {
    if (!cardRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { dialogTitle: 'Yolculuğunu paylaş' });
      }
    } catch (e) {
      Alert.alert('Hata', 'Kart oluşturulamadı');
    }
  };

  if (loading) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.page }}
      >
        <Stack.Screen options={{ title: 'Yorum' }} />
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (!rental) {
    return (
      <View style={{ flex: 1, padding: 20, backgroundColor: C.page }}>
        <Stack.Screen options={{ title: 'Bulunamadı' }} />
        <Text style={{ fontFamily: font.regular, color: C.textMuted }}>Kira bulunamadı.</Text>
      </View>
    );
  }

  // Hesapla: kira süresi
  const days =
    rental.endsAt && rental.startedAt
      ? Math.ceil(
          (new Date(rental.endsAt).getTime() - new Date(rental.startedAt).getTime()) /
            (24 * 60 * 60 * 1000),
        )
      : 0;

  // Memory card data (placeholder — gerçek closenessPeak/highlight için backend sonra eklenecek)
  const memoryData = {
    characterName: rental.character.name,
    characterAvatar: rental.character.avatarUrl,
    days,
    totalMessages: 0, // TODO: backend'den getir
    closenessPeak: null,
    highlightQuote: null,
    highlightDate: null,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.page }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: submitted ? 'Yolculuğun' : 'Yorum Bırak' }} />

      {/* Off-screen memory card */}
      <View style={{ position: 'absolute', top: -2000, left: 0 }}>
        <MemoryCard ref={cardRef} data={memoryData} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {!submitted ? (
          <>
            {/* Hero */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 28 }}>
              <Text
                style={{ fontFamily: font.bold, fontSize: 22, color: C.text, textAlign: 'center' }}
              >
                {rental.character.name} ile yolculuğun nasıldı?
              </Text>
              <Text
                style={{
                  fontFamily: font.regular,
                  fontSize: 14,
                  color: C.textMuted,
                  marginTop: 8,
                  textAlign: 'center',
                }}
              >
                Puanın diğer kullanıcılara yardımcı olur
              </Text>
            </View>

            {/* Rating stars */}
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                justifyContent: 'center',
                marginBottom: 28,
              }}
            >
              {[1, 2, 3, 4, 5].map((s) => (
                <Pressable
                  key={s}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setRating(s);
                  }}
                  hitSlop={8}
                >
                  <SymbolView
                    name={s <= rating ? 'star.fill' : 'star'}
                    tintColor={s <= rating ? '#FFCC00' : C.textDim}
                    size={42}
                  />
                </Pressable>
              ))}
            </View>

            {/* Review text */}
            <Text
              style={{ fontFamily: font.semibold, fontSize: 14, color: C.text, marginBottom: 8 }}
            >
              Yorumun (opsiyonel)
            </Text>
            <TextInput
              value={review}
              onChangeText={setReview}
              multiline
              placeholder="Karakter nasıldı? Tutarlı, samimi, eğlenceli, sıkıcı?"
              placeholderTextColor={C.textDim}
              maxLength={500}
              style={{
                backgroundColor: C.card,
                borderRadius: 12,
                padding: 14,
                fontFamily: font.regular,
                fontSize: 15,
                color: C.text,
                minHeight: 120,
                textAlignVertical: 'top',
              }}
            />
            <Text
              style={{
                fontFamily: font.regular,
                fontSize: 11,
                color: C.textMuted,
                marginTop: 6,
                textAlign: 'right',
              }}
            >
              {review.length}/500 · Kişisel detaylar otomatik genelleştirilir
            </Text>

            <Pressable
              onPress={onSubmit}
              disabled={submitting || rating === 0}
              style={{ marginTop: 28 }}
            >
              {({ pressed }) => (
                <View
                  style={{
                    backgroundColor: rating > 0 ? C.accent : C.textDim,
                    borderRadius: 14,
                    paddingVertical: 16,
                    alignItems: 'center',
                    minHeight: 52,
                    opacity: pressed || submitting ? 0.85 : 1,
                  }}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={{ fontFamily: font.semibold, fontSize: 16, color: '#FFFFFF' }}>
                      Yorumu Gönder
                    </Text>
                  )}
                </View>
              )}
            </Pressable>
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingTop: 20 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: C.successBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <SymbolView name="checkmark" tintColor={C.success} size={28} />
            </View>
            <Text
              style={{ fontFamily: font.bold, fontSize: 22, color: C.text, textAlign: 'center' }}
            >
              Teşekkürler!
            </Text>
            <Text
              style={{
                fontFamily: font.regular,
                fontSize: 14,
                color: C.textMuted,
                textAlign: 'center',
                marginTop: 8,
                marginBottom: 28,
              }}
            >
              Yolculuğunu kart olarak paylaşmak ister misin?
            </Text>

            {/* Display memory card preview */}
            <View style={{ transform: [{ scale: 0.7 }], marginVertical: -80 }}>
              <MemoryCard data={memoryData} />
            </View>

            <Pressable onPress={onShare} style={{ width: '100%', marginTop: 28 }}>
              {({ pressed }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 8,
                    backgroundColor: C.accent,
                    borderRadius: 14,
                    paddingVertical: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 52,
                    opacity: pressed ? 0.85 : 1,
                  }}
                >
                  <SymbolView name="square.and.arrow.up" tintColor="#FFFFFF" size={18} />
                  <Text style={{ fontFamily: font.semibold, fontSize: 16, color: '#FFFFFF' }}>
                    Kartı Paylaş
                  </Text>
                </View>
              )}
            </Pressable>

            <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
              <Text style={{ fontFamily: font.semibold, fontSize: 15, color: C.textMuted }}>
                Sonra
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

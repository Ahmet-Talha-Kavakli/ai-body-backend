/**
 * V4.8 Faz D — Yaratıcı Listing Yönetimi
 *
 * Karakter "Markete koy" ile published olduktan sonra burada fiyat belirler.
 * Kira (7/14/30 gün), satın alma, eşzamanlı kira limiti.
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
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { C, font } from '../../../../lib/theme';
import { useCharactersApi } from '../../../../lib/marketplace/charactersApi';

export default function ListingManagementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const api = useCharactersApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [listing, setListing] = useState<any>(null);
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState<any>(null);

  // Form state
  const [rentEnabled, setRentEnabled] = useState(true);
  const [buyEnabled, setBuyEnabled] = useState(false);
  const [rent7d, setRent7d] = useState('');
  const [rent14d, setRent14d] = useState('');
  const [rent30d, setRent30d] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [concurrentLimit, setConcurrentLimit] = useState('1');
  const [vipEarlyAccess, setVipEarlyAccess] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    const [c, l, suggestion] = await Promise.all([
      apiRef.current.getCharacter(id),
      apiRef.current.getListing(id),
      apiRef.current.getPriceSuggestion(id),
    ]);
    setCharacter(c);
    setListing(l);
    setPriceSuggestion(suggestion);
    if (l) {
      setRentEnabled(l.rentEnabled);
      setBuyEnabled(l.buyEnabled);
      setRent7d(l.rentPrice7d?.toString() ?? '');
      setRent14d(l.rentPrice14d?.toString() ?? '');
      setRent30d(l.rentPrice30d?.toString() ?? '');
      setBuyPrice(l.buyPrice?.toString() ?? '');
      setConcurrentLimit(l.concurrentLimit?.toString() ?? '1');
    } else if (suggestion) {
      // AI önerilen değerlerle başla
      setRent7d(suggestion.rent7d.suggested.toString());
      setRent14d(suggestion.rent14d.suggested.toString());
      setRent30d(suggestion.rent30d.suggested.toString());
      setBuyPrice(suggestion.buy.suggested.toString());
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onSave = async () => {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    const data: any = {
      rentEnabled,
      buyEnabled,
      concurrentLimit: parseInt(concurrentLimit, 10) || 1,
    };
    if (rentEnabled) {
      if (rent7d) data.rentPrice7d = parseInt(rent7d, 10);
      if (rent14d) data.rentPrice14d = parseInt(rent14d, 10);
      if (rent30d) data.rentPrice30d = parseInt(rent30d, 10);
    }
    if (buyEnabled && buyPrice) data.buyPrice = parseInt(buyPrice, 10);

    // V4.8 #13 — VIP early access (sadece ilk yayında, güncellemede pas geçilir)
    if (!listing && vipEarlyAccess) data.vipEarlyAccess = true;

    const result = listing
      ? await apiRef.current.updateListing(id, data)
      : await apiRef.current.createListing(id, data);

    setSaving(false);
    if (!result.ok) {
      Alert.alert('Hata', result.error ?? 'Kaydedilemedi');
      return;
    }
    Alert.alert(
      listing ? 'Güncellendi' : 'Markete Eklendi',
      listing
        ? 'Yeni fiyatlar geçerli.'
        : "Karakterin marketplace'te aktif. Diğer kullanıcılar görüp kiralayabilir.",
      [{ text: 'Tamam', onPress: () => router.back() }],
    );
  };

  const onPause = () => {
    if (!id) return;
    Alert.alert(
      "Listing'i Duraklat",
      "Karakter marketplace'ten kaldırılır. Mevcut kiralar bitene kadar aktif kalır.",
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Duraklat',
          style: 'destructive',
          onPress: async () => {
            const ok = await apiRef.current.deleteListing(id);
            if (ok) {
              Alert.alert('Pasifleştirildi', "Karakter artık marketplace'te görünmüyor.");
              router.back();
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.page }}
      >
        <Stack.Screen options={{ title: 'Markette' }} />
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (!character) {
    return (
      <View style={{ flex: 1, padding: 20, backgroundColor: C.page }}>
        <Stack.Screen options={{ title: 'Hata' }} />
        <Text style={{ fontFamily: font.regular, color: C.textMuted }}>Karakter bulunamadı.</Text>
      </View>
    );
  }

  if (character.publishStatus !== 'published') {
    return (
      <View
        style={{
          flex: 1,
          padding: 28,
          backgroundColor: C.page,
          alignItems: 'center',
          paddingTop: 80,
        }}
      >
        <Stack.Screen options={{ title: 'Önce Yayınla' }} />
        <SymbolView name="exclamationmark.triangle" tintColor={C.warning} size={48} />
        <Text
          style={{
            fontFamily: font.bold,
            fontSize: 20,
            color: C.text,
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          Karakter henüz yayında değil
        </Text>
        <Text
          style={{
            fontFamily: font.regular,
            fontSize: 14,
            color: C.textMuted,
            marginTop: 8,
            textAlign: 'center',
            lineHeight: 20,
          }}
        >
          Edit ekranından "Markete koy" ile yayınla, sonra burada fiyat belirle.
        </Text>
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
          title: 'Markette',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {listing && (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/more/market/listing/${listing.id}?preview=1` as any);
                  }}
                  hitSlop={12}
                >
                  <SymbolView name="eye" tintColor={C.textMuted} size={20} />
                </Pressable>
              )}
              <Pressable onPress={onSave} disabled={saving} hitSlop={12}>
                {saving ? (
                  <ActivityIndicator color={C.accent} />
                ) : (
                  <Text style={{ fontFamily: font.semibold, fontSize: 16, color: C.accent }}>
                    {listing ? 'Güncelle' : 'Yayınla'}
                  </Text>
                )}
              </Pressable>
            </View>
          ),
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: C.page }}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Hero */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            backgroundColor: C.card,
            borderRadius: 16,
            padding: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: C.well,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SymbolView name="person.fill" tintColor={C.textMuted} size={26} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: font.bold, fontSize: 18, color: C.text }}>
              {character.name}
            </Text>
            <Text
              style={{ fontFamily: font.regular, fontSize: 13, color: C.textMuted, marginTop: 2 }}
            >
              {character.age} · DNA {character.dnaScore ?? '—'}
            </Text>
          </View>
        </View>

        {priceSuggestion && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              padding: 14,
              backgroundColor: C.accentSofter,
              borderRadius: 14,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: C.borderStrong,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <SymbolView name="sparkles" tintColor={C.accent} size={14} />
              <Text style={{ fontFamily: font.bold, fontSize: 13, color: C.accent }}>
                AI ÖNERİSİ
              </Text>
            </View>
            <Text style={{ fontFamily: font.regular, fontSize: 13, color: C.text, lineHeight: 19 }}>
              7 gün:{' '}
              <Text style={{ fontFamily: font.semibold }}>
                {priceSuggestion.rent7d.min}–{priceSuggestion.rent7d.max} cr
              </Text>{' '}
              · 30 gün:{' '}
              <Text style={{ fontFamily: font.semibold }}>
                {priceSuggestion.rent30d.min}–{priceSuggestion.rent30d.max} cr
              </Text>{' '}
              · Satış:{' '}
              <Text style={{ fontFamily: font.semibold }}>
                {priceSuggestion.buy.min}–{priceSuggestion.buy.max} cr
              </Text>
            </Text>
            <Text
              style={{ fontFamily: font.regular, fontSize: 11, color: C.textMuted, marginTop: 6 }}
            >
              {priceSuggestion.reasoning}
            </Text>
          </View>
        )}

        {/* Kira */}
        <Section title="Kira">
          <ToggleRow
            label="Kiralanabilir"
            sublabel="Kullanıcılar belirli süre için kiralayabilir"
            value={rentEnabled}
            onChange={setRentEnabled}
          />
          {rentEnabled && (
            <View style={{ gap: 10, marginTop: 12 }}>
              <PriceInput label="14 gün" value={rent14d} onChange={setRent14d} suggested={50} />
              <PriceInput label="30 gün" value={rent30d} onChange={setRent30d} suggested={90} />
              <Text
                style={{
                  fontFamily: font.regular,
                  fontSize: 11,
                  color: C.textMuted,
                  marginTop: 2,
                  paddingHorizontal: 4,
                }}
              >
                Minimum 14 gün — kısa kiralar karakter bağı kurmadan biter.
              </Text>
            </View>
          )}
        </Section>

        {/* Satın alma */}
        <Section title="Satın Alma" subtitle="Karakter kalıcı olarak yeni sahibe geçer">
          <ToggleRow
            label="Satın alınabilir"
            sublabel="Karakter outright olarak satılır, sahip değişir"
            value={buyEnabled}
            onChange={setBuyEnabled}
          />
          {buyEnabled && (
            <View style={{ marginTop: 12 }}>
              <PriceInput
                label="Satış fiyatı"
                value={buyPrice}
                onChange={setBuyPrice}
                suggested={500}
                max={50000}
              />
            </View>
          )}
        </Section>

        {/* Eşzamanlı limit */}
        <Section title="Eşzamanlı Kira" subtitle="Aynı anda kaç kullanıcı kiralayabilir">
          <PriceInput
            label="Limit"
            value={concurrentLimit}
            onChange={setConcurrentLimit}
            suggested={1}
            max={100}
            unit="kişi"
          />
          <Text
            style={{
              fontFamily: font.regular,
              fontSize: 12,
              color: C.textMuted,
              marginTop: 8,
              lineHeight: 18,
            }}
          >
            Düşük limit (1-3): "Limited edition" hissi, fiyat yüksek tutulabilir.{'\n'}
            Yüksek limit (10+): popüler karakter, hacim odaklı.
          </Text>
        </Section>

        {/* V4.8 #13 — VIP Early Access (sadece ilk yayın) */}
        {!listing && (
          <Section
            title="VIP Erken Erişim"
            subtitle="İlk 48 saat sadece takipçilerin görür, sonra herkese açılır"
          >
            <ToggleRow
              label="48 saat takipçilere özel"
              sublabel="Takipçilerini özel hisset­tirir, takip etmeyi değerli yapar"
              value={vipEarlyAccess}
              onChange={setVipEarlyAccess}
            />
            {vipEarlyAccess && (
              <View
                style={{
                  marginTop: 12,
                  padding: 12,
                  backgroundColor: '#FFF7E0',
                  borderRadius: 10,
                  flexDirection: 'row',
                  gap: 8,
                  alignItems: 'flex-start',
                }}
              >
                <SymbolView name="crown.fill" tintColor="#B8860B" size={14} />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: font.regular,
                    fontSize: 12,
                    color: '#5C4400',
                    lineHeight: 18,
                  }}
                >
                  Yayınladıktan 48 saat sonra otomatik olarak herkese açılır.
                </Text>
              </View>
            )}
          </Section>
        )}

        {/* Komisyon bilgisi */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 24,
            padding: 14,
            backgroundColor: C.accentSofter,
            borderRadius: 12,
            flexDirection: 'row',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <SymbolView name="info.circle" tintColor={C.accent} size={16} />
          <Text
            style={{
              flex: 1,
              fontFamily: font.regular,
              fontSize: 13,
              color: C.text,
              lineHeight: 19,
            }}
          >
            FitAI %30 komisyon kesiyor, %70 sana kalır. Test fazında credit'ler in-app harcanır.
          </Text>
        </View>

        {/* Pasifleştir */}
        {listing && (
          <View style={{ marginHorizontal: 16, marginTop: 24 }}>
            <Pressable onPress={onPause}>
              {({ pressed }) => (
                <View
                  style={{
                    backgroundColor: C.dangerBg,
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                    minHeight: 48,
                    opacity: pressed ? 0.85 : 1,
                  }}
                >
                  <Text style={{ fontFamily: font.semibold, fontSize: 15, color: C.danger }}>
                    Listing'i Duraklat
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
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
    <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
      <Text style={{ fontFamily: font.semibold, fontSize: 17, color: C.text }}>{title}</Text>
      {subtitle && (
        <Text style={{ fontFamily: font.regular, fontSize: 13, color: C.textMuted, marginTop: 2 }}>
          {subtitle}
        </Text>
      )}
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  );
}

function ToggleRow({
  label,
  sublabel,
  value,
  onChange,
}: {
  label: string;
  sublabel?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.card,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        minHeight: 52,
      }}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontFamily: font.semibold, fontSize: 15, color: C.text }}>{label}</Text>
        {sublabel && (
          <Text
            style={{ fontFamily: font.regular, fontSize: 12, color: C.textMuted, marginTop: 2 }}
          >
            {sublabel}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          Haptics.selectionAsync();
          onChange(v);
        }}
        trackColor={{ true: C.accent, false: C.well }}
      />
    </View>
  );
}

function PriceInput({
  label,
  value,
  onChange,
  suggested,
  max = 5000,
  unit = 'credit',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suggested?: number;
  max?: number;
  unit?: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.card,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        minHeight: 52,
      }}
    >
      <Text style={{ fontFamily: font.medium, fontSize: 15, color: C.text, flex: 1 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        placeholder={suggested?.toString() ?? '0'}
        placeholderTextColor={C.textDim}
        style={{
          fontFamily: font.semibold,
          fontSize: 17,
          color: C.text,
          textAlign: 'right',
          minWidth: 60,
        }}
        maxLength={5}
      />
      <Text style={{ fontFamily: font.regular, fontSize: 13, color: C.textMuted, marginLeft: 6 }}>
        {unit}
      </Text>
    </View>
  );
}
